import { useEffect, useRef, useState } from 'react';
import { ArrowRightIcon, ArrowUpIcon, SparkIcon } from '../design/icons';
import type { Lang, T } from '../i18n';
import { catalog, metaById } from '../forms/catalog';
import { packageById, stepsOf } from '../forms/packages';
import { recommend, type Recommendation, type Target } from '../engine/recommend';
import { packageHref } from './Package';

/** Example situations, as the person might say them. Each one starts a search. */
export const SUGGESTIONS: T[] = [
  { es: 'Me casé con un ciudadano', en: 'I married a U.S. citizen' },
  { es: 'Perdí mi green card', en: 'I lost my green card' },
  { es: 'Quiero hacerme ciudadano', en: 'I want to become a citizen' },
  { es: 'Permiso de trabajo', en: 'Work permit' },
  { es: 'Me mudé de casa', en: 'I moved' },
  { es: 'Renovar DACA', en: 'Renew DACA' },
];

export const searchHref = (q: string) => `#buscar?q=${encodeURIComponent(q)}`;

/** The text box to describe a situation or type a form number. Enter sends; Shift+Enter adds a line. */
export function Composer({ lang, onSend, big, initial = '', autoFocus }: { lang: Lang; onSend: (q: string) => void; big?: boolean; initial?: string; autoFocus?: boolean }) {
  const [text, setText] = useState(initial);
  const send = () => {
    const q = text.trim();
    if (!q) return;
    onSend(q);
    if (!big) setText('');
  };
  const label = lang === 'es' ? 'Cuénteme su situación o escriba el número del formulario' : 'Describe your situation or type the form number';
  return (
    <form
      className={`app-composer cm-glass${big ? ' app-composer--big' : ''}`}
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
    >
      <textarea
        className="app-composer-input"
        aria-label={label}
        placeholder={big ? (lang === 'es' ? 'Ej.: «me casé con un ciudadano y quiero la residencia»' : 'E.g. "I married a citizen and want a green card"') : label}
        rows={big ? 2 : 1}
        value={text}
        enterKeyHint="send"
        autoFocus={autoFocus}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            send();
          }
        }}
      />
      <button className="app-composer-send" type="submit" disabled={!text.trim()} aria-label={lang === 'es' ? 'Enviar' : 'Send'}>
        <ArrowUpIcon />
      </button>
    </form>
  );
}

/** What a recommendation points to, ready to show: its title, the forms it involves and its link. */
function describe(target: Target, lang: Lang): { title: string; chips: string[]; href: string; kind: string } | null {
  if (target.kind === 'study') {
    return {
      title: lang === 'es' ? 'Estudiar para el examen de ciudadanía' : 'Study for the citizenship test',
      chips: [lang === 'es' ? 'Tarjetas' : 'Flash cards', lang === 'es' ? 'Simulacro de entrevista' : 'Practice interview'],
      href: '#estudiar',
      kind: lang === 'es' ? 'Estudiar' : 'Study',
    };
  }
  if (target.kind === 'package') {
    const pkg = packageById(target.id);
    if (!pkg) return null;
    const numbers = [...new Set(stepsOf(pkg).filter((s) => !s.optional).map((s) => metaById(s.formId)?.number).filter((n): n is string => !!n))];
    return { title: pkg.title[lang], chips: numbers, href: packageHref(pkg), kind: lang === 'es' ? 'Paquete de formularios' : 'Package of forms' };
  }
  const f = metaById(target.id);
  if (!f) return null;
  return {
    title: f.title[lang],
    chips: [f.number, lang === 'es' ? `Unos ${f.minutes} min` : `About ${f.minutes} min`],
    href: `#${f.id}`,
    kind: lang === 'es' ? 'Formulario' : 'Form',
  };
}

function BestCard({ rec, lang }: { rec: Recommendation; lang: Lang }) {
  const d = describe(rec.target, lang);
  if (!d) return null;
  return (
    <div className="app-reco cm-glass">
      <div className="app-reco-top">
        <span className="app-reco-icon" aria-hidden="true">
          <SparkIcon />
        </span>
        <div>
          <span className="app-reco-kind">{d.kind}</span>
          <h2 className="app-reco-title">{d.title}</h2>
        </div>
      </div>
      <p className="app-reco-why">{rec.reason[lang]}</p>
      <ul className="app-reco-chips" aria-label={lang === 'es' ? 'Incluye' : 'Includes'}>
        {d.chips.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <a className="cm-btn cm-btn--primary cm-btn--block" href={d.href}>
        {lang === 'es' ? 'Empezar' : 'Start'} <ArrowRightIcon />
      </a>
    </div>
  );
}

function Reply({ q, lang }: { q: string; lang: Lang }) {
  const { best, more } = recommend(q, catalog);
  if (!best) {
    return (
      <div className="app-bubble app-bubble--bot">
        <p>
          {lang === 'es'
            ? 'No encontré un trámite para eso. Pruebe con otras palabras (por ejemplo, «permiso de trabajo» o «I-765»), o vea '
            : 'I couldn’t find a case for that. Try other words (for example "work permit" or "I-765"), or see '}
          <a href="#tramites">{lang === 'es' ? 'todos los trámites' : 'every case'}</a>.
        </p>
      </div>
    );
  }
  return (
    <div className="app-reply">
      <div className="app-bubble app-bubble--bot">
        <p>{lang === 'es' ? 'Esto es lo que le recomiendo:' : 'Here is what I recommend:'}</p>
      </div>
      <BestCard rec={best} lang={lang} />
      {more.length > 0 && (
        <div className="app-reco-more">
          <h2 className="app-reco-more-h">{lang === 'es' ? 'También puede servirle' : 'This may also help'}</h2>
          <ul className="app-link-list">
            {more.map((r) => {
              const d = describe(r.target, lang);
              return (
                d && (
                  <li key={d.href}>
                    <a className="app-link-row cm-glass" href={d.href}>
                      <span className="app-link-text">
                        <strong>{d.title}</strong>
                        <span>{d.chips.join(' · ')}</span>
                      </span>
                      <ArrowRightIcon />
                    </a>
                  </li>
                )
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * The assistant: the person says what they need in their own words and Camino recommends the
 * package or form for it. It runs on the device (engine/recommend.ts): nothing is sent anywhere.
 */
export function Assistant({ lang, initial }: { lang: Lang; initial: string }) {
  const [turns, setTurns] = useState<string[]>(() => (initial ? [initial] : []));
  const end = useRef<HTMLDivElement>(null);
  const ask = (q: string) => {
    setTurns((t) => [...t, q]);
    history.replaceState(null, '', searchHref(q));
  };
  useEffect(() => {
    if (turns.length > (initial ? 1 : 0)) end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns.length, initial]);

  return (
    <div className="app-assistant">
      <h1 className="app-title">{lang === 'es' ? 'Asistente' : 'Assistant'}</h1>
      <div className="app-chat" role="log" aria-label={lang === 'es' ? 'Conversación' : 'Conversation'}>
        <div className="app-bubble app-bubble--bot">
          <p>
            {lang === 'es'
              ? 'Cuénteme con sus palabras qué necesita y le digo qué formularios llenar. También puede escribir el número del formulario.'
              : 'Tell me in your own words what you need and I’ll tell you which forms to fill in. You can also type the form number.'}
          </p>
          <p className="app-bubble-note">
            {lang === 'es'
              ? 'Es una guía para empezar, no asesoría legal. Lo que escribe no sale de su teléfono.'
              : 'It’s a guide to get started, not legal advice. What you type never leaves your phone.'}
          </p>
        </div>
        {turns.length === 0 && (
          <ul className="app-chips" aria-label={lang === 'es' ? 'Ejemplos' : 'Examples'}>
            {SUGGESTIONS.map((s) => (
              <li key={s.es}>
                <button type="button" className="app-chip cm-glass" onClick={() => ask(s[lang])}>
                  {s[lang]}
                </button>
              </li>
            ))}
          </ul>
        )}
        {turns.map((q, i) => (
          <div key={i} className="app-turn">
            <div className="app-bubble app-bubble--me">
              <p>{q}</p>
            </div>
            <Reply q={q} lang={lang} />
          </div>
        ))}
        <div ref={end} />
      </div>
      <div className="app-composer-dock">
        <Composer lang={lang} onSend={ask} autoFocus={!initial} />
      </div>
    </div>
  );
}
