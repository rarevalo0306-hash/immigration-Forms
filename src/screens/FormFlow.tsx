import { useEffect, useMemo, useState } from 'react';
import { ProgressSteps } from '../design/components';
import { fmt, ui, type Lang } from '../i18n';
import type { Answers, FormDefinition } from '../forms/types';
import { normalizeQuestion, pruneHidden, validateQuestion, visibleScreens, type Errors } from '../engine/flow';
import { clear, load, save } from '../storage';
import { Welcome } from './Welcome';
import { QuestionScreen } from './QuestionScreen';
import { Review } from './Review';

const WELCOME = -1;

/** One form, from its welcome screen through the questions to the review page. */
export function FormFlow({ form, lang }: { form: FormDefinition; lang: Lang }) {
  const saved = useMemo(() => load(form.id), [form.id]);
  const [answers, setAnswers] = useState<Answers>(saved?.answers ?? {});
  const [position, setPosition] = useState(WELCOME);
  const [errors, setErrors] = useState<Errors>({});
  // Where to go back to after editing one answer from the review page.
  const [returnToReview, setReturnToReview] = useState(false);

  const screens = useMemo(() => visibleScreens(form, answers), [form, answers]);
  const reviewPos = screens.length;
  const pos = Math.min(position, reviewPos);
  const screen = pos >= 0 && pos < reviewPos ? screens[pos] : null;

  // Remember the last question reached, so "Pick up where I left off" lands there.
  const [resumeAt, setResumeAt] = useState(saved?.position ?? 0);
  useEffect(() => {
    if (pos >= 0) setResumeAt(pos);
  }, [pos]);
  useEffect(() => {
    save(form.id, { answers, position: pos >= 0 ? pos : resumeAt });
  }, [form.id, answers, pos, resumeAt]);

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

  return (
    <>
      {screen && (
        <div className="no-print">
          <ProgressSteps
            total={form.sections.length}
            current={screen.sectionIndex + 1}
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
          onStart={() => go(Object.keys(answers).length ? Math.min(resumeAt, reviewPos) : 0)}
          onStartOver={() => {
            if (!window.confirm(ui.confirmStartOver[lang])) return;
            clear(form.id);
            setAnswers({});
            setResumeAt(0);
            go(0);
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
    </>
  );
}
