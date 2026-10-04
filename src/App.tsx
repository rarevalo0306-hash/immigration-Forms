import { useEffect, useState } from 'react';
import { LanguageToggle } from './design/components';
import { ui, type Lang } from './i18n';
import { catalog, metaById } from './forms/catalog';
import { loadLang, saveLang } from './storage';
import { Home } from './screens/Home';
import { FormLoader } from './screens/FormLoader';
import { Package } from './screens/Package';
import { packageById } from './forms/packages';

/**
 * What the URL hash points to, so a link or the back button lands on the right screen:
 * a form (#n-400), a package (#paquete/matrimonio) or a form opened from a package (#i-130?paquete=matrimonio).
 */
function routeFromHash() {
  const [path, query = ''] = window.location.hash.replace(/^#\/?/, '').split('?');
  const pkg = path.startsWith('paquete/') ? packageById(path.slice(8)) : packageById(new URLSearchParams(query).get('paquete') ?? '');
  return { form: metaById(path), pkg: pkg ?? null };
}

export function App() {
  const [lang, setLang] = useState<Lang>(() => loadLang() ?? 'es');
  const [{ form, pkg }, setRoute] = useState(routeFromHash);

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

  return (
    <div className="app">
      <header className="app-header no-print">
        <a className="app-brand" href="#">
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
      <main className="app-main">
        {form ? (
          <FormLoader key={`${form.id}:${pkg?.id ?? ''}`} meta={form} pkg={pkg} lang={lang} />
        ) : pkg ? (
          <Package key={pkg.id} pkg={pkg} lang={lang} />
        ) : (
          <Home forms={catalog} lang={lang} />
        )}
      </main>
    </div>
  );
}
