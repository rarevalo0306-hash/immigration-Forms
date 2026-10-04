import type { Field, FormDefinition, Question } from './types';
import type { T } from '../i18n';
import { all, date, is, nameFields, yesNo } from './helpers';
import { assistanceSection, usedInterpreter, usedPreparer } from './assistance';

// Questions follow USCIS Form N-336, Request for a Hearing on a Decision in Naturalization
// Proceedings Under Section 336, edition 04/01/24. The PDF mapping lives in src/pdf/n336Pdf.ts.
// Answer ids match the N-400's (src/forms/n400.ts) where they mean the same thing.
// The interpreter's Part 6 and the preparer's Part 7 are filled from the shared questions in
// src/forms/assistance.ts when Part 5 says an interpreter or preparer helped.
// Out of scope, left for hand: the attorney box at the top of page 1 (G-28, bar number), all
// signatures and their dates (Part 5, Item 6; Part 6, Item 7; Part 7, Item 8), and the
// "For USCIS Use Only" box.

export const N336_EDITION = '04/01/24';

/** The reasons statement fits Part 4 and the four Part 8 blocks with room to spare. */
export const N336_REASONS_MAX = 5000;

const t = (es: string, en: string): T => ({ es, en });

const text = (id: string, es: string, en: string, formRef: string, opts: Partial<Field> = {}): Field => ({ id, type: 'text', required: true, label: { es, en }, formRef, ...opts });

/** A U.S. address with the county box this form adds. */
const usAddress = (prefix: string, ref: string, careOf = false): Field[] => [
  ...(careOf ? [text(`${prefix}.careOf`, 'A cargo de (si recibe correo en casa de otra persona)', 'In care of', `${ref} · In Care Of Name`, { required: false, maxLength: 34 })] : []),
  text(`${prefix}.street`, 'Número y calle', 'Street number and name', `${ref} · Street Number and Name`, { maxLength: 25, placeholder: '1234 Main St' }),
  { id: `${prefix}.unit`, type: 'unit', label: t('Apartamento, suite o piso', 'Apt., suite or floor'), formRef: `${ref} · Apt. Ste. Flr. Number`, placeholder: 'Apt 4B' },
  text(`${prefix}.city`, 'Ciudad', 'City or town', `${ref} · City or Town`, { maxLength: 20 }),
  text(`${prefix}.county`, 'Condado', 'County', `${ref} · County`, { required: false, placeholder: 'Los Angeles' }),
  { id: `${prefix}.state`, type: 'state', required: true, label: t('Estado', 'State'), formRef: `${ref} · State`, placeholder: 'CA' },
  { id: `${prefix}.zip`, type: 'zip', required: true, label: t('Código postal (ZIP)', 'ZIP code'), formRef: `${ref} · ZIP Code` },
];

const deadline: Question['notice'] = {
  tone: 'legal',
  title: t('Tiene solo 30 días', 'You only have 30 days'),
  body: t(
    'Debe presentar el N-336 dentro de los 30 días después de recibir la carta que negó su N-400 (33 días si la carta le llegó por correo). Si se pasa del plazo, USCIS normalmente lo rechaza. Esto no es asesoría legal: si puede, hable con un abogado de inmigración o un representante acreditado (DOJ) antes de presentar.',
    'You must file Form N-336 within 30 days after you receive the letter denying your N-400 (33 days if the letter was mailed to you). If you miss the deadline, USCIS usually rejects it. This is not legal advice: if you can, talk to an immigration attorney or a DOJ-accredited representative before you file.',
  ),
};

export const n336: FormDefinition = {
  id: 'n-336',
  number: 'N-336',
  edition: N336_EDITION,
  title: t('Audiencia sobre la negación de su ciudadanía', 'Request for a Hearing on a Decision in Naturalization Proceedings'),
  summary: {
    es: 'Pida que otro oficial de USCIS revise su caso si le negaron el N-400 (la solicitud de ciudadanía).',
    en: 'Ask another USCIS officer to review your case if your N-400 (citizenship application) was denied.',
  },
  intro: {
    es: 'Con el N-336 pide una audiencia para que un oficial distinto revise la decisión que negó su N-400. Tenga a mano la carta de negación (Form N-335): ahí están el número de recibo, la fecha, la oficina y la razón. Le preguntaremos por sus datos, por esa decisión y por qué cree que está equivocada.',
    en: 'With Form N-336 you ask for a hearing so a different officer reviews the decision that denied your N-400. Have the denial letter (Form N-335) at hand: it shows the receipt number, the date, the office and the reason. We’ll ask about you, that decision and why you believe it is wrong.',
  },
  minutes: 25,
  pdf: {
    path: 'forms/n-336.pdf',
    fileName: 'N-336-filled.pdf',
    load: () => import('../pdf/n336Pdf').then((m) => m.fillN336),
    signHere: t('Parte 5, Ítem 6', 'Part 5, Item 6'),
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/n-336 que la edición {edition} sigue vigente y dónde se presenta (en línea o por correo).',
      'Preséntelo a tiempo: 30 días desde que recibió la carta de negación (33 si le llegó por correo). Cuenta la fecha en que USCIS lo recibe, no la fecha en que lo envía.',
      'Revise la tarifa actual en uscis.gov/g-1055. Si presentó el N-400 por servicio militar, no paga tarifa. Si no puede pagar, puede adjuntar el I-912.',
      'Adjunte una copia de la carta de negación y las pruebas o el escrito (brief) que tenga. Si no los tiene listos, puede llevarlos a la audiencia.',
      'Imprima el PDF y firme la Parte 5, Ítem 6, a mano con tinta negra. Si un intérprete o preparador le ayudó, revise sus datos en las Partes 6 y 7: ellos firman y ponen la fecha a mano. Si tiene abogado, adjunte su Formulario G-28.',
      'Guarde una copia completa de todo lo que envía.',
    ],
    en: [
      'Check at uscis.gov/n-336 that edition {edition} is still current and where to file (online or by mail).',
      'File on time: 30 days from when you received the denial letter (33 if it was mailed to you). What counts is the date USCIS receives it, not the date you send it.',
      'Check the current fee at uscis.gov/g-1055. If you filed your N-400 based on military service, there is no fee. If you cannot pay, you can attach Form I-912.',
      'Attach a copy of the denial letter and any evidence or brief you have. If they are not ready, you can bring them to the hearing.',
      'Print the PDF and sign Part 5, Item 6, by hand in black ink. If an interpreter or preparer helped you, check their details in Parts 6 and 7: they sign and date by hand. If you have an attorney, attach their Form G-28.',
      'Keep a full copy of everything you send.',
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
          formRef: 'Part 1 · Item 1 · Current Legal Name',
          question: t('¿Cuál es su nombre legal actual?', 'What is your current legal name?'),
          why: t('Como lo puso en su N-400. No use apodos.', 'As you wrote it on your N-400. Don’t use a nickname.'),
          notice: deadline,
          fields: nameFields('name', 'Part 1 · Item 1'),
        },
        {
          id: 'hasOtherNames',
          kind: 'choice',
          formRef: 'Part 1 · Item 2 · Other Names Used',
          question: t('¿Ha usado otros nombres?', 'Have you used any other names?'),
          why: t('Por ejemplo, su apellido de soltera, apodos o alias.', 'For example, your maiden name, nicknames or aliases.'),
          options: yesNo,
        },
        {
          id: 'otherName1',
          kind: 'fields',
          formRef: 'Part 1 · Item 2 · Other Names Used',
          showIf: is('hasOtherNames', 'yes'),
          question: t('¿Qué otro nombre ha usado?', 'What other name have you used?'),
          fields: nameFields('otherName1', 'Part 1 · Item 2 (line 1)'),
        },
        {
          id: 'hasOtherNames2',
          kind: 'choice',
          formRef: 'Part 1 · Item 2 · Other Names Used',
          showIf: is('hasOtherNames', 'yes'),
          question: t('¿Ha usado otro nombre más?', 'Have you used another name?'),
          options: yesNo,
        },
        {
          id: 'otherName2',
          kind: 'fields',
          formRef: 'Part 1 · Item 2 · Other Names Used',
          showIf: all(is('hasOtherNames', 'yes'), is('hasOtherNames2', 'yes')),
          question: t('¿Qué otro nombre ha usado?', 'What other name have you used?'),
          why: t('Si usó más de dos, escriba los demás a mano en la Parte 8.', 'If you used more than two, write the rest by hand in Part 8.'),
          fields: nameFields('otherName2', 'Part 1 · Item 2 (line 2)'),
        },
        {
          id: 'ids',
          kind: 'fields',
          formRef: 'Part 1 · A-Number, Items 3–4',
          question: t('Sus números y fecha de nacimiento', 'Your numbers and date of birth'),
          why: t('El A-Number está en su green card ("USCIS#") y en la carta de negación.', 'The A-Number is on your green card ("USCIS#") and on the denial letter.'),
          fields: [
            { id: 'aNumber', type: 'aNumber', required: true, label: t('A-Number', 'A-Number'), formRef: 'Part 1 · Your 9 Digit A-Number', placeholder: 'A123456789' },
            date('dob', 'Fecha de nacimiento', 'Date of birth', 'Part 1 · Item 3 · Date of Birth'),
            { id: 'uscisAccount', type: 'uscisAccount', label: t('Cuenta en línea de USCIS (si tiene)', 'USCIS online account number (if any)'), formRef: 'Part 1 · Item 4 · USCIS Online Account Number' },
          ],
        },
        {
          id: 'home',
          kind: 'fields',
          formRef: 'Part 1 · Item 5 · Physical Address',
          question: t('¿Dónde vive ahora?', 'Where do you live now?'),
          why: t('No ponga un apartado postal (PO Box) aquí, salvo que sea su única dirección.', 'Don’t use a PO Box here unless it is your only address.'),
          fields: usAddress('home', 'Part 1 · Item 5'),
        },
        {
          id: 'mailingSame',
          kind: 'choice',
          formRef: 'Part 1 · Item 6 · Mailing Address',
          question: t('¿Recibe su correo en la dirección donde vive?', 'Do you get your mail where you live?'),
          why: t('USCIS le enviará ahí la cita de la audiencia y la decisión.', 'USCIS will send the hearing appointment and the decision there.'),
          options: yesNo,
        },
        {
          id: 'mailing',
          kind: 'fields',
          formRef: 'Part 1 · Item 6 · Mailing Address',
          showIf: is('mailingSame', 'no'),
          question: t('¿A qué dirección le llega el correo?', 'Where do you get your mail?'),
          fields: usAddress('mailing', 'Part 1 · Item 6', true),
        },
        {
          id: 'otherPhones',
          kind: 'fields',
          formRef: 'Part 1 · Item 7 · Contact Information',
          question: t('¿Tiene teléfono del trabajo o de la noche?', 'Do you have a work or evening phone?'),
          why: t('Ambos son opcionales. Su teléfono de día y su celular se piden al final.', 'Both are optional. Your daytime phone and mobile are asked at the end.'),
          fields: [
            { id: 'workPhone', type: 'phone', label: t('Teléfono del trabajo', 'Work phone'), formRef: 'Part 1 · Item 7.A · Work Telephone Number' },
            { id: 'eveningPhone', type: 'phone', label: t('Teléfono de la noche', 'Evening phone'), formRef: 'Part 1 · Item 7.B · Evening Telephone Number' },
          ],
        },
      ],
    },
    {
      id: 'denial',
      part: 'Part 2',
      title: t('La negación de su N-400', 'Your N-400 denial'),
      questions: [
        {
          id: 'denialInfo',
          kind: 'fields',
          formRef: 'Part 2 · Items 1–3 · Information About Form N-400 Denial',
          question: t('¿Qué dice la carta que negó su N-400?', 'What does the letter denying your N-400 say?'),
          why: t('El número de recibo está arriba a la izquierda del aviso de recibo del N-400 y en la carta de negación.', 'The receipt number is in the upper left corner of your N-400 receipt notice and on the denial letter.'),
          notice: {
            tone: 'info',
            title: t('Cuente los días', 'Count the days'),
            body: t(
              'Tiene 30 días desde que recibió la carta (33 si llegó por correo). Si ya pasó el plazo, USCIS puede tratarlo como una moción para reabrir o reconsiderar, pero solo si cumple esos requisitos: consulte a un abogado.',
              'You have 30 days from when you received the letter (33 if it was mailed). If the deadline has passed, USCIS may treat it as a motion to reopen or reconsider, but only if it meets those requirements: ask an attorney.',
            ),
          },
          fields: [
            { id: 'n400.receipt', type: 'receipt', required: true, label: t('Número de recibo del N-400', 'Form N-400 receipt number'), formRef: 'Part 2 · Item 1 · Form N-400 Receipt Number', placeholder: 'IOE0123456789', maxLength: 13 },
            date('n400.denialDate', 'Fecha de la carta de negación', 'Date of the denial notice', 'Part 2 · Item 2 · Date of Form N-400 Denial Notice'),
            text('n400.office', 'Oficina de USCIS que envió la carta', 'USCIS office that issued the denial', 'Part 2 · Item 3 · USCIS Office That Issued Form N-400 Denial Notice', { placeholder: 'Los Angeles Field Office' }),
          ],
        },
        {
          id: 'n400.military',
          kind: 'choice',
          formRef: 'Part 2 · Item 4 · Did you file your Form N-400 on the basis of qualifying military service?',
          question: t('¿Presentó su N-400 por servicio militar?', 'Did you file your N-400 based on qualifying military service?'),
          why: t('Es decir, si en la Parte 1 del N-400 eligió servicio militar. En ese caso no paga la tarifa del N-336.', 'That is, if you chose military service in Part 1 of the N-400. If so, there is no N-336 fee.'),
          options: yesNo,
        },
      ],
    },
    {
      id: 'biographic',
      part: 'Part 3',
      title: t('Datos biográficos', 'Biographic information'),
      questions: [
        {
          id: 'ethnicity',
          kind: 'choice',
          formRef: 'Part 3 · Item 1 · Ethnicity',
          question: t('¿Es usted hispano/a o latino/a?', 'Are you Hispanic or Latino?'),
          options: [
            { value: 'hispanic', label: t('Hispano/a o latino/a', 'Hispanic or Latino') },
            { value: 'notHispanic', label: t('No hispano/a ni latino/a', 'Not Hispanic or Latino') },
          ],
        },
        {
          id: 'race',
          kind: 'choice',
          multiple: true,
          formRef: 'Part 3 · Item 2 · Race (select all applicable boxes)',
          question: t('¿Cuál es su raza?', 'What is your race?'),
          why: t('Elija todas las que apliquen.', 'Choose all that apply.'),
          options: [
            { value: 'indian', label: t('Indígena americano/a o nativo/a de Alaska', 'American Indian or Alaska Native') },
            { value: 'asian', label: t('Asiático/a', 'Asian') },
            { value: 'black', label: t('Negro/a o afroamericano/a', 'Black or African American') },
            { value: 'pacific', label: t('Nativo/a de Hawái u otras islas del Pacífico', 'Native Hawaiian or Other Pacific Islander') },
            { value: 'white', label: t('Blanco/a', 'White') },
          ],
        },
        {
          id: 'body',
          kind: 'fields',
          formRef: 'Part 3 · Items 3–4 · Height and Weight',
          question: t('¿Cuánto mide y cuánto pesa?', 'How tall are you and how much do you weigh?'),
          why: t('En pies, pulgadas y libras. 1.60 m son 5 pies 3 pulgadas; 70 kg son 154 libras.', 'In feet, inches and pounds.'),
          fields: [
            { id: 'heightFeet', type: 'select', required: true, label: t('Pies', 'Feet'), formRef: 'Part 3 · Item 3 · Height (Feet)', options: ['2', '3', '4', '5', '6', '7', '8'].map((v) => ({ value: v, label: { es: v, en: v } })) },
            { id: 'heightInches', type: 'select', required: true, label: t('Pulgadas', 'Inches'), formRef: 'Part 3 · Item 3 · Height (Inches)', options: [...Array(12)].map((_, i) => ({ value: String(i), label: { es: String(i), en: String(i) } })) },
            { id: 'weight', type: 'number', required: true, label: t('Peso en libras', 'Weight in pounds'), formRef: 'Part 3 · Item 4 · Weight (Pounds)', maxLength: 3, placeholder: '154' },
          ],
        },
        {
          id: 'eyes',
          kind: 'choice',
          formRef: 'Part 3 · Item 5 · Eye Color',
          question: t('¿De qué color son sus ojos?', 'What color are your eyes?'),
          options: [
            { value: 'BRO', label: t('Café', 'Brown') },
            { value: 'BLK', label: t('Negro', 'Black') },
            { value: 'HAZ', label: t('Avellana (hazel)', 'Hazel') },
            { value: 'GRN', label: t('Verde', 'Green') },
            { value: 'BLU', label: t('Azul', 'Blue') },
            { value: 'GRY', label: t('Gris', 'Gray') },
            { value: 'MAR', label: t('Granate', 'Maroon') },
            { value: 'PNK', label: t('Rosado', 'Pink') },
            { value: 'XXX', label: t('Desconocido u otro', 'Unknown / Other') },
          ],
        },
        {
          id: 'hair',
          kind: 'choice',
          formRef: 'Part 3 · Item 6 · Hair Color',
          question: t('¿De qué color es su cabello?', 'What color is your hair?'),
          options: [
            { value: 'BLK', label: t('Negro', 'Black') },
            { value: 'BRO', label: t('Café', 'Brown') },
            { value: 'BLN', label: t('Rubio', 'Blond') },
            { value: 'GRY', label: t('Gris', 'Gray') },
            { value: 'WHI', label: t('Blanco', 'White') },
            { value: 'RED', label: t('Rojo', 'Red') },
            { value: 'SDY', label: t('Rubio rojizo (sandy)', 'Sandy') },
            { value: 'BAL', label: t('Calvo/a (sin cabello)', 'Bald (no hair)') },
            { value: 'XXX', label: t('Desconocido u otro', 'Unknown / Other') },
          ],
        },
      ],
    },
    {
      id: 'reasons',
      part: 'Part 4',
      title: t('Por qué pide la audiencia', 'Why you are asking for a hearing'),
      questions: [
        {
          id: 'denialReasonQ',
          kind: 'fields',
          formRef: 'Part 4 · Reason You Are Requesting a Hearing',
          question: t('¿Por qué razón le negaron el N-400?', 'Why was your N-400 denied?'),
          why: t('Copie en inglés la razón que da la carta de negación, por ejemplo "failed the English reading test twice" o "lack of good moral character".', 'Copy, in English, the reason the denial letter gives, for example "failed the English reading test twice" or "lack of good moral character".'),
          notice: {
            tone: 'legal',
            title: t('Esto es un caso legal', 'This is a legal case'),
            body: t(
              'En la audiencia se decide si usted puede ser ciudadano/a. Si la negación tuvo que ver con arrestos, delitos, impuestos, viajes largos, fraude o una orden de deportación, hable con un abogado de inmigración o un representante acreditado (DOJ) antes de presentar: lo que escriba aquí lo leerá el oficial.',
              'The hearing decides whether you can become a citizen. If the denial involved arrests, crimes, taxes, long trips, fraud or a removal order, talk to an immigration attorney or a DOJ-accredited representative before you file: the officer will read what you write here.',
            ),
          },
          fields: [{ id: 'n400.denialReason', type: 'longText', required: true, label: t('Razón de la negación (en inglés)', 'Reason for the denial'), formRef: 'Part 4', maxLength: 1000 }],
        },
        {
          id: 'reasonsQ',
          kind: 'fields',
          formRef: 'Part 4 · Reason You Are Requesting a Hearing',
          question: t('¿Por qué cree que la decisión está equivocada?', 'Why do you believe the decision is wrong?'),
          why: t(
            'Escriba en inglés, con hechos y fechas. Explique qué no tomó en cuenta el oficial y qué pruebas lo demuestran (por ejemplo, que ya pagó los impuestos, que sus viajes fueron más cortos, o que ahora puede leer y hablar inglés). Lo que no quepa en la Parte 4 sigue en la Parte 8.',
            'Write in English, with facts and dates. Explain what the officer did not take into account and what evidence shows it (for example, that you already paid the taxes, that your trips were shorter, or that you can now read and speak English). Whatever doesn’t fit in Part 4 continues in Part 8.',
          ),
          fields: [{ id: 'hearing.reasons', type: 'longText', required: true, label: t('Sus razones (en inglés)', 'Your reasons'), formRef: 'Part 4', maxLength: N336_REASONS_MAX }],
        },
        {
          id: 'brief',
          kind: 'choice',
          formRef: 'Part 4 · Supporting documents or brief',
          question: t('¿Va a enviar pruebas o un escrito (brief) que apoyen su pedido?', 'Will you submit evidence or a brief supporting your request?'),
          why: t('Puede enviarlos junto con el N-336 o llevarlos el día de la audiencia. Lo diremos al final de la Parte 4.', 'You can send them with Form N-336 or bring them on the day of the hearing. We’ll say so at the end of Part 4.'),
          options: [
            { value: 'attached', label: t('Sí, los adjunto a este formulario', 'Yes, I am attaching them to this form') },
            { value: 'hearing', label: t('Sí, los llevaré a la audiencia', 'Yes, I will bring them to the hearing') },
            { value: 'none', label: t('No', 'No') },
          ],
        },
        {
          id: 'briefListQ',
          kind: 'fields',
          formRef: 'Part 4 · Supporting documents',
          showIf: is('brief', 'attached'),
          question: t('¿Qué documentos adjunta?', 'Which documents are you attaching?'),
          fields: [{ id: 'brief.list', type: 'longText', label: t('Lista de documentos (en inglés)', 'List of documents'), formRef: 'Part 4', placeholder: 'Copy of the denial notice; 2023 and 2024 IRS tax transcripts', maxLength: 600 }],
        },
      ],
    },
    {
      id: 'statement',
      part: 'Part 5',
      title: t('Declaración y contacto', 'Statement and contact'),
      questions: [
        {
          id: 'readsEnglish',
          kind: 'choice',
          formRef: 'Part 5 · Item 1 · Statement Regarding the Interpreter',
          question: t('¿Puede leer y entender el formulario en inglés?', 'Can you read and understand the form in English?'),
          options: [
            { value: 'A', label: t('Sí, leo inglés', 'Yes, I read English') },
            { value: 'B', label: t('No, un intérprete me lo leerá', 'No, an interpreter will read it to me') },
          ],
        },
        {
          id: 'interpreterLanguage',
          kind: 'fields',
          formRef: 'Part 5 · Item 1.B',
          showIf: is('readsEnglish', 'B'),
          question: t('¿En qué idioma se lo leerán?', 'What language will it be read in?'),
          why: t('Los datos del intérprete van en la Parte 6; él o ella la firma a mano.', 'The interpreter’s details go in Part 6; they sign it by hand.'),
          fields: [{ id: 'fluentLanguage', type: 'text', required: true, label: t('Idioma', 'Language'), formRef: 'Part 5 · Item 1.B', placeholder: 'Spanish', maxLength: 30 }],
        },
        {
          id: 'preparer',
          kind: 'choice',
          formRef: 'Part 5 · Item 2 · Statement Regarding the Preparer',
          question: t('¿Alguien más (no usted) preparó esta solicitud?', 'Did someone else prepare this request for you?'),
          why: t('Si es así, sus datos van en la Parte 7 y esa persona la firma a mano.', 'If so, their details go in Part 7 and that person signs it by hand.'),
          options: yesNo,
        },
        {
          id: 'preparerName',
          kind: 'fields',
          formRef: 'Part 5 · Item 2',
          showIf: is('preparer', 'yes'),
          question: t('¿Quién la preparó?', 'Who prepared it?'),
          fields: [{ id: 'preparer.name', type: 'text', required: true, label: t('Nombre del preparador', 'Preparer’s name'), formRef: 'Part 5 · Item 2', maxLength: 60 }],
        },
        {
          id: 'contactInfo',
          kind: 'fields',
          formRef: 'Part 5 · Items 3–5 · Naturalization Applicant’s Contact Information',
          question: t('¿Cómo puede contactarle USCIS?', 'How can USCIS contact you?'),
          fields: [
            { id: 'phone', type: 'phone', required: true, label: t('Teléfono de día', 'Daytime phone'), formRef: 'Part 5 · Item 3', placeholder: '213 555 0123' },
            { id: 'mobile', type: 'phone', label: t('Celular', 'Mobile phone'), formRef: 'Part 5 · Item 4' },
            { id: 'email', type: 'email', label: t('Correo electrónico', 'Email'), formRef: 'Part 5 · Item 5' },
          ],
        },
      ],
    },
    assistanceSection({ usedInterpreter, usedPreparer, interpreterPart: 'Part 6', preparerPart: 'Part 7' }),
  ],
};
