import { Button, FormBadge, Notice } from '../design/components';
import { ui, type Lang } from '../i18n';
import type { FormDefinition } from '../forms/types';

interface Props {
  form: FormDefinition;
  lang: Lang;
  hasProgress: boolean;
  onStart: () => void;
  onStartOver: () => void;
}

const steps = {
  es: ['Responda una pregunta a la vez (unos 20 minutos).', 'Revise todas sus respuestas en una sola página.', 'Imprima la hoja y úsela para llenar el formulario oficial de uscis.gov/i-765.'],
  en: ['Answer one question at a time (about 20 minutes).', 'Review all your answers on one page.', 'Print the sheet and use it to fill in the official form from uscis.gov/i-765.'],
};

export function Welcome({ form, lang, hasProgress, onStart, onStartOver }: Props) {
  return (
    <section className="cm-card">
      <div className="cm-card-eyebrow">
        <FormBadge form={form.number} title={form.title[lang]} tone="soft" />
      </div>
      <h1 className="app-title">{form.title[lang]}</h1>
      <p className="cm-card-why">{form.intro[lang]}</p>
      <ol className="app-steps">
        {steps[lang].map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <Notice tone="info" title={ui.savedTitle[lang]}>{ui.savedBody[lang]}</Notice>
      <Notice tone="legal" title={ui.legalTitle[lang]}>{ui.legalBody[lang]}</Notice>
      <div className="cm-card-actions">
        {hasProgress ? (
          <>
            <Button variant="quiet" onClick={onStartOver}>{ui.startOver[lang]}</Button>
            <Button onClick={onStart}>{ui.resume[lang]}</Button>
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
