import type { DocItem } from './types';
import { fee, photos, translations } from './common';
import { isLpr, isParole } from '../i131a';

// From the I-131A instructions (edition 01/20/25): "What Evidence Must You Submit?" and "Where to File?".
export const formId = 'i-131a';

export const docs: DocItem[] = [
  {
    ...fee,
    detail: {
      es: 'Se paga en línea en el sitio de USCIS antes de ir a la embajada o consulado. Lleve la prueba del pago a su cita.',
      en: 'Paid online on the USCIS website before you go to the embassy or consulate. Bring proof of payment to your appointment.',
    },
  },
  {
    id: 'passportAllPages',
    label: { es: 'Copia de todas las páginas de su pasaporte', en: 'Copy of every page of your passport' },
    detail: { es: 'Incluida la página de datos. Lleve también el pasaporte original.', en: 'Including the data page. Bring the original passport too.' },
  },
  {
    id: 'lprProof',
    label: { es: 'Prueba de su residencia permanente (si la tiene)', en: 'Proof of your permanent residence (if you have it)' },
    detail: {
      es: 'Copia de su green card, de su visa de inmigrante o del sello de admisión de CBP en su pasaporte.',
      en: 'A copy of your green card, your immigrant visa or the CBP admission stamp in your passport.',
    },
    when: (a) => isLpr(a) || !isParole(a),
  },
  {
    id: 'apProof',
    label: { es: 'Prueba de su permiso de viaje (si la tiene)', en: 'Proof of your travel document (if you have it)' },
    detail: {
      es: 'Copia de su I-512 o I-512L (advance parole), o de su permiso de trabajo con autorización de viaje.',
      en: 'A copy of your Form I-512 or I-512L (advance parole), or of your work permit with the travel endorsement.',
    },
    when: isParole,
  },
  {
    id: 'travelDates',
    label: { es: 'Prueba de cuándo salió de EE.UU. y cuándo piensa volver', en: 'Proof of when you left the U.S. and when you plan to return' },
    detail: { es: 'Boletos, itinerario, pases de abordar o boletos electrónicos.', en: 'Tickets, itinerary, boarding passes or e-tickets.' },
  },
  photos(2),
  translations,
];
