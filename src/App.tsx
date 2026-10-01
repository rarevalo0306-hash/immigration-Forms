import { useEffect, useState } from 'react';
import { LanguageToggle } from './design/components';
import { ui, type Lang } from './i18n';
import { forms, formById } from './forms';
import { loadLang, saveLang } from './storage';
import { Home } from './screens/Home';
import { FormFlow } from './screens/FormFlow';

/** The form in the URL hash (#n-400), so a link or the back button lands on the right form. */
function formFromHash() {
  return formById(window.location.hash.replace(/^#\/?/, ''));
}

export function App() {
  const [lang, setLang] = useState<Lang>(() => loadLang() ?? 'es');
  const [form, setForm] = useState(formFromHash);

  useEffect(() => {
    document.documentElement.lang = lang;
    saveLang(lang);
  }, [lang]);

  useEffect(() => {
    const onHash = () => setForm(formFromHash());
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
        {form ? <FormFlow key={form.id} form={form} lang={lang} /> : <Home forms={forms} lang={lang} />}
      </main>
    </div>
  );
}
