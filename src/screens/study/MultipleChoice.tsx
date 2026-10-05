import { useMemo, useState } from 'react';
import { Button } from '../../design/components';
import type { Lang } from '../../i18n';
import type { StudyState } from '../../study/state';
import type { CivicsQuestion, CivicsTest } from '../../study/types';
import { answersFor, cardId, choicesFor, choosable, mayUseSpanish, nextCard, pool, review, type Choice } from '../../study/engine';
import { Answers, BackToStudy, Listen, ScreenTitle, pick } from './common';

/**
 * Practice with options: the question in text, four answers to choose from. Free. Each answer
 * also moves the question's flash card, so this practice counts toward "mastered".
 */
export function MultipleChoice({ lang, test, state, onChange }: { lang: Lang; test: CivicsTest; state: StudyState; onChange: (s: StudyState) => void }) {
  const t = pick(lang);
  const s = state.settings;
  const qs = useMemo(() => pool(test, s).filter((q) => choosable(q, s)), [test, s]);
  const ids = useMemo(() => qs.map((q) => cardId(test.version, q.n)), [qs, test.version]);
  const [current, setCurrent] = useState(() => nextCard(ids, state.cards, Date.now()));
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState({ right: 0, total: 0 });
  const spanishFirst = mayUseSpanish(s);
  const q: CivicsQuestion | undefined = qs.find((x) => cardId(test.version, x.n) === current);
  const choices: Choice[] = useMemo(() => (q ? choicesFor(q, test.questions, s) : []), [q, test.questions, s]);

  if (!q) return null;
  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const right = choices[i].right;
    setScore((x) => ({ right: x.right + (right ? 1 : 0), total: x.total + 1 }));
    onChange({ ...state, cards: review(state.cards, current!, right, Date.now()) });
  };
  const next = () => {
    setCurrent(nextCard(ids, state.cards, Date.now(), current));
    setPicked(null);
  };
  const main = spanishFirst ? q.question.es : q.question.en;
  const other = spanishFirst ? q.question.en : q.question.es;

  return (
    <div className="app-home">
      <BackToStudy lang={lang} />
      <div className="cm-card app-study-card">
        <ScreenTitle key={`${current}-${score.total}`} eyebrow={`${t('Pregunta', 'Question')} ${q.n} · ${q.section[lang]}`}>
          <span lang={spanishFirst ? 'es' : 'en'}>{main}</span>
        </ScreenTitle>
        <p className="app-study-translation" lang={spanishFirst ? 'en' : 'es'}>
          {other}
        </p>
        <Listen text={q.question.en} lang={lang} label={t('Escuchar en inglés', 'Listen in English')} />
        <ul className="app-mc" aria-label={t('Elija una respuesta', 'Choose an answer')}>
          {choices.map((c, i) => {
            const state = picked === null ? '' : c.right ? ' is-right' : picked === i ? ' is-wrong' : ' is-dim';
            return (
              <li key={c.en}>
                <button type="button" className={`app-mc-opt${state}`} onClick={() => choose(i)} aria-disabled={picked !== null}>
                  <span lang={spanishFirst ? 'es' : 'en'}>{spanishFirst ? c.es : c.en}</span>
                  {!spanishFirst && c.es !== c.en && <span className="app-mc-tr" lang="es">{c.es}</span>}
                  {picked !== null && c.right && <span className="app-sr">{t(' (correcta)', ' (right)')}</span>}
                </button>
              </li>
            );
          })}
        </ul>
        {picked !== null && (
          <div role="status" className="app-mc-result">
            <p className={`app-mc-verdict${choices[picked].right ? ' is-right' : ' is-wrong'}`}>
              {choices[picked].right ? t('¡Correcto!', 'Right!') : t('No es esa. Repase la respuesta:', 'Not that one. Review the answer:')}
            </p>
            {!choices[picked].right && <Answers q={q} shown={answersFor(q, s)} lang={lang} state={s.state} spanishFirst={spanishFirst} />}
            <Button onClick={next}>{t('Siguiente pregunta', 'Next question')}</Button>
          </div>
        )}
      </div>
      <p className="app-study-progress-label" role="status">
        {t(`${score.right} de ${score.total} correctas en esta práctica`, `${score.right} of ${score.total} right in this practice`)}
      </p>
    </div>
  );
}
