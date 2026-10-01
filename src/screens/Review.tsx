import { useState } from 'react';
import { Button, FormBadge, Notice } from '../design/components';
import { fmt, ui, type Lang } from '../i18n';
import { I765_EDITION } from '../forms/i765';
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
    'Confirme en uscis.gov/i-765 que la edición {edition} sigue vigente; si cambió, use la nueva y copie sus respuestas de esta hoja.',
    'Revise el PDF página por página. Si usó más de un nombre, agregue los demás a mano en los Ítems 3 y 4 de la Parte 2.',
    'Revise la tarifa actual en uscis.gov/g-1055 y las pruebas que pide su categoría en las instrucciones del I-765.',
    'Imprima el PDF y firme la Parte 3, Ítem 7, a mano con tinta negra.',
  ],
  en: [
    'Check at uscis.gov/i-765 that edition {edition} is still current; if it changed, use the new one and copy your answers from this sheet.',
    'Check the PDF page by page. If you used more than one other name, add the rest by hand in Part 2, Items 3 and 4.',
    'Check the current fee at uscis.gov/g-1055 and the evidence your category needs in the I-765 instructions.',
    'Print the PDF and sign Part 3, Item 7, by hand in black ink.',
  ],
};

async function downloadFilledPdf(answers: Answers) {
  const [{ fillI765 }, template] = await Promise.all([
    import('../pdf/i765Pdf'),
    fetch(`${import.meta.env.BASE_URL}forms/i-765.pdf`).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.arrayBuffer();
    }),
  ]);
  const bytes = await fillI765(template, answers);
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'I-765-filled.pdf';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function Review({ form, screens, answers, lang, onEdit, onBack }: Props) {
  const [pdfState, setPdfState] = useState<'idle' | 'working' | 'error'>('idle');
  const onDownload = async () => {
    setPdfState('working');
    try {
      await downloadFilledPdf(answers);
      setPdfState('idle');
    } catch (e) {
      console.error(e);
      setPdfState('error');
    }
  };
  const optionLabel = (screen: Screen, value: string) =>
    screen.question.kind === 'choice' ? screen.question.options.find((o) => o.value === value)?.label : undefined;

  return (
    <section className="cm-card app-review">
      <div className="cm-card-eyebrow">
        <FormBadge form={form.number} title={`${lang === 'es' ? 'Edición' : 'Edition'} ${I765_EDITION}`} tone="soft" />
      </div>
      <h1 className="app-title">{ui.review[lang]}</h1>
      <p className="cm-card-why">
        {lang === 'es'
          ? 'Estas son sus respuestas, en el orden del formulario oficial. Debajo de cada pregunta dice dónde va en el formulario.'
          : 'These are your answers, in the order of the official form. Under each question it says where it goes on the form.'}
      </p>
      <div className="app-pdf no-print">
        <Notice tone="info" title={ui.pdfTitle[lang]}>
          {fmt(ui.pdfBody[lang], { edition: I765_EDITION })}
        </Notice>
        <Button block onClick={onDownload} disabled={pdfState === 'working'}>
          {pdfState === 'working' ? ui.preparingPdf[lang] : ui.downloadPdf[lang]}
        </Button>
        {pdfState === 'error' && <Notice tone="error">{ui.pdfError[lang]}</Notice>}
      </div>

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
          <li key={s}>{fmt(s, { edition: I765_EDITION })}</li>
        ))}
      </ol>
      <Notice tone="legal" title={ui.legalTitle[lang]}>{ui.legalBody[lang]}</Notice>

      <div className="cm-card-actions no-print">
        <Button variant="quiet" onClick={onBack}>{ui.back[lang]}</Button>
        <Button variant="secondary" onClick={() => window.print()}>{ui.print[lang]}</Button>
      </div>
    </section>
  );
}
