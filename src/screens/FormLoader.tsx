import { useEffect, useState } from 'react';
import { Button, Notice } from '../design/components';
import { ui, type Lang } from '../i18n';
import type { FormMeta } from '../forms/catalog';
import type { FormDefinition } from '../forms/types';
import type { PackageDefinition } from '../forms/packages';
import { loadForm } from '../forms/load';
import { FormFlow } from './FormFlow';

/** Downloads one form's questions when it's opened, then shows it. */
export function FormLoader({ meta, pkg, lang }: { meta: FormMeta; pkg: PackageDefinition | null; lang: Lang }) {
  const [form, setForm] = useState<FormDefinition | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    setFailed(false);
    loadForm(meta.id)
      .then((f) => {
        if (live) setForm(f);
        // Fetch the official PDF now, quietly, so the service worker keeps it for offline use.
        fetch(`${import.meta.env.BASE_URL}${f.pdf.path}`).catch(() => {});
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [meta.id, attempt]);

  if (form) return <FormFlow form={form} pkg={pkg} lang={lang} />;
  return (
    <section className="cm-card" aria-busy={!failed}>
      <h1 className="app-title">{meta.title[lang]}</h1>
      {failed ? (
        <>
          <Notice tone="error">{ui.loadFailed[lang]}</Notice>
          <div className="cm-card-actions">
            <span />
            <Button onClick={() => setAttempt((n) => n + 1)}>{ui.retry[lang]}</Button>
          </div>
        </>
      ) : (
        <p className="cm-card-why" role="status">{ui.loading[lang]}</p>
      )}
    </section>
  );
}
