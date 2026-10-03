import type { DocItem } from './types';
import type { Answers } from '../types';
import { courtRecords, fee, greenCardCopy, translations } from './common';
import { is } from '../helpers';

// From the I-751 instructions (edition 04/01/24): "What Initial Evidence Is Required?" (card, relationship,
// waivers, criminal history).
export const formId = 'i-751';

/** Whether a reason was chosen in the "select all that apply" waiver question. */
const waiver = (...v: string[]) => (a: Answers) => {
  const w = a.waivers;
  return is('basis', 'waiver')(a) && (Array.isArray(w) ? w.some((x) => v.includes(x)) : v.includes(String(w ?? '')));
};
const childIncluded = (a: Answers) => [1, 2, 3, 4, 5].some((i) => a[`child${i}.applying`] === 'yes');

export const docs: DocItem[] = [
  fee,
  greenCardCopy,
  {
    id: 'childrenCards',
    label: { es: 'Copia de la tarjeta de residente de cada hijo incluido (frente y reverso)', en: 'Copy of each included child’s green card (front and back)' },
    when: childIncluded,
  },
  {
    id: 'bonaFideMarriage',
    label: { es: 'Pruebas de que se casaron de buena fe', en: 'Proof that you married in good faith' },
    detail: {
      es: 'Todas las que pueda, desde la boda hasta hoy: contrato de renta o hipoteca a nombre de los dos, cuentas de banco juntos, declaraciones de impuestos conjuntas, seguros, recibos de servicios, actas de nacimiento de sus hijos.',
      en: 'As many as you can, from the wedding to today: a lease or mortgage in both names, joint bank accounts, joint tax returns, insurance, utility bills, your children’s birth certificates.',
    },
  },
  {
    id: 'affidavits',
    label: { es: 'Declaraciones juradas de dos personas que los conocen (si las tiene)', en: 'Sworn statements from two people who know you (if you have them)' },
    detail: {
      es: 'Originales y firmadas, con nombre, dirección, fecha y lugar de nacimiento de quien declara, su relación con ustedes y cómo sabe de su matrimonio. Acompáñelas de otras pruebas.',
      en: 'Original and signed, with the person’s name, address, date and place of birth, relationship to you, and how they know about your marriage. Send them with other evidence.',
    },
  },
  {
    id: 'deathCert',
    label: { es: 'Copia del acta de defunción de su cónyuge', en: 'Copy of your spouse’s death certificate' },
    when: waiver('C'),
  },
  {
    id: 'divorceDecree',
    label: { es: 'Copia de la sentencia final de divorcio o anulación', en: 'Copy of the final divorce or annulment decree' },
    when: (a) => waiver('D')(a) || (waiver('E', 'F')(a) && is('marital', 'D')(a)),
  },
  {
    id: 'abuseEvidence',
    label: { es: 'Pruebas del maltrato', en: 'Evidence of the abuse' },
    detail: {
      es: 'Envíe lo que tenga: reportes de la policía, la corte, médicos, la escuela, la iglesia o trabajadores sociales; órdenes de protección; cartas de un refugio; fotos de las lesiones.',
      en: 'Send what you have: reports from police, courts, doctors, school, clergy or social workers; protection orders; letters from a shelter; photos of injuries.',
    },
    when: waiver('E', 'F'),
  },
  {
    id: 'hardshipEvidence',
    label: { es: 'Pruebas del sufrimiento extremo que le causaría salir del país', en: 'Evidence of the extreme hardship removal would cause' },
    detail: {
      es: 'Solo de hechos ocurridos en sus 2 años de residencia condicional. Un abogado le puede ayudar a elegirlas.',
      en: 'Only of facts that arose during your 2 years of conditional residence. An attorney can help you choose them.',
    },
    when: waiver('G'),
  },
  {
    id: 'childSeparately',
    label: { es: 'Explicación de por qué presenta aparte de su padre o madre', en: 'Explanation of why you file separately from your parent' },
    detail: { es: 'Con copias de los documentos que la apoyen.', en: 'With copies of any supporting documents.' },
    when: is('basis', 'B'),
  },
  {
    id: 'ordersAbroad',
    label: { es: 'Si vive fuera por órdenes militares o del gobierno: órdenes, fotos y huellas', en: 'If you live abroad on military or government orders: orders, photos and fingerprints' },
    detail: {
      es: 'Copia de las órdenes; dos fotos tipo pasaporte y dos tarjetas de huellas FD-258 por persona (huellas de 14 a 79 años). Escriba "ACTIVE MILITARY" o "GOVERNMENT ORDERS" arriba del I-751.',
      en: 'A copy of the orders; two passport-style photos and two FD-258 fingerprint cards per person (fingerprints for ages 14 to 79). Write "ACTIVE MILITARY" or "GOVERNMENT ORDERS" on top of the I-751.',
    },
    when: is('q23', 'yes'),
  },
  {
    ...courtRecords,
    detail: {
      es: 'Originales o copias certificadas por la corte, con el resultado de cada caso y prueba de que cumplió la sentencia. Si no hubo cargos, una carta oficial que lo diga. Un abogado debe revisarlas.',
      en: 'Originals or court-certified copies, with each case’s outcome and proof you completed the sentence. If no charges were filed, an official letter saying so. An attorney should review them.',
    },
    when: is('q20', 'yes'),
  },
  translations,
];
