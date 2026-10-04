import type { Answers } from '../types';
import type { DocItem } from './types';
import { birthCert, courtRecords, fee, greenCardCopy, marriageCert, priorMarriagesEnded, translations } from './common';
import { is } from '../helpers';

// From the I-601A instructions: "What Evidence Must I Submit With Form I-601A?"
export const formId = 'i-601a';

const isDV = is('basis', '1');
const relationships = (a: Answers) => [a['qualifying1.relationship'], a['qualifying2.relationship']].map((v) => String(v ?? ''));
const hasRel = (...v: string[]) => (a: Answers) => {
  const r = relationships(a);
  return r.every((x) => !x) || r.some((x) => v.includes(x));
};

export const docs: DocItem[] = [
  fee,
  {
    id: 'petitionApproval',
    label: { es: 'Copia de la aprobación de la petición (I-797)', en: 'Copy of the petition approval notice (I-797)' },
    detail: {
      es: 'Del I-130, I-140 o I-360 presentado por usted o a su favor, si la tiene.',
      en: 'For the I-130, I-140 or I-360 filed by you or for you, if you have it.',
    },
    when: (a) => !isDV(a),
  },
  {
    id: 'dosFeeReceipt',
    label: { es: 'Recibo del pago de la visa al Departamento de Estado', en: 'Receipt for the Department of State immigrant visa fee' },
    detail: {
      es: 'Póngalo encima del formulario. Se descarga de su cuenta del Centro Nacional de Visas (NVC).',
      en: 'Place it on top of the form. Download it from your National Visa Center (NVC) account.',
    },
    when: (a) => !isDV(a),
  },
  {
    id: 'dvStatus',
    label: { es: 'Impresión de "DV Entrant Status Check" de la lotería', en: 'Printout of the DV Entrant Status Check page' },
    detail: {
      es: 'De dvprogram.state.gov, que muestre que usted (o su cónyuge o padre) fue seleccionado.',
      en: 'From dvprogram.state.gov, showing that you (or your spouse or parent) were selected.',
    },
    when: isDV,
  },
  {
    ...marriageCert,
    label: { es: 'Prueba del parentesco con su familiar calificado', en: 'Proof of your relationship to your qualifying relative' },
    detail: {
      es: 'Con su cónyuge: el acta de matrimonio. No hace falta si ese familiar es quien hizo su petición familiar.',
      en: 'With your spouse: the marriage certificate. Not needed if that relative is the one who filed your family petition.',
    },
    when: hasRel('A', 'C'),
  },
  { ...priorMarriagesEnded, detail: { es: 'De usted o de su cónyuge: sentencia de divorcio, acta de defunción o anulación.', en: 'Yours or your spouse’s: divorce decree, death certificate or annulment.' }, when: hasRel('A', 'C') },
  {
    ...birthCert,
    detail: {
      es: 'Si su familiar calificado es su padre o madre: debe mostrar el nombre de ese padre o madre. Con su padre, agregue el acta de matrimonio de sus padres o prueba de la relación.',
      en: 'If your qualifying relative is your parent: it must show that parent’s name. For your father, add your parents’ marriage certificate or proof of the relationship.',
    },
    when: hasRel('B', 'D'),
  },
  {
    id: 'relativeCitizenship',
    label: { es: 'Prueba de que su familiar es ciudadano de EE.UU.', en: 'Proof your relative is a U.S. citizen' },
    detail: {
      es: 'Acta de nacimiento de EE.UU., certificado de naturalización o ciudadanía, pasaporte de EE.UU. vigente o FS-240. No hace falta si ese familiar es quien hizo su petición familiar.',
      en: 'U.S. birth certificate, naturalization or citizenship certificate, valid U.S. passport, or FS-240. Not needed if that relative filed your family petition.',
    },
    when: hasRel('A', 'B'),
  },
  {
    ...greenCardCopy,
    label: { es: 'Copia de la tarjeta de residente de su familiar (frente y reverso)', en: 'Copy of your relative’s green card (front and back)' },
    detail: {
      es: 'No hace falta si ese familiar es quien hizo su petición familiar.',
      en: 'Not needed if that relative filed your family petition.',
    },
    when: hasRel('C', 'D'),
  },
  {
    id: 'hardshipEvidence',
    label: { es: 'Pruebas de las dificultades extremas para su familiar', en: 'Evidence of extreme hardship to your relative' },
    detail: {
      es: 'Por ejemplo: cartas o informes médicos, comprobantes de ingresos, gastos y deudas, cartas firmadas de familiares y conocidos, e informes sobre su país.',
      en: 'For example: medical letters or records, proof of income, expenses and debts, signed letters from relatives and others, and reports on your country.',
    },
  },
  {
    id: 'admissionProof',
    label: { es: 'Prueba de su entrada legal (si entró con inspección)', en: 'Proof of your lawful entry (if you were inspected)' },
    detail: {
      es: 'Su I-94 o el pasaporte con el sello de entrada o de parole.',
      en: 'Your I-94 or your passport with the admission or parole stamp.',
    },
    when: (a) => !/ewi|without|sin inspec/i.test(String(a['lastEntry.status'] ?? '')),
  },
  {
    id: 'adminClosure',
    label: { es: 'Copia de la orden de cierre administrativo de la corte', en: 'Copy of the court’s administrative closure order' },
    when: is('proceedingsStatus', 'A'),
  },
  {
    id: 'i212Approval',
    label: { es: 'Copia de la aprobación de su I-212 (si la tiene)', en: 'Copy of your I-212 approval notice (if you have it)' },
    when: is('finalOrder', 'yes'),
  },
  { ...courtRecords, when: (a) => a['p1.34'] === 'yes' || a['p1.35'] === 'yes' },
  translations,
];
