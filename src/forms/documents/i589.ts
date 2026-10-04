import type { Answers } from '../types';
import type { DocItem } from './types';
import { birthCert, courtRecords, fee, marriageCert, passportCopy, priorMarriagesEnded, translations } from './common';

// From the I-589 instructions: "Required Documents That You Must Submit With Your Application",
// "Additional Evidence That You Must Submit" and the family evidence in Part A.II.
export const formId = 'i-589';

const spouseIncluded = (a: Answers) => a.marital === 'M' && a['spouse.include'] === 'yes';
const childIncluded = (a: Answers) => a.hasChildren === 'yes' && [1, 2, 3, 4, 5, 6].some((i) => a[`child${i}.include`] === 'yes');
const familyIncluded = (a: Answers) => spouseIncluded(a) || childIncluded(a);

export const docs: DocItem[] = [
  {
    ...fee,
    detail: {
      es: 'Confirme en uscis.gov/g-1055 si hay una tarifa de asilo y cómo pagarla. Si está en una Corte de Inmigración, pregunte cómo se paga ante la corte.',
      en: 'Check at uscis.gov/g-1055 whether there is an asylum fee and how to pay it. If you are in Immigration Court, ask how to pay it there.',
    },
  },
  {
    ...passportCopy,
    label: { es: 'Copia completa de sus pasaportes o documentos de viaje (si tiene)', en: 'Full copy of your passports or travel documents (if you have them)' },
    detail: {
      es: 'Todas las páginas, de tapa a tapa, también de cada familiar que incluya. No envíe el original.',
      en: 'Every page, cover to cover, also for each family member you include. Do not send the original.',
    },
  },
  {
    id: 'i94Copy',
    label: { es: 'Copia de su I-94 y otros documentos migratorios (si tiene)', en: 'Copy of your I-94 and other U.S. immigration documents (if any)' },
    detail: {
      es: 'De usted y de cada familiar que incluya. El I-94 se descarga gratis en i94.cbp.dhs.gov.',
      en: 'For you and each family member you include. Download the I-94 free at i94.cbp.dhs.gov.',
    },
  },
  {
    id: 'otherIds',
    label: { es: 'Copia de otros documentos de identidad (si tiene)', en: 'Copy of other identity documents (if you have them)' },
    detail: {
      es: 'Por ejemplo, acta de nacimiento, cédula o documento nacional, licencia de conducir o carnet militar. Lleve los originales a la entrevista.',
      en: 'For example, birth certificate, national ID card, driver’s license or military ID. Bring the originals to your interview.',
    },
  },
  {
    id: 'claimEvidence',
    label: { es: 'Pruebas de lo que le pasó y de por qué teme regresar', en: 'Evidence of what happened to you and why you fear returning' },
    detail: {
      es: 'Lo que tenga a su alcance: declaraciones de testigos, cartas, fotos, denuncias, documentos oficiales, informes médicos o psicológicos. Si no puede conseguir pruebas, explique por qué en el Suplemento B.',
      en: 'Whatever you can reasonably get: witness statements, letters, photos, police reports, official documents, medical or psychological reports. If you can’t get evidence, explain why on Supplement B.',
    },
  },
  {
    id: 'countryConditions',
    label: { es: 'Información sobre la situación en su país', en: 'Information about conditions in your country' },
    detail: {
      es: 'Por ejemplo, noticias o informes de derechos humanos sobre lo que pasa a personas como usted.',
      en: 'For example, news articles or human rights reports about what happens to people like you.',
    },
  },
  {
    id: 'healthReport',
    label: { es: 'Informe de un profesional de salud (opcional)', en: 'A health professional’s report (optional)' },
    detail: {
      es: 'Si le cuesta hablar del daño que sufrió, un informe que explique esa dificultad puede ayudar.',
      en: 'If it is hard for you to talk about the harm you suffered, a report explaining that difficulty can help.',
    },
  },
  {
    ...marriageCert,
    label: { es: 'Copia de su acta de matrimonio', en: 'Copy of your marriage certificate' },
    detail: {
      es: 'Porque incluye a su cónyuge. Si no la tiene ni puede conseguirla, envíe otras pruebas (registros religiosos, declaraciones juradas) y explique por qué.',
      en: 'Because you are including your spouse. If you don’t have it and can’t get it, send other evidence (religious records, sworn statements) and explain why.',
    },
    when: spouseIncluded,
  },
  { ...priorMarriagesEnded, when: spouseIncluded },
  {
    ...birthCert,
    id: 'childBirthCerts',
    label: { es: 'Copia del acta de nacimiento de cada hijo que incluya', en: 'Copy of the birth certificate of each child you include' },
    detail: {
      es: 'Si no la tiene ni puede conseguirla, envíe registros escolares, médicos o religiosos, o una declaración jurada original, y explique por qué.',
      en: 'If you don’t have it and can’t get it, send school, medical or religious records, or an original sworn statement, and explain why.',
    },
    when: childIncluded,
  },
  {
    id: 'familyAffidavits',
    label: { es: 'Declaraciones juradas originales, si le faltan actas', en: 'Original sworn statements, if certificates are missing' },
    detail: {
      es: 'De al menos una persona que conozca cada hecho (nacimiento, matrimonio), con su nombre completo, dirección, fecha y lugar de nacimiento y su relación con usted.',
      en: 'From at least one person who knows each event (birth, marriage), with their full name, address, date and place of birth, and relationship to you.',
    },
    when: familyIncluded,
  },
  { ...courtRecords, when: (a) => a.c6 === 'yes' },
  translations,
];
