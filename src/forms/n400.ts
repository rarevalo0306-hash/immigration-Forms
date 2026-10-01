import type { Answers, Field, FormDefinition, Option, Question, YesNoItem } from './types';
import type { T } from '../i18n';

// Questions follow USCIS Form N-400, Application for Naturalization, edition 01/20/25.
// `formRef` gives the part, item number and the form's own English wording.
// src/pdf/n400Pdf.ts maps the answers onto that edition's fields.

export const N400_EDITION = '01/20/25';

const yesNo: Option[] = [
  { value: 'yes', label: { es: 'Sí', en: 'Yes' } },
  { value: 'no', label: { es: 'No', en: 'No' } },
];

const is = (id: string, ...values: string[]) => (a: Answers) => values.includes(String(a[id] ?? ''));
const all = (...tests: ((a: Answers) => boolean)[]) => (a: Answers) => tests.every((t) => t(a));
const num = (a: Answers, id: string) => Number(a[id] ?? 0) || 0;

/** Spouse-based filing looks back 3 years instead of 5. */
const lookBack: T = {
  es: 'los últimos 5 años (3 si presenta como cónyuge de ciudadano)',
  en: 'the last 5 years (3 if you file as the spouse of a U.S. citizen)',
};

const nameFields = (prefix: string, ref: string, required = true): Field[] => [
  { id: `${prefix}.family`, type: 'text', required, label: { es: 'Apellido(s)', en: 'Family name (last name)' }, formRef: `${ref} · Family Name (Last Name)` },
  { id: `${prefix}.given`, type: 'text', required, label: { es: 'Nombre(s)', en: 'Given name (first name)' }, formRef: `${ref} · Given Name (First Name)` },
  { id: `${prefix}.middle`, type: 'text', label: { es: 'Segundo nombre', en: 'Middle name' }, formRef: `${ref} · Middle Name (if applicable)` },
];

const usAddressFields = (prefix: string, ref: string): Field[] => [
  { id: `${prefix}.careOf`, type: 'text', label: { es: 'A cargo de (si recibe correo en casa de otra persona)', en: 'In care of (if you get mail at someone else’s home)' }, formRef: `${ref} · In Care Of Name` },
  { id: `${prefix}.street`, type: 'text', required: true, label: { es: 'Número y calle', en: 'Street number and name' }, formRef: `${ref} · Street Number and Name`, placeholder: '1234 Main St' },
  {
    id: `${prefix}.unit`,
    type: 'unit',
    label: { es: 'Apartamento, suite o piso', en: 'Apartment, suite or floor' },
    formRef: `${ref} · Apt. / Ste. / Flr. Number`,
    placeholder: 'Apt 4B',
    hint: { es: 'Por ejemplo: Apt 4B, Ste 200 o Flr 3.', en: 'For example: Apt 4B, Ste 200 or Flr 3.' },
  },
  { id: `${prefix}.city`, type: 'text', required: true, label: { es: 'Ciudad', en: 'City or town' }, formRef: `${ref} · City or Town` },
  { id: `${prefix}.state`, type: 'state', required: true, label: { es: 'Estado', en: 'State' }, formRef: `${ref} · State`, placeholder: 'CA', hint: { es: 'Dos letras, por ejemplo CA, TX o NY.', en: 'Two letters, for example CA, TX or NY.' } },
  { id: `${prefix}.zip`, type: 'zip', required: true, label: { es: 'Código postal (ZIP)', en: 'ZIP code' }, formRef: `${ref} · ZIP Code`, placeholder: '90210' },
];

/** A table row's place: free text, since it may be in the U.S. or abroad. */
const placeFields = (prefix: string, ref: string, required: boolean): Field[] => [
  { id: `${prefix}.city`, type: 'text', required, label: { es: 'Ciudad', en: 'City or town' }, formRef: `${ref} · City or Town` },
  { id: `${prefix}.state`, type: 'text', label: { es: 'Estado o provincia', en: 'State or province' }, formRef: `${ref} · State / Province` },
  { id: `${prefix}.zip`, type: 'text', label: { es: 'Código postal', en: 'ZIP or postal code' }, formRef: `${ref} · ZIP Code / Postal Code` },
  { id: `${prefix}.country`, type: 'text', required, label: { es: 'País', en: 'Country' }, formRef: `${ref} · Country`, placeholder: 'United States' },
];

const date = (id: string, es: string, en: string, formRef: string, required = true, type: Field['type'] = 'pastDate'): Field => ({
  id,
  type,
  required,
  label: { es, en },
  formRef,
  placeholder: 'MM/DD/AAAA',
});

/** "Is there another one?" chains for the form's tables, one row per screen. */
function rows(opts: {
  max: number;
  id: string;
  /** Whether the table applies at all (row 1 is shown when this holds). */
  first: (a: Answers) => boolean;
  question: (i: number) => T;
  more: T;
  moreWhy?: T;
  formRef: string;
  fields: (i: number) => Field[];
  why?: (i: number) => T | undefined;
  overflow: T;
}): Question[] {
  const out: Question[] = [];
  for (let i = 1; i <= opts.max; i++) {
    // Row i shows when the table applies and every earlier "another one?" was answered Yes.
    const shown = all(opts.first, (a) => [...Array(i - 1)].every((_, k) => a[`${opts.id}.more${k + 1}`] === 'yes'));
    out.push({ id: `${opts.id}${i}`, kind: 'fields', formRef: opts.formRef, question: opts.question(i), why: opts.why?.(i), showIf: shown, fields: opts.fields(i) });
    out.push({
      id: `${opts.id}.more${i}`,
      kind: 'choice',
      formRef: opts.formRef,
      question: opts.more,
      why: opts.moreWhy,
      showIf: shown,
      options: yesNo,
      ...(i === opts.max ? { notice: { tone: 'info' as const, title: { es: 'Espacio adicional', en: 'Extra space' }, body: opts.overflow } } : {}),
    });
  }
  return out;
}

const part14Overflow = (what: T): T => ({
  es: `El formulario tiene espacio solo para estas filas. Si tiene más ${what.es}, escríbalas a mano en la Parte 14 (Información adicional) del PDF.`,
  en: `The form only has room for these rows. If you have more ${what.en}, write them by hand in Part 14 (Additional Information) of the PDF.`,
});

const yn = (id: string, item: string, es: string, en: string, showIf?: (a: Answers) => boolean): YesNoItem => ({
  id,
  label: { es, en },
  formRef: `Part 9 · Item ${item}`,
  showIf,
});

/**
 * Part 9 answers that the form asks to explain in Part 14, with the page and item number the
 * explanation refers to. `when` is the answer that needs explaining.
 */
export interface Part9Explain {
  id: string;
  item: string;
  /** Page of the official PDF the item is on, for the Part 14 reference. */
  page: number;
  when: 'yes' | 'no';
}

const explainRows: [item: string, page: number, when: 'yes' | 'no'][] = [
  ['1', 6, 'yes'], ['2', 6, 'yes'], ['3', 6, 'yes'], ['4', 6, 'yes'], ['5.a', 6, 'yes'], ['5.b', 6, 'yes'],
  ['6.a', 7, 'yes'], ['6.b', 7, 'yes'], ['6.c', 7, 'yes'],
  ['7.a', 7, 'yes'], ['7.b', 7, 'yes'], ['7.c', 7, 'yes'], ['7.d', 7, 'yes'], ['7.e', 7, 'yes'], ['7.f', 7, 'yes'], ['7.g', 7, 'yes'],
  ['8.a', 7, 'yes'], ['8.b', 7, 'yes'], ['9', 7, 'yes'], ['10.a', 7, 'yes'], ['10.b', 7, 'yes'], ['10.c', 7, 'yes'],
  ['11', 7, 'yes'], ['12', 7, 'yes'], ['13', 7, 'yes'], ['14', 7, 'yes'],
  ['16', 8, 'no'],
  ['17.a', 9, 'yes'], ['17.b', 9, 'yes'], ['17.c', 9, 'yes'], ['17.d', 9, 'yes'], ['17.e', 9, 'yes'], ['17.f', 9, 'yes'], ['17.g', 9, 'yes'], ['17.h', 9, 'yes'],
  ['18', 9, 'yes'], ['19', 9, 'yes'], ['20', 9, 'yes'], ['21', 9, 'yes'], ['22.b', 9, 'no'], ['23', 9, 'yes'], ['24', 9, 'yes'],
  ['27', 10, 'yes'], ['28', 10, 'yes'], ['29', 10, 'yes'], ['30.a', 10, 'yes'],
  ['31', 10, 'no'], ['32', 10, 'no'], ['34', 10, 'no'], ['35', 10, 'no'], ['36', 10, 'no'], ['37', 10, 'no'],
];

/**
 * Part 9 answers that the form asks to explain in Part 14 (Additional Information), in form order,
 * with the page the item is on. `when` is the answer that needs explaining.
 */
export const part9Explain: Part9Explain[] = explainRows.map(([item, page, when]) => ({ id: `p9.${item}`, item, page, when }));

/** The Part 9 answers, in form order, that need an explanation. */
export function flaggedPart9(a: Answers) {
  return part9Explain.filter((e) => a[e.id] === e.when);
}

const PART14_BLOCKS = 4;

const anyCrime = (a: Answers) => a['p9.15.a'] === 'yes' || a['p9.15.b'] === 'yes';
const male = is('sex', 'male');
const served = is('p9.25', 'yes');

const legal: Question['notice'] = {
  tone: 'legal',
  title: { es: 'Esto no es asesoría legal', en: 'This is not legal advice' },
  body: {
    es: 'Responda con la verdad: una respuesta falsa puede costarle la ciudadanía. Si alguna respuesta es Sí, o no está seguro/a, hable con un abogado de inmigración o un representante acreditado (DOJ) antes de presentar el formulario.',
    en: 'Answer truthfully: a false answer can cost you citizenship. If any answer is Yes, or you’re not sure, talk to an immigration attorney or a DOJ-accredited representative before you file.',
  },
};

export const eligibilityOptions: Option[] = [
  { value: 'A', label: { es: 'Residente permanente por al menos 5 años', en: 'Permanent resident for at least 5 years' } },
  { value: 'B', label: { es: 'Residente permanente por 3 años, casado/a y viviendo con un ciudadano de EE.UU. esos 3 años', en: 'Permanent resident for 3 years, married to and living with a U.S. citizen for those 3 years' } },
  { value: 'C', label: { es: 'VAWA: cónyuge, excónyuge o hijo/a maltratado/a por un ciudadano de EE.UU.', en: 'VAWA: battered spouse, former spouse or child of a U.S. citizen' } },
  { value: 'D', label: { es: 'Cónyuge de ciudadano que trabaja para un empleador calificado fuera de EE.UU.', en: 'Spouse of a U.S. citizen working for a qualified employer abroad' } },
  { value: 'E', label: { es: 'Servicio militar durante un período de hostilidades', en: 'Military service during a period of hostilities' } },
  { value: 'F', label: { es: 'Al menos un año de servicio militar honorable', en: 'At least one year of honorable military service' } },
  { value: 'G', label: { es: 'Otra razón', en: 'Another reason' } },
];

const spouseFiling = is('eligibility', 'B', 'D');
const married = is('marital', 'married', 'separated');

export const n400: FormDefinition = {
  id: 'n-400',
  number: 'N-400',
  edition: N400_EDITION,
  title: { es: 'Solicitud de ciudadanía', en: 'Application for Naturalization' },
  summary: {
    es: 'Hágase ciudadano/a de EE.UU. si es residente permanente desde hace 5 años (3 si está casado/a con un ciudadano).',
    en: 'Become a U.S. citizen if you have been a permanent resident for 5 years (3 if married to a U.S. citizen).',
  },
  intro: {
    es: 'El N-400 pide a USCIS la ciudadanía de EE.UU. Le preguntaremos sobre usted, dónde ha vivido y trabajado, sus viajes, su familia y su historial. Tenga a mano su tarjeta de residente (green card), sus fechas de viaje y sus direcciones de los últimos 5 años.',
    en: 'Form N-400 asks USCIS for U.S. citizenship. We’ll ask about you, where you’ve lived and worked, your trips, your family and your history. Have your green card, your travel dates and your addresses from the last 5 years at hand.',
  },
  minutes: 60,
  pdf: {
    path: 'forms/n-400.pdf',
    fileName: 'N-400-filled.pdf',
    load: () => import('../pdf/n400Pdf').then((m) => m.fillN400),
    signHere: { es: 'Parte 11, Ítem 4', en: 'Part 11, Item 4' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/n-400 que la edición {edition} sigue vigente; si cambió, use la nueva y copie sus respuestas de esta hoja.',
      'Revise el PDF página por página. Lo que no cupo (más direcciones, trabajos, viajes, hijos o explicaciones) va a mano en la Parte 14.',
      'Revise la tarifa actual en uscis.gov/g-1055. Si pidió una tarifa reducida, adjunte las pruebas de sus ingresos.',
      'Imprima el PDF y firme la Parte 11, Ítem 4, a mano con tinta negra. No llene las Partes 15 y 16: se firman en la entrevista.',
      'Adjunte una copia de ambos lados de su green card y los documentos que piden las instrucciones para su caso.',
    ],
    en: [
      'Check at uscis.gov/n-400 that edition {edition} is still current; if it changed, use the new one and copy your answers from this sheet.',
      'Check the PDF page by page. Anything that didn’t fit (more addresses, jobs, trips, children or explanations) goes by hand in Part 14.',
      'Check the current fee at uscis.gov/g-1055. If you asked for a reduced fee, attach proof of your income.',
      'Print the PDF and sign Part 11, Item 4, by hand in black ink. Leave Parts 15 and 16 blank: they are signed at the interview.',
      'Attach a copy of both sides of your green card and the documents the instructions ask for in your case.',
    ],
  },
  sections: [
    {
      id: 'eligibility',
      part: 'Part 1',
      title: { es: 'Elegibilidad', en: 'Eligibility' },
      questions: [
        {
          id: 'eligibility',
          kind: 'choice',
          formRef: 'Part 1 · Item 1 · Reason for Filing',
          question: { es: '¿Por qué puede pedir la ciudadanía?', en: 'Why can you apply for citizenship?' },
          why: {
            es: 'Elija solo una. Puede presentar el N-400 hasta 90 días antes de cumplir los 5 (o 3) años como residente.',
            en: 'Choose only one. You can file up to 90 days before you reach 5 (or 3) years as a resident.',
          },
          notice: {
            tone: 'info',
            title: { es: '¿Su padre o madre es ciudadano?', en: 'Is your mother or father a citizen?' },
            body: {
              es: 'Si su padre o madre era ciudadano de EE.UU. antes de que usted cumpliera 18 años, quizás ya sea ciudadano/a y no necesite este formulario (vea el N-600).',
              en: 'If your mother or father was a U.S. citizen before you turned 18, you may already be a citizen and not need this form (see Form N-600).',
            },
          },
          options: eligibilityOptions,
        },
        {
          id: 'eligibilityOther',
          kind: 'fields',
          formRef: 'Part 1 · Item 1.g · Other Reason for Filing',
          showIf: is('eligibility', 'G'),
          question: { es: '¿Cuál es la razón?', en: 'What is the reason?' },
          fields: [{ id: 'eligibility.other', type: 'text', required: true, label: { es: 'Razón', en: 'Reason' }, formRef: 'Part 1 · Item 1.g · Other Reason for Filing Not Listed Above' }],
        },
        {
          id: 'aNumberQ',
          kind: 'fields',
          formRef: 'Part 1 · A-Number',
          question: { es: '¿Cuál es su número de extranjero (A-Number)?', en: 'What is your A-Number?' },
          why: { es: 'Está en su green card, como "USCIS#". Va arriba de cada página del formulario.', en: 'It’s on your green card, as "USCIS#". It goes at the top of every page of the form.' },
          fields: [{ id: 'aNumber', type: 'aNumber', required: true, label: { es: 'A-Number', en: 'A-Number' }, formRef: 'Part 1 · Your 9 Digit A-Number', placeholder: 'A123456789' }],
        },
      ],
    },
    {
      id: 'about',
      part: 'Part 2',
      title: { es: 'Información personal', en: 'About you' },
      questions: [
        {
          id: 'name',
          kind: 'fields',
          formRef: 'Part 2 · Item 1 · Your Current Legal Name',
          question: { es: '¿Cuál es su nombre legal actual?', en: 'What is your current legal name?' },
          why: { es: 'Como aparece en su green card o en un documento legal de cambio de nombre. No use apodos.', en: 'As it appears on your green card or a legal name-change document. Don’t use a nickname.' },
          notice: {
            tone: 'info',
            title: { es: 'Responda en inglés', en: 'Answer in English' },
            body: { es: 'Use letras latinas y no traduzca su nombre. Los acentos se quitan al llenar el PDF.', en: 'Use Latin letters and don’t translate your name. Accents are removed when the PDF is filled.' },
          },
          fields: nameFields('name', 'Part 2 · Item 1'),
        },
        {
          id: 'hasOtherNames',
          kind: 'choice',
          formRef: 'Part 2 · Item 2 · Other Names You Have Used Since Birth',
          question: { es: '¿Ha usado otros nombres desde que nació?', en: 'Have you used any other names since birth?' },
          why: { es: 'Por ejemplo, su apellido de soltera, apodos o nombres con otra ortografía.', en: 'For example, your maiden name, nicknames or other spellings.' },
          options: yesNo,
        },
        {
          id: 'otherName1',
          kind: 'fields',
          formRef: 'Part 2 · Item 2 · Other Names Used',
          showIf: is('hasOtherNames', 'yes'),
          question: { es: '¿Qué otro nombre ha usado?', en: 'What other name have you used?' },
          fields: nameFields('otherName1', 'Part 2 · Item 2 (line 1)'),
        },
        {
          id: 'hasOtherNames2',
          kind: 'choice',
          formRef: 'Part 2 · Item 2 · Other Names Used',
          showIf: is('hasOtherNames', 'yes'),
          question: { es: '¿Ha usado otro nombre más?', en: 'Have you used another name?' },
          options: yesNo,
        },
        {
          id: 'otherName2',
          kind: 'fields',
          formRef: 'Part 2 · Item 2 · Other Names Used',
          showIf: all(is('hasOtherNames', 'yes'), is('hasOtherNames2', 'yes')),
          question: { es: '¿Qué otro nombre ha usado?', en: 'What other name have you used?' },
          why: { es: 'Si usó más de dos, escriba los demás a mano en la Parte 14.', en: 'If you used more than two, write the rest by hand in Part 14.' },
          fields: nameFields('otherName2', 'Part 2 · Item 2 (line 2)'),
        },
        {
          id: 'nameChange',
          kind: 'choice',
          formRef: 'Part 2 · Item 3 · Would you like to legally change your name?',
          question: { es: '¿Quiere cambiar legalmente su nombre al hacerse ciudadano/a?', en: 'Do you want to legally change your name when you become a citizen?' },
          why: { es: 'Es opcional. En algunos lugares el cambio solo lo puede hacer un juez en la ceremonia.', en: 'It’s optional. In some places only a judge can make the change, at the ceremony.' },
          options: yesNo,
        },
        {
          id: 'newName',
          kind: 'fields',
          formRef: 'Part 2 · Item 3 · New Name',
          showIf: is('nameChange', 'yes'),
          question: { es: '¿Qué nombre quiere usar?', en: 'What name do you want to use?' },
          fields: nameFields('newName', 'Part 2 · Item 3'),
        },
        {
          id: 'basics',
          kind: 'fields',
          formRef: 'Part 2 · Items 4, 6–9',
          question: { es: 'Datos de su green card', en: 'Details from your green card' },
          why: { es: 'Casi todo aparece en su tarjeta de residente permanente.', en: 'Almost all of this is on your permanent resident card.' },
          fields: [
            date('dob', 'Fecha de nacimiento', 'Date of birth', 'Part 2 · Item 6 · Date of Birth (mm/dd/yyyy)'),
            date('lprDate', 'Fecha en que se hizo residente permanente', 'Date you became a permanent resident', 'Part 2 · Item 7 · Date You Became a Lawful Permanent Resident', true),
            { id: 'birthCountry', type: 'text', required: true, label: { es: 'País de nacimiento', en: 'Country of birth' }, formRef: 'Part 2 · Item 8 · Country of Birth', placeholder: 'Mexico' },
            { id: 'citizenship', type: 'text', required: true, label: { es: 'País de ciudadanía o nacionalidad', en: 'Country of citizenship or nationality' }, formRef: 'Part 2 · Item 9 · Country of Citizenship or Nationality', placeholder: 'Mexico' },
            { id: 'uscisAccount', type: 'uscisAccount', label: { es: 'Número de cuenta en línea de USCIS', en: 'USCIS online account number' }, formRef: 'Part 2 · Item 4 · USCIS Online Account Number' },
          ],
        },
        {
          id: 'sex',
          kind: 'choice',
          formRef: 'Part 2 · Item 5 · Sex',
          question: { es: '¿Qué sexo aparece en sus documentos?', en: 'What sex is on your documents?' },
          options: [
            { value: 'female', label: { es: 'Femenino', en: 'Female' } },
            { value: 'male', label: { es: 'Masculino', en: 'Male' } },
          ],
        },
        {
          id: 'parentCitizen',
          kind: 'choice',
          formRef: 'Part 2 · Item 10 · Was your mother or father a U.S. citizen before your 18th birthday?',
          question: { es: '¿Su padre o madre era ciudadano de EE.UU. antes de que usted cumpliera 18 años?', en: 'Was your mother or father a U.S. citizen before your 18th birthday?' },
          why: { es: 'Incluye padres adoptivos. Si es así, quizás ya sea ciudadano/a: consulte el N-600 antes de seguir.', en: 'Includes adoptive parents. If so, you may already be a citizen: look at Form N-600 before you go on.' },
          options: yesNo,
        },
        {
          id: 'disability',
          kind: 'choice',
          formRef: 'Part 2 · Item 11 · Disability exception (Form N-648)',
          question: {
            es: '¿Tiene una discapacidad que le impide demostrar su inglés o su conocimiento de cívica?',
            en: 'Do you have a disability that prevents you from showing your English or civics knowledge?',
          },
          why: {
            es: 'Si responde Sí, debe enviar el Formulario N-648 llenado por un médico junto con el N-400.',
            en: 'If you answer Yes, you must send Form N-648, completed by a doctor, with your N-400.',
          },
          options: yesNo,
        },
        {
          id: 'ssaCard',
          kind: 'choice',
          formRef: 'Part 2 · Item 12.a · Social Security Update',
          question: { es: '¿Quiere que el Seguro Social le envíe una tarjeta nueva y actualice su estatus cuando sea ciudadano/a?', en: 'Do you want Social Security to send you a new card and update your status when you become a citizen?' },
          options: yesNo,
        },
        {
          id: 'ssnQ',
          kind: 'fields',
          formRef: 'Part 2 · Item 12.b · Social Security Number',
          showIf: is('ssaCard', 'yes'),
          question: { es: '¿Cuál es su número de Seguro Social?', en: 'What is your Social Security number?' },
          fields: [{ id: 'ssn', type: 'ssn', label: { es: 'Número de Seguro Social', en: 'Social Security number' }, formRef: 'Part 2 · Item 12.b · Social Security Number (if any)', placeholder: '123-45-6789' }],
        },
        {
          id: 'ssaConsent',
          kind: 'choice',
          formRef: 'Part 2 · Item 12.c · Consent for Disclosure',
          showIf: is('ssaCard', 'yes'),
          question: { es: '¿Permite que USCIS comparta sus datos con el Seguro Social para hacer la tarjeta?', en: 'Do you allow USCIS to share your information with Social Security to make the card?' },
          why: { es: 'Debe responder Sí para recibir la tarjeta.', en: 'You must answer Yes to receive the card.' },
          options: yesNo,
        },
      ],
    },
    {
      id: 'biographic',
      part: 'Part 3',
      title: { es: 'Datos biográficos', en: 'Biographic information' },
      questions: [
        {
          id: 'ethnicity',
          kind: 'choice',
          formRef: 'Part 3 · Item 1 · Ethnicity',
          question: { es: '¿Es usted hispano/a o latino/a?', en: 'Are you Hispanic or Latino?' },
          why: { es: 'USCIS lo usa para la revisión de antecedentes.', en: 'USCIS uses it for background checks.' },
          options: [
            { value: 'hispanic', label: { es: 'Hispano/a o latino/a', en: 'Hispanic or Latino' } },
            { value: 'notHispanic', label: { es: 'No hispano/a ni latino/a', en: 'Not Hispanic or Latino' } },
          ],
        },
        {
          id: 'race',
          kind: 'choice',
          multiple: true,
          formRef: 'Part 3 · Item 2 · Race (select all applicable boxes)',
          question: { es: '¿Cuál es su raza?', en: 'What is your race?' },
          why: { es: 'Elija todas las que apliquen.', en: 'Choose all that apply.' },
          options: [
            { value: 'indian', label: { es: 'Indígena americano/a o nativo/a de Alaska', en: 'American Indian or Alaska Native' } },
            { value: 'asian', label: { es: 'Asiático/a', en: 'Asian' } },
            { value: 'black', label: { es: 'Negro/a o afroamericano/a', en: 'Black or African American' } },
            { value: 'pacific', label: { es: 'Nativo/a de Hawái u otras islas del Pacífico', en: 'Native Hawaiian or Other Pacific Islander' } },
            { value: 'white', label: { es: 'Blanco/a', en: 'White' } },
          ],
        },
        {
          id: 'body',
          kind: 'fields',
          formRef: 'Part 3 · Items 3–4 · Height and Weight',
          question: { es: '¿Cuánto mide y cuánto pesa?', en: 'How tall are you and how much do you weigh?' },
          why: { es: 'En pies, pulgadas y libras. 1.60 m son 5 pies 3 pulgadas; 70 kg son 154 libras.', en: 'In feet, inches and pounds.' },
          fields: [
            { id: 'heightFeet', type: 'select', required: true, label: { es: 'Pies', en: 'Feet' }, formRef: 'Part 3 · Item 3 · Height (Feet)', options: ['2', '3', '4', '5', '6', '7', '8'].map((v) => ({ value: v, label: { es: v, en: v } })) },
            { id: 'heightInches', type: 'select', required: true, label: { es: 'Pulgadas', en: 'Inches' }, formRef: 'Part 3 · Item 3 · Height (Inches)', options: [...Array(12)].map((_, i) => ({ value: String(i), label: { es: String(i), en: String(i) } })) },
            { id: 'weight', type: 'number', required: true, label: { es: 'Peso en libras', en: 'Weight in pounds' }, formRef: 'Part 3 · Item 4 · Weight (Pounds)', maxLength: 3, placeholder: '154' },
          ],
        },
        {
          id: 'eyes',
          kind: 'choice',
          formRef: 'Part 3 · Item 5 · Eye Color',
          question: { es: '¿De qué color son sus ojos?', en: 'What color are your eyes?' },
          options: [
            { value: 'BRO', label: { es: 'Café', en: 'Brown' } },
            { value: 'BLK', label: { es: 'Negro', en: 'Black' } },
            { value: 'HAZ', label: { es: 'Avellana (hazel)', en: 'Hazel' } },
            { value: 'GRN', label: { es: 'Verde', en: 'Green' } },
            { value: 'BLU', label: { es: 'Azul', en: 'Blue' } },
            { value: 'GRY', label: { es: 'Gris', en: 'Gray' } },
            { value: 'MAR', label: { es: 'Granate', en: 'Maroon' } },
            { value: 'PNK', label: { es: 'Rosado', en: 'Pink' } },
            { value: 'XXX', label: { es: 'Desconocido u otro', en: 'Unknown / Other' } },
          ],
        },
        {
          id: 'hair',
          kind: 'choice',
          formRef: 'Part 3 · Item 6 · Hair Color',
          question: { es: '¿De qué color es su cabello?', en: 'What color is your hair?' },
          options: [
            { value: 'BLK', label: { es: 'Negro', en: 'Black' } },
            { value: 'BRO', label: { es: 'Café', en: 'Brown' } },
            { value: 'BLN', label: { es: 'Rubio', en: 'Blond' } },
            { value: 'GRY', label: { es: 'Gris', en: 'Gray' } },
            { value: 'WHI', label: { es: 'Blanco', en: 'White' } },
            { value: 'RED', label: { es: 'Rojo', en: 'Red' } },
            { value: 'SDY', label: { es: 'Rubio rojizo (sandy)', en: 'Sandy' } },
            { value: 'BAL', label: { es: 'Calvo/a (sin cabello)', en: 'Bald (no hair)' } },
            { value: 'XXX', label: { es: 'Desconocido u otro', en: 'Unknown / Other' } },
          ],
        },
      ],
    },
    {
      id: 'residence',
      part: 'Part 4',
      title: { es: 'Dónde ha vivido', en: 'Where you have lived' },
      questions: [
        {
          id: 'home',
          kind: 'fields',
          formRef: 'Part 4 · Item 1 · Current Physical Address',
          question: { es: '¿Dónde vive ahora?', en: 'Where do you live now?' },
          fields: [...usAddressFields('home', 'Part 4 · Item 1'), date('home.from', 'Vive aquí desde', 'Living here since', 'Part 4 · Item 1 · Dates of Residence: From (mm/dd/yyyy)')],
        },
        {
          id: 'prevHome.more0',
          kind: 'choice',
          formRef: 'Part 4 · Item 1 · Physical Addresses',
          question: { es: `¿Vivió en otra dirección en ${lookBack.es}?`, en: `Did you live at another address in ${lookBack.en}?` },
          why: { es: 'Incluya cada dirección, de la más reciente a la más antigua.', en: 'Include every address, from the most recent to the oldest.' },
          options: yesNo,
        },
        ...rows({
          max: 3,
          id: 'prevHome',
          first: is('prevHome.more0', 'yes'),
          question: (i) => (i === 1 ? { es: '¿Dónde vivía antes?', en: 'Where did you live before?' } : { es: '¿Y antes de eso?', en: 'And before that?' }),
          more: { es: `¿Vivió en otra dirección en ${lookBack.es}?`, en: `Did you live at another address in ${lookBack.en}?` },
          formRef: 'Part 4 · Item 1 · Physical Addresses',
          fields: (i) => [
            { id: `prevHome${i}.street`, type: 'text', required: true, label: { es: 'Dirección (número, calle y apartamento)', en: 'Address (number, street and apartment)' }, formRef: `Part 4 · Item 1 · Physical Address (row ${i})` },
            ...placeFields(`prevHome${i}`, `Part 4 · Item 1 (row ${i})`, true),
            date(`prevHome${i}.from`, 'Desde', 'From', `Part 4 · Item 1 (row ${i}) · Dates of Residence From`),
            date(`prevHome${i}.to`, 'Hasta', 'To', `Part 4 · Item 1 (row ${i}) · Dates of Residence To`),
          ],
          overflow: part14Overflow({ es: 'direcciones', en: 'addresses' }),
        }),
        {
          id: 'mailingSame',
          kind: 'choice',
          formRef: 'Part 4 · Item 2 · Is your current physical address also your current mailing address?',
          question: { es: '¿Recibe su correo en la dirección donde vive?', en: 'Do you get your mail where you live?' },
          options: yesNo,
        },
        {
          id: 'mailing',
          kind: 'fields',
          formRef: 'Part 4 · Item 3 · Current Mailing Address',
          showIf: is('mailingSame', 'no'),
          question: { es: '¿A qué dirección le llega el correo?', en: 'Where do you get your mail?' },
          fields: usAddressFields('mailing', 'Part 4 · Item 3'),
        },
      ],
    },
    {
      id: 'marital',
      part: 'Part 5',
      title: { es: 'Estado civil', en: 'Marital history' },
      questions: [
        {
          id: 'marital',
          kind: 'choice',
          formRef: 'Part 5 · Item 1 · Current Marital Status',
          question: { es: '¿Cuál es su estado civil?', en: 'What is your marital status?' },
          options: [
            { value: 'single', label: { es: 'Soltero/a, nunca casado/a', en: 'Single, never married' } },
            { value: 'married', label: { es: 'Casado/a', en: 'Married' } },
            { value: 'separated', label: { es: 'Separado/a', en: 'Separated' } },
            { value: 'divorced', label: { es: 'Divorciado/a', en: 'Divorced' } },
            { value: 'widowed', label: { es: 'Viudo/a', en: 'Widowed' } },
            { value: 'annulled', label: { es: 'Matrimonio anulado', en: 'Marriage annulled' } },
          ],
        },
        {
          id: 'spouseMilitary',
          kind: 'choice',
          formRef: 'Part 5 · Item 2 · Is your spouse a current member of the U.S. armed forces?',
          showIf: married,
          question: { es: '¿Su cónyuge está en las fuerzas armadas de EE.UU.?', en: 'Is your spouse in the U.S. armed forces?' },
          options: yesNo,
        },
        {
          id: 'timesMarriedQ',
          kind: 'fields',
          formRef: 'Part 5 · Item 3 · How many times have you been married?',
          showIf: (a) => !!a.marital && a.marital !== 'single',
          question: { es: '¿Cuántas veces se ha casado?', en: 'How many times have you been married?' },
          why: { es: 'Cuente todos sus matrimonios, incluido el actual y los anulados.', en: 'Count all your marriages, including the current one and annulled ones.' },
          fields: [{ id: 'timesMarried', type: 'number', required: true, label: { es: 'Número de matrimonios', en: 'Number of marriages' }, formRef: 'Part 5 · Item 3', maxLength: 3, placeholder: '1' }],
        },
        {
          id: 'spouse',
          kind: 'fields',
          formRef: 'Part 5 · Items 4.a–4.c · Your Current Spouse',
          showIf: all(married, spouseFiling),
          question: { es: 'Sobre su cónyuge actual', en: 'About your current spouse' },
          fields: [
            ...nameFields('spouse', 'Part 5 · Item 4.a'),
            date('spouse.dob', 'Fecha de nacimiento de su cónyuge', 'Your spouse’s date of birth', 'Part 5 · Item 4.b · Current Spouse’s Date of Birth'),
            date('spouse.married', 'Fecha en que se casaron', 'Date you married', 'Part 5 · Item 4.c · Date You Entered into Marriage with Current Spouse'),
            { id: 'spouse.aNumber', type: 'aNumber', label: { es: 'A-Number de su cónyuge', en: 'Your spouse’s A-Number' }, formRef: 'Part 5 · Item 6 · Current Spouse’s A-Number (if any)' },
            { id: 'spouse.timesMarried', type: 'number', required: true, label: { es: '¿Cuántas veces se ha casado su cónyuge?', en: 'How many times has your spouse been married?' }, formRef: 'Part 5 · Item 7', maxLength: 3 },
          ],
        },
        {
          id: 'spouseSameAddress',
          kind: 'choice',
          formRef: 'Part 5 · Item 4.d · Is your current spouse’s present physical address the same as yours?',
          showIf: all(married, spouseFiling),
          question: { es: '¿Su cónyuge vive en su misma dirección?', en: 'Does your spouse live at your address?' },
          why: { es: 'Si responde No, escriba la dirección de su cónyuge a mano en la Parte 14.', en: 'If you answer No, write your spouse’s address by hand in Part 14.' },
          options: yesNo,
        },
        {
          id: 'spouseCitizenHow',
          kind: 'choice',
          formRef: 'Part 5 · Item 5.a · When did your current spouse become a U.S. citizen?',
          showIf: all(married, spouseFiling),
          question: { es: '¿Cómo se hizo ciudadano/a su cónyuge?', en: 'How did your spouse become a citizen?' },
          options: [
            { value: 'birth', label: { es: 'Nació en EE.UU.', en: 'Born in the United States' } },
            { value: 'other', label: { es: 'De otra forma (naturalización, por sus padres…)', en: 'Another way (naturalization, through parents…)' } },
          ],
        },
        {
          id: 'spouseCitizenDateQ',
          kind: 'fields',
          formRef: 'Part 5 · Item 5.b',
          showIf: all(married, spouseFiling, is('spouseCitizenHow', 'other')),
          question: { es: '¿Cuándo se hizo ciudadano/a su cónyuge?', en: 'When did your spouse become a citizen?' },
          fields: [date('spouse.citizenDate', 'Fecha', 'Date', 'Part 5 · Item 5.b · Date Your Current Spouse Became a U.S. Citizen')],
        },
        {
          id: 'spouseEmployerQ',
          kind: 'fields',
          formRef: 'Part 5 · Item 8',
          showIf: all(married, is('eligibility', 'D')),
          question: { es: '¿Dónde trabaja su cónyuge?', en: 'Where does your spouse work?' },
          fields: [{ id: 'spouse.employer', type: 'text', required: true, label: { es: 'Empleador o compañía', en: 'Employer or company' }, formRef: 'Part 5 · Item 8 · Current Spouse’s Current Employer or Company' }],
        },
      ],
    },
    {
      id: 'children',
      part: 'Part 6',
      title: { es: 'Hijos', en: 'Children' },
      questions: [
        {
          id: 'childrenQ',
          kind: 'fields',
          formRef: 'Part 6 · Item 1',
          question: { es: '¿Cuántos hijos menores de 18 años tiene?', en: 'How many children under 18 do you have?' },
          why: { es: 'Incluya hijos biológicos, adoptados y hijastros. Si no tiene, escriba 0.', en: 'Include biological, adopted and stepchildren. If you have none, enter 0.' },
          fields: [{ id: 'childrenCount', type: 'number', required: true, label: { es: 'Número de hijos', en: 'Number of children' }, formRef: 'Part 6 · Item 1 · Total number of children under 18 years of age', maxLength: 3, placeholder: '0' }],
        },
        ...[1, 2, 3].map(
          (i): Question => ({
            id: `child${i}`,
            kind: 'fields',
            formRef: `Part 6 · Item 2 (row ${i})`,
            showIf: (a) => num(a, 'childrenCount') >= i,
            question: { es: `Su hijo/a número ${i}`, en: `Your child number ${i}` },
            why: i === 3 ? { es: 'Si tiene más de 3, escriba los demás a mano en la Parte 14.', en: 'If you have more than 3, write the rest by hand in Part 14.' } : undefined,
            fields: [
              { id: `child${i}.name`, type: 'text', required: true, label: { es: 'Nombre y apellido', en: 'First and family name' }, formRef: `Part 6 · Item 2 (row ${i}) · Son or Daughter’s Name` },
              date(`child${i}.dob`, 'Fecha de nacimiento', 'Date of birth', `Part 6 · Item 2 (row ${i}) · Date of Birth`),
              {
                id: `child${i}.residence`,
                type: 'select',
                required: true,
                label: { es: '¿Dónde vive?', en: 'Where does the child live?' },
                formRef: `Part 6 · Item 2 (row ${i}) · Residence`,
                options: [
                  { value: 'resides with me', label: { es: 'Vive conmigo', en: 'Resides with me' } },
                  { value: 'does not reside with me', label: { es: 'No vive conmigo', en: 'Does not reside with me' } },
                  { value: 'unknown/missing', label: { es: 'Desconocido / desaparecido', en: 'Unknown / missing' } },
                ],
              },
              {
                id: `child${i}.relationship`,
                type: 'select',
                required: true,
                label: { es: 'Relación', en: 'Relationship' },
                formRef: `Part 6 · Item 2 (row ${i}) · Relationship`,
                options: [
                  { value: 'biological son or daughter', label: { es: 'Hijo/a biológico/a', en: 'Biological son or daughter' } },
                  { value: 'stepchild', label: { es: 'Hijastro/a', en: 'Stepchild' } },
                  { value: 'legally adopted son or daughter', label: { es: 'Hijo/a adoptado/a legalmente', en: 'Legally adopted son or daughter' } },
                ],
              },
              { id: `child${i}.support`, type: 'select', required: true, label: { es: '¿Le da manutención?', en: 'Are you providing support?' }, formRef: `Part 6 · Item 2 (row ${i}) · Are you providing support?`, options: yesNo },
            ],
          }),
        ),
      ],
    },
    {
      id: 'work',
      part: 'Part 7',
      title: { es: 'Trabajo y estudios', en: 'Employment and schools' },
      questions: rows({
        max: 3,
        id: 'job',
        first: () => true,
        question: (i) => (i === 1 ? { es: '¿Dónde trabaja o estudia ahora?', en: 'Where do you work or study now?' } : { es: '¿Dónde trabajó o estudió antes?', en: 'Where did you work or study before?' }),
        why: (i) =>
          i === 1
            ? {
                es: 'Si trabaja por su cuenta, escriba "self-employed". Si no trabaja, "unemployed"; si está jubilado/a, "retired".',
                en: 'If you work for yourself, write "self-employed". If you don’t work, "unemployed"; if retired, "retired".',
              }
            : undefined,
        more: { es: `¿Tuvo otro trabajo, escuela o tiempo sin empleo en ${lookBack.es}?`, en: `Did you have another job, school or time without work in ${lookBack.en}?` },
        formRef: 'Part 7 · Item 1 · Employment and Schools',
        fields: (i) => [
          { id: `job${i}.name`, type: 'text', required: true, label: { es: 'Empleador o escuela', en: 'Employer or school' }, formRef: `Part 7 · Item 1 (row ${i}) · Employer or School Name` },
          ...placeFields(`job${i}`, `Part 7 · Item 1 (row ${i})`, false),
          date(`job${i}.from`, 'Desde', 'From', `Part 7 · Item 1 (row ${i}) · Dates From`),
          ...(i === 1 ? [] : [date(`job${i}.to`, 'Hasta', 'To', `Part 7 · Item 1 (row ${i}) · Dates To`)]),
          { id: `job${i}.occupation`, type: 'text', required: true, label: { es: 'Ocupación o carrera', en: 'Occupation or field of study' }, formRef: `Part 7 · Item 1 (row ${i}) · Occupation or Field of Study` },
        ],
        overflow: part14Overflow({ es: 'trabajos o escuelas', en: 'jobs or schools' }),
      }),
    },
    {
      id: 'trips',
      part: 'Part 8',
      title: { es: 'Viajes fuera de EE.UU.', en: 'Time outside the U.S.' },
      questions: [
        {
          id: 'trip.more0',
          kind: 'choice',
          formRef: 'Part 8 · Item 1 · Trips Outside the United States',
          question: { es: `¿Ha viajado fuera de EE.UU. en ${lookBack.es}?`, en: `Have you traveled outside the U.S. in ${lookBack.en}?` },
          why: { es: 'No cuente viajes de menos de 24 horas.', en: 'Don’t count trips shorter than 24 hours.' },
          notice: {
            tone: 'info',
            title: { es: 'Viajes de más de 6 meses', en: 'Trips longer than 6 months' },
            body: {
              es: 'Un viaje de más de 6 meses puede afectar su residencia continua. Vea la sección "Continuous Residence" de las instrucciones o consulte a un representante acreditado.',
              en: 'A trip longer than 6 months can affect your continuous residence. See "Continuous Residence" in the instructions or ask an accredited representative.',
            },
          },
          options: yesNo,
        },
        ...rows({
          max: 6,
          id: 'trip',
          first: is('trip.more0', 'yes'),
          question: (i) => (i === 1 ? { es: 'Su viaje más reciente', en: 'Your most recent trip' } : { es: 'Su viaje anterior', en: 'Your trip before that' }),
          more: { es: '¿Hizo otro viaje antes de ese?', en: 'Did you take another trip before that one?' },
          formRef: 'Part 8 · Item 1 · Trips Outside the United States',
          fields: (i) => [
            date(`trip${i}.left`, 'Fecha en que salió', 'Date you left', `Part 8 · Item 1 (trip ${i}) · Date You Left the United States`),
            date(`trip${i}.returned`, 'Fecha en que regresó', 'Date you returned', `Part 8 · Item 1 (trip ${i}) · Date You Returned to the United States`),
            { id: `trip${i}.countries`, type: 'text', required: true, label: { es: 'Países que visitó', en: 'Countries you visited' }, formRef: `Part 8 · Item 1 (trip ${i}) · Countries to Which You Traveled`, maxLength: 55, placeholder: 'Mexico' },
          ],
          overflow: part14Overflow({ es: 'viajes', en: 'trips' }),
        }),
      ],
    },
    {
      id: 'moral',
      part: 'Part 9',
      title: { es: 'Información adicional', en: 'Additional information' },
      questions: [
        {
          id: 'p9a',
          kind: 'yesNoList',
          formRef: 'Part 9 · Items 1–4',
          question: { es: 'Ciudadanía, voto e impuestos', en: 'Citizenship, voting and taxes' },
          why: {
            es: '"Alguna vez" significa en cualquier momento y en cualquier país.',
            en: '"Ever" means at any time, anywhere in the world.',
          },
          notice: legal,
          items: [
            yn('p9.1', '1', '¿Alguna vez ha dicho que es ciudadano/a de EE.UU. (por escrito o de otra forma)?', 'Have you EVER claimed to be a U.S. citizen (in writing or any other way)?'),
            yn('p9.2', '2', '¿Alguna vez se ha registrado para votar o ha votado en una elección federal, estatal o local de EE.UU.?', 'Have you EVER registered to vote or voted in any Federal, state, or local election in the United States?'),
            yn('p9.3', '3', '¿Debe impuestos federales, estatales o locales vencidos?', 'Do you currently owe any overdue Federal, state, or local taxes?'),
            yn('p9.4', '4', 'Desde que es residente, ¿se ha declarado "nonresident alien" en impuestos o no los presentó por considerarse no residente?', 'Since becoming a permanent resident, have you called yourself a "nonresident alien" on a tax return or not filed because you considered yourself a nonresident?'),
          ],
        },
        {
          id: 'p9b',
          kind: 'yesNoList',
          formRef: 'Part 9 · Items 5–6',
          question: { es: 'Grupos y organizaciones', en: 'Groups and organizations' },
          items: [
            yn('p9.5.a', '5.a', '¿Alguna vez ha sido miembro o ha estado asociado/a con un partido comunista o totalitario?', 'Have you EVER been a member of, involved in, or associated with any Communist or totalitarian party?'),
            yn('p9.5.b', '5.b', '¿Alguna vez ha apoyado o formado parte de un grupo que promueva derrocar gobiernos, el comunismo mundial, una dictadura, atacar a funcionarios, destruir propiedad o el sabotaje?', 'Have you EVER advocated, or been part of a group that advocated, overthrowing government, world communism, dictatorship, assaulting officials, destroying property, or sabotage?'),
            yn('p9.6.a', '6.a', '¿Alguna vez ha apoyado a un grupo que usara armas o explosivos para dañar personas o propiedad?', 'Have you EVER been associated with or supported a group that used a weapon or explosive to harm people or property?'),
            yn('p9.6.b', '6.b', '¿Alguna vez ha apoyado a un grupo que cometiera secuestros, asesinatos o secuestro o sabotaje de aviones o vehículos?', 'Have you EVER been associated with or supported a group that engaged in kidnapping, assassination, or hijacking or sabotage of a vehicle?'),
            yn('p9.6.c', '6.c', '¿Alguna vez ha amenazado, intentado, planeado o animado a otros a cometer alguno de esos actos?', 'Have you EVER threatened, attempted, conspired, prepared, planned, advocated or incited others to commit any of those acts?'),
          ],
        },
        {
          id: 'p9c',
          kind: 'yesNoList',
          formRef: 'Part 9 · Item 7',
          question: { es: '¿Alguna vez ha ordenado, cometido o ayudado en alguno de estos actos?', en: 'Have you EVER ordered, committed or helped with any of these acts?' },
          items: [
            yn('p9.7.a', '7.a', 'Tortura', 'Torture'),
            yn('p9.7.b', '7.b', 'Genocidio', 'Genocide'),
            yn('p9.7.c', '7.c', 'Matar o intentar matar a alguien', 'Killing or trying to kill any person'),
            yn('p9.7.d', '7.d', 'Herir gravemente o intentar herir a alguien a propósito', 'Intentionally and severely injuring or trying to injure any person'),
            yn('p9.7.e', '7.e', 'Contacto o actividad sexual con alguien que no consintió o no podía consentir', 'Any sexual contact or activity with a person who did not or could not consent'),
            yn('p9.7.f', '7.f', 'Impedir que alguien practique su religión', 'Not letting someone practice his or her religion'),
            yn('p9.7.g', '7.g', 'Dañar a alguien por su raza, religión, nacionalidad, grupo social u opinión política', 'Causing harm to any person because of race, religion, national origin, social group or political opinion'),
          ],
        },
        {
          id: 'p9d',
          kind: 'yesNoList',
          formRef: 'Part 9 · Items 8–14',
          question: { es: 'Servicio armado y armas', en: 'Armed service and weapons' },
          why: { es: 'Si responde Sí a 8.a u 8.b, indique en la explicación el país, la unidad, su rango y las fechas.', en: 'If you answer Yes to 8.a or 8.b, give the country, unit, rank and dates in your explanation.' },
          items: [
            yn('p9.8.a', '8.a', '¿Alguna vez ha servido o participado en una unidad militar o de policía?', 'Have you EVER served in or participated in any military or police unit?'),
            yn('p9.8.b', '8.b', '¿Alguna vez ha participado en un grupo armado (paramilitar, autodefensa, guerrilla, rebeldes)?', 'Have you EVER participated in any armed group (paramilitary, self-defense, vigilante, rebel or guerrilla group)?'),
            yn('p9.9', '9', '¿Alguna vez ha trabajado en un lugar donde se detenía a personas (cárcel, campo de prisioneros, centro de detención)?', 'Have you EVER worked in a place where people were detained (prison, jail, prison camp, detention facility, labor camp)?'),
            yn('p9.10.a', '10.a', '¿Alguna vez ha sido parte de un grupo que usara armas contra personas o amenazara con hacerlo?', 'Were you EVER part of any group that used a weapon against any person, or threatened to do so?'),
            yn('p9.10.b', '10.b', 'En ese grupo, ¿usó usted un arma contra otra persona?', 'While in that group, did you ever use a weapon against another person?', is('p9.10.a', 'yes')),
            yn('p9.10.c', '10.c', 'En ese grupo, ¿amenazó a alguien con usar un arma?', 'While in that group, did you ever threaten to use a weapon against another person?', is('p9.10.a', 'yes')),
            yn('p9.11', '11', '¿Alguna vez ha vendido, dado o transportado armas sabiendo que se usarían contra personas?', 'Have you EVER sold, provided or transported weapons you knew would be used against another person?'),
            yn('p9.12', '12', '¿Alguna vez ha recibido entrenamiento con armas, paramilitar o de tipo militar?', 'Have you EVER received any weapons, paramilitary or military-type training?'),
            yn('p9.13', '13', '¿Alguna vez ha reclutado o usado a menores de 15 años en un grupo armado?', 'Have you EVER recruited or used any person under 15 to serve in or help an armed group?'),
            yn('p9.14', '14', '¿Alguna vez ha usado a menores de 15 años en combate o para apoyar un combate?', 'Have you EVER used any person under 15 to take part in hostilities?'),
          ],
        },
        {
          id: 'p9e',
          kind: 'yesNoList',
          formRef: 'Part 9 · Item 15',
          question: { es: 'Delitos y arrestos', en: 'Crimes and arrests' },
          why: {
            es: 'Incluya todo, en EE.UU. o en otro país, aunque se haya borrado de su récord o alguien le dijera que no tiene que decirlo: multas por manejar borracho, violencia doméstica, delitos de menor de edad, desvíos o libertad condicional.',
            en: 'Include everything, in the U.S. or abroad, even if it was sealed or expunged or someone told you that you don’t have to report it: DUIs, domestic violence, offenses as a minor, diversion or probation.',
          },
          notice: legal,
          items: [
            yn('p9.15.a', '15.a', '¿Alguna vez ha cometido, ayudado o intentado cometer un delito por el que NO lo/la arrestaron?', 'Have you EVER committed, helped commit or tried to commit a crime for which you were NOT arrested?'),
            yn('p9.15.b', '15.b', '¿Alguna vez lo/la han arrestado, citado, detenido o acusado de un delito?', 'Have you EVER been arrested, cited, detained or charged with a crime?'),
          ],
        },
        ...rows({
          max: 5,
          id: 'crime',
          first: anyCrime,
          question: (i) => (i === 1 ? { es: 'Cuéntenos sobre el delito o arresto', en: 'Tell us about the crime or arrest' } : { es: 'El siguiente delito o arresto', en: 'The next crime or arrest' }),
          why: (i) => (i === 1 ? { es: 'Necesitará documentos oficiales de la corte sobre cada caso.', en: 'You’ll need official court records for each case.' } : undefined),
          more: { es: '¿Hay otro delito o arresto?', en: 'Is there another crime or arrest?' },
          formRef: 'Part 9 · Item 15 · Crimes and Offenses',
          fields: (i) => [
            { id: `crime${i}.what`, type: 'text', required: true, label: { es: '¿Cuál fue el delito?', en: 'What was the crime or offense?' }, formRef: `Part 9 · Item 15 (row ${i}) · Crime or Offense` },
            date(`crime${i}.date`, 'Fecha del delito', 'Date of the crime', `Part 9 · Item 15 (row ${i}) · Date of the Crime or Offense`),
            date(`crime${i}.convicted`, 'Fecha de la condena o declaración de culpabilidad', 'Date of conviction or guilty plea', `Part 9 · Item 15 (row ${i}) · Date of Conviction (if applicable)`, false),
            { id: `crime${i}.place`, type: 'text', required: true, label: { es: 'Lugar (ciudad, estado, país)', en: 'Place (city, state, country)' }, formRef: `Part 9 · Item 15 (row ${i}) · Place of Crime or Offense` },
            { id: `crime${i}.result`, type: 'text', required: true, label: { es: '¿Cuál fue el resultado?', en: 'What was the result?' }, formRef: `Part 9 · Item 15 (row ${i}) · Result or Disposition`, hint: { es: 'Por ejemplo: no charges filed, convicted, charges dismissed, jail, probation.', en: 'For example: no charges filed, convicted, charges dismissed, jail, probation.' } },
            { id: `crime${i}.sentence`, type: 'text', label: { es: 'Sentencia', en: 'Sentence' }, formRef: `Part 9 · Item 15 (row ${i}) · Sentence (if applicable)`, placeholder: '90 days probation' },
          ],
          overflow: part14Overflow({ es: 'casos', en: 'cases' }),
        }),
        {
          id: 'p9f',
          kind: 'yesNoList',
          formRef: 'Part 9 · Item 16',
          showIf: anyCrime,
          question: { es: 'Sentencias', en: 'Sentences' },
          items: [yn('p9.16', '16', 'Si recibió una sentencia suspendida, libertad condicional o parole, ¿la cumplió por completo?', 'If you received a suspended sentence, probation or parole, have you completed it?')],
        },
        {
          id: 'p9g',
          kind: 'yesNoList',
          formRef: 'Part 9 · Items 17–19',
          question: { es: '¿Alguna vez ha…', en: 'Have you EVER…' },
          items: [
            yn('p9.17.a', '17.a', '…participado en la prostitución o recibido dinero de ella?', '…engaged in prostitution or received money from prostitution?'),
            yn('p9.17.b', '17.b', '…fabricado, vendido o traficado drogas ilegales?', '…manufactured, sold or trafficked illegal drugs or controlled substances?'),
            yn('p9.17.c', '17.c', '…estado casado/a con más de una persona a la vez?', '…been married to more than one person at the same time?'),
            yn('p9.17.d', '17.d', '…casado/a para obtener un beneficio migratorio?', '…married someone to obtain an immigration benefit?'),
            yn('p9.17.e', '17.e', '…ayudado a alguien a entrar o intentar entrar a EE.UU. de forma ilegal?', '…helped anyone enter or try to enter the United States illegally?'),
            yn('p9.17.f', '17.f', '…apostado ilegalmente o recibido ingresos de apuestas ilegales?', '…gambled illegally or received income from illegal gambling?'),
            yn('p9.17.g', '17.g', '…dejado de pagar la manutención de sus hijos o una pensión ordenada por un juez?', '…failed to pay child support or court-ordered alimony?'),
            yn('p9.17.h', '17.h', '…mentido para obtener un beneficio público en EE.UU.?', '…made any misrepresentation to obtain a public benefit in the United States?'),
            yn('p9.18', '18', '…dado información o documentos falsos a un funcionario de EE.UU.?', '…given any U.S. Government official false, fraudulent or misleading information?'),
            yn('p9.19', '19', '…mentido a un funcionario de EE.UU. para entrar al país o recibir beneficios migratorios?', '…lied to any U.S. Government official to gain entry or immigration benefits?'),
          ],
        },
        {
          id: 'p9h',
          kind: 'yesNoList',
          formRef: 'Part 9 · Items 20–21',
          question: { es: 'Procesos de deportación', en: 'Removal proceedings' },
          items: [
            yn('p9.20', '20', '¿Alguna vez ha estado en un proceso de deportación, remoción o rescisión?', 'Have you EVER been placed in removal, rescission or deportation proceedings?'),
            yn('p9.21', '21', '¿Alguna vez lo/la han deportado o removido de EE.UU.?', 'Have you EVER been removed or deported from the United States?'),
          ],
        },
        {
          id: 'p9i',
          kind: 'yesNoList',
          formRef: 'Part 9 · Item 22 · Selective Service',
          showIf: male,
          question: { es: 'Servicio Selectivo', en: 'Selective Service' },
          why: {
            es: 'La ley pide que casi todos los hombres de 18 a 25 años que viven en EE.UU. se registren en el Servicio Selectivo (sss.gov).',
            en: 'The law requires nearly all men aged 18 to 25 living in the U.S. to register with Selective Service (sss.gov).',
          },
          items: [
            yn('p9.22.a', '22.a', '¿Vivió en EE.UU. en algún momento entre sus 18 y 26 años? (Responda No si todo ese tiempo tuvo una visa de no inmigrante válida.)', 'Did you live in the U.S. at any time between your 18th and 26th birthdays? (Answer No if you were a lawful nonimmigrant the whole time.)'),
            yn('p9.22.b', '22.b', '¿Se registró en el Servicio Selectivo?', 'Did you register for the Selective Service?', is('p9.22.a', 'yes')),
          ],
        },
        {
          id: 'selectiveService',
          kind: 'fields',
          formRef: 'Part 9 · Item 22.c',
          showIf: all(male, is('p9.22.a', 'yes'), is('p9.22.b', 'yes')),
          question: { es: 'Su registro en el Servicio Selectivo', en: 'Your Selective Service registration' },
          why: { es: 'Puede encontrar su número en sss.gov.', en: 'You can look up your number at sss.gov.' },
          fields: [
            date('ss.date', 'Fecha de registro', 'Date registered', 'Part 9 · Item 22.c · Date Registered'),
            { id: 'ss.number', type: 'number', required: true, label: { es: 'Número del Servicio Selectivo', en: 'Selective Service number' }, formRef: 'Part 9 · Item 22.c · Selective Service Number', maxLength: 10 },
          ],
        },
        {
          id: 'p9j',
          kind: 'yesNoList',
          formRef: 'Part 9 · Items 23–29 · U.S. Armed Forces',
          question: { es: 'Fuerzas armadas de EE.UU.', en: 'U.S. armed forces' },
          items: [
            yn('p9.23', '23', '¿Alguna vez salió de EE.UU. para evitar el servicio militar obligatorio?', 'Have you EVER left the United States to avoid being drafted into the U.S. armed forces?'),
            yn('p9.24', '24', '¿Alguna vez pidió una exención del servicio militar en EE.UU.?', 'Have you EVER applied for any kind of exemption from military service in the U.S. armed forces?'),
            yn('p9.25', '25', '¿Alguna vez ha servido en las fuerzas armadas de EE.UU.?', 'Have you EVER served in the U.S. armed forces?'),
            yn('p9.26.a', '26.a', '¿Es miembro actual de las fuerzas armadas de EE.UU.?', 'Are you currently a member of the U.S. armed forces?', served),
            yn('p9.26.b', '26.b', '¿Lo/la enviarán fuera de EE.UU. en los próximos 3 meses?', 'Are you scheduled to deploy outside the United States within the next 3 months?', all(served, is('p9.26.a', 'yes'))),
            yn('p9.26.c', '26.c', '¿Está destinado/a fuera de EE.UU. ahora?', 'Are you currently stationed outside the United States?', all(served, is('p9.26.a', 'yes'))),
            yn('p9.26.d', '26.d', '¿Es exmiembro de las fuerzas armadas y vive fuera de EE.UU.?', 'Are you a former U.S. military service member currently residing outside the U.S.?', all(served, is('p9.26.a', 'no'))),
            yn('p9.27', '27', '¿Alguna vez fue juzgado/a por una corte marcial o dado/a de baja de forma no honorable?', 'Have you EVER been court-martialed or received a discharge characterized as other than honorable, bad conduct or dishonorable?', served),
            yn('p9.28', '28', '¿Alguna vez lo/la dieron de baja del entrenamiento o servicio por ser extranjero/a?', 'Have you EVER been discharged from training or service because you were an alien?', served),
            yn('p9.29', '29', '¿Alguna vez desertó de las fuerzas armadas de EE.UU.?', 'Have you EVER deserted from the U.S. armed forces?', served),
          ],
        },
        {
          id: 'p9k',
          kind: 'yesNoList',
          formRef: 'Part 9 · Item 30 · Titles of Nobility',
          question: { es: 'Títulos nobiliarios', en: 'Titles of nobility' },
          items: [
            yn('p9.30.a', '30.a', '¿Tiene o ha tenido un título hereditario o de nobleza en otro país?', 'Do you now have, or did you EVER have, a hereditary title or an order of nobility in any foreign country?'),
            yn('p9.30.b', '30.b', '¿Está dispuesto/a a renunciar a esos títulos en la ceremonia?', 'Are you willing to give up any inherited titles or orders of nobility at your naturalization ceremony?', is('p9.30.a', 'yes')),
          ],
        },
        {
          id: 'nobilityQ',
          kind: 'fields',
          formRef: 'Part 9 · Item 30.b',
          showIf: is('p9.30.a', 'yes'),
          question: { es: '¿Qué títulos tiene?', en: 'What titles do you have?' },
          fields: [{ id: 'nobilityTitles', type: 'text', required: true, label: { es: 'Títulos', en: 'Titles' }, formRef: 'Part 9 · Item 30.b · List titles' }],
        },
        {
          id: 'p9l',
          kind: 'yesNoList',
          formRef: 'Part 9 · Items 31–37 · Oath of Allegiance',
          question: { es: 'El Juramento de Lealtad', en: 'The Oath of Allegiance' },
          why: {
            es: 'Al hacerse ciudadano/a jurará lealtad a EE.UU. El texto completo está en la Parte 16 del formulario.',
            en: 'When you become a citizen you’ll swear allegiance to the U.S. The full text is in Part 16 of the form.',
          },
          items: [
            yn('p9.31', '31', '¿Apoya la Constitución y la forma de gobierno de EE.UU.?', 'Do you support the Constitution and form of Government of the United States?'),
            yn('p9.32', '32', '¿Entiende el Juramento de Lealtad completo?', 'Do you understand the full Oath of Allegiance to the United States?'),
            yn('p9.33', '33', '¿Una discapacidad física, del desarrollo o mental le impide hacer el juramento?', 'Are you unable to take the Oath of Allegiance because of a physical or developmental disability or mental impairment?'),
            yn('p9.34', '34', '¿Está dispuesto/a a hacer el Juramento de Lealtad completo?', 'Are you willing to take the full Oath of Allegiance to the United States?', (a) => a['p9.33'] !== 'yes'),
            yn('p9.35', '35', 'Si la ley lo exige, ¿está dispuesto/a a portar armas por EE.UU.?', 'If the law requires it, are you willing to bear arms on behalf of the United States?', (a) => a['p9.33'] !== 'yes'),
            yn('p9.36', '36', 'Si la ley lo exige, ¿está dispuesto/a a prestar servicios no combatientes en las fuerzas armadas?', 'If the law requires it, are you willing to perform noncombatant services in the U.S. armed forces?', (a) => a['p9.33'] !== 'yes'),
            yn('p9.37', '37', 'Si la ley lo exige, ¿está dispuesto/a a hacer trabajo de importancia nacional bajo dirección civil?', 'If the law requires it, are you willing to perform work of national importance under civilian direction?', (a) => a['p9.33'] !== 'yes'),
          ],
        },
        ...part9Explain.map(
          (e): Question => ({
            id: `explain.${e.item}`,
            kind: 'fields',
            formRef: `Part 14 · Additional Information (Part 9, Item ${e.item})`,
            showIf: (a) => a[e.id] === e.when,
            question: { es: `Explique su respuesta a la pregunta ${e.item}`, en: `Explain your answer to question ${e.item}` },
            why: {
              es: 'Diga qué pasó, cuándo y dónde, en inglés. Las primeras 4 explicaciones se escriben en la Parte 14 del PDF; si hay más, agréguelas en una hoja aparte.',
              en: 'Say what happened, when and where, in English. The first 4 explanations go in Part 14 of the PDF; if there are more, add them on a separate sheet.',
            },
            notice: legal,
            fields: [
              {
                id: `explain.${e.item}.text`,
                type: 'longText',
                required: true,
                label: { es: 'Explicación (en inglés)', en: 'Explanation' },
                formRef: `Part 14 · Page ${e.page}, Part 9, Item ${e.item}`,
                // What fits in one Part 14 box; longer explanations go on a separate sheet.
                maxLength: 450,
              },
            ],
          }),
        ),
      ],
    },
    {
      id: 'fee',
      part: 'Part 10',
      title: { es: 'Tarifa reducida', en: 'Reduced fee' },
      questions: [
        {
          id: 'feeReduction',
          kind: 'choice',
          formRef: 'Part 10 · Item 1 · Request for a Fee Reduction',
          question: { es: '¿Los ingresos de su hogar son iguales o menores al 400% de la línea federal de pobreza?', en: 'Is your household income at or below 400% of the Federal Poverty Guidelines?' },
          why: {
            es: 'Si es así, puede pagar una tarifa reducida. Vea los límites y la tarifa actual en uscis.gov/g-1055. Si no es así, o no lo sabe, responda No.',
            en: 'If so, you can pay a reduced fee. See the limits and current fee at uscis.gov/g-1055. If not, or you’re not sure, answer No.',
          },
          options: yesNo,
        },
        {
          id: 'household',
          kind: 'fields',
          formRef: 'Part 10 · Items 2–4',
          showIf: is('feeReduction', 'yes'),
          question: { es: 'Sobre su hogar', en: 'About your household' },
          why: { es: 'Deberá adjuntar pruebas de sus ingresos, como su declaración de impuestos.', en: 'You’ll need to attach proof of your income, such as your tax return.' },
          fields: [
            { id: 'household.income', type: 'number', required: true, label: { es: 'Ingreso total del hogar (dólares al año)', en: 'Total household income (dollars per year)' }, formRef: 'Part 10 · Item 2 · Total household income', maxLength: 7, placeholder: '45000' },
            { id: 'household.size', type: 'number', required: true, label: { es: 'Personas en el hogar', en: 'Household size' }, formRef: 'Part 10 · Item 3 · My household size is', maxLength: 7 },
            { id: 'household.earners', type: 'number', required: true, label: { es: 'Personas que ganan dinero, incluido usted', en: 'Members earning income, including yourself' }, formRef: 'Part 10 · Item 4 · Total number of household members earning income', maxLength: 7 },
          ],
        },
        {
          id: 'headOfHousehold',
          kind: 'choice',
          formRef: 'Part 10 · Item 5.a · I am the head of household',
          showIf: is('feeReduction', 'yes'),
          question: { es: '¿Es usted el/la jefe/a del hogar?', en: 'Are you the head of household?' },
          options: yesNo,
        },
        {
          id: 'headNameQ',
          kind: 'fields',
          formRef: 'Part 10 · Item 5.b',
          showIf: all(is('feeReduction', 'yes'), is('headOfHousehold', 'no')),
          question: { es: '¿Quién es el/la jefe/a del hogar?', en: 'Who is the head of household?' },
          fields: [{ id: 'headName', type: 'text', required: true, label: { es: 'Nombre', en: 'Name' }, formRef: 'Part 10 · Item 5.b · Name of head of household' }],
        },
      ],
    },
    {
      id: 'contact',
      part: 'Part 11',
      title: { es: 'Contacto', en: 'Contact' },
      questions: [
        {
          id: 'contactInfo',
          kind: 'fields',
          formRef: 'Part 11 · Items 1–3 · Applicant’s Contact Information',
          question: { es: '¿Cómo puede contactarle USCIS?', en: 'How can USCIS contact you?' },
          fields: [
            { id: 'phone', type: 'phone', required: true, label: { es: 'Teléfono de día', en: 'Daytime phone number' }, formRef: 'Part 11 · Item 1 · Applicant’s Daytime Telephone Number', placeholder: '213 555 0123' },
            { id: 'mobile', type: 'phone', label: { es: 'Celular', en: 'Mobile phone number' }, formRef: 'Part 11 · Item 2 · Applicant’s Mobile Telephone Number' },
            { id: 'email', type: 'email', label: { es: 'Correo electrónico', en: 'Email address' }, formRef: 'Part 11 · Item 3 · Applicant’s Email Address', maxLength: 38 },
          ],
        },
      ],
    },
  ],
};

export { PART14_BLOCKS };
