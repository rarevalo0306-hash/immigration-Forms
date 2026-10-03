import type { Answers } from '../types';
import type { DocItem } from './types';
import { birthCert, i94Copy, marriageCert, photos, priorMarriagesEnded, translations } from './common';
import { is } from '../helpers';

// From the I-730 instructions: "What Documents Do You Need to Prove Eligibility and A Family
// Relationship?", "What If A Document Is Not Available?" and "What Additional Documents Must You Submit?"
export const formId = 'i-730';

const isSpouse = is('relationship', 'S');
const isChild = is('relationship', 'U');
const childType = (...v: string[]) => (a: Answers) => isChild(a) && is('childType', ...v)(a);

export const docs: DocItem[] = [
  {
    id: 'statusProof',
    label: { es: 'Prueba de su estatus de asilado o refugiado', en: 'Proof of your asylee or refugee status' },
    detail: {
      es: 'Por ejemplo, la carta de USCIS o la orden del juez que le dio asilo, o su I-94 de refugiado.',
      en: 'For example, the USCIS approval notice or judge’s order granting asylum, or your refugee I-94.',
    },
  },
  {
    ...photos(1),
    label: { es: 'Una foto tipo pasaporte reciente de su familiar', en: 'A recent passport-style photo of your relative' },
    detail: {
      es: 'Clara, de frente, con las medidas de pasaporte. Escriba el nombre de su familiar a lápiz al reverso.',
      en: 'Clear, full-face, meeting passport specifications. Write your relative’s name in pencil on the back.',
    },
  },
  { ...marriageCert, label: { es: 'Copia de su acta de matrimonio', en: 'Copy of your marriage certificate' }, when: isSpouse },
  {
    ...birthCert,
    label: { es: 'Copia del acta de nacimiento de su cónyuge', en: 'Copy of your spouse’s birth certificate' },
    when: isSpouse,
  },
  {
    ...priorMarriagesEnded,
    detail: {
      es: 'De usted y de su cónyuge: sentencia de divorcio, acta de defunción o anulación.',
      en: 'For you and your spouse: divorce decree, death certificate or annulment.',
    },
    when: (a) => isSpouse(a) && (a['pet.prior.more0'] === 'yes' || a['ben.prior.more0'] === 'yes'),
  },
  {
    ...birthCert,
    id: 'childBirthCert',
    label: { es: 'Copia del acta de nacimiento de su hijo o hija', en: 'Copy of your child’s birth certificate' },
    detail: {
      es: 'Debe mostrar el nombre del niño y el suyo.',
      en: 'It must show the child’s name and yours.',
    },
    when: childType('BC', 'SC'),
  },
  {
    id: 'fatherTies',
    label: { es: 'Si es el padre: prueba de la relación con su hijo', en: 'If you are the father: proof of your relationship with your child' },
    detail: {
      es: 'Si estaba casado con la madre, su acta de matrimonio. Si no, prueba de que el niño fue legitimado o de su relación real con él: envíos de dinero, impuestos, registros médicos o escolares, cartas.',
      en: 'If you were married to the mother, your marriage certificate. If not, proof the child was legitimated or of your real relationship: money transfers, tax returns, medical or school records, letters.',
    },
    when: (a) => childType('BC')(a) && a.sex !== 'female',
  },
  {
    ...marriageCert,
    id: 'stepMarriageCert',
    label: { es: 'Acta de matrimonio con el padre o la madre de su hijastro', en: 'Marriage certificate with your stepchild’s parent' },
    detail: {
      es: 'Y prueba de que terminó cualquier matrimonio anterior de usted o de ese padre o madre.',
      en: 'And proof that any prior marriage of yours or of that parent ended.',
    },
    when: childType('SC'),
  },
  {
    id: 'adoptionDecree',
    label: { es: 'Copia certificada de la sentencia de adopción', en: 'Certified copy of the adoption decree' },
    detail: {
      es: 'Con prueba de que vivieron juntos al menos 2 años y, si tuvo la custodia antes de adoptar, la orden de custodia.',
      en: 'With proof you lived together at least 2 years and, if you had custody before the adoption, the custody order.',
    },
    when: childType('AC'),
  },
  {
    id: 'nameChange',
    label: { es: 'Prueba de cualquier cambio legal de nombre (si aplica)', en: 'Proof of any legal name change (if it applies)' },
    detail: {
      es: 'Si los nombres en las actas no coinciden con los de la petición.',
      en: 'If the names on the certificates do not match the names on the petition.',
    },
  },
  {
    id: 'secondaryEvidence',
    label: { es: 'Si no consigue un acta: otras pruebas', en: 'If you can’t get a certificate: other evidence' },
    detail: {
      es: 'Una constancia de la autoridad civil de que no existe, más registros religiosos, escolares o de censo. Si tampoco hay, dos declaraciones juradas de personas que conozcan el hecho.',
      en: 'A statement from the civil authority that it is not available, plus religious, school or census records. If those don’t exist either, sworn statements from two people who know the facts.',
    },
  },
  {
    ...i94Copy,
    label: { es: 'Copia de ambos lados del I-94 de su familiar (si tiene)', en: 'Copy of both sides of your relative’s I-94 (if any)' },
    when: (a) => a['ben.location'] !== 'B',
  },
  translations,
];
