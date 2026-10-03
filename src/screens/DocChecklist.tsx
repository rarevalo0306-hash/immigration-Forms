import { useState } from 'react';
import { ui, type Lang } from '../i18n';
import type { DocItem } from '../forms/documents/types';
import { loadChecked, saveChecked } from '../storage';

export interface ChecklistRow {
  item: DocItem;
  /** Form numbers that ask for it, shown on a package's combined list. */
  forms?: string[];
}

/** Documents to gather, with boxes to tick; ticks are saved per list and print with the page. */
export function DocChecklist({ listId, rows, lang, intro }: { listId: string; rows: ChecklistRow[]; lang: Lang; intro?: string }) {
  const [checked, setChecked] = useState(() => new Set(loadChecked(listId)));
  if (!rows.length) return null;
  const toggle = (id: string) => {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setChecked(next);
    saveChecked(listId, [...next]);
  };
  const done = rows.filter((r) => checked.has(r.item.id)).length;
  return (
    <div className="app-docs">
      <h2 className="app-review-h">{ui.docsTitle[lang]}</h2>
      <p className="cm-card-why">{intro ?? ui.docsIntro[lang]}</p>
      <p className="app-form-meta">{ui.docsProgress[lang].replace('{done}', String(done)).replace('{total}', String(rows.length))}</p>
      <ul className="app-docs-list">
        {rows.map(({ item, forms }) => (
          <li key={item.id}>
            <label className="app-doc">
              <input type="checkbox" checked={checked.has(item.id)} onChange={() => toggle(item.id)} />
              <span>
                <span className="app-doc-label">{item.label[lang]}</span>
                {item.detail && <span className="app-doc-detail">{item.detail[lang]}</span>}
                {forms && <span className="app-doc-forms">{forms.join(', ')}</span>}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
