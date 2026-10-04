import type { DocItem } from './types';
import type { Answers } from '../types';
import { fee, greenCardCopy, idCopy, translations } from './common';

// From the I-90 instructions (edition 01/20/25): the evidence for each reason in Part 2 (Sections A and B)
// and for a name change (Part 1, Item 4).
export const formId = 'i-90';

/** The reason chosen in Part 2, from Section A or B by status ('' if none yet). */
const reason = (a: Answers) => String((a.status === '1c' ? a.reasonB : a.reasonA) ?? '');
const why = (...v: string[]) => (a: Answers) => v.includes(reason(a));

export const docs: DocItem[] = [
  fee,
  {
    ...greenCardCopy,
    detail: {
      es: 'Si se perdió o se la robaron y no tiene una copia, envíe en su lugar la copia de una identificación con foto.',
      en: 'If it was lost or stolen and you have no copy, send a copy of a photo ID instead.',
    },
    when: (a) => !why('2b', '3b', '2d', '3d', '2h1', '2h2', '2i')(a),
  },
  {
    ...idCopy,
    label: { es: 'Copia de una identificación con foto del gobierno', en: 'Copy of a government photo ID' },
    detail: {
      es: 'Con su nombre, fecha de nacimiento, foto y firma: pasaporte, licencia de conducir o identificación militar. Si la tarjeta se perdió o se dañó, sirve en lugar de la copia de la tarjeta.',
      en: 'With your name, date of birth, photo and signature: passport, driver’s license or military ID. If the card was lost or damaged, it can replace the card copy.',
    },
    when: why('2a', '3a', '2c', '3c', '2b', '3b', '2i'),
  },
  {
    id: 'cardNeverReceived',
    label: { es: 'Copia del último aviso I-797 del trámite que le dio la tarjeta', en: 'Copy of the latest I-797 notice for the case that granted the card' },
    detail: {
      es: 'Por ejemplo, del I-485, I-751 o I-90. Si entró como inmigrante, también sirve la página de su pasaporte con el sello I-551.',
      en: 'For example, from the I-485, I-751 or I-90. If you entered as an immigrant, the passport page with the I-551 stamp also works.',
    },
    when: why('2b', '3b'),
  },
  {
    id: 'greenCardOriginal',
    label: { es: 'Su tarjeta original con el error (no una copia)', en: 'Your original card with the error (not a copy)' },
    when: why('2d', '3d'),
  },
  {
    id: 'correctData',
    label: { es: 'Prueba de sus datos correctos', en: 'Proof of your correct information' },
    detail: {
      es: 'Por ejemplo, su acta de nacimiento, pasaporte, acta de matrimonio, sentencia de divorcio u orden de la corte.',
      en: 'For example, your birth certificate, passport, marriage certificate, divorce decree or court order.',
    },
    when: why('2d', '3d'),
  },
  {
    id: 'nameChange',
    label: { es: 'Documento legal de su cambio de nombre o de datos', en: 'Legal document for your name or information change' },
    detail: {
      es: 'Por ejemplo, el acta de matrimonio, la sentencia de divorcio, el decreto de adopción o la orden de la corte, registrados ante la autoridad civil.',
      en: 'For example, the marriage certificate, divorce decree, adoption decree or court order, registered with the civil authority.',
    },
    when: (a) => why('2e', '3e')(a) || a.nameChanged === 'Y',
  },
  {
    id: 'commuterJob',
    label: { es: 'Prueba de su trabajo en EE.UU. de los últimos 6 meses', en: 'Proof of your U.S. job from the last 6 months' },
    detail: {
      es: 'Talones de pago o una carta de su empleador en papel membretado, con la dirección y el teléfono del empleador.',
      en: 'Pay stubs or a letter from your employer on letterhead, with the employer’s address and phone number.',
    },
    when: why('2h1'),
  },
  {
    id: 'usResidence',
    label: { es: 'Prueba de que vive en EE.UU.', en: 'Proof that you live in the U.S.' },
    detail: {
      es: 'Contrato de renta, escritura o recibos de servicios de los últimos 6 meses. Si están a nombre de su cónyuge o padre, agregue el acta de matrimonio o de nacimiento.',
      en: 'A lease, deed or utility bills from the last 6 months. If they are in your spouse’s or parent’s name, add the marriage or birth certificate.',
    },
    when: why('2h2'),
  },
  {
    id: 'tempResidence',
    label: { es: 'Prueba de su residencia temporal', en: 'Proof of your temporary residence' },
    detail: { es: 'Por ejemplo, copia del aviso I-797 de su Formulario I-700.', en: 'For example, a copy of the I-797 notice for your Form I-700.' },
    when: why('2i'),
  },
  translations,
];
