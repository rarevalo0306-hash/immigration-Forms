import { useState } from 'react';
import { Notice } from '../design/components';
import { ui, type Lang } from '../i18n';
import { catalog } from '../forms/catalog';
import { Cases } from './Cases';
import { MyData } from './MyData';

/** Who the forms are for, and the backup, restore and erase of everything saved on the device. */
export function MisDatos({ lang }: { lang: Lang }) {
  // Re-rendering after a backup is loaded, a case changes or the data is erased re-reads what is saved.
  const [, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);
  return (
    <div className="app-home">
      <h1 className="app-title">{lang === 'es' ? 'Mis datos' : 'My data'}</h1>
      <Cases lang={lang} onChange={bump} />
      <MyData formIds={catalog.map((f) => f.id)} lang={lang} onChange={bump} />
      <Notice tone="legal" title={ui.legalTitle[lang]}>{ui.legalBody[lang]}</Notice>
    </div>
  );
}
