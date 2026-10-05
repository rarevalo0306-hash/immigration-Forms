import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { LanguageToggle } from './design/components';
import { BookIcon, HomeIcon, SparkIcon, UserIcon } from './design/icons';
import { ui, type Lang } from './i18n';
import { catalog, metaById } from './forms/catalog';
import { loadLang, saveLang } from './storage';
import { Home } from './screens/Home';
import { FormLoader } from './screens/FormLoader';
import { Package } from './screens/Package';
import { Assistant } from './screens/Assistant';
import { Tramites } from './screens/Tramites';
import { MisDatos } from './screens/MisDatos';
import { PaymentReturn } from './screens/Paywall';
import { packageById } from './forms/packages';
import { studyView, type StudyView } from './screens/study/route';

// The study section loads only when opened, like each form.
const Study = lazy(() => import('./screens/study/Study'));

type Page = 'home' | 'buscar' | 'tramites' | 'datos' | 'pago';

interface Route {
  form: ReturnType<typeof metaById>;
  pkg: NonNullable<ReturnType<typeof packageById>> | null;
  study: StudyView | null;
  page: Page | null;
  q: string;
  query: URLSearchParams;
}

/**
 * What the URL hash points to, so a link or the back button lands on the right screen:
 * a form (#n-400), a package (#paquete/matrimonio), a form opened from a package (#i-130?paquete=matrimonio),
 * the citizenship study section (#estudiar, #estudiar/tarjetas…), the assistant (#buscar?q=…),
 * every case (#tramites) or the person's data (#datos). Anything else is the home screen.
 */
function routeFromHash(): Route {
  const [path, query = ''] = window.location.hash.replace(/^#\/?/, '').split('?');
  const params = new URLSearchParams(query);
  const none = { form: null, pkg: null, study: null, page: null, q: '', query: params };
  if (path === 'estudiar' || path.startsWith('estudiar/')) return { ...none, study: studyView(path) };
  if (path === 'buscar') return { ...none, page: 'buscar', q: params.get('q') ?? '' };
  if (path === 'tramites' || path === 'datos' || path === 'pago') return { ...none, page: path };
  const pkg = path.startsWith('paquete/') ? packageById(path.slice(8)) : packageById(params.get('paquete') ?? '');
  const form = metaById(path);
  return { ...none, form, pkg: pkg ?? null, page: !form && !pkg ? 'home' : null };
}

const TABS: { id: 'home' | 'buscar' | 'estudiar' | 'datos'; href: string; label: Record<Lang, string>; icon: ReactNode }[] = [
  { id: 'home', href: '#', label: { es: 'Inicio', en: 'Home' }, icon: <HomeIcon /> },
  { id: 'buscar', href: '#buscar', label: { es: 'Asistente', en: 'Assistant' }, icon: <SparkIcon /> },
  { id: 'estudiar', href: '#estudiar', label: { es: 'Estudiar', en: 'Study' }, icon: <BookIcon /> },
  { id: 'datos', href: '#datos', label: { es: 'Mis datos', en: 'My data' }, icon: <UserIcon /> },
];

export function App() {
  const [lang, setLang] = useState<Lang>(() => loadLang() ?? 'es');
  const [route, setRoute] = useState(routeFromHash);
  const { form, pkg, study, page, q, query } = route;

  useEffect(() => {
    document.documentElement.lang = lang;
    saveLang(lang);
  }, [lang]);

  useEffect(() => {
    const onHash = () => {
      setRoute(routeFromHash());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Inside a form the tab bar steps aside, so the question and its buttons have the whole screen.
  const inForm = !!form;
  const tab = study !== null ? 'estudiar' : page === 'tramites' ? 'home' : page;
  const wide = page === 'home' || page === 'tramites';

  return (
    <div className={`app${inForm ? ' app--form' : ''}`}>
      <div className="app-mesh" aria-hidden="true" />
      <header className="app-header no-print">
        <a className="app-brand" href="#">
          <img className="app-brand-mark" src="icons/icon.svg" alt="" width={30} height={30} />
          {ui.appName[lang]}
        </a>
        <LanguageToggle<Lang>
          value={lang}
          onChange={setLang}
          languages={[
            { value: 'es', label: 'ES' },
            { value: 'en', label: 'EN' },
          ]}
        />
      </header>
      {/* Outside the header: its backdrop blur would make a fixed child stick to it instead of the screen. */}
      {!inForm && (
        <nav className="app-tabs no-print" aria-label={lang === 'es' ? 'Principal' : 'Main'}>
          {TABS.map((t) => (
            <a key={t.id} className="app-tab" href={t.href} aria-current={tab === t.id ? 'page' : undefined}>
              {t.icon}
              <span>{t.label[lang]}</span>
            </a>
          ))}
        </nav>
      )}
      <main className={`app-main${wide ? ' app-main--wide' : ''}`}>
        {study !== null ? (
          <Suspense fallback={<p role="status">{ui.loading[lang]}</p>}>
            <Study key={study} view={study} lang={lang} />
          </Suspense>
        ) : form ? (
          <FormLoader key={`${form.id}:${pkg?.id ?? ''}`} meta={form} pkg={pkg} lang={lang} />
        ) : pkg ? (
          <Package key={pkg.id} pkg={pkg} lang={lang} />
        ) : page === 'buscar' ? (
          <Assistant key={q} lang={lang} initial={q} />
        ) : page === 'tramites' ? (
          <Tramites lang={lang} />
        ) : page === 'pago' ? (
          <PaymentReturn lang={lang} query={query} />
        ) : page === 'datos' ? (
          <MisDatos lang={lang} />
        ) : (
          <Home forms={catalog} lang={lang} />
        )}
      </main>
    </div>
  );
}
