import type { DocItem } from './types';
import type { Answers } from '../types';
import { courtRecords, eadCopy, idCopy, translations } from './common';
import { is } from '../helpers';

// From the I-821D instructions (edition 01/20/25): "Evidence for Initial Requests Only" and
// "Evidence for Renewal Requests Only".
export const formId = 'i-821d';

const initial = is('requestType', 'initial');
const renewal = is('requestType', 'renewal');
const anyYes = (...ids: string[]) => (a: Answers) => ids.some((id) => a[id] === 'yes');

export const docs: DocItem[] = [
  {
    id: 'i765With',
    label: { es: 'El Formulario I-765 y la hoja I-765WS', en: 'Form I-765 and the I-765WS worksheet' },
    detail: {
      es: 'Se envían juntos con el I-821D. El I-821D no tiene tarifa; se paga la tarifa del I-765. Camino llena los dos.',
      en: 'Filed together with Form I-821D. The I-821D has no fee; you pay the I-765 fee. Camino fills in both.',
    },
  },
  { ...eadCopy, when: renewal },
  {
    ...idCopy,
    label: { es: 'Copia de un documento que pruebe su identidad', en: 'Copy of a document that proves your identity' },
    detail: {
      es: 'Pasaporte, cédula o identificación de su país con foto, acta de nacimiento con identificación con foto, o identificación escolar, militar o del estado. Sirve aunque esté vencida.',
      en: 'Passport, national ID with photo, birth certificate with a photo ID, or a school, military or state ID. Expired documents are fine.',
    },
    when: initial,
  },
  {
    id: 'arrivedBefore16',
    label: { es: 'Prueba de que llegó a EE.UU. antes de cumplir 16 años', en: 'Proof you came to the U.S. before your 16th birthday' },
    detail: {
      es: 'Por ejemplo: pasaporte con sello de entrada, I-94, boletos de viaje, o registros de la escuela, médicos o de la iglesia en EE.UU.',
      en: 'For example: passport with an entry stamp, I-94, travel tickets, or U.S. school, medical or church records.',
    },
    when: initial,
  },
  {
    id: 'continuousResidence',
    label: { es: 'Pruebas de que vive en EE.UU. desde el 15 de junio de 2007', en: 'Proof you have lived in the U.S. since June 15, 2007' },
    detail: {
      es: 'Documentos con fecha que cubran todos los años hasta hoy, incluido el 15 de junio de 2012: registros escolares, talones de pago, recibos de renta o de luz, registros médicos, de la iglesia o del banco.',
      en: 'Dated documents covering every year up to now, including June 15, 2012: school records, pay stubs, rent or utility receipts, medical, church or bank records.',
    },
    when: initial,
  },
  {
    id: 'tripsBrief',
    label: { es: 'Pruebas de que sus salidas de EE.UU. fueron cortas', en: 'Proof your trips outside the U.S. were brief' },
    detail: {
      es: 'Boletos o itinerario, sellos del pasaporte, recibos de hotel, prueba del motivo (por ejemplo, una boda o un funeral) o copia de su advance parole.',
      en: 'Tickets or itinerary, passport stamps, hotel receipts, proof of the reason (for example, a wedding or funeral) or a copy of your advance parole.',
    },
    when: (a) => initial(a) && a['trip.more0'] === 'yes',
  },
  {
    id: 'noStatus2012',
    label: { es: 'Prueba de que no tenía estatus legal el 15 de junio de 2012', en: 'Proof you had no lawful status on June 15, 2012' },
    detail: {
      es: 'Solo si entró con visa o parole, o tuvo un caso de deportación: el I-94 con la fecha en que venció su estadía, o la orden o el documento de la corte.',
      en: 'Only if you entered with a visa or parole, or had a removal case: the I-94 showing when your stay expired, or the order or charging document.',
    },
    when: (a) => initial(a) && (a.i94Has === 'yes' || is('status2012', 'Status Expired', 'Parole Expired')(a) || a.removal === 'yes'),
  },
  {
    id: 'education',
    label: { es: 'Prueba de sus estudios', en: 'Proof of your education' },
    detail: {
      es: 'Si estudia: carta de inscripción, calificaciones o constancia de la escuela o programa. Si terminó: diploma de high school, certificado GED o título universitario.',
      en: 'If in school: enrollment letter, transcript or report card from the school or program. If finished: high school diploma, GED certificate or college degree.',
    },
    when: (a) => initial(a) && a.military !== 'yes',
  },
  {
    id: 'militaryDischarge',
    label: { es: 'Prueba de su baja honorable del ejército', en: 'Proof of your honorable military discharge' },
    detail: { es: 'Formulario DD-214, NGB-22 u otros registros militares.', en: 'Form DD-214, NGB Form 22, or other military records.' },
    when: (a) => initial(a) && a.military === 'yes',
  },
  {
    id: 'removalDocs',
    label: { es: 'Copia de los documentos de su caso en la corte de inmigración', en: 'Copy of your immigration court documents' },
    detail: {
      es: 'La orden de deportación, cualquier documento del juez o la decisión de la BIA, si los tiene. Al renovar, solo los nuevos; no hacen falta si el caso está cerrado administrativamente.',
      en: 'The removal order, any document from the judge, or the BIA decision, if you have them. For a renewal, only new ones; not needed if the case was administratively closed.',
    },
    when: (a) => a.removal === 'yes' && !(renewal(a) && a['removal.status'] === 'Closed'),
  },
  {
    ...courtRecords,
    detail: {
      es: 'Del tribunal o la policía, con el resultado final de cada caso (o la orden que lo borró). Si no puede conseguirlos, explique por qué en la Parte 8. Al renovar, solo los que no envió antes.',
      en: 'From the court or police, with the final outcome of each case (or the order that erased it). If you can’t get them, explain why in Part 8. For a renewal, only ones you haven’t sent before.',
    },
    when: anyYes('p4.1', 'p4.2'),
  },
  translations,
];
