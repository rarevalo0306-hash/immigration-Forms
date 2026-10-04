import type { T } from '../i18n';
import { metaById } from './catalog';

/**
 * Where and how to file each form, as links to the official pages instead of copied addresses and
 * fees, which change often. Every form page on uscis.gov has a "Where to File" section; the pages
 * below were checked to exist (the I-765WS and I-130A have none of their own and go with their
 * main form).
 */
export interface FilingLink {
  label: T;
  url: string;
  detail?: T;
}

const USCIS = 'https://www.uscis.gov';

/** The uscis.gov page for forms filed with another form. */
const PAGE: Record<string, string> = { 'i-765ws': 'i-765', 'i-130a': 'i-130' };

/** Forms on USCIS's "Forms Available to File Online" list (for at least some cases). */
const ONLINE = new Set([
  'ar-11', 'i-90', 'i-129f', 'i-130', 'i-131', 'i-131a', 'i-360', 'i-485', 'i-539', 'i-589', 'i-730', 'i-751',
  'i-765', 'i-821', 'i-821d', 'i-864', 'i-912', 'i-918', 'n-336', 'n-400', 'n-565', 'n-600',
]);

const t = (es: string, en: string): T => ({ es, en });

const EXTRA: Record<string, FilingLink[]> = {
  'i-589': [
    {
      label: t('Si está en corte de inmigración: encuentre su corte', 'If you are in immigration court: find your court'),
      url: 'https://www.justice.gov/eoir/find-immigration-court-and-access-internet-based-hearings',
      detail: t('En ese caso el I-589 se presenta ante el juez, no ante USCIS.', 'In that case the I-589 is filed with the judge, not with USCIS.'),
    },
  ],
  'ar-11': [
    {
      label: t('Cambie su dirección en línea', 'Change your address online'),
      url: `${USCIS}/addresschange`,
      detail: t('Es gratis y actualiza también sus casos pendientes.', 'It’s free and also updates your pending cases.'),
    },
  ],
};

const NOTES: Record<string, T> = {
  'i-765ws': t('Va dentro del paquete del I-765, a la misma dirección.', 'It goes inside the I-765 package, to the same address.'),
  'i-130a': t('Va junto con el I-130, a la misma dirección.', 'It goes with the I-130, to the same address.'),
  'g-1145': t('No se envía solo: va encima del formulario principal, a la dirección de ese formulario.', 'It isn’t filed alone: it goes on top of the main form, to that form’s address.'),
  'i-864': t('Si su caso ya está en el Centro Nacional de Visas (NVC), se sube al portal del NVC (ceac.state.gov) en vez de enviarlo a USCIS.', 'If your case is already at the National Visa Center (NVC), upload it to the NVC portal (ceac.state.gov) instead of sending it to USCIS.'),
  'i-864ez': t('Si su caso ya está en el Centro Nacional de Visas (NVC), se sube al portal del NVC (ceac.state.gov) en vez de enviarlo a USCIS.', 'If your case is already at the National Visa Center (NVC), upload it to the NVC portal (ceac.state.gov) instead of sending it to USCIS.'),
  'i-864a': t('Va junto con el I-864 del patrocinador, a donde se envíe ese formulario.', 'It goes with the sponsor’s I-864, wherever that form is sent.'),
};

/** The uscis.gov page (path after the domain) that carries a form's edition and filing details. */
export const pageFor = (formId: string) => PAGE[formId] ?? formId;

export function filingLinks(formId: string, formNumber: string): { links: FilingLink[]; note?: T } {
  const page = pageFor(formId);
  const links: FilingLink[] = [
    {
      label: t(`Dónde enviarlo: página oficial del ${page.toUpperCase()}`, `Where to file: the official ${page.toUpperCase()} page`),
      url: `${USCIS}/${page}`,
      detail: t(
        'Busque la sección "Where to File" (Dónde presentar): la dirección depende de su categoría y de dónde vive. Ahí también está la edición vigente y las instrucciones.',
        'Look for the "Where to File" section: the address depends on your category and where you live. The current edition and the instructions are there too.',
      ),
    },
  ];
  if (metaById(formId)?.fee)
    links.push({
      label: t('Cuánto pagar: calculadora de tarifas de USCIS', 'How much to pay: the USCIS fee calculator'),
      url: `${USCIS}/feecalculator`,
      detail: t(`Elija el ${formNumber} y su categoría.`, `Choose ${formNumber} and your category.`),
    });
  if (ONLINE.has(formId))
    links.push({
      label: t('Puede presentarlo en línea en algunos casos', 'You may be able to file it online'),
      url: `${USCIS}/file-online/forms-available-to-file-online`,
      detail: t(
        'Con una cuenta gratis de USCIS; a veces cuesta menos. En línea no se usa el PDF: copie sus datos de esta hoja de respuestas.',
        'With a free USCIS account; it sometimes costs less. Online you don’t use the PDF: copy your details from this answer sheet.',
      ),
    });
  return { links: [...links, ...(EXTRA[formId] ?? [])], note: NOTES[formId] };
}
