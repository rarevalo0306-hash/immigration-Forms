import type { Answers, Field, FormDefinition, Option } from './types';
import type { T } from '../i18n';
import { all, anyAddress, date, is, nameFields, sexField, yesNo } from './helpers';
import { assistanceSection, usedInterpreter, usedPreparer } from './assistance';

// Questions follow USCIS Form I-131A, Application for Travel Document (Carrier Documentation),
// edition 01/20/25. The PDF mapping lives in src/pdf/i131aPdf.ts.
// Out of scope (left for hand): Part 4 signature and date (Item 6), the interpreter's and
// preparer's signatures and dates (Parts 5 and 6; the rest of those parts comes from the
// "Who helped you" section) and the "For USCIS Use Only" and attorney boxes at the top of page 1.
// The form has no box for the embassy or consulate: the applicant picks it when scheduling the
// in-person appointment, so it is covered in the intro and next steps only.

export const I131A_EDITION = '01/20/25';

const t = (es: string, en: string): T => ({ es, en });

const text = (id: string, es: string, en: string, formRef: string, opts: Partial<Field> = {}): Field => ({ id, type: 'text', required: true, label: { es, en }, formRef, ...opts });

/** Part 2, Item 1: the reason boxes, by the PDF's export values. */
export const REASONS: Option[] = [
  { value: 'PR lost', label: t('Mi green card se perdió, me la robaron o se destruyó', 'My previous Permanent Resident Card has been lost, stolen, or destroyed') },
  { value: 'NR', label: t('USCIS me envió la green card pero nunca la recibí', 'My previous Permanent Resident Card was issued but never received') },
  { value: 'Damaged', label: t('Mi green card está dañada', 'My existing Permanent Resident Card has been damaged') },
  { value: 'Expired', label: t('Mi green card ya venció', 'My existing Permanent Resident Card has already expired') },
  { value: 'AP Lost', label: t('Mi permiso de viaje (Advance Parole, I-512 o I-512L) se perdió, me lo robaron o se destruyó', 'My existing Form I-512/I-512L, Advance Parole Document, has been lost, stolen, or destroyed') },
  { value: 'AP Damage', label: t('Mi permiso de viaje (Advance Parole, I-512 o I-512L) está dañado', 'My existing Form I-512/I-512L, Advance Parole Document, has been damaged') },
  { value: 'EAD Lost', label: t('Mi permiso de trabajo (I-766) con autorización de viaje se perdió, me lo robaron o se destruyó', 'My existing Form I-766, EAD (with travel endorsement), has been lost, stolen, or destroyed') },
  { value: 'EAD Damage', label: t('Mi permiso de trabajo (I-766) con autorización de viaje está dañado', 'My existing Form I-766, EAD (with travel endorsement), has been damaged') },
  { value: 'Other', label: t('Otra razón', 'Other') },
];

const LPR_REASONS = ['PR lost', 'NR', 'Damaged', 'Expired'];
const PAROLE_REASONS = ['AP Lost', 'AP Damage', 'EAD Lost', 'EAD Damage'];

/** Whether the applicant is a permanent resident (Part 3, Items 3, 4, 8 and 9 apply). */
export const isLpr = (a: Answers) => LPR_REASONS.includes(String(a.reason ?? '')) || (a.reason === 'Other' && a.otherIsLpr === 'yes');
/** Whether the applicant holds an advance parole or EAD travel document (Items 5, 6 and 10 apply). */
export const isParole = (a: Answers) => PAROLE_REASONS.includes(String(a.reason ?? '')) || (a.reason === 'Other' && a.otherIsLpr === 'no');

const details = (id: string, es: string, en: string, formRef: string): Field => ({ id, type: 'longText', required: true, label: { es, en }, formRef, hint: t('En inglés si puede. Va en la Parte 7 (Información adicional).', 'In English if you can. It goes in Part 7 (Additional Information).') });

export const i131a: FormDefinition = {
  id: 'i-131a',
  number: 'I-131A',
  edition: I131A_EDITION,
  title: t('Documento para volver a EE.UU. (residentes en el extranjero)', 'Travel Document (Carrier Documentation)'),
  summary: {
    es: 'Para residentes permanentes que están fuera de EE.UU. y perdieron su green card (o se les dañó o venció), y necesitan un documento para que la aerolínea los deje abordar de regreso.',
    en: 'For permanent residents abroad whose green card was lost, stolen, destroyed, damaged or expired, who need a document so the airline lets them board back to the U.S.',
  },
  intro: {
    es: 'El I-131A le da un "documento de transporte" (carta o sello en el pasaporte) para que la aerolínea lo deje viajar de regreso a EE.UU. Sirve si es residente permanente y salió hace menos de 1 año (o menos de 2 con un permiso de reingreso vigente), o si perdió su permiso de viaje I-512 o I-766. Si lleva más tiempo fuera del permitido, este formulario no le sirve: normalmente necesita una visa de residente que regresa (SB-1) en el consulado; hable con un abogado. USCIS pide que el I-131A se presente en línea (con una cuenta de USCIS), con pago de la tarifa (actualmente $575; confírmela), y después debe ir en persona a una cita en la embajada o consulado de EE.UU. donde está. Revise todo en uscis.gov/i-131a. Use este PDF como borrador para copiar sus respuestas.',
    en: 'Form I-131A gets you a "carrier document" (a transportation letter or boarding foil) so the airline lets you travel back to the U.S. It is for permanent residents who left less than 1 year ago (or less than 2 with a valid reentry permit), or for people whose I-512 or I-766 travel document was lost. If you have been outside longer than allowed, this form does not help: you usually need a returning resident (SB-1) visa at the consulate; talk to an attorney. USCIS asks that Form I-131A be filed online (with a USCIS account), with the filing fee (currently $575; confirm it), and then you must attend an in-person appointment at the U.S. embassy or consulate where you are. Check everything at uscis.gov/i-131a. Use this PDF as a draft to copy your answers from.',
  },
  minutes: 15,
  pdf: {
    path: 'forms/i-131a.pdf',
    fileName: 'I-131A-filled.pdf',
    load: () => import('../pdf/i131aPdf').then((m) => m.fillI131A),
    signHere: { es: 'Parte 4, Ítem 6.a', en: 'Part 4, Item 6.a' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/i-131a que la edición {edition} sigue vigente, la tarifa actual (hoy $575) y cómo se presenta: USCIS pide hacerlo en línea con su cuenta de USCIS, copiando las respuestas de esta hoja.',
      'Después de presentar, haga su cita en persona en la embajada o consulado de EE.UU. del país donde está (USCIS le indica cómo). Lleve su pasaporte, dos fotos tipo pasaporte idénticas, el recibo de USCIS y las pruebas.',
      'Pruebas: copia de su green card (o del I-512/I-766) si la tiene, denuncia policial si se la robaron, su boleto o itinerario de regreso, y prueba de cuándo salió de EE.UU. (sellos del pasaporte, pase de abordar). Si cambió de nombre, adjunte el documento legal.',
      'Si lo hace en papel, imprima el PDF y firme la Parte 4, Ítem 6.a, a mano con tinta negra. Si un intérprete o preparador le ayudó, sus datos ya están en las Partes 5 y 6; ellos las revisan y las firman y fechan a mano.',
      'Al llegar a EE.UU., si perdió la green card, presente el I-90 para pedir una nueva. Si contestó Sí a procedimientos de deportación o abandono de residencia, hable con un abogado antes de viajar.',
    ],
    en: [
      'Check at uscis.gov/i-131a that edition {edition} is still current, the current fee (now $575) and how to file: USCIS asks that it be filed online with your USCIS account, copying the answers from this sheet.',
      'After filing, book your in-person appointment at the U.S. embassy or consulate in the country where you are (USCIS tells you how). Bring your passport, two identical passport-style photos, the USCIS receipt and your evidence.',
      'Evidence: a copy of your green card (or I-512/I-766) if you have one, a police report if it was stolen, your return ticket or itinerary, and proof of when you left the U.S. (passport stamps, boarding pass). If your name changed, attach the legal document.',
      'If filing on paper, print the PDF and sign Part 4, Item 6.a, by hand in black ink. If an interpreter or preparer helped you, their details are already in Parts 5 and 6; they check them and sign and date by hand.',
      'Once back in the U.S., if your green card was lost, file Form I-90 to replace it. If you answered Yes about removal proceedings or abandonment of residence, talk to an attorney before traveling.',
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
          formRef: 'Part 1 · Item 1 · Your Full Name',
          question: t('¿Cuál es su nombre completo?', 'What is your full name?'),
          notice: {
            tone: 'info',
            title: t('Antes de empezar', 'Before you start'),
            body: t(
              'Este formulario es para quien está fuera de EE.UU. Si salió hace más de 1 año (o más de 2 con permiso de reingreso), probablemente necesita una visa SB-1 en el consulado y no el I-131A.',
              'This form is for people outside the U.S. If you left more than 1 year ago (or more than 2 with a reentry permit), you probably need an SB-1 visa at the consulate, not Form I-131A.',
            ),
          },
          fields: nameFields('name', 'Part 1 · Item 1'),
        },
        {
          id: 'nameChanged',
          kind: 'choice',
          formRef: 'Part 1 · Item 2',
          question: t('¿Se cambió el nombre desde que recibió su última green card, I-512 o I-766?', 'Have you changed your name since receiving your last green card, I-512/I-512L or I-766?'),
          why: t('Si contesta Sí, adjunte el documento legal del cambio (acta de matrimonio, orden de un juez).', 'If Yes, attach evidence of your legal name change (marriage certificate, court order).'),
          options: yesNo,
        },
        {
          id: 'mailing',
          kind: 'fields',
          formRef: 'Part 1 · Item 3 · Current Mailing Address',
          question: t('¿A qué dirección le llega el correo ahora?', 'What is your current mailing address?'),
          why: t('Puede ser la dirección donde está en el extranjero.', 'It can be your address abroad.'),
          fields: anyAddress('mailing', 'Part 1 · Item 3', { careOf: true }),
        },
        {
          id: 'mailingSame',
          kind: 'choice',
          formRef: 'Part 1 · Item 4',
          question: t('¿Esa dirección es la misma donde vive en EE.UU.?', 'Is your current mailing address the same as your U.S. physical address?'),
          options: yesNo,
        },
        {
          id: 'home',
          kind: 'fields',
          formRef: 'Part 1 · Item 5 · U.S. Physical Address',
          showIf: is('mailingSame', 'no'),
          question: t('¿Dónde vive en EE.UU.?', 'What is your U.S. physical address?'),
          why: t('La dirección donde vivía antes de salir y a la que regresa.', 'The address where you lived before leaving and are returning to.'),
          fields: [
            text('home.street', 'Número y calle', 'Street number and name', 'Part 1 · Item 5.a', { maxLength: 34, placeholder: '1234 Main St' }),
            { id: 'home.unit', type: 'unit', label: { es: 'Apartamento, suite o piso', en: 'Apt., suite or floor' }, formRef: 'Part 1 · Item 5.b', placeholder: 'Apt 4B' },
            text('home.city', 'Ciudad', 'City or town', 'Part 1 · Item 5.c', { maxLength: 20 }),
            { id: 'home.state', type: 'state', required: true, label: { es: 'Estado', en: 'State' }, formRef: 'Part 1 · Item 5.d', placeholder: 'CA' },
            { id: 'home.zip', type: 'zip', required: true, label: { es: 'Código postal', en: 'ZIP code' }, formRef: 'Part 1 · Item 5.e' },
          ],
        },
        {
          id: 'ids',
          kind: 'fields',
          formRef: 'Part 1 · Items 6–8',
          question: t('Sus números', 'Your numbers'),
          why: t('El A-Number aparece en su green card (USCIS#).', 'The A-Number is on your green card (USCIS#).'),
          fields: [
            { id: 'aNumber', type: 'aNumber', label: { es: 'A-Number (si tiene)', en: 'A-Number (if any)' }, formRef: 'Part 1 · Item 6' },
            { id: 'uscisAccount', type: 'uscisAccount', label: { es: 'Cuenta en línea de USCIS (si tiene)', en: 'USCIS online account number (if any)' }, formRef: 'Part 1 · Item 7' },
            { id: 'ssn', type: 'ssn', label: { es: 'Seguro Social (si tiene)', en: 'U.S. Social Security number (if any)' }, formRef: 'Part 1 · Item 8' },
          ],
        },
        {
          id: 'personal',
          kind: 'fields',
          formRef: 'Part 1 · Items 9–12',
          question: t('Fecha y país de nacimiento', 'Date and country of birth'),
          fields: [
            date('dob', 'Fecha de nacimiento', 'Date of birth', 'Part 1 · Item 9'),
            sexField('sex', 'Part 1 · Item 10'),
            text('birthCountry', 'País de nacimiento', 'Country of birth', 'Part 1 · Item 11', { placeholder: 'Mexico' }),
            text('citizenship', 'País de ciudadanía o nacionalidad', 'Country of citizenship or nationality', 'Part 1 · Item 12', { placeholder: 'Mexico' }),
          ],
        },
      ],
    },
    {
      id: 'reasonSection',
      part: 'Part 2',
      title: t('Por qué lo pide', 'Reason for application'),
      questions: [
        {
          id: 'reason',
          kind: 'choice',
          formRef: 'Part 2 · Item 1',
          question: t('¿Por qué necesita el documento? Elija solo una.', 'Why do you need the document? Select only one.'),
          options: REASONS,
        },
        {
          id: 'reasonOther',
          kind: 'fields',
          formRef: 'Part 2 · Item 1.i',
          showIf: is('reason', 'Other'),
          question: t('Explique su razón', 'Explain your reason'),
          fields: [{ id: 'reason.other', type: 'longText', required: true, label: { es: 'Razón (en inglés)', en: 'Reason' }, formRef: 'Part 2 · Item 1.i', hint: t('Si no cabe en la línea, la app la pasa a la Parte 7.', 'If it does not fit on the line, the app moves it to Part 7.') }],
        },
        {
          id: 'otherIsLpr',
          kind: 'choice',
          formRef: 'Part 3 · Items 3–10',
          showIf: is('reason', 'Other'),
          question: t('¿Es usted residente permanente (tiene green card)?', 'Are you a lawful permanent resident?'),
          why: t('Así sabemos qué preguntas de la Parte 3 le tocan.', 'This tells us which Part 3 questions apply to you.'),
          options: yesNo,
        },
      ],
    },
    {
      id: 'processing',
      part: 'Part 3',
      title: t('Su viaje y sus documentos', 'Your trip and documents'),
      questions: [
        {
          id: 'travel',
          kind: 'fields',
          formRef: 'Part 3 · Items 1–2',
          question: t('¿Cuándo salió de EE.UU. y cuándo piensa regresar?', 'When did you leave the U.S. and when do you plan to return?'),
          notice: {
            tone: 'info',
            title: t('Tiempo fuera', 'Time abroad'),
            body: t(
              'Si para la fecha de regreso lleva más de 1 año fuera (o su permiso de reingreso ya venció), USCIS puede negar esto; consulte con un abogado sobre la visa SB-1.',
              'If by your return date you will have been away more than 1 year (or your reentry permit has expired), USCIS may deny this; ask an attorney about the SB-1 visa.',
            ),
          },
          fields: [
            date('departed', 'Fecha en que salió de EE.UU.', 'Date you departed the United States', 'Part 3 · Item 1'),
            date('returnDate', 'Fecha en que piensa viajar a EE.UU.', 'Date of intended travel to the United States', 'Part 3 · Item 2', true, 'date'),
          ],
        },
        {
          id: 'lprDocs',
          kind: 'fields',
          formRef: 'Part 3 · Items 3–4',
          showIf: isLpr,
          question: t('Vencimiento de su green card', 'Your green card expiration'),
          why: t('Está en el frente de la tarjeta ("Card expires"). Si no la recuerda, ponga la fecha aproximada.', 'It is on the front of the card ("Card expires"). If you do not remember, give an approximate date.'),
          fields: [
            date('cardExpires', 'Fecha de vencimiento de la green card', 'Expiration date of your Permanent Resident Card', 'Part 3 · Item 3', true, 'date'),
            date('reentryExpires', 'Vencimiento del permiso de reingreso (si tiene)', 'Expiration date of your reentry permit (if any)', 'Part 3 · Item 4', false, 'date'),
          ],
        },
        {
          id: 'paroleDocs',
          kind: 'fields',
          formRef: 'Part 3 · Items 5–6',
          showIf: isParole,
          question: t('Su permiso de viaje I-512 o I-766', 'Your I-512 or I-766 travel document'),
          fields: [
            date('travelDocExpires', 'Fecha de vencimiento del I-512, I-512L o I-766', 'Expiration date of your Form I-512, I-512L or I-766', 'Part 3 · Item 5', true, 'date'),
            { id: 'i131.receipt', type: 'receipt', label: { es: 'Número de recibo del I-131 con el que lo obtuvo (si lo tiene)', en: 'Receipt number of the Form I-131 for that document (if any)' }, formRef: 'Part 3 · Item 6', placeholder: 'IOE0912345678' },
          ],
        },
        {
          id: 'proceedings',
          kind: 'choice',
          formRef: 'Part 3 · Item 7',
          question: t('¿Está ahora, o estuvo alguna vez, en un proceso de exclusión, deportación, expulsión o rescisión?', 'Are you NOW, or were you EVER, in exclusion, deportation, removal, or rescission proceedings?'),
          notice: {
            tone: 'legal',
            title: t('Pregunta delicada', 'Sensitive question'),
            body: t(
              'Conteste con la verdad: mentir a USCIS tiene consecuencias graves. Si alguna vez tuvo un caso en corte de inmigración o una orden de deportación, hable con un abogado antes de presentar y antes de viajar.',
              'Answer truthfully: lying to USCIS has serious consequences. If you ever had an immigration court case or a removal order, talk to an attorney before filing and before traveling.',
            ),
          },
          options: yesNo,
        },
        {
          id: 'proceedingsExplain',
          kind: 'fields',
          formRef: 'Part 3 · Item 7 · Part 7. Additional Information',
          showIf: is('proceedings', 'yes'),
          question: t('Cuéntenos del proceso', 'Tell us about the proceedings'),
          fields: [details('proceedings.details', 'Qué tipo de proceso, dónde, cuándo y cómo terminó', 'Type of proceedings, where, when and the outcome', 'Part 3 · Item 7')],
        },
        {
          id: 'abandoned',
          kind: 'choice',
          formRef: 'Part 3 · Item 8',
          showIf: isLpr,
          question: t('¿Alguna vez presentó el I-407 (renuncia a la residencia) o le dijeron que abandonó su residencia?', 'Have you EVER filed Form I-407, Record of Abandonment of Lawful Permanent Resident Status, or otherwise been judged to have abandoned your status?'),
          notice: {
            tone: 'legal',
            title: t('Abandono de la residencia', 'Abandonment of residence'),
            body: t('Si firmó un I-407 o un funcionario decidió que abandonó su residencia, consulte con un abogado antes de seguir.', 'If you signed Form I-407 or an officer decided you abandoned your residence, talk to an attorney before going on.'),
          },
          options: yesNo,
        },
        {
          id: 'abandonedExplain',
          kind: 'fields',
          formRef: 'Part 3 · Item 8 · Part 7. Additional Information',
          showIf: all(isLpr, is('abandoned', 'yes')),
          question: t('Explique qué pasó', 'Explain what happened'),
          fields: [details('abandoned.details', 'Cuándo y dónde, y qué pasó', 'When and where, and what happened', 'Part 3 · Item 8')],
        },
        {
          id: 'carrierBefore',
          kind: 'choice',
          formRef: 'Part 3 · Item 9.a',
          showIf: isLpr,
          question: t('¿Alguna vez le dieron un documento de transporte (carrier document) antes?', 'Have you EVER been issued a Carrier Document?'),
          options: yesNo,
        },
        {
          id: 'carrierDetails',
          kind: 'fields',
          formRef: 'Part 3 · Items 9.b–9.c',
          showIf: all(isLpr, is('carrierBefore', 'yes')),
          question: t('El último documento de transporte que recibió', 'The last carrier document you received'),
          fields: [
            date('carrier.date', 'Fecha en que se lo dieron', 'Date issued', 'Part 3 · Item 9.b'),
            text('carrier.disposition', '¿Qué pasó con él? (adjunto, perdido…)', 'Disposition (attached, lost, etc.)', 'Part 3 · Item 9.c', { maxLength: 40, placeholder: 'Used for travel in 2023' }),
            details('carrier.details', 'Detalles: por qué lo necesitó y cómo lo usó', 'Details: why you needed it and how you used it', 'Part 3 · Item 9.a'),
          ],
        },
        {
          id: 'revoked',
          kind: 'choice',
          formRef: 'Part 3 · Item 10.a',
          showIf: isParole,
          question: t('¿Alguna vez le revocaron (cancelaron) un I-512, I-512L o I-766?', 'Was your Form I-512/I-512L or I-766 ever revoked?'),
          options: yesNo,
        },
        {
          id: 'revokedDetails',
          kind: 'fields',
          formRef: 'Part 3 · Items 10.b–10.c',
          showIf: all(isParole, is('revoked', 'yes')),
          question: t('La revocación del último documento', 'The revocation of the last document'),
          fields: [
            date('revoked.date', 'Fecha de la revocación', 'Date of revocation', 'Part 3 · Item 10.b'),
            text('revoked.reason', 'Razón de la revocación (en inglés)', 'Reason for revocation', 'Part 3 · Item 10.c', { maxLength: 45 }),
            details('revoked.details', 'Detalles', 'Details', 'Part 3 · Item 10.a'),
          ],
        },
      ],
    },
    {
      id: 'contact',
      part: 'Part 4',
      title: t('Declaración y contacto', 'Statement and contact'),
      questions: [
        {
          id: 'readsEnglish',
          kind: 'choice',
          formRef: 'Part 4 · Item 1',
          question: t('¿Puede leer y entender el formulario en inglés?', 'Can you read and understand the form in English?'),
          options: [
            { value: 'A', label: t('Sí, leo inglés', 'Yes, I read English') },
            { value: 'B', label: t('No, un intérprete me lo leerá', 'No, an interpreter will read it to me') },
          ],
        },
        { id: 'interpreterLanguage', kind: 'fields', formRef: 'Part 4 · Item 1.b', showIf: is('readsEnglish', 'B'), question: t('¿En qué idioma?', 'In what language?'), fields: [text('fluentLanguage', 'Idioma', 'Language', 'Part 4 · Item 1.b', { placeholder: 'Spanish' })] },
        { id: 'preparer', kind: 'choice', formRef: 'Part 4 · Item 2', question: t('¿Alguien más preparó esta solicitud?', 'Did someone else prepare this application?'), options: yesNo },
        { id: 'preparerName', kind: 'fields', formRef: 'Part 4 · Item 2', showIf: is('preparer', 'yes'), question: t('¿Quién la preparó?', 'Who prepared it?'), fields: [text('preparer.name', 'Nombre del preparador', 'Preparer’s name', 'Part 4 · Item 2')] },
        {
          id: 'contactInfo',
          kind: 'fields',
          formRef: 'Part 4 · Items 3–5',
          question: t('¿Cómo puede contactarle USCIS?', 'How can USCIS contact you?'),
          why: t('Puede ser un teléfono del país donde está, con código de país. La casilla del formulario tiene 10 dígitos; si el número es más largo, la app lo escribe completo en la Parte 7.', 'It can be a phone in the country where you are, with the country code. The form box holds 10 digits; if the number is longer, the app writes it in full in Part 7.'),
          fields: [
            { id: 'phone', type: 'text', required: true, label: { es: 'Teléfono de día', en: 'Daytime phone' }, formRef: 'Part 4 · Item 3', placeholder: '+52 33 1234 5678', maxLength: 20 },
            { id: 'mobile', type: 'text', label: { es: 'Celular (si tiene)', en: 'Mobile phone (if any)' }, formRef: 'Part 4 · Item 4', maxLength: 20 },
            { id: 'email', type: 'email', label: { es: 'Correo electrónico (si tiene)', en: 'Email (if any)' }, formRef: 'Part 4 · Item 5' },
          ],
        },
      ],
    },
    assistanceSection({ usedInterpreter, usedPreparer, interpreterPart: 'Part 5', preparerPart: 'Part 6' }),
  ],
};
