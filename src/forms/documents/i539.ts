import type { Answers } from '../types';
import type { DocItem } from './types';
import { birthCert, courtRecords, fee, i94Copy, marriageCert, priorMarriagesEnded, translations } from './common';

// From the I-539 instructions: the evidence for each nonimmigrant classification, "Evidence of
// Relationship" (General Requirements), and the general instructions on copies and translations.
export const formId = 'i-539';

/** The status code before " - " in a dropdown value ("F1 - STUDENT - ACADEMIC" → "F1"). */
const code = (v: unknown) => String(v ?? '').split(' - ')[0].trim();
/** The status the request is about: the new one for a change, the current one otherwise. */
const target = (a: Answers) => code(a.appType === 'change' ? a.newStatus : a.currentStatus);
const targetIn = (...codes: string[]) => (a: Answers) => codes.includes(target(a));
const targetStarts = (...prefixes: string[]) => (a: Answers) => {
  const c = target(a);
  return c !== '' && prefixes.some((p) => c.startsWith(p));
};

const DEPENDENT = ['E1', 'E2', 'E3', 'E1S', 'E1Y', 'E2S', 'E2Y', 'E2C', 'E3S', 'E3Y', 'E3D', 'H4', 'L2', 'L2S', 'L2Y', 'O3', 'P4', 'R2', 'TD', 'TB', 'CW2'];
const isDependent = targetIn(...DEPENDENT);
const isStudent = (a: Answers) => a.appType === 'reinstatement' || targetIn('F1', 'M1')(a);
const family = (a: Answers) => a.coApplicants === 'family';
const tuExtension = (a: Answers) => a.appType === 'extension' && targetIn('T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'U1', 'U2', 'U3', 'U4', 'U5')(a);

export const docs: DocItem[] = [
  fee,
  {
    ...i94Copy,
    label: { es: 'Copia de su I-94 (frente y reverso) y la de cada persona incluida', en: 'Copy of your I-94 (front and back) and that of each person included' },
  },
  {
    id: 'visitorStatement',
    label: { es: 'Una carta suya que explique su pedido', en: 'A statement from you explaining your request' },
    detail: {
      es: 'Por qué pide más tiempo, por qué su estadía seguirá siendo temporal y cómo va a salir de EE.UU., cómo afecta su trabajo o residencia en su país, y cómo se va a mantener.',
      en: 'Why you are asking, why your stay will stay temporary and how you will leave the U.S., how it affects your job or residence abroad, and how you will support yourself.',
    },
    when: targetStarts('B1', 'B2'),
  },
  {
    id: 'principalStatus',
    label: { es: 'Prueba del estatus del trabajador principal', en: 'Proof of the principal worker’s status' },
    detail: {
      es: 'Una de estas: copia del I-129 que presentó su empleador, el recibo o la aprobación (I-797) de ese I-129, o el I-94 más reciente del trabajador (frente y reverso).',
      en: 'One of these: a copy of the I-129 the employer filed, its receipt or approval notice (I-797), or the worker’s most recent I-94 (front and back).',
    },
    when: isDependent,
  },
  {
    id: 'relationshipToPrincipal',
    label: { es: 'Prueba de su parentesco con el trabajador principal', en: 'Proof of your relationship to the principal worker' },
    detail: {
      es: 'Acta de matrimonio (y prueba de que terminó cada matrimonio anterior) o acta de nacimiento, para cada persona incluida.',
      en: 'Marriage certificate (and proof each prior marriage ended) or birth certificate, for each person included.',
    },
    when: isDependent,
  },
  {
    id: 'i20',
    label: { es: 'Copia de su I-20 de la escuela donde va a estudiar', en: 'Copy of your I-20 from the school you will attend' },
    when: isStudent,
  },
  {
    id: 'ds2019',
    label: { es: 'Copia de su DS-2019', en: 'Copy of your DS-2019' },
    detail: { es: 'El certificado de su programa de intercambio J-1.', en: 'The certificate for your J-1 exchange program.' },
    when: (a) => a.appType === 'change' && targetIn('J1', 'J1S')(a),
  },
  {
    id: 'jStatusProof',
    label: { es: 'Prueba de su estatus J-1 o J-2 anterior', en: 'Proof of your past J-1 or J-2 status' },
    detail: { es: 'Copia de un DS-2019 o de la visa J en su pasaporte.', en: 'A copy of a DS-2019 or the J visa in your passport.' },
    when: (a) => a.exchangeVisitor === 'yes' && !(a.appType === 'change' && targetIn('J1', 'J1S')(a)),
  },
  {
    id: 'supportProof',
    label: { es: 'Pruebas de cómo se va a mantener', en: 'Proof of how you will support yourself' },
    detail: {
      es: 'Por ejemplo, estados de cuenta, una carta de apoyo de un familiar o una beca. Si es estudiante, que alcance para los estudios y para su familia.',
      en: 'For example, bank statements, a support letter from a relative or a scholarship. Students: enough for school and for your family.',
    },
    when: (a) => isStudent(a) || targetStarts('B1', 'B2')(a) || a.employed === 'no',
  },
  {
    id: 'reinstatementEvidence',
    label: { es: 'Pruebas de por qué perdió su estatus de estudiante', en: 'Evidence of why you fell out of student status' },
    detail: {
      es: 'Que fue por algo fuera de su control (o una baja de materias que su DSO podía autorizar) y que negarle la reinstalación le causaría un daño grave. Si pasaron más de 5 meses, pruebe también por qué no pudo pedirla antes.',
      en: 'That it was beyond your control (or a reduced course load your DSO could have authorized) and that a denial would cause you extreme hardship. If more than 5 months passed, also show why you could not file sooner.',
    },
    when: (a) => a.appType === 'reinstatement',
  },
  {
    id: 'm1ExtensionReason',
    label: { es: 'Pruebas del motivo de su extensión M-1', en: 'Evidence of the reason for your M-1 extension' },
    detail: {
      es: 'Por ejemplo, razones médicas o de estudio que retrasaron su programa, un cambio de escuela o la práctica profesional.',
      en: 'For example, medical or academic reasons that delayed your program, a school transfer, or practical training.',
    },
    when: (a) => a.appType === 'extension' && target(a) === 'M1',
  },
  {
    id: 'i566',
    label: { es: 'Formulario I-566 certificado por el Departamento de Estado', en: 'Form I-566 certified by the Department of State' },
    detail: {
      es: 'Si es empleado (A-3 o G-5): además, el I-94 o la aprobación de su empleador, su contrato y una carta original del empleador. Se presenta por medio de su misión.',
      en: 'If you are an employee (A-3 or G-5): also your employer’s I-94 or approval, your contract and an original letter from the employer. You file through your mission.',
    },
    when: targetIn('A1', 'A2', 'A3', 'G1', 'G2', 'G3', 'G4', 'G5'),
  },
  {
    id: 'mediaLetter',
    label: { es: 'Carta de su empresa de medios extranjera', en: 'Letter from your foreign media employer' },
    detail: { es: 'Que confirme su empleo, que usted la representa, el trabajo que hará y su pago.', en: 'Confirming your job, that you represent it, the work you will do and your pay.' },
    when: targetIn('I'),
  },
  {
    id: 'tuExtension',
    label: { es: 'Su aprobación de T o U y las pruebas de por qué necesita más tiempo', en: 'Your T or U approval and evidence of why you need more time' },
    detail: {
      es: 'Copia de su I-94 o aviso de aprobación, y una carta de la autoridad (por ejemplo un nuevo Suplemento B) o su declaración y otras pruebas de circunstancias excepcionales. Puede enviar lo que tenga.',
      en: 'A copy of your I-94 or approval notice, and a letter from the authorities (for example a new Supplement B) or your statement and other evidence of exceptional circumstances. You can send what you have.',
    },
    when: tuExtension,
  },
  {
    id: 'vPetition',
    label: { es: 'El recibo o la aprobación (I-797) del I-130 que su familiar presentó por usted', en: 'The I-797 receipt or approval of the I-130 your relative filed for you' },
    detail: {
      es: 'Si ya hay visa disponible, también el recibo de su I-485. Si no tiene el I-797, envíe cartas de USCIS sobre la petición.',
      en: 'If a visa is already available, also your I-485 receipt. If you don’t have the I-797, send USCIS letters about the petition.',
    },
    when: targetIn('V1', 'V2', 'V3'),
  },
  {
    id: 'i693',
    label: { es: 'Examen médico I-693 en sobre sellado', en: 'Form I-693 medical exam in a sealed envelope' },
    detail: { es: 'Solo la primera vez que pide estatus V, sin el suplemento de vacunas.', en: 'Only the first time you ask for V status, without the vaccination supplement.' },
    when: (a) => a.appType === 'change' && targetIn('V1', 'V2', 'V3')(a),
  },
  {
    id: 'i539a',
    label: { es: 'Un Formulario I-539A por cada familiar incluido', en: 'One Form I-539A for each family member included' },
    detail: { es: 'Firmado por cada persona (o por el padre o la madre si es menor de 14 años).', en: 'Signed by each person (or by a parent if under 14).' },
    when: family,
  },
  {
    ...marriageCert,
    detail: { es: 'Si incluye a su esposo/a.', en: 'If you include your spouse.' },
    when: (a) => family(a) && !isDependent(a),
  },
  { ...priorMarriagesEnded, when: (a) => family(a) && !isDependent(a) },
  {
    ...birthCert,
    label: { es: 'Copia del acta de nacimiento de cada hijo incluido', en: 'Copy of the birth certificate of each child included' },
    detail: { es: 'O el decreto de adopción, con el nombre del hijo y de los padres.', en: 'Or the adoption decree, showing the child’s and the parents’ names.' },
    when: (a) => family(a) && !isDependent(a),
  },
  {
    id: 'dependentVisas',
    label: { es: 'Copia de la visa de cada familiar incluido', en: 'Copy of the visa of each family member included' },
    detail: { es: 'La que muestra su clasificación de dependiente o el nombre del titular principal.', en: 'The one showing their dependent classification or the principal’s name.' },
    when: family,
  },
  { ...courtRecords, when: (a) => a['p4.6'] === 'yes' },
  translations,
];
