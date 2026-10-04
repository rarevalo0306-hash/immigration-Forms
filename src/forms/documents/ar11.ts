import type { DocItem } from './types';

// From Form AR-11 itself (edition 11/02/22), which has no separate instructions: nothing is attached.
export const formId = 'ar-11';

export const docs: DocItem[] = [
  {
    id: 'keepCopy',
    label: { es: 'Una copia del AR-11 firmado, para usted', en: 'A copy of the signed AR-11, for you' },
    detail: { es: 'No se envía: guárdela. El AR-11 no lleva documentos adjuntos ni pago.', en: 'Not sent: keep it. Form AR-11 has no attachments and no fee.' },
  },
  {
    id: 'eoir33',
    label: { es: 'Formulario EOIR-33 para la corte (solo si está en corte de inmigración)', en: 'Form EOIR-33 for the court (only if you are in immigration court)' },
    detail: {
      es: 'El AR-11 no cambia su dirección en la corte. Se presenta aparte, a la corte de inmigración.',
      en: 'Form AR-11 doesn’t update your address with the court. It is filed separately, with the immigration court.',
    },
  },
];
