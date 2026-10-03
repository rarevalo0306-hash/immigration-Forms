import type { Answers } from '../types';
import type { DocItem } from './types';
import { birthCert, fee, greenCardCopy, photos, translations } from './common';
import { num } from '../helpers';

// From the N-600 instructions: "What Evidence Must You Submit?" (items 1-16) and "What If a Document Is Unavailable?".
// "You" there is the child the certificate is for.
export const formId = 'n-600';

const ended = ['D', 'W', 'A'];
const parentMarried = (a: Answers) => a['parent1.marital'] !== 'S';
const afterBirth = (a: Answers) => a.atBirth !== 'yes';
const outOfWedlock = (a: Answers) => a.adopted !== 'yes' && a.parentsMarriedAtBirth === 'no';

export const docs: DocItem[] = [
  fee,
  {
    ...photos(2),
    label: { es: 'Dos fotos tipo pasaporte iguales (si el hijo/a vive fuera de EE.UU.)', en: 'Two identical passport-style photos (if the child lives outside the U.S.)' },
  },
  {
    ...birthCert,
    label: { es: 'Copia del acta de nacimiento del hijo/a', en: 'Copy of the child’s birth certificate' },
    detail: {
      es: 'Emitida y certificada por el registro civil del país de nacimiento. Si hubo adopción final en EE.UU., el acta corregida.',
      en: 'Issued and certified by the civil registry of the country of birth. If there was a final adoption in the U.S., the amended one.',
    },
  },
  {
    id: 'parentBirthCert',
    label: { es: 'Copia del acta de nacimiento del padre o madre ciudadano', en: 'Copy of the U.S. citizen parent’s birth certificate' },
    detail: { es: 'Emitida y certificada por el registro civil del país donde nació.', en: 'Issued and certified by the civil registry of the country of birth.' },
  },
  {
    id: 'parentCitizenship',
    label: { es: 'Prueba de la ciudadanía de EE.UU. del padre o madre', en: 'Proof of the parent’s U.S. citizenship' },
    detail: {
      es: 'Por ejemplo: acta de nacimiento de EE.UU., certificado de naturalización o de ciudadanía, FS-240 (nacimiento en el extranjero) o pasaporte de EE.UU. vigente.',
      en: 'For example: a U.S. birth certificate, Certificate of Naturalization or Citizenship, FS-240 (birth abroad) or a valid U.S. passport.',
    },
  },
  {
    id: 'parentMarriageCerts',
    label: { es: 'Copia de cada acta de matrimonio del padre o madre ciudadano', en: 'Copy of every marriage certificate of the U.S. citizen parent' },
    detail: { es: 'Certificadas por el registro civil del estado o país donde se casó.', en: 'Certified by the civil registry of the state or country of marriage.' },
    when: parentMarried,
  },
  {
    id: 'childMarriageCerts',
    label: { es: 'Copia de cada acta de matrimonio del hijo/a', en: 'Copy of every marriage certificate of the child' },
    when: (a) => !!a.marital && a.marital !== 'S',
  },
  {
    id: 'priorMarriagesEnded',
    label: { es: 'Prueba de cómo terminó cada matrimonio anterior', en: 'Proof of how each prior marriage ended' },
    detail: {
      es: 'Del hijo/a o del padre o madre ciudadano: sentencia de divorcio certificada, acta de defunción o anulación.',
      en: 'The child’s or the U.S. citizen parent’s: certified divorce decree, death certificate or annulment.',
    },
    when: (a) => ended.includes(String(a['parent1.marital'] ?? '')) || num(a, 'parent1.timesMarried') > 1 || ended.includes(String(a.marital ?? '')),
  },
  {
    id: 'presenceProof',
    label: { es: 'Pruebas de que el padre o madre vivió en EE.UU. antes del nacimiento', en: 'Proof the parent lived in the U.S. before the birth' },
    detail: {
      es: 'Por ejemplo: registros de escuela, trabajo o servicio militar; escrituras o contratos de renta; reportes del Seguro Social; o declaraciones juradas de personas que lo sepan.',
      en: 'For example: school, work or military records; deeds or leases; Social Security reports; or affidavits from people who know.',
    },
    when: (a) => a.atBirth === 'yes',
  },
  {
    ...greenCardCopy,
    label: { es: 'Copia de la tarjeta de residente del hijo/a (frente y reverso)', en: 'Copy of the child’s green card (front and back)' },
    detail: { es: 'Solo si se hizo ciudadano/a después de nacer.', en: 'Only if the child became a citizen after birth.' },
    when: afterBirth,
  },
  {
    id: 'custodyProof',
    label: { es: 'Prueba de la custodia legal y física', en: 'Proof of legal and physical custody' },
    detail: {
      es: 'Si los padres se divorciaron o separaron, o si hubo adopción o legitimación. Para un hijo/a adoptado/a, por lo general basta la orden de adopción.',
      en: 'If the parents divorced or separated, or if there was an adoption or legitimation. For an adopted child, the adoption order is usually enough.',
    },
    when: (a) => afterBirth(a) && (a.adopted === 'yes' || outOfWedlock(a) || ['D', 'E'].includes(String(a['parent1.marital'] ?? ''))),
  },
  {
    id: 'legitimation',
    label: { es: 'Prueba de legitimación o de paternidad', en: 'Proof of legitimation or paternity' },
    detail: {
      es: 'Del país o estado donde se legitimó. Si reclama ciudadanía al nacer, también sirve el reconocimiento de paternidad por escrito bajo juramento o una orden de la corte.',
      en: 'From the country or state where it happened. If claiming citizenship at birth, a written sworn acknowledgment of paternity or a court order also works.',
    },
    when: (a) => outOfWedlock(a) && a['parent1.role'] !== 'mother',
  },
  {
    id: 'adoptionDecree',
    label: { es: 'Copia del decreto de adopción completo y final', en: 'Copy of the full, final adoption decree' },
    detail: {
      es: 'Si hubo que adoptar de nuevo en EE.UU., el decreto del estado; o prueba de que el estado reconoce la adopción extranjera.',
      en: 'If a re-adoption in the U.S. was needed, the state decree; or proof that the state recognizes the foreign adoption.',
    },
    when: (a) => a.adopted === 'yes',
  },
  {
    id: 'childCitizenshipProof',
    label: { es: 'Prueba de la ciudadanía del hijo/a (si tiene)', en: 'Proof of the child’s citizenship (if any)' },
    detail: { es: 'Por ejemplo, un FS-240 o un pasaporte de EE.UU. vigente.', en: 'For example, an FS-240 or a valid U.S. passport.' },
    when: (a) => a.prevPassport === 'yes',
  },
  {
    id: 'nameDobChange',
    label: { es: 'Prueba de cambios legales de nombre o fecha de nacimiento (si hubo)', en: 'Proof of legal changes of name or date of birth (if any)' },
    detail: { es: 'Por ejemplo, la orden certificada de la corte.', en: 'For example, the certified court order.' },
  },
  {
    id: 'secondaryEvidence',
    label: { es: 'Si no consigue un documento: una explicación y otras pruebas', en: 'If you can’t get a document: an explanation and other evidence' },
    detail: {
      es: 'Explique por escrito por qué no está disponible y envíe, por ejemplo, fe de bautismo, registros escolares o del censo, o declaraciones juradas de dos personas que lo sepan.',
      en: 'Explain in writing why it is unavailable and send, for example, a baptismal certificate, school or census records, or affidavits from two people who know.',
    },
  },
  translations,
];
