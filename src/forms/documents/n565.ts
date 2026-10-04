import type { Answers } from '../types';
import type { DocItem } from './types';
import { birthCert, fee, photos, translations } from './common';

// From the N-565 instructions: "Initial Evidence" (items 1-10).
export const formId = 'n-565';

const regular = (a: Answers) => !!a.docType && a.docType !== 'SCN';
const reason = (...values: string[]) => (a: Answers) => {
  const v = a.reasons;
  return regular(a) && Array.isArray(v) && values.some((x) => v.includes(x));
};

export const docs: DocItem[] = [
  {
    ...fee,
    detail: {
      es: `${fee.detail?.es ?? ''} No se paga tarifa si el error del certificado fue de USCIS.`,
      en: `${fee.detail?.en ?? ''} There is no fee if the error on the certificate was made by USCIS.`,
    },
  },
  {
    ...photos(2),
    label: { es: 'Dos fotos tipo pasaporte iguales (si vive fuera de EE.UU.)', en: 'Two identical passport-style photos (if you live outside the U.S.)' },
  },
  {
    id: 'idCopy',
    label: { es: 'Copia de una identificación con foto del gobierno de EE.UU.', en: 'Copy of a U.S. government-issued photo ID' },
    detail: { es: 'Por ejemplo, su pasaporte de EE.UU. o su licencia de conducir.', en: 'For example, your U.S. passport or driver’s license.' },
  },
  {
    id: 'maritalChange',
    label: { es: 'Prueba de su cambio de estado civil (si cambió desde que recibió el documento)', en: 'Proof of your change in marital status (if it changed since the document was issued)' },
    detail: {
      es: 'Acta de matrimonio, sentencia de divorcio o de anulación, o acta de defunción de su esposo/a.',
      en: 'Marriage certificate, divorce or annulment decree, or your spouse’s death certificate.',
    },
    when: (a) => a.marital !== 'single',
  },
  {
    id: 'lostDocEvidence',
    label: { es: 'Reporte de policía o declaración jurada de lo que pasó', en: 'Police report or sworn statement of what happened' },
    detail: {
      es: 'Cuente qué pasó con el documento y qué hizo para recuperarlo. Agregue una copia del documento si la tiene.',
      en: 'Explain what happened to the document and what you did to get it back. Add a copy of the document if you have one.',
    },
    when: reason('lost'),
  },
  {
    id: 'originalCertificate',
    label: { es: 'Su documento ORIGINAL de USCIS', en: 'Your ORIGINAL USCIS document' },
    detail: { es: 'El que está dañado, tiene el error o muestra el dato que cambió.', en: 'The one that is damaged, has the error, or shows the information that changed.' },
    when: reason('mutilated', 'error', 'name', 'dob', 'sex'),
  },
  {
    id: 'nameChangeProof',
    label: { es: 'Prueba de su cambio de nombre', en: 'Proof of your name change' },
    detail: {
      es: 'Copia del original o copia certificada del acta de matrimonio, sentencia de divorcio o anulación, u orden de la corte.',
      en: 'A copy of the original or a certified copy of the marriage certificate, divorce or annulment decree, or court order.',
    },
    when: reason('name'),
  },
  {
    id: 'dobChangeProof',
    label: { es: 'Prueba del cambio legal de su fecha de nacimiento', en: 'Proof of the legal change to your date of birth' },
    detail: {
      es: 'Orden de la corte o un registro civil del gobierno de EE.UU. o de un estado (por ejemplo, un acta de nacimiento).',
      en: 'A court order or a vital record from the U.S. government or a U.S. state (for example, a birth certificate).',
    },
    when: reason('dob'),
  },
  {
    ...birthCert,
    detail: { es: 'La emitida al nacer o la más cercana a esa fecha.', en: 'The one issued at birth or closest to it.' },
    when: reason('sex'),
  },
  {
    id: 'naturalizationCert',
    label: { es: 'Copia de su certificado de naturalización', en: 'Copy of your Certificate of Naturalization' },
    when: (a) => a.docType === 'SCN',
  },
  translations,
];
