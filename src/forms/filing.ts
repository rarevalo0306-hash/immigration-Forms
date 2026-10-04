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
const PAGE: Record<string, string> = { 'i-765ws': 'i-765', 'i-130a': 'i-130', 'i-539a': 'i-539', 'i-918supa': 'i-918', 'i-914supa': 'i-914' };

/** Forms that aren't USCIS's: their official page is elsewhere, and it shows no edition date. */
const OTHER_SITE: Record<string, FilingLink> = {
  'eoir-33': {
    label: { es: 'Formularios oficiales de la corte de inmigración (EOIR)', en: 'Official immigration court (EOIR) forms' },
    url: 'https://www.justice.gov/eoir/eoir-forms',
    detail: {
      es: 'El original va a la corte de inmigración donde está su caso, y una copia a los abogados de ICE (OPLA), dentro de 5 días hábiles después de mudarse. Ahí está la versión vigente del formulario.',
      en: 'The original goes to the immigration court handling your case, and a copy to ICE’s attorneys (OPLA), within 5 working days of moving. The current version of the form is there.',
    },
  },
};

/** Whether the form's official page is on uscis.gov (where the weekly edition check reads it). */
export const onUscis = (formId: string) => !OTHER_SITE[formId];

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
  'eoir-33': [
    {
      label: t('Encuentre la dirección de su corte', 'Find your court’s address'),
      url: 'https://www.justice.gov/eoir/find-immigration-court-and-access-internet-based-hearings',
    },
    {
      label: t('O cambie su dirección en línea: Portal del Demandado (Respondent Access)', 'Or change your address online: the Respondent Access Portal'),
      url: 'https://respondentaccess.eoir.justice.gov/',
      detail: t('Con una cuenta de EOIR. Cambiar la dirección con USCIS (AR-11) no la cambia en la corte.', 'With an EOIR account. Changing your address with USCIS (AR-11) doesn’t change it with the court.'),
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
  'i-485supa': t('Va junto con el I-485, a la misma dirección. Si su I-485 ya está pendiente, mándelo con una copia del recibo (I-797) del I-485.', 'It goes with the I-485, to the same address. If your I-485 is already pending, send it with a copy of the I-485 receipt notice (I-797).'),
  'i-918supa': t('Va junto con el I-918, o después si su I-918 ya está pendiente o aprobado (con una copia del recibo o de la aprobación). Una por cada familiar.', 'It goes with the I-918, or later if your I-918 is already pending or approved (with a copy of the receipt or approval notice). One for each family member.'),
  'i-914supa': t('Va junto con el I-914, o después mientras el I-914 está pendiente o aprobado. Una por cada familiar.', 'It goes with the I-914, or later while the I-914 is pending or approved. One for each family member.'),
  'i-539a': t('Va junto con el I-539, a la misma dirección. No se presenta solo.', 'It goes with the I-539, to the same address. It isn’t filed alone.'),
  'i-864a': t('Va junto con el I-864 del patrocinador, a donde se envíe ese formulario.', 'It goes with the sponsor’s I-864, wherever that form is sent.'),
};

/** The uscis.gov page (path after the domain) that carries a form's edition and filing details. */
export const pageFor = (formId: string) => PAGE[formId] ?? formId;

export function filingLinks(formId: string, formNumber: string): { links: FilingLink[]; note?: T } {
  const page = pageFor(formId);
  const links: FilingLink[] = [
    OTHER_SITE[formId] ?? {
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
