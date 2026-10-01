import { Button, FormBadge, Notice } from '../design/components';
import { ui, type Lang } from '../i18n';
import type { Answers, FormDefinition } from '../forms/types';
import type { Screen } from '../engine/flow';

interface Props {
  form: FormDefinition;
  screens: Screen[];
  answers: Answers;
  lang: Lang;
  onEdit: (screenIndex: number) => void;
  onBack: () => void;
}

const nextSteps = {
  es: [
    'Descargue la edición vigente del I-765 y sus instrucciones en uscis.gov/i-765.',
    'Copie cada respuesta en el campo que indica la referencia en inglés.',
    'Revise la tarifa actual en uscis.gov/g-1055 y las pruebas que pide su categoría.',
    'Firme la Parte 3 a mano con tinta negra (o en su cuenta de USCIS si lo presenta en línea).',
  ],
  en: [
    'Download the current edition of Form I-765 and its instructions from uscis.gov/i-765.',
    'Copy each answer into the field named by its English reference.',
    'Check the current fee at uscis.gov/g-1055 and the evidence your category requires.',
    'Sign Part 3 by hand in black ink (or in your USCIS account if you file online).',
  ],
};

export function Review({ form, screens, answers, lang, onEdit, onBack }: Props) {
  const optionLabel = (screen: Screen, value: string) =>
    screen.question.kind === 'choice' ? screen.question.options.find((o) => o.value === value)?.label : undefined;

  return (
    <section className="cm-card app-review">
      <div className="cm-card-eyebrow">
        <FormBadge form={form.number} title={form.title.en} tone="soft" />
      </div>
      <h1 className="app-title">{ui.review[lang]}</h1>
      <p className="cm-card-why">
        {lang === 'es'
          ? 'Estas son sus respuestas, en el orden del formulario oficial. La columna de la derecha dice dónde va cada una.'
          : 'These are your answers, in the order of the official form. The right column says where each one goes.'}
      </p>

      {form.sections.map((section) => {
        const rows = screens.map((s, i) => ({ s, i })).filter(({ s }) => s.section.id === section.id);
        if (!rows.length) return null;
        return (
          <div key={section.id} className="app-review-section">
            <h2 className="app-review-h">
              {section.part} · {section.title[lang]}
            </h2>
            <dl className="app-review-list">
              {rows.flatMap(({ s, i }) => {
                const q = s.question;
                const items =
                  q.kind === 'choice'
                    ? [{ key: q.id, label: q.question[lang], ref: q.formRef, value: answers[q.id] ? (optionLabel(s, String(answers[q.id])) ?? { es: '', en: '' }) : null }]
                    : q.fields.map((f) => ({ key: f.id, label: f.label[lang], ref: f.formRef, value: answers[f.id] ? String(answers[f.id]) : null }));
                return items.map((it, n) => (
                  <div key={it.key} className="app-review-row">
                    <dt>
                      {it.label}
                      <span className="cm-label-en">{it.ref}</span>
                    </dt>
                    <dd>
                      {it.value === null ? (
                        <span className="app-empty">{ui.notAnswered[lang]}</span>
                      ) : typeof it.value === 'string' ? (
                        it.value
                      ) : (
                        // Choices print in English (what goes on the form) with the chosen-language label beside it.
                        <>
                          {it.value.en}
                          {lang !== 'en' && <span className="cm-label-en">{it.value[lang]}</span>}
                        </>
                      )}
                    </dd>
                    {n === 0 && (
                      <Button variant="quiet" className="app-edit no-print" onClick={() => onEdit(i)}>
                        {ui.edit[lang]}
                      </Button>
                    )}
                  </div>
                ));
              })}
            </dl>
          </div>
        );
      })}

      <h2 className="app-review-h">{lang === 'es' ? 'Siguientes pasos' : 'Next steps'}</h2>
      <ol className="app-steps">
        {nextSteps[lang].map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <Notice tone="legal" title={ui.legalTitle[lang]}>{ui.legalBody[lang]}</Notice>

      <div className="cm-card-actions no-print">
        <Button variant="quiet" onClick={onBack}>{ui.back[lang]}</Button>
        <Button onClick={() => window.print()}>{ui.print[lang]}</Button>
      </div>
    </section>
  );
}
