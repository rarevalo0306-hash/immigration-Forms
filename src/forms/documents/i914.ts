import type { Answers } from '../types';
import type { DocItem } from './types';
import { courtRecords, translations } from './common';
import { CRIME_ITEMS, PROCESSING_ITEMS } from '../i914';

// From the I-914 instructions: "Initial Evidence", "Evidence to Establish T Nonimmigrant Status",
// "Personal Statement" and "Evidence to Establish Derivative T Nonimmigrant Status". There is no filing fee.
export const formId = 'i-914';

const anyYes = (ids: string[]) => (a: Answers) => ids.some((id) => a[id] === 'yes');
const crimeIds = CRIME_ITEMS.map((i) => i.id);
const processingIds = PROCESSING_ITEMS.map((i) => i.id);

export const docs: DocItem[] = [
  {
    id: 'personalStatement',
    label: { es: 'Su declaración personal, firmada (obligatoria)', en: 'Your signed personal statement (required)' },
    detail: {
      es: 'Lo que recuerde de la trata: qué pasó, cuándo y cuánto duró, cómo salió, quién fue responsable, por qué está en EE.UU., qué daño teme si lo deportan y si ayudó a las autoridades (o por qué no pudo).',
      en: 'What you remember of the trafficking: what happened, when and for how long, how you got out, who was responsible, why you are in the U.S., what harm you fear if removed, and whether you helped the authorities (or why you couldn’t).',
    },
  },
  {
    id: 'traffickingEvidence',
    label: { es: 'Pruebas de que fue víctima de trata', en: 'Evidence that you were a victim of trafficking' },
    detail: {
      es: 'Puede enviar cualquier prueba creíble que tenga: reportes de policía, documentos de la corte, noticias, declaraciones juradas, mensajes, fotos o recibos de pago.',
      en: 'You may send any credible evidence you have: police reports, court documents, news articles, sworn statements, messages, photos or pay records.',
    },
  },
  {
    id: 'supplementB',
    label: { es: 'Suplemento B firmado por la autoridad (opcional)', en: 'Supplement B signed by law enforcement (optional)' },
    detail: {
      es: 'No es obligatorio, pero es una prueba fuerte. Lo firma la agencia que investigó (policía, FBI, HSI, Departamento de Trabajo).',
      en: 'Not required, but strong evidence. It is signed by the agency that investigated (police, FBI, HSI, Department of Labor).',
    },
  },
  {
    id: 'cooperationEvidence',
    label: { es: 'Pruebas de que colaboró con las autoridades', en: 'Evidence that you cooperated with law enforcement' },
    detail: {
      es: 'Si no tiene el Suplemento B: documentos de la corte, reportes de policía, recibos de viajes a la corte, declaraciones juradas o una concesión de "Continued Presence".',
      en: 'If you don’t have Supplement B: court documents, police reports, travel reimbursements for court, sworn statements, or a grant of Continued Presence.',
    },
    when: (a) => a.minor !== 'yes' && a['p3.2b'] !== 'yes',
  },
  {
    id: 'traumaEvidence',
    label: { es: 'Pruebas del trauma que le impide colaborar', en: 'Evidence of the trauma that keeps you from cooperating' },
    detail: {
      es: 'Por ejemplo, una carta de un médico, terapeuta, trabajador social o defensor de víctimas, o sus registros médicos o psicológicos.',
      en: 'For example, a letter from a doctor, therapist, social worker or victim advocate, or your medical or psychological records.',
    },
    when: (a) => a.minor !== 'yes' && (a['p3.2b'] === 'yes' || a.complied === 'no'),
  },
  {
    id: 'ageEvidence',
    label: { es: 'Prueba de su edad (menor de 18)', en: 'Proof of your age (under 18)' },
    detail: {
      es: 'Su acta de nacimiento o pasaporte, o una opinión médica certificada.',
      en: 'Your birth certificate or passport, or a certified medical opinion.',
    },
    when: (a) => a.minor === 'yes',
  },
  {
    id: 'entryDocument',
    label: { es: 'Copia del documento con que entró a EE.UU. (si lo tiene)', en: 'Copy of the document you used to enter the U.S. (if you have it)' },
    detail: {
      es: 'Por ejemplo, su pasaporte con visa o su I-94. Si no lo tiene o no puede conseguirlo, no pasa nada.',
      en: 'For example, your passport with visa or your I-94. If you don’t have it or can’t get it, that’s okay.',
    },
  },
  {
    id: 'i192',
    label: { es: 'Formulario I-192 (perdón de inadmisibilidad)', en: 'Form I-192 (waiver of inadmissibility)' },
    detail: {
      es: 'Si contestó Sí a alguna pregunta de la Parte 4. Envíelo junto con el I-914. Hay perdones para lo que los tratantes le obligaron a hacer.',
      en: 'If you answered Yes to any Part 4 question. File it together with the I-914. There are waivers for what the traffickers forced you to do.',
    },
    when: anyYes(processingIds),
  },
  { ...courtRecords, when: anyYes(crimeIds) },
  {
    id: 'familyRelationship',
    label: { es: 'Un Suplemento A y prueba del parentesco por cada familiar que incluya', en: 'A Supplement A and proof of the relationship for each relative you include' },
    detail: {
      es: 'Acta de matrimonio o de nacimiento, según el caso, y prueba de la edad. Para padres o hermanos por peligro de represalias, pruebas de ese peligro.',
      en: 'Marriage or birth certificate, depending on the relative, and proof of age. For parents or siblings in danger of retaliation, evidence of that danger.',
    },
    when: (a) => a.petitionFamily === 'yes',
  },
  translations,
];
