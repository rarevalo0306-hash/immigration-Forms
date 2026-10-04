import { useRef, useState } from 'react';
import { Button, Notice } from '../design/components';
import { fmt, ui, type Lang } from '../i18n';
import { backupFileName, makeBackup, parseBackup } from '../engine/backup';
import { activeCase, clearAll, exportAll, exportChecked, importAll, saveChecked } from '../storage';
import { packages } from '../forms/packages';

/** Backup, restore and erase every form's answers on this device. */
const formsWord = (n: number, lang: Lang) => (n === 1 ? ui.formsOne[lang] : fmt(ui.formsCount[lang], { n }));

export function MyData({ formIds, lang, onChange }: { formIds: string[]; lang: Lang; onChange: () => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ tone: 'info' | 'error'; text: string } | null>(null);
  const saved = exportAll(formIds);
  // Checklists are per form and per package (`pkg-<id>`).
  const listIds = [...formIds, ...packages.map((p) => `pkg-${p.id}`)];
  const count = Object.keys(saved).length;

  const download = () => {
    const blob = new Blob([JSON.stringify(makeBackup(saved, new Date(), exportChecked(listIds)), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = backupFileName(new Date(), activeCase().name);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const load = async (file: File) => {
    const parsed = parseBackup(await file.text(), formIds, listIds);
    if (!parsed.ok) return setMessage({ tone: 'error', text: ui.importBad[lang] });
    const n = Object.keys(parsed.forms).length;
    if (!n) return setMessage({ tone: 'error', text: ui.importBad[lang] });
    if (!window.confirm(fmt(ui.confirmImport[lang], { forms: formsWord(n, lang) }))) return;
    if (!importAll(parsed.forms)) return setMessage({ tone: 'error', text: ui.importFailed[lang] });
    for (const [id, ticks] of Object.entries(parsed.checklists)) saveChecked(id, ticks);
    const skipped = parsed.skipped.length ? ` ${fmt(ui.importSkipped[lang], { forms: formsWord(parsed.skipped.length, lang) })}` : '';
    setMessage({ tone: 'info', text: fmt(ui.importDone[lang], { forms: formsWord(n, lang) }) + skipped });
    onChange();
  };

  const erase = () => {
    if (!window.confirm(ui.confirmClearAll[lang])) return;
    clearAll();
    setMessage({ tone: 'info', text: ui.clearDone[lang] });
    onChange();
  };

  return (
    <section className="cm-card app-mydata" aria-labelledby="mydata-h">
      <h2 id="mydata-h" className="app-review-h">{ui.myDataTitle[lang]}</h2>
      <p className="cm-card-why">{ui.myDataBody[lang]}</p>
      <p className="app-form-meta">{count ? fmt(ui.myDataCount[lang], { forms: formsWord(count, lang) }) : ui.myDataNone[lang]}</p>
      <Notice tone="legal" title={ui.myDataCautionTitle[lang]}>{ui.myDataCaution[lang]}</Notice>
      {message && (
        <div role="status">
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      )}
      <div className="app-mydata-actions">
        <Button variant="secondary" onClick={download} disabled={!count}>{ui.backupDownload[lang]}</Button>
        <Button variant="secondary" onClick={() => fileInput.current?.click()}>{ui.backupLoad[lang]}</Button>
        <Button variant="quiet" onClick={erase} disabled={!count}>{ui.clearAllButton[lang]}</Button>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) void load(f);
        }}
      />
    </section>
  );
}
