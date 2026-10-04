import type { DocItem } from './types';
import { birthCert, courtRecords, i94Copy, marriageCert, priorMarriagesEnded, translations } from './common';

// From the I-539 instructions (which cover Form I-539A): the I-94 for each person included,
// "Evidence of Relationship" (General Requirements), and the general instructions on translations.
// No fee: the fee is paid with the principal's Form I-539.
export const formId = 'i-539a';

export const docs: DocItem[] = [
  {
    ...i94Copy,
    label: { es: 'Copia del I-94 de este familiar (frente y reverso)', en: 'Copy of this family member’s I-94 (front and back)' },
  },
  {
    id: 'dependentVisas',
    label: { es: 'Copia de la visa de este familiar', en: 'Copy of this family member’s visa' },
    detail: { es: 'La que muestra su clasificación de dependiente o el nombre del titular principal.', en: 'The one showing their dependent classification or the principal’s name.' },
  },
  {
    ...marriageCert,
    detail: { es: 'Del matrimonio con el solicitante principal.', en: 'Of the marriage to the principal applicant.' },
    when: (a) => a['co.relationship'] !== 'child' && a['co.relationship'] !== 'other',
  },
  {
    ...priorMarriagesEnded,
    detail: {
      es: 'Si este familiar o el solicitante principal estuvieron casados antes: sentencia de divorcio, acta de defunción o anulación.',
      en: 'If this family member or the principal applicant was married before: divorce decree, death certificate or annulment.',
    },
    when: (a) => a['co.relationship'] !== 'child' && a['co.relationship'] !== 'other',
  },
  {
    ...birthCert,
    label: { es: 'Copia del acta de nacimiento del hijo/a', en: 'Copy of the child’s birth certificate' },
    detail: { es: 'O el decreto de adopción, con el nombre del hijo/a y de los padres.', en: 'Or the adoption decree, showing the child’s and the parents’ names.' },
    when: (a) => a['co.relationship'] === 'child',
  },
  {
    id: 'otherRelationship',
    label: { es: 'Pruebas del parentesco con el solicitante principal', en: 'Proof of the relationship to the principal applicant' },
    detail: { es: 'Documentos que muestren cómo están emparentados.', en: 'Documents showing how you are related.' },
    when: (a) => a['co.relationship'] === 'other',
  },
  {
    id: 'supportProof',
    label: { es: 'Pruebas de cómo se mantiene este familiar', en: 'Proof of how this family member is supported' },
    detail: {
      es: 'De dónde viene el dinero, cuánto y por qué lo recibe: por ejemplo, estados de cuenta o la carta de empleo del solicitante principal.',
      en: 'The source, amount and basis of the income: for example, bank statements or the principal applicant’s employment letter.',
    },
    when: (a) => a['co.employed'] === 'no',
  },
  { ...courtRecords, when: (a) => a['co.p3.4'] === 'yes' },
  translations,
];
