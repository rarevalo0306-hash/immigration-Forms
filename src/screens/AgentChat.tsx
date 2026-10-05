import { useEffect, useRef, useState } from 'react';
import type { BetaContentBlockParam, BetaMessageParam, BetaToolResultBlockParam, BetaToolUseBlock } from '@anthropic-ai/sdk/resources/beta/messages/messages';
import { Button, Notice, TextField } from '../design/components';
import { SparkIcon } from '../design/icons';
import type { Lang } from '../i18n';
import type { Answers, FormDefinition } from '../forms/types';
import { visibleScreens } from '../engine/flow';
import { applyAnswers, manualFields, maskNumbers, questionSpec } from '../agent/spec';
import { askAgent, giveConsent, hasConsent } from '../agent/client';
import { Composer } from './Assistant';

interface Props {
  form: FormDefinition;
  answers: Answers;
  pos: number;
  lang: Lang;
  /** A field typed by hand (the ID numbers the assistant never sees). */
  onChange: (id: string, value: string) => void;
  /** Answers the assistant filled in and checked, and where the form goes next. */
  onCommit: (answers: Answers, position: number) => void;
  onExit: () => void;
}

interface Line {
  who: 'me' | 'bot' | 'note';
  text: string;
}

/** The longest conversation kept going; past it the person carries on by hand. */
const MAX_MESSAGES = 150;

const t = (lang: Lang, es: string, en: string) => (lang === 'es' ? es : en);

/**
 * Filling a form by conversation: the assistant asks, the person answers in their own words, and
 * each answer lands in the form (and in the live card above) once the app has checked it.
 */
export function AgentChat({ form, answers, pos, lang, onChange, onCommit, onExit }: Props) {
  const [consented, setConsented] = useState(hasConsent);
  const [lines, setLines] = useState<Line[]>([]);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const messages = useRef<BetaMessageParam[]>([]);
  // The loop below runs across awaits, so it reads the latest answers and position from refs.
  const state = useRef({ answers, pos });
  state.current = { answers, pos };
  const end = useRef<HTMLDivElement>(null);

  const screens = visibleScreens(form, answers);
  const screen = screens[pos];
  const manual = screen ? manualFields(screen) : [];

  const spec = (a: Answers, p: number) => {
    const s = visibleScreens(form, a);
    return p < s.length ? questionSpec(s[p], p, s.length, a, lang) : null;
  };

  const runTool = (tool: BetaToolUseBlock): BetaToolResultBlockParam => {
    const reply = (content: unknown, isError = false): BetaToolResultBlockParam => ({
      type: 'tool_result',
      tool_use_id: tool.id,
      content: JSON.stringify(content),
      ...(isError ? { is_error: true } : {}),
    });
    const { answers: a, pos: p } = state.current;
    if (tool.name === 'answer_question') {
      const proposed = (tool.input as { answers?: { id: string; value: string | string[] }[] }).answers;
      if (!Array.isArray(proposed)) return reply({ error: 'answers must be a list' }, true);
      const r = applyAnswers(form, a, p, proposed, lang);
      if (!r.ok) return reply({ ok: false, errors: r.errors });
      state.current = { answers: r.answers, pos: r.position };
      onCommit(r.answers, r.position);
      const next = spec(r.answers, r.position);
      return reply(next ? { ok: true, next } : { ok: true, done: 'The form reached its review page.' });
    }
    if (tool.name === 'go_back') {
      const back = Math.max(0, p - 1);
      state.current = { answers: a, pos: back };
      onCommit(a, back);
      return reply({ ok: true, question: spec(a, back) });
    }
    return reply({ error: `Unknown tool ${tool.name}` }, true);
  };

  const run = async () => {
    setBusy(true);
    setFailed(null);
    for (let turn = 0; turn < 8; turn++) {
      const reply = await askAgent(messages.current);
      if (reply.kind === 'error') {
        setFailed(
          reply.reason === 'offline'
            ? t(lang, 'No hay conexión. Revise su internet e intente otra vez.', 'No connection. Check your internet and try again.')
            : reply.reason === 'rate_limited'
              ? t(lang, 'Muchos mensajes seguidos. Espere un minuto e intente otra vez.', 'Too many messages in a row. Wait a minute and try again.')
              : t(lang, 'El asistente no respondió. Intente otra vez, o siga llenando usted mismo.', 'The assistant didn’t answer. Try again, or keep filling in by yourself.'),
        );
        break;
      }
      if (reply.kind === 'refusal') {
        setLines((l) => [...l, { who: 'bot', text: t(lang, 'No puedo ayudar con eso. Puede seguir con el formulario.', 'I can’t help with that. You can keep going with the form.') }]);
        break;
      }
      messages.current = [...messages.current, { role: 'assistant', content: reply.content as BetaContentBlockParam[] }];
      const said = reply.content.flatMap((b) => (b.type === 'text' && b.text.trim() ? [b.text.trim()] : []));
      if (said.length) setLines((l) => [...l, ...said.map((text) => ({ who: 'bot' as const, text }))]);
      const tools = reply.content.filter((b): b is BetaToolUseBlock => b.type === 'tool_use');
      if (reply.stop !== 'tool_use' || !tools.length) break;
      messages.current = [...messages.current, { role: 'user', content: tools.map(runTool) }];
    }
    setBusy(false);
  };

  const send = (text: string) => {
    if (busy) return;
    if (messages.current.length > MAX_MESSAGES) {
      setFailed(t(lang, 'Esta conversación ya es muy larga. Siga llenando usted mismo o empiece una nueva.', 'This conversation is very long. Keep filling in by yourself or start a new one.'));
      return;
    }
    // What is shown is what is sent, so the person sees an ID number was held back.
    const masked = maskNumbers(text);
    setLines((l) => [...l, { who: 'me', text: masked }]);
    messages.current = [...messages.current, { role: 'user', content: [{ type: 'text', text: masked }] }];
    void run();
  };

  // The first message tells the assistant which form and question it is on.
  useEffect(() => {
    if (!consented || messages.current.length) return;
    const { answers: a, pos: p } = state.current;
    messages.current = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `[Message from the app, not from the person] Form ${form.number}: ${form.title.en} (${form.title.es}). The person's language: ${lang === 'es' ? 'Spanish' : 'English'}. Current question:\n${JSON.stringify(spec(a, p))}\nGreet them in one short sentence and ask this question.`,
          },
        ],
      },
    ];
    void run();
    // Runs once, when the person agrees; later turns start from send().
  }, [consented]);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [lines.length, busy]);

  if (!consented) {
    return (
      <section className="cm-card app-agent-consent" aria-labelledby="ai-h">
        <span className="app-reco-icon" aria-hidden="true">
          <SparkIcon />
        </span>
        <h2 id="ai-h" className="app-review-h">{t(lang, 'Llenar conversando con el asistente', 'Fill in by chatting with the assistant')}</h2>
        <p className="cm-card-why">
          {t(
            lang,
            'El asistente le hace las preguntas en palabras sencillas y va llenando el formulario con lo que usted le cuente. Usa inteligencia artificial (Claude, de la empresa Anthropic).',
            'The assistant asks you the questions in plain words and fills in the form with what you tell it. It uses artificial intelligence (Claude, by Anthropic).',
          )}
        </p>
        <Notice tone="legal" title={t(lang, 'Antes de empezar', 'Before you start')}>
          <ul className="app-agent-terms">
            <li>{t(lang, 'Lo que escriba en el chat se envía a nuestro servidor y a Anthropic para contestarle. No lo guardamos; Anthropic no lo usa para entrenar su IA.', 'What you write in the chat is sent to our server and to Anthropic to answer you. We don’t keep it; Anthropic doesn’t use it to train its AI.')}</li>
            <li>{t(lang, 'Su Seguro Social, A-Number y número de cuenta de USCIS nunca se envían: esos los escribe usted en la casilla.', 'Your Social Security, A-Number and USCIS account number are never sent: you type those in the box.')}</li>
            <li>{t(lang, 'El asistente puede equivocarse. Revise cada respuesta antes de descargar el formulario. No es asesoría legal.', 'The assistant can make mistakes. Check every answer before you download the form. It is not legal advice.')}</li>
          </ul>
        </Notice>
        <div className="cm-card-actions">
          <Button variant="quiet" onClick={onExit}>{t(lang, 'Prefiero llenarlo yo', 'I’ll fill it in myself')}</Button>
          <Button
            onClick={() => {
              giveConsent();
              setConsented(true);
            }}
          >
            {t(lang, 'Acepto, empezar', 'I agree, start')}
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="app-agent" aria-label={t(lang, 'Asistente', 'Assistant')}>
      <div className="app-chat" role="log" aria-live="polite">
        {lines.map((line, i) => (
          <div key={i} className={`app-bubble app-bubble--${line.who === 'me' ? 'me' : 'bot'}`}>
            {line.text.split('\n\n').map((p, j) => (
              <p key={j}>{p}</p>
            ))}
          </div>
        ))}
        {busy && (
          <div className="app-bubble app-bubble--bot app-typing" role="status">
            <span className="app-sr">{t(lang, 'El asistente está escribiendo…', 'The assistant is typing…')}</span>
            <i aria-hidden="true" />
            <i aria-hidden="true" />
            <i aria-hidden="true" />
          </div>
        )}
        {failed && (
          <div className="app-agent-error" role="alert">
            <Notice tone="error">{failed}</Notice>
            <Button variant="secondary" onClick={() => void run()}>{t(lang, 'Intentar otra vez', 'Try again')}</Button>
          </div>
        )}
        <div ref={end} />
      </div>
      {manual.length > 0 && (
        <div className="cm-card app-agent-manual">
          <p className="cm-card-why">
            {t(lang, 'Escriba este número aquí. No se envía al asistente.', 'Type this number here. It is not sent to the assistant.')}
          </p>
          {manual.map((f) => (
            <TextField
              key={f.id}
              id={`m-${f.id}`}
              label={f.label[lang]}
              labelEn={f.formRef}
              hint={f.hint?.[lang]}
              value={String(answers[f.id] ?? '')}
              onChange={(e) => onChange(f.id, e.target.value)}
              inputMode="numeric"
              autoComplete="off"
            />
          ))}
        </div>
      )}
      <div className="app-composer-dock">
        <Composer lang={lang} onSend={send} label={t(lang, 'Su respuesta', 'Your answer')} placeholder={t(lang, 'Escriba su respuesta…', 'Type your answer…')} />
        <Button variant="quiet" onClick={onExit}>{t(lang, 'Prefiero llenar yo mismo', 'I’ll fill it in myself')}</Button>
      </div>
    </section>
  );
}
