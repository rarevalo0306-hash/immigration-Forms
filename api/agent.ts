import Anthropic from '@anthropic-ai/sdk';
import { cors, json } from './_lib.js';

/**
 * The AI assistant that fills a form by conversation (Vercel Function: /api/agent).
 *
 * Stateless: the app sends the whole conversation each turn and gets back Claude's next message.
 * The form, the answers and the checks stay on the device (src/agent/): Claude only proposes
 * answers through the `answer_question` tool, and the app validates and saves them. Nothing is
 * stored or logged here. The system prompt and tools are fixed on this side, so the endpoint can't
 * be used as a general chatbot.
 *
 * Needs ANTHROPIC_API_KEY in the Vercel project's environment variables. AGENT_ENABLED=false turns
 * the assistant off without a deploy.
 */

const MODEL = 'claude-sonnet-5-5';
const MAX_MESSAGES = 160;
const MAX_BODY = 300_000;

const SYSTEM = `You are Camino's form assistant. You help Spanish-speaking immigrants in the United States fill in one official immigration form (USCIS or EOIR) by conversation, on a phone.

How you work:
- The app gives you the current question of the form as JSON (in the first message and in every answer_question result). Ask about it in plain, warm, short sentences, like a patient friend. One thing at a time. No jargon; if the form uses a legal term, explain it in a few words.
- Speak the person's language: Spanish (use "usted") unless they write in English.
- When the person answers, call answer_question with the values. If a question has several fields, you may ask for them together when it is natural (first and last name, a full address).
- Write values exactly as the "format" says: dates as MM/DD/YYYY, US states as 2 letters. Free text the form needs in English: translate the person's words faithfully into simple English and tell them what you wrote. Names and places: as the person spells them, without accents only if they say so.
- For choice questions use the option "value", not the label. For yes/no lists answer each item "yes" or "no".
- If answer_question returns errors, explain the problem simply and ask again. Never guess or invent an answer; if the person doesn't know, help them figure out where to find it (a passport, a notice from USCIS), or say they can leave optional fields empty.
- Fields marked "manual" (Social Security, A-Number, USCIS online account number) are typed by the person in a box on screen. Never ask for them in the chat and never repeat them. Tell the person to type them in the box, then call answer_question with the other fields (or with an empty list) once they say they did.
- Before moving on from a long question, briefly confirm what you are filling in.
- When the result says the form reached its review page, tell the person they finished and can review the answers and download the form.

Limits:
- You are not a lawyer and you don't give legal advice: don't say whether someone qualifies, which option is better for their case, or what will happen. Explain what the question means and what the form asks. If the person describes a risky situation (arrests, deportation orders, entering without inspection, a past immigration fraud, a "yes" in the criminal or security questions), tell them kindly to talk to an immigration attorney or a DOJ-accredited representative before filing, and keep filling in only what they decide to answer.
- Only help with this form and immigration paperwork. Politely decline anything else.
- Never ask for passwords, payment details or documents to be uploaded.`;

const TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: 'answer_question',
    description:
      'Fill in the current question of the form with what the person said. The app validates the values: on success it saves them and returns the next question (or says the form reached its review page); otherwise it returns an error per field. Only ids of the current question are accepted, and never "manual" fields.',
    input_schema: {
      type: 'object',
      properties: {
        answers: {
          type: 'array',
          description: 'One entry per field, choice or yes/no item being answered.',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'The field id, the item id, or for a choice question the question id.' },
              value: {
                description: 'The value: text in the field format, an option value, "yes"/"no", or a list of option values for multiple choice.',
                anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
              },
            },
            required: ['id', 'value'],
          },
        },
      },
      required: ['answers'],
    },
  },
  {
    name: 'go_back',
    description: 'Go back to the previous question of the form, to correct an earlier answer. Returns that question with its current values.',
    input_schema: { type: 'object', properties: {} },
  },
];

const enabled = () => !!process.env.ANTHROPIC_API_KEY && process.env.AGENT_ENABLED !== 'false';

// Best effort, per running instance: a few requests a minute per address is plenty for a person
// chatting. The Vercel Firewall rate-limit rule is the real guard (see README).
const hits = new Map<string, number[]>();
function tooMany(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 20;
}

/** Only the block types a conversation with these tools produces; anything else is refused. */
const BLOCKS = new Set(['text', 'tool_use', 'tool_result', 'thinking', 'redacted_thinking', 'fallback']);
function validMessages(m: unknown): m is Anthropic.Beta.BetaMessageParam[] {
  if (!Array.isArray(m) || m.length === 0 || m.length > MAX_MESSAGES) return false;
  return m.every(
    (msg, i) =>
      msg &&
      (msg.role === 'user' || msg.role === 'assistant') &&
      (i > 0 || msg.role === 'user') &&
      (typeof msg.content === 'string' || (Array.isArray(msg.content) && msg.content.every((b: { type?: string }) => b && BLOCKS.has(b.type ?? '')))),
  );
}

export function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: cors(request.headers.get('origin')) });
}

/** Whether the assistant is available, so the app shows it only when it works. */
export function GET(request: Request) {
  return json({ enabled: enabled() }, 200, cors(request.headers.get('origin')));
}

export async function POST(request: Request) {
  const headers = cors(request.headers.get('origin'));
  if (!enabled()) return json({ error: 'disabled' }, 503, headers);
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (tooMany(ip)) return json({ error: 'rate_limited' }, 429, headers);

  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ error: 'too_long' }, 413, headers);
  let messages: unknown;
  try {
    messages = (JSON.parse(raw) as { messages?: unknown }).messages;
  } catch {
    return json({ error: 'bad_request' }, 400, headers);
  }
  if (!validMessages(messages)) return json({ error: 'bad_request' }, 400, headers);

  const client = new Anthropic();
  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4096,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium' },
      cache_control: { type: 'ephemeral' },
      system: SYSTEM,
      tools: TOOLS,
      messages,
    });
    if (response.stop_reason === 'refusal') return json({ refusal: true }, 200, headers);
    return json({ content: response.content, stop_reason: response.stop_reason }, 200, headers);
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return json({ error: 'busy' }, 503, headers);
    if (error instanceof Anthropic.BadRequestError) return json({ error: 'bad_request' }, 400, headers);
    if (error instanceof Anthropic.APIError) return json({ error: 'upstream' }, 502, headers);
    return json({ error: 'upstream' }, 502, headers);
  }
}
