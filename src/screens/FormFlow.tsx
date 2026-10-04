import { useEffect, useMemo, useState } from 'react';
import { ProgressSteps } from '../design/components';
import { fmt, ui, type Lang } from '../i18n';
import type { Answers, FormDefinition } from '../forms/types';
import { normalizeQuestion, pruneHidden, validateQuestion, visibleScreens, type Errors } from '../engine/flow';
import { activeCase, clear, listCases, load, loadAll, save } from '../storage';
import { caseName } from './Cases';
import { buildProfile, prefillFor } from '../engine/profile';
import { catalog, metaById } from '../forms/catalog';
import { loadForms } from '../forms/load';
import { stepsOf, type PackageDefinition } from '../forms/packages';
import { nextStep } from '../engine/packages';
import { formInPackageHref, packageHref, statusOf } from './Package';
import { Button } from '../design/components';
import { Welcome } from './Welcome';
import { QuestionScreen } from './QuestionScreen';
import { Review } from './Review';

const WELCOME = -1;

/** One form, from its welcome screen through the questions to the review page. */
export function FormFlow({ form, pkg, lang }: { form: FormDefinition; pkg?: PackageDefinition | null; lang: Lang }) {
  const saved = useMemo(() => load(form.id), [form.id]);
  // What the person already told Camino on other forms, to start this one with.
  // Only the forms with saved answers are loaded for it.
  const [prefill, setPrefill] = useState<ReturnType<typeof prefillFor> | null>(null);
  useEffect(() => {
    if (saved && Object.keys(saved.answers).length) return;
    const others = loadAll(catalog.map((f) => f.id), form.id);
    if (!others.length) return;
    let live = true;
    loadForms(others.map((s) => s.formId))
      .then((defs) => {
        const p = prefillFor(form, buildProfile([...defs, form], others));
        if (live && Object.keys(p.answers).length) setPrefill(p);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [form, saved]);
  // What the package already answers for this form (the I-130 is for a spouse, …).
  const preset = useMemo(() => (pkg && stepsOf(pkg).find((s) => s.formId === form.id)?.preset) ?? {}, [pkg, form.id]);
  const startFresh = (answers: Answers) => {
    setAnswers({ ...answers, ...preset });
    go(0);
  };
  const [answers, setAnswers] = useState<Answers>(saved?.answers ?? {});
  const [position, setPosition] = useState(WELCOME);
  const [errors, setErrors] = useState<Errors>({});
  // Where to go back to after editing one answer from the review page.
  const [returnToReview, setReturnToReview] = useState(false);

  const screens = useMemo(() => visibleScreens(form, answers), [form, answers]);
  const reviewPos = screens.length;
  const pos = Math.min(position, reviewPos);
  const screen = pos >= 0 && pos < reviewPos ? screens[pos] : null;
  // Count only the sections that have questions to ask: the I-131 skips whole parts by document type.
  const shownSections = useMemo(() => [...new Set(screens.map((s) => s.sectionIndex))], [screens]);

  // Remember the last question reached, so "Pick up where I left off" lands there.
  const [resumeAt, setResumeAt] = useState(saved?.position ?? 0);
  useEffect(() => {
    if (pos >= 0) setResumeAt(pos);
  }, [pos]);
  useEffect(() => {
    const p = pos >= 0 ? pos : resumeAt;
    save(form.id, { answers, position: p, done: p >= reviewPos });
  }, [form.id, answers, pos, resumeAt, reviewPos]);

  const go = (p: number) => {
    setErrors({});
    setPosition(p);
    window.scrollTo({ top: 0 });
  };

  const next = () => {
    if (!screen) return;
    const errs = validateQuestion(screen.question, answers);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    const normalized = pruneHidden(form, normalizeQuestion(screen.question, answers));
    setAnswers(normalized);
    if (returnToReview) {
      setReturnToReview(false);
      go(visibleScreens(form, normalized).length);
      return;
    }
    go(pos + 1);
  };

  const onChange = (id: string, value: string | string[]) => {
    setAnswers((a) => ({ ...a, [id]: value }));
    if (errors[id]) setErrors(({ [id]: _, ...rest }) => rest);
  };

  const upNext = pkg && pos === reviewPos ? nextStep(pkg, form.id, statusOf) : undefined;
  const nextForm = upNext && metaById(upNext.formId);

  return (
    <>
      {listCases().length > 1 && (
        <p className="app-case-banner no-print">
          {fmt(ui.caseActive[lang], { name: caseName(activeCase(), lang) })} · <a href="#">{ui.caseChange[lang]}</a>
        </p>
      )}
      {pkg && (
        <a className="app-back-link no-print" href={packageHref(pkg)}>
          ← {ui.backToPackage[lang]}: {pkg.title[lang]}
        </a>
      )}
      {screen && (
        <div className="no-print">
          <ProgressSteps
            total={shownSections.length}
            current={shownSections.indexOf(screen.sectionIndex) + 1}
            label={screen.section.title[lang]}
            stepWord={(c, t) => fmt(ui.step[lang], { c, t })}
            ariaLabel={ui.progress[lang]}
          />
        </div>
      )}
      {pos === WELCOME && (
        <Welcome
          form={form}
          lang={lang}
          hasProgress={Object.keys(answers).length > 0}
          onStart={() => (Object.keys(answers).length ? go(Math.min(resumeAt, reviewPos)) : startFresh({}))}
          reuseFrom={prefill?.sources}
          onStartWithData={() => startFresh(prefill?.answers ?? {})}
          onStartOver={() => {
            if (!window.confirm(ui.confirmStartOver[lang])) return;
            clear(form.id);
            setResumeAt(0);
            startFresh({});
          }}
        />
      )}
      {screen && (
        <QuestionScreen
          key={screen.question.id}
          form={form}
          question={screen.question}
          part={screen.section.part}
          answers={answers}
          errors={errors}
          lang={lang}
          onChange={onChange}
          onBack={() => (returnToReview ? (setReturnToReview(false), go(reviewPos)) : go(pos - 1))}
          onNext={next}
        />
      )}
      {pos === reviewPos && (
        <Review
          form={form}
          screens={screens}
          answers={answers}
          lang={lang}
          onEdit={(i) => {
            setReturnToReview(true);
            go(i);
          }}
          onBack={() => go(reviewPos - 1)}
        />
      )}
      {pkg && pos === reviewPos && (
        <section className="cm-card no-print">
          <p className="cm-card-why">{nextForm ? fmt(ui.nextInPackage[lang], { form: `${nextForm.number}, ${nextForm.title[lang]}` }) : ui.packageDone[lang]}</p>
          <div className="cm-card-actions">
            <Button variant="quiet" onClick={() => (window.location.hash = packageHref(pkg).slice(1))}>{ui.backToPackage[lang]}</Button>
            {nextForm && <Button onClick={() => (window.location.hash = formInPackageHref(nextForm.id, pkg).slice(1))}>{nextForm.number}</Button>}
          </div>
        </section>
      )}
    </>
  );
}
