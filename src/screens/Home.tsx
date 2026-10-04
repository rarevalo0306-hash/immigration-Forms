import { Notice } from '../design/components';
import { ArrowRightIcon, BookIcon, GridIcon } from '../design/icons';
import { fmt, ui, type Lang } from '../i18n';
import type { FormMeta } from '../forms/catalog';
import { activeCase, listCases, load } from '../storage';
import { packages } from '../forms/packages';
import { caseName } from './Cases';
import { Composer, SUGGESTIONS, searchHref } from './Assistant';

/** The form worked on most recently in this case, to pick it back up from the home screen. */
function lastForm(forms: FormMeta[]) {
  let best: { meta: FormMeta; updated: number; done: boolean; share: number | null } | null = null;
  for (const meta of forms) {
    const s = load(meta.id);
    if (!s || !Object.keys(s.answers).length) continue;
    const updated = s.updated ?? 0;
    if (best && best.updated >= updated) continue;
    const share = s.done ? 1 : s.total ? Math.min(1, s.position / s.total) : null;
    best = { meta, updated, done: !!s.done, share };
  }
  return best;
}

export function Home({ forms, lang }: { forms: FormMeta[]; lang: Lang }) {
  const last = lastForm(forms);
  const go = (q: string) => (window.location.hash = searchHref(q).slice(1));
  return (
    <div className="app-home2">
      <section className="app-hero" aria-labelledby="hero-h">
        {listCases().length > 1 && (
          <p className="app-case-banner">
            {fmt(ui.caseActive[lang], { name: caseName(activeCase(), lang) })} · <a href="#datos">{ui.caseChange[lang]}</a>
          </p>
        )}
        <h1 id="hero-h" className="app-hero-title">
          {lang === 'es' ? 'Hola, ¿en qué le ayudo hoy?' : 'Hi, how can I help you today?'}
        </h1>
        <Composer big lang={lang} onSend={go} />
        <ul className="app-chips" aria-label={lang === 'es' ? 'Ejemplos' : 'Examples'}>
          {SUGGESTIONS.slice(0, 5).map((s) => (
            <li key={s.es}>
              <a className="app-chip cm-glass" href={searchHref(s[lang])}>
                {s[lang]}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="app-bento" aria-label={lang === 'es' ? 'Atajos' : 'Shortcuts'}>
        {last ? (
          <a className="app-tile app-tile--wide cm-glass" href={`#${last.meta.id}`}>
            <span className="app-tile-eyebrow">{last.done ? (lang === 'es' ? 'Listo para descargar' : 'Ready to download') : lang === 'es' ? 'Continuar' : 'Continue'}</span>
            <span className="app-tile-title">
              {last.meta.number} · {last.meta.title[lang]}
            </span>
            {last.share !== null && (
              <span className="app-bar" role="img" aria-label={`${Math.round(last.share * 100)}%`}>
                <i style={{ width: `${Math.max(4, last.share * 100)}%` }} />
              </span>
            )}
            <span className="app-tile-sub">
              {last.done
                ? lang === 'es'
                  ? 'Revise sus respuestas y descargue el PDF'
                  : 'Check your answers and download the PDF'
                : lang === 'es'
                  ? 'Siga donde lo dejó'
                  : 'Pick up where you left off'}
            </span>
          </a>
        ) : (
          <div className="app-tile app-tile--wide cm-glass">
            <span className="app-tile-eyebrow">{lang === 'es' ? 'Así funciona' : 'How it works'}</span>
            <ol className="app-howto">
              <li>{lang === 'es' ? 'Cuénteme su caso y le digo qué formularios necesita.' : 'Tell me your case and I’ll tell you which forms you need.'}</li>
              <li>{lang === 'es' ? 'Conteste una pregunta a la vez, en español.' : 'Answer one question at a time, in Spanish or English.'}</li>
              <li>{lang === 'es' ? 'Descargue el formulario oficial ya lleno.' : 'Download the official form, already filled in.'}</li>
            </ol>
          </div>
        )}
        <a className="app-tile cm-glass" href="#estudiar">
          <span className="app-tile-icon" aria-hidden="true">
            <BookIcon />
          </span>
          <span className="app-tile-title">{lang === 'es' ? 'Estudiar ciudadanía' : 'Citizenship study'}</span>
          <span className="app-tile-sub">{lang === 'es' ? 'Tarjetas y simulacro de entrevista' : 'Flash cards and practice interview'}</span>
        </a>
        <a className="app-tile cm-glass" href="#tramites">
          <span className="app-tile-icon app-tile-icon--gold" aria-hidden="true">
            <GridIcon />
          </span>
          <span className="app-tile-title">{lang === 'es' ? 'Todos los trámites' : 'Every case'}</span>
          <span className="app-tile-sub">
            {lang === 'es' ? `${packages.length} paquetes · ${forms.length} formularios` : `${packages.length} packages · ${forms.length} forms`}
          </span>
        </a>
        <a className="app-tile app-tile--wide app-tile--row cm-glass" href="#datos">
          <span className="app-tile-text">
            <span className="app-tile-title">{lang === 'es' ? 'Sus datos son privados' : 'Your data is private'}</span>
            <span className="app-tile-sub">
              {lang === 'es' ? 'Se quedan en este dispositivo. Guarde una copia o borre todo en «Mis datos».' : 'It stays on this device. Save a copy or erase it all in "My data".'}
            </span>
          </span>
          <ArrowRightIcon />
        </a>
      </section>

      <div className="app-home-legal">
        <Notice tone="legal" title={ui.legalTitle[lang]}>{ui.legalBody[lang]}</Notice>
      </div>
    </div>
  );
}
