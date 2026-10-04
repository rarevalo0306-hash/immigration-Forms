import { useState } from 'react';
import { Button, Notice } from '../../design/components';
import type { Lang } from '../../i18n';
import { MAX_ATTEMPTS, type StudyState } from '../../study/state';
import type { CivicsQuestion, CivicsTest } from '../../study/types';
import { answersFor, cardId, mayUseSpanish, outcome, pick as pickQuestions, pool, rulesFor } from '../../study/engine';
import { speak } from '../../study/speech';
import { Answers, BackToStudy, Listen, ScreenTitle, pick } from './common';

/**
 * A practice interview: random questions, one at a time, read aloud like the officer would. The
 * person answers out loud, checks the answer and marks it right or wrong; it ends as the real one
 * does, at the passing number of right answers or the failing number of wrong ones.
 */
export function Interview({ lang, test, state, onChange }: { lang: Lang; test: CivicsTest; state: StudyState; onChange: (s: StudyState) => void }) {
  const t = pick(lang);
  const s = state.settings;
  const rules = rulesFor(test, s);
  const spanishFirst = mayUseSpanish(s);
  const [questions, setQuestions] = useState<CivicsQuestion[] | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [shown, setShown] = useState(false);

  const say = (q: CivicsQuestion) => speak(spanishFirst ? q.question.es : q.question.en, spanishFirst ? 'es-US' : 'en-US');

  const start = () => {
    const qs = pickQuestions(pool(test, s), rules.asked);
    setQuestions(qs);
    setResults([]);
    setShown(false);
    say(qs[0]);
  };

  if (!questions)
    return (
      <div className="app-home">
        <BackToStudy lang={lang} />
        <ScreenTitle>{t('Simulacro de entrevista', 'Practice interview')}</ScreenTitle>
        <div className="cm-card app-fields">
          <p className="cm-card-why">
            {t(
              `Como en la entrevista, le haremos preguntas al azar, una por una, y se las leeremos en voz alta. Conteste en voz alta (sin mirar), luego vea la respuesta y marque si la dijo bien. Termina al llegar a ${rules.pass} correctas (aprobado) o a ${rules.fail} incorrectas.`,
              `Like at the interview, we’ll ask random questions one by one and read them aloud. Answer out loud (without looking), then see the answer and mark whether you got it right. It ends at ${rules.pass} right (pass) or ${rules.fail} wrong.`,
            )}
          </p>
          <p className="cm-card-why">
            {spanishFirst
              ? t('Como puede contestar en español, las preguntas van en español; en la entrevista, su intérprete se las traduce.', 'As you may answer in Spanish, the questions are in Spanish; at the interview, your interpreter translates them.')
              : t('En la entrevista el oficial pregunta en inglés: practique escuchando sin leer.', 'At the interview the officer asks in English: practice by listening without reading.')}
          </p>
          <Button onClick={start}>{t('Empezar el simulacro', 'Start the practice interview')}</Button>
        </div>
      </div>
    );

  const result = outcome(results, rules);
  const right = results.filter(Boolean).length;
  const wrong = results.length - right;

  if (result !== 'continue') {
    const missed = questions.filter((_, i) => results[i] === false);
    const reviewMissed = () => {
      const cards = { ...state.cards };
      for (const q of missed) cards[cardId(test.version, q.n)] = { box: 1, due: Date.now() };
      onChange({ ...state, cards });
      window.location.hash = '#estudiar/tarjetas';
    };
    return (
      <div className="app-home">
        <BackToStudy lang={lang} />
        <ScreenTitle>{result === 'pass' ? t('¡Aprobó el simulacro!', 'You passed the practice interview!') : t('Esta vez no alcanzó', 'Not this time')}</ScreenTitle>
        <Notice tone="info">
          {t(`${right} correctas y ${wrong} incorrectas.`, `${right} right and ${wrong} wrong.`)}{' '}
          {result === 'pass'
            ? t('Siga practicando para llegar con confianza.', 'Keep practicing so you go in with confidence.')
            : t(`Para aprobar necesita ${rules.pass} correctas. Repase las que falló y vuelva a intentarlo.`, `To pass you need ${rules.pass} right. Review the ones you missed and try again.`)}
        </Notice>
        {missed.length > 0 && (
          <section className="cm-card app-fields" aria-labelledby="missed-h">
            <h2 id="missed-h" className="app-review-h">
              {t('Las que falló', 'The ones you missed')}
            </h2>
            {missed.map((q) => (
              <div key={q.n} className="app-study-missed">
                <p className="app-study-missed-q">
                  <span lang="en">{q.question.en}</span>
                  <span className="app-study-answer-tr" lang="es">
                    {q.question.es}
                  </span>
                </p>
                <Answers q={q} shown={answersFor(q, s)} lang={lang} state={s.state} spanishFirst={spanishFirst} />
              </div>
            ))}
            <Button variant="secondary" onClick={reviewMissed}>
              {t('Repasarlas en las tarjetas', 'Review them with the flash cards')}
            </Button>
          </section>
        )}
        <Button onClick={start}>{t('Hacer otro simulacro', 'Do another practice interview')}</Button>
      </div>
    );
  }

  const q = questions[results.length];
  const mark = (ok: boolean) => {
    const next = [...results, ok];
    setResults(next);
    setShown(false);
    const end = outcome(next, rules);
    if (end !== 'continue') {
      const right = next.filter(Boolean).length;
      onChange({ ...state, attempts: [...state.attempts, { version: test.version, at: Date.now(), right, wrong: next.length - right, passed: end === 'pass' }].slice(-MAX_ATTEMPTS) });
    } else say(questions[next.length]);
  };

  return (
    <div className="app-home">
      <BackToStudy lang={lang} />
      <div className="cm-card app-study-card">
        <ScreenTitle key={results.length} eyebrow={t(`Pregunta ${results.length + 1} · correctas ${right} · incorrectas ${wrong}`, `Question ${results.length + 1} · right ${right} · wrong ${wrong}`)}>
          <span lang={spanishFirst ? 'es' : 'en'}>{spanishFirst ? q.question.es : q.question.en}</span>
        </ScreenTitle>
        <div className="app-study-actions">
          <Listen text={spanishFirst ? q.question.es : q.question.en} voice={spanishFirst ? 'es-US' : 'en-US'} lang={lang} label={t('Repetir la pregunta', 'Repeat the question')} />
        </div>
        {!shown ? (
          <Button onClick={() => setShown(true)}>{t('Ya contesté: ver la respuesta', 'I answered: show the answer')}</Button>
        ) : (
          <>
            {!spanishFirst && (
              <p className="app-study-translation" lang="es">
                {q.question.es}
              </p>
            )}
            <Answers q={q} shown={answersFor(q, s)} lang={lang} state={s.state} spanishFirst={spanishFirst} />
            <div className="app-study-actions">
              <Button onClick={() => mark(true)}>{t('La contesté bien', 'I got it right')}</Button>
              <Button variant="secondary" onClick={() => mark(false)}>
                {t('La contesté mal', 'I got it wrong')}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
