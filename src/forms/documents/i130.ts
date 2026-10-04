import type { DocItem } from './types';
import type { Answers } from '../types';
import { fee, greenCardCopy, marriageCert, photos, priorMarriagesEnded, translations } from './common';
import { is, num } from '../helpers';

// From the I-130 instructions (edition 04/01/24): "General Instructions" (evidence of status and of the
// family relationship, items 3–8) and the Checklist.
export const formId = 'i-130';

const spouse = is('relationship', 'spouse');
const viaMarriage = (a: Answers) => is('relationship', 'child', 'parent')(a) && is('childRelationship', 'inWedlock', 'stepchild')(a);
const benMayBeInUS = (a: Answers) => a['ben.everInUS'] !== 'no' && a['ben.inUSNow'] !== 'no';
const priorMarriage = (a: Answers) =>
  a['pet.spouse.more1'] === 'yes' || a['ben.spouse.more1'] === 'yes' || num(a, 'pet.timesMarried') > 1 || num(a, 'ben.timesMarried') > 1;
const filled = (id: string) => (a: Answers) => String(a[id] ?? '').trim() !== '';

export const docs: DocItem[] = [
  fee,
  {
    id: 'i130aWith',
    label: { es: 'El Formulario I-130A de su cónyuge', en: 'Your spouse’s Form I-130A' },
    detail: { es: 'Se envía junto con este I-130. Su cónyuge lo llena en Camino.', en: 'Filed together with this I-130. Your spouse fills it in Camino.' },
    when: spouse,
  },
  {
    id: 'citizenshipProof',
    label: { es: 'Prueba de su ciudadanía de EE.UU.', en: 'Proof of your U.S. citizenship' },
    detail: {
      es: 'Copia de una de estas: acta de nacimiento de EE.UU., certificado de naturalización o de ciudadanía, el FS-240 (nacimiento en el extranjero) o su pasaporte de EE.UU. vigente.',
      en: 'A copy of one of these: U.S. birth certificate, naturalization or citizenship certificate, Form FS-240 (birth abroad), or your unexpired U.S. passport.',
    },
    when: (a) => a['pet.status'] !== 'lpr',
  },
  {
    ...greenCardCopy,
    detail: {
      es: 'Si todavía no le llega, copia de su pasaporte con el sello de admisión como residente.',
      en: 'If you haven’t received it yet, a copy of your passport with the stamp admitting you as a resident.',
    },
    when: is('pet.status', 'lpr'),
  },
  {
    ...photos(2),
    label: { es: 'Dos fotos suyas tipo pasaporte', en: 'Two passport-style photos of you' },
    when: spouse,
  },
  {
    ...photos(2),
    id: 'spousePhotos',
    label: { es: 'Dos fotos tipo pasaporte de su cónyuge (si está en EE.UU.)', en: 'Two passport-style photos of your spouse (if in the U.S.)' },
    when: (a) => spouse(a) && benMayBeInUS(a),
  },
  {
    ...marriageCert,
    detail: {
      es: 'Si pide por su cónyuge, su acta de matrimonio. Si pide como padre o padrastro, el acta de matrimonio con la madre o el padre del niño.',
      en: 'If filing for your spouse, your marriage certificate. If filing as a father or stepparent, the marriage certificate with the child’s mother or father.',
    },
    when: (a) => spouse(a) || viaMarriage(a),
  },
  { ...priorMarriagesEnded, when: (a) => (spouse(a) && priorMarriage(a)) || viaMarriage(a) },
  {
    id: 'bonaFideMarriage',
    label: { es: 'Pruebas de que su matrimonio es real', en: 'Proof that your marriage is real' },
    detail: {
      es: 'Una o más: contrato de renta o escritura a nombre de los dos, cuentas de banco juntos, actas de nacimiento de sus hijos, o declaraciones juradas de personas que los conocen.',
      en: 'One or more: a lease or deed in both names, joint bank accounts, your children’s birth certificates, or sworn statements from people who know you as a couple.',
    },
    when: spouse,
  },
  {
    id: 'clearConvincing',
    label: { es: 'Pruebas fuertes de que se casaron de buena fe', en: 'Strong proof that you married in good faith' },
    detail: {
      es: 'Se piden si se casaron mientras su cónyuge estaba en un caso de deportación (con una carta pidiendo la exención de buena fe), o si usted obtuvo la residencia por un matrimonio anterior. Consulte a un abogado.',
      en: 'Required if you married while your spouse was in removal proceedings (with a letter asking for the bona fide marriage exemption), or if you got residence through a prior marriage. Talk to an attorney.',
    },
    when: (a) => spouse(a) && (a['ben.proceedings'] === 'yes' || a['pet.lprByMarriage'] === 'yes'),
  },
  {
    id: 'relationshipBirthCerts',
    label: { es: 'Actas de nacimiento que prueban el parentesco', en: 'Birth certificates that prove the relationship' },
    detail: {
      es: 'Por un hijo/a: el acta del hijo/a con su nombre. Por su padre o madre: su propia acta con el nombre de ellos. Por un hermano/a: las actas de los dos, con al menos un padre en común.',
      en: 'For a child: the child’s certificate showing your name. For a parent: your own certificate showing their name. For a sibling: both certificates, showing at least one common parent.',
    },
    when: is('relationship', 'child', 'parent', 'sibling'),
  },
  {
    id: 'legitimation',
    label: { es: 'Prueba de la relación de padre con un hijo nacido fuera del matrimonio', en: 'Proof of a father’s relationship with a child born out of wedlock' },
    detail: {
      es: 'Prueba de que el niño fue legitimado antes de los 18 años, o de que fueron padre e hijo de verdad antes de los 21 (vivieron juntos, lo mantuvo, etc.).',
      en: 'Proof the child was legitimated before age 18, or of a real father-child relationship before 21 (you lived together, you supported the child, etc.).',
    },
    when: is('childRelationship', 'outOfWedlock'),
  },
  {
    id: 'adoptionDecree',
    label: { es: 'Copia del decreto de adopción', en: 'Copy of the adoption decree' },
    detail: {
      es: 'Que muestre que la adopción fue antes de los 16 años, y prueba de que el niño vivió con los padres adoptivos y bajo su custodia legal al menos 2 años.',
      en: 'Showing the adoption took place before age 16, and proof the child lived with and was in the legal custody of the adoptive parents for at least 2 years.',
    },
    when: (a) => a.childRelationship === 'adopted' || a.siblingAdopted === 'yes',
  },
  {
    id: 'nameChange',
    label: { es: 'Prueba de cambio de nombre', en: 'Proof of a name change' },
    detail: {
      es: 'Si usted o su familiar usan un nombre distinto al de los documentos: acta de matrimonio, decreto de adopción u orden de la corte.',
      en: 'If you or your relative use a name different from the one on the documents: marriage certificate, adoption decree or court order.',
    },
    when: (a) => filled('pet.otherName.family')(a) || filled('ben.otherName.family')(a),
  },
  translations,
];
