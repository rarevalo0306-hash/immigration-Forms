import type { Answers, Field, FormDefinition, Option, YesNoItem } from './types';
import type { T } from '../i18n';
import { all, anyAddress, biographic, date, is, nameFields, rows, sexField, yesNo } from './helpers';
import { assistanceSection, usedInterpreter, usedPreparer } from './assistance';

// Questions follow USCIS Form I-131, Application for Travel Documents, Parole Documents, and
// Arrival/Departure Records, edition 01/20/25. The app covers every application type of Part 1:
// reentry permit, refugee travel document, TPS travel authorization and advance parole for a
// person inside the U.S. (Items 1-5); an initial parole document for a person outside the U.S.
// (Items 6-7); an initial Arrival/Departure Record for parole in place (Items 8-9); and re-parole
// from inside the U.S. (Items 10-12). For Items 6-11 the person filing may be a requestor filing
// for someone else: Part 2, Items 1-15 are then the requestor's, and Items 16-27, Part 3 and
// Part 4, Item 1 are the beneficiary's. The PDF mapping lives in src/pdf/i131Pdf.ts.
//
// Left blank (for hand or for the attorney): the G-28 box on page 1, and every signature and date
// (Part 10, Item 4; the interpreter's Part 11, Item 6; the preparer's Part 12, Item 6).
//
// Part 10 has no reading-English or preparer boxes, so the applicant's statement asks whether an
// interpreter read the form to the person (`readsEnglish`) and whether someone else prepared it
// (`preparer`): those answers only decide whether Parts 11 and 12 are asked and filled. Parts 11
// and 12 have no mailing address and no preparer's statement boxes, so those questions are left out.

export const I131_EDITION = '01/20/25';

const t = (es: string, en: string): T => ({ es, en });

const isReentry = is('appType', '1');
const isRefugee = is('appType', '2', '3');
const isAdvanceParole = is('appType', '5');
const isParole = is('appType', 'parole');
const isPip = is('appType', 'pip');
const isReparole = is('appType', 'reparole');
/** Part 1, Items 6-11: parole from abroad, parole in place or re-parole (Part 8 applies). */
export const isAnyParole = is('appType', 'parole', 'pip', 'reparole');
const notParole = (a: Answers) => !isAnyParole(a);

/** Advance parole bases (Part 1, Item 5): export value of the box, label, and what the field below it asks. */
export const AP_BASES: { value: string; letter: string; label: T; detail?: 'receipt' | 'receiptOptional' | 'coa' | 'explain' }[] = [
  { value: '5', letter: 'A', label: t('Un I-485 pendiente (ajuste de estatus)', 'A pending Form I-485 (adjustment of status)'), detail: 'receiptOptional' },
  { value: '6', letter: 'B', label: t('Un I-589 pendiente (asilo)', 'A pending Form I-589 (asylum)'), detail: 'receipt' },
  { value: '7', letter: 'C', label: t('Un I-821 inicial pendiente (TPS)', 'A pending initial Form I-821 (TPS)'), detail: 'receipt' },
  { value: '8', letter: 'D', label: t('Salida Forzosa Diferida (DED)', 'Deferred Enforced Departure (DED)') },
  { value: '9', letter: 'E', label: t('DACA aprobado (I-821D)', 'Approved DACA (Form I-821D)'), detail: 'receipt' },
  { value: '10', letter: 'F', label: t('Visa T aprobada (I-914)', 'Approved T status (Form I-914)'), detail: 'receipt' },
  { value: '11', letter: 'G', label: t('Visa U aprobada (I-918)', 'Approved U status (Form I-918)'), detail: 'receipt' },
  { value: '12', letter: 'H', label: t('Soy parolee actualmente (parole bajo 212(d)(5))', 'I am a current parolee under INA 212(d)(5)'), detail: 'coa' },
  { value: '13', letter: 'I', label: t('Unidad Familiar aprobada (I-817)', 'Approved Family Unity (Form I-817)'), detail: 'receipt' },
  { value: '14', letter: 'J', label: t('Un I-687 pendiente (residencia temporal)', 'A pending Form I-687 (temporary residence)'), detail: 'receipt' },
  { value: '15', letter: 'K', label: t('Estatus V aprobado', 'Approved V status'), detail: 'receipt' },
  { value: '16', letter: 'L', label: t('Residencia de largo plazo en CNMI', 'CNMI long-term residence'), detail: 'receipt' },
  { value: '17', letter: 'M', label: t('Otro motivo', 'Other'), detail: 'explain' },
];

const apDetail = (a: Record<string, unknown>) => AP_BASES.find((b) => b.value === a.apBasis)?.detail;

/** Part 6, Items 2-4.c: the refugee questions whose Yes needs an explanation. */
export const REFUGEE_ITEMS: YesNoItem[] = [
  { id: 'rtd.2', formRef: 'Part 6 · Item 2', label: t('¿Piensa viajar al país del que es refugiado o asilado?', 'Do you plan to travel to that country?') },
  { id: 'rtd.3a', formRef: 'Part 6 · Item 3.a', label: t('Desde que es refugiado o asilado, ¿ha regresado a ese país?', 'Since becoming a refugee or asylee, have you returned to that country?') },
  { id: 'rtd.3b', formRef: 'Part 6 · Item 3.b', label: t('¿Ha pedido u obtenido un pasaporte o permiso de entrada de ese país?', 'Have you applied for or obtained a passport or entry permit from that country?') },
  { id: 'rtd.3c', formRef: 'Part 6 · Item 3.c', label: t('¿Ha pedido o recibido algún beneficio de ese país (por ejemplo, seguro médico)?', 'Have you applied for or received any benefit from that country (for example, health insurance)?') },
  { id: 'rtd.4a', formRef: 'Part 6 · Item 4.a', label: t('¿Ha vuelto a adquirir la nacionalidad de ese país?', 'Have you reacquired the nationality of that country?') },
  { id: 'rtd.4b', formRef: 'Part 6 · Item 4.b', label: t('¿Ha adquirido una nueva nacionalidad?', 'Have you acquired a new nationality?') },
  { id: 'rtd.4c', formRef: 'Part 6 · Item 4.c', label: t('¿Le han dado estatus de refugiado o asilado en otro país?', 'Have you been granted refugee or asylee status in any other country?') },
];

/**
 * The parole programs of Part 1, Items 6-11, by the export value of their box. `detail` names what
 * the item asks besides the box: an I-130 receipt (6.A), an IMMVI or Military PIP role ((1)-(3)
 * boxes), the referring agency (6.C), an FRTF registration number, or the program's name ("Other").
 */
export interface ParoleBasis {
  value: string;
  item: string;
  label: T;
  detail?: 'i130' | 'immvi' | 'military' | 'referral' | 'frtf' | 'program';
}

export const PAROLE_BASES: ParoleBasis[] = [
  { value: '18', item: '6.A', label: t('Programa de Parole para Veteranos Filipinos de la Segunda Guerra Mundial (FWVP)', 'Filipino World War II Veterans Parole (FWVP) Program'), detail: 'i130' },
  { value: '19', item: '6.B', label: t('Iniciativa para Miembros y Veteranos Militares Inmigrantes (IMMVI)', 'Immigrant Military Members and Veterans Initiative (IMMVI)'), detail: 'immvi' },
  { value: '20', item: '6.C', label: t('Referido de una agencia del gobierno federal (solo lo presenta la agencia)', 'Intergovernmental Parole Referral (filed by the agency)'), detail: 'referral' },
  { value: '21', item: '6.D', label: t('Grupo de Trabajo para la Reunificación Familiar (FRTF)', 'Family Reunification Task Force (FRTF) Process'), detail: 'frtf' },
  { value: '22', item: '6.E', label: t('Otro programa o proceso de parole', 'Other specific parole program or process'), detail: 'program' },
  { value: '23', item: '7', label: t('No es bajo un programa específico (parole humanitario)', 'Not under a specific parole program or process'), },
];

export const PIP_BASES: ParoleBasis[] = [
  { value: '24', item: '8.A', label: t('Parole in place militar (solo para mí)', 'Military Parole in Place (only on my own behalf)'), detail: 'military' },
  { value: '25', item: '8.B', label: t('Grupo de Trabajo para la Reunificación Familiar (FRTF)', 'Family Reunification Task Force (FRTF) Process'), detail: 'frtf' },
  { value: '26', item: '8.C', label: t('Otro programa o proceso', 'Other specific program or process'), detail: 'program' },
  { value: '27', item: '9', label: t('No es bajo un programa específico', 'Not under a specific program or process') },
];

export const REPAROLE_BASES: ParoleBasis[] = [
  { value: '28', item: '10.A', label: t('Proceso de Parole para la Reunificación Familiar (FRP)', 'Family Reunification Parole Process') },
  { value: '29', item: '10.B', label: t('Afganos con parole después del 31 de julio de 2021 (OAR o PAR)', 'Certain Afghans paroled after July 31, 2021 (OAR or PAR)') },
  { value: '30', item: '10.C', label: t('Ucranianos y sus familiares con parole desde el 11 de febrero de 2022', 'Ukrainian citizens and immediate family paroled on or after February 11, 2022') },
  { value: '31', item: '10.D', label: t('Programa FWVP (veteranos filipinos)', 'Filipino World War II Veterans Parole (FWVP) Program') },
  { value: '32', item: '10.E', label: t('Iniciativa IMMVI (miembros y veteranos militares)', 'Immigrant Military Members and Veterans Initiative (IMMVI)'), detail: 'immvi' },
  { value: '33', item: '10.F', label: t('Programa de Menores Centroamericanos (CAM)', 'Central American Minors (CAM) Program') },
  { value: '34', item: '10.G', label: t('Grupo de Trabajo para la Reunificación Familiar (FRTF)', 'Family Reunification Task Force (FRTF) Process') },
  { value: '35', item: '10.H', label: t('Parole in place militar', 'Military Parole in Place (Military PIP)'), detail: 'military' },
  { value: '36', item: '10.I', label: t('Otro programa o proceso', 'Other program or process'), detail: 'program' },
  { value: '37', item: '11', label: t('No es bajo un programa específico', 'Not under a specific program or process') },
];

/** The basis box chosen for the current parole type, if any. */
export function paroleBasis(a: Answers): ParoleBasis | undefined {
  if (isParole(a)) return PAROLE_BASES.find((b) => b.value === a.paroleBasis);
  if (isPip(a)) return PIP_BASES.find((b) => b.value === a.pipBasis);
  if (isReparole(a)) return REPAROLE_BASES.find((b) => b.value === a.reparoleBasis);
  return undefined;
}

const basisDetail = (d: ParoleBasis['detail']) => (a: Answers) => paroleBasis(a)?.detail === d;

/** Military PIP (8.A) is filed only on one's own behalf. */
const ownBehalfOnly = (a: Answers) => isPip(a) && a.pipBasis === '24';
/** Items 6-11 filed by a requestor for someone else (Part 2, Items 16-27 apply). */
export const forOther = (a: Answers) => isAnyParole(a) && !ownBehalfOnly(a) && a['parole.forOther'] === 'yes';
const forSelf = (a: Answers) => !forOther(a);
/** Part 2, Items 12-14: the filer is in the U.S. and asks for TPS travel, advance parole or parole in place. */
const needsI94 = (a: Answers) => is('appType', '4', '5')(a) || (isPip(a) && forSelf(a));

/** IMMVI (6.B, 10.E) and Military PIP (8.A, 10.H) roles: the (1)-(3) boxes. */
export const IMMVI_ROLES: Option[] = [
  { value: '1', label: t('Soy miembro actual o anterior de las fuerzas armadas', 'A current or former service member') },
  { value: '2', label: t('Cónyuge, hijo/a, o hijo/a soltero/a (o su hijo/a menor de 21) de un miembro actual o anterior', 'A current spouse, child, or unmarried son or daughter (or their child under 21) of a current or former service member') },
  { value: '3', label: t('Tutor legal o sustituto de un miembro actual o anterior', 'Current legal guardian or surrogate of a current or former service member') },
];
export const MILITARY_PIP_ROLES: Option[] = [
  { value: '1', label: t('Miembro actual o anterior de las fuerzas armadas', 'A current or former service member') },
  { value: '2', label: t('Cónyuge, padre o madre, hijo o hija de un miembro actual o anterior', 'A spouse, parent, son, or daughter of a current or former service member') },
];

const PAROLE_NOTICE = {
  tone: 'legal' as const,
  title: t('El parole es discrecional y no garantiza la entrada', 'Parole is discretionary and does not guarantee entry'),
  body: t(
    'USCIS decide caso por caso, solo por razones humanitarias urgentes o por un beneficio público significativo. Aunque aprueben el documento, al llegar al puerto de entrada CBP decide otra vez si deja entrar a la persona, y DHS puede revocar el documento o terminar el parole en cualquier momento. Si la persona tiene una orden de deportación, USCIS puede enviar el caso a ICE. El I-131 no sirve para solicitudes iniciales del programa CAM. Antes de presentar, hable con un abogado de inmigración o un representante acreditado.',
    'USCIS decides case by case, only for urgent humanitarian reasons or a significant public benefit. Even if the document is approved, CBP decides again at the port of entry whether to parole the person, and DHS may revoke the document or terminate parole at any time. If the person has a removal order, USCIS may send the case to ICE. Form I-131 cannot be used for initial CAM Program applications. Before filing, talk to an immigration attorney or accredited representative.',
  ),
};

const PIP_NOTICE = {
  tone: 'legal' as const,
  title: t('Solo para quien entró sin inspección', 'Only for people who entered without inspection'),
  body: t(
    'El parole in place es para quien está en EE.UU. sin haber sido inspeccionado y admitido. Si la persona entró con visa u otro permiso, aunque se haya quedado más tiempo, no califica. Es una decisión discrecional, caso por caso. Si la persona está en proceso de deportación o tiene una orden de deportación, normalmente decide ICE, no USCIS. Hable con un abogado de inmigración o un representante acreditado antes de presentar.',
    'Parole in place is for people in the U.S. who were not inspected and admitted. If the person entered with a visa or other permission, even if they overstayed, they do not qualify. It is a discretionary, case-by-case decision. If the person is in removal proceedings or has a removal order, ICE generally decides, not USCIS. Talk to an immigration attorney or accredited representative before filing.',
  ),
};

const REPAROLE_NOTICE = {
  tone: 'legal' as const,
  title: t('El re-parole es discrecional', 'Re-parole is discretionary'),
  body: t(
    'Solo se pide desde dentro de EE.UU.: si la persona ya salió del país, no califica y tendría que pedir un parole inicial. DHS puede terminar el parole en cualquier momento, y si la persona sale de EE.UU., su parole termina. USCIS puede pedir huellas, una entrevista o un examen médico. Si la persona está en proceso de deportación o tiene una orden, USCIS puede enviar el caso a ICE. Si tiene dudas, hable con un abogado de inmigración o un representante acreditado.',
    'It can only be requested from inside the U.S.: if the person already left, they do not qualify and would need an initial parole document instead. DHS may terminate parole at any time, and if the person leaves the U.S., their parole ends. USCIS may require biometrics, an interview or a medical exam. If the person is in removal proceedings or has a removal order, USCIS may refer the case to ICE. If in doubt, talk to an immigration attorney or accredited representative.',
  ),
};

/** Parts 11 and 12 of this edition have no mailing address and no preparer's statement boxes. */
const assistance = assistanceSection({ usedInterpreter, usedPreparer, interpreterPart: 'Part 11', preparerPart: 'Part 12' });
const FIELD_ROOM: Record<string, number> = { 'interp.business': 34, 'prep.business': 34, 'interp.language': 18 };
const assistanceWithoutAddresses = {
  ...assistance,
  questions: assistance.questions
    .filter((q) => !['interp.address', 'prep.address', 'prep.statement'].includes(q.id))
    // The PDF's business boxes hold 34 characters and the language box 18.
    .map((q) => (q.kind === 'fields' ? { ...q, fields: q.fields.map((f) => (FIELD_ROOM[f.id] ? { ...f, maxLength: FIELD_ROOM[f.id] } : f)) } : q)),
};

const anyRefugeeYes = (a: Record<string, unknown>) => REFUGEE_ITEMS.some((i) => a[i.id] === 'yes');

const prior = (id: string, ref: string): Field[] => [
  date(`${id}.date`, 'Fecha en que se lo dieron', 'Date issued', `${ref}.b · Date Issued`),
  { id: `${id}.disposition`, type: 'text', required: true, label: { es: 'Qué pasó con él (en inglés: attached, lost, stolen, still in my possession…)', en: 'Disposition' }, formRef: `${ref}.c · Disposition`, placeholder: 'still in my possession' },
];

export const i131: FormDefinition = {
  id: 'i-131',
  number: 'I-131',
  edition: I131_EDITION,
  title: t('Permiso de viaje', 'Travel document'),
  summary: {
    es: 'Pida un documento de viaje (advance parole, permiso de reingreso, documento de refugiado o de TPS) o parole: desde fuera de EE.UU., parole in place o re-parole.',
    en: 'Ask for a travel document (advance parole, reentry permit, refugee or TPS travel document) or parole: from abroad, parole in place or re-parole.',
  },
  intro: {
    es: 'Con el I-131 pide un documento para salir de EE.UU. y volver. Si tiene un I-485 pendiente, no salga del país sin advance parole aprobado: su solicitud se puede dar por abandonada. También sirve para pedir parole para alguien que está fuera del país, parole in place o un nuevo periodo de parole (re-parole), para usted o para otra persona. Se presenta un I-131 por cada persona.',
    en: 'With Form I-131 you ask for a document to leave the U.S. and come back. If you have a pending I-485, don’t leave without approved advance parole: your application may be considered abandoned. It is also used to request parole for someone outside the U.S., parole in place or a new period of parole (re-parole), for yourself or for someone else. File one I-131 per person.',
  },
  minutes: 25,
  pdf: {
    path: 'forms/i-131.pdf',
    fileName: 'I-131-filled.pdf',
    load: () => import('../pdf/i131Pdf').then((m) => m.fillI131),
    signHere: { es: 'Parte 10, Ítem 4', en: 'Part 10, Item 4' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/i-131 que la edición {edition} sigue vigente, la tarifa (formulario G-1055) y dónde enviarlo: la dirección depende del tipo de documento, y algunos tipos se pueden presentar en línea con una cuenta de USCIS. Si la edición cambió, use la nueva y copie sus respuestas de esta hoja.',
      'Adjunte las pruebas de su lista de documentos: copia de una identificación con foto, fotos tipo pasaporte si su tipo las pide, y la prueba de su base (recibo del I-485, aprobación de DACA o TPS, tarjeta de residente, I-94 de su parole…).',
      'Parole, parole in place o re-parole: la Parte 8 debe explicar la razón humanitaria urgente o el beneficio público y venir con pruebas. Para FRTF siga las instrucciones de dhs.gov; para FWVP, uscis.gov/FWVP; para el re-parole de afganos o ucranianos, las páginas de esos procesos en uscis.gov.',
      'Imprima el PDF y firme la Parte 10, Ítem 4, a mano con tinta negra (si la persona es menor de 14 años, firma su padre, madre o tutor). Si le ayudó un intérprete o un preparador, esa persona firma y fecha a mano la Parte 11 o la 12.',
      'Espere la cita de huellas (biometría) y vaya: si no va, pueden negar la solicitud. Si está fuera de EE.UU., le dirán dónde darlas.',
      'Espere a tener el documento aprobado en la mano antes de salir del país.',
    ],
    en: [
      'Check at uscis.gov/i-131 that edition {edition} is still current, the fee (Form G-1055) and where to file: the address depends on the document type, and some types can be filed online with a USCIS account. If the edition changed, use the new one and copy your answers from this sheet.',
      'Attach the evidence on your document checklist: a copy of a photo ID, passport-style photos if your type requires them, and proof of your basis (I-485 receipt, DACA or TPS approval, green card, parole I-94…).',
      'Parole, parole in place or re-parole: Part 8 must explain the urgent humanitarian reason or public benefit and come with evidence. For FRTF follow the dhs.gov filing guides; for FWVP, uscis.gov/FWVP; for Afghan or Ukrainian re-parole, those processes’ pages on uscis.gov.',
      'Print the PDF and sign Part 10, Item 4, by hand in black ink (a parent or guardian signs for a child under 14). If an interpreter or preparer helped you, they sign and date Part 11 or 12 by hand.',
      'Watch for your biometrics appointment and go: if you miss it, the application may be denied. If you are outside the U.S., you will be told where to give them.',
      'Wait until you have the approved document in hand before you leave the country.',
    ],
  },
  sections: [
    {
      id: 'type',
      part: 'Part 1',
      title: t('Qué documento pide', 'What you are applying for'),
      questions: [
        {
          id: 'appType',
          kind: 'choice',
          formRef: 'Part 1 · Items 1–5 · Application Type',
          question: t('¿Qué documento necesita?', 'Which document do you need?'),
          options: [
            { value: '5', label: t('Advance parole: tengo un trámite pendiente o un estatus como DACA o TPS inicial y quiero viajar', 'Advance parole: I have a pending case or a status like DACA or initial TPS and want to travel') },
            { value: '1', label: t('Permiso de reingreso: soy residente permanente y estaré fuera más de un año', 'Reentry permit: I am a permanent resident and will be abroad more than a year') },
            { value: '2', label: t('Documento de viaje de refugiado: soy refugiado o asilado', 'Refugee travel document: I am a refugee or asylee') },
            { value: '3', label: t('Documento de viaje de refugiado: soy residente gracias a mi asilo o refugio', 'Refugee travel document: I am a permanent resident through asylum or refugee status') },
            { value: '4', label: t('Autorización de viaje de TPS: tengo TPS aprobado', 'TPS travel authorization: I have approved TPS') },
            { value: 'parole', label: t('Parole desde fuera de EE.UU.: un documento de parole inicial para mí o para otra persona que está fuera del país', 'Parole from abroad: an initial parole document for me or for someone else who is outside the U.S.') },
            { value: 'pip', label: t('Parole in place: para mí o para otra persona que está en EE.UU. y entró sin inspección', 'Parole in place: for me or for someone else in the U.S. who entered without inspection') },
            { value: 'reparole', label: t('Re-parole: un nuevo periodo de parole para quien ya está en EE.UU. con parole', 'Re-parole: a new period of parole for someone already in the U.S. on parole') },
          ],
        },
        {
          id: 'tps',
          kind: 'fields',
          formRef: 'Part 1 · Item 4',
          showIf: is('appType', '4'),
          question: t('Su TPS aprobado', 'Your approved TPS'),
          fields: [{ id: 'tps.receipt', type: 'receipt', required: true, label: { es: 'Número de recibo de su último I-821 aprobado', en: 'Receipt number of your last approved Form I-821' }, formRef: 'Part 1 · Item 4 · Receipt Number', placeholder: 'IOE0123456789' }],
        },
        {
          id: 'apBasis',
          kind: 'choice',
          formRef: 'Part 1 · Item 5.A–5.M · Advance Parole based on',
          showIf: isAdvanceParole,
          question: t('¿En qué se basa su advance parole?', 'What is your advance parole based on?'),
          options: AP_BASES.map((b) => ({ value: b.value, label: b.label })),
        },
        {
          id: 'apI485',
          kind: 'fields',
          formRef: 'Part 1 · Item 5.A',
          showIf: all(isAdvanceParole, (a) => apDetail(a) === 'receiptOptional'),
          question: t('Su I-485', 'Your I-485'),
          why: t('Déjelo en blanco si envía este I-131 junto con su I-485.', 'Leave blank if you file this I-131 together with your I-485.'),
          fields: [{ id: 'ap.i485Receipt', type: 'receipt', label: { es: 'Número de recibo del I-485', en: 'Form I-485 receipt number' }, formRef: 'Part 1 · Item 5.A · Receipt Number', placeholder: 'IOE0123456789' }],
        },
        {
          id: 'apReceipt',
          kind: 'fields',
          formRef: 'Part 1 · Item 5',
          showIf: all(isAdvanceParole, (a) => apDetail(a) === 'receipt'),
          question: t('El recibo de ese trámite', 'That case’s receipt'),
          fields: [{ id: 'ap.receipt', type: 'receipt', required: true, label: { es: 'Número de recibo', en: 'Receipt number' }, formRef: 'Part 1 · Item 5 · Receipt Number', placeholder: 'IOE0123456789' }],
        },
        {
          id: 'apCoa',
          kind: 'fields',
          formRef: 'Part 1 · Item 5.H',
          showIf: all(isAdvanceParole, (a) => apDetail(a) === 'coa'),
          question: t('Su parole actual', 'Your current parole'),
          fields: [{ id: 'ap.coa', type: 'text', required: true, label: { es: 'Clase de admisión (como aparece en su I-94)', en: 'Class of admission (as shown on your I-94)' }, formRef: 'Part 1 · Item 5.H · Class of Admission' }],
        },
        {
          id: 'apExplain',
          kind: 'fields',
          formRef: 'Part 1 · Item 5.M',
          showIf: all(isAdvanceParole, (a) => apDetail(a) === 'explain'),
          question: t('¿En qué se basa?', 'What is it based on?'),
          fields: [{ id: 'ap.explain', type: 'longText', required: true, label: { es: 'Explicación (en inglés)', en: 'Explanation' }, formRef: 'Part 1 · Item 5.M · Other (provide explanation)' }],
        },
        {
          id: 'paroleBasis',
          kind: 'choice',
          formRef: 'Part 1 · Items 6–7 · Initial Parole Document',
          showIf: isParole,
          question: t('¿Bajo qué programa pide el parole?', 'Under which program are you requesting parole?'),
          why: t('Si no ve su programa, elija "Otro" y escriba el nombre o código que da USCIS.', 'If your program is not listed, choose "Other" and write the name or code USCIS gives.'),
          notice: PAROLE_NOTICE,
          options: PAROLE_BASES.map((b) => ({ value: b.value, label: b.label })),
        },
        {
          id: 'pipBasis',
          kind: 'choice',
          formRef: 'Part 1 · Items 8–9 · Parole In Place',
          showIf: isPip,
          question: t('¿Bajo qué programa pide el parole in place?', 'Under which program are you requesting parole in place?'),
          notice: PIP_NOTICE,
          options: PIP_BASES.map((b) => ({ value: b.value, label: b.label })),
        },
        {
          id: 'reparoleBasis',
          kind: 'choice',
          formRef: 'Part 1 · Items 10–11 · Re-parole',
          showIf: isReparole,
          question: t('¿Bajo qué programa recibió el parole la primera vez?', 'Under which program was the first parole granted?'),
          notice: REPAROLE_NOTICE,
          options: REPAROLE_BASES.map((b) => ({ value: b.value, label: b.label })),
        },
        {
          id: 'paroleI130',
          kind: 'fields',
          formRef: 'Part 1 · Item 6.A',
          showIf: all(isParole, basisDetail('i130')),
          question: t('El I-130 aprobado', 'The approved Form I-130'),
          why: t('La petición familiar aprobada en la que la persona es beneficiaria.', 'The approved family petition on which the person is a beneficiary.'),
          fields: [{ id: 'parole.i130Receipt', type: 'receipt', required: true, label: { es: 'Número de recibo del I-130', en: 'Form I-130 receipt number' }, formRef: 'Part 1 · Item 6.A · Form I-130 receipt number', placeholder: 'IOE0123456789' }],
        },
        {
          id: 'immvi.role',
          kind: 'choice',
          formRef: 'Part 1 · Item 6.B / 10.E · IMMVI',
          showIf: all(isAnyParole, basisDetail('immvi')),
          question: t('¿Quién es la persona que recibirá el parole?', 'Who is the person who will receive parole?'),
          options: IMMVI_ROLES,
        },
        {
          id: 'mpip.role',
          kind: 'choice',
          formRef: 'Part 1 · Item 8.A / 10.H · Military Parole in Place',
          showIf: all(isAnyParole, basisDetail('military')),
          question: t('¿Quién es la persona que recibirá el parole?', 'Who is the person who will receive parole?'),
          options: MILITARY_PIP_ROLES,
        },
        {
          id: 'referral',
          kind: 'fields',
          formRef: 'Part 1 · Item 6.C · Intergovernmental Parole Referral',
          showIf: all(isParole, basisDetail('referral')),
          question: t('La agencia que hace el referido', 'The referring agency'),
          why: t('Solo una agencia del gobierno federal de EE.UU. puede usar esta opción, con un correo .gov o .mil.', 'Only a U.S. federal government agency can use this option, with a .gov or .mil email.'),
          fields: [
            { id: 'referral.agency', type: 'text', required: true, label: { es: 'Agencia del Poder Ejecutivo federal', en: 'U.S. Federal Executive Branch Government Agency' }, formRef: 'Part 1 · Item 6.C · Agency', maxLength: 100 },
            { id: 'referral.email', type: 'email', required: true, label: { es: 'Correo oficial del representante de la agencia', en: 'Agency representative official email address' }, formRef: 'Part 1 · Item 6.C · Official Email Address', maxLength: 38 },
          ],
        },
        {
          id: 'frtf',
          kind: 'fields',
          formRef: 'Part 1 · Item 6.D / 8.B · FRTF',
          showIf: all(isAnyParole, basisDetail('frtf')),
          question: t('Su registro con el Grupo de Trabajo', 'Your Task Force registration'),
          why: t('El número que le dio el Grupo de Trabajo para la Reunificación Familiar al registrarse.', 'The number the Family Reunification Task Force gave you when you registered.'),
          fields: [{ id: 'frtf.number', type: 'text', required: true, label: { es: 'Número de registro', en: 'Task Force Registration Number' }, formRef: 'Part 1 · Item 6.D / 8.B · Task Force Registration Number', maxLength: 11 }],
        },
        {
          id: 'paroleProgram',
          kind: 'fields',
          formRef: 'Part 1 · Item 6.E / 8.C / 10.I · Other',
          showIf: all(isAnyParole, basisDetail('program')),
          question: t('¿Qué programa o proceso?', 'Which program or process?'),
          why: t('Escriba el nombre o código que USCIS usa en su sitio web (por ejemplo, el acrónimo del proceso).', 'Write the name or code USCIS uses on its website (for example, the process acronym).'),
          fields: [{ id: 'parole.program', type: 'text', required: true, label: { es: 'Programa o proceso (en inglés)', en: 'Program or process' }, formRef: 'Part 1 · Item 6.E / 8.C / 10.I', maxLength: 100 }],
        },
        {
          id: 'parole.forOther',
          kind: 'choice',
          formRef: 'Part 1 · Items 6–11 · On behalf of someone else',
          showIf: (a) => isAnyParole(a) && !ownBehalfOnly(a),
          question: t('¿Presenta esta solicitud para otra persona?', 'Are you filing this for someone else?'),
          why: t(
            'Puede pedir parole para otra persona, por ejemplo un familiar. Entonces la Parte 2 lleva sus datos (de quien presenta) y después le preguntamos los de esa persona. Se necesita un I-131 aparte para cada persona.',
            'You can request parole for someone else, for example a relative. Part 2 then has your details (the person filing), and we ask for that person’s details next. Each person needs a separate I-131.',
          ),
          options: yesNo,
        },
        {
          id: 'reparoleUntil',
          kind: 'fields',
          formRef: 'Part 1 · Item 12',
          showIf: isReparole,
          question: t('¿Hasta cuándo vale el parole actual?', 'Until when is the current parole valid?'),
          why: t('La fecha "Admit Until Date" del I-94 de la persona (i94.cbp.dhs.gov).', 'The "Admit Until Date" on the person’s Form I-94 (i94.cbp.dhs.gov).'),
          fields: [date('reparole.until', 'Fecha de vencimiento del parole en el I-94', 'Admit until date / parole on Form I-94', 'Part 1 · Item 12', true, 'date')],
        },
        {
          id: 'refugeeStatus',
          kind: 'choice',
          formRef: 'Part 1 · Item 13 · Do you hold status as a refugee, were you paroled as a refugee, or are you a lawful permanent resident as a direct result of being a refugee?',
          question: t('¿Es usted refugiado, entró como refugiado o es residente por haber sido refugiado?', 'Are you a refugee, were you paroled as a refugee, or are you a permanent resident because you were a refugee?'),
          why: t('Solo refugio, no asilo: un asilado responde No.', 'Refugee only, not asylum: an asylee answers No.'),
          options: yesNo,
        },
      ],
    },
    {
      id: 'about',
      part: 'Part 2',
      title: t('Sobre usted', 'About you'),
      questions: [
        {
          id: 'name',
          kind: 'fields',
          formRef: 'Part 2 · Item 1 · Your Full Name',
          question: t('¿Cuál es su nombre legal completo?', 'What is your full legal name?'),
          why: t('Si presenta para otra persona, esta parte es sobre usted, quien presenta. Los datos de la otra persona se piden más adelante.', 'If you are filing for someone else, this part is about you, the person filing. We ask for the other person’s details later.'),
          fields: nameFields('name', 'Part 2 · Item 1'),
        },
        {
          id: 'otherName.more0',
          kind: 'choice',
          formRef: 'Part 2 · Item 2 · Other Names Used',
          question: t('¿Ha usado otros nombres?', 'Have you used other names?'),
          why: t('Por ejemplo, su nombre de soltera o con otro apellido.', 'For example, your maiden name or another last name.'),
          options: yesNo,
        },
        ...rows({
          max: 3,
          id: 'otherName',
          first: is('otherName.more0', 'yes'),
          question: (i) => (i === 1 ? t('Otro nombre que ha usado', 'Another name you have used') : t('Otro nombre más', 'One more name')),
          more: t('¿Ha usado otro nombre más?', 'Have you used another name?'),
          formRef: 'Part 2 · Item 2 · Other Names Used',
          fields: (i) => nameFields(`otherName${i}`, `Part 2 · Item 2 · Name ${i}`),
          overflow: { es: 'El formulario tiene espacio para 3 nombres. Si son más, escríbalos a mano en la Parte 13.', en: 'The form has room for 3 names. If there are more, write them by hand in Part 13.' },
        }),
        {
          id: 'mailing',
          kind: 'fields',
          formRef: 'Part 2 · Item 3 · Current Mailing Address or Safe Address',
          question: t('¿A qué dirección le llega el correo?', 'Where do you get your mail?'),
          why: t('Aquí le enviarán el documento si lo aprueban.', 'This is where the document is mailed if approved.'),
          fields: anyAddress('mailing', 'Part 2 · Item 3', { careOf: true }),
        },
        {
          id: 'mailingSame',
          kind: 'choice',
          formRef: 'Part 2 · Item 4',
          question: t('¿Vive en esa misma dirección?', 'Do you live at that same address?'),
          options: yesNo,
        },
        {
          id: 'home',
          kind: 'fields',
          formRef: 'Part 2 · Item 4 · Current Physical Address',
          showIf: is('mailingSame', 'no'),
          question: t('¿Dónde vive?', 'Where do you live?'),
          fields: anyAddress('home', 'Part 2 · Item 4', { careOf: true }),
        },
        {
          id: 'details',
          kind: 'fields',
          formRef: 'Part 2 · Items 5–11 · Other Information',
          question: t('Sus datos', 'Your details'),
          fields: [
            { id: 'aNumber', type: 'aNumber', label: { es: 'A-Number (si tiene)', en: 'A-Number (if any)' }, formRef: 'Part 2 · Item 5' },
            { id: 'birthCountry', type: 'text', required: true, label: { es: 'País de nacimiento', en: 'Country of birth' }, formRef: 'Part 2 · Item 6' },
            { id: 'citizenship', type: 'text', required: true, label: { es: 'País de ciudadanía', en: 'Country of citizenship' }, formRef: 'Part 2 · Item 7' },
            sexField('sex', 'Part 2 · Item 8'),
            date('dob', 'Fecha de nacimiento', 'Date of birth', 'Part 2 · Item 9'),
            { id: 'ssn', type: 'ssn', label: { es: 'Número de Seguro Social (si tiene)', en: 'Social Security number (if any)' }, formRef: 'Part 2 · Item 10', placeholder: '123-45-6789' },
            { id: 'uscisAccount', type: 'uscisAccount', label: { es: 'Número de cuenta en línea de USCIS', en: 'USCIS online account number' }, formRef: 'Part 2 · Item 11' },
          ],
        },
        {
          id: 'entry',
          kind: 'fields',
          formRef: 'Part 2 · Items 12–14',
          showIf: needsI94,
          question: t('Su entrada más reciente', 'Your most recent entry'),
          why: t('Los datos de su I-94 (i94.cbp.dhs.gov). Déjelos en blanco si no tiene.', 'Details from your I-94 (i94.cbp.dhs.gov). Leave blank if you have none.'),
          fields: [
            { id: 'coa', type: 'text', label: { es: 'Clase de admisión (por ejemplo B2, F1, PAR)', en: 'Class of admission' }, formRef: 'Part 2 · Item 12 · Class of Admission (COA)' },
            { id: 'i94', type: 'i94', label: { es: 'Número de I-94', en: 'I-94 number' }, formRef: 'Part 2 · Item 13' },
            { id: 'i94.until', type: 'date', label: { es: 'Fecha de vencimiento de su estadía en el I-94', en: 'Authorized stay expiration on Form I-94' }, formRef: 'Part 2 · Item 14' },
          ],
        },
        {
          id: 'reparoleEntry',
          kind: 'fields',
          formRef: 'Part 2 · Items 12–15',
          showIf: all(isReparole, forSelf),
          question: t('Su entrada con parole', 'Your parole entry'),
          why: t('Los datos de su I-94 (i94.cbp.dhs.gov). La fecha de vencimiento ya la dio en la Parte 1.', 'Details from your I-94 (i94.cbp.dhs.gov). You already gave the expiration date in Part 1.'),
          fields: [
            { id: 'reparole.coa', type: 'text', label: { es: 'Clase de admisión (por ejemplo PAR, OAR, UHP)', en: 'Class of admission' }, formRef: 'Part 2 · Item 12 · Class of Admission (COA)' },
            { id: 'reparole.i94', type: 'i94', label: { es: 'Número de I-94', en: 'I-94 number' }, formRef: 'Part 2 · Item 13' },
            { id: 'uspid', type: 'text', label: { es: 'eMedical U.S. Parolee ID (USPID), si tiene', en: 'eMedical U.S. Parolee ID (USPID), if any' }, formRef: 'Part 2 · Item 15' },
          ],
        },
        {
          id: 'benName',
          kind: 'fields',
          formRef: 'Part 2 · Item 16 · Information About Them',
          showIf: forOther,
          question: t('¿Cuál es el nombre legal de la persona para quien pide el parole?', 'What is the legal name of the person you are requesting parole for?'),
          notice: { tone: 'info', title: t('Ahora, sobre la otra persona', 'Now, about the other person'), body: t('Estas preguntas son sobre la persona que recibirá el parole.', 'These questions are about the person who will receive parole.') },
          fields: nameFields('ben', 'Part 2 · Item 16'),
        },
        {
          id: 'benOther.more0',
          kind: 'choice',
          formRef: 'Part 2 · Item 17 · Their Other Names Used',
          showIf: forOther,
          question: t('¿Esa persona ha usado otros nombres?', 'Has that person used other names?'),
          options: yesNo,
        },
        ...rows({
          max: 3,
          id: 'benOther',
          first: all(forOther, is('benOther.more0', 'yes')),
          question: (i) => (i === 1 ? t('Otro nombre que ha usado esa persona', 'Another name that person has used') : t('Otro nombre más', 'One more name')),
          more: t('¿Ha usado otro nombre más?', 'Has the person used another name?'),
          formRef: 'Part 2 · Item 17 · Their Other Names Used',
          fields: (i) => nameFields(`benOther${i}`, `Part 2 · Item 17 · Name ${i}`),
          overflow: { es: 'El formulario tiene espacio para 3 nombres. Si son más, escríbalos a mano en la Parte 13.', en: 'The form has room for 3 names. If there are more, write them by hand in Part 13.' },
        }),
        {
          id: 'benDetails',
          kind: 'fields',
          formRef: 'Part 2 · Items 18–23',
          showIf: forOther,
          question: t('Datos de esa persona', 'That person’s details'),
          fields: [
            date('ben.dob', 'Fecha de nacimiento', 'Date of birth', 'Part 2 · Item 18'),
            { id: 'ben.birthCountry', type: 'text', required: true, label: { es: 'País de nacimiento', en: 'Country of birth' }, formRef: 'Part 2 · Item 19' },
            { id: 'ben.citizenship', type: 'text', required: true, label: { es: 'País de ciudadanía', en: 'Country of citizenship or nationality' }, formRef: 'Part 2 · Item 20' },
            { id: 'ben.phone', type: 'text', label: { es: 'Teléfono de día (con código de país si es fuera de EE.UU.)', en: 'Daytime phone (with country code if outside the U.S.)' }, formRef: 'Part 2 · Item 21', maxLength: 15 },
            { id: 'ben.email', type: 'email', label: { es: 'Correo electrónico (si tiene)', en: 'Email (if any)' }, formRef: 'Part 2 · Item 22' },
            { id: 'ben.aNumber', type: 'aNumber', label: { es: 'A-Number (si tiene)', en: 'A-Number (if any)' }, formRef: 'Part 2 · Item 23' },
          ],
        },
        {
          id: 'benMailing',
          kind: 'fields',
          formRef: 'Part 2 · Item 24 · Their Current Mailing Address',
          showIf: forOther,
          question: t('¿A qué dirección le llega el correo a esa persona?', 'Where does that person get mail?'),
          fields: anyAddress('benMailing', 'Part 2 · Item 24', { careOf: true }),
        },
        {
          id: 'benMailingSame',
          kind: 'choice',
          formRef: 'Part 2 · Item 25',
          showIf: forOther,
          question: t('¿Esa persona vive en esa misma dirección?', 'Does that person live at that same address?'),
          options: yesNo,
        },
        {
          id: 'benHome',
          kind: 'fields',
          formRef: 'Part 2 · Item 25 · Their Current Physical Address',
          showIf: all(forOther, is('benMailingSame', 'no')),
          question: t('¿Dónde vive esa persona?', 'Where does that person live?'),
          fields: anyAddress('benHome', 'Part 2 · Item 25', { careOf: true }),
        },
        {
          id: 'benEntry',
          kind: 'fields',
          formRef: 'Part 2 · Items 26–27 · Their Other Information',
          showIf: all(forOther, is('appType', 'pip', 'reparole')),
          question: t('La entrada más reciente de esa persona', 'That person’s most recent entry'),
          why: t('Los datos de su I-94 (i94.cbp.dhs.gov). Déjelos en blanco si no tiene.', 'Details from their I-94 (i94.cbp.dhs.gov). Leave blank if none.'),
          fields: [
            { id: 'ben.coa', type: 'text', label: { es: 'Clase de admisión (por ejemplo PAR)', en: 'Class of admission' }, formRef: 'Part 2 · Item 26 · Class of Admission (COA)' },
            { id: 'ben.i94', type: 'i94', label: { es: 'Número de I-94', en: 'I-94 number' }, formRef: 'Part 2 · Item 27' },
          ],
        },
      ],
    },
    {
      id: 'biographic',
      part: 'Part 3',
      title: t('Datos biográficos', 'Biographic information'),
      questions: biographic('Part 3').map((q) =>
        q.id === 'ethnicity'
          ? { ...q, why: t('Son los datos de quien recibirá el documento: si presenta para otra persona, conteste por ella.', 'These are about the person who will receive the document: if you are filing for someone else, answer for them.') }
          : q,
      ),
    },
    {
      id: 'processing',
      part: 'Part 4',
      title: t('Antecedentes', 'Processing information'),
      questions: [
        {
          id: 'proceedings',
          kind: 'choice',
          formRef: 'Part 4 · Item 1 · Exclusion, deportation, removal, or rescission proceedings',
          question: t('¿Ha estado alguna vez en un proceso de deportación, exclusión o remoción?', 'Have you ever been in exclusion, deportation, removal or rescission proceedings?'),
          why: t(
            'Si presenta para otra persona, conteste por ella. Si hay un caso en corte de inmigración o una orden de deportación, normalmente decide ICE y no USCIS: consulte a un abogado antes de presentar o de viajar.',
            'If you are filing for someone else, answer for them. If there is a case in immigration court or a removal order, ICE generally decides instead of USCIS: talk to an attorney before filing or traveling.',
          ),
          options: yesNo,
        },
        {
          id: 'prevReentry',
          kind: 'choice',
          formRef: 'Part 4 · Item 2.a',
          question: t('¿Alguna vez le dieron un permiso de reingreso o documento de viaje de refugiado?', 'Have you ever been issued a reentry permit or refugee travel document?'),
          options: yesNo,
        },
        {
          id: 'prevReentryDoc',
          kind: 'fields',
          formRef: 'Part 4 · Items 2.b–2.c',
          showIf: is('prevReentry', 'yes'),
          question: t('El último que le dieron', 'The last one issued to you'),
          fields: prior('prevReentry', 'Part 4 · Item 2'),
        },
        {
          id: 'prevAP',
          kind: 'choice',
          formRef: 'Part 4 · Item 3.a',
          question: t('¿Alguna vez le dieron un advance parole?', 'Have you ever been issued an advance parole document?'),
          options: yesNo,
        },
        {
          id: 'prevAPDoc',
          kind: 'fields',
          formRef: 'Part 4 · Items 3.b–3.c',
          showIf: is('prevAP', 'yes'),
          question: t('El último que le dieron', 'The last one issued to you'),
          fields: prior('prevAP', 'Part 4 · Item 3'),
        },
        {
          id: 'replacement',
          kind: 'choice',
          formRef: 'Part 4 · Item 4 · Are you requesting a replacement?',
          showIf: notParole,
          question: t('¿Pide un reemplazo de un documento que ya le dieron?', 'Are you asking to replace a document you were already issued?'),
          options: yesNo,
        },
        {
          id: 'replacementReason',
          kind: 'choice',
          formRef: 'Part 4 · Item 5',
          showIf: all(notParole, is('replacement', 'yes')),
          question: t('¿Por qué lo reemplaza?', 'Why are you replacing it?'),
          options: [
            { value: '1', label: t('Lo emitieron, pero no lo recibí', 'It was issued but I didn’t receive it') },
            { value: '2', label: t('Lo recibí y se perdió, me lo robaron o se dañó', 'I received it and it was lost, stolen or damaged') },
            { value: '3', label: t('Tiene un error por mi culpa o porque cambiaron mis datos', 'It has an error caused by me or my information changed') },
            { value: '4', label: t('Tiene un error que no fue mi culpa (por ejemplo, de USCIS)', 'It has an error not caused by me (for example, USCIS)') },
          ],
        },
        {
          id: 'corrections',
          kind: 'choice',
          multiple: true,
          formRef: 'Part 4 · Item 6.a',
          showIf: all(notParole, is('replacement', 'yes'), is('replacementReason', '3', '4')),
          question: t('¿Qué dato hay que corregir?', 'What needs to be corrected?'),
          why: t('Elija todos los que apliquen.', 'Choose all that apply.'),
          options: [
            { value: 'Name', label: t('Nombre', 'Name') },
            { value: 'ANumber', label: t('A-Number', 'A-Number') },
            { value: 'CountryofBirthCitizenship', label: t('País de nacimiento o ciudadanía', 'Country of birth/citizenship') },
            { value: 'Terms', label: t('Términos y condiciones', 'Terms and conditions') },
            { value: 'DOB', label: t('Fecha de nacimiento', 'Date of birth') },
            { value: 'Gender', label: t('Sexo', 'Sex') },
            { value: 'Validity', label: t('Fecha de validez', 'Validity date') },
            { value: 'Photo', label: t('Foto', 'Photo') },
          ],
        },
        {
          id: 'replacementDetails',
          kind: 'fields',
          formRef: 'Part 4 · Items 6.a–6.b',
          showIf: all(notParole, is('replacement', 'yes')),
          question: t('Datos del documento que reemplaza', 'About the document you are replacing'),
          fields: [
            { id: 'replacement.receipt', type: 'receipt', required: true, label: { es: 'Número de recibo del I-131 de ese documento', en: 'Receipt number of that Form I-131' }, formRef: 'Part 4 · Item 6.b', placeholder: 'IOE0123456789' },
            { id: 'replacement.explain', type: 'longText', label: { es: 'Qué está mal en su documento (en inglés)', en: 'What is incorrect on your document' }, formRef: 'Part 4 · Item 6.a · Explanation' },
          ],
        },
        {
          id: 'deliverTo',
          kind: 'choice',
          formRef: 'Part 4 · Items 7.a–7.b · Where do you want your document sent?',
          showIf: (a) => isReentry(a) || isRefugee(a),
          question: t('¿Dónde quiere recibir su documento?', 'Where do you want your document sent?'),
          why: t('Si lo recoge en otro país, tendrá que ir a una embajada, consulado u oficina de USCIS allá.', 'If you pick it up abroad, you’ll go to an embassy, consulate or USCIS office there.'),
          options: [
            { value: 'A', label: t('A mi dirección de correo en EE.UU.', 'To my U.S. mailing address') },
            { value: 'B', label: t('A una embajada, consulado u oficina en el extranjero', 'To an embassy, consulate or office abroad') },
          ],
        },
        {
          id: 'pickup',
          kind: 'fields',
          formRef: 'Part 4 · Item 7.b',
          showIf: all((a) => isReentry(a) || isRefugee(a), is('deliverTo', 'B')),
          question: t('¿Dónde lo recogerá?', 'Where will you pick it up?'),
          fields: [
            { id: 'pickup.city', type: 'text', required: true, label: { es: 'Ciudad', en: 'City or town' }, formRef: 'Part 4 · Item 7.b · City or Town', maxLength: 20 },
            { id: 'pickup.country', type: 'text', required: true, label: { es: 'País', en: 'Country' }, formRef: 'Part 4 · Item 7.b · Country' },
          ],
        },
        {
          id: 'notice',
          kind: 'choice',
          formRef: 'Part 4 · Items 8.a–8.b',
          showIf: all((a) => isReentry(a) || isRefugee(a), is('deliverTo', 'B')),
          question: t('¿A dónde le enviamos el aviso para recogerlo?', 'Where should the pickup notice be sent?'),
          options: [
            { value: 'A', label: t('A mi dirección de correo', 'To my mailing address') },
            { value: 'B', label: t('A otra dirección', 'To another address') },
          ],
        },
        {
          id: 'noticeAddress',
          kind: 'fields',
          formRef: 'Part 4 · Item 9',
          showIf: all((a) => isReentry(a) || isRefugee(a), is('deliverTo', 'B'), is('notice', 'B')),
          question: t('¿A qué dirección?', 'Which address?'),
          fields: [
            ...anyAddress('noticeAddress', 'Part 4 · Item 9.a', { careOf: true }),
            { id: 'noticeAddress.phone', type: 'phone', label: { es: 'Teléfono de día', en: 'Daytime phone' }, formRef: 'Part 4 · Item 9.b' },
            { id: 'noticeAddress.email', type: 'email', label: { es: 'Correo electrónico', en: 'Email' }, formRef: 'Part 4 · Item 9.c' },
          ],
        },
      ],
    },
    {
      id: 'reentry',
      part: 'Part 5',
      title: t('Permiso de reingreso', 'Reentry permit'),
      questions: [
        {
          id: 'timeOutside',
          kind: 'choice',
          formRef: 'Part 5 · Item 1 · Total time spent outside the United States',
          showIf: isReentry,
          question: t('Desde que es residente (o en los últimos 5 años), ¿cuánto tiempo en total ha estado fuera de EE.UU.?', 'Since becoming a resident (or in the last 5 years), how much total time have you spent outside the U.S.?'),
          options: [
            { value: 'Lessthan6', label: t('Menos de 6 meses', 'Less than 6 months') },
            { value: '6months', label: t('De 6 meses a 1 año', '6 months to 1 year') },
            { value: '1to2', label: t('De 1 a 2 años', '1 to 2 years') },
            { value: '2to3', label: t('De 2 a 3 años', '2 to 3 years') },
            { value: '3to4', label: t('De 3 a 4 años', '3 to 4 years') },
            { value: 'morethan', label: t('Más de 4 años', 'More than 4 years') },
          ],
        },
      ],
    },
    {
      id: 'refugee',
      part: 'Part 6',
      title: t('Documento de viaje de refugiado', 'Refugee travel document'),
      questions: [
        {
          id: 'rtdCountry',
          kind: 'fields',
          formRef: 'Part 6 · Item 1',
          showIf: isRefugee,
          question: t('¿De qué país es usted refugiado o asilado?', 'Which country are you a refugee or asylee from?'),
          fields: [{ id: 'rtd.country', type: 'text', required: true, label: { es: 'País', en: 'Country' }, formRef: 'Part 6 · Item 1 · Country from which you are a refugee or asylee' }],
        },
        {
          id: 'rtd.questions',
          kind: 'yesNoList',
          formRef: 'Part 6 · Items 2–4.c',
          showIf: isRefugee,
          question: t('Sobre ese país', 'About that country'),
          why: t('Volver a ese país o usar su pasaporte puede afectar su asilo o refugio. Si responde Sí, explique abajo.', 'Returning to that country or using its passport can affect your asylum or refugee status. If you answer Yes, explain below.'),
          items: REFUGEE_ITEMS,
        },
        {
          id: 'rtdExplain',
          kind: 'fields',
          formRef: 'Part 13 · Additional Information',
          showIf: all(isRefugee, anyRefugeeYes),
          question: t('Explique sus respuestas de Sí', 'Explain your Yes answers'),
          fields: [{ id: 'rtd.explain', type: 'longText', required: true, label: { es: 'Explicación (en inglés)', en: 'Explanation' }, formRef: 'Part 13 · Part 6 · Items 2–4.c' }],
        },
        {
          id: 'rtd.beforeDeparture',
          kind: 'choice',
          formRef: 'Part 6 · Item 5 · Are you filing for a Refugee Travel Document before departing the United States?',
          showIf: isRefugee,
          question: t('¿Presenta esta solicitud antes de salir de EE.UU.?', 'Are you filing before leaving the U.S.?'),
          options: yesNo,
        },
        {
          id: 'rtd.outside',
          kind: 'choice',
          formRef: 'Part 6 · Item 6.a',
          showIf: all(isRefugee, is('rtd.beforeDeparture', 'no')),
          question: t('¿Está fuera de EE.UU. ahora?', 'Are you outside the U.S. now?'),
          options: yesNo,
        },
        {
          id: 'rtdLocation',
          kind: 'fields',
          formRef: 'Part 6 · Items 6.b–6.c',
          showIf: all(isRefugee, is('rtd.beforeDeparture', 'no'), is('rtd.outside', 'yes')),
          question: t('¿Dónde está?', 'Where are you?'),
          fields: [
            { id: 'rtd.location', type: 'text', required: true, label: { es: 'Ciudad y país donde está', en: 'Current city and country' }, formRef: 'Part 6 · Item 6.b' },
            { id: 'rtd.countries', type: 'text', label: { es: 'Otros países que visitó desde que salió', en: 'Other countries visited since leaving' }, formRef: 'Part 6 · Item 6.c' },
          ],
        },
      ],
    },
    {
      id: 'trip',
      part: 'Part 7',
      title: t('Su viaje', 'Your trip'),
      questions: [
        {
          id: 'tripDetails',
          kind: 'fields',
          formRef: 'Part 7 · Items 1–3, 5 · Proposed Travel',
          showIf: isAdvanceParole,
          question: t('Sobre su viaje', 'About your trip'),
          why: t('Escriba en inglés. Un motivo claro (por ejemplo, visitar a un familiar enfermo) ayuda a que lo aprueben.', 'Write in English. A clear purpose (for example, visiting a sick relative) helps approval.'),
          fields: [
            { id: 'trip.departure', type: 'futureDate', required: true, label: { es: 'Fecha en que piensa salir', en: 'Intended departure date' }, formRef: 'Part 7 · Item 1' },
            { id: 'trip.purpose', type: 'longText', required: true, label: { es: 'Motivo del viaje (en inglés)', en: 'Purpose of trip' }, formRef: 'Part 7 · Item 2' },
            { id: 'trip.countries', type: 'text', required: true, label: { es: 'Países que visitará', en: 'Countries you intend to visit' }, formRef: 'Part 7 · Item 3' },
            { id: 'trip.days', type: 'number', required: true, label: { es: 'Duración esperada (en días)', en: 'Expected length (days)' }, formRef: 'Part 7 · Item 5', maxLength: 4 },
          ],
        },
        {
          id: 'trip.trips',
          kind: 'choice',
          formRef: 'Part 7 · Item 4 · How many trips do you intend to use this document?',
          showIf: isAdvanceParole,
          question: t('¿Para cuántos viajes lo usará?', 'How many trips will you use it for?'),
          options: [
            { value: 'O', label: t('Un viaje', 'One trip') },
            { value: 'M', label: t('Más de un viaje', 'More than one trip') },
          ],
        },
      ],
    },
    {
      id: 'parole',
      part: 'Part 8',
      title: t('Por qué pide parole', 'Why you are requesting parole'),
      questions: [
        {
          id: 'paroleReason',
          kind: 'fields',
          formRef: 'Part 8 · Items 1–2',
          showIf: isAnyParole,
          question: t('¿Por qué califica para el parole?', 'How do you qualify for parole?'),
          why: t(
            'Escriba en inglés la razón humanitaria urgente o el beneficio público significativo, por qué la persona merece que se use la discreción a su favor y por qué necesita ese tiempo. Para re-parole, explique por qué el periodo anterior no alcanzó. Adjunte pruebas.',
            'Explain the urgent humanitarian reason or significant public benefit, why the person merits a favorable exercise of discretion, and why they need that length of time. For re-parole, explain why the previous period was not enough. Attach evidence.',
          ),
          fields: [
            { id: 'parole.explain', type: 'longText', required: true, label: { es: 'Explicación (en inglés)', en: 'Explanation' }, formRef: 'Part 8 · Item 1', hint: t('Si es larga, sigue en la Parte 13 (caben unos 2,000 caracteres en total); si necesita más, adjunte una hoja aparte.', 'If it is long, it continues in Part 13 (about 2,000 characters in all); if you need more, attach a separate sheet.') },
            { id: 'parole.stay', type: 'text', required: true, label: { es: 'Tiempo que espera quedarse en EE.UU. (en inglés, por ejemplo "2 years")', en: 'Expected length of stay in the U.S.' }, formRef: 'Part 8 · Item 2', maxLength: 30, placeholder: '2 years' },
          ],
        },
        {
          id: 'paroleArrival',
          kind: 'fields',
          formRef: 'Part 8 · Items 3.a–3.b',
          showIf: isParole,
          question: t('La llegada a EE.UU.', 'Arrival in the U.S.'),
          why: t('Si aprueban el parole, avisarán a esa embajada, consulado u oficina de USCIS en el extranjero.', 'If parole is approved, that U.S. embassy, consulate or USCIS office abroad will be notified.'),
          fields: [
            { id: 'parole.arrival', type: 'futureDate', required: true, label: { es: 'Fecha en que piensa llegar a EE.UU.', en: 'Date of intended arrival' }, formRef: 'Part 8 · Item 3.a', placeholder: 'MM/DD/AAAA' },
            { id: 'parole.postCity', type: 'text', required: true, label: { es: 'Ciudad de la embajada, consulado u oficina', en: 'City of the embassy, consulate or office' }, formRef: 'Part 8 · Item 3.b · City or Town', maxLength: 20 },
            { id: 'parole.postCountry', type: 'text', required: true, label: { es: 'País', en: 'Country' }, formRef: 'Part 8 · Item 3.b · Country' },
          ],
        },
      ],
    },
    {
      id: 'reparoleEad',
      part: 'Part 9',
      title: t('Permiso de trabajo', 'Work permit'),
      questions: [
        {
          id: 'reparole.ead',
          kind: 'choice',
          formRef: 'Part 9 · Item 1 · Employment Authorization Document (EAD)',
          showIf: isReparole,
          question: t('¿Quiere un permiso de trabajo (EAD) si aprueban el nuevo parole?', 'Do you want a work permit (EAD) if the new parole is approved?'),
          why: t('Así no tiene que presentar un I-765 aparte. Solo se emite si aprueban el re-parole.', 'This way you don’t need to file a separate I-765. It is only issued if the re-parole is approved.'),
          options: yesNo,
        },
      ],
    },
    {
      id: 'contact',
      part: 'Part 10',
      title: t('Contacto', 'Contact'),
      questions: [
        {
          id: 'contactInfo',
          kind: 'fields',
          formRef: 'Part 10 · Items 1–3 · Applicant’s Contact Information',
          question: t('¿Cómo puede contactarle USCIS?', 'How can USCIS contact you?'),
          fields: [
            { id: 'phone', type: 'phone', required: true, label: { es: 'Teléfono de día', en: 'Daytime phone' }, formRef: 'Part 10 · Item 1', placeholder: '213 555 0123' },
            { id: 'mobile', type: 'phone', label: { es: 'Celular', en: 'Mobile phone' }, formRef: 'Part 10 · Item 2' },
            { id: 'email', type: 'email', label: { es: 'Correo electrónico', en: 'Email' }, formRef: 'Part 10 · Item 3' },
          ],
        },
        {
          id: 'readsEnglish',
          kind: 'choice',
          formRef: 'Part 10 · Applicant’s Certification',
          question: t('¿Puede leer y entender el formulario en inglés?', 'Can you read and understand the form in English?'),
          why: t('Si alguien le lee el formulario en su idioma, esa persona llena y firma la Parte 11.', 'If someone reads the form to you in your language, that person completes and signs Part 11.'),
          options: [
            { value: 'A', label: t('Sí, leo inglés', 'Yes, I read English') },
            { value: 'B', label: t('No, un intérprete me lo leyó', 'No, an interpreter read it to me') },
          ],
        },
        {
          id: 'preparer',
          kind: 'choice',
          formRef: 'Part 12 · Preparer',
          question: t('¿Alguien más le preparó este formulario?', 'Did someone else prepare this form for you?'),
          why: t('Por ejemplo un abogado, una organización o un familiar que llenó las respuestas. Esa persona llena y firma la Parte 12.', 'For example an attorney, an organization or a relative who filled in the answers. That person completes and signs Part 12.'),
          options: yesNo,
        },
      ],
    },
    assistanceWithoutAddresses,
  ],
};

