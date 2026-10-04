import type { DocItem } from './types';
import { eadCopy, fee, i94Copy, idCopy, photos, translations, courtRecords } from './common';
import { is } from '../helpers';

// From the I-765 instructions: "General Evidence" and the evidence for each eligibility category.
export const formId = 'i-765';

const cat = (...c: string[]) => is('category', ...c);

export const docs: DocItem[] = [
  fee,
  photos(2),
  {
    ...eadCopy,
    when: (a) => is('reason', 'renewal', 'replacement')(a) || a.previousI765 === 'yes',
  },
  {
    ...idCopy,
    detail: {
      es: 'Si nunca tuvo permiso de trabajo: pasaporte, visa, acta de nacimiento con una identificación con foto, u otra identificación del gobierno.',
      en: 'If you never had a work permit: passport, visa, birth certificate with a photo ID, or another government ID.',
    },
    when: (a) => a.reason === 'initial' && a.previousI765 !== 'yes',
  },
  { ...i94Copy, label: { es: 'Copia de su I-94 (si tiene uno)', en: 'Copy of your I-94 (if you have one)' } },
  {
    id: 'i485Receipt',
    label: { es: 'Copia del recibo de su I-485 (I-797C)', en: 'Copy of your I-485 receipt notice (I-797C)' },
    detail: { es: 'O envíe el I-765 junto con el I-485.', en: 'Or file the I-765 together with the I-485.' },
    when: cat('(c)(9)'),
  },
  {
    id: 'asylumPending',
    label: { es: 'Prueba de su solicitud de asilo pendiente', en: 'Proof of your pending asylum application' },
    detail: {
      es: 'Copia del recibo del I-589 o, si lo presentó en la corte, del I-589 sellado o del aviso de la corte.',
      en: 'A copy of the I-589 receipt or, if filed in court, the stamped I-589 or the court notice.',
    },
    when: cat('(c)(8)'),
  },
  { ...courtRecords, when: (a) => cat('(c)(8)')(a) && a.arrested === 'yes' },
  {
    id: 'asylumGranted',
    label: { es: 'Prueba de que le otorgaron asilo', en: 'Proof you were granted asylum' },
    detail: { es: 'La carta de aprobación de USCIS, la orden del juez o su I-94 de asilado.', en: 'The USCIS approval notice, the judge’s order, or your asylee I-94.' },
    when: cat('(a)(5)'),
  },
  {
    id: 'paroleI94',
    label: { es: 'Copia del I-94 o documento que muestra su parole', en: 'Copy of the I-94 or document showing your parole' },
    when: cat('(c)(11)'),
  },
  {
    id: 'tpsProof',
    label: { es: 'Prueba de su TPS', en: 'Proof of your TPS' },
    detail: {
      es: 'Envíe el I-765 junto con el I-821, o una copia del recibo o de la aprobación del I-821.',
      en: 'File the I-765 together with the I-821, or send a copy of the I-821 receipt or approval.',
    },
    when: cat('(a)(12)', '(c)(19)'),
  },
  {
    id: 'dacaWith',
    label: { es: 'El I-821D y la hoja I-765WS', en: 'Form I-821D and the I-765WS worksheet' },
    detail: { es: 'Se envían juntos con este I-765. Camino llena los dos.', en: 'Filed together with this I-765. Camino fills in both.' },
    when: cat('(c)(33)'),
  },
  {
    id: 'i20',
    label: { es: 'Copia de su I-20 con la recomendación de OPT', en: 'Copy of your I-20 with the OPT recommendation' },
    detail: { es: 'Firmado por su DSO (oficial de la escuela) en los últimos 30 días.', en: 'Signed by your DSO (school official) in the last 30 days.' },
    when: cat('(c)(3)(B)', '(c)(3)(C)'),
  },
  {
    id: 'stemDegree',
    label: { es: 'Copia de su título STEM', en: 'Copy of your STEM degree' },
    when: cat('(c)(3)(C)'),
  },
  {
    id: 'h1bSpouse',
    label: { es: 'Pruebas del H-1B de su cónyuge y de su matrimonio', en: 'Proof of your spouse’s H-1B and your marriage' },
    detail: {
      es: 'El I-797 del I-140 aprobado o de la extensión de H-1B de su cónyuge, el acta de matrimonio y los I-94 de los dos.',
      en: 'Your spouse’s I-140 approval or H-1B extension I-797, the marriage certificate, and both I-94s.',
    },
    when: cat('(c)(26)'),
  },
  translations,
];
