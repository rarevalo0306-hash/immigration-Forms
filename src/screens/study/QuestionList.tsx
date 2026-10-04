import { useState } from 'react';
import { TextField } from '../../design/components';
import type { Lang } from '../../i18n';
import type { StudyState } from '../../study/state';
import type { CivicsTest } from '../../study/types';
import { answersFor, mayUseSpanish, pool } from '../../study/engine';
import { Answers, BackToStudy, Listen, ScreenTitle, pick } from './common';

const plain = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** The official list, grouped by section, with a search over both languages. */
export function QuestionList({ lang, test, state }: { lang: Lang; test: CivicsTest; state: StudyState }) {
  const t = pick(lang);
  const s = state.settings;
  const spanishFirst = mayUseSpanish(s);
  const [query, setQuery] = useState('');
  const words = plain(query).split(/\s+/).filter(Boolean);
  const qs = pool(test, s).filter((q) => {
    if (!words.length) return true;
    const shown = answersFor(q, s);
    const hay = plain([q.n, q.question.en, q.question.es, ...shown.en, ...shown.es].join(' '));
    return words.every((w) => hay.includes(w));
  });
  const sections = [...new Set(qs.map((q) => q.section.en))];

  return (
    <div className="app-home">
      <BackToStudy lang={lang} />
      <ScreenTitle>{s.exemption === '65-20' ? t('Las 20 preguntas para 65/20', 'The 20 questions for 65/20') : t(`Las ${test.questions.length} preguntas`, `The ${test.questions.length} questions`)}</ScreenTitle>
      <TextField
        label={t('Buscar', 'Search')}
        hint={t('Por número o por palabra, en español o en inglés', 'By number or word, in Spanish or English')}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
      />
      <p className="app-form-meta" role="status">
        {words.length ? t(`${qs.length} preguntas encontradas`, `${qs.length} questions found`) : ''}
      </p>
      {sections.map((sec) => {
        const items = qs.filter((q) => q.section.en === sec);
        return (
          <section key={sec} className="app-review-section" aria-label={items[0].section[lang]}>
            <h2 className="app-review-h">
              {items[0].part[lang]} · {items[0].section[lang]}
            </h2>
            {items.map((q) => (
              <details key={q.n} className="cm-card app-study-item">
                <summary>
                  <span className="app-study-n">{q.n}.</span> <span lang={spanishFirst ? 'es' : 'en'}>{spanishFirst ? q.question.es : q.question.en}</span>
                  {q.star && <span className="app-study-star"> · 65/20</span>}
                </summary>
                <p className="app-study-translation" lang={spanishFirst ? 'en' : 'es'}>
                  {spanishFirst ? q.question.en : q.question.es}
                </p>
                <Listen text={q.question.en} lang={lang} label={t('Escuchar en inglés', 'Listen in English')} />
                <Answers q={q} shown={answersFor(q, s)} lang={lang} state={s.state} spanishFirst={spanishFirst} />
              </details>
            ))}
          </section>
        );
      })}
    </div>
  );
}
