import { Button, FormBadge, Notice } from '../design/components';
import { fmt, ui, type Lang } from '../i18n';
import type { FormDefinition } from '../forms/types';

interface Props {
  form: FormDefinition;
  lang: Lang;
  hasProgress: boolean;
  onStart: () => void;
  onStartOver: () => void;
  /** Forms whose answers can start this one, when there is no progress yet. */
  reuseFrom?: string[];
  onStartWithData?: () => void;
}

const steps = (form: FormDefinition) => ({
  es: [
    `Responda una pregunta a la vez (unos ${form.minutes} minutos).`,
    'Revise todas sus respuestas en una sola página.',
    `Descargue el formulario oficial ${form.number} ya lleno, revíselo y fírmelo a mano.`,
  ],
  en: [
    `Answer one question at a time (about ${form.minutes} minutes).`,
    'Review all your answers on one page.',
    `Download the official Form ${form.number} already filled in, check it and sign it by hand.`,
  ],
});

export function Welcome({ form, lang, hasProgress, onStart, onStartOver, reuseFrom, onStartWithData }: Props) {
  const reuse = !hasProgress && !!reuseFrom?.length && !!onStartWithData;
  return (
    <section className="cm-card">
      <div className="cm-card-eyebrow">
        <FormBadge form={form.number} title={form.title[lang]} tone="soft" />
      </div>
      <h1 className="app-title">{form.title[lang]}</h1>
      <p className="cm-card-why">{form.intro[lang]}</p>
      <ol className="app-steps">
        {steps(form)[lang].map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      {reuse && (
        <Notice tone="info" title={ui.reuseTitle[lang]}>
          {fmt(ui.reuseBody[lang], { forms: reuseFrom!.join(', ') })}
        </Notice>
      )}
      <Notice tone="info" title={ui.savedTitle[lang]}>{ui.savedBody[lang]}</Notice>
      <Notice tone="legal" title={ui.legalTitle[lang]}>{ui.legalBody[lang]}</Notice>
      <div className="cm-card-actions">
        {hasProgress ? (
          <>
            <Button variant="quiet" onClick={onStartOver}>{ui.startOver[lang]}</Button>
            <Button onClick={onStart}>{ui.resume[lang]}</Button>
          </>
        ) : reuse ? (
          <>
            <Button variant="quiet" onClick={onStart}>{ui.reuseNo[lang]}</Button>
            <Button onClick={onStartWithData}>{ui.reuseYes[lang]}</Button>
          </>
        ) : (
          <>
            <span />
            <Button onClick={onStart}>{ui.start[lang]}</Button>
          </>
        )}
      </div>
    </section>
  );
}
