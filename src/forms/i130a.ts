import type { Field, FormDefinition, Question } from './types';
import { anyAddress, date, is, nameFields, sexField, yesNo } from './helpers';
import { assistanceSection } from './assistance';

// Questions follow USCIS Form I-130A, Supplemental Information for Spouse Beneficiary, edition
// 04/01/24. It is filled in by the spouse that a Form I-130 is filed for, and travels with it.
// src/pdf/i130aPdf.ts maps the answers onto that edition's fields.
// The interpreter (Part 5) and preparer (Part 6) parts are filled from the last section; they sign by hand.

export const I130A_EDITION = '04/01/24';

const parent = (i: 1 | 2): Question => {
  const items = i === 1 ? ['10', '11', '12', '13', '14', '15', '16'] : ['17', '18', '19', '20', '21', '22', '23'];
  return {
    id: `parent${i}`,
    kind: 'fields',
    formRef: `Part 1 · Items ${items[0]}–${items[6]} · Information About Parent ${i}`,
    question: i === 1 ? { es: 'Sobre uno de sus padres', en: 'About one of your parents' } : { es: 'Sobre su otro padre o madre', en: 'About your other parent' },
    why: {
      es: 'Para su madre, escriba su apellido de soltera. Si un dato no lo sabe, escriba "unknown"; si falleció, escriba "deceased" en la ciudad donde vive.',
      en: 'For your mother, write her maiden name. If you don’t know something, write "unknown"; if they died, write "deceased" as the city of residence.',
    },
    fields: [
      ...nameFields(`parent${i}`, `Part 1 · Item ${items[0]}`),
      date(`parent${i}.dob`, 'Fecha de nacimiento', 'Date of birth', `Part 1 · Item ${items[1]} · Date of Birth`, false),
      { ...sexField(`parent${i}.sex`, `Part 1 · Item ${items[2]}`), required: false },
      { id: `parent${i}.birthCity`, type: 'text', label: { es: 'Ciudad de nacimiento', en: 'City of birth' }, formRef: `Part 1 · Item ${items[3]} · City/Town/Village of Birth`, maxLength: i === 1 ? 38 : 20 },
      { id: `parent${i}.birthCountry`, type: 'text', label: { es: 'País de nacimiento', en: 'Country of birth' }, formRef: `Part 1 · Item ${items[4]} · Country of Birth` },
      { id: `parent${i}.city`, type: 'text', label: { es: 'Ciudad donde vive', en: 'City of residence' }, formRef: `Part 1 · Item ${items[5]} · City/Town/Village of Residence` },
      { id: `parent${i}.country`, type: 'text', label: { es: 'País donde vive', en: 'Country of residence' }, formRef: `Part 1 · Item ${items[6]} · Country of Residence` },
    ],
  };
};

const job = (prefix: string, ref: string, current: boolean): Field[] => [
  { id: `${prefix}.name`, type: 'text', required: true, label: { es: 'Empleador o compañía', en: 'Employer or company' }, formRef: `${ref} · Name of Employer/Company`, maxLength: 34 },
  ...anyAddress(prefix, ref).map((f) => ({ ...f, required: false })),
  { id: `${prefix}.occupation`, type: 'text', label: { es: 'Su ocupación', en: 'Your occupation' }, formRef: `${ref} · Your Occupation` },
  date(`${prefix}.from`, 'Desde', 'From', `${ref} · Date From`, false),
  ...(current ? [] : [date(`${prefix}.to`, 'Hasta', 'To', `${ref} · Date To`, false)]),
];

export const i130a: FormDefinition = {
  id: 'i-130a',
  number: 'I-130A',
  edition: I130A_EDITION,
  title: { es: 'Información del cónyuge beneficiario', en: 'Supplemental Information for Spouse Beneficiary' },
  summary: {
    es: 'Lo llena el esposo o la esposa por quien se presenta un I-130. Va junto con el I-130.',
    en: 'Filled in by the husband or wife an I-130 is filed for. It goes with the I-130.',
  },
  intro: {
    es: 'Si su cónyuge presenta un I-130 por usted, usted llena este formulario con sus direcciones, sus padres y sus trabajos de los últimos 5 años. Se envía junto con el I-130.',
    en: 'If your spouse files an I-130 for you, you fill in this form with your addresses, parents and jobs from the last 5 years. It is sent with the I-130.',
  },
  minutes: 15,
  pdf: {
    path: 'forms/i-130a.pdf',
    fileName: 'I-130A-filled.pdf',
    load: () => import('../pdf/i130aPdf').then((m) => m.fillI130A),
    signHere: { es: 'Parte 4, Ítem 6.a', en: 'Part 4, Item 6.a' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/i-130a que la edición {edition} sigue vigente; si cambió, use la nueva y copie sus respuestas de esta hoja.',
      'Revise el PDF página por página. Si vivió o trabajó en más lugares, agréguelos a mano en la Parte 7.',
      'Imprima el PDF y firme la Parte 4, Ítem 6.a, a mano con tinta negra. Si vive fuera de EE.UU., no necesita firmarlo.',
      'Envíelo junto con el I-130 que presenta su cónyuge.',
      'Si alguien le interpretó o preparó el formulario, esa persona firma y pone la fecha a mano en la Parte 5 (intérprete) o la Parte 6 (preparador).',
    ],
    en: [
      'Check at uscis.gov/i-130a that edition {edition} is still current; if it changed, use the new one and copy your answers from this sheet.',
      'Check the PDF page by page. If you lived or worked in more places, add them by hand in Part 7.',
      'Print the PDF and sign Part 4, Item 6.a, by hand in black ink. If you live outside the U.S., you don’t need to sign it.',
      'Send it together with the I-130 your spouse files.',
      'If someone interpreted or prepared the form for you, they sign and date Part 5 (interpreter) or Part 6 (preparer) by hand.',
    ],
  },
  sections: [
    {
      id: 'about',
      part: 'Part 1',
      title: { es: 'Sobre usted', en: 'About you' },
      questions: [
        {
          id: 'name',
          kind: 'fields',
          formRef: 'Part 1 · Item 3 · Your Full Name',
          question: { es: '¿Cuál es su nombre legal completo?', en: 'What is your full legal name?' },
          notice: {
            tone: 'info',
            title: { es: 'Usted es el cónyuge beneficiario', en: 'You are the spouse beneficiary' },
            body: { es: 'Este formulario es sobre usted, la persona por quien su esposo/a presenta el I-130.', en: 'This form is about you, the person your spouse is filing the I-130 for.' },
          },
          fields: nameFields('name', 'Part 1 · Item 3'),
        },
        {
          id: 'ids',
          kind: 'fields',
          formRef: 'Part 1 · Items 1–2',
          question: { es: 'Sus números de inmigración', en: 'Your immigration numbers' },
          why: { es: 'Deje vacíos los que no tenga.', en: 'Leave empty the ones you don’t have.' },
          fields: [
            { id: 'aNumber', type: 'aNumber', label: { es: 'A-Number', en: 'A-Number' }, formRef: 'Part 1 · Item 1 · Alien Registration Number (A-Number)' },
            { id: 'uscisAccount', type: 'uscisAccount', label: { es: 'Número de cuenta en línea de USCIS', en: 'USCIS online account number' }, formRef: 'Part 1 · Item 2 · USCIS Online Account Number' },
          ],
        },
        {
          id: 'home1',
          kind: 'fields',
          formRef: 'Part 1 · Items 4–5 · Physical Address 1',
          question: { es: '¿Dónde vive ahora?', en: 'Where do you live now?' },
          why: { es: 'Si es en EE.UU., escriba estado y ZIP; si es en otro país, provincia y código postal.', en: 'In the U.S., give state and ZIP; abroad, province and postal code.' },
          fields: [...anyAddress('home1', 'Part 1 · Item 4'), date('home1.from', 'Vive aquí desde', 'Living here since', 'Part 1 · Item 5.a · Date From')],
        },
        {
          id: 'home.more',
          kind: 'choice',
          formRef: 'Part 1 · Items 6–7 · Physical Address 2',
          question: { es: '¿Ha vivido en otra dirección en los últimos 5 años?', en: 'Have you lived at another address in the last 5 years?' },
          why: { es: 'Dentro o fuera de EE.UU.', en: 'Inside or outside the U.S.' },
          options: yesNo,
        },
        {
          id: 'home2',
          kind: 'fields',
          formRef: 'Part 1 · Items 6–7 · Physical Address 2',
          showIf: is('home.more', 'yes'),
          question: { es: '¿Dónde vivía antes?', en: 'Where did you live before?' },
          why: { es: 'Si vivió en más lugares en los últimos 5 años, escríbalos a mano en la Parte 7.', en: 'If you lived in more places in the last 5 years, write them by hand in Part 7.' },
          fields: [...anyAddress('home2', 'Part 1 · Item 6'), date('home2.from', 'Desde', 'From', 'Part 1 · Item 7.a · Date From'), date('home2.to', 'Hasta', 'To', 'Part 1 · Item 7.b · Date To')],
        },
        {
          id: 'abroad',
          kind: 'fields',
          formRef: 'Part 1 · Items 8–9 · Last Physical Address Outside the United States',
          question: { es: '¿Cuál fue su última dirección fuera de EE.UU. donde vivió más de un año?', en: 'What was your last address outside the U.S. where you lived for more than a year?' },
          why: { es: 'Aunque ya la haya escrito arriba. Si nunca vivió fuera de EE.UU., deje los campos vacíos.', en: 'Even if you already listed it above. If you never lived outside the U.S., leave the fields empty.' },
          fields: [
            ...anyAddress('abroad', 'Part 1 · Item 8')
              .filter((f) => !f.id.endsWith('.state') && !f.id.endsWith('.zip'))
              .map((f) => ({ ...f, required: false })),
            date('abroad.from', 'Desde', 'From', 'Part 1 · Item 9.a · Date From', false),
            date('abroad.to', 'Hasta', 'To', 'Part 1 · Item 9.b · Date To', false),
          ],
        },
        parent(1),
        parent(2),
      ],
    },
    {
      id: 'employment',
      part: 'Part 2',
      title: { es: 'Trabajo', en: 'Employment' },
      questions: [
        {
          id: 'job1',
          kind: 'fields',
          formRef: 'Part 2 · Items 1–4 · Employer 1',
          question: { es: '¿Dónde trabaja ahora?', en: 'Where do you work now?' },
          why: { es: 'Dentro o fuera de EE.UU. Si no trabaja, escriba "Unemployed" y deje lo demás vacío.', en: 'Inside or outside the U.S. If you don’t work, write "Unemployed" and leave the rest empty.' },
          fields: job('job1', 'Part 2 · Item 2', true),
        },
        {
          id: 'job.more',
          kind: 'choice',
          formRef: 'Part 2 · Items 5–8 · Employer 2',
          question: { es: '¿Tuvo otro trabajo en los últimos 5 años?', en: 'Did you have another job in the last 5 years?' },
          options: yesNo,
        },
        {
          id: 'job2',
          kind: 'fields',
          formRef: 'Part 2 · Items 5–8 · Employer 2',
          showIf: is('job.more', 'yes'),
          question: { es: '¿Dónde trabajó antes?', en: 'Where did you work before?' },
          why: { es: 'Si tuvo más trabajos, escríbalos a mano en la Parte 7.', en: 'If you had more jobs, write them by hand in Part 7.' },
          fields: job('job2', 'Part 2 · Item 6', false),
        },
        {
          id: 'abroadJob.has',
          kind: 'choice',
          formRef: 'Part 3 · Information About Your Employment Outside the United States',
          question: { es: '¿Trabajó alguna vez fuera de EE.UU. en un trabajo que no escribió arriba?', en: 'Did you ever work outside the U.S. in a job you didn’t list above?' },
          options: yesNo,
        },
        {
          id: 'abroadJob',
          kind: 'fields',
          formRef: 'Part 3 · Items 1–4',
          showIf: is('abroadJob.has', 'yes'),
          question: { es: '¿Cuál fue su último trabajo fuera de EE.UU.?', en: 'What was your last job outside the U.S.?' },
          fields: job('abroadJob', 'Part 3 · Item 2', false),
        },
      ],
    },
    {
      id: 'contact',
      part: 'Part 4',
      title: { es: 'Contacto', en: 'Contact' },
      questions: [
        {
          id: 'contactInfo',
          kind: 'fields',
          formRef: 'Part 4 · Items 3–5 · Spouse Beneficiary’s Contact Information',
          question: { es: '¿Cómo se le puede contactar?', en: 'How can you be contacted?' },
          fields: [
            { id: 'phone', type: 'text', required: true, label: { es: 'Teléfono de día', en: 'Daytime phone' }, formRef: 'Part 4 · Item 3 · Daytime Telephone Number', maxLength: 13, placeholder: '2135550123', hint: { es: 'Solo números; incluya el código del país si es fuera de EE.UU.', en: 'Digits only; include the country code if outside the U.S.' } },
            { id: 'mobile', type: 'text', label: { es: 'Celular', en: 'Mobile phone' }, formRef: 'Part 4 · Item 4 · Mobile Telephone Number', maxLength: 13 },
            { id: 'email', type: 'email', label: { es: 'Correo electrónico', en: 'Email address' }, formRef: 'Part 4 · Item 5 · Email Address', maxLength: 38 },
          ],
        },
        {
          id: 'readsEnglish',
          kind: 'choice',
          formRef: 'Part 4 · Item 1 · Spouse Beneficiary’s Statement',
          question: { es: '¿Puede leer y entender el formulario en inglés?', en: 'Can you read and understand the form in English?' },
          why: { es: 'Si alguien se lo traduce, esa persona llena y firma la Parte 5 (intérprete).', en: 'If someone translates it for you, they fill in and sign Part 5 (interpreter).' },
          options: [
            { value: 'yes', label: { es: 'Sí, leo inglés', en: 'Yes, I read English' } },
            { value: 'interpreter', label: { es: 'No, un intérprete me lo leerá', en: 'No, an interpreter will read it to me' } },
          ],
        },
        {
          id: 'interpreterLanguage',
          kind: 'fields',
          formRef: 'Part 4 · Item 1.b',
          showIf: is('readsEnglish', 'interpreter'),
          question: { es: '¿En qué idioma se lo leerán?', en: 'What language will it be read to you in?' },
          fields: [{ id: 'fluentLanguage', type: 'text', required: true, label: { es: 'Idioma', en: 'Language' }, formRef: 'Part 4 · Item 1.b · Language', placeholder: 'Spanish' }],
        },
        {
          id: 'preparer',
          kind: 'choice',
          formRef: 'Part 4 · Item 2 · Spouse Beneficiary’s Statement Regarding the Preparer',
          question: { es: '¿Alguien más (no usted) preparó este formulario?', en: 'Did someone else prepare this form for you?' },
          why: { es: 'Si es así, esa persona también llena y firma la Parte 6.', en: 'If so, that person also completes and signs Part 6.' },
          options: yesNo,
        },
        {
          id: 'preparerName',
          kind: 'fields',
          formRef: 'Part 4 · Item 2',
          showIf: is('preparer', 'yes'),
          question: { es: '¿Quién lo preparó?', en: 'Who prepared it?' },
          fields: [{ id: 'preparer.name', type: 'text', required: true, label: { es: 'Nombre del preparador', en: 'Preparer’s name' }, formRef: 'Part 4 · Item 2 · Preparer’s Name' }],
        },
      ],
    },
    assistanceSection({ usedInterpreter: is('readsEnglish', 'interpreter'), usedPreparer: is('preparer', 'yes'), interpreterPart: 'Part 5', preparerPart: 'Part 6' }),
  ],
};
