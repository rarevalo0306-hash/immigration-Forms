import type { DocItem } from './types';
import { photos } from './common';

// From the I-130 instructions (edition 04/01/24), which cover Form I-130A: it is filed with the I-130,
// with two photos of the spouse beneficiary if they are in the United States.
export const formId = 'i-130a';

export const docs: DocItem[] = [
  {
    id: 'i130With',
    label: { es: 'El Formulario I-130 que presenta su cónyuge', en: 'The Form I-130 your spouse files' },
    detail: {
      es: 'El I-130A va junto con el I-130 y no tiene tarifa propia. Las demás pruebas (acta de matrimonio, etc.) van con el I-130.',
      en: 'The I-130A goes together with the I-130 and has no fee of its own. The other evidence (marriage certificate, etc.) goes with the I-130.',
    },
  },
  {
    ...photos(2),
    id: 'spousePhotos',
    label: { es: 'Dos fotos suyas tipo pasaporte (si vive en EE.UU.)', en: 'Two passport-style photos of you (if you live in the U.S.)' },
  },
];
