import type { Answers } from '../types';
import type { DocItem } from './types';
import { courtRecords, fee, greenCardCopy, marriageCert, photos, priorMarriagesEnded, translations } from './common';
import { is, num } from '../helpers';

// From the N-400 instructions: the "Required Evidence" boxes in the Specific Instructions by Item Number
// (name change, disability, marriage, children, residence, taxes, crimes, Selective Service, military, fee reduction).
export const formId = 'n-400';

const yes = (...ids: string[]) => (a: Answers) => ids.some((id) => a[id] === 'yes');
const spouseCase = is('eligibility', 'B', 'D');
const military = is('eligibility', 'E', 'F');

const parseDate = (v: unknown): Date | undefined => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(v ?? ''));
  return m ? new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2])) : undefined;
};

/** Whether any listed trip lasted more than 6 months. */
const longTrip = (a: Answers) => {
  for (let i = 1; i <= 6; i++) {
    const left = parseDate(a[`trip${i}.left`]);
    const back = parseDate(a[`trip${i}.returned`]);
    if (left && back && back.getTime() - left.getTime() > 182 * 24 * 3600 * 1000) return true;
  }
  return false;
};

/** Age today from the date of birth, or undefined if not given. */
const age = (a: Answers) => {
  const dob = parseDate(a.dob);
  if (!dob) return undefined;
  const now = new Date();
  let y = now.getFullYear() - dob.getFullYear();
  if (now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())) y--;
  return y;
};

/** Men who lived in the U.S. between 18 and 26 and did not register: a letter is needed from 26 up to 31 (29 for spouses). */
const selectiveLetter = (a: Answers) => {
  if (!(a.sex === 'male' && a['p9.22.a'] === 'yes' && a['p9.22.b'] === 'no')) return false;
  const y = age(a);
  if (y === undefined) return true;
  return y >= 26 && y < (spouseCase(a) ? 29 : 31);
};

const childApart = (a: Answers) => [1, 2, 3].some((i) => i <= num(a, 'childrenCount') && a[`child${i}.residence`] === 'does not reside with me');

export const docs: DocItem[] = [
  {
    ...fee,
    detail: {
      es: 'Confirme el monto en uscis.gov/g-1055. Si presenta por servicio militar, no se paga. Puede pedir una tarifa reducida en la Parte 10.',
      en: 'Confirm the amount at uscis.gov/g-1055. If you file based on military service, there is no fee. You can ask for a reduced fee in Part 10.',
    },
    when: (a) => !military(a),
  },
  greenCardCopy,
  {
    ...photos(2),
    label: { es: 'Dos fotos tipo pasaporte iguales (si vive fuera de EE.UU.)', en: 'Two identical passport-style photos (if you live outside the U.S.)' },
    when: (a) => is('eligibility', 'D')(a) || yes('p9.26.c', 'p9.26.d', 'spouseMilitary')(a),
  },
  {
    id: 'nameChangeProof',
    label: { es: 'Prueba de su cambio de nombre (si su nombre cambió)', en: 'Proof of your name change (if your name changed)' },
    detail: { es: 'Acta de matrimonio, sentencia de divorcio u orden de la corte.', en: 'Marriage certificate, divorce decree or court order.' },
    when: yes('hasOtherNames'),
  },
  {
    id: 'n648',
    label: { es: 'Formulario N-648 llenado por su médico', en: 'Form N-648 completed by your doctor' },
    detail: { es: 'Para pedir la excepción médica a los exámenes de inglés y cívica.', en: 'To request the medical exception to the English and civics tests.' },
    when: yes('disability', 'p9.33'),
  },
  {
    id: 'guardianProof',
    label: { es: 'Prueba de su tutor legal o representante', en: 'Proof of your legal guardian or representative' },
    detail: {
      es: 'La orden de la corte que nombra al tutor; o, si es un familiar que lo cuida, prueba del parentesco y de que es quien lo cuida. Si no puede hacer el juramento, también el N-648 o una evaluación médica.',
      en: 'The court order naming the guardian; or, for a family caregiver, proof of the relationship and that they are your primary caregiver. If you can’t take the Oath, also Form N-648 or a medical evaluation.',
    },
    when: yes('p9.33'),
  },
  {
    id: 'spouseCitizenship',
    label: { es: 'Prueba de la ciudadanía de su cónyuge', en: 'Proof of your spouse’s U.S. citizenship' },
    detail: {
      es: 'Acta de nacimiento de EE.UU., certificado de naturalización o de ciudadanía, FS-240, o la página de datos de su pasaporte de EE.UU.',
      en: 'U.S. birth certificate, Certificate of Naturalization or Citizenship, FS-240, or the data page of their U.S. passport.',
    },
    when: spouseCase,
  },
  { ...marriageCert, label: { es: 'Copia de su acta de matrimonio actual', en: 'Copy of your current marriage certificate' }, when: spouseCase },
  {
    ...priorMarriagesEnded,
    detail: { es: 'De usted y de su cónyuge: sentencia de divorcio, anulación o acta de defunción.', en: 'Yours and your spouse’s: divorce decree, annulment or death certificate.' },
    when: (a) => spouseCase(a) && (num(a, 'timesMarried') > 1 || num(a, 'spouse.timesMarried') > 1),
  },
  {
    id: 'maritalUnion',
    label: { es: 'Pruebas de que han vivido juntos como pareja los últimos 3 años', en: 'Proof you have lived together in marriage for the last 3 years' },
    detail: {
      es: 'Por ejemplo: estados de cuenta o tarjetas en conjunto, contrato de renta o hipoteca, actas de nacimiento de hijos, seguros, y transcripciones de impuestos del IRS de los dos por 3 años.',
      en: 'For example: joint bank or credit card statements, lease or mortgage, children’s birth certificates, insurance, and both spouses’ IRS tax transcripts for 3 years.',
    },
    when: is('eligibility', 'B'),
  },
  {
    id: 'spouseEmployment',
    label: { es: 'Pruebas del trabajo calificado de su cónyuge fuera de EE.UU.', en: 'Proof of your spouse’s qualified employment abroad' },
    detail: {
      es: 'Quién es el empleador y qué trabajo hace, que el empleo dura al menos 1 año más, sus órdenes de viaje con su nombre (si hay), y una declaración suya de que vivirá en EE.UU. al terminar.',
      en: 'Who the employer is and the work done, that the job lasts at least 1 more year, travel orders naming you (if any), and your statement that you will live in the U.S. when it ends.',
    },
    when: is('eligibility', 'D'),
  },
  {
    id: 'militarySpouseAbroad',
    label: { es: 'Pruebas para cónyuge de militar que vive en el extranjero', en: 'Proof for a military spouse living abroad' },
    detail: {
      es: 'Si vive fuera de EE.UU. con su cónyuge militar: el documento que le autoriza a acompañarle según sus órdenes, y prueba de su servicio militar.',
      en: 'If you live abroad with your military spouse: the document authorizing you to accompany them on official orders, and proof of their military service.',
    },
    when: yes('spouseMilitary'),
  },
  {
    id: 'childSupport',
    label: { es: 'Pruebas de que mantiene a sus hijos o paga la manutención', en: 'Proof you support your children or pay child support' },
    detail: {
      es: 'Por ejemplo: cheques cobrados o recibos de giros, un documento de la corte o la agencia, descuentos de salario, o una carta notariada de quien cuida a sus hijos. Si hay una orden de la corte, inclúyala.',
      en: 'For example: cancelled checks or money order receipts, a court or agency record, wage garnishments, or a notarized letter from the children’s caregiver. Include any court order.',
    },
    when: (a) => childApart(a) || yes('p9.17.g')(a),
  },
  {
    id: 'continuousResidence',
    label: { es: 'Pruebas de que mantuvo su residencia en EE.UU. durante su viaje largo', en: 'Proof you kept your U.S. residence during your long trip' },
    detail: {
      es: 'Para viajes de más de 6 meses: transcripciones de impuestos del IRS, pagos de renta o hipoteca, talones de pago, estados de cuenta, registro del carro, o su pasaporte con los sellos.',
      en: 'For trips over 6 months: IRS tax transcripts, rent or mortgage statements, pay stubs, bank statements, car registration, or your passport with stamps.',
    },
    when: longTrip,
  },
  {
    id: 'overdueTaxes',
    label: { es: 'Pruebas sobre sus impuestos atrasados', en: 'Proof about your overdue taxes' },
    detail: {
      es: 'Transcripciones del IRS de 5 años (3 si es por matrimonio), el acuerdo de pago firmado con el IRS o la oficina de impuestos, y el estado actual de sus pagos.',
      en: 'IRS transcripts for 5 years (3 if based on marriage), the signed payment agreement with the IRS or tax office, and the current status of your payments.',
    },
    when: yes('p9.3'),
  },
  {
    ...courtRecords,
    detail: {
      es: 'Reportes de arresto, cargos, resultado final y sentencia de cada caso, y prueba de que cumplió la sentencia, la libertad condicional o el programa. Si un récord no existe, una carta oficial que lo diga. Lleve los originales a la entrevista.',
      en: 'Arrest reports, charges, final disposition and sentence for each case, and proof you completed the sentence, probation or program. If a record doesn’t exist, an official letter saying so. Bring originals to the interview.',
    },
    when: (a) => yes('p9.15.a', 'p9.15.b')(a),
  },
  {
    id: 'selectiveServiceLetter',
    label: { es: 'Carta de estatus del Servicio Selectivo', en: 'Selective Service status information letter' },
    detail: {
      es: 'Se pide en sss.gov. Agregue una declaración de por qué no se registró.',
      en: 'Request it at sss.gov. Add a statement of why you did not register.',
    },
    when: selectiveLetter,
  },
  {
    id: 'n426',
    label: { es: 'Formulario N-426 (certificación de servicio militar)', en: 'Form N-426 (certification of military service)' },
    detail: {
      es: 'Si está en servicio activo, agregue una copia de sus órdenes militares. Si ya salió, copias de su DD-214 o NGB-22 de cada período.',
      en: 'If on active duty, add a copy of your military orders. If separated, copies of your DD-214 or NGB-22 for every period.',
    },
    when: (a) => military(a) || yes('p9.26.a')(a),
  },
  {
    id: 'reducedFeeProof',
    label: { es: 'Pruebas de los ingresos de su hogar', en: 'Proof of your household income' },
    detail: {
      es: 'La declaración de impuestos más reciente de cada persona del hogar. Si alguien no la presentó: talones de pago del último mes, W-2, SSA-1099 o una carta del empleador.',
      en: 'Each household member’s most recent federal tax return. If someone didn’t file: last month’s pay stubs, W-2, SSA-1099 or an employer letter.',
    },
    when: yes('feeReduction'),
  },
  translations,
];
