import type { Field, FormDefinition, YesNoItem } from './types';
import type { T } from '../i18n';
import { all, anyAddress, biographic, date, is, nameFields, rows, sexField, yesNo } from './helpers';

// Questions follow USCIS Form I-131, Application for Travel Documents, Parole Documents, and
// Arrival/Departure Records, edition 01/20/25. The app covers the requests a person inside the
// United States files for themself: reentry permit, refugee travel document, TPS travel
// authorization and advance parole. The PDF mapping lives in src/pdf/i131Pdf.ts.

export const I131_EDITION = '01/20/25';

const t = (es: string, en: string): T => ({ es, en });

const isReentry = is('appType', '1');
const isRefugee = is('appType', '2', '3');
const isAdvanceParole = is('appType', '5');
const needsI94 = is('appType', '4', '5');

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
    es: 'Pida permiso para viajar fuera de EE.UU. y regresar: advance parole, permiso de reingreso, documento de viaje de refugiado o de TPS.',
    en: 'Ask for permission to travel abroad and return: advance parole, reentry permit, refugee or TPS travel document.',
  },
  intro: {
    es: 'Con el I-131 pide un documento para salir de EE.UU. y volver. Si tiene un I-485 pendiente, no salga del país sin advance parole aprobado: su solicitud se puede dar por abandonada. Esta app cubre las solicitudes que una persona dentro de EE.UU. hace para sí misma; el parole desde fuera del país, el parole in place y el re-parole no están incluidos.',
    en: 'With Form I-131 you ask for a document to leave the U.S. and come back. If you have a pending I-485, don’t leave without approved advance parole: your application may be considered abandoned. This app covers requests a person inside the U.S. files for themself; parole from abroad, parole in place and re-parole aren’t included.',
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
      'Confirme en uscis.gov/i-131 que la edición {edition} sigue vigente y revise la tarifa; si cambió, use la nueva y copie sus respuestas de esta hoja.',
      'Adjunte dos fotos tipo pasaporte, copia de su identificación y la prueba de su base (recibo del I-485, aprobación de DACA o TPS, tarjeta de residente…).',
      'Imprima el PDF y firme la Parte 10, Ítem 4, a mano con tinta negra.',
      'Espere a tener el documento aprobado en la mano antes de salir del país.',
    ],
    en: [
      'Check at uscis.gov/i-131 that edition {edition} is still current and check the fee; if it changed, use the new one and copy your answers from this sheet.',
      'Attach two passport-style photos, a copy of your ID and proof of your basis (I-485 receipt, DACA or TPS approval, green card…).',
      'Print the PDF and sign Part 10, Item 4, by hand in black ink.',
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
      ],
    },
    {
      id: 'biographic',
      part: 'Part 3',
      title: t('Datos biográficos', 'Biographic information'),
      questions: biographic('Part 3'),
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
          why: t('Si tiene un caso en corte de inmigración, consulte a un abogado antes de viajar.', 'If you have a case in immigration court, talk to an attorney before traveling.'),
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
          question: t('¿Pide un reemplazo de un documento que ya le dieron?', 'Are you asking to replace a document you were already issued?'),
          options: yesNo,
        },
        {
          id: 'replacementReason',
          kind: 'choice',
          formRef: 'Part 4 · Item 5',
          showIf: is('replacement', 'yes'),
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
          showIf: all(is('replacement', 'yes'), is('replacementReason', '3', '4')),
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
          showIf: is('replacement', 'yes'),
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
      ],
    },
  ],
};

