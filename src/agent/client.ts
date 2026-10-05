import type { BetaContentBlock, BetaMessageParam } from '@anthropic-ai/sdk/resources/beta/messages/messages';
import { apiUrl } from '../api';

const endpoint = () => apiUrl('agent');

let available: Promise<boolean> | null = null;

/** Whether the assistant is set up on the server (and the device is online). Asked once per visit. */
export function agentAvailable(): Promise<boolean> {
  available ??= fetch(endpoint(), { method: 'GET' })
    .then((r) => (r.ok ? r.json() : { enabled: false }))
    .then((b: { enabled?: boolean }) => b.enabled === true)
    .catch(() => false);
  return available;
}

const CONSENT_KEY = 'camino:ai-consent:v1';

/** The person agreed to send what they write in the chat to the AI service. */
export const hasConsent = () => {
  try {
    return !!localStorage.getItem(CONSENT_KEY);
  } catch {
    return false;
  }
};

export const giveConsent = () => {
  try {
    localStorage.setItem(CONSENT_KEY, new Date().toISOString());
  } catch {
    /* private mode: they will be asked again next time */
  }
};

export const withdrawConsent = () => {
  try {
    localStorage.removeItem(CONSENT_KEY);
  } catch {
    /* nothing saved */
  }
};

export type AgentReply =
  | { kind: 'message'; content: BetaContentBlock[]; stop: string | null }
  | { kind: 'refusal' }
  | { kind: 'error'; reason: 'offline' | 'busy' | 'rate_limited' | 'failed' };

/** One turn: the whole conversation goes up, Claude's next message comes back. */
export async function askAgent(messages: BetaMessageParam[], signal?: AbortSignal): Promise<AgentReply> {
  let res: Response;
  try {
    res = await fetch(endpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
      signal,
    });
  } catch {
    return { kind: 'error', reason: 'offline' };
  }
  if (res.status === 429) return { kind: 'error', reason: 'rate_limited' };
  if (res.status === 503) return { kind: 'error', reason: 'busy' };
  if (!res.ok) return { kind: 'error', reason: 'failed' };
  const body = (await res.json()) as { content?: BetaContentBlock[]; stop_reason?: string | null; refusal?: boolean };
  if (body.refusal) return { kind: 'refusal' };
  if (!Array.isArray(body.content)) return { kind: 'error', reason: 'failed' };
  return { kind: 'message', content: body.content, stop: body.stop_reason ?? null };
}
