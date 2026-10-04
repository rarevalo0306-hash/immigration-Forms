import type { DocItem } from './types';

// From Form EOIR-33/IC itself (Rev. Feb. 2026: its instructions and Service Instructions are on the form): nothing is attached.
export const formId = 'eoir-33';

export const docs: DocItem[] = [
  {
    id: 'dhsCopy',
    label: { es: 'Una copia del EOIR-33 firmado para los abogados de ICE (OPLA)', en: 'A copy of the signed EOIR-33 for ICE’s attorneys (OPLA)' },
    detail: {
      es: 'Se entrega por el portal eService de ICE, o por correo o en persona en la oficina de OPLA de su zona (ice.gov/contact/legal). Sin esta copia, la corte puede rechazar el formulario.',
      en: 'Give it through ICE’s eService portal, or by mail or in person at your area’s OPLA office (ice.gov/contact/legal). Without this copy, the court may reject the form.',
    },
  },
  {
    id: 'stamp',
    label: { es: 'Una estampilla de correo (si lo envía por correo)', en: 'A postage stamp (if you mail it)' },
    detail: {
      es: 'La página 2 se dobla y se engrapa para que se vea la dirección de la corte; la estampilla va en "Place Stamp Here".',
      en: 'Page 2 is folded and stapled so the court’s address shows; the stamp goes on "Place Stamp Here".',
    },
  },
  {
    id: 'familyForms',
    label: { es: 'Un EOIR-33 aparte para cada familiar con caso en la corte', en: 'A separate EOIR-33 for each family member with a case in court' },
    detail: { es: 'Cada persona a la que afecta el cambio necesita su propio formulario, con su propio A-Number.', en: 'Each person the change affects needs their own form, with their own A-Number.' },
  },
  {
    id: 'keepCopy',
    label: { es: 'Una copia de todo y la prueba del envío, para usted', en: 'A copy of everything and proof of sending, for you' },
    detail: { es: 'No se envía: guárdela. El EOIR-33 no lleva documentos adjuntos ni pago.', en: 'Not sent: keep it. Form EOIR-33 has no attachments and no fee.' },
  },
  {
    id: 'ar11',
    label: { es: 'Formulario AR-11 o cambio de dirección en línea para USCIS', en: 'Form AR-11 or the online address change for USCIS' },
    detail: {
      es: 'El EOIR-33 no cambia su dirección con USCIS. Se hace aparte, en uscis.gov/addresschange.',
      en: 'Form EOIR-33 doesn’t update your address with USCIS. Do it separately at uscis.gov/addresschange.',
    },
  },
];
