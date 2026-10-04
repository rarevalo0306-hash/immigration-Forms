import { useMemo, useState } from 'react';
import { Button } from '../../design/components';
import type { Lang } from '../../i18n';
import type { StudyState } from '../../study/state';
import type { CivicsTest } from '../../study/types';
import { answersFor, cardId, mayUseSpanish, nextCard, pool, progress, review } from '../../study/engine';
import { Answers, BackToStudy, Bar, Listen, ScreenTitle, pick } from './common';

/** One question at a time; "La sabía" moves it to a later box, "Repasar" brings it back soon. */
export function Flashcards({ lang, test, state, onChange }: { lang: Lang; test: CivicsTest; state: StudyState; onChange: (s: StudyState) => void }) {
  const t = pick(lang);
  const s = state.settings;
  const qs = pool(test, s);
  const ids = useMemo(() => qs.map((q) => cardId(test.version, q.n)), [qs, test.version]);
  const [current, setCurrent] = useState(() => nextCard(ids, state.cards, Date.now()));
  const [shown, setShown] = useState(false);
  const [count, setCount] = useState(0);
  const spanishFirst = mayUseSpanish(s);
  const q = qs.find((x) => cardId(test.version, x.n) === current);
  const p = progress(ids, state.cards);

  const answer = (knew: boolean) => {
    if (!current) return;
    const cards = review(state.cards, current, knew, Date.now());
    onChange({ ...state, cards });
    setCurrent(nextCard(ids, cards, Date.now(), current));
    setShown(false);
    setCount((c) => c + 1);
  };

  if (!q) return null;
  const main = spanishFirst ? q.question.es : q.question.en;
  const other = spanishFirst ? q.question.en : q.question.es;
  return (
    <div className="app-home">
      <BackToStudy lang={lang} />
      <div className="cm-card app-study-card">
        {/* A new heading per card, so screen readers announce each question. */}
        <ScreenTitle key={`${current}-${count}`} eyebrow={`${t('Pregunta', 'Question')} ${q.n} · ${q.section[lang]}${q.star ? ' · 65/20' : ''}`}>
          <span lang={spanishFirst ? 'es' : 'en'}>{main}</span>
        </ScreenTitle>
        <p className="app-study-translation" lang={spanishFirst ? 'en' : 'es'}>
          {other}
        </p>
        <div className="app-study-actions">
          <Listen text={q.question.en} lang={lang} label={t('Escuchar en inglés', 'Listen in English')} />
          {spanishFirst && <Listen text={q.question.es} voice="es-US" lang={lang} label={t('Escuchar en español', 'Listen in Spanish')} />}
        </div>
        {!shown ? (
          <>
            <p className="cm-card-why">{t('Diga la respuesta en voz alta y luego revísela.', 'Say the answer out loud, then check it.')}</p>
            <Button onClick={() => setShown(true)}>{t('Ver la respuesta', 'Show the answer')}</Button>
          </>
        ) : (
          <>
            <Answers q={q} shown={answersFor(q, s)} lang={lang} state={s.state} spanishFirst={spanishFirst} />
            <div className="app-study-actions">
              <Button onClick={() => answer(true)}>{t('La sabía', 'I knew it')}</Button>
              <Button variant="secondary" onClick={() => answer(false)}>
                {t('Repasar otra vez', 'Review again')}
              </Button>
            </div>
          </>
        )}
      </div>
      <p className="app-study-progress-label" role="status">
        {t(`Domina ${p.mastered} de ${p.total} · repasó ${count} en esta sesión`, `Mastered ${p.mastered} of ${p.total} · ${count} reviewed this session`)}
      </p>
      <Bar value={p.mastered} max={p.total} label={t('Preguntas dominadas', 'Questions mastered')} />
    </div>
  );
}
