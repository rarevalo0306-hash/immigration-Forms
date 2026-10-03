import { useState } from 'react';
import { Button, SelectField, TextField } from '../design/components';
import { fmt, ui, type Lang } from '../i18n';
import { activeCase, createCase, deleteCase, listCases, renameCase, setActiveCase, type CaseInfo } from '../storage';

export const caseName = (c: CaseInfo, lang: Lang) => c.name || ui.myCase[lang];

/** Pick, create, rename or delete the case (person) the forms are for. */
export function Cases({ lang, onChange }: { lang: Lang; onChange: () => void }) {
  const cases = listCases();
  const active = activeCase();
  const [mode, setMode] = useState<'idle' | 'new' | 'rename'>('idle');
  const [name, setName] = useState('');
  const [error, setError] = useState(false);

  const open = (m: 'new' | 'rename') => {
    setMode(m);
    setName(m === 'rename' ? active.name : '');
    setError(false);
  };
  const submit = () => {
    if (!name.trim()) return setError(true);
    if (mode === 'new') createCase(name);
    else renameCase(active.id, name);
    setMode('idle');
    onChange();
  };

  return (
    <section className="cm-card app-cases" aria-labelledby="cases-h">
      <h2 id="cases-h" className="app-review-h">{ui.casesTitle[lang]}</h2>
      <p className="cm-card-why">{ui.casesBody[lang]}</p>
      {cases.length > 1 ? (
        <SelectField
          id="case-select"
          label={ui.caseLabel[lang]}
          value={active.id}
          onChange={(id) => {
            setActiveCase(id);
            setMode('idle');
            onChange();
          }}
          options={cases.map((c) => ({ value: c.id, label: caseName(c, lang) }))}
        />
      ) : (
        <p className="app-form-meta">{fmt(ui.caseActive[lang], { name: caseName(active, lang) })}</p>
      )}
      {mode === 'idle' ? (
        <div className="app-mydata-actions">
          <Button variant="secondary" onClick={() => open('new')}>{ui.caseNew[lang]}</Button>
          <Button variant="quiet" onClick={() => open('rename')}>{ui.caseRename[lang]}</Button>
          {cases.length > 1 && (
            <Button
              variant="quiet"
              onClick={() => {
                if (!window.confirm(fmt(ui.confirmDeleteCase[lang], { name: caseName(active, lang) }))) return;
                deleteCase(active.id);
                onChange();
              }}
            >
              {ui.caseDelete[lang]}
            </Button>
          )}
        </div>
      ) : (
        <form
          className="app-fields"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <TextField
            id="case-name"
            label={ui.caseName[lang]}
            value={name}
            maxLength={60}
            autoFocus
            error={error ? ui.caseNameNeeded[lang] : undefined}
            onChange={(e) => {
              setName(e.target.value);
              setError(false);
            }}
          />
          <div className="app-mydata-actions">
            <Button type="submit">{mode === 'new' ? ui.caseCreate[lang] : ui.caseSave[lang]}</Button>
            <Button variant="quiet" onClick={() => setMode('idle')}>{ui.caseCancel[lang]}</Button>
          </div>
        </form>
      )}
    </section>
  );
}
