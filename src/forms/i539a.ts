import type { Answers, Field, FormDefinition, Question, Section, YesNoItem } from './types';
import type { T } from '../i18n';
import { date, is, nameFields, yesNo } from './helpers';
import { assistanceSection, usedInterpreter, usedPreparer } from './assistance';
import { BACKGROUND_ITEMS, IMMIGRANT_ITEMS } from './i539';
import { I539_CURRENT_STATUSES } from './i539Status';

// Questions follow USCIS Form I-539A, Supplemental Information for Application to Extend/Change
// Nonimmigrant Status, edition 08/28/24. The PDF mapping lives in src/pdf/i539aPdf.ts.
// One I-539A per co-applicant (spouse or child) goes with the principal's Form I-539. Part 1 is the
// principal (the I-539's own `name.*` ids, so Camino reuses them); everything else is about the
// co-applicant and uses `co.*` ids, so the principal's answers never fill the family member's.
// Out of scope: the attorney box at the top of page 1 and the signatures and dates (handwritten).
// The interpreter's and preparer's parts (5 and 6) have no address and no preparer's statement on
// this form, so those questions of the shared assistance section are left out.

export const I539A_EDITION = '08/28/24';

const t = (es: string, en: string): T => ({ es, en });

const text = (id: string, es: string, en: string, formRef: string, extra: Partial<Field> = {}): Field => ({ id, type: 'text', required: true, label: { es, en }, formRef, ...extra });

const statusOptions = I539_CURRENT_STATUSES.map((c) => ({ value: c, label: { es: c, en: c } }));

/**
 * Part 3, Items 1-16: the I-539's Part 4 questions (Items 3-13) in the same order, asked about the
 * co-applicant. Ids are `co.p3.<item>`.
 */
const SHARED = [...IMMIGRANT_ITEMS, ...BACKGROUND_ITEMS];
export const CO_ITEMS: YesNoItem[] = SHARED.map((item, i) => ({ id: `co.p3.${i + 1}`, label: item.label, formRef: `Part 3 · Item ${i + 1}` }));
const IMMIGRANT = CO_ITEMS.slice(0, 3);
const BACKGROUND = CO_ITEMS.slice(3);

export const anyExplainedYes = (a: Answers) => CO_ITEMS.some((i) => a[i.id] === 'yes');

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

/** Parts 5 and 6 ask only for name, business, phones and email (and the interpreter's language). */
const ON_THIS_FORM = new Set(['interp.who', 'interp.contact', 'prep.same', 'prep.who', 'prep.contact']);
const assistance: Section = (() => {
  const s = assistanceSection({ usedInterpreter, usedPreparer, interpreterPart: 'Part 5', preparerPart: 'Part 6' });
  return { ...s, questions: s.questions.filter((q) => ON_THIS_FORM.has(q.id)) };
})();

export const i539a: FormDefinition = {
  id: 'i-539a',
  number: 'I-539A',
  edition: I539A_EDITION,
  title: t('Información adicional de un familiar para el I-539', 'Supplemental Information for Application to Extend/Change Nonimmigrant Status'),
  summary: {
    es: 'Un formulario por cada esposo/a o hijo/a que va incluido en el I-539 del solicitante principal para extender o cambiar su estatus.',
    en: 'One form for each spouse or child included in the principal applicant’s Form I-539 to extend or change status.',
  },
  intro: {
    es: 'El I-539A va junto con el I-539 del solicitante principal cuando en la misma solicitud se incluye a su esposo/a o a sus hijos solteros menores de 21. Se llena UNO POR CADA FAMILIAR: las preguntas son sobre ese familiar, así que conteste como si fuera él o ella (si es un niño, conteste por el niño). Para no mezclar los datos, cree en Camino un caso para cada familiar, o descargue el PDF de uno y vuelva a empezar el formulario para el siguiente. No llene un I-539A para el solicitante principal. Si el familiar tiene arrestos, trabajó sin permiso o está en proceso de deportación, hable antes con un abogado.',
    en: 'Form I-539A goes with the principal applicant’s Form I-539 when the same application includes their spouse or unmarried children under 21. Fill ONE FOR EACH FAMILY MEMBER: the questions are about that family member, so answer as them (for a child, answer for the child). To keep the details apart, create a Camino case for each family member, or download one PDF and start the form over for the next one. Do not fill an I-539A for the principal applicant. If the family member has arrests, worked without authorization, or is in removal proceedings, talk to an attorney first.',
  },
  minutes: 15,
  pdf: {
    path: 'forms/i-539a.pdf',
    fileName: 'I-539A-filled.pdf',
    load: () => import('../pdf/i539aPdf').then((m) => m.fillI539A),
    signHere: { es: 'Parte 4, Ítem 4', en: 'Part 4, Item 4' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/i-539 que la edición {edition} del I-539A sigue vigente. El I-539A no tiene tarifa propia: la tarifa va con el I-539.',
      'Llene un I-539A por cada familiar incluido (esposo/a o hijo/a). En Camino, use un caso distinto para cada uno, o descargue este PDF y vuelva a empezar el formulario con los datos del siguiente.',
      'Envíe cada I-539A junto con el I-539 del solicitante principal, en el mismo paquete. No se presenta solo.',
      'Adjunte para este familiar: copia de su I-94 (frente y reverso) y de su visa; prueba del parentesco (acta de matrimonio o de nacimiento); y, si no ha trabajado, pruebas de cómo se mantiene.',
      'Imprima el PDF. El familiar firma la Parte 4, Ítem 4, a mano con tinta negra; si es menor de 14 años, firma su padre, madre o tutor. Si un intérprete o preparador ayudó, ellos firman a mano las Partes 5 y 6.',
      'USCIS puede citar al familiar para tomarle huellas y foto (biometría). No salga de EE.UU. mientras espera la decisión.',
    ],
    en: [
      'Check at uscis.gov/i-539 that edition {edition} of Form I-539A is still current. Form I-539A has no fee of its own: the fee goes with Form I-539.',
      'Fill one Form I-539A for each family member included (spouse or child). In Camino, use a separate case for each one, or download this PDF and start the form over with the next person’s details.',
      'Send each Form I-539A together with the principal applicant’s Form I-539, in the same package. It is not filed alone.',
      'Attach for this family member: a copy of their I-94 (front and back) and their visa; proof of the relationship (marriage or birth certificate); and, if they have not worked, proof of how they are supported.',
      'Print the PDF. The family member signs Part 4, Item 4, by hand in black ink; if under 14, a parent or guardian signs. If an interpreter or preparer helped, they sign Parts 5 and 6 by hand.',
      'USCIS may schedule the family member for fingerprints and a photo (biometrics). Do not leave the U.S. while you wait for a decision.',
    ],
  },
  sections: [
    {
      id: 'principal',
      part: 'Part 1',
      title: t('El solicitante principal', 'The principal applicant'),
      questions: [
        {
          id: 'name',
          kind: 'fields',
          formRef: 'Part 1 · Item 1 · Information About the Person Filing Form I-539',
          question: t('¿Cómo se llama el solicitante principal, la persona que presenta el I-539?', 'What is the name of the principal applicant, the person filing Form I-539?'),
          why: t('Escríbalo igual que en el I-539. Si el principal es usted, ponga su nombre aquí y los datos de su familiar en lo que sigue.', 'Write it exactly as on Form I-539. If you are the principal, put your name here and your family member’s details in what follows.'),
          notice: {
            tone: 'info',
            title: t('Un I-539A por cada familiar', 'One Form I-539A per family member'),
            body: t(
              'Desde aquí, todas las preguntas son sobre UN familiar incluido en el I-539 (esposo/a o hijo/a). Para otro familiar, llene otro I-539A en un caso aparte.',
              'From here on, every question is about ONE family member included in the Form I-539 (spouse or child). For another family member, fill another Form I-539A in a separate case.',
            ),
          },
          fields: nameFields('name', 'Part 1 · Item 1'),
        },
        {
          id: 'co.relationship',
          kind: 'choice',
          formRef: 'Form I-539 Instructions · Evidence of Relationship',
          question: t('¿Qué es este familiar del solicitante principal?', 'How is this family member related to the principal applicant?'),
          why: t('No va en el formulario, pero define qué pruebas de parentesco debe adjuntar.', 'It is not on the form, but it decides which proof of relationship to attach.'),
          options: [
            { value: 'spouse', label: t('Esposo/a', 'Spouse') },
            { value: 'child', label: t('Hijo/a soltero/a menor de 21', 'Unmarried child under 21') },
            { value: 'other', label: t('Otro parentesco', 'Other relationship') },
          ],
        },
      ],
    },
    {
      id: 'about',
      part: 'Part 2',
      title: t('Datos del familiar', 'About the family member'),
      questions: [
        {
          id: 'co.name',
          kind: 'fields',
          formRef: 'Part 2 · Item 1 · Your Full Legal Name',
          question: t('¿Cuál es su nombre legal completo? (el del familiar)', 'What is your full legal name? (the family member’s)'),
          why: t('Como aparece en su pasaporte y en su I-94.', 'As it appears on your passport and I-94.'),
          fields: nameFields('co.name', 'Part 2 · Item 1'),
        },
        {
          id: 'co.birth',
          kind: 'fields',
          formRef: 'Part 2 · Items 2–4',
          question: t('Su nacimiento y nacionalidad', 'Your birth and citizenship'),
          fields: [
            date('co.dob', 'Fecha de nacimiento', 'Date of birth', 'Part 2 · Item 2 · Date of Birth'),
            text('co.birthCountry', 'País de nacimiento', 'Country of birth', 'Part 2 · Item 3 · Country of Birth', { placeholder: 'Mexico' }),
            text('co.citizenship', 'País de ciudadanía o nacionalidad', 'Country of citizenship or nationality', 'Part 2 · Item 4 · Country of Citizenship or Nationality', { placeholder: 'Mexico' }),
          ],
        },
        {
          id: 'co.ids',
          kind: 'fields',
          formRef: 'Part 2 · Items 5–6, 10',
          question: t('Sus números (si los tiene)', 'Your numbers (if any)'),
          why: t('La mayoría de los dependientes y visitantes no tienen A-Number ni Seguro Social. Deje vacío lo que no tenga.', 'Most dependents and visitors have no A-Number or Social Security number. Leave empty what you don’t have.'),
          fields: [
            { id: 'co.ssn', type: 'ssn', label: { es: 'Número de Seguro Social', en: 'U.S. Social Security number' }, formRef: 'Part 2 · Item 5 · U.S. Social Security Number' },
            { id: 'co.aNumber', type: 'aNumber', label: { es: 'A-Number', en: 'A-Number' }, formRef: 'Part 2 · Item 6 · Alien Registration Number (A-Number)' },
            { id: 'co.uscisAccount', type: 'uscisAccount', label: { es: 'Cuenta en línea de USCIS', en: 'USCIS online account number' }, formRef: 'Part 2 · Item 10 · USCIS Online Account Number' },
          ],
        },
        {
          id: 'co.lastEntry',
          kind: 'fields',
          formRef: 'Part 2 · Item 7 · Your Most Recent Entry Into the United States',
          question: t('Su última entrada a EE.UU.', 'Your most recent entry into the U.S.'),
          why: t('El número del I-94 y su fecha de vencimiento aparecen en i94.cbp.dhs.gov. Use el pasaporte con el que entró.', 'Your I-94 number and its expiration date are at i94.cbp.dhs.gov. Use the passport you entered with.'),
          fields: [
            date('co.lastEntry.date', 'Fecha de su última llegada', 'Date of arrival', 'Part 2 · Item 7 · Date of Arrival'),
            { id: 'co.i94.number', type: 'i94', required: true, label: { es: 'Número del I-94', en: 'I-94 number' }, formRef: 'Part 2 · Item 7 · Form I-94 Arrival/Departure Record Number' },
            text('co.passport.number', 'Número de pasaporte', 'Passport number', 'Part 2 · Item 7 · Passport Number', { required: false, maxLength: 30 }),
            text('co.passport.travelDoc', 'Número de documento de viaje (si no usó pasaporte)', 'Travel document number (if any)', 'Part 2 · Item 7 · Travel Document Number', { required: false, maxLength: 30 }),
            text('co.passport.country', 'País que emitió el pasaporte o documento', 'Country of passport or travel document issuance', 'Part 2 · Item 7 · Country of Passport or Travel Document Issuance'),
            date('co.passport.expires', 'Fecha de vencimiento del pasaporte o documento', 'Passport or travel document expiration date', 'Part 2 · Item 7 · Passport or Travel Document Expiration Date', true, 'date'),
          ],
        },
        {
          id: 'co.status',
          kind: 'fields',
          formRef: 'Part 2 · Item 8 · Current Nonimmigrant Status',
          question: t('¿Cuál es su estatus migratorio actual?', 'What is your current nonimmigrant status?'),
          why: t('Es la clase de admisión de su I-94 (por ejemplo B2 turista, F2 dependiente de estudiante, H4 dependiente).', 'It is the class of admission on your I-94 (for example B2 visitor, F2 student dependent, H4 dependent).'),
          fields: [{ id: 'co.currentStatus', type: 'select', required: true, label: { es: 'Estatus actual', en: 'Current status' }, formRef: 'Part 2 · Item 8 · Current Nonimmigrant Status', options: statusOptions }],
        },
        {
          id: 'co.statusDS',
          kind: 'choice',
          formRef: 'Part 2 · Item 8 · Expiration Date',
          question: t('¿Su I-94 dice "D/S" (duración del estatus) en vez de una fecha?', 'Does your I-94 say "D/S" (Duration of Status) instead of a date?'),
          why: t('Es común en dependientes F-2 y J-2.', 'This is common for F-2 and J-2 dependents.'),
          options: yesNo,
        },
        {
          id: 'co.statusExpires',
          kind: 'fields',
          formRef: 'Part 2 · Item 8 · Expiration Date',
          showIf: is('co.statusDS', 'no'),
          question: t('¿Cuándo vence su estadía?', 'When does your status expire?'),
          notice: {
            tone: 'legal',
            title: t('Debe pedirse antes de esta fecha', 'It must be filed before this date'),
            body: t(
              'USCIS debe recibir el I-539 con este I-539A antes de que venza la fecha del I-94 del familiar. Si ya pasó, hable con un abogado antes de presentar: quedarse después de esa fecha puede causar un castigo de 3 o 10 años para volver.',
              'USCIS must receive the Form I-539 with this Form I-539A before the family member’s I-94 date expires. If it has passed, talk to an attorney before filing: staying past that date can lead to a 3- or 10-year bar on returning.',
            ),
          },
          fields: [date('co.i94.expires', 'Fecha en que vence (según su I-94)', 'Expiration date (per your I-94)', 'Part 2 · Item 8 · Expiration Date', true, 'date')],
        },
        {
          id: 'co.passportChanged',
          kind: 'choice',
          formRef: 'Part 2 · Item 9 · Current Passport Information',
          question: t('¿Tiene ahora un pasaporte distinto al que usó para entrar?', 'Is your current passport different from the one you gave in Item 7?'),
          options: yesNo,
        },
        {
          id: 'co.newPassport',
          kind: 'fields',
          formRef: 'Part 2 · Item 9 · Current Passport Information',
          showIf: is('co.passportChanged', 'yes'),
          question: t('Su pasaporte actual', 'Your current passport'),
          why: t('USCIS solo puede extender la estadía hasta la fecha en que vence el pasaporte, así que debe estar vigente.', 'USCIS can only extend the stay up to the passport’s expiration date, so it must be valid.'),
          fields: [
            text('co.newPassport.number', 'Número de pasaporte', 'Passport number', 'Part 2 · Item 9 · Passport Number', { maxLength: 30 }),
            text('co.newPassport.country', 'País que lo emitió', 'Country of passport issuance', 'Part 2 · Item 9 · Country of Passport Issuance'),
            date('co.newPassport.expires', 'Fecha de vencimiento', 'Passport expiration date', 'Part 2 · Item 9 · Passport Expiration Date', true, 'futureDate'),
          ],
        },
      ],
    },
    {
      id: 'additional',
      part: 'Part 3',
      title: t('Más sobre el familiar', 'Additional information about the family member'),
      questions: [
        {
          id: 'co.immigrant',
          kind: 'yesNoList',
          formRef: 'Part 3 · Items 1–3',
          question: t('Otros trámites de inmigración', 'Other immigration filings'),
          why: t('Un Sí no impide pedir la extensión, pero debe explicarlo. Ciertos estatus (como el B o el F) exigen que no tenga intención de inmigrar.', 'A Yes does not stop the request, but you must explain it. Some statuses (such as B or F) require that you not intend to immigrate.'),
          items: IMMIGRANT,
        },
        {
          id: 'co.background',
          kind: 'yesNoList',
          formRef: 'Part 3 · Items 4–16',
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
          items: BACKGROUND,
        },
        explain(
          'co.backgroundExplain',
          'co.background.explain',
          'Part 3 · Items 1–16 · Part 7. Additional Information',
          t('Explique cada Sí', 'Explain each Yes'),
          t('Para cada Sí: qué pasó, dónde y cuándo (en inglés)', 'For each Yes: what happened, where and when'),
          t('Para un arresto, adjunte los documentos de la policía y de la corte. Para una petición o I-485, ponga el tipo y el número de recibo.', 'For an arrest, attach the police and court records. For a petition or I-485, give the type and receipt number.'),
          { showIf: anyExplainedYes },
        ),
        {
          id: 'co.employed',
          kind: 'choice',
          formRef: 'Part 3 · Item 17',
          question: t('¿Ha trabajado en EE.UU. desde que entró o desde que le aprobaron su última extensión o cambio?', 'Have you ever been employed in the United States since last admitted or granted an extension or change of status?'),
          why: t('Con cualquiera de las dos respuestas, USCIS pide una explicación.', 'Either way, USCIS asks for an explanation.'),
          options: yesNo,
        },
        explain(
          'co.employedExplain',
          'co.employed.explain',
          'Part 3 · Item 17 · Part 7. Additional Information',
          t('Describa cada trabajo', 'Describe each job'),
          t('Empleador, dirección, fechas, ingreso semanal y si USCIS lo autorizó (en inglés)', 'Employer, address, dates, weekly income and whether USCIS authorized it'),
          t('Ponga todos los trabajos desde su última entrada o aprobación. Si trabajó sin permiso, hable con un abogado antes de presentar.', 'List every job since you were last admitted or approved. If you worked without authorization, talk to an attorney before filing.'),
          { showIf: is('co.employed', 'yes') },
        ),
        explain(
          'co.supportExplain',
          'co.support.explain',
          'Part 3 · Item 17 · Part 7. Additional Information',
          t('¿Cómo se mantiene económicamente?', 'How are you supporting yourself?'),
          t('De dónde viene el dinero, cuánto y por qué lo recibe (en inglés)', 'Source, amount and basis of your income'),
          t('Por ejemplo: lo mantiene el solicitante principal con su sueldo, ahorros o una beca. Adjunte pruebas (estados de cuenta, carta de empleo).', 'For example: the principal applicant supports you with their salary, savings or a scholarship. Attach evidence (bank statements, employment letter).'),
          { showIf: is('co.employed', 'no') },
        ),
        {
          id: 'co.exchangeVisitor',
          kind: 'choice',
          formRef: 'Part 3 · Item 18',
          question: t('¿Es o ha sido ALGUNA VEZ visitante de intercambio J-1, o dependiente J-2?', 'Are you currently or have you ever been a J-1 exchange visitor or a J-2 dependent of a J-1 exchange visitor?'),
          why: t('Algunos J-1 y J-2 deben regresar 2 años a su país antes de cambiar a ciertos estatus.', 'Some J-1s and J-2s must return home for 2 years before changing to certain statuses.'),
          options: yesNo,
        },
        explain(
          'co.exchangeExplain',
          'co.exchange.explain',
          'Part 3 · Item 18 · Part 7. Additional Information',
          t('¿Cuándo tuvo el estatus J-1 o J-2?', 'When did you hold J-1 or J-2 status?'),
          t('Fechas de inicio y fin de cada período (en inglés)', 'Start and end dates of each period'),
          t('Por ejemplo: J-2 from 06/01/2019 to 08/31/2020.', 'For example: J-2 from 06/01/2019 to 08/31/2020.'),
          { showIf: is('co.exchangeVisitor', 'yes') },
        ),
      ],
    },
    {
      id: 'contact',
      part: 'Part 4',
      title: t('Contacto y firma del familiar', 'The family member’s contact and signature'),
      questions: [
        {
          id: 'co.contact',
          kind: 'fields',
          formRef: 'Part 4 · Items 1–3 · Applicant’s Contact Information',
          question: t('¿Cómo puede contactarle USCIS?', 'How can USCIS contact you?'),
          why: t('Si es un niño, ponga el teléfono y correo de su padre o madre. El familiar firma la Parte 4, Ítem 4, a mano (o su padre o madre si es menor de 14).', 'For a child, give a parent’s phone and email. The family member signs Part 4, Item 4, by hand (or a parent if under 14).'),
          fields: [
            { id: 'co.phone', type: 'phone', required: true, label: { es: 'Teléfono de día', en: 'Daytime phone' }, formRef: 'Part 4 · Item 1 · Applicant’s Daytime Telephone Number', placeholder: '213 555 0123' },
            { id: 'co.mobile', type: 'phone', label: { es: 'Celular', en: 'Mobile phone' }, formRef: 'Part 4 · Item 2 · Applicant’s Mobile Telephone Number' },
            { id: 'co.email', type: 'email', label: { es: 'Correo electrónico', en: 'Email' }, formRef: 'Part 4 · Item 3 · Applicant’s Email Address' },
          ],
        },
        {
          id: 'readsEnglish',
          kind: 'choice',
          formRef: 'Part 4 · Applicant’s Certification',
          question: t('¿El familiar puede leer y entender el formulario en inglés?', 'Can the family member read and understand the form in English?'),
          why: t('Si alguien se lo leyó en otro idioma, esa persona llena la Parte 5 como intérprete.', 'If someone read it to them in another language, that person completes Part 5 as the interpreter.'),
          options: [
            { value: 'A', label: t('Sí, lo lee y entiende en inglés', 'Yes, they read and understand English') },
            { value: 'B', label: t('No, un intérprete se lo leyó en un idioma que domina', 'No, an interpreter read it to them in a language they are fluent in') },
          ],
        },
        {
          id: 'preparer',
          kind: 'choice',
          formRef: 'Part 6 · Person Preparing this Application, if Other Than the Applicant',
          question: t('¿Alguien que no es el familiar preparó este formulario?', 'Did someone other than the family member prepare this form?'),
          why: t('Por ejemplo, el solicitante principal que lo llena por su esposo/a o hijo/a, o un ayudante. Esa persona llena y firma la Parte 6.', 'For example, the principal applicant filling it in for their spouse or child, or a helper. That person completes and signs Part 6.'),
          options: yesNo,
        },
      ],
    },
    assistance,
  ],
};
