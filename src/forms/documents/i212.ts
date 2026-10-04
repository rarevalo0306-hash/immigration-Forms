import type { Answers } from '../types';
import type { DocItem } from './types';
import { birthCert, courtRecords, fee, translations } from './common';

// From the I-212 instructions: "What Evidence Must You Submit?" and the evidence named in Part 2.
export const formId = 'i-212';

const familyStatuses = (a: Answers) => [1, 2, 3, 4, 5].map((i) => String(a[`family${i}.status`] ?? ''));
/** The multi-select answer `id` holds any of `values`. */
const has = (id: string, ...values: string[]) => (a: Answers) => {
  const v = a[id];
  return Array.isArray(v) && values.some((x) => v.includes(x));
};
const hasFamily = (a: Answers) => a['family.more0'] === 'yes';

export const docs: DocItem[] = [
  fee,
  {
    id: 'removalRecords',
    label: { es: 'Copias de todo lo que tenga de su deportación', en: 'Copies of everything you have about your removal' },
    detail: {
      es: 'La orden de deportación, avisos de la corte o de inmigración y prueba de su salida. Guarde los originales.',
      en: 'The removal order, court or immigration notices, and proof of your departure. Keep the originals.',
    },
  },
  {
    ...birthCert,
    id: 'familyRelationship',
    label: { es: 'Prueba del parentesco con cada familiar que nombró', en: 'Proof of your relationship to each relative you listed' },
    detail: {
      es: 'Actas de nacimiento o de matrimonio.',
      en: 'Birth or marriage certificates.',
    },
    when: hasFamily,
  },
  {
    id: 'familyCitizenship',
    label: { es: 'Prueba de la ciudadanía de sus familiares ciudadanos', en: 'Proof of citizenship of your U.S. citizen relatives' },
    detail: {
      es: 'Acta de nacimiento de EE.UU., certificado de naturalización o pasaporte de EE.UU.',
      en: 'U.S. birth certificate, naturalization certificate or U.S. passport.',
    },
    when: (a) => hasFamily(a) && (familyStatuses(a).every((s) => !s) || familyStatuses(a).includes('CIT')),
  },
  {
    id: 'tenYearsOutside',
    label: { es: 'Pruebas de que lleva 10 años fuera de EE.UU.', en: 'Evidence that you have been outside the U.S. for 10 years' },
    detail: {
      es: 'Por ejemplo, sellos de entrada y salida en su pasaporte, boletos de avión, registro de domicilio, recibos de servicios a su nombre o constancias de trabajo en el otro país.',
      en: 'For example, entry and exit stamps in your passport, plane tickets, residence registration, utility bills in your name, or employment records abroad.',
    },
    when: (a) => a.unlawfulPresence === 'yes' || a.reentry === 'yes',
  },
  {
    ...courtRecords,
    label: { es: 'Registros de la corte y de la policía de cada arresto, cargo o condena', en: 'Court and police records for every arrest, charge or conviction' },
    detail: {
      es: 'De cualquier país, con el resultado final de cada caso. Un abogado debe revisarlos antes de enviar.',
      en: 'From any country, with the final outcome of each case. An attorney should review them before you file.',
    },
    when: (a) => a.felony === 'yes' || has('factors', 'rehabilitated')(a),
  },
  {
    id: 'rehabilitation',
    label: { es: 'Pruebas de su rehabilitación', en: 'Evidence of your rehabilitation' },
    detail: {
      es: 'Por ejemplo, constancias de programas que terminó, cartas de su iglesia o comunidad.',
      en: 'For example, proof of programs you completed, letters from your church or community.',
    },
    when: (a) => a.felony === 'yes' || has('factors', 'rehabilitated')(a),
  },
  {
    id: 'hardshipEvidence',
    label: { es: 'Pruebas de las dificultades para su familia si no lo dejan volver', en: 'Evidence of hardship to your family if you are not allowed back' },
    detail: {
      es: 'Cartas firmadas, informes médicos, comprobantes de ingresos y gastos, e información sobre el país donde tendrían que vivir.',
      en: 'Signed letters, medical reports, proof of income and expenses, and information about the country where they would have to live.',
    },
    when: (a) => hasFamily(a) || has('factors', 'family', 'children', 'health')(a),
  },
  {
    id: 'favorableEvidence',
    label: { es: 'Otras pruebas a su favor', en: 'Other evidence in your favor' },
    detail: {
      es: 'Por ejemplo, cartas de apoyo, constancias de trabajo, impuestos pagados, o la aprobación de su petición de inmigrante. Si no puede conseguir algo, explique por qué.',
      en: 'For example, support letters, employment records, taxes paid, or your immigrant petition approval. If you can’t get something, explain why.',
    },
  },
  translations,
];
