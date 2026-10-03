import type { DocItem } from './types';
import type { Answers } from '../types';
import { courtRecords, fee, idCopy, translations } from './common';
import { is } from '../helpers';
import { P7_GROUPS } from '../i821Part7';

// From the I-821 instructions (edition 01/20/25): "General Requirements" (items 1–6) and the Checklist.
export const formId = 'i-821';

const initial = (a: Answers) => a.appType !== '1b';
const crimeIds = (P7_GROUPS.find((g) => g.id === 'crimes')?.items ?? []).map((it) => `p7.${it.item}`);

export const docs: DocItem[] = [
  {
    ...fee,
    detail: {
      es: 'La tarifa del I-821 (y la de biométricos, si le toca). Confirme el monto en uscis.gov/g-1055. Si no puede pagar, puede pedir la exención con el Formulario I-912.',
      en: 'The I-821 fee (and the biometrics fee, if it applies to you). Confirm the amount at uscis.gov/g-1055. If you can’t pay, you can ask for a waiver with Form I-912.',
    },
  },
  {
    id: 'i765With',
    label: { es: 'El Formulario I-765, si pide permiso de trabajo', en: 'Form I-765, if you want a work permit' },
    detail: { es: 'Se envía junto con el I-821. Camino lo llena.', en: 'Filed together with Form I-821. Camino fills it in.' },
    when: is('ead', 'A'),
  },
  {
    ...idCopy,
    label: { es: 'Copia de un documento que pruebe su identidad y nacionalidad', en: 'Copy of a document that proves your identity and nationality' },
    detail: {
      es: 'Pasaporte, acta de nacimiento con identificación con foto, o cédula de su país con foto o huella. Si no tiene ninguno, envíe una declaración jurada explicando qué hizo para conseguirlo.',
      en: 'Passport, birth certificate with a photo ID, or a national ID from your country with photo or fingerprint. If you have none, send a sworn statement explaining your efforts to get one.',
    },
    when: initial,
  },
  {
    id: 'entryProof',
    label: { es: 'Prueba de la fecha en que entró a EE.UU.', en: 'Proof of the date you entered the U.S.' },
    detail: { es: 'Su pasaporte con sello de entrada, su I-94, o los documentos de residencia de abajo.', en: 'Your passport with an entry stamp, your I-94, or the residence documents below.' },
    when: initial,
  },
  {
    id: 'residenceProof',
    label: { es: 'Pruebas de que vive en EE.UU. desde la fecha que pide su país', en: 'Proof you have lived in the U.S. since the date set for your country' },
    detail: {
      es: 'Documentos con su nombre y fechas: talones de pago o W-2, recibos de renta o de luz, registros de la escuela o médicos, cartas de su iglesia, recibos de envíos de dinero o del banco.',
      en: 'Documents with your name and dates: pay stubs or W-2s, rent or utility receipts, school or medical records, letters from your church, money transfer or bank records.',
    },
    when: initial,
  },
  {
    id: 'judgeTpsOrder',
    label: { es: 'Copia de la decisión del juez o de la BIA que le dio TPS', en: 'Copy of the judge’s or BIA decision granting you TPS' },
    detail: { es: 'Si es su primer nuevo registro con USCIS después de esa decisión.', en: 'If this is your first re-registration with USCIS after that decision.' },
    when: (a) => a.appType === '1b' && a.grantedBy === 'I',
  },
  {
    ...courtRecords,
    detail: {
      es: 'Copias certificadas de cada arresto, resultado y sentencia, aunque el caso se haya borrado, y prueba de que terminó su libertad condicional. Si no puede conseguirlas, envíe la carta del tribunal que lo dice. Un abogado debe revisarlas antes de enviar.',
      en: 'Certified copies of each arrest report, disposition and sentence, even if the record was sealed or expunged, and proof you finished any probation. If you can’t get them, send the court’s letter saying so. An attorney should review them before you file.',
    },
    when: (a) => crimeIds.some((id) => a[id] === 'yes'),
  },
  translations,
];
