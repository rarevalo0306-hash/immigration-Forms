import type { DocItem } from './types';
import type { Answers } from '../types';
import { greenCardCopy, translations } from './common';
import { is } from '../helpers';

// From the I-864EZ instructions (edition 08/24/26): Specific Instructions for Parts 2 and 5.
export const formId = 'i-864ez';

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
      es: 'Copia de una de estas: acta de nacimiento de EE.UU., certificado de naturalización o de ciudadanía, el FS-240 o su pasaporte de EE.UU.',
      en: 'A copy of one of these: U.S. birth certificate, naturalization or citizenship certificate, Form FS-240, or your U.S. passport.',
    },
    when: (a) => !is('status', 'C')(a),
  },
  { ...greenCardCopy, when: (a) => is('status', 'C')(a) || !a.status },
  {
    id: 'taxReturn',
    label: { es: 'Su declaración federal de impuestos más reciente', en: 'Your most recent federal tax return' },
    detail: {
      es: 'Una transcripción del IRS (gratis en irs.gov/individuals/get-transcript) o una copia con todos sus W-2 y 1099. Puede agregar los 3 últimos años si le ayuda. No envíe la declaración estatal.',
      en: 'An IRS transcript (free at irs.gov/individuals/get-transcript) or a copy with all its W-2s and 1099s. You may add the last 3 years if it helps. Don’t send your state return.',
    },
  },
  {
    id: 'noTaxExplanation',
    label: { es: 'Explicación de por qué no presentó impuestos', en: 'Explanation of why you didn’t file taxes' },
    detail: {
      es: 'Escrita y firmada, con pruebas de la razón. Si tenía que declarar y no lo hizo, presente primero las declaraciones atrasadas y envíe la transcripción del IRS.',
      en: 'Typed or printed, with proof of the reason. If you had to file and didn’t, file the late returns first and send the IRS transcript.',
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
    id: 'activeDutyProof',
    label: { es: 'Prueba de que está en servicio militar activo', en: 'Proof that you are on active military duty' },
    detail: { es: 'Solo cuenta si patrocina a su cónyuge o hijo/a menor.', en: 'It only counts if you sponsor your spouse or minor child.' },
    when: is('activeDuty', 'yes'),
  },
  {
    id: 'domicileProof',
    label: { es: 'Explicación y pruebas de que su domicilio es EE.UU.', en: 'Explanation and proof that your domicile is the U.S.' },
    detail: {
      es: 'Si vive fuera: por ejemplo, registro de votación, impuestos estatales, propiedad o cuentas de banco en EE.UU., o pasos para mudarse (oferta de trabajo, contrato de renta, inscripción de sus hijos en la escuela).',
      en: 'If you live abroad: for example, U.S. voting record, state taxes, property or bank accounts, or steps to move back (job offer, lease, enrolling your children in school).',
    },
    when: livesAbroad,
  },
  translations,
];
