import { FormBadge, Notice } from '../design/components';
import { ui, type Lang } from '../i18n';
import type { FormDefinition } from '../forms/types';
import { load } from '../storage';

export function Home({ forms, lang }: { forms: FormDefinition[]; lang: Lang }) {
  return (
    <>
      <section className="app-home-intro">
        <h1 className="app-title">{lang === 'es' ? '¿Qué formulario necesita llenar?' : 'Which form do you need to fill in?'}</h1>
        <p className="cm-card-why">
          {lang === 'es'
            ? 'Le hacemos una pregunta a la vez, en español o inglés, y al final descarga el formulario oficial de USCIS ya lleno.'
            : 'We ask one question at a time, in Spanish or English, and at the end you download the official USCIS form already filled in.'}
        </p>
      </section>
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
      <Notice tone="legal" title={ui.legalTitle[lang]}>{ui.legalBody[lang]}</Notice>
    </>
  );
}
