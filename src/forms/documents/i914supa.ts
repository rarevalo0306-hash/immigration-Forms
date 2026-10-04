import type { Answers } from '../types';
import type { DocItem } from './types';
import { birthCert, courtRecords, marriageCert, priorMarriagesEnded, translations } from './common';
import { CRIME_ITEMS, ITEM2_RELATIONS, PROCESSING_ITEMS, mayNeedDanger } from '../i914supa';

// From the I-914 instructions (01/20/25): "Completing Form I-914, Supplement A", "Initial Evidence"
// and "Evidence to Establish Derivative T Nonimmigrant Status". There is no filing fee.
export const formId = 'i-914supa';

const relation = (a: Answers) => String(a['fam.relation'] ?? '');
const isRel = (...r: string[]) => (a: Answers) => r.includes(relation(a));
const anyYes = (ids: string[]) => (a: Answers) => ids.some((id) => a[id] === 'yes');
const hadPrior = (a: Answers) => ['Divorced', 'Widowed', 'Annulled'].includes(String(a['fam.marital'] ?? '')) || a['fam.priorMarried'] === 'yes';

export const docs: DocItem[] = [
  {
    ...marriageCert,
    detail: { es: 'Emitida por la autoridad civil (registro civil).', en: 'Issued by a civil authority.' },
    when: isRel('spouse', 'spouseChild'),
  },
  {
    ...priorMarriagesEnded,
    detail: {
      es: 'Si usted o su familiar estuvieron casados antes: sentencia de divorcio, acta de defunción o anulación de cada matrimonio anterior.',
      en: 'If you or your family member were married before: divorce decree, death certificate or annulment for each prior marriage.',
    },
    when: (a) => relation(a) === 'spouse' || hadPrior(a),
  },
  {
    id: 'relativeBirthCert',
    label: { es: 'Copia del acta de nacimiento de su familiar', en: 'Copy of your family member’s birth certificate' },
    detail: {
      es: 'Emitida por la autoridad civil, con el nombre de los padres. Si usted es el padre, adjunte también su acta de matrimonio o, si no estaban casados, pruebas de la relación (por ejemplo, de que lo/la ha mantenido).',
      en: 'Issued by a civil authority, showing the parents’ names. If you are the father, also attach your marriage certificate or, if you were not married, proof of the relationship (for example, that you supported the child).',
    },
    when: (a) => relation(a) !== 'spouse' && relation(a) !== 'parent',
  },
  {
    ...birthCert,
    detail: {
      es: 'Con el nombre de su madre y de su padre. Si pide por su padre, adjunte también el acta de matrimonio de sus padres.',
      en: 'Showing your mother’s and father’s names. If you are filing for your father, also attach your parents’ marriage certificate.',
    },
    when: isRel('parent', 'sibling', 'adultSibling', 'nieceNephew'),
  },
  {
    id: 'stepAdoption',
    label: { es: 'Si el parentesco es por adopción o es un padrastro/madrastra: el decreto de adopción o el acta de matrimonio', en: 'If the relationship is through adoption or a stepparent: the adoption decree or the marriage certificate' },
    detail: {
      es: 'La adopción debe ser antes de los 16 años (con pruebas de dos años de custodia y convivencia); el matrimonio del padrastro o la madrastra, antes de que el niño cumpliera 18.',
      en: 'The adoption must be before age 16 (with proof of two years of custody and living together); the stepparent’s marriage, before the child turned 18.',
    },
    when: (a) => relation(a) !== 'spouse',
  },
  {
    id: 'parentSupplementA',
    label: { es: 'El Suplemento A del padre o la madre de su familiar', en: 'The Supplement A of your family member’s parent' },
    detail: {
      es: 'USCIS debe aprobar primero el Suplemento A del padre o la madre (su esposo/a, hijo/a o hermano/a). Puede enviarlos juntos, o adjuntar la aprobación si ya la tiene.',
      en: 'USCIS must first approve the Supplement A of the parent (your spouse, child or sibling). You may file them together, or attach the approval if you have it.',
    },
    when: (a) => ITEM2_RELATIONS.includes(relation(a)),
  },
  {
    id: 'retaliationEvidence',
    label: { es: 'Descripción y pruebas del peligro de represalias', en: 'Description and evidence of the danger of retaliation' },
    detail: {
      es: 'Explique qué peligro corre su familiar y cómo tiene que ver con su escape o su colaboración con la policía. Envíe las pruebas que tenga: declaraciones, reportes de policía, documentos de la corte, noticias, o un permiso de viaje (parole) anterior.',
      en: 'Explain the danger your family member faces and how it is linked to your escape or your cooperation with law enforcement. Send the evidence you have: statements, police reports, court documents, news articles, or an earlier grant of parole.',
    },
    when: mayNeedDanger,
  },
  {
    id: 'principalStatus',
    label: { es: 'Copia de su recibo o de la aprobación de su visa T', en: 'Copy of your T visa receipt or approval notice' },
    detail: {
      es: 'Si presenta el Suplemento A después de su I-914. No hace falta volver a enviar las pruebas que ya mandó.',
      en: 'If you file Supplement A after your I-914. You do not need to resend evidence you already sent.',
    },
    when: (a) => a.i914Status === 'pending' || a.i914Status === 'approved',
  },
  {
    id: 'i192',
    label: { es: 'Formulario I-192 (perdón de inadmisibilidad) para su familiar', en: 'Form I-192 (waiver of inadmissibility) for your family member' },
    detail: {
      es: 'Si contestó Sí a alguna pregunta de la Parte 4. Pregunte a su abogado si lo necesita.',
      en: 'If you answered Yes to any Part 4 question. Ask your attorney whether it is needed.',
    },
    when: anyYes(PROCESSING_ITEMS.map((i) => i.id)),
  },
  { ...courtRecords, when: anyYes(CRIME_ITEMS.map((i) => i.id)) },
  {
    id: 'i765',
    label: { es: 'Formulario I-765 (permiso de trabajo) de su familiar', en: 'Your family member’s Form I-765 (work permit)' },
    detail: {
      es: 'Con su tarifa o el Formulario I-912 (exención). Solo si su familiar está en EE.UU.; puede enviarlo después.',
      en: 'With its fee or Form I-912 (fee waiver). Only if your family member is in the U.S.; it can also be filed later.',
    },
    when: (a) => a['fam.ead'] === 'yes' && a['fam.inUS'] !== 'no',
  },
  translations,
];
