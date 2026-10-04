import type { Answers, Field, FormDefinition, Option } from './types';
import type { T } from '../i18n';
import { all, biographic, date, is, nameFields, rows, sexField, yesNo } from './helpers';
import { assistanceSection, usedInterpreter, usedPreparer } from './assistance';

// Questions follow USCIS Form I-212, Application for Permission to Reapply for Admission into the
// United States After Deportation or Removal, edition 01/20/25. The PDF mapping lives in
// src/pdf/i212Pdf.ts.
//
// Out of scope (left for hand or for the attorney):
// - Part 5 (Additional Information if Filing with CBP: ten years of addresses, five years of
//   employment, parents and marriages). Only people filing at a port of entry with CBP fill it.
// - Every signature and date, and the attorney box on page 1.
// Part 6 has no statement boxes, so the app asks whether an interpreter or preparer helped (the
// standard readsEnglish / preparer questions) to decide whether to fill Parts 7 and 8 from the
// shared assistance section.

export const I212_EDITION = '01/20/25';

const t = (es: string, en: string): T => ({ es, en });

const text = (id: string, es: string, en: string, formRef: string, opts: Partial<Field> = {}): Field => ({ id, type: 'text', required: true, label: { es, en }, formRef, ...opts });

/** An address in the U.S. or abroad, sized to this PDF (its street boxes hold 25 characters). */
const address = (prefix: string, ref: string, careOf = false): Field[] => [
  ...(careOf ? [text(`${prefix}.careOf`, 'A cargo de (si recibe correo en casa de otra persona)', 'In care of', `${ref} · In Care Of Name`, { required: false, maxLength: 34 })] : []),
  text(`${prefix}.street`, 'Número y calle', 'Street number and name', `${ref} · Street Number and Name`, { maxLength: 25, placeholder: '1234 Main St' }),
  { id: `${prefix}.unit`, type: 'unit', label: { es: 'Apartamento, suite o piso', en: 'Apt., suite or floor' }, formRef: `${ref} · Apt. Ste. Flr.`, placeholder: 'Apt 4B' },
  text(`${prefix}.city`, 'Ciudad', 'City or town', `${ref} · City or Town`, { maxLength: 20 }),
  { id: `${prefix}.state`, type: 'state', label: { es: 'Estado (si es en EE.UU.)', en: 'State (if in the U.S.)' }, formRef: `${ref} · State`, placeholder: 'CA' },
  { id: `${prefix}.zip`, type: 'zip', label: { es: 'Código postal ZIP (si es en EE.UU.)', en: 'ZIP code (if in the U.S.)' }, formRef: `${ref} · ZIP Code` },
  text(`${prefix}.province`, 'Provincia o estado (fuera de EE.UU.)', 'Province (outside the U.S.)', `${ref} · Province`, { required: false, maxLength: 20 }),
  text(`${prefix}.postal`, 'Código postal (fuera de EE.UU.)', 'Postal code (outside the U.S.)', `${ref} · Postal Code`, { required: false, maxLength: 9 }),
  text(`${prefix}.country`, 'País', 'Country', `${ref} · Country`, { placeholder: 'Mexico' }),
];

/** A place inside the U.S.: a city and a state. */
const place = (prefix: string, ref: string, items: [string, string], es: string, en: string): Field[] => [
  text(`${prefix}.city`, `${es}: ciudad`, `${en}: city or town`, `${ref} · Item ${items[0]}`, { maxLength: 20, placeholder: 'Laredo' }),
  { id: `${prefix}.state`, type: 'state', required: true, label: { es: `${es}: estado`, en: `${en}: state` }, formRef: `${ref} · Item ${items[1]}`, placeholder: 'TX' },
];

const COUNT: Option[] = [
  { value: 'once', label: t('Una sola vez', 'Only once') },
  { value: 'more', label: t('Dos veces o más', 'Two or more times') },
];

/** How each removal or departure happened, for the removal history in Part 9. */
export const HOW_LEFT: { value: string; label: T }[] = [
  { value: 'judge', label: t('Deportado/a por orden de un juez de inmigración', 'Removed under an immigration judge’s order') },
  { value: 'expedited', label: t('Deportación rápida en la frontera o el aeropuerto', 'Expedited removal at the border or airport') },
  { value: 'reinstated', label: t('Me deportaron otra vez con la orden anterior (restablecida)', 'Removed under a reinstated prior order') },
  { value: 'selfDeport', label: t('Me fui por mi cuenta teniendo una orden de deportación', 'Left on my own while a removal order was outstanding') },
  { value: 'voluntary', label: t('Salida voluntaria que no cumplí a tiempo', 'Voluntary departure not completed on time') },
  { value: 'other', label: t('Otra forma', 'Other') },
];

/** Favorable factors USCIS weighs, written into the statement in English. */
export const FACTORS: { value: string; label: T }[] = [
  { value: 'family', label: t('Mi familia en EE.UU. sufre sin mí', 'My U.S. family suffers hardship without me') },
  { value: 'children', label: t('Tengo hijos que dependen de mí', 'I have children who depend on me') },
  { value: 'petition', label: t('Tengo una petición de inmigrante aprobada o pendiente', 'I have an approved or pending immigrant petition') },
  { value: 'noCrimes', label: t('No tengo antecedentes penales', 'I have no criminal record') },
  { value: 'rehabilitated', label: t('Cambié mi vida desde mis errores pasados', 'I have reformed and been rehabilitated') },
  { value: 'work', label: t('Tengo buen historial de trabajo o una oferta de empleo', 'I have a good work history or a job offer') },
  { value: 'community', label: t('Participo en mi iglesia o comunidad', 'I am involved in my church or community') },
  { value: 'longResidence', label: t('Viví muchos años en EE.UU.', 'I lived in the U.S. for many years') },
  { value: 'health', label: t('Hay problemas de salud en mi familia', 'There are health problems in my family') },
  { value: 'timeOutside', label: t('Ha pasado mucho tiempo desde mi deportación', 'A long time has passed since my removal') },
];

const isVisa = is('processing', 'visa');
const isAdjust = is('processing', 'adjust');
const removed = (a: Answers) => a.arriving === 'yes' || a.deportable === 'yes';
const severalRemovals = (a: Answers) => a['arriving.count'] === 'more' || a['deportable.count'] === 'more' || a.reentry === 'yes';

export const i212: FormDefinition = {
  id: 'i-212',
  number: 'I-212',
  edition: I212_EDITION,
  title: t('Permiso para volver a pedir entrada después de una deportación', 'Permission to Reapply for Admission After Deportation or Removal'),
  summary: {
    es: 'Pida permiso para volver a solicitar entrada a EE.UU. antes de que termine el castigo por una deportación o por haber entrado sin permiso después de una.',
    en: 'Ask for permission to apply again for admission to the U.S. before the bar from a deportation, or from an illegal re-entry after one, runs out.',
  },
  intro: {
    es: 'Si lo deportaron (o salió teniendo una orden de deportación), no puede volver por 5, 10 o 20 años, o para siempre, a menos que USCIS le dé este permiso. El I-212 se usa, por ejemplo, junto con su caso de visa en el consulado o su ajuste de estatus. En algunos casos, quien vive en EE.UU. con una orden de deportación presenta primero el I-212 y, ya aprobado, el I-601A (perdón provisional). USCIS compara lo bueno y lo malo de su caso: familia, años en EE.UU., conducta, motivo de la deportación. Es un caso legal serio: le recomendamos mucho revisarlo con un abogado de inmigración antes de presentar.',
    en: 'If you were removed (or left while you had a removal order), you cannot return for 5, 10 or 20 years, or ever, unless USCIS gives you this permission. Form I-212 is used, for example, with your consular visa case or your adjustment of status. In some cases, a person living in the U.S. with a removal order files Form I-212 first and, once approved, Form I-601A (provisional waiver). USCIS weighs the favorable and unfavorable factors: family, years in the U.S., conduct, the reason for the removal. It is a serious legal case: we strongly recommend reviewing it with an immigration attorney before filing.',
  },
  minutes: 40,
  pdf: {
    path: 'forms/i-212.pdf',
    fileName: 'I-212-filled.pdf',
    load: () => import('../pdf/i212Pdf').then((m) => m.fillI212),
    signHere: { es: 'Parte 6, Ítem 4', en: 'Part 6, Item 4' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/i-212 que la edición {edition} sigue vigente, revise la tarifa y a qué oficina se envía: depende de si va con una visa del consulado, un ajuste de estatus, un I-601 o un I-601A.',
      'Adjunte copia de la orden de deportación o del documento de su salida, y pruebas de lo favorable de su caso: actas de nacimiento o matrimonio de su familia ciudadana o residente, cartas de apoyo, comprobantes de trabajo e impuestos, constancias médicas y, si tuvo problemas con la ley, los documentos de la corte y pruebas de rehabilitación.',
      'Si va a presentar el I-601A porque vive en EE.UU. con una orden de deportación, normalmente necesita que le aprueben primero este I-212. Pregúntele a su abogado el orden correcto.',
      'Revise la Parte 9: si su declaración o su historial no cupieron, el PDF los pasó ahí (y, si hacía falta, a una hoja adicional al final). Firme y ponga la fecha en cada hoja adicional.',
      'Imprima el PDF y firme la Parte 6, Ítem 4, a mano con tinta negra. Si un intérprete o preparador le ayudó, sus datos ya están en las Partes 7 y 8; ellos las revisan y las firman y fechan a mano. Si lo presenta ante CBP en un puerto de entrada, llene también la Parte 5 a mano.',
    ],
    en: [
      'Check at uscis.gov/i-212 that edition {edition} is still current, and check the fee and where to file: it depends on whether it goes with a consular visa, an adjustment of status, a Form I-601 or a Form I-601A.',
      'Attach a copy of the removal order or the record of your departure, and evidence of the favorable factors: birth or marriage certificates of your citizen or resident family, support letters, work and tax records, medical records and, if you had problems with the law, the court records and evidence of rehabilitation.',
      'If you will file Form I-601A because you live in the U.S. with a removal order, you usually need this I-212 approved first. Ask your attorney about the right order.',
      'Check Part 9: if your statement or history did not fit, the PDF moved it there (and onto an extra sheet at the end when needed). Sign and date each extra sheet.',
      'Print the PDF and sign Part 6, Item 4, by hand in black ink. If an interpreter or preparer helped you, their details are already in Parts 7 and 8; they review them and sign and date by hand. If you file with CBP at a port of entry, also complete Part 5 by hand.',
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
          formRef: 'Part 1 · Items 1–2',
          question: t('¿Cuál es su nombre completo?', 'What is your full name?'),
          notice: {
            tone: 'legal',
            title: t('Antes de empezar: hable con un abogado', 'Before you start: talk to an attorney'),
            body: t(
              'Este formulario trata de una deportación y de sus consecuencias. Un error o un dato que falte puede llevar a que se lo nieguen, y hay casos (por ejemplo, haber vuelto a entrar sin permiso después de una deportación) en que primero tiene que esperar 10 años fuera de EE.UU. Le recomendamos mucho que un abogado de inmigración o un representante acreditado revise su caso. Si vive en EE.UU. y también necesita el I-601A, el I-212 se presenta antes.',
              'This form is about a removal and its consequences. A mistake or a missing detail can lead to a denial, and in some cases (for example, re-entering illegally after a removal) you must first wait 10 years outside the U.S. We strongly recommend having an immigration attorney or accredited representative review your case. If you live in the U.S. and also need Form I-601A, the I-212 is filed first.',
            ),
          },
          fields: [
            ...nameFields('name', 'Part 1 · Item 2'),
            { id: 'aNumber', type: 'aNumber', label: { es: 'A-Number (si tiene)', en: 'A-Number (if any)' }, formRef: 'Part 1 · Item 1', hint: t('Aparece en su orden de deportación.', 'It is on your removal order.') },
            { id: 'ssn', type: 'ssn', label: { es: 'Seguro Social (si tiene)', en: 'U.S. Social Security number (if any)' }, formRef: 'Part 1 · Item 8' },
            { id: 'uscisAccount', type: 'uscisAccount', label: { es: 'Cuenta en línea de USCIS (si tiene)', en: 'USCIS online account number (if any)' }, formRef: 'Part 1 · Item 9' },
          ],
        },
        { id: 'otherName.more0', kind: 'choice', formRef: 'Part 1 · Items 3–4', question: t('¿Ha usado otros nombres (apodos, apellido de soltera, alias)?', 'Have you used other names (nicknames, maiden name, aliases)?'), options: yesNo },
        ...rows({
          max: 2,
          id: 'otherName',
          first: is('otherName.more0', 'yes'),
          question: (i) => (i === 1 ? t('Otro nombre', 'Another name') : t('Otro nombre más', 'One more name')),
          more: t('¿Ha usado otro nombre más?', 'Another name?'),
          formRef: 'Part 1 · Items 3–4',
          fields: (i) => nameFields(`otherName${i}`, `Part 1 · Item ${i + 2}`),
          overflow: t('Si son más de 2, escríbalos a mano en la Parte 9.', 'If there are more than 2, write them by hand in Part 9.'),
        }),
        {
          id: 'mailing',
          kind: 'fields',
          formRef: 'Part 1 · Item 5 · Mailing Address',
          question: t('¿A qué dirección le llega el correo?', 'What is your mailing address?'),
          why: t('Si está fuera de EE.UU., dé una dirección en EE.UU. si tiene (por ejemplo, la de un familiar); si no, la de su país.', 'If you are outside the U.S., give a U.S. mailing address if you have one (for example, a relative’s); if not, your address abroad.'),
          fields: address('mailing', 'Part 1 · Item 5', true),
        },
        { id: 'mailingSame', kind: 'choice', formRef: 'Part 1 · Item 6', question: t('¿Vive en esa misma dirección?', 'Do you live at that same address?'), options: yesNo },
        { id: 'home', kind: 'fields', formRef: 'Part 1 · Item 7 · Physical Address', showIf: is('mailingSame', 'no'), question: t('¿Dónde vive?', 'Where do you live?'), fields: address('home', 'Part 1 · Item 7') },
        {
          id: 'personal',
          kind: 'fields',
          formRef: 'Part 1 · Items 10–15',
          question: t('Datos personales', 'Personal details'),
          fields: [
            sexField('sex', 'Part 1 · Item 10'),
            date('dob', 'Fecha de nacimiento', 'Date of birth', 'Part 1 · Item 11'),
            text('birthCity', 'Ciudad de nacimiento', 'City or town of birth', 'Part 1 · Item 12', { maxLength: 20 }),
            text('birthProvince', 'Estado o provincia de nacimiento', 'State or province of birth', 'Part 1 · Item 13', { required: false, maxLength: 20, placeholder: 'Jalisco' }),
            text('birthCountry', 'País de nacimiento', 'Country of birth', 'Part 1 · Item 14'),
            text('citizenship', 'País de ciudadanía', 'Country of citizenship or nationality', 'Part 1 · Item 15'),
          ],
        },
      ],
    },
    {
      id: 'case',
      part: 'Part 1',
      title: t('Con qué caso va este permiso', 'The case this request goes with'),
      questions: [
        {
          id: 'processing',
          kind: 'choice',
          formRef: 'Part 1 · Items 16–18.c',
          question: t('¿Con qué solicitud va a usar este permiso?', 'What application will this permission go with?'),
          why: t(
            'Si vive en EE.UU. y piensa pedir el I-601A para luego ir al consulado, elija la visa del consulado.',
            'If you live in the U.S. and plan to file Form I-601A and then go to the consulate, choose the consular visa.',
          ),
          options: [
            { value: 'visa', label: t('Una visa en un consulado de EE.UU. (de inmigrante o de visitante)', 'A visa at a U.S. consulate (immigrant or nonimmigrant)') },
            { value: 'adjust', label: t('Un ajuste de estatus a residente (I-485) aquí en EE.UU.', 'An application to adjust status (Form I-485) in the U.S.') },
            { value: 'other', label: t('Otra cosa o todavía no sé', 'Something else, or I do not know yet') },
          ],
        },
        {
          id: 'consular',
          kind: 'fields',
          formRef: 'Part 1 · Items 16–17.b',
          showIf: isVisa,
          question: t('Su caso en el consulado', 'Your consular case'),
          fields: [
            text('consular.case', 'Número de caso del Departamento de Estado (si tiene)', 'DOS consular case number (if available)', 'Part 1 · Item 16', { required: false, maxLength: 13, placeholder: 'CDJ2025123456' }),
            text('consulate.city', 'Ciudad del consulado o embajada', 'City of the U.S. embassy or consulate', 'Part 1 · Item 17.a', { maxLength: 20, placeholder: 'Ciudad Juarez' }),
            text('consulate.country', 'País del consulado', 'Country of the consulate', 'Part 1 · Item 17.b', { placeholder: 'Mexico' }),
          ],
        },
        {
          id: 'adjustment',
          kind: 'fields',
          formRef: 'Part 1 · Items 18.a–18.c',
          showIf: isAdjust,
          question: t('Su solicitud de ajuste de estatus', 'Your adjustment of status application'),
          fields: [
            { id: 'adjust.receipt', type: 'receipt', label: { es: 'Número de recibo de USCIS (si tiene)', en: 'USCIS receipt number (if any)' }, formRef: 'Part 1 · Item 18.a', placeholder: 'IOE0912345678' },
            text('adjust.office', 'Dónde la presentó (oficina de USCIS o "Lockbox")', 'Where you filed it (USCIS office or "Lockbox")', 'Part 1 · Item 18.b', { required: false, maxLength: 20 }),
            date('adjust.date', 'Fecha en que la presentó', 'Date filed', 'Part 1 · Item 18.c', false),
          ],
        },
        {
          id: 'i601',
          kind: 'choice',
          formRef: 'Part 1 · Item 19',
          question: t('¿Va a enviar con este formulario un I-601 (perdón de causas de inadmisibilidad)?', 'Are you submitting Form I-601, Application for Waiver of Grounds of Inadmissibility, with this application?'),
          why: t('El I-601 es distinto del I-601A. Pregúntele a su abogado si lo necesita.', 'Form I-601 is not the same as Form I-601A. Ask your attorney whether you need it.'),
          options: yesNo,
        },
        { id: 'prevI601', kind: 'choice', formRef: 'Part 1 · Items 20.a–20.c', showIf: is('i601', 'no'), question: t('¿Presentó antes un I-601?', 'Did you file a Form I-601 before?'), options: yesNo },
        {
          id: 'prevI601Details',
          kind: 'fields',
          formRef: 'Part 1 · Items 20.a–20.c',
          showIf: all(is('i601', 'no'), is('prevI601', 'yes')),
          question: t('Su I-601 anterior', 'Your previous Form I-601'),
          fields: [
            { id: 'prevI601.receipt', type: 'receipt', label: { es: 'Número de recibo (si tiene)', en: 'Receipt number (if any)' }, formRef: 'Part 1 · Item 20.a' },
            text('prevI601.office', 'Dónde lo presentó (oficina de USCIS o "Lockbox")', 'Where you filed it (USCIS office or "Lockbox")', 'Part 1 · Item 20.b', { required: false, maxLength: 20 }),
            date('prevI601.date', 'Fecha en que lo presentó', 'Date filed', 'Part 1 · Item 20.c', false),
          ],
        },
      ],
    },
    {
      id: 'removal',
      part: 'Part 2',
      title: t('Su deportación', 'Your removal'),
      questions: [
        {
          id: 'arriving',
          kind: 'choice',
          formRef: 'Part 2 · Item 1.a',
          question: t('¿Lo deportaron al llegar a EE.UU. (en la frontera, un puerto de entrada o un aeropuerto)?', 'Were you removed as an arriving alien (at the border, a port of entry or an airport)?'),
          why: t(
            'Por ejemplo, una "deportación rápida" (expedited removal) cuando intentaba entrar, o una orden de un juez cuando lo trataron como recién llegado.',
            'For example, expedited removal when you tried to enter, or a judge’s order when you were treated as an arriving alien.',
          ),
          notice: {
            tone: 'legal',
            title: t('Su historial de deportación', 'Your removal history'),
            body: t(
              'Conteste con lo que dicen sus documentos. Si no tiene copia de su orden de deportación, un abogado puede pedir su expediente (FOIA) para saber exactamente qué tipo de deportación tuvo y cuándo.',
              'Answer from what your documents say. If you do not have a copy of your removal order, an attorney can request your file (FOIA) to learn exactly what kind of removal you had and when.',
            ),
          },
          options: yesNo,
        },
        { id: 'arriving.count', kind: 'choice', formRef: 'Part 2 · Items 1.b–1.c', showIf: is('arriving', 'yes'), question: t('¿Cuántas veces lo deportaron así?', 'How many times were you removed this way?'), why: t('El castigo es de 5 años si fue una vez y de 20 si fueron dos o más.', 'The bar is 5 years after one removal and 20 years after two or more.'), options: COUNT },
        {
          id: 'arrivingDetails',
          kind: 'fields',
          formRef: 'Part 2 · Items 2–4',
          showIf: is('arriving', 'yes'),
          question: t('Su última deportación al llegar', 'Your last removal as an arriving alien'),
          fields: [date('arriving.date', 'Fecha en que lo deportaron', 'Date you were removed', 'Part 2 · Item 2'), ...place('arriving', 'Part 2', ['3', '4'], 'Lugar de donde lo deportaron', 'Place you were removed from')],
        },
        {
          id: 'deportable',
          kind: 'choice',
          formRef: 'Part 2 · Item 5.a',
          question: t('¿Lo deportaron estando dentro de EE.UU., o se fue teniendo una orden de deportación?', 'Were you removed from inside the U.S., or did you leave while an order of removal was outstanding?'),
          why: t('Por ejemplo, un juez de inmigración le dio una orden y ICE lo sacó, o usted se fue por su cuenta con esa orden.', 'For example, an immigration judge ordered you removed and ICE removed you, or you left on your own with that order.'),
          options: yesNo,
        },
        { id: 'deportable.count', kind: 'choice', formRef: 'Part 2 · Items 5.b–5.c', showIf: is('deportable', 'yes'), question: t('¿Cuántas veces lo deportaron o se fue con una orden?', 'How many times were you removed or did you leave with an order?'), why: t('El castigo es de 10 años si fue una vez y de 20 si fueron dos o más.', 'The bar is 10 years after one removal and 20 years after two or more.'), options: COUNT },
        {
          id: 'deportableDetails',
          kind: 'fields',
          formRef: 'Part 2 · Items 6–7.b',
          showIf: is('deportable', 'yes'),
          question: t('Su última deportación o salida', 'Your last removal or departure'),
          fields: [date('deportable.date', 'Fecha en que lo deportaron o salió', 'Date you were excluded, deported or removed', 'Part 2 · Item 6'), ...place('deportable', 'Part 2', ['7.a', '7.b'], 'Lugar de donde salió', 'Place you were removed from')],
        },
        {
          id: 'felony',
          kind: 'choice',
          formRef: 'Part 2 · Items 1.d, 5.d',
          showIf: removed,
          question: t('¿Lo han condenado alguna vez por un delito grave considerado "aggravated felony", en EE.UU. o en otro país?', 'Have you been convicted of an aggravated felony in the U.S. or abroad?'),
          notice: {
            tone: 'legal',
            title: t('Consulte a un abogado', 'Talk to an attorney'),
            body: t(
              'Qué delito es un "aggravated felony" lo decide la ley, y a veces incluye delitos que no parecen tan graves. No adivine: un abogado debe revisar sus documentos de la corte. Si lo es, el castigo no se acaba con el tiempo y este permiso es la única forma de volver.',
              'Whether a crime is an "aggravated felony" is a legal question, and it sometimes includes crimes that do not seem serious. Do not guess: an attorney should review your court records. If it is one, the bar never runs out and this permission is the only way back.',
            ),
          },
          options: yesNo,
        },
        {
          id: 'felonyExplain',
          kind: 'fields',
          formRef: 'Part 2 · Items 1.d, 5.d · Part 9',
          showIf: all(removed, is('felony', 'yes')),
          question: t('Sus condenas', 'Your convictions'),
          fields: [{ id: 'felony.explain', type: 'longText', required: true, label: t('Delito, fecha, lugar, corte y sentencia de cada una (en inglés)', 'Crime, date, place, court and sentence for each'), formRef: 'Part 9' }],
        },
        {
          id: 'unlawfulPresence',
          kind: 'choice',
          formRef: 'Part 2 · Item 8',
          question: t('¿Entró o intentó entrar a EE.UU. sin permiso después de haber vivido sin estatus más de un año en total (desde el 1 de abril de 1997)?', 'Did you enter or attempt to enter the U.S. without being admitted or paroled after more than one year of unlawful presence in total (on or after April 1, 1997)?'),
          notice: {
            tone: 'legal',
            title: t('Castigo permanente', 'Permanent bar'),
            body: t(
              'Si contesta Sí aquí o en la próxima pregunta sobre volver a entrar después de una deportación, la ley le exige normalmente haber estado 10 años fuera de EE.UU. desde su última salida antes de pedir este permiso. Hable con un abogado antes de presentar: presentarlo antes de tiempo puede costarle la tarifa y llamar la atención sobre su caso.',
              'If you answer Yes here or to the next question about re-entering after a removal, the law usually requires you to have stayed 10 years outside the U.S. since your last departure before asking for this permission. Talk to an attorney before filing: filing too early can cost you the fee and draw attention to your case.',
            ),
          },
          options: yesNo,
        },
        {
          id: 'presence',
          kind: 'fields',
          formRef: 'Part 2 · Items 9.a–13',
          showIf: is('unlawfulPresence', 'yes'),
          question: t('Su tiempo sin estatus y su salida', 'Your unlawful presence and departure'),
          why: t('Empiece por el período más reciente. Si no sabe la fecha exacta, ponga la más cercana que recuerde.', 'Start with the most recent period. If you do not know the exact date, give the closest one you remember.'),
          fields: [
            date('presence.from', 'Sin estatus desde', 'Unlawful presence from', 'Part 2 · Item 9.a'),
            date('presence.to', 'Sin estatus hasta', 'Unlawful presence to', 'Part 2 · Item 9.b'),
            date('presence.departed', 'Fecha en que salió de EE.UU.', 'Date you departed the U.S.', 'Part 2 · Item 10'),
            ...place('presence.departure', 'Part 2', ['11.a', '11.b'], 'Por dónde salió', 'Where you departed'),
            ...place('presence.reentry', 'Part 2', ['12.a', '12.b'], 'Por dónde volvió a entrar o lo intentó', 'Where you reentered or tried to'),
            date('presence.reentryDate', 'Fecha en que volvió a entrar o lo intentó', 'Date you entered or tried to reenter', 'Part 2 · Item 13'),
            { id: 'presence.other', type: 'longText', label: t('Otros períodos sin estatus (fechas, en inglés), si hubo', 'Other periods of unlawful presence (dates), if any'), formRef: 'Part 2 · Item 9 · Part 9' },
          ],
        },
        {
          id: 'reentry',
          kind: 'choice',
          formRef: 'Part 2 · Item 14',
          question: t('¿Entró o intentó entrar a EE.UU. sin permiso después de que lo deportaron?', 'Did you enter or attempt to enter the U.S. without being admitted or paroled after being excluded, deported or removed?'),
          options: yesNo,
        },
        {
          id: 'reentryDetails',
          kind: 'fields',
          formRef: 'Part 2 · Items 15–17',
          showIf: is('reentry', 'yes'),
          question: t('Su entrada después de la deportación', 'Your entry after removal'),
          fields: [
            date('reentry.removedDate', 'Fecha de la deportación anterior a esa entrada', 'Date you were excluded, deported or removed', 'Part 2 · Item 15'),
            ...place('reentry', 'Part 2', ['16.a', '16.b'], 'Por dónde volvió a entrar o lo intentó', 'Where you reentered or tried to'),
            date('reentry.date', 'Fecha en que volvió a entrar o lo intentó', 'Date you entered or tried to reenter', 'Part 2 · Item 17'),
          ],
        },
        ...rows({
          max: 5,
          id: 'removal',
          first: severalRemovals,
          question: (i) => (i === 1 ? t('Cada vez que lo deportaron o salió con una orden: la primera', 'Each time you were removed or left with an order: the first') : t('La siguiente deportación o salida', 'The next removal or departure')),
          why: (i) => (i === 1 ? t('USCIS pide todas las fechas. Esto va a la Parte 9.', 'USCIS asks for every date. This goes in Part 9.') : undefined),
          more: t('¿Hubo otra deportación o salida con orden?', 'Another removal or departure?'),
          formRef: 'Part 2 · Items 14–15 · Part 9',
          fields: (i) => [
            date(`removal${i}.date`, 'Fecha', 'Date', 'Part 9'),
            text(`removal${i}.place`, 'Lugar (ciudad y estado o puerto)', 'Place (city and state, or port)', 'Part 9', { placeholder: 'Hidalgo, TX' }),
            { id: `removal${i}.how`, type: 'select', required: true, label: t('Cómo salió', 'How you left'), formRef: 'Part 9', options: HOW_LEFT },
          ],
          overflow: t('Si fueron más de 5, agréguelas a mano en la Parte 9.', 'If there were more than 5, add them by hand in Part 9.'),
        }),
      ],
    },
    {
      id: 'reasons',
      part: 'Part 3',
      title: t('Por qué pide el permiso', 'Why you are asking'),
      questions: [
        {
          id: 'seeking',
          kind: 'choice',
          formRef: 'Part 3 · Item 1',
          question: t('Si le dan el permiso, ¿qué estatus va a pedir?', 'If DHS lets you reenter, what immigration status will you seek?'),
          options: [
            { value: 'P', label: t('Residente permanente', 'Permanent resident') },
            { value: 'V', label: t('Visitante', 'Visitor') },
            { value: 'S', label: t('Estudiante', 'Student') },
            { value: 'O', label: t('Otro', 'Other') },
          ],
        },
        { id: 'seekingOther', kind: 'fields', formRef: 'Part 3 · Item 1.d', showIf: is('seeking', 'O'), question: t('¿Qué otro estatus?', 'What other status?'), fields: [text('seeking.other', 'Estatus (en inglés)', 'Status', 'Part 3 · Item 1.d', { placeholder: 'Temporary worker (H-2A)' })] },
        { id: 'family.more0', kind: 'choice', formRef: 'Part 3 · Items 3.a–4.b', question: t('¿Tiene familiares ciudadanos o residentes permanentes de EE.UU.?', 'Do you have U.S. citizen or lawful permanent resident family members?'), why: t('Su familia en EE.UU. es uno de los puntos que más ayudan.', 'Family in the U.S. is one of the strongest favorable factors.'), options: yesNo },
        ...rows({
          max: 4,
          id: 'family',
          first: is('family.more0', 'yes'),
          question: (i) => (i === 1 ? t('Su familiar en EE.UU.', 'Your family member in the U.S.') : t('Otro familiar en EE.UU.', 'Another family member in the U.S.')),
          why: (i) => (i === 2 ? t('El formulario tiene espacio para uno; los demás van a la Parte 9.', 'The form has room for one; the others go in Part 9.') : undefined),
          more: t('¿Tiene otro familiar ciudadano o residente?', 'Another citizen or resident family member?'),
          formRef: 'Part 3 · Items 3.a–4.b',
          fields: (i) => [
            ...nameFields(`family${i}`, `Part 3 · Item 3${i > 1 ? ' · Part 9' : ''}`),
            text(`family${i}.relationship`, 'Parentesco (en inglés)', 'Relationship', `Part 3 · Item 3.d${i > 1 ? ' · Part 9' : ''}`, { placeholder: 'Wife, son, mother' }),
            {
              id: `family${i}.status`,
              type: 'select',
              required: true,
              label: t('Esa persona es…', 'This person is'),
              formRef: `Part 3 · Item 4${i > 1 ? ' · Part 9' : ''}`,
              options: [
                { value: 'CIT', label: t('Ciudadano/a de EE.UU.', 'A U.S. citizen') },
                { value: 'LPR', label: t('Residente permanente', 'A lawful permanent resident') },
              ],
            },
          ],
          overflow: t('Si tiene más familiares, nómbrelos en su declaración.', 'If you have more relatives, name them in your statement.'),
        }),
        {
          id: 'factors',
          kind: 'choice',
          multiple: true,
          formRef: 'Part 3 · Item 2',
          question: t('¿Qué puntos a su favor tiene?', 'What favorable factors do you have?'),
          why: t('Elija todos los que apliquen. Van al principio de su declaración, en inglés, y luego debe probarlos con documentos.', 'Choose all that apply. They open your statement, and you must then prove them with documents.'),
          options: FACTORS,
        },
      ],
    },
    {
      id: 'statement',
      part: 'Part 3',
      title: t('Su declaración', 'Your statement'),
      questions: [
        {
          id: 'reason',
          kind: 'fields',
          formRef: 'Part 3 · Item 2 · Part 9',
          question: t('¿Por qué quiere volver a EE.UU.?', 'Why would you like to reenter the United States?'),
          why: t(
            'Cuente su historia con sus palabras: por qué lo deportaron, qué ha hecho desde entonces, a quién tiene en EE.UU., cómo les afecta su ausencia y por qué merece otra oportunidad. Si cometió errores, reconózcalos. Escriba en inglés. Si es largo, la app lo pasa a la Parte 9.',
            'Tell your story in your own words: why you were removed, what you have done since, who you have in the U.S., how your absence affects them, and why you deserve another chance. If you made mistakes, acknowledge them. Write in English. If it is long, the app moves it to Part 9.',
          ),
          notice: {
            tone: 'legal',
            title: t('Diga siempre la verdad', 'Always tell the truth'),
            body: t(
              'Lo que escriba aquí se compara con su expediente. Una mentira o una omisión puede causar un castigo permanente por fraude. Pídale a un abogado que revise su declaración.',
              'What you write here is compared with your file. A lie or an omission can cause a permanent bar for fraud. Ask an attorney to review your statement.',
            ),
          },
          fields: [{ id: 'reason.statement', type: 'longText', required: true, label: t('Su declaración (en inglés)', 'Your statement'), formRef: 'Part 3 · Item 2' }],
        },
      ],
    },
    { id: 'biographic', part: 'Part 4', title: t('Datos físicos', 'Biographic information'), questions: biographic('Part 4') },
    {
      id: 'contact',
      part: 'Part 6',
      title: t('Declaración y contacto', 'Statement and contact'),
      questions: [
        {
          id: 'readsEnglish',
          kind: 'choice',
          formRef: "Part 6 · Applicant's Certification",
          question: t('¿Puede leer y entender el formulario en inglés?', 'Can you read and understand the form in English?'),
          why: t('Si un intérprete se lo lee, sus datos van en la Parte 7.', 'If an interpreter reads it to you, their details go in Part 7.'),
          options: [
            { value: 'A', label: t('Sí, leo inglés', 'Yes, I read English') },
            { value: 'B', label: t('No, un intérprete me lo leerá', 'No, an interpreter will read it to me') },
          ],
        },
        {
          id: 'interpreterLanguage',
          kind: 'fields',
          formRef: "Part 6 · Applicant's Certification",
          showIf: is('readsEnglish', 'B'),
          question: t('¿En qué idioma se lo leerán?', 'What language will it be read in?'),
          fields: [text('fluentLanguage', 'Idioma', 'Language', "Part 6 · Applicant's Certification", { placeholder: 'Spanish' })],
        },
        {
          id: 'preparer',
          kind: 'choice',
          formRef: 'Part 8 · Preparer',
          question: t('¿Alguien más (no usted) preparó esta solicitud?', 'Did someone else prepare this application for you?'),
          why: t('Si es así, al final le pediremos sus datos para la Parte 8; esa persona la firma a mano.', 'If so, we ask for their details for Part 8 at the end; that person signs it by hand.'),
          options: yesNo,
        },
        {
          id: 'preparerName',
          kind: 'fields',
          formRef: 'Part 8 · Preparer',
          showIf: is('preparer', 'yes'),
          question: t('¿Quién la preparó?', 'Who prepared it?'),
          fields: [text('preparer.name', 'Nombre del preparador', 'Preparer’s name', 'Part 8 · Preparer')],
        },
        {
          id: 'contactInfo',
          kind: 'fields',
          formRef: 'Part 6 · Items 1–3',
          question: t('¿Cómo puede contactarle USCIS?', 'How can USCIS contact you?'),
          why: t(
            'Al firmar la Parte 6 declara bajo pena de perjurio que todo es verdad. Si alguien le interpretó o preparó el formulario, ellos firman a mano las Partes 7 y 8.',
            'By signing Part 6 you declare under penalty of perjury that everything is true. If someone interpreted or prepared the form for you, they sign Parts 7 and 8 by hand.',
          ),
          fields: [
            { id: 'phone', type: 'phone', required: true, label: { es: 'Teléfono de día', en: 'Daytime phone' }, formRef: 'Part 6 · Item 1', placeholder: '213 555 0123' },
            { id: 'mobile', type: 'phone', label: { es: 'Celular', en: 'Mobile phone' }, formRef: 'Part 6 · Item 2' },
            { id: 'email', type: 'email', label: { es: 'Correo electrónico', en: 'Email' }, formRef: 'Part 6 · Item 3' },
          ],
        },
      ],
    },
    assistanceSection({ usedInterpreter, usedPreparer, interpreterPart: 'Part 7', preparerPart: 'Part 8', address: false, statement: false }),
  ],
};
