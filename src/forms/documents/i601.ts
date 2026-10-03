import type { Answers } from '../types';
import type { DocItem } from './types';
import { courtRecords, fee, translations } from './common';
import { groundSelected } from '../i601';
import { is } from '../helpers';

// From the I-601 instructions: "What Evidence Must You Submit?" and the evidence named under
// "Reasons for Inadmissibility".
export const formId = 'i-601';

const showsHardship = (a: Answers) => a.benefit !== 'B' && (a['qualifying.more0'] !== 'no' || a.vawa === 'yes');
const status = (a: Answers) => [a['qualifying1.status'], a['qualifying2.status']].map((v) => String(v ?? ''));

export const docs: DocItem[] = [
  fee,
  {
    id: 'discretionEvidence',
    label: { es: 'Pruebas de por qué merece el perdón', en: 'Evidence of why you deserve the waiver' },
    detail: {
      es: 'Por ejemplo, cartas firmadas de usted y de otras personas, constancias de trabajo, impuestos pagados, servicio a la comunidad. Si no puede conseguir algo, explique por qué.',
      en: 'For example, signed letters from you and others, proof of work, taxes paid, community service. If you can’t get something, explain why.',
    },
  },
  {
    id: 'relationshipProof',
    label: { es: 'Prueba del parentesco con su familiar calificado', en: 'Proof of your relationship to your qualifying relative' },
    detail: {
      es: 'Acta de matrimonio o de nacimiento, según el caso.',
      en: 'Marriage or birth certificate, depending on the relationship.',
    },
    when: (a) => showsHardship(a) && a.vawa !== 'yes',
  },
  {
    id: 'relativeStatus',
    label: { es: 'Prueba de que su familiar es ciudadano o residente', en: 'Proof your relative is a U.S. citizen or resident' },
    detail: {
      es: 'Acta de nacimiento de EE.UU., certificado de naturalización, pasaporte de EE.UU. o la tarjeta de residente (frente y reverso).',
      en: 'U.S. birth certificate, naturalization certificate, U.S. passport, or green card (front and back).',
    },
    when: (a) => showsHardship(a) && (a.vawa !== 'yes' || status(a).some(Boolean)),
  },
  {
    id: 'hardshipEvidence',
    label: { es: 'Pruebas de las dificultades extremas', en: 'Evidence of extreme hardship' },
    detail: {
      es: 'Cartas o informes médicos, comprobantes de ingresos, gastos y deudas, cartas firmadas de quienes conocen la situación e informes sobre su país.',
      en: 'Medical letters or records, proof of income, expenses and debts, signed letters from people who know the situation, and reports on your country.',
    },
    when: showsHardship,
  },
  {
    ...courtRecords,
    label: { es: 'Registros completos de la corte y de la policía', en: 'Complete court and police records' },
    detail: {
      es: 'De cada cargo o condena, en cualquier país, con el resultado final. Agregue pruebas de rehabilitación si tiene. Un abogado debe revisarlas antes de enviar.',
      en: 'For every charge or conviction, in any country, with the final outcome. Add proof of rehabilitation if you have it. An attorney should review them before you file.',
    },
    when: groundSelected('4', '5', '6', '10', '23', '27'),
  },
  {
    id: 'medicalReport',
    label: { es: 'Historial médico completo e informe del médico', en: 'Complete medical history and doctor’s report' },
    detail: {
      es: 'Sobre el trastorno, la conducta, el tratamiento recibido, su estado actual, el pronóstico y el tratamiento disponible en EE.UU.',
      en: 'About the disorder, the behavior, treatment received, your current condition, prognosis and treatment available in the U.S.',
    },
    when: groundSelected('3', '21', '22'),
  },
  {
    id: 'tbPart11',
    label: { es: 'Parte 11 firmada por el médico y el departamento de salud', en: 'Part 11 signed by the physician and the health department' },
    detail: { es: 'Solo si tiene tuberculosis Clase A.', en: 'Only if you have a Class A tuberculosis condition.' },
    when: groundSelected('1', '20'),
  },
  {
    id: 'vaccineBelief',
    label: { es: 'Pruebas de su objeción religiosa o moral a las vacunas', en: 'Evidence of your religious or moral objection to vaccines' },
    detail: {
      es: 'Que se opone a toda vacuna y que su creencia es sincera, por ejemplo cartas de su comunidad religiosa.',
      en: 'That you oppose all vaccines and your belief is sincere, for example letters from your religious community.',
    },
    when: groundSelected('2'),
  },
  {
    id: 'vawaConnection',
    label: { es: 'Pruebas de la relación entre el abuso y su salida o reingreso', en: 'Evidence linking the abuse to your departure or reentry' },
    when: (a) => a.vawa === 'yes' && groundSelected('17')(a),
  },
  {
    id: 'nationalInterest',
    label: { es: 'Si es por visa T: pruebas de que el perdón es de interés nacional', en: 'If based on T status: evidence that the waiver is in the national interest' },
    detail: {
      es: 'Y de que lo que le hace inadmisible fue causado por la trata o se relaciona con ella.',
      en: 'And that what makes you inadmissible was caused by or related to the trafficking.',
    },
    when: is('benefit', 'B'),
  },
  {
    id: 'tpsHumanitarian',
    label: { es: 'Pruebas de razones humanitarias, de unidad familiar o de interés público', en: 'Evidence of humanitarian, family unity or public interest reasons' },
    when: is('benefit', 'C'),
  },
  translations,
];
