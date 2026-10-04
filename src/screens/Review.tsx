import { useEffect, useState } from 'react';
import { Button, FormBadge, Notice } from '../design/components';
import { fmt, ui, type Lang } from '../i18n';
import type { Answers, FormDefinition } from '../forms/types';
import { visibleItems, type Screen } from '../engine/flow';
import { spanishAnswers } from '../engine/language';
import { loadDocuments, type DocItem } from '../forms/documents';
import { DocChecklist } from './DocChecklist';
import { filingLinks } from '../forms/filing';
import { StudyLink } from './study/StudyLink';

interface Props {
  form: FormDefinition;
  screens: Screen[];
  answers: Answers;
  lang: Lang;
  onEdit: (screenIndex: number) => void;
  onBack: () => void;
}

function joinLabels(labels: { es: string; en: string }[]) {
  return labels.length ? { es: labels.map((l) => l.es).join(', '), en: labels.map((l) => l.en).join(', ') } : null;
}

const yesNo = { yes: { es: 'Sí', en: 'Yes' }, no: { es: 'No', en: 'No' } } as const;

async function downloadFilledPdf(form: FormDefinition, answers: Answers) {
  const [fill, template] = await Promise.all([
    form.pdf.load(),
    fetch(`${import.meta.env.BASE_URL}${form.pdf.path}`).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.arrayBuffer();
    }),
  ]);
  const bytes = await fill(template, answers);
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = form.pdf.fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Where and how to file, as links to the official pages (addresses and fees change often). */
function FilingSection({ form, lang }: { form: FormDefinition; lang: Lang }) {
  const { links, note } = filingLinks(form.id, form.number);
  return (
    <div className="app-filing">
      <h2 className="app-review-h">{ui.filingTitle[lang]}</h2>
      {note && <p className="cm-card-why">{note[lang]}</p>}
      <ul className="app-filing-list">
        {links.map((l) => (
          <li key={l.url}>
            <a href={l.url} target="_blank" rel="noopener noreferrer" className="app-filing-link">
              {l.label[lang]}
            </a>
            <span className="app-filing-url">{l.url.replace(/^https:\/\//, '')}</span>
            {l.detail && <span className="app-doc-detail">{l.detail[lang]}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Review({ form, screens, answers, lang, onEdit, onBack }: Props) {
  const [docs, setDocs] = useState<DocItem[] | null>(null);
  useEffect(() => {
    let live = true;
    loadDocuments(form.id)
      .then((d) => live && setDocs(d))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [form.id]);
  const [pdfState, setPdfState] = useState<'idle' | 'working' | 'error'>('idle');
  const onDownload = async () => {
    setPdfState('working');
    try {
      await downloadFilledPdf(form, answers);
      setPdfState('idle');
    } catch (e) {
      console.error(e);
      setPdfState('error');
    }
  };
  const vars = { edition: form.edition, sign: form.pdf.signHere[lang] };
  const spanish = new Set(spanishAnswers(screens, answers).map((a) => a.fieldId));

  return (
    <section className="cm-card app-review">
      <div className="cm-card-eyebrow">
        <FormBadge form={form.number} title={`${lang === 'es' ? 'Edición' : 'Edition'} ${form.edition}`} tone="soft" />
      </div>
      <h1 className="app-title">{ui.review[lang]}</h1>
      <p className="cm-card-why">
        {lang === 'es'
          ? 'Estas son sus respuestas, en el orden del formulario oficial. Debajo de cada pregunta dice dónde va en el formulario.'
          : 'These are your answers, in the order of the official form. Under each question it says where it goes on the form.'}
      </p>
      <div className="app-pdf no-print">
        {spanish.size > 0 && (
          <Notice tone="legal" title={ui.looksSpanishTitle[lang]}>
            {spanish.size === 1 ? ui.spanishInReviewOne[lang] : fmt(ui.spanishInReview[lang], { n: spanish.size })}
          </Notice>
        )}
        <Notice tone="info" title={ui.pdfTitle[lang]}>
          {fmt(ui.pdfBody[lang], vars)}
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
                const answer = (id: string) => (answers[id] && String(answers[id]) ? String(answers[id]) : null);
                const label = (opts: { value: string; label: { es: string; en: string } }[] | undefined, v: string | null) =>
                  v === null ? null : (opts?.find((o) => o.value === v)?.label ?? v);
                const items =
                  q.kind === 'choice'
                    ? [
                        {
                          key: q.id,
                          label: q.question[lang],
                          ref: q.formRef,
                          value: Array.isArray(answers[q.id])
                            ? joinLabels((answers[q.id] as string[]).map((v) => q.options.find((o) => o.value === v)?.label ?? { es: v, en: v }))
                            : label(q.options, answer(q.id)),
                        },
                      ]
                    : q.kind === 'yesNoList'
                      ? visibleItems(q, answers).map((it) => ({ key: it.id, label: it.label[lang], ref: it.formRef, value: answer(it.id) && yesNo[answer(it.id) as 'yes' | 'no'] }))
                      : q.fields.map((f) => ({ key: f.id, label: f.label[lang], ref: f.formRef, value: f.type === 'select' ? label(f.options, answer(f.id)) : answer(f.id) }));
                return items.map((it, n) => (
                  <div key={it.key} className="app-review-row">
                    <dt>
                      {it.label}
                      <span className="cm-label-en">{it.ref}</span>
                    </dt>
                    <dd>
                      {!it.value ? (
                        <span className="app-empty">{ui.notAnswered[lang]}</span>
                      ) : typeof it.value === 'string' ? (
                        <>
                          {it.value}
                          {spanish.has(it.key) && <span className="app-spanish no-print">{ui.spanishMark[lang]}</span>}
                        </>
                      ) : (
                        // Choices print in English (what goes on the form) with the chosen-language label beside it.
                        <>
                          {it.value.en}
                          {lang !== 'en' && <span className="cm-label-en">{it.value[lang]}</span>}
                        </>
                      )}
                    </dd>
                    {n === 0 && (
                      <dd className="app-edit-dd no-print">
                        <Button variant="quiet" className="app-edit" onClick={() => onEdit(i)}>
                          {ui.edit[lang]}
                        </Button>
                      </dd>
                    )}
                  </div>
                ));
              })}
            </dl>
          </div>
        );
      })}

      {docs && (
        <DocChecklist
          listId={form.id}
          lang={lang}
          rows={docs.filter((d) => !d.when || d.when(answers)).map((item) => ({ item }))}
        />
      )}

      <FilingSection form={form} lang={lang} />

      <h2 className="app-review-h">{lang === 'es' ? 'Siguientes pasos' : 'Next steps'}</h2>
      <ol className="app-steps">
        {form.nextSteps[lang].map((s) => (
          <li key={s}>{fmt(s, vars)}</li>
        ))}
      </ol>
      {form.id === 'n-400' && <StudyLink lang={lang} />}
      <Notice tone="legal" title={ui.legalTitle[lang]}>{ui.legalBody[lang]}</Notice>

      <div className="cm-card-actions no-print">
        <Button variant="quiet" onClick={onBack}>{ui.back[lang]}</Button>
        <Button variant="secondary" onClick={() => window.print()}>{ui.print[lang]}</Button>
      </div>
    </section>
  );
}
