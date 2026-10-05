import { useEffect, useState } from 'react';
import { Button, Notice } from '../../design/components';
import { ui, type Lang } from '../../i18n';
import { loadStudy, saveStudy } from '../../storage';
import { parseStudy, type StudyState } from '../../study/state';
import type { CivicsTest, TestVersion } from '../../study/types';
import { cardId, pool, progress, rulesFor, takesEnglishTest } from '../../study/engine';
import { Bar, ScreenTitle, pick } from './common';
import { Setup } from './Setup';
import { Flashcards } from './Flashcards';
import { Interview } from './Interview';
import { QuestionList } from './QuestionList';
import { EnglishTest } from './EnglishTest';
import { MultipleChoice } from './MultipleChoice';
import { StudyPaywall, useStudyLocked } from '../Paywall';
import { BackToStudy } from './common';
import { TEST_UPDATES_URL } from '../../study/current';
import type { StudyView } from './route';

/**
 * "Estudiar para la ciudadanía" (#estudiar): the civics and English tests of the naturalization
 * interview. Progress is kept per case on this device, like the forms (storage.ts loadStudy).
 */

const loaders: Record<TestVersion, () => Promise<CivicsTest>> = {
  '2025': () => import('../../study/civics2025').then((m) => m.civics2025),
  '2008': () => import('../../study/civics2008').then((m) => m.civics2008),
};


export default function Study({ view, lang }: { view: StudyView; lang: Lang }) {
  const locked = useStudyLocked();
  const [state, setState] = useState<StudyState>(() => parseStudy(loadStudy()));
  const [test, setTest] = useState<CivicsTest | null>(null);
  const [failed, setFailed] = useState(false);
  const version = state.settings.version;

  useEffect(() => {
    let live = true;
    setTest(null);
    setFailed(false);
    loaders[version]()
      .then((t) => live && setTest(t))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [version]);

  const update = (next: StudyState) => {
    setState(next);
    saveStudy(next);
  };

  if (!state.ready || view === 'ajustes')
    return (
      <Setup
        lang={lang}
        state={state}
        first={!state.ready}
        onSave={(settings) => {
          update({ ...state, ready: true, settings });
          window.location.hash = '#estudiar';
        }}
      />
    );

  if (failed)
    return (
      <div className="app-home">
        <Notice tone="error" title={ui.loadFailed[lang]}>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            {ui.retry[lang]}
          </Button>
        </Notice>
      </div>
    );
  if (!test) return <p role="status">{ui.loading[lang]}</p>;

  switch (view) {
    case 'tarjetas':
      return <Flashcards lang={lang} test={test} state={state} onChange={update} />;
    case 'opciones':
      return <MultipleChoice lang={lang} test={test} state={state} onChange={update} />;
    case 'entrevista':
      return locked ? <Locked lang={lang} view={view} /> : <Interview lang={lang} test={test} state={state} onChange={update} />;
    case 'preguntas':
      return <QuestionList lang={lang} test={test} state={state} />;
    case 'ingles':
      return locked ? <Locked lang={lang} view={view} /> : <EnglishTest lang={lang} />;
    default:
      return <Overview lang={lang} test={test} state={state} locked={locked} />;
  }
}

/** The paid modes, before the study plan is active. */
function Locked({ lang, view }: { lang: Lang; view: StudyView }) {
  return (
    <div className="app-home">
      <BackToStudy lang={lang} />
      <StudyPaywall lang={lang} returnTo={`#estudiar/${view}`} />
    </div>
  );
}

function Overview({ lang, test, state, locked }: { lang: Lang; test: CivicsTest; state: StudyState; locked: boolean }) {
  const t = pick(lang);
  const s = state.settings;
  const qs = pool(test, s);
  const r = rulesFor(test, s);
  const p = progress(
    qs.map((q) => cardId(test.version, q.n)),
    state.cards,
  );
  const last = [...state.attempts].reverse().find((a) => a.version === test.version);
  const exemptNote =
    s.exemption === '65-20'
      ? t(
          'Por su edad y sus años de residente (65/20), no toma el examen de inglés y estudia solo 20 preguntas especiales. Puede contestarlas en español, con un intérprete que usted lleva.',
          'Because of your age and years as a resident (65/20), you don’t take the English test and you study only 20 special questions. You may answer them in Spanish, with an interpreter you bring.',
        )
      : s.exemption === '50-20'
        ? t(
            'Por su edad y sus años de residente (50/20 o 55/15), no toma el examen de inglés y puede contestar las preguntas de educación cívica en español, con un intérprete que usted lleva.',
            'Because of your age and years as a resident (50/20 or 55/15), you don’t take the English test and you may answer the civics questions in Spanish, with an interpreter you bring.',
          )
        : t(
            'En la entrevista también le evalúan el inglés: leer en voz alta 1 de 3 oraciones, escribir 1 de 3 oraciones que le dictan, y hablar y entender en la conversación con el oficial.',
            'At the interview your English is tested too: reading aloud 1 of 3 sentences, writing 1 of 3 dictated sentences, and speaking and understanding in the conversation with the officer.',
          );

  const paid = locked ? t(' · Plan de estudio', ' · Study plan') : '';
  const modes = [
    {
      href: '#estudiar/opciones',
      title: t('Práctica con opciones', 'Multiple choice practice'),
      body: t('Lea la pregunta y elija la respuesta correcta entre cuatro. Gratis.', 'Read the question and pick the right answer out of four. Free.'),
    },
    {
      href: '#estudiar/tarjetas',
      title: t('Tarjetas de estudio', 'Flash cards'),
      body: t('Una pregunta a la vez. Las que ya sabe vuelven cada vez menos; las que le cuestan, más seguido.', 'One question at a time. The ones you know come back less often; the hard ones, more often.'),
    },
    {
      href: '#estudiar/entrevista',
      title: t('Simulacro de entrevista', 'Practice interview') + paid,
      body: t(
        `Preguntas al azar, como en la entrevista: hasta ${r.asked}, y aprueba con ${r.pass} correctas.`,
        `Random questions, like at the interview: up to ${r.asked}, and you pass with ${r.pass} right.`,
      ),
    },
    {
      href: '#estudiar/preguntas',
      title: t('Todas las preguntas', 'All the questions'),
      body: t('La lista oficial con sus respuestas, para leer o buscar.', 'The official list with its answers, to read or search.'),
    },
    ...(takesEnglishTest(s)
      ? [
          {
            href: '#estudiar/ingles',
            title: t('Examen de inglés', 'English test') + paid,
            body: t('Practique leer en voz alta y escribir oraciones dictadas, con las palabras oficiales.', 'Practice reading aloud and writing dictated sentences, with the official words.'),
          },
        ]
      : []),
  ];

  return (
    <div className="app-home">
      <ScreenTitle>{t('Estudiar para la ciudadanía', 'Study for citizenship')}</ScreenTitle>
      <section className="cm-card app-study-summary" aria-labelledby="study-sum">
        <h2 id="study-sum" className="app-review-h">
          {t(`Su examen de educación cívica (versión ${test.version})`, `Your civics test (${test.version} version)`)}
        </h2>
        <p className="cm-card-why">
          {s.exemption === '65-20'
            ? t(
                `Le harán ${r.asked} de las ${qs.length} preguntas marcadas para 65/20, y necesita ${r.pass} correctas.`,
                `You’ll be asked ${r.asked} of the ${qs.length} questions marked for 65/20, and you need ${r.pass} right.`,
              )
            : t(
                `Le harán hasta ${r.asked} de estas ${qs.length} preguntas, en voz alta. Aprueba con ${r.pass} correctas; el oficial para en cuanto llega a ${r.pass} correctas o a ${r.fail} incorrectas.`,
                `You’ll be asked up to ${r.asked} of these ${qs.length} questions, out loud. You pass with ${r.pass} right; the officer stops as soon as you reach ${r.pass} right or ${r.fail} wrong.`,
              )}
        </p>
        <p className="cm-card-why">{exemptNote}</p>
        <p className="app-study-progress-label">
          {t(`Ya domina ${p.mastered} de ${p.total} preguntas`, `You’ve mastered ${p.mastered} of ${p.total} questions`)}
          {p.seen > p.mastered ? t(` · ha visto ${p.seen}`, ` · seen ${p.seen}`) : ''}
        </p>
        <Bar value={p.mastered} max={p.total} label={t('Preguntas dominadas', 'Questions mastered')} />
        {last && (
          <p className="app-form-meta">
            {t(
              `Último simulacro: ${last.right} correctas, ${last.wrong} incorrectas · ${last.passed ? 'aprobado' : 'no aprobado'}`,
              `Last practice interview: ${last.right} right, ${last.wrong} wrong · ${last.passed ? 'passed' : 'not passed'}`,
            )}
          </p>
        )}
        <a className="app-filing-link" href="#estudiar/ajustes">
          {t('Cambiar mis datos para el examen (versión, edad, estado)', 'Change my test details (version, age, state)')}
        </a>
      </section>
      <ul className="app-form-list">
        {modes.map((m) => (
          <li key={m.href}>
            <a className="cm-card app-form-card" href={m.href}>
              <span className="app-form-title">{m.title}</span>
              <span className="cm-card-why">{m.body}</span>
            </a>
          </li>
        ))}
      </ul>
      <Notice tone="info" title={t('De dónde salen las preguntas', 'Where the questions come from')}>
        {test.spanish === 'uscis'
          ? t(
              'Las preguntas y respuestas en inglés son las oficiales de USCIS, igual que su traducción al español. Algunas respuestas cambian con las elecciones: Camino muestra las de la página de cambios de USCIS.',
              'The questions and answers in English are USCIS’s official ones, and so is their Spanish translation. Some answers change with elections: Camino shows those from USCIS’s updates page.',
            )
          : t(
              'Las preguntas y respuestas en inglés son las oficiales de USCIS. USCIS no publicó esta versión en español: la traducción es de Camino, para ayudarle a entender. Algunas respuestas cambian con las elecciones: Camino muestra las de la página de cambios de USCIS.',
              'The questions and answers in English are USCIS’s official ones. USCIS hasn’t published this version in Spanish: the translation is Camino’s, to help you understand. Some answers change with elections: Camino shows those from USCIS’s updates page.',
            )}{' '}
        <a href={test.source.url} target="_blank" rel="noreferrer">
          {t('Lista oficial (PDF)', 'Official list (PDF)')}
        </a>
        {' · '}
        <a href={TEST_UPDATES_URL} target="_blank" rel="noreferrer">
          {t('Respuestas que cambian', 'Answers that change')}
        </a>
      </Notice>
    </div>
  );
}
