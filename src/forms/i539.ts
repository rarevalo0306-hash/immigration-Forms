import type { Answers, Field, FormDefinition, Question, YesNoItem } from './types';
import type { T } from '../i18n';
import { date, is, nameFields, yesNo } from './helpers';
import { assistanceSection, usedInterpreter, usedPreparer } from './assistance';
import { I539_CURRENT_STATUSES, I539_NEW_STATUSES } from './i539Status';

// Questions follow USCIS Form I-539, Application to Extend/Change Nonimmigrant Status, edition
// 08/28/24, for the principal applicant. The PDF mapping lives in src/pdf/i539Pdf.ts.
// Each co-applicant's Form I-539A is its own form in Camino (src/forms/i539a.ts). Out of scope:
// the attorney box at the top of page 1, and the signatures and dates (the interpreter's and
// preparer's included; the rest of Parts 6 and 7 comes from the "Who helped you" section).
//
// Part 5 has no reading-English or preparer boxes, so the contact section asks whether an
// interpreter read the form to the person (`readsEnglish`) and whether someone else prepared it
// (`preparer`): those answers only decide whether Parts 6 and 7 are asked and filled. Parts 6 and 7
// have no mailing address and no preparer's statement boxes, so those questions are left out.

export const I539_EDITION = '08/28/24';

const t = (es: string, en: string): T => ({ es, en });

const text = (id: string, es: string, en: string, formRef: string, extra: Partial<Field> = {}): Field => ({ id, type: 'text', required: true, label: { es, en }, formRef, ...extra });

const usAddress = (prefix: string, ref: string, careOf = false): Field[] => [
  ...(careOf ? [text(`${prefix}.careOf`, 'A cargo de (si recibe correo en casa de otra persona)', 'In care of', `${ref} · In Care Of Name`, { required: false, maxLength: 34 })] : []),
  text(`${prefix}.street`, 'Número y calle', 'Street number and name', `${ref} · Street Number and Name`, { maxLength: 34, placeholder: '1234 Main St' }),
  { id: `${prefix}.unit`, type: 'unit', label: { es: 'Apartamento, suite o piso', en: 'Apt., suite or floor' }, formRef: `${ref} · Apt. Ste. Flr.`, placeholder: 'Apt 4B' },
  text(`${prefix}.city`, 'Ciudad', 'City or town', `${ref} · City or Town`, { maxLength: 28 }),
  { id: `${prefix}.state`, type: 'state', required: true, label: { es: 'Estado', en: 'State' }, formRef: `${ref} · State`, placeholder: 'CA' },
  { id: `${prefix}.zip`, type: 'zip', required: true, label: { es: 'Código postal', en: 'ZIP code' }, formRef: `${ref} · ZIP Code` },
];

const statusOptions = (list: string[]) => list.map((c) => ({ value: c, label: { es: c, en: c } }));

/** The status code before " - " in a dropdown value ("F1 - STUDENT - ACADEMIC" → "F1"). */
const code = (v: unknown) => String(v ?? '').split(' - ')[0].trim();
const STUDENT = ['F1', 'M1', 'J1', 'J1S'];

/** Whether Part 2, Items 5-6 (school and SEVIS) apply. */
export const isStudentCase = (a: Answers) =>
  a.appType === 'reinstatement' || (a.appType === 'change' && STUDENT.includes(code(a.newStatus))) || (a.appType !== 'change' && STUDENT.includes(code(a.currentStatus)));

/** Part 4, Items 3-5: other immigration filings. */
export const IMMIGRANT_ITEMS: YesNoItem[] = [
  { id: 'p4.3', formRef: 'Part 4 · Item 3', label: t('¿Está solicitando una visa de inmigrante (residencia)?', 'Are you an applicant for an immigrant visa?') },
  { id: 'p4.4', formRef: 'Part 4 · Item 4', label: t('¿Alguien ha presentado ALGUNA VEZ una petición de inmigrante por usted (I-130, I-140, I-360…)?', 'Has an immigrant petition EVER been filed for you?') },
  { id: 'p4.5', formRef: 'Part 4 · Item 5', label: t('¿Ha presentado ALGUNA VEZ el Formulario I-485 (ajuste de estatus a residente)?', 'Have you EVER filed Form I-485, Application to Register Permanent Residence or Adjust Status?') },
];

/** Part 4, Items 6-13: background questions. */
export const BACKGROUND_ITEMS: YesNoItem[] = [
  { id: 'p4.6', formRef: 'Part 4 · Item 6', label: t('¿Lo han arrestado o condenado por algún delito desde su última entrada a EE.UU.?', 'Have you been arrested or convicted of any criminal offense since last entering the United States?') },
  { id: 'p4.7a', formRef: 'Part 4 · Item 7.a', label: t('¿ALGUNA VEZ participó, ordenó o ayudó en actos de tortura o genocidio?', 'Have you EVER ordered, incited, called for, committed, assisted, helped with, or otherwise participated in acts involving torture or genocide?') },
  { id: 'p4.7b', formRef: 'Part 4 · Item 7.b', label: t('¿…en matar a alguien?', '…killing any person?') },
  { id: 'p4.7c', formRef: 'Part 4 · Item 7.c', label: t('¿…en herir gravemente a alguien a propósito?', '…intentionally and severely injuring any person?') },
  { id: 'p4.7d', formRef: 'Part 4 · Item 7.d', label: t('¿…en contacto sexual con alguien que no dio o no podía dar su consentimiento, o que fue obligado o amenazado?', '…engaging in any kind of sexual contact or relations with any person who did not consent or was unable to consent, or was being forced or threatened?') },
  { id: 'p4.7e', formRef: 'Part 4 · Item 7.e', label: t('¿…en impedir a alguien practicar su religión?', '…limiting or denying any person’s ability to exercise religious beliefs?') },
  { id: 'p4.8a', formRef: 'Part 4 · Item 8.a', label: t('¿ALGUNA VEZ sirvió o participó en una unidad militar, paramilitar, policial, de autodefensa, guerrilla, milicia u otro grupo armado?', 'Have you EVER served in, been a member of, assisted, or participated in any military unit, paramilitary unit, police unit, self-defense unit, vigilante unit, rebel group, guerrilla group, militia, insurgent organization, or any other armed group?') },
  { id: 'p4.8b', formRef: 'Part 4 · Item 8.b', label: t('¿ALGUNA VEZ trabajó o sirvió en una prisión, cárcel, centro de detención o campo de trabajo?', 'Have you EVER worked, volunteered, or otherwise served in any prison, jail, prison camp, detention facility, labor camp, or any other situation that involved detaining persons?') },
  { id: 'p4.9', formRef: 'Part 4 · Item 9', label: t('¿ALGUNA VEZ perteneció o ayudó a un grupo que usó o amenazó con usar armas contra alguien?', 'Have you EVER been a member of, assisted, or participated in any group, unit, or organization of any kind in which you or other persons used or threatened to use any type of weapon against any person?') },
  { id: 'p4.10', formRef: 'Part 4 · Item 10', label: t('¿ALGUNA VEZ vendió, dio o transportó armas sabiendo que se usarían contra otra persona?', 'Have you EVER sold, provided, or transported weapons, or assisted any person in doing so, which you knew or believed would be used against another person?') },
  { id: 'p4.11', formRef: 'Part 4 · Item 11', label: t('¿ALGUNA VEZ recibió entrenamiento con armas, paramilitar o militar?', 'Have you EVER received any weapons training, paramilitary training, or other military-type training?') },
  { id: 'p4.12', formRef: 'Part 4 · Item 12', label: t('¿ALGUNA VEZ ha violado las condiciones de su estatus actual (por ejemplo, trabajar sin permiso o dejar de estudiar)?', 'Have you EVER violated the terms of the nonimmigrant status you now hold?') },
  { id: 'p4.13', formRef: 'Part 4 · Item 13', label: t('¿Está ahora en un proceso de deportación (removal proceedings)?', 'Are you now in removal proceedings?') },
];

const anyYes = (items: YesNoItem[]) => (a: Answers) => items.some((i) => a[i.id] === 'yes');
export const anyExplainedYes = anyYes([...IMMIGRANT_ITEMS, ...BACKGROUND_ITEMS]);

const relatedCase = (a: Answers) => a.relGranted === 'yes' || a.relPetition === 'A' || a.relPetition === 'B';

const explain = (id: string, fieldId: string, formRef: string, question: T, label: T, why: T, extra: Partial<Question> = {}): Question =>
  ({
    id,
    kind: 'fields',
    formRef,
    question,
    why,
    fields: [{ id: fieldId, type: 'longText', required: true, label, formRef, maxLength: 700 }],
    ...extra,
  }) as Question;

/** Parts 6 and 7 of this edition have no mailing address and no preparer's statement boxes. */
const assistance = assistanceSection({ usedInterpreter, usedPreparer, interpreterPart: 'Part 6', preparerPart: 'Part 7' });
const assistanceWithoutAddresses = { ...assistance, questions: assistance.questions.filter((q) => !['interp.address', 'prep.address', 'prep.statement'].includes(q.id)) };

export const i539: FormDefinition = {
  id: 'i-539',
  number: 'I-539',
  edition: I539_EDITION,
  title: t('Extender o cambiar su estatus de no inmigrante', 'Application to Extend/Change Nonimmigrant Status'),
  summary: {
    es: 'Pida quedarse más tiempo en EE.UU. con su visa actual (turista, estudiante, dependiente), cambiar a otro estatus temporal o recuperar su estatus de estudiante.',
    en: 'Ask to stay longer in the U.S. in your current status (visitor, student, dependent), change to another temporary status, or be reinstated to student status.',
  },
  intro: {
    es: 'El I-539 es para quien está en EE.UU. legalmente con una visa temporal (por ejemplo B-2 turista, F-1 estudiante, H-4 o L-2 dependiente) y quiere extender su estadía, cambiar a otro estatus temporal o, si es estudiante F o M, pedir la reinstalación. Debe presentarlo ANTES de que venza la fecha de su I-94. Este formulario es solo para usted, el solicitante principal: su esposo/a e hijos que pidan lo mismo pueden ir en la misma solicitud, pero cada uno necesita su propio Formulario I-539A, que también puede llenar en esta app. Si ya se le venció la estadía, trabajó sin permiso o está en proceso de deportación, hable antes con un abogado.',
    en: 'Form I-539 is for people lawfully in the U.S. on a temporary visa (for example B-2 visitor, F-1 student, H-4 or L-2 dependent) who want to extend their stay, change to another temporary status, or, as an F or M student, request reinstatement. You must file it BEFORE the date on your I-94 expires. This form is only for you, the principal applicant: your spouse and children asking for the same thing can be included in the same application, but each one needs their own Form I-539A, which you can also fill out in this app. If your stay has already expired, you worked without permission, or you are in removal proceedings, talk to an attorney first.',
  },
  minutes: 25,
  pdf: {
    path: 'forms/i-539.pdf',
    fileName: 'I-539-filled.pdf',
    load: () => import('../pdf/i539Pdf').then((m) => m.fillI539),
    signHere: { es: 'Parte 5, Ítem 4', en: 'Part 5, Item 4' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/i-539 que la edición {edition} sigue vigente y revise la tarifa actual. También puede presentarlo en línea con una cuenta de USCIS.',
      'Preséntelo antes de que venza la fecha de su I-94 (búsquela en i94.cbp.dhs.gov). Si lo presenta tarde, USCIS puede negarlo y usted empezaría a acumular presencia ilegal.',
      'Si incluyó a familiares, cada uno necesita su propio Formulario I-539A, firmado por él o ella (o por el padre o la madre si es menor de 14 años). Envíelos junto con este I-539.',
      'Adjunte una copia de su I-94, de su pasaporte vigente y de su visa; pruebas de que puede mantenerse sin trabajar sin permiso (estados de cuenta, carta de apoyo); y una carta que explique por qué necesita más tiempo o el cambio. Para estudiantes, el Formulario I-20 o DS-2019 nuevo.',
      'Imprima el PDF y firme la Parte 5, Ítem 4, a mano con tinta negra. Si un intérprete o preparador le ayudó, sus datos ya están en las Partes 6 y 7; ellos las revisan y las firman y fechan a mano. Firme también la Parte 8 si la usamos.',
      'USCIS le enviará un recibo (I-797C) y puede citarle para tomarle huellas y foto (biometría). Guarde el recibo: muestra que pidió a tiempo mientras espera la decisión. No salga de EE.UU. mientras espera: su solicitud se consideraría abandonada.',
    ],
    en: [
      'Check at uscis.gov/i-539 that edition {edition} is still current and review the current fee. You can also file online with a USCIS account.',
      'File before the date on your I-94 expires (look it up at i94.cbp.dhs.gov). If you file late, USCIS may deny it and you would start accruing unlawful presence.',
      'If you included family members, each one needs their own Form I-539A, signed by them (or by a parent if under 14). Send them together with this I-539.',
      'Attach a copy of your I-94, your current passport and visa; proof that you can support yourself without unauthorized work (bank statements, support letter); and a letter explaining why you need more time or the change. Students include the new Form I-20 or DS-2019.',
      'Print the PDF and sign Part 5, Item 4, by hand in black ink. If an interpreter or preparer helped you, their details are already in Parts 6 and 7; they check them and sign and date by hand. Also sign Part 8 if we used it.',
      'USCIS will send you a receipt (I-797C) and may schedule a biometrics appointment (fingerprints and photo). Keep the receipt: it shows you filed on time while you wait. Do not leave the U.S. while you wait: your application would be considered abandoned.',
    ],
  },
  sections: [
    {
      id: 'about',
      part: 'Part 1',
      title: t('Sus datos', 'About you'),
      questions: [
        {
          id: 'name',
          kind: 'fields',
          formRef: 'Part 1 · Item 1 · Your Full Legal Name',
          question: t('¿Cuál es su nombre legal completo?', 'What is your full legal name?'),
          why: t('Como aparece en su pasaporte y en su I-94.', 'As it appears on your passport and I-94.'),
          fields: nameFields('name', 'Part 1 · Item 1'),
        },
        {
          id: 'ids',
          kind: 'fields',
          formRef: 'Part 1 · Items 2–3, 10',
          question: t('Sus números (si los tiene)', 'Your numbers (if any)'),
          why: t('La mayoría de los visitantes no tienen A-Number. Deje vacío lo que no tenga.', 'Most visitors don’t have an A-Number. Leave empty what you don’t have.'),
          fields: [
            { id: 'aNumber', type: 'aNumber', label: { es: 'A-Number', en: 'A-Number' }, formRef: 'Part 1 · Item 2 · Alien Registration Number (A-Number)' },
            { id: 'uscisAccount', type: 'uscisAccount', label: { es: 'Cuenta en línea de USCIS', en: 'USCIS online account number' }, formRef: 'Part 1 · Item 3 · USCIS Online Account Number' },
            { id: 'ssn', type: 'ssn', label: { es: 'Número de Seguro Social', en: 'U.S. Social Security number' }, formRef: 'Part 1 · Item 10 · U.S. Social Security Number' },
          ],
        },
        {
          id: 'mailing',
          kind: 'fields',
          formRef: 'Part 1 · Item 4 · Your U.S. Mailing Address',
          question: t('¿A qué dirección en EE.UU. le llega el correo?', 'What is your U.S. mailing address?'),
          why: t('USCIS le enviará aquí el recibo y la decisión.', 'USCIS will send your receipt and decision here.'),
          fields: usAddress('mailing', 'Part 1 · Item 4', true),
        },
        { id: 'mailingSame', kind: 'choice', formRef: 'Part 1 · Item 5', question: t('¿Vive en esa misma dirección?', 'Is your mailing address the same as your physical address?'), options: yesNo },
        { id: 'home', kind: 'fields', formRef: 'Part 1 · Item 6 · Your Current Physical Address', showIf: is('mailingSame', 'no'), question: t('¿Dónde vive?', 'Where do you live?'), fields: usAddress('home', 'Part 1 · Item 6') },
        {
          id: 'birth',
          kind: 'fields',
          formRef: 'Part 1 · Items 7–9',
          question: t('Su nacimiento y nacionalidad', 'Your birth and citizenship'),
          fields: [
            text('birthCountry', 'País de nacimiento', 'Country of birth', 'Part 1 · Item 7 · Country of Birth', { placeholder: 'Mexico' }),
            text('citizenship', 'País de ciudadanía o nacionalidad', 'Country of citizenship or nationality', 'Part 1 · Item 8 · Country of Citizenship or Nationality', { placeholder: 'Mexico' }),
            date('dob', 'Fecha de nacimiento', 'Date of birth', 'Part 1 · Item 9 · Date of Birth'),
          ],
        },
        {
          id: 'lastEntry',
          kind: 'fields',
          formRef: 'Part 1 · Item 11 · Your Most Recent Entry Into the United States',
          question: t('Su última entrada a EE.UU.', 'Your most recent entry into the U.S.'),
          why: t('El número del I-94 y su fecha de vencimiento aparecen en i94.cbp.dhs.gov. Use el pasaporte con el que entró.', 'Your I-94 number and its expiration date are at i94.cbp.dhs.gov. Use the passport you entered with.'),
          fields: [
            date('lastEntry.date', 'Fecha de su última llegada', 'Date of last arrival', 'Part 1 · Item 11 · Date of Last Arrival Into the United States'),
            { id: 'i94.number', type: 'i94', required: true, label: { es: 'Número del I-94', en: 'I-94 number' }, formRef: 'Part 1 · Item 11 · Form I-94 Arrival-Departure Record Number' },
            text('passport.number', 'Número de pasaporte', 'Passport number', 'Part 1 · Item 11 · Passport Number', { required: false, maxLength: 30 }),
            text('passport.travelDoc', 'Número de documento de viaje (si no usó pasaporte)', 'Travel document number (if any)', 'Part 1 · Item 11 · Travel Document Number', { required: false, maxLength: 30 }),
            text('passport.country', 'País que emitió el pasaporte o documento', 'Country of passport or travel document issuance', 'Part 1 · Item 11 · Country of Passport or Travel Document Issuance'),
            date('passport.expires', 'Fecha de vencimiento del pasaporte o documento', 'Passport or travel document expiration date', 'Part 1 · Item 11 · Passport or Travel Document Expiration Date', true, 'date'),
          ],
        },
        {
          id: 'status',
          kind: 'fields',
          formRef: 'Part 1 · Item 12 · Current Nonimmigrant Status',
          question: t('¿Cuál es su estatus migratorio actual?', 'What is your current nonimmigrant status?'),
          why: t('Es la clase de admisión de su I-94 (por ejemplo B2 turista, F1 estudiante, H4 dependiente).', 'It is the class of admission on your I-94 (for example B2 visitor, F1 student, H4 dependent).'),
          fields: [{ id: 'currentStatus', type: 'select', required: true, label: { es: 'Estatus actual', en: 'Current status' }, formRef: 'Part 1 · Item 12 · Current Nonimmigrant Status', options: statusOptions(I539_CURRENT_STATUSES) }],
        },
        {
          id: 'statusDS',
          kind: 'choice',
          formRef: 'Part 1 · Item 12 · Duration of Status (D/S)',
          question: t('¿Su I-94 dice "D/S" (duración del estatus) en vez de una fecha?', 'Does your I-94 say "D/S" (Duration of Status) instead of a date?'),
          why: t('Es común en estudiantes F-1 e intercambio J-1.', 'This is common for F-1 students and J-1 exchange visitors.'),
          options: yesNo,
        },
        {
          id: 'statusExpires',
          kind: 'fields',
          formRef: 'Part 1 · Item 12 · Date Status Expires',
          showIf: is('statusDS', 'no'),
          question: t('¿Cuándo vence su estadía?', 'When does your status expire?'),
          notice: {
            tone: 'legal',
            title: t('Presente antes de esta fecha', 'File before this date'),
            body: t(
              'USCIS debe recibir su solicitud antes de que venza la fecha de su I-94. Si ya pasó, solo se acepta en casos muy limitados y con pruebas de por qué se atrasó (por ejemplo una enfermedad): hable con un abogado antes de presentar, porque quedarse después de esa fecha puede causarle un castigo de 3 o 10 años para volver.',
              'USCIS must receive your application before your I-94 date expires. If it has passed, late filing is only excused in very limited cases with proof of why you were late (for example an illness): talk to an attorney before filing, because staying past that date can lead to a 3- or 10-year bar on returning.',
            ),
          },
          fields: [date('i94.expires', 'Fecha en que vence (según su I-94)', 'Date status expires (per your I-94)', 'Part 1 · Item 12 · Date Status Expires', true, 'date')],
        },
      ],
    },
    {
      id: 'application',
      part: 'Part 2',
      title: t('Qué está pidiendo', 'Application type'),
      questions: [
        {
          id: 'appType',
          kind: 'choice',
          formRef: 'Part 2 · Item 1 · I am applying for',
          question: t('¿Qué está pidiendo?', 'What are you applying for?'),
          why: t('Elija solo una.', 'Choose only one.'),
          notice: {
            tone: 'info',
            title: t('No espere al último momento', 'Don’t wait until the last minute'),
            body: t(
              'Presente el I-539 antes de que venza su estadía; USCIS recomienda al menos 45 días antes. Mientras su solicitud a tiempo está pendiente puede seguir en EE.UU., pero no puede trabajar si su estatus no lo permite.',
              'File Form I-539 before your stay expires; USCIS recommends at least 45 days before. While a timely application is pending you may remain in the U.S., but you may not work unless your status allows it.',
            ),
          },
          options: [
            { value: 'extension', label: t('Una extensión de mi estadía en el mismo estatus', 'An extension of stay in my current status') },
            { value: 'change', label: t('Un cambio a otro estatus de no inmigrante', 'A change of status') },
            { value: 'reinstatement', label: t('La reinstalación de mi estatus de estudiante (F-1 o M-1)', 'Reinstatement to student status') },
          ],
        },
        {
          id: 'reinstatementNote',
          kind: 'choice',
          formRef: 'Part 2 · Item 1 · Reinstatement to student status',
          showIf: is('appType', 'reinstatement'),
          question: t('¿Ya habló con el consejero de estudiantes internacionales (DSO) de su escuela?', 'Have you talked to your school’s Designated School Official (DSO)?'),
          why: t('Para pedir la reinstalación necesita un I-20 nuevo que la recomiende.', 'To request reinstatement you need a new Form I-20 recommending it.'),
          notice: {
            tone: 'legal',
            title: t('Caso delicado', 'A sensitive case'),
            body: t(
              'La reinstalación es para estudiantes que perdieron su estatus por poco tiempo (normalmente menos de 5 meses) por razones fuera de su control, y que no trabajaron sin permiso. Si no es su caso, consulte a un abogado.',
              'Reinstatement is for students who fell out of status for a short time (usually under 5 months) for reasons beyond their control, and who did not work without authorization. If that is not your case, talk to an attorney.',
            ),
          },
          options: yesNo,
        },
        {
          id: 'changeTo',
          kind: 'fields',
          formRef: 'Part 2 · Item 2',
          showIf: is('appType', 'change'),
          question: t('¿A qué estatus quiere cambiar y desde cuándo?', 'Which status are you changing to, and from when?'),
          why: t('Algunos estatus (como F-1 o M-1) no le dejan empezar a estudiar hasta que USCIS apruebe el cambio.', 'Some statuses (such as F-1 or M-1) don’t let you start studying until USCIS approves the change.'),
          fields: [
            { id: 'newStatus', type: 'select', required: true, label: { es: 'Nuevo estatus', en: 'New status' }, formRef: 'Part 2 · Item 2 · I am requesting to change my status to', options: statusOptions(I539_NEW_STATUSES) },
            date('change.effective', 'Fecha en que quiere que empiece el cambio', 'Date the change should be effective', 'Part 2 · Item 2 · I am requesting the change to be effective', true, 'date'),
          ],
        },
        {
          id: 'coApplicants',
          kind: 'choice',
          formRef: 'Part 2 · Item 3 · Number of people included in this application',
          question: t('¿Quiénes van en esta solicitud?', 'Who is included in this application?'),
          why: t('Su esposo/a e hijos solteros menores de 21 pueden ir en la misma solicitud si tienen el mismo estatus o uno dependiente del suyo.', 'Your spouse and unmarried children under 21 may be included if they hold the same status as you or a status dependent on yours.'),
          options: [
            { value: 'alone', label: t('Solo yo', 'I am the only applicant') },
            { value: 'family', label: t('Yo y miembros de mi familia', 'Myself and members of my family') },
          ],
        },
        {
          id: 'people',
          kind: 'fields',
          formRef: 'Part 2 · Item 4',
          showIf: is('coApplicants', 'family'),
          question: t('¿Cuántas personas en total, contándose a usted?', 'How many people in total, including you?'),
          notice: {
            tone: 'info',
            title: t('Cada familiar necesita un I-539A', 'Each family member needs a Form I-539A'),
            body: t(
              'Por cada familiar incluido debe enviar un Formulario I-539A, con su firma y sus documentos. Puede llenarlo en esta app (I-539A en la lista de formularios), uno por familiar.',
              'For each family member included you must send a Form I-539A, with their signature and documents. You can fill it out in this app (I-539A in the list of forms), one per family member.',
            ),
          },
          fields: [{ id: 'peopleCount', type: 'number', required: true, label: { es: 'Número total de personas', en: 'Total number of people' }, formRef: 'Part 2 · Item 4 · The total number of people (including me)', placeholder: '3', maxLength: 2 }],
        },
        {
          id: 'school',
          kind: 'fields',
          formRef: 'Part 2 · Items 5–6',
          showIf: isStudentCase,
          question: t('Su escuela y su número SEVIS', 'Your school and SEVIS number'),
          why: t('Están en su Formulario I-20 o DS-2019.', 'They are on your Form I-20 or DS-2019.'),
          fields: [
            text('school.name', 'Nombre de la escuela', 'Name of the school', 'Part 2 · Item 5 · The name of the school you will attend', { maxLength: 80 }),
            { id: 'sevis', type: 'sevis', required: true, label: { es: 'Número SEVIS', en: 'SEVIS ID number' }, formRef: 'Part 2 · Item 6 · Student and Exchange Visitor Information System (SEVIS) ID Number', placeholder: 'N0012345678' },
          ],
        },
      ],
    },
    {
      id: 'processing',
      part: 'Part 3',
      title: t('Información del trámite', 'Processing information'),
      questions: [
        {
          id: 'extendUntil',
          kind: 'fields',
          formRef: 'Part 3 · Item 1',
          question: t('¿Hasta qué fecha quiere quedarse en este estatus?', 'Until what date do you want your status extended?'),
          why: t('Pida solo el tiempo que necesita y explíquelo en su carta. Los turistas B pueden recibir hasta 6 meses más.', 'Ask only for the time you need and explain it in your letter. B visitors may receive up to 6 more months.'),
          fields: [date('extend.until', 'Fecha', 'Date', 'Part 3 · Item 1 · I/We request that my/our current or requested status be extended until', true, 'futureDate')],
        },
        {
          id: 'relGranted',
          kind: 'choice',
          formRef: 'Part 3 · Item 2',
          question: t('¿Su solicitud depende de una extensión o cambio que YA le aprobaron a su esposo/a, hijo/a o padre/madre?', 'Is this application based on an extension or change of status already granted to your spouse, child, or parent?'),
          why: t('Por ejemplo, si es H-4 y a su esposo/a ya le aprobaron la extensión de su H-1B.', 'For example, if you are H-4 and your spouse’s H-1B extension was already approved.'),
          options: yesNo,
        },
        {
          id: 'relPetition',
          kind: 'choice',
          formRef: 'Part 3 · Item 3',
          question: t('¿Depende de otra petición o solicitud para que su esposo/a, hijo/a o padre/madre extienda o cambie su estatus?', 'Is this application based on a separate petition or application to provide your spouse, child, or parent an extension or change of status?'),
          options: [
            { value: 'A', label: t('Sí, se presenta junto con este I-539', 'Yes, filed with this Form I-539') },
            { value: 'B', label: t('Sí, se presentó antes y está pendiente en USCIS', 'Yes, filed previously and pending with USCIS') },
            { value: 'N', label: t('No', 'No') },
          ],
        },
        {
          id: 'relCase',
          kind: 'fields',
          formRef: 'Part 3 · Items 4–5',
          showIf: relatedCase,
          question: t('El caso de su familiar', 'Your family member’s case'),
          fields: [
            {
              id: 'relForm',
              type: 'select',
              required: true,
              label: { es: 'Tipo de formulario', en: 'Form type' },
              formRef: 'Part 3 · Item 4 · Form type',
              options: [
                { value: 'A', label: t('I-539 (extender o cambiar estatus)', 'Form I-539, Application to Extend/Change Nonimmigrant Status') },
                { value: 'B', label: t('I-129 (petición de trabajador, como H-1B o L-1)', 'Form I-129, Petition for a Nonimmigrant Worker') },
              ],
            },
            { id: 'rel.receipt', type: 'receipt', required: false, label: { es: 'Número de recibo de USCIS (si ya lo tiene)', en: 'USCIS receipt number (if you have it)' }, formRef: 'Part 3 · Item 5 · USCIS Receipt Number', placeholder: 'EAC2512345678' },
          ],
        },
        {
          id: 'relPending',
          kind: 'fields',
          formRef: 'Part 3 · Items 6–7',
          showIf: is('relPetition', 'B'),
          question: t('¿A nombre de quién está la petición pendiente y cuándo se presentó?', 'Whose petition or application is pending, and when was it filed?'),
          fields: [
            text('rel.given', 'Nombre del beneficiario o solicitante', 'First name of beneficiary or applicant', 'Part 3 · Item 6 · First Name of Beneficiary or Applicant'),
            text('rel.family', 'Apellido del beneficiario o solicitante', 'Last name of beneficiary or applicant', 'Part 3 · Item 6 · Last Name of Beneficiary or Applicant'),
            date('rel.filed', 'Fecha en que se presentó', 'Date filed', 'Part 3 · Item 7 · Date Filed'),
          ],
        },
      ],
    },
    {
      id: 'additional',
      part: 'Part 4',
      title: t('Más sobre usted', 'Additional information'),
      questions: [
        {
          id: 'passportChanged',
          kind: 'choice',
          formRef: 'Part 4 · Item 1 · Current Passport Information',
          question: t('¿Tiene ahora un pasaporte distinto al que usó para entrar?', 'Is your current passport different from the one you gave in Part 1?'),
          options: yesNo,
        },
        {
          id: 'newPassport',
          kind: 'fields',
          formRef: 'Part 4 · Item 1',
          showIf: is('passportChanged', 'yes'),
          question: t('Su pasaporte actual', 'Your current passport'),
          why: t('USCIS solo puede darle una extensión hasta la fecha en que vence su pasaporte, así que debe estar vigente.', 'USCIS can only extend your stay up to your passport’s expiration date, so it must be valid.'),
          fields: [
            text('newPassport.number', 'Número de pasaporte', 'Passport number', 'Part 4 · Item 1 · Passport Number', { maxLength: 30 }),
            text('newPassport.country', 'País que lo emitió', 'Country of passport issuance', 'Part 4 · Item 1 · Country of Passport Issuance'),
            date('newPassport.expires', 'Fecha de vencimiento', 'Passport expiration date', 'Part 4 · Item 1 · Passport Expiration Date', true, 'futureDate'),
          ],
        },
        {
          id: 'abroad',
          kind: 'fields',
          formRef: 'Part 4 · Item 2 · Physical Address Abroad',
          question: t('¿Cuál es su dirección en su país (fuera de EE.UU.)?', 'What is your physical address abroad?'),
          why: t('La casa a la que volverá. Si no tiene una, deje vacío.', 'The home you will return to. If you don’t have one, leave it empty.'),
          fields: [
            text('abroad.street', 'Número y calle', 'Street number and name', 'Part 4 · Item 2 · Street Number and Name', { required: false, maxLength: 34 }),
            { id: 'abroad.unit', type: 'unit', label: { es: 'Apartamento, suite o piso', en: 'Apt., suite or floor' }, formRef: 'Part 4 · Item 2 · Apt. Ste. Flr.' },
            text('abroad.city', 'Ciudad', 'City or town', 'Part 4 · Item 2 · City or Town', { required: false, maxLength: 34 }),
            text('abroad.province', 'Provincia o estado', 'Province', 'Part 4 · Item 2 · Province', { required: false, maxLength: 20 }),
            text('abroad.postal', 'Código postal', 'Postal code', 'Part 4 · Item 2 · Postal Code', { required: false, maxLength: 9 }),
            text('abroad.country', 'País', 'Country', 'Part 4 · Item 2 · Country', { required: false, maxLength: 41 }),
          ],
        },
        {
          id: 'immigrant',
          kind: 'yesNoList',
          formRef: 'Part 4 · Items 3–5',
          question: t('Otros trámites de inmigración', 'Other immigration filings'),
          why: t('Un Sí no le impide pedir la extensión, pero debe explicarlo. Ciertos estatus (como el B o el F) exigen que no tenga intención de inmigrar.', 'A Yes does not stop you from applying, but you must explain it. Some statuses (such as B or F) require that you not intend to immigrate.'),
          items: IMMIGRANT_ITEMS,
        },
        {
          id: 'background',
          kind: 'yesNoList',
          formRef: 'Part 4 · Items 6–13',
          question: t('Preguntas sobre antecedentes', 'Background questions'),
          why: t('Conteste con la verdad. Mentir en un formulario de USCIS es más grave que casi cualquier respuesta.', 'Answer truthfully. Lying on a USCIS form is more serious than almost any answer.'),
          notice: {
            tone: 'legal',
            title: t('Preguntas delicadas', 'Sensitive questions'),
            body: t(
              'Si contesta Sí a alguna (arrestos, violencia, grupos armados, violaciones de su estatus o un proceso de deportación), hable con un abogado de inmigración antes de presentar. Un Sí puede llevar a que nieguen la solicitud o a un proceso ante un juez.',
              'If you answer Yes to any of these (arrests, violence, armed groups, status violations or removal proceedings), talk to an immigration attorney before filing. A Yes can lead to a denial or to proceedings before a judge.',
            ),
          },
          items: BACKGROUND_ITEMS,
        },
        explain(
          'backgroundExplain',
          'background.explain',
          'Part 4 · Items 3–13 · Part 8. Additional Information',
          t('Explique cada Sí', 'Explain each Yes'),
          t('Para cada Sí: qué pasó, dónde y cuándo (en inglés)', 'For each Yes: what happened, where and when'),
          t('Para un arresto, adjunte los documentos de la policía y de la corte. Para una petición o I-485, ponga el tipo y el número de recibo.', 'For an arrest, attach the police and court records. For a petition or I-485, give the type and receipt number.'),
          { showIf: anyExplainedYes },
        ),
        {
          id: 'employed',
          kind: 'choice',
          formRef: 'Part 4 · Item 14',
          question: t('¿Ha trabajado en EE.UU. desde que entró o desde que le aprobaron su última extensión o cambio?', 'Have you EVER been employed in the United States since last admitted or granted an extension or change of status?'),
          why: t('Con cualquiera de las dos respuestas, USCIS pide una explicación.', 'Either way, USCIS asks for an explanation.'),
          options: yesNo,
        },
        explain(
          'employedExplain',
          'employed.explain',
          'Part 4 · Item 14 · Part 8. Additional Information',
          t('Describa cada trabajo', 'Describe each job'),
          t('Empleador, dirección, fechas, ingreso semanal y si USCIS lo autorizó (en inglés)', 'Employer, address, dates, weekly income and whether USCIS authorized it'),
          t('Ponga todos los trabajos desde su última entrada o aprobación. Si trabajó sin permiso, hable con un abogado antes de presentar.', 'List every job since you were last admitted or approved. If you worked without authorization, talk to an attorney before filing.'),
          { showIf: is('employed', 'yes') },
        ),
        explain(
          'supportExplain',
          'support.explain',
          'Part 4 · Item 14 · Part 8. Additional Information',
          t('¿Cómo se mantiene económicamente?', 'How are you supporting yourself?'),
          t('De dónde viene el dinero, cuánto y por qué lo recibe (en inglés)', 'Source, amount and basis of your income'),
          t('Por ejemplo: ahorros en su banco, ayuda de un familiar, una beca. Adjunte pruebas (estados de cuenta, carta de apoyo).', 'For example: savings in your bank, support from a relative, a scholarship. Attach evidence (bank statements, support letter).'),
          { showIf: is('employed', 'no') },
        ),
        {
          id: 'exchangeVisitor',
          kind: 'choice',
          formRef: 'Part 4 · Item 15',
          question: t('¿Es o ha sido ALGUNA VEZ visitante de intercambio J-1, o dependiente J-2?', 'Are you currently or have you EVER been a J-1 exchange visitor or a J-2 dependent of a J-1 exchange visitor?'),
          why: t('Algunos J-1 deben regresar 2 años a su país antes de cambiar a ciertos estatus.', 'Some J-1s must return home for 2 years before changing to certain statuses.'),
          options: yesNo,
        },
        explain(
          'exchangeExplain',
          'exchange.explain',
          'Part 4 · Item 15 · Part 8. Additional Information',
          t('¿Cuándo tuvo el estatus J-1 o J-2?', 'When did you hold J-1 or J-2 status?'),
          t('Fechas de inicio y fin de cada período (en inglés)', 'Start and end dates of each period'),
          t('Por ejemplo: J-1 from 06/01/2019 to 08/31/2020.', 'For example: J-1 from 06/01/2019 to 08/31/2020.'),
          { showIf: is('exchangeVisitor', 'yes') },
        ),
      ],
    },
    {
      id: 'contact',
      part: 'Part 5',
      title: t('Su contacto', 'Contact information'),
      questions: [
        {
          id: 'contactInfo',
          kind: 'fields',
          formRef: 'Part 5 · Items 1–3 · Applicant’s Contact Information',
          question: t('¿Cómo puede contactarle USCIS?', 'How can USCIS contact you?'),
          why: t('Usted firma la Parte 5, Ítem 4, a mano después de imprimir.', 'You sign Part 5, Item 4, by hand after printing.'),
          fields: [
            { id: 'phone', type: 'phone', required: true, label: { es: 'Teléfono de día', en: 'Daytime phone' }, formRef: 'Part 5 · Item 1 · Applicant’s Daytime Telephone Number', placeholder: '213 555 0123' },
            { id: 'mobile', type: 'phone', label: { es: 'Celular', en: 'Mobile phone' }, formRef: 'Part 5 · Item 2 · Applicant’s Mobile Telephone Number' },
            { id: 'email', type: 'email', label: { es: 'Correo electrónico', en: 'Email' }, formRef: 'Part 5 · Item 3 · Applicant’s Email Address' },
          ],
        },
        {
          id: 'readsEnglish',
          kind: 'choice',
          formRef: 'Part 5 · Applicant’s Certification',
          question: t('¿Puede leer y entender el formulario en inglés?', 'Can you read and understand the form in English?'),
          why: t('Si alguien le lee el formulario en su idioma, esa persona llena y firma la Parte 6.', 'If someone reads the form to you in your language, that person completes and signs Part 6.'),
          options: [
            { value: 'A', label: t('Sí, leo inglés', 'Yes, I read English') },
            { value: 'B', label: t('No, un intérprete me lo leyó', 'No, an interpreter read it to me') },
          ],
        },
        {
          id: 'preparer',
          kind: 'choice',
          formRef: 'Part 7 · Preparer',
          question: t('¿Alguien más le preparó este formulario?', 'Did someone else prepare this form for you?'),
          why: t('Por ejemplo un abogado, una organización o un familiar que llenó las respuestas. Esa persona llena y firma la Parte 7.', 'For example an attorney, an organization or a relative who filled in the answers. That person completes and signs Part 7.'),
          options: yesNo,
        },
      ],
    },
    assistanceWithoutAddresses,
  ],
};

