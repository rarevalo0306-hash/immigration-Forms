import type { DocItem } from './types';
import type { Answers } from '../types';
import { greenCardCopy, translations } from './common';
import { is, num } from '../helpers';

// From the I-864 instructions (edition 08/24/26): Specific Instructions for Parts 2, 6 and 7, and
// "Substitute Sponsor".
export const formId = 'i-864';

const usNames = /^(united states( of america)?|usa?|u\.s\.(a\.)?|estados unidos( de am[eé]rica)?|ee\.? ?uu\.?)$/i;
/** Whether the sponsor lives outside the United States (by the country they wrote). */
const livesAbroad = (a: Answers) => {
  const country = String((a.mailingSame === 'no' ? a['home.country'] : a['mailing.country']) ?? '').trim();
  return country !== '' && !usNames.test(country);
};

export const docs: DocItem[] = [
  {
    id: 'citizenshipProof',
    label: { es: 'Prueba de su ciudadanía de EE.UU.', en: 'Proof of your U.S. citizenship' },
    detail: {
      es: 'Copia de una de estas: acta de nacimiento de EE.UU., certificado de naturalización o de ciudadanía, el FS-240 o su pasaporte de EE.UU. Si es el peticionario y ya la envió con el I-130, no hace falta.',
      en: 'A copy of one of these: U.S. birth certificate, naturalization or citizenship certificate, Form FS-240, or your U.S. passport. If you are the petitioner and already sent it with the I-130, you don’t need to.',
    },
    when: (a) => !is('status', 'C')(a),
  },
  {
    ...greenCardCopy,
    detail: {
      es: 'O copia del sello I-551 vigente en su pasaporte o I-94. Si es el peticionario y ya la envió con el I-130, no hace falta.',
      en: 'Or a copy of the unexpired I-551 stamp in your passport or I-94. If you are the petitioner and already sent it with the I-130, you don’t need to.',
    },
    when: (a) => is('status', 'C')(a) || !a.status,
  },
  {
    id: 'taxReturn',
    label: { es: 'Su declaración federal de impuestos más reciente', en: 'Your most recent federal tax return' },
    detail: {
      es: 'Una transcripción del IRS (gratis en irs.gov/individuals/get-transcript) o una copia con todos sus W-2, 1099 y anexos. Puede agregar los 3 últimos años si le ayuda. No envíe la declaración estatal.',
      en: 'An IRS transcript (free at irs.gov/individuals/get-transcript) or a copy with all its W-2s, 1099s and schedules. You may add the last 3 years if it helps. Don’t send your state return.',
    },
  },
  {
    id: 'selfEmployedSchedules',
    label: { es: 'Los anexos de su negocio (Schedule C, D, E o F)', en: 'Your business schedules (Schedule C, D, E or F)' },
    detail: { es: 'Todos los anexos del formulario 1040 que presentó con su declaración.', en: 'Every Form 1040 schedule you filed with your return.' },
    when: is('employment', 'self'),
  },
  {
    id: 'noTaxExplanation',
    label: { es: 'Explicación de por qué no presentó impuestos', en: 'Explanation of why you didn’t file taxes' },
    detail: {
      es: 'Escrita y firmada. Si no tenía que declarar por otra razón que ingresos bajos, agregue pruebas. Si tenía que declarar y no lo hizo, presente primero las declaraciones atrasadas y envíe su copia o transcripción.',
      en: 'Typed or printed. If you didn’t have to file for a reason other than low income, add proof. If you had to file and didn’t, file the late returns first and send their copy or transcript.',
    },
    when: is('filedTaxes', 'no'),
  },
  {
    id: 'incomeProof',
    label: { es: 'Prueba de sus ingresos de este año (opcional)', en: 'Proof of this year’s income (optional)' },
    detail: {
      es: 'Por ejemplo, una carta reciente de su empleador con su sueldo anual, o sus talones de pago de los últimos 6 meses.',
      en: 'For example, a recent letter from your employer with your annual salary, or your pay stubs from the last 6 months.',
    },
  },
  {
    id: 'i864aWith',
    label: { es: 'El Formulario I-864A de cada familiar que suma sus ingresos', en: 'Form I-864A for each relative adding their income' },
    detail: {
      es: 'Con las pruebas de cada uno (su declaración de impuestos y más). Cada familiar lo llena en Camino.',
      en: 'With each one’s evidence (their tax return and more). Each relative fills it in Camino.',
    },
    when: (a) => a['hhIncome.more0'] === 'yes' || num(a, 'hh.i864a') > 0,
  },
  {
    id: 'immigrantIncome',
    label: { es: 'Pruebas de los ingresos del inmigrante', en: 'Proof of the immigrant’s income' },
    detail: {
      es: 'Que su ingreso seguirá de la misma fuente legal después de recibir la residencia. Si no es su cónyuge, también prueba de que vive con usted.',
      en: 'That their income will continue from the same lawful source after they become a resident. If they are not your spouse, also proof that they live with you.',
    },
    when: is('i864aStatus', 'intending'),
  },
  {
    id: 'activeDutyProof',
    label: { es: 'Prueba de que está en servicio militar activo', en: 'Proof that you are on active military duty' },
    detail: { es: 'Solo cuenta si patrocina a su cónyuge o hijo/a.', en: 'It only counts if you sponsor your spouse or child.' },
    when: (a) => is('basis', 'petitioner')(a) && a.activeDuty === 'yes',
  },
  {
    id: 'domicileProof',
    label: { es: 'Explicación y pruebas de que su domicilio es EE.UU.', en: 'Explanation and proof that your domicile is the U.S.' },
    detail: {
      es: 'Si vive fuera: por ejemplo, registro de votación, impuestos estatales, propiedad o cuentas de banco en EE.UU., o pasos para mudarse (oferta de trabajo, contrato de renta).',
      en: 'If you live abroad: for example, U.S. voting record, state taxes, property or bank accounts, or steps to move back (job offer, lease).',
    },
    when: livesAbroad,
  },
  {
    id: 'assetsProof',
    label: { es: 'Pruebas de los bienes que suma', en: 'Proof of the assets you add' },
    detail: {
      es: 'Para cada uno: qué es, prueba de que es suyo y de su valor (por ejemplo, estados de cuenta), y lo que debe sobre él.',
      en: 'For each one: what it is, proof that you own it and of its value (for example, account statements), and any debts against it.',
    },
    when: is('useAssets', 'yes'),
  },
  {
    id: 'homeValue',
    label: { es: 'Pruebas del valor de su casa', en: 'Proof of your home’s value' },
    detail: {
      es: 'Prueba de que es dueño, un avalúo reciente de un tasador con licencia, y el saldo de cada hipoteca o préstamo sobre la casa.',
      en: 'Proof that you own it, a recent appraisal by a licensed appraiser, and the balance of every mortgage or loan on it.',
    },
    when: (a) => is('useAssets', 'yes')(a) && num(a, 'assets.realEstate') > 0,
  },
  {
    id: 'immigrantAssets',
    label: { es: 'Pruebas de los bienes del inmigrante', en: 'Proof of the immigrant’s assets' },
    detail: { es: 'Qué son, de quién son y cuánto valen.', en: 'What they are, who owns them and what they are worth.' },
    when: (a) => is('useAssets', 'yes')(a) && num(a, 'principalAssets.cash') + num(a, 'principalAssets.realEstate') + num(a, 'principalAssets.stocks') > 0,
  },
  {
    id: 'substituteSponsor',
    label: { es: 'Documentos de patrocinador sustituto', en: 'Substitute sponsor documents' },
    detail: {
      es: 'Prueba de su parentesco con el inmigrante y copia de la aprobación del I-130. El inmigrante agrega una carta pidiendo que se restablezca la petición.',
      en: 'Proof of your relationship to the immigrant and a copy of the I-130 approval notice. The immigrant adds a letter asking that the petition be reinstated.',
    },
    when: is('basis', 'substitute'),
  },
  translations,
];
