import type { Answers } from '../types';
import type { DocItem } from './types';
import { birthCert, courtRecords, marriageCert, priorMarriagesEnded, translations } from './common';
import { is } from '../helpers';
import { FAM_CRIME_ITEMS, FAM_PROCESSING_ITEMS } from '../i918supa';

// From the I-918 instructions (which cover Supplement A): "Supplement A and Evidence to Support
// Supplement A", Part 4, Items 5-8 and "Waiver of Grounds of Inadmissibility". There is no filing fee.
export const formId = 'i-918supa';

const anyYes = (ids: string[]) => (a: Answers) => ids.some((id) => a[id] === 'yes');
const rel = (...v: string[]) => is('relationship', ...v);

const unavailable = {
  es: 'Si no existe, envíe una carta que explique por qué y otras pruebas: registros de la iglesia, de la escuela o del censo, o declaraciones juradas de dos personas que conozcan los hechos.',
  en: 'If it doesn’t exist, send a letter explaining why plus other evidence: church, school or census records, or sworn statements from two people who know the facts.',
};

export const docs: DocItem[] = [
  {
    ...marriageCert,
    label: { es: 'Copia de su acta de matrimonio con su esposo/a', en: 'Copy of your marriage certificate with your spouse' },
    detail: { es: `Emitida por el registro civil. ${unavailable.es}`, en: `Issued by a civil authority. ${unavailable.en}` },
    when: rel('Spouse'),
  },
  {
    ...priorMarriagesEnded,
    detail: {
      es: 'De usted y de su familiar, por cada matrimonio anterior: sentencia de divorcio o acta de defunción.',
      en: 'For you and your family member, for each prior marriage: divorce decree or death certificate.',
    },
    when: (a) => rel('Spouse')(a) || a['fam.priorSpouse.more0'] === 'yes',
  },
  {
    ...birthCert,
    id: 'childBirthCert',
    label: { es: 'Copia del acta de nacimiento de su hijo/a', en: 'Copy of your child’s birth certificate' },
    detail: {
      es: `Debe mostrar su nombre como madre o padre. Si es el padre y no estaba casado con la madre, agregue prueba de la relación (por ejemplo, de que lo/la ha mantenido). ${unavailable.es}`,
      en: `It must show your name as the parent. If you are the father and were not married to the mother, add proof of the relationship (for example, that you have supported the child). ${unavailable.en}`,
    },
    when: rel('Child'),
  },
  {
    ...birthCert,
    detail: {
      es: `Debe mostrar el nombre de su padre o madre. Si pide por su padre, agregue el acta de matrimonio de sus padres. ${unavailable.es}`,
      en: `It must show your parent’s name. If you are filing for your father, add your parents’ marriage certificate. ${unavailable.en}`,
    },
    when: rel('Parent'),
  },
  {
    ...birthCert,
    id: 'siblingBirthCerts',
    label: { es: 'Copias de su acta de nacimiento y la de su hermano/a', en: 'Copies of your and your sibling’s birth certificates' },
    detail: {
      es: `Deben mostrar que tienen al menos un padre o madre en común. Si solo comparten el padre, agregue las actas de matrimonio del padre con cada madre. ${unavailable.es}`,
      en: `They must show at least one parent in common. If you share only your father, add his marriage certificates to each mother. ${unavailable.en}`,
    },
    when: rel('Unmarried'),
  },
  {
    id: 'stepAdoption',
    label: { es: 'Si son familia por adopción o por un padrastro o madrastra: los documentos de eso', en: 'If you are related by adoption or through a stepparent: those documents' },
    detail: {
      es: 'El decreto de adopción (antes de los 16 años) y prueba de 2 años de custodia y convivencia, o el acta de matrimonio del padrastro o la madrastra (antes de que el niño cumpliera 18).',
      en: 'The adoption decree (before age 16) and proof of 2 years of custody and living together, or the stepparent’s marriage certificate (before the child turned 18).',
    },
    when: rel('Child', 'Parent', 'Unmarried'),
  },
  {
    id: 'nameChange',
    label: { es: 'Si un nombre cambió: el documento legal del cambio', en: 'If a name changed: the legal name change document' },
    detail: {
      es: 'Por ejemplo, el acta de matrimonio, el decreto de adopción o la orden del juez, si su nombre o el de su familiar no es el mismo que en los documentos.',
      en: 'For example, the marriage certificate, adoption decree or court order, if your or your family member’s name differs from the documents.',
    },
    when: (a) => a['fam.otherName.more0'] === 'yes',
  },
  {
    id: 'i192',
    label: { es: 'Formulario I-192 (perdón de inadmisibilidad) para su familiar', en: 'Form I-192 (waiver of inadmissibility) for your family member' },
    detail: {
      es: 'Si contestó Sí a alguna pregunta de la Parte 5. Un abogado puede decirle si hace falta.',
      en: 'If you answered Yes to any Part 5 question. An attorney can tell you whether it is needed.',
    },
    when: anyYes(FAM_PROCESSING_ITEMS.map((i) => i.id)),
  },
  { ...courtRecords, when: anyYes(FAM_CRIME_ITEMS.map((i) => i.id)) },
  {
    id: 'i765',
    label: { es: 'Formulario I-765 (permiso de trabajo) para su familiar, aparte', en: 'Form I-765 (work permit) for your family member, separately' },
    detail: {
      es: 'Solo si está en EE.UU. y contestó Sí en la Parte 4, Ítem 8. Se presenta aparte; el permiso llega después de que aprueben el suplemento.',
      en: 'Only if they are in the U.S. and you answered Yes to Part 4, Item 8. It is filed separately; the permit comes after the supplement is approved.',
    },
    when: (a) => a['fam.inUS'] === 'yes' && a['fam.ead'] === 'yes',
  },
  translations,
];
