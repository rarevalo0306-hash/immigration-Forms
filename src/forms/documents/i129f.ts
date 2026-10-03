import type { DocItem } from './types';
import { courtRecords, fee, marriageCert, photos, priorMarriagesEnded, translations } from './common';
import { is } from '../helpers';
import { CRIME_ITEMS } from '../i129f';

// From the I-129F instructions (edition 01/20/25): "What Evidence Must You Submit?" and the evidence asked for in
// Part 2 (IMB consent) and Part 3 (criminal records and multiple-filer waivers).
export const formId = 'i-129f';

const fiance = (a: Record<string, unknown>) => a.classification !== 'B';
const spouse = is('classification', 'B');

export const docs: DocItem[] = [
  fee,
  {
    id: 'citizenshipProof',
    label: { es: 'Prueba de su ciudadanía de EE.UU.', en: 'Proof of your U.S. citizenship' },
    detail: {
      es: 'Copia de una de estas: acta de nacimiento de EE.UU., certificado de naturalización o de ciudadanía, el FS-240 (nacimiento en el extranjero) o su pasaporte o tarjeta pasaporte de EE.UU. vigente.',
      en: 'A copy of one of these: U.S. birth certificate, naturalization or citizenship certificate, Form FS-240 (birth abroad), or your unexpired U.S. passport or passport card.',
    },
  },
  { ...photos(1), label: { es: 'Una foto suya tipo pasaporte', en: 'One passport-style photo of you' } },
  {
    ...photos(1),
    id: 'beneficiaryPhoto',
    label: { es: 'Una foto tipo pasaporte de su prometido/a o cónyuge', en: 'One passport-style photo of your fiancé(e) or spouse' },
  },
  {
    id: 'intentToMarry',
    label: { es: 'Declaraciones de que piensan casarse', en: 'Statements that you intend to marry' },
    detail: {
      es: 'Una carta firmada por cada uno diciendo que se casarán dentro de los 90 días después de que su prometido/a llegue a EE.UU.',
      en: 'A letter signed by each of you saying you will marry within 90 days after your fiancé(e) arrives in the U.S.',
    },
    when: fiance,
  },
  {
    id: 'metInPerson',
    label: { es: 'Pruebas de que se vieron en persona en los últimos 2 años', en: 'Proof you met in person in the last 2 years' },
    detail: {
      es: 'Boletos de avión, páginas del pasaporte con sellos, fotos juntos y una carta contando cómo fue. Si pide la exención, pruebas de la costumbre cultural o del sufrimiento extremo.',
      en: 'Plane tickets, passport pages with stamps, photos together and a letter describing the meeting. If you ask for the exemption, proof of the cultural custom or the extreme hardship.',
    },
    when: fiance,
  },
  {
    id: 'i130Proof',
    label: { es: 'Prueba de que presentó el I-130 por su cónyuge', en: 'Proof you filed Form I-130 for your spouse' },
    detail: { es: 'Copia del recibo o la aprobación (I-797), o el I-130 enviado junto con este.', en: 'A copy of the receipt or approval notice (I-797), or the I-130 filed together with this one.' },
    when: spouse,
  },
  { ...marriageCert, when: spouse },
  { ...priorMarriagesEnded, when: (a) => a['pet.prevMarried'] === 'yes' || a['ben.prevMarried'] === 'yes' },
  {
    id: 'nameChange',
    label: { es: 'Prueba de cambio de nombre', en: 'Proof of a name change' },
    detail: {
      es: 'Si usted o su prometido/a usan un nombre distinto al de los documentos: acta de matrimonio, decreto de adopción u orden de la corte.',
      en: 'If you or your fiancé(e) use a name different from the one on the documents: marriage certificate, adoption decree or court order.',
    },
    when: (a) => a['pet.otherName.has'] === 'yes' || a['ben.otherName.has'] === 'yes',
  },
  {
    id: 'imbConsent',
    label: { es: 'Copia del formulario de consentimiento de la agencia matrimonial', en: 'Copy of the marriage broker’s consent form' },
    detail: {
      es: 'El formulario firmado con el que su prometido/a autorizó a la agencia a darle sus datos.',
      en: 'The signed form your fiancé(e) used to let the broker release their contact information to you.',
    },
    when: is('imb', 'yes'),
  },
  {
    ...courtRecords,
    detail: {
      es: 'Copias certificadas de la corte y la policía con los cargos y el resultado de cada caso u orden de protección, aunque se hayan borrado o sellado. Un abogado debe revisarlas antes de enviar.',
      en: 'Certified court and police records showing the charges and outcome of each case or protection order, even if sealed or expunged. An attorney should review them before you file.',
    },
    when: (a) => CRIME_ITEMS.some((i) => a[i.id] === 'yes'),
  },
  {
    id: 'waiverEvidence',
    label: { es: 'Pruebas para la exención por varias peticiones', en: 'Evidence for the multiple-filer waiver' },
    detail: {
      es: 'Lo que explique por qué presentó varias peticiones (por ejemplo, un acta de defunción) y, si aplica, informes de policía o de la corte que muestren las circunstancias o el maltrato que sufrió.',
      en: 'Whatever explains why you filed more than one petition (for example, a death certificate) and, if it applies, police or court records showing the circumstances or the abuse you suffered.',
    },
    when: is('waiver', 'A', 'B', 'C'),
  },
  translations,
];
