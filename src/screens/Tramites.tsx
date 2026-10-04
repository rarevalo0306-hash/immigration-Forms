import { useState } from 'react';
import { FormBadge } from '../design/components';
import { SearchIcon } from '../design/icons';
import { fmt, ui, type Lang } from '../i18n';
import { metaById, type FormMeta } from '../forms/catalog';
import { categories } from '../forms/categories';
import { packages } from '../forms/packages';
import { progressOf } from '../engine/packages';
import { plain } from '../engine/recommend';
import { load } from '../storage';
import { packageHref, statusOf } from './Package';
import { searchHref } from './Assistant';

/** Every package and form, grouped by topic, with a box to filter them by words or number. */
export function Tramites({ lang }: { lang: Lang }) {
  const [query, setQuery] = useState('');
  const words = plain(query).split(' ').filter(Boolean);
  const matches = (...texts: string[]) => {
    const hay = plain(texts.join(' ')).replace(/-/g, '');
    return words.every((w) => hay.includes(w.replace(/-/g, '')));
  };
  const pkgs = packages.filter((p) => matches(p.title.es, p.title.en, p.summary.es, p.summary.en));
  const groups = categories
    .map((c) => ({
      c,
      forms: c.formIds
        .map(metaById)
        .filter((f): f is FormMeta => !!f && matches(f.number, f.title.es, f.title.en, f.summary.es, f.summary.en, c.title.es, c.title.en)),
    }))
    .filter((g) => g.forms.length);
  const none = !pkgs.length && !groups.length;

  return (
    <div className="app-tramites">
      <h1 className="app-title">{lang === 'es' ? 'Todos los trámites' : 'Every case'}</h1>
      <label className="app-filter cm-glass">
        <SearchIcon />
        <input
          type="search"
          className="app-filter-input"
          aria-label={lang === 'es' ? 'Buscar un trámite o formulario' : 'Search a case or form'}
          placeholder={lang === 'es' ? 'Buscar: «trabajo», «I-130», «asilo»…' : 'Search: "work", "I-130", "asylum"…'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      {none && (
        <p className="cm-card-why" role="status">
          {lang === 'es' ? 'Nada coincide con esa búsqueda. ' : 'Nothing matches that search. '}
          <a href={searchHref(query)}>{lang === 'es' ? 'Pregúntele al asistente' : 'Ask the assistant'}</a>
        </p>
      )}
      {pkgs.length > 0 && (
        <section aria-labelledby="pk-h" className="app-group">
          <h2 id="pk-h" className="app-group-h">{lang === 'es' ? 'Paquetes: todo un trámite en orden' : 'Packages: a whole case, in order'}</h2>
          <ul className="app-grid">
            {pkgs.map((p) => {
              const { done, total } = progressOf(p, statusOf);
              return (
                <li key={p.id}>
                  <a className="app-item cm-glass app-item--pkg" href={packageHref(p)}>
                    <FormBadge form={ui.packageWord[lang]} title={done ? fmt(ui.packageProgress[lang], { done, total }) : undefined} tone={done ? 'soft' : 'ink'} />
                    <span className="app-item-title">{p.title[lang]}</span>
                    <span className="app-item-sub">{p.summary[lang]}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {groups.map(({ c, forms }) => (
        <section key={c.id} aria-labelledby={`cat-${c.id}`} className="app-group">
          <h2 id={`cat-${c.id}`} className="app-group-h">{c.title[lang]}</h2>
          <ul className="app-grid">
            {forms.map((f) => {
              const s = load(f.id);
              const started = !!s && Object.keys(s.answers).length > 0;
              return (
                <li key={f.id}>
                  <a className="app-item cm-glass" href={`#${f.id}`}>
                    <FormBadge
                      form={f.number}
                      title={started ? (s?.done ? (lang === 'es' ? 'Listo' : 'Ready') : lang === 'es' ? 'En progreso' : 'In progress') : undefined}
                      tone={started ? 'soft' : 'ink'}
                    />
                    <span className="app-item-title">{f.title[lang]}</span>
                    <span className="app-item-sub">{f.summary[lang]}</span>
                    <span className="app-item-meta">
                      {lang === 'es' ? `Unos ${f.minutes} minutos · Edición ${f.edition}` : `About ${f.minutes} minutes · Edition ${f.edition}`}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
