import type { DocItem } from './types';

/**
 * Documents many forms ask for, worded once. Each form's list picks the ones its instructions
 * name; ids stay the same across forms so a package can list a shared document once.
 */

export const photos = (n: number): DocItem => ({
  id: 'photos',
  label: {
    es: `${n === 1 ? 'Una foto' : `${n === 2 ? 'Dos' : n} fotos`} tipo pasaporte`,
    en: `${n === 1 ? 'One' : n === 2 ? 'Two' : n} passport-style photo${n === 1 ? '' : 's'}`,
  },
  detail: {
    es: 'De 2 x 2 pulgadas, a color, fondo blanco, de los últimos 30 días. Escriba su nombre y A-Number a lápiz al reverso.',
    en: '2 x 2 inches, in color, white background, taken in the last 30 days. Write your name and A-Number in pencil on the back.',
  },
});

export const fee: DocItem = {
  id: 'fee',
  label: { es: 'El pago de la tarifa', en: 'The filing fee' },
  detail: {
    es: 'Confirme el monto y la forma de pago en uscis.gov/g-1055 (por ejemplo, el Formulario G-1450 para pagar con tarjeta o el G-1650 para pagar desde una cuenta bancaria). Si no puede pagar, vea si el formulario acepta la exención I-912.',
    en: 'Confirm the amount and how to pay at uscis.gov/g-1055 (for example, Form G-1450 to pay by card or G-1650 to pay from a bank account). If you can’t pay, see whether the form accepts the I-912 fee waiver.',
  },
};

export const idCopy: DocItem = {
  id: 'idCopy',
  label: { es: 'Copia de una identificación con foto', en: 'Copy of a photo ID' },
  detail: { es: 'Por ejemplo, la página de datos de su pasaporte.', en: 'For example, your passport’s data page.' },
};

export const passportCopy: DocItem = {
  id: 'passportCopy',
  label: { es: 'Copia de la página de datos de su pasaporte', en: 'Copy of your passport’s data page' },
};

export const greenCardCopy: DocItem = {
  id: 'greenCardCopy',
  label: { es: 'Copia de su tarjeta de residente (frente y reverso)', en: 'Copy of your green card (front and back)' },
};

export const eadCopy: DocItem = {
  id: 'eadCopy',
  label: { es: 'Copia de su permiso de trabajo actual o anterior (frente y reverso)', en: 'Copy of your current or last work permit (front and back)' },
};

export const i94Copy: DocItem = {
  id: 'i94Copy',
  label: { es: 'Copia de su registro de entrada I-94', en: 'Copy of your I-94 arrival record' },
  detail: { es: 'Se descarga gratis en i94.cbp.dhs.gov.', en: 'Download it free at i94.cbp.dhs.gov.' },
};

export const birthCert: DocItem = {
  id: 'birthCert',
  label: { es: 'Copia de su acta de nacimiento', en: 'Copy of your birth certificate' },
};

export const marriageCert: DocItem = {
  id: 'marriageCert',
  label: { es: 'Copia del acta de matrimonio', en: 'Copy of the marriage certificate' },
};

export const priorMarriagesEnded: DocItem = {
  id: 'priorMarriagesEnded',
  label: { es: 'Prueba de que terminó cada matrimonio anterior', en: 'Proof that each prior marriage ended' },
  detail: { es: 'Sentencia de divorcio, acta de defunción o anulación.', en: 'Divorce decree, death certificate or annulment.' },
};

export const courtRecords: DocItem = {
  id: 'courtRecords',
  label: { es: 'Copias certificadas de cada arresto, cargo o sentencia', en: 'Certified copies of every arrest, charge or conviction record' },
  detail: {
    es: 'Del tribunal o la policía, con el resultado final de cada caso. Un abogado debe revisarlas antes de enviar.',
    en: 'From the court or police, with the final outcome of each case. An attorney should review them before you file.',
  },
};

export const translations: DocItem = {
  id: 'translations',
  label: { es: 'Traducción al inglés de cada documento que esté en otro idioma', en: 'An English translation of any document in another language' },
  detail: {
    es: 'Completa, con una certificación firmada del traductor de que la traducción es correcta y de que domina los dos idiomas.',
    en: 'Complete, with the translator’s signed certification that it is accurate and that they are fluent in both languages.',
  },
};

export const g1145: DocItem = {
  id: 'g1145',
  label: { es: 'Formulario G-1145 (opcional)', en: 'Form G-1145 (optional)' },
  detail: { es: 'Encima del paquete, para recibir un aviso cuando USCIS lo acepte. Camino lo llena.', en: 'On top of the package, to get a notice when USCIS accepts it. Camino fills it in.' },
};
