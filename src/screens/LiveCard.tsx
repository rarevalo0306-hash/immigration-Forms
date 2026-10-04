import { CheckIcon } from '../design/icons';
import { fmt, ui, type Lang } from '../i18n';
import type { Answers } from '../forms/types';
import type { Screen } from '../engine/flow';

/** Field types safe to show back on screen; ID numbers and contact details stay out of sight. */
const SHOWN = new Set(['text', 'date', 'pastDate', 'futureDate', 'select']);

/** What one answered screen filled in, in a few words: "Rosa Hernández", "14/03/1990", "Casado/a". */
export function filledText(screen: Screen, answers: Answers, lang: Lang): string {
  const q = screen.question;
  if (q.kind === 'choice') {
    const v = answers[q.id];
    // A bare "Sí" or "No" means nothing without its question.
    if (typeof v !== 'string' || v === 'yes' || v === 'no') return '';
    return q.options.find((o) => o.value === v)?.label[lang] ?? '';
  }
  if (q.kind !== 'fields') return '';
  return q.fields
    .filter((f) => SHOWN.has(f.type))
    .map((f) => {
      const v = answers[f.id];
      if (typeof v !== 'string' || !v.trim()) return '';
      return f.type === 'select' ? (f.options?.find((o) => o.value === v)?.label[lang] ?? v) : v.trim();
    })
    .filter(Boolean)
    .join(' ');
}

/**
 * Above each question: a ring with how far along the form is, and the last few things already
 * filled in, so the person sees the form filling up as they answer.
 */
export function LiveCard({ screens, pos, answers, lang }: { screens: Screen[]; pos: number; answers: Answers; lang: Lang }) {
  const total = screens.length;
  const share = total ? (pos + 1) / total : 0;
  const filled = screens
    .slice(0, pos)
    .map((s) => filledText(s, answers, lang))
    .filter(Boolean)
    .slice(-3);
  const r = 24;
  const c = 2 * Math.PI * r;
  return (
    <div className="app-live cm-glass">
      <div className="app-ring" role="img" aria-label={fmt(ui.questionOf[lang], { c: pos + 1, t: total })}>
        <svg viewBox="0 0 56 56">
          <defs>
            <linearGradient id="ring-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#1f6b64" />
              <stop offset="1" stopColor="#e0a526" />
            </linearGradient>
          </defs>
          <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(23,74,71,0.12)" strokeWidth="6" />
          <circle cx="28" cy="28" r={r} fill="none" stroke="url(#ring-g)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${c * share} ${c}`} />
        </svg>
        <span className="app-ring-n" aria-hidden="true">
          {pos + 1}/{total}
        </span>
      </div>
      <div className="app-live-body">
        <span className="app-live-title">{screens[pos]?.section.title[lang]}</span>
        {filled.length > 0 && (
          <ul className="app-live-chips" aria-label={ui.filledSoFar[lang]}>
            {filled.map((t, i) => (
              <li key={i}>
                <CheckIcon />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
