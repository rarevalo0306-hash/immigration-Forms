import type { DocItem } from './types';
import { translations } from './common';
import { is } from '../helpers';

// From the I-407 instructions: "Documents Returned" (Items 11-18) and the parent or guardian consent (Items 19-20).
export const formId = 'i-407';

const guardian = is('filer', 'guardian');

export const docs: DocItem[] = [
  {
    id: 'greenCardOriginal',
    label: { es: 'Su tarjeta de residente (la original)', en: 'Your Permanent Resident Card (the original)' },
    detail: {
      es: 'Se entrega junto con el formulario. Saque una copia para usted antes de entregarla.',
      en: 'You hand it in with the form. Make a copy for yourself before you do.',
    },
    when: (a) => a.cardReturned !== 'no',
  },
  {
    id: 'otherTravelDocs',
    label: { es: 'Los otros documentos que devuelve (originales)', en: 'The other documents you are returning (originals)' },
    detail: {
      es: 'Todo permiso de reingreso (I-327) o documento de viaje de refugiado (I-571) que tenga.',
      en: 'Any reentry permit (I-327) or refugee travel document (I-571) you have.',
    },
    when: (a) => a['otherDocs.has'] === 'yes',
  },
  {
    id: 'guardianProof',
    label: { es: 'Prueba de que el padre, madre o tutor puede firmar', en: 'Proof that the parent or guardian can sign' },
    detail: {
      es: 'Para un menor: acta de nacimiento o acuerdo de custodia. Para un tutor: la carta o la orden de tutela del tribunal o la agencia del gobierno.',
      en: 'For a child: birth certificate or custody agreement. For a guardian: the letter or order of guardianship from the court or government agency.',
    },
    when: guardian,
  },
  { ...translations, when: guardian },
];
