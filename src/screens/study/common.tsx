import { useEffect, useRef, type ReactNode } from 'react';
import type { Lang } from '../../i18n';
import { canSpeak, speak, type Voice } from '../../study/speech';
import type { ShownAnswers } from '../../study/engine';
import { LOOKUP } from '../../study/current';
import type { CivicsQuestion } from '../../study/types';

export const pick = (lang: Lang) => (es: string, en: string) => (lang === 'es' ? es : en);

/** The screen's main heading; it takes focus when the screen changes so screen readers announce it. */
export function ScreenTitle({ children, eyebrow }: { children: ReactNode; eyebrow?: ReactNode }) {
  const h = useRef<HTMLHeadingElement>(null);
  useEffect(() => h.current?.focus({ preventScroll: true }), []);
  return (
    <div className="app-home-intro">
      {eyebrow && <p className="cm-card-eyebrow">{eyebrow}</p>}
      <h1 className="app-title" ref={h} tabIndex={-1}>
        {children}
      </h1>
    </div>
  );
}

export function BackToStudy({ lang }: { lang: Lang }) {
  return (
    <a className="app-back-link no-print" href="#estudiar">
      {lang === 'es' ? '← Estudiar para la ciudadanía' : '← Study for citizenship'}
    </a>
  );
}

/** "Escuchar": reads the text aloud. Hidden when the browser has no voices. */
export function Listen({ text, voice = 'en-US', lang, label }: { text: string; voice?: Voice; lang: Lang; label?: string }) {
  if (!canSpeak()) return null;
  return (
    <button type="button" className="cm-btn cm-btn--secondary app-listen" onClick={() => speak(text, voice)}>
      <span aria-hidden="true">🔊</span> {label ?? (lang === 'es' ? 'Escuchar' : 'Listen')}
    </button>
  );
}

/** A question's answers: the official English (what the officer expects) with the Spanish below. */
export function Answers({ q, shown, lang, state, spanishFirst }: { q: CivicsQuestion; shown: ShownAnswers; lang: Lang; state: string; spanishFirst?: boolean }) {
  const t = pick(lang);
  const lookup = shown.lookup ? LOOKUP[shown.lookup] : undefined;
  return (
    <div className="app-study-answers">
      <p className="app-study-answers-h">
        {q.count && q.count > 1
          ? t(`Respuestas (diga ${q.count})`, `Answers (give ${q.count})`)
          : shown.en.length > 1
            ? t('Respuestas (basta con una)', 'Answers (one is enough)')
            : t('Respuesta', 'Answer')}
      </p>
      <ul className="app-study-answer-list">
        {shown.en.map((en, i) => {
          const es = shown.es[i] ?? en;
          const [main, other] = spanishFirst ? [es, en] : [en, es];
          return (
            <li key={i}>
              <span className="app-study-answer" lang={spanishFirst ? 'es' : 'en'}>
                {main}
              </span>
              {other !== main && (
                <span className="app-study-answer-tr" lang={spanishFirst ? 'en' : 'es'}>
                  {other}
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {shown.note && <p className="app-form-meta">{shown.note[lang]}</p>}
      {lookup && (
        <a className="app-filing-link" href={lookup.url(state)} target="_blank" rel="noreferrer">
          {lookup.label[lang]}
        </a>
      )}
    </div>
  );
}

/** A plain progress bar with its numbers for screen readers. */
export function Bar({ value, max, label }: { value: number; max: number; label: string }) {
  return (
    <div className="app-study-bar" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label}>
      <span style={{ width: `${max ? Math.round((value / max) * 100) : 0}%` }} />
    </div>
  );
}
