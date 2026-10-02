import type { Field, FormDefinition } from './types';
import type { T } from '../i18n';
import { date, is, nameFields, rows, yesNo } from './helpers';

// Questions follow USCIS Form I-102, Application for Replacement/Initial Nonimmigrant
// Arrival-Departure Document, edition 04/01/24. The PDF mapping lives in src/pdf/i102Pdf.ts.
// Out of scope (written by hand or left blank): the attorney box (G-28) at the top of page 1,
// the signature and date (Part 4, Item 4), Part 5 (interpreter) and Part 6 (preparer).

export const I102_EDITION = '04/01/24';

const t = (es: string, en: string): T => ({ es, en });

const text = (id: string, es: string, en: string, formRef: string, opts: Partial<Field> = {}): Field => ({ id, type: 'text', required: true, label: { es, en }, formRef, ...opts });

/** A U.S. address: this form asks only for U.S. addresses. */
const usAddress = (prefix: string, ref: string, items: string): Field[] => [
  text(`${prefix}.careOf`, 'A cargo de (si recibe correo en casa de otra persona)', 'In care of', `${ref} · Item ${items}.a · In Care Of Name`, { required: false, maxLength: 34 }),
  text(`${prefix}.street`, 'Número y calle', 'Street number and name', `${ref} · Item ${items}.b · Street Number and Name`, { maxLength: 34, placeholder: '1234 Main St' }),
  { id: `${prefix}.unit`, type: 'unit', label: { es: 'Apartamento, suite o piso', en: 'Apt., suite or floor' }, formRef: `${ref} · Item ${items}.c · Apt. Ste. Flr.`, placeholder: 'Apt 4B' },
  text(`${prefix}.city`, 'Ciudad', 'City or town', `${ref} · Item ${items}.d · City or Town`, { maxLength: 20 }),
  { id: `${prefix}.state`, type: 'state', required: true, label: { es: 'Estado', en: 'State' }, formRef: `${ref} · Item ${items}.e · State`, placeholder: 'CA' },
  { id: `${prefix}.zip`, type: 'zip', required: true, label: { es: 'Código postal', en: 'ZIP code' }, formRef: `${ref} · Item ${items}.f · ZIP Code` },
];

/** Part 2, Item 1: the reasons, by the letter of their item (1.a-1.g). */
export const REASONS: { value: string; label: T }[] = [
  { value: 'a', label: t('Perdí mi I-94 o I-94W, o me lo robaron', 'My Form I-94 or I-94W was lost or stolen') },
  { value: 'b', label: t('Perdí mi I-95 (permiso de tripulante), o me lo robaron', 'My Form I-95 (crewman’s landing permit) was lost or stolen') },
  { value: 'c', label: t('Mi I-94 o I-94W está dañado (adjunto el original)', 'My Form I-94 or I-94W was mutilated (I attach the original)') },
  { value: 'd', label: t('Mi I-95 está dañado (adjunto el original)', 'My Form I-95 was mutilated (I attach the original)') },
  { value: 'e', label: t('No me dieron I-94 cuando CBP me admitió en un puerto de entrada', 'I was not issued a Form I-94 when CBP admitted me at a port of entry') },
  { value: 'f', label: t('USCIS me dio un I-94 con un error y quiero que lo corrija (adjunto el original)', 'USCIS issued my I-94 with an error and I want it corrected (I attach the original)') },
  { value: 'g', label: t('Entré como militar no inmigrante y no me dieron I-94: pido el primero', 'I entered as a nonimmigrant member of the military without an I-94 and want an initial one') },
];

export const i102: FormDefinition = {
  id: 'i-102',
  number: 'I-102',
  edition: I102_EDITION,
  title: t('Solicitud de reemplazo o primer registro de llegada y salida (I-94)', 'Application for Replacement/Initial Nonimmigrant Arrival-Departure Document'),
  summary: {
    es: 'Pida un I-94 nuevo si el suyo se perdió, se lo robaron, se dañó, nunca se lo dieron o USCIS lo emitió con un error.',
    en: 'Ask for a new I-94 if yours was lost, stolen or damaged, was never issued, or was issued by USCIS with an error.',
  },
  intro: {
    es: 'Antes de llenar este formulario, busque su I-94 en i94.cbp.dhs.gov. Si entró por avión o barco desde 2013, su I-94 es electrónico y casi siempre puede imprimirlo gratis ahí; este formulario tiene costo. Use el I-102 solo si está en EE.UU. y no aparece en ese sitio, si su I-94 de papel se perdió o se dañó, o si USCIS se lo dio con un error. Si el error lo cometió CBP al entrar, vaya a una oficina de Inspección Diferida (Deferred Inspection) de CBP en lugar de usar este formulario.',
    en: 'Before filling out this form, look up your I-94 at i94.cbp.dhs.gov. If you entered by air or sea since 2013, your I-94 is electronic and you can usually print it there for free; this form has a fee. Use Form I-102 only if you are in the U.S. and your record is not on that site, your paper I-94 was lost or damaged, or USCIS issued it with an error. If CBP made the mistake when you entered, go to a CBP Deferred Inspection office instead of using this form.',
  },
  minutes: 15,
  pdf: {
    path: 'forms/i-102.pdf',
    fileName: 'I-102-filled.pdf',
    load: () => import('../pdf/i102Pdf').then((m) => m.fillI102),
    signHere: { es: 'Parte 4, Ítem 4', en: 'Part 4, Item 4' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/i-102 que la edición {edition} sigue vigente, y revise la tarifa y a qué dirección enviarlo.',
      'Antes de enviar, vuelva a buscar su I-94 en i94.cbp.dhs.gov: si aparece, imprímalo gratis y no necesita este formulario.',
      'Adjunte una copia de la página de datos de su pasaporte y de su visa, una copia del I-94 si la tiene, el reporte de policía si se lo robaron, el I-94 original si está dañado o tiene un error, y pruebas de su cambio de nombre si el nombre del I-94 es distinto.',
      'Imprima el PDF y firme la Parte 4, Ítem 4, a mano con tinta negra. Si un intérprete o preparador le ayudó, ellos llenan y firman a mano las Partes 5 y 6.',
      'Si lo presenta junto con otra solicitud (por ejemplo el I-539 o el I-129), envíelos juntos a la dirección de esa otra solicitud.',
    ],
    en: [
      'Check at uscis.gov/i-102 that edition {edition} is still current, and check the fee and where to mail it.',
      'Before mailing, search for your I-94 again at i94.cbp.dhs.gov: if it shows up, print it for free and you do not need this form.',
      'Attach a copy of your passport biographic page and visa, a copy of the I-94 if you have one, the police report if it was stolen, the original I-94 if it is mutilated or has an error, and evidence of your name change if the name on the I-94 is different.',
      'Print the PDF and sign Part 4, Item 4, by hand in black ink. If an interpreter or preparer helped you, they complete and sign Parts 5 and 6 by hand.',
      'If you file it with another application (for example Form I-539 or I-129), send them together to that application’s filing address.',
    ],
  },
  sections: [
    {
      id: 'reason',
      part: 'Part 2',
      title: t('Por qué lo pide', 'Reason for application'),
      questions: [
        {
          id: 'reason',
          kind: 'choice',
          formRef: 'Part 2 · Item 1 · Reason for Application',
          question: t('¿Por qué necesita un I-94 nuevo?', 'Why do you need a new I-94?'),
          why: t('Elija solo una opción.', 'Select only one.'),
          notice: {
            tone: 'info',
            title: t('Primero revise i94.cbp.dhs.gov', 'First check i94.cbp.dhs.gov'),
            body: t(
              'Si entró por avión o barco, su I-94 casi siempre está en i94.cbp.dhs.gov y puede imprimirlo gratis. Si CBP escribió mal algún dato al entrar, la corrección la hace CBP (Deferred Inspection), no USCIS. Este formulario corrige solo los I-94 que emitió USCIS, por ejemplo con una extensión o cambio de estatus.',
              'If you entered by air or sea, your I-94 is almost always at i94.cbp.dhs.gov and you can print it for free. If CBP got something wrong when you entered, CBP fixes it (Deferred Inspection), not USCIS. This form corrects only I-94s issued by USCIS, for example with an extension or change of status.',
            ),
          },
          options: REASONS,
        },
        {
          id: 'reasonExplain',
          kind: 'fields',
          formRef: 'Part 2 · Item 1.f · Explanation',
          showIf: is('reason', 'f'),
          question: t('¿Cuál es el error en su I-94?', 'What is the error on your I-94?'),
          why: t('Diga qué dato está mal y cuál es el correcto. Adjunte el I-94 original y la prueba del dato correcto (pasaporte, aviso de aprobación).', 'Say which item is wrong and what it should say. Attach the original I-94 and proof of the correct information (passport, approval notice).'),
          fields: [{ id: 'reason.explain', type: 'longText', required: true, label: { es: 'El error y el dato correcto (en inglés)', en: 'The error and the correct information' }, formRef: 'Part 2 · Item 1.f', placeholder: 'My date of birth appears as 03/15/1990; it should be 05/13/1990.' }],
        },
      ],
    },
    {
      id: 'about',
      part: 'Part 1',
      title: t('Sus datos', 'About you'),
      questions: [
        {
          id: 'name',
          kind: 'fields',
          formRef: 'Part 1 · Items 1–3',
          question: t('¿Cuál es su nombre completo?', 'What is your full legal name?'),
          fields: [
            ...nameFields('name', 'Part 1 · Item 3'),
            { id: 'aNumber', type: 'aNumber', label: { es: 'A-Number (si tiene)', en: 'A-Number (if any)' }, formRef: 'Part 1 · Item 1' },
            { id: 'uscisAccount', type: 'uscisAccount', label: { es: 'Cuenta en línea de USCIS (si tiene)', en: 'USCIS online account (if any)' }, formRef: 'Part 1 · Item 2' },
          ],
        },
        { id: 'otherName.more0', kind: 'choice', formRef: 'Part 1 · Item 4 · Other Names Used', question: t('¿Ha usado otros nombres (de soltera, apodos, alias)?', 'Have you used other names (maiden name, nicknames, aliases)?'), options: yesNo },
        ...rows({
          max: 3,
          id: 'otherName',
          first: is('otherName.more0', 'yes'),
          question: (i) => (i === 1 ? t('Otro nombre que ha usado', 'Another name you have used') : t('Otro nombre más', 'One more name')),
          why: (i) => (i === 2 ? t('El formulario tiene espacio para uno; los demás van en la Parte 7.', 'The form has room for one; the rest go in Part 7.') : undefined),
          more: t('¿Ha usado otro nombre más?', 'Have you used another name?'),
          formRef: 'Part 1 · Item 4',
          fields: (i) => nameFields(`otherName${i}`, i === 1 ? 'Part 1 · Item 4' : 'Part 7 · Additional Information'),
          overflow: t('Si son más de 3, escríbalos a mano en la Parte 7.', 'If there are more than 3, write them by hand in Part 7.'),
        }),
        {
          id: 'mailing',
          kind: 'fields',
          formRef: 'Part 1 · Item 5 · U.S. Mailing Address',
          question: t('¿A qué dirección en EE.UU. le llega el correo?', 'What is your U.S. mailing address?'),
          why: t('Ahí le enviarán el I-94 nuevo.', 'Your new I-94 will be mailed there.'),
          fields: usAddress('mailing', 'Part 1', '5'),
        },
        { id: 'mailingSame', kind: 'choice', formRef: 'Part 1 · Item 6', question: t('¿Vive en esa misma dirección?', 'Do you live at that same address?'), options: yesNo },
        { id: 'home', kind: 'fields', formRef: 'Part 1 · Item 7 · U.S. Physical Address', showIf: is('mailingSame', 'no'), question: t('¿Dónde vive?', 'Where do you live?'), fields: usAddress('home', 'Part 1', '7') },
        {
          id: 'birth',
          kind: 'fields',
          formRef: 'Part 1 · Items 8–11',
          question: t('Su nacimiento y ciudadanía', 'Your birth and citizenship'),
          why: t('Escriba los países en inglés si puede (Mexico, Guatemala, El Salvador).', 'Write the countries in English if you can (Mexico, Guatemala, El Salvador).'),
          fields: [
            date('dob', 'Fecha de nacimiento', 'Date of birth', 'Part 1 · Item 8'),
            text('birthCountry', 'País de nacimiento', 'Country of birth', 'Part 1 · Item 9', { placeholder: 'Mexico' }),
            text('citizenship', 'País de ciudadanía', 'Country of citizenship', 'Part 1 · Item 10', { placeholder: 'Mexico' }),
            { id: 'ssn', type: 'ssn', label: { es: 'Seguro Social (si tiene)', en: 'U.S. Social Security number (if any)' }, formRef: 'Part 1 · Item 11' },
          ],
        },
      ],
    },
    {
      id: 'entry',
      part: 'Part 1',
      title: t('Su última entrada y su I-94', 'Your last entry and your I-94'),
      questions: [
        {
          id: 'lastEntry',
          kind: 'fields',
          formRef: 'Part 1 · Items 12–14 · Entry Information',
          question: t('¿Cuándo y por dónde entró a EE.UU. la última vez?', 'When and where did you last enter the United States?'),
          fields: [
            date('lastEntry.date', 'Fecha de la última entrada', 'Date of last entry', 'Part 1 · Item 12'),
            text('lastEntry.place', 'Ciudad del puerto de entrada', 'City of the port of entry', 'Part 1 · Item 13 · City', { placeholder: 'San Ysidro' }),
            { id: 'lastEntry.state', type: 'state', required: true, label: { es: 'Estado', en: 'State' }, formRef: 'Part 1 · Item 13 · State', placeholder: 'CA' },
            text('entry.class', 'Clase de admisión (como aparece en su visa o sello)', 'Class of admission', 'Part 1 · Item 14', { placeholder: 'B2', hint: t('Por ejemplo: B2 (turista), F1 (estudiante), H2A (trabajador agrícola), TN.', 'For example: B2 (visitor), F1 (student), H2A (agricultural worker), TN.') }),
          ],
        },
        {
          id: 'portType',
          kind: 'choice',
          formRef: 'Part 1 · Item 15',
          question: t('¿Por qué tipo de puerto entró esa vez?', 'What type of port of entry did you last enter through?'),
          options: [
            { value: 'land', label: t('Frontera por tierra', 'Land border') },
            { value: 'air', label: t('Aeropuerto', 'Airport') },
            { value: 'sea', label: t('Puerto marítimo', 'Seaport') },
          ],
        },
        {
          id: 'statusNow',
          kind: 'fields',
          formRef: 'Part 1 · Items 16–17',
          question: t('¿Cuál es su estatus de no inmigrante actual?', 'What is your current nonimmigrant status?'),
          why: t('Si USCIS le aprobó una extensión o cambio de estatus, use el de esa aprobación. Si no, el de su entrada.', 'If USCIS approved an extension or change of status, use that one. Otherwise, the one you entered with.'),
          fields: [
            text('status.current', 'Estatus actual (en inglés)', 'Current nonimmigrant status', 'Part 1 · Item 16', { placeholder: 'B-2 visitor' }),
            { id: 'status.expires', type: 'text', label: { es: 'Fecha en que vence (o "D/S")', en: 'Date status expires (or "D/S")' }, formRef: 'Part 1 · Item 17', placeholder: 'MM/DD/AAAA', hint: t('"D/S" (duración del estatus) es común para estudiantes F-1 y J-1.', '"D/S" (duration of status) is common for F-1 and J-1 students.') },
          ],
        },
        {
          id: 'i94',
          kind: 'fields',
          formRef: 'Part 1 · Item 18 · Travel Documents',
          question: t('Su I-94 y su pasaporte', 'Your I-94 and passport'),
          why: t('El número I-94 (11 caracteres) está en el I-94 anterior o en i94.cbp.dhs.gov. Si nunca tuvo I-94 o no lo sabe, déjelo vacío.', 'The I-94 number (11 characters) is on your old I-94 or at i94.cbp.dhs.gov. If you never had one or don’t know it, leave it empty.'),
          fields: [
            { id: 'i94.number', type: 'i94', label: { es: 'Número del I-94, I-94W o I-95 (si lo sabe)', en: 'Form I-94, I-94W or I-95 number (if known)' }, formRef: 'Part 1 · Item 18.a' },
            text('passport.number', 'Número de pasaporte', 'Passport number', 'Part 1 · Item 18.b', { required: false, maxLength: 30 }),
            text('travelDoc.number', 'Número de documento de viaje (si no usó pasaporte)', 'Travel document number (if no passport)', 'Part 1 · Item 18.c', { required: false, maxLength: 30 }),
            text('passport.country', 'País que emitió el pasaporte o documento', 'Country of issuance', 'Part 1 · Item 18.d', { required: false, placeholder: 'Mexico' }),
            date('passport.expires', 'Fecha de vencimiento del pasaporte o documento', 'Passport or travel document expiration date', 'Part 1 · Item 18.e', false, 'date'),
          ],
        },
        {
          id: 'i94SameName',
          kind: 'choice',
          formRef: 'Part 1 · Item 19',
          question: t('¿Su nombre en el I-94 es igual a su nombre legal actual?', 'Is the name on your I-94 the same as your current legal name?'),
          why: t('Si cambió (por ejemplo al casarse), adjunte la prueba del cambio de nombre.', 'If it changed (for example by marriage), attach evidence of the name change.'),
          options: yesNo,
        },
        {
          id: 'i94Name',
          kind: 'fields',
          formRef: 'Part 1 · Item 19 · Name as it appears on Form I-94',
          showIf: is('i94SameName', 'no'),
          question: t('¿Cómo aparece su nombre en el I-94?', 'How does your name appear on the I-94?'),
          fields: nameFields('i94', 'Part 1 · Item 19'),
        },
      ],
    },
    {
      id: 'processing',
      part: 'Part 3',
      title: t('Información del trámite', 'Processing information'),
      questions: [
        {
          id: 'otherFiling',
          kind: 'choice',
          formRef: 'Part 3 · Item 1.a',
          question: t('¿Presenta esta solicitud junto con otra petición o solicitud?', 'Are you filing this application with any other petition or application?'),
          why: t('Por ejemplo un I-539 (extender o cambiar estatus) o un I-129 que su empleador presenta por usted.', 'For example Form I-539 (extend or change status) or Form I-129 filed by your employer for you.'),
          options: yesNo,
        },
        {
          id: 'otherFilingForm',
          kind: 'fields',
          formRef: 'Part 3 · Item 1.b',
          showIf: is('otherFiling', 'yes'),
          question: t('¿Qué formulario presenta junto con este?', 'Which form are you filing with it?'),
          fields: [text('otherFiling.form', 'Número y nombre del formulario (en inglés)', 'USCIS form number and name', 'Part 3 · Item 1.b', { placeholder: 'I-539, Application to Extend/Change Nonimmigrant Status' })],
        },
        {
          id: 'removal',
          kind: 'choice',
          formRef: 'Part 3 · Item 2.a',
          question: t('¿Está ahora en un proceso de deportación (en corte de inmigración)?', 'Are you now in removal proceedings?'),
          notice: {
            tone: 'legal',
            title: t('Caso en corte de inmigración', 'Immigration court case'),
            body: t(
              'Conteste con la verdad. Si tiene un caso abierto en corte de inmigración o una orden de deportación, hable con un abogado de inmigración antes de presentar este formulario.',
              'Answer truthfully. If you have an open immigration court case or a removal order, talk to an immigration attorney before filing this form.',
            ),
          },
          options: yesNo,
        },
        {
          id: 'removalDetails',
          kind: 'fields',
          formRef: 'Part 3 · Item 2.b',
          showIf: is('removal', 'yes'),
          question: t('Cuéntenos sobre su proceso', 'Tell us about the proceedings'),
          why: t('Diga en qué corte está, desde cuándo, la fecha de su próxima audiencia y en qué etapa va. Si no cabe, sigue en la Parte 7.', 'Give the court, when it started, your next hearing date and where the case stands. If it doesn’t fit, it continues in Part 7.'),
          fields: [{ id: 'removal.explain', type: 'longText', required: true, label: { es: 'Detalles del proceso (en inglés)', en: 'Details of the proceedings' }, formRef: 'Part 3 · Item 2.b', placeholder: 'Immigration Court, Los Angeles, CA. Next hearing 03/10/2027.' }],
        },
      ],
    },
    {
      id: 'statement',
      part: 'Part 4',
      title: t('Declaración y contacto', 'Statement and contact'),
      questions: [
        {
          id: 'contactInfo',
          kind: 'fields',
          formRef: 'Part 4 · Items 1–3 · Applicant’s Contact Information',
          question: t('¿Cómo puede contactarle USCIS?', 'How can USCIS contact you?'),
          notice: {
            tone: 'info',
            title: t('Lo que firma', 'What you sign'),
            body: t(
              'Al firmar la Parte 4 declara, bajo pena de perjurio, que sus respuestas son verdaderas y completas, y autoriza a USCIS a usar la información de sus expedientes. Si alguien le interpretó o preparó el formulario, esa persona llena y firma a mano la Parte 5 o la 6.',
              'By signing Part 4 you certify, under penalty of perjury, that your answers are true and complete, and you authorize USCIS to use information from your records. If someone interpreted or prepared the form for you, that person completes and signs Part 5 or 6 by hand.',
            ),
          },
          fields: [
            { id: 'phone', type: 'phone', required: true, label: { es: 'Teléfono de día', en: 'Daytime phone' }, formRef: 'Part 4 · Item 1', placeholder: '213 555 0123' },
            { id: 'mobile', type: 'phone', label: { es: 'Celular', en: 'Mobile phone' }, formRef: 'Part 4 · Item 2' },
            { id: 'email', type: 'email', label: { es: 'Correo electrónico', en: 'Email' }, formRef: 'Part 4 · Item 3' },
          ],
        },
      ],
    },
  ],
};
