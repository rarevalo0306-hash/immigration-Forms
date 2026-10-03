import type { DocItem } from './types';

// From the I-865 instructions (edition 11/10/20): no documents go with the notice; "Keep a copy" says what
// to keep as proof that you filed it.
export const formId = 'i-865';

export const docs: DocItem[] = [
  {
    id: 'keepCopy',
    label: { es: 'Una copia del I-865 firmado, para usted', en: 'A copy of the signed I-865, for you' },
    detail: { es: 'No se envía: guárdela. No hace falta adjuntar ningún documento.', en: 'Not sent: keep it. No documents need to be attached.' },
  },
  {
    id: 'mailingProof',
    label: { es: 'Prueba de envío y de entrega, para usted', en: 'Proof of mailing and delivery, for you' },
    detail: {
      es: 'Por ejemplo, el recibo del correo certificado con acuse de recibo, o la guía del servicio de mensajería con la firma de entrega.',
      en: 'For example, the certified mail receipt with return receipt, or the courier label with the delivery signature.',
    },
  },
];
