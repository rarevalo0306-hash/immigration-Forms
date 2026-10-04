import type { DocItem } from './types';
import type { Answers } from '../types';
import { fee, greenCardCopy, i94Copy, idCopy, photos, translations } from './common';
import { is } from '../helpers';

// From the I-131 instructions (edition 01/20/25): "Required Evidence" (for all categories and by document
// category, items 1–8), the Part 4 replacement instructions, and the parole in place and re-parole
// sections of "Who May File" (items 6.A and 7.A(8)).
export const formId = 'i-131';

const reentry = is('appType', '1');
const refugee = is('appType', '2', '3');
const ap = is('appType', '5');
const tps = (a: Answers) => a.appType === '4' || (ap(a) && a.apBasis === '7');
const parole = is('appType', 'parole');
const pip = is('appType', 'pip');
const reparole = is('appType', 'reparole');
const anyParole = is('appType', 'parole', 'pip', 'reparole');
/** Initial parole from abroad: FWVP (6.A), IMMVI (6.B), agency referral (6.C), not under a program (7). */
const paroleBy = (...v: string[]) => (a: Answers) => parole(a) && v.includes(String(a.paroleBasis ?? ''));
const pipBy = (...v: string[]) => (a: Answers) => pip(a) && v.includes(String(a.pipBasis ?? ''));
const reparoleBy = (...v: string[]) => (a: Answers) => reparole(a) && v.includes(String(a.reparoleBasis ?? ''));
/** Military: IMMVI (6.B, 10.E) and Military Parole in Place (8.A, 10.H). */
const military = (a: Answers) => paroleBy('19')(a) || pipBy('24')(a) || reparoleBy('32', '35')(a);
/** The person is a family member, guardian or surrogate of the service member, not the member. */
const militaryFamily = (a: Answers) => military(a) && ['2', '3'].includes(String((pipBy('24')(a) || reparoleBy('35')(a) ? a['mpip.role'] : a['immvi.role']) ?? ''));
/** Military Parole in Place family members (8.A(2), 10.H(2)). */
const militaryPipFamily = (a: Answers) => (pipBy('24')(a) || reparoleBy('35')(a)) && a['mpip.role'] === '2';

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
  { ...photos(2), when: (a) => ap(a) || a.appType === '4' || (refugee(a) && a['rtd.outside'] === 'yes') || pipBy('24')(a) },
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
  {
    id: 'beneficiaryPassport',
    label: { es: 'Copia del pasaporte de la persona que recibirá el parole', en: 'Copy of the beneficiary’s passport' },
    detail: {
      es: 'La página de datos. Si no tiene pasaporte, explique por qué y envíe otra identificación del gobierno que muestre su ciudadanía.',
      en: 'The biographic page. If there is no passport, explain why and send another government ID that shows citizenship.',
    },
    when: paroleBy('18', '23'),
  },
  {
    id: 'petitionerId',
    label: { es: 'Identificación y estatus de quien presenta', en: 'ID and status of the person filing' },
    detail: {
      es: 'Copia de su identificación oficial y, si aplica, prueba de su ciudadanía o estatus en EE.UU. (pasaporte, green card o acta de nacimiento).',
      en: 'A copy of your official ID and, if applicable, proof of your U.S. citizenship or immigration status (passport, green card or birth certificate).',
    },
    when: paroleBy('18', '23'),
  },
  {
    id: 'i134',
    label: { es: 'Formulario I-134, Declaración de Apoyo Económico', en: 'Form I-134, Declaration of Financial Support' },
    detail: {
      es: 'Llenado por quien apoyará económicamente a la persona, con su identificación y prueba de su ciudadanía o estatus.',
      en: 'Completed by the person who will support them financially, with their ID and proof of citizenship or status.',
    },
    when: paroleBy('18', '19', '20', '23'),
  },
  {
    id: 'fwvpI130',
    label: { es: 'Aprobación del I-130 (I-797) presentado por el veterano o su viuda/o', en: 'Form I-130 approval notice (I-797) filed by the veteran or surviving spouse' },
    detail: { es: 'O la impresión del estado del caso en línea que muestre el I-130 aprobado.', en: 'Or a Case Status Online printout showing the approved I-130.' },
    when: paroleBy('18'),
  },
  {
    id: 'fwvpService',
    label: { es: 'Prueba del servicio del veterano filipino en la Segunda Guerra Mundial', en: 'Proof of the Filipino veteran’s World War II service' },
    detail: {
      es: 'Servicio reconocido por el Ejército de EE.UU. Si es la viuda o viudo, también el acta de matrimonio y el acta de defunción del veterano.',
      en: 'Service recognized by the U.S. Army. If you are the surviving spouse, also your marriage certificate and the veteran’s death certificate.',
    },
    when: paroleBy('18'),
  },
  {
    id: 'agencyLetter',
    label: { es: 'Carta de apoyo de la agencia federal', en: 'Letter of Support from the referring agency' },
    detail: { es: 'Explica las razones del referido. La agencia debe dar un correo .gov o .mil.', en: 'Documents the reasons for the referral. The agency must give a .gov or .mil email.' },
    when: paroleBy('20'),
  },
  {
    id: 'militaryService',
    label: { es: 'Prueba del servicio militar', en: 'Proof of military service' },
    detail: {
      es: 'Por ejemplo, el DD Form 214, el NGB Form 22 o la identificación militar (frente y reverso). Si ya no sirve, prueba de que no lo dieron de baja de forma deshonrosa.',
      en: 'For example, DD Form 214, NGB Form 22 or the military ID (front and back). For a former member, proof of a discharge that was not dishonorable.',
    },
    when: military,
  },
  {
    id: 'militaryRelationship',
    label: { es: 'Prueba del parentesco con el miembro militar', en: 'Proof of the relationship to the service member' },
    detail: {
      es: 'Acta de matrimonio y fin de matrimonios anteriores, actas de nacimiento con los nombres de los padres, o inscripción en DEERS.',
      en: 'Marriage certificate and end of prior marriages, birth certificates showing the parents, or DEERS enrollment.',
    },
    when: militaryFamily,
  },
  {
    id: 'militaryPetition',
    label: { es: 'Prueba del I-130 del miembro militar (o de su I-360)', en: 'Proof of the service member’s Form I-130 (or your Form I-360)' },
    detail: {
      es: 'Que el miembro militar presentó un I-130 por usted o, si falleció, que usted presentó un I-360. Si es padre o madre, también prueba de que el miembro militar apoya la solicitud.',
      en: 'That the service member filed an I-130 for you or, if deceased, that you filed an I-360. For a parent, also proof that the service member supports the request.',
    },
    when: militaryPipFamily,
  },
  {
    id: 'frtfGuide',
    label: { es: 'Carta de presentación y pruebas del proceso FRTF', en: 'FRTF cover letter and evidence' },
    detail: { es: 'Siga la guía para su caso en dhs.gov (family-reunification-task-force-filing-guides-and-cover-letters).', en: 'Follow the filing guide for your case at dhs.gov (family-reunification-task-force-filing-guides-and-cover-letters).' },
    when: (a) => paroleBy('21')(a) || pipBy('25')(a) || reparoleBy('34')(a),
  },
  {
    id: 'paroleReason',
    label: { es: 'Explicación y pruebas de la razón humanitaria o el beneficio público', en: 'Explanation and evidence of the humanitarian reason or public benefit' },
    detail: {
      es: 'Por qué se pide y por cuánto tiempo, con pruebas (cartas médicas, de una organización o del empleador…) y cualquier otro factor favorable. Si un documento tiene notas atrás, copie las dos caras.',
      en: 'Why it is requested and for how long, with evidence (medical, organization or employer letters…) and any other favorable factors. If a document has notes on the back, copy both sides.',
    },
    when: anyParole,
  },
  {
    id: 'visaStatement',
    label: { es: 'Explicación de por qué no puede obtener una visa', en: 'Statement of why a visa cannot be obtained' },
    detail: {
      es: 'Cuándo y dónde se intentó, o por qué no se pidió. Si aplica, lo mismo sobre un perdón (waiver) y copias de decisiones sobre peticiones o solicitudes.',
      en: 'When and where it was tried, or why it was not sought. If applicable, the same for a waiver, and copies of decisions on petitions or applications.',
    },
    when: (a) => paroleBy('23')(a) || reparole(a),
  },
  { ...i94Copy, label: { es: 'Prueba del parole anterior (copia del I-94)', en: 'Proof of the previous parole (copy of the I-94)' }, detail: { es: 'Su I-94 anterior u otra prueba de que recibió parole o parole in place. Se descarga en i94.cbp.dhs.gov.', en: 'Your previous I-94 or other proof you were paroled or granted parole in place. Download it at i94.cbp.dhs.gov.' }, when: reparole },
  {
    id: 'programGuidance',
    label: { es: 'Pruebas que pide la guía de su programa', en: 'Evidence your program’s guidance asks for' },
    detail: {
      es: 'Revise la página del programa en uscis.gov (por ejemplo FWVP, afganos, ucranianos o FRP) o la guía de DHS: cada uno pide documentos distintos.',
      en: 'Check the program’s page on uscis.gov (for example FWVP, Afghans, Ukrainians or FRP) or the DHS guidance: each asks for different documents.',
    },
    when: (a) => paroleBy('22')(a) || pipBy('26')(a) || reparoleBy('28', '29', '30', '31', '33', '36')(a),
  },
  translations,
];
