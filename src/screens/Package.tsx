import { FormBadge, Notice } from '../design/components';
import { fmt, ui, type Lang } from '../i18n';
import { formById } from '../forms';
import type { PackageDefinition } from '../forms/packages';
import { formStatus, progressOf, type StepStatus } from '../engine/packages';
import { load } from '../storage';
import { documentsFor } from '../forms/documents';
import { DocChecklist, type ChecklistRow } from './DocChecklist';

export const statusOf = (formId: string): StepStatus => {
  const form = formById(formId);
  return form ? formStatus(form, load(formId)) : 'new';
};

export const packageHref = (pkg: PackageDefinition) => `#paquete/${pkg.id}`;
export const formInPackageHref = (formId: string, pkg: PackageDefinition) => `#${formId}?paquete=${pkg.id}`;

const STATUS: Record<StepStatus, { es: string; en: string }> = {
  new: { es: 'Sin empezar', en: 'Not started' },
  started: { es: 'En progreso', en: 'In progress' },
  done: { es: 'Listo para descargar', en: 'Ready to download' },
};

/** The documents of the package's required forms and the optional ones already started, once each. */
function packageDocs(pkg: PackageDefinition): ChecklistRow[] {
  const rows = new Map<string, ChecklistRow>();
  for (const step of pkg.stages.flatMap((s) => s.steps)) {
    const form = formById(step.formId);
    if (!form || (step.optional && statusOf(step.formId) === 'new')) continue;
    // A form not started yet still knows what the package presets (an I-130 for a spouse, …).
    const answers = { ...step.preset, ...load(step.formId)?.answers };
    for (const item of documentsFor(step.formId)) {
      if (item.when && !item.when(answers)) continue;
      // Shared ids merge only when they say the same thing (two photos vs. one photo stay apart).
      const k = `${item.id}|${item.label.es}`;
      const row = rows.get(k);
      if (row) row.forms!.push(form.number);
      else rows.set(k, { item, forms: [form.number] });
    }
  }
  return [...rows.values()];
}

/** One package: its forms in order, who fills each one, and how far along each is. */
export function Package({ pkg, lang }: { pkg: PackageDefinition; lang: Lang }) {
  const { done, total } = progressOf(pkg, statusOf);
  return (
    <section className="cm-card">
      <div className="cm-card-eyebrow">
        <FormBadge form={ui.packageWord[lang]} title={fmt(ui.packageProgress[lang], { done, total })} tone="soft" />
      </div>
      <h1 className="app-title">{pkg.title[lang]}</h1>
      <p className="cm-card-why">{pkg.intro[lang]}</p>
      {pkg.legal && <Notice tone="legal" title={ui.legalTitle[lang]}>{pkg.legal[lang]}</Notice>}
      {pkg.stages.map((stage) => (
        <div key={stage.title.en} className="app-stage">
          <h2 className="app-review-h">{stage.title[lang]}</h2>
          {stage.body && <p className="cm-card-why">{stage.body[lang]}</p>}
          <ol className="app-form-list">
            {stage.steps.map((step) => {
              const form = formById(step.formId)!;
              const status = statusOf(step.formId);
              return (
                <li key={step.formId}>
                  <a className={`cm-card app-form-card app-step app-step--${status}`} href={formInPackageHref(step.formId, pkg)}>
                    <FormBadge form={form.number} title={STATUS[status][lang]} tone={status === 'new' ? 'ink' : 'soft'} />
                    <span className="app-form-title">
                      {form.title[lang]}
                      {step.optional && <span className="app-optional"> {ui.ifApplies[lang]}</span>}
                    </span>
                    <span className="cm-card-why">{step.why[lang]}</span>
                    <span className="app-form-meta">{fmt(ui.filledBy[lang], { who: step.who[lang] })}</span>
                  </a>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
      <DocChecklist listId={`pkg-${pkg.id}`} lang={lang} rows={packageDocs(pkg)} intro={ui.docsPackageIntro[lang]} />
      <h2 className="app-review-h">{ui.packageTips[lang]}</h2>
      <ul className="app-steps">
        {pkg.tips[lang].map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      <Notice tone="legal" title={ui.legalTitle[lang]}>{ui.legalBody[lang]}</Notice>
    </section>
  );
}
