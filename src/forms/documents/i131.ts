import type { DocItem } from './types';
import type { Answers } from '../types';
import { fee, greenCardCopy, idCopy, photos, translations } from './common';
import { is } from '../helpers';

// From the I-131 instructions (edition 01/20/25): "Required Evidence" (for all categories and by document
// category, items 1–4 and 8) and the Part 4 replacement instructions.
export const formId = 'i-131';

const reentry = is('appType', '1');
const refugee = is('appType', '2', '3');
const ap = is('appType', '5');
const tps = (a: Answers) => a.appType === '4' || (ap(a) && a.apBasis === '7');

export const docs: DocItem[] = [
  {
    ...fee,
    detail: {
      es: 'Confirme el monto en uscis.gov/g-1055. Si pide un reemplazo porque nunca le llegó el documento por un error de USCIS o del correo, no paga de nuevo.',
      en: 'Confirm the amount at uscis.gov/g-1055. If you are replacing a document you never received because of a USCIS or postal error, you don’t pay again.',
    },
  },
  {
    ...idCopy,
    label: { es: 'Copia de una identificación oficial con foto', en: 'Copy of an official photo ID' },
    detail: {
      es: 'Con su foto, nombre y fecha de nacimiento: permiso de trabajo, licencia de manejar, pasaporte o green card. El I-94 no sirve.',
      en: 'Showing your photo, name and date of birth: work permit, driver’s license, passport or green card. The I-94 doesn’t count.',
    },
  },
  { ...photos(2), when: (a) => ap(a) || a.appType === '4' || (refugee(a) && a['rtd.outside'] === 'yes') },
  {
    ...greenCardCopy,
    detail: {
      es: 'Si todavía no le llega, copia de su pasaporte con la visa o el sello de admisión como residente, o del I-797 de su reemplazo.',
      en: 'If you haven’t received it yet, a copy of your passport with the immigrant visa or admission stamp, or the I-797 for your replacement card.',
    },
    when: reentry,
  },
  {
    id: 'refugeeStatusProof',
    label: { es: 'Prueba de su estatus de refugiado o asilado', en: 'Proof of your refugee or asylee status' },
    detail: { es: 'El documento de USCIS que muestra su refugio o asilo, o la orden del juez que le dio asilo.', en: 'The USCIS document showing your refugee or asylee status, or the judge’s order granting asylum.' },
    when: refugee,
  },
  {
    id: 'lastDeparture',
    label: { es: 'Prueba de la fecha en que salió de EE.UU.', en: 'Proof of when you left the U.S.' },
    detail: {
      es: 'Por ejemplo, el boleto o los sellos del pasaporte, con una carta que explique por qué salió sin el documento de viaje.',
      en: 'For example, the ticket or passport stamps, with a letter explaining why you left without the travel document.',
    },
    when: (a) => refugee(a) && a['rtd.outside'] === 'yes',
  },
  {
    id: 'statusNotice',
    label: { es: 'Copia del aviso de USCIS que muestra su caso o estatus', en: 'Copy of the USCIS notice showing your case or status' },
    detail: {
      es: 'Por ejemplo, el recibo (I-797) de su I-485 o I-589, o su I-94 de parole. Si envía este I-131 junto con el I-485, no hace falta.',
      en: 'For example, the receipt (I-797) for your I-485 or I-589, or your parole I-94. Not needed if you file this I-131 together with your I-485.',
    },
    when: (a) => ap(a) && a.apBasis !== '9' && a.apBasis !== '7',
  },
  {
    id: 'dacaApproval',
    label: { es: 'Copia de la aprobación de su DACA (I-797)', en: 'Copy of your DACA approval notice (I-797)' },
    detail: { es: 'El aviso que dice que se aprobó la acción diferida de su I-821D.', en: 'The notice showing your Form I-821D was approved for deferred action.' },
    when: (a) => ap(a) && a.apBasis === '9',
  },
  {
    id: 'tpsProof',
    label: { es: 'Prueba de su TPS', en: 'Proof of your TPS' },
    detail: { es: 'La aprobación de su I-821 o, si su solicitud inicial está pendiente, el recibo (I-797).', en: 'Your I-821 approval or, if your initial application is pending, the receipt notice (I-797).' },
    when: tps,
  },
  {
    id: 'travelReason',
    label: { es: 'Pruebas del motivo de su viaje', en: 'Proof of the reason for your trip' },
    detail: {
      es: 'Una carta de su escuela, empleador o médico, o documentos de la enfermedad o muerte de un familiar con prueba de parentesco. Con DACA son obligatorias.',
      en: 'A letter from your school, employer or doctor, or documents about a relative’s illness or death with proof of the relationship. Required with DACA.',
    },
    when: ap,
  },
  {
    id: 'returnDocument',
    label: { es: 'El documento que quiere reemplazar', en: 'The document you want to replace' },
    detail: { es: 'Devuélvalo si está dañado o tiene un error.', en: 'Send it back if it is damaged or has an error.' },
    when: (a) => a.replacement === 'yes' && is('replacementReason', '2', '3', '4')(a),
  },
  translations,
];
