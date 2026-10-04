import type { Answers } from '../types';
import type { DocItem } from './types';
import { courtRecords, translations } from './common';
import { CRIME_ITEMS, PROCESSING_ITEMS } from '../i918';

// From the I-918 instructions: "Required Initial Evidence to Support Form I-918" and
// "Supplement A and Evidence to Support Supplement A". There is no filing fee.
export const formId = 'i-918';

const anyYes = (ids: string[]) => (a: Answers) => ids.some((id) => a[id] === 'yes');
const crimeIds = CRIME_ITEMS.map((i) => i.id);
const processingIds = PROCESSING_ITEMS.map((i) => i.id);

export const docs: DocItem[] = [
  {
    id: 'supplementB',
    label: { es: 'El Suplemento B original, firmado por la autoridad', en: 'The original Supplement B, signed by the certifying agency' },
    detail: {
      es: 'Lo firma la policía, la fiscalía, el juez u otra agencia que investigó el delito, en los 6 meses antes de que usted presente. No hace falta si ya recibió "U interim relief".',
      en: 'Signed by the police, prosecutor, judge or other agency that investigated the crime, within the 6 months before you file. Not needed if you already received U interim relief.',
    },
  },
  {
    id: 'personalStatement',
    label: { es: 'Su declaración personal, firmada', en: 'Your signed personal statement' },
    detail: {
      es: 'Qué delito fue, cuándo pasó, quién lo hizo, cómo se investigó y el daño físico o emocional que sufrió. Puede escribirla con calma y con ayuda.',
      en: 'What the crime was, when it happened, who did it, how it came to be investigated, and the physical or mental harm you suffered. You can take your time and get help writing it.',
    },
  },
  {
    id: 'victimEvidence',
    label: { es: 'Pruebas de que fue víctima del delito', en: 'Evidence that you were a victim of the crime' },
    detail: {
      es: 'Lo que tenga: reportes de policía, documentos de la corte, órdenes de protección, noticias o declaraciones juradas.',
      en: 'Whatever you have: police reports, court documents, protection orders, news articles or sworn statements.',
    },
  },
  {
    id: 'abuseEvidence',
    label: { es: 'Pruebas del daño físico o emocional que sufrió', en: 'Evidence of the physical or mental harm you suffered' },
    detail: {
      es: 'Por ejemplo, cartas o informes de médicos, terapeutas, trabajadores sociales o su iglesia; fotos de lesiones con una declaración; declaraciones de testigos o familiares.',
      en: 'For example, letters or reports from doctors, therapists, social workers or clergy; photos of injuries with a statement; statements from witnesses or relatives.',
    },
  },
  {
    id: 'helpfulnessEvidence',
    label: { es: 'Pruebas de que ayudó o puede ayudar a las autoridades', en: 'Evidence that you helped or can help the authorities' },
    detail: {
      es: 'Además del Suplemento B, si tiene: documentos de la corte, reportes de policía, recibos de viajes a la corte o declaraciones de otros testigos.',
      en: 'Besides Supplement B, if you have them: court documents, police reports, travel reimbursements for court, or statements from other witnesses.',
    },
  },
  {
    id: 'minorEvidence',
    label: { es: 'Prueba de su edad (menor de 16 años)', en: 'Proof of your age (under 16)' },
    detail: {
      es: 'Su acta de nacimiento. Si un padre, tutor o "next friend" presenta por usted, agregue los documentos de la corte que lo reconocen.',
      en: 'Your birth certificate. If a parent, guardian or next friend files for you, add the court documents recognizing them.',
    },
    when: (a) => a['p2.6'] === 'yes',
  },
  {
    id: 'i192',
    label: { es: 'Formulario I-192 (perdón de inadmisibilidad)', en: 'Form I-192 (waiver of inadmissibility)' },
    detail: {
      es: 'Si contestó Sí a alguna pregunta de la Parte 3. Puede enviarlo junto con el I-918. Un abogado puede ayudarle.',
      en: 'If you answered Yes to any Part 3 question. You can file it together with the I-918. An attorney can help.',
    },
    when: anyYes(processingIds),
  },
  { ...courtRecords, when: anyYes(crimeIds) },
  {
    id: 'familyRelationship',
    label: { es: 'Un Suplemento A y prueba del parentesco por cada familiar que incluya', en: 'A Supplement A and proof of the relationship for each relative you include' },
    detail: {
      es: 'Acta de matrimonio (y prueba de que terminaron los matrimonios anteriores) o acta de nacimiento, según el caso. Si no existe, explique por qué y envíe registros de la iglesia o la escuela, o dos declaraciones juradas.',
      en: 'Marriage certificate (and proof prior marriages ended) or birth certificate, depending on the relative. If it doesn’t exist, explain why and send church or school records, or two sworn statements.',
    },
    when: (a) => a.petitionFamily === 'yes',
  },
  translations,
];
