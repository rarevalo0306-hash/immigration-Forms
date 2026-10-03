import { useState } from 'react';
import { FormBadge, Notice } from '../design/components';
import { MyData } from './MyData';
import { Cases } from './Cases';
import { fmt, ui, type Lang } from '../i18n';
import type { FormDefinition } from '../forms/types';
import { load } from '../storage';
import { packages } from '../forms/packages';
import { progressOf } from '../engine/packages';
import { packageHref, statusOf } from './Package';

export function Home({ forms, lang }: { forms: FormDefinition[]; lang: Lang }) {
  // Re-rendering after a backup is loaded or the data is erased re-reads what is saved.
  const [, setVersion] = useState(0);
  return (
    <div className="app-home">
      <section className="app-home-intro">
        <h1 className="app-title">{lang === 'es' ? '¿Qué formulario necesita llenar?' : 'Which form do you need to fill in?'}</h1>
        <p className="cm-card-why">
          {lang === 'es'
            ? 'Le hacemos una pregunta a la vez, en español o inglés, y al final descarga el formulario oficial de USCIS ya lleno.'
            : 'We ask one question at a time, in Spanish or English, and at the end you download the official USCIS form already filled in.'}
        </p>
      </section>
      <Cases lang={lang} onChange={() => setVersion((v) => v + 1)} />
      <h2 className="app-home-h">{lang === 'es' ? 'Paquetes: todo lo de un trámite' : 'Packages: everything for one case'}</h2>
      <p className="cm-card-why">
        {lang === 'es'
          ? 'Los formularios que su caso necesita, en orden. Lo que escriba en uno ya aparece en los siguientes.'
          : 'The forms your case needs, in order. What you write in one already shows up in the next ones.'}
      </p>
      <ul className="app-form-list">
        {packages.map((p) => {
          const { done, total } = progressOf(p, statusOf);
          return (
            <li key={p.id}>
              <a className="cm-card app-form-card" href={packageHref(p)}>
                <FormBadge form={ui.packageWord[lang]} title={done ? fmt(ui.packageProgress[lang], { done, total }) : undefined} tone={done ? 'soft' : 'ink'} />
                <span className="app-form-title">{p.title[lang]}</span>
                <span className="cm-card-why">{p.summary[lang]}</span>
              </a>
            </li>
          );
        })}
      </ul>
      <h2 className="app-home-h">{lang === 'es' ? 'Formularios uno por uno' : 'Forms one by one'}</h2>
      <ul className="app-form-list">
        {forms.map((f) => {
          const started = Object.keys(load(f.id)?.answers ?? {}).length > 0;
          return (
            <li key={f.id}>
              <a className="cm-card app-form-card" href={`#${f.id}`}>
                <FormBadge form={f.number} title={started ? (lang === 'es' ? 'En progreso' : 'In progress') : undefined} tone={started ? 'soft' : 'ink'} />
                <span className="app-form-title">{f.title[lang]}</span>
                <span className="cm-card-why">{f.summary[lang]}</span>
                <span className="app-form-meta">
                  {lang === 'es' ? `Unos ${f.minutes} minutos · Edición ${f.edition}` : `About ${f.minutes} minutes · Edition ${f.edition}`}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
      <MyData formIds={forms.map((f) => f.id)} lang={lang} onChange={() => setVersion((v) => v + 1)} />
      <Notice tone="legal" title={ui.legalTitle[lang]}>{ui.legalBody[lang]}</Notice>
    </div>
  );
}
