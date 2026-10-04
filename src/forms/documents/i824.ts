import type { DocItem } from './types';
import { fee, translations } from './common';
import { is } from '../helpers';

// From the I-824 instructions: "What Evidence Must You Submit?" (copies, front and back, by the Part 2 request).
export const formId = 'i-824';

export const docs: DocItem[] = [
  fee,
  {
    id: 'approvalNotice',
    label: { es: 'Copia del aviso de aprobación (I-797) del caso original', en: 'Copy of the approval notice (I-797) of the original case' },
    detail: {
      es: 'Frente y reverso. Para follow-to-join, es la aprobación de su I-485. Si no lo tiene, envíe copia del recibo o ponga el número de recibo.',
      en: 'Front and back. For follow-to-join, it is your I-485 approval. If you don’t have it, send a copy of the receipt notice or give the receipt number.',
    },
    when: (a) => !is('request', '1e')(a),
  },
  {
    id: 'naturalizationCert',
    label: { es: 'Copia de su certificado de naturalización (N-550)', en: 'Copy of your Certificate of Naturalization (N-550)' },
    detail: { es: 'Frente y reverso.', en: 'Front and back.' },
    when: is('request', '1e'),
  },
  translations,
];
