import type { DocItem } from './types';
import { greenCardCopy, translations } from './common';
import { is, num } from '../helpers';

// From the I-134 instructions (edition 01/20/25): Item 11 (proof of status), Item 18 (assets) and
// "Supporting Evidence".
export const formId = 'i-134';

export const docs: DocItem[] = [
  {
    id: 'citizenshipProof',
    label: { es: 'Prueba de su ciudadanía de EE.UU.', en: 'Proof of your U.S. citizenship' },
    detail: {
      es: 'Copia de una de estas: acta de nacimiento de EE.UU., certificado de naturalización o de ciudadanía, el FS-240 o la página de datos de su pasaporte de EE.UU.',
      en: 'A copy of one of these: U.S. birth certificate, naturalization or citizenship certificate, Form FS-240, or your U.S. passport’s data page.',
    },
    when: (a) => is('status', 'A', 'B')(a) || !a.status,
  },
  {
    ...greenCardCopy,
    detail: { es: 'O copia del sello I-551 vigente en su pasaporte o I-94.', en: 'Or a copy of the unexpired I-551 stamp in your passport or I-94.' },
    when: is('status', 'C'),
  },
  {
    id: 'visaCopy',
    label: { es: 'Copia de su visa vigente', en: 'Copy of your unexpired visa' },
    detail: { es: 'La página de su pasaporte con la visa.', en: 'The page of your passport with the visa.' },
    when: is('status', 'nonimmigrant'),
  },
  {
    id: 'statusProof',
    label: { es: 'Prueba de su estatus en EE.UU.', en: 'Proof of your U.S. status' },
    detail: { es: 'Copia del documento que lo muestra, por ejemplo su aprobación de USCIS o su I-94.', en: 'A copy of the document that shows it, for example your USCIS approval or your I-94.' },
    when: is('status', 'asylee', 'refugee', 'parolee', 'tps', 'deferred', 'other'),
  },
  {
    id: 'taxReturn',
    label: { es: 'Su declaración federal de impuestos más reciente', en: 'Your most recent federal tax return' },
    detail: {
      es: 'Copia o transcripción del IRS. Si no declaró o ya no refleja sus ingresos: talones de pago de al menos el último mes, su W-2 reciente o el SSA-1099.',
      en: 'A copy or IRS transcript. If you didn’t file or it no longer reflects your income: pay stubs for at least the last month, a recent W-2, or Form SSA-1099.',
    },
  },
  {
    id: 'employerLetter',
    label: { es: 'Carta de su empleador', en: 'Letter from your employer' },
    detail: {
      es: 'En papel membretado, con la fecha en que empezó, su puesto, su sueldo y si el trabajo es temporal o permanente.',
      en: 'On letterhead, with your start date, your job, your salary, and whether the job is temporary or permanent.',
    },
    when: (a) => is('employment', 'employed')(a) || !a.employment,
  },
  {
    id: 'bankLetter',
    label: { es: 'Carta de su banco (si tiene cuentas)', en: 'Letter from your bank (if you have accounts)' },
    detail: {
      es: 'De un empleado del banco, con la fecha en que abrió la cuenta, el total depositado el último año y el saldo actual.',
      en: 'From a bank officer, with the date the account was opened, the total deposited in the past year, and the current balance.',
    },
  },
  {
    id: 'bondsList',
    label: { es: 'Lista de sus bonos', en: 'List of your bonds' },
    detail: { es: 'Con el número de serie, el valor y el nombre del dueño de cada uno.', en: 'With each one’s serial number, denomination and owner’s name.' },
    when: (a) => num(a, 'assets.stocks') > 0,
  },
  {
    id: 'homeValue',
    label: { es: 'Pruebas del valor de su casa', en: 'Proof of your home’s value' },
    detail: {
      es: 'Prueba de que es dueño, un avalúo reciente de un tasador con licencia, y el saldo de cada hipoteca o préstamo sobre la casa.',
      en: 'Proof that you own it, a recent appraisal by a licensed appraiser, and the balance of every mortgage or loan on it.',
    },
    when: (a) => num(a, 'assets.realEstate') > 0,
  },
  {
    id: 'assetsProof',
    label: { es: 'Pruebas de sus otros bienes', en: 'Proof of your other assets' },
    detail: {
      es: 'Para cada uno: de quién es, qué es, prueba de que es suyo y de su valor neto (por ejemplo, estados de cuenta).',
      en: 'For each one: who owns it, what it is, proof of ownership and of its net value (for example, account statements).',
    },
    when: (a) => ['assets.annuities', 'assets.stocks', 'assets.retirement', 'assets.personalProperty'].some((id) => num(a, id) > 0),
  },
  translations,
];
