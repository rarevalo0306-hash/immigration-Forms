import type { Field, FormDefinition } from './types';
import type { T } from '../i18n';
import { all, anyAddress, date, is, nameFields, rows, yesNo } from './helpers';
import { assistanceSection, usedInterpreter, usedPreparer } from './assistance';

// Questions follow USCIS Form I-864, Affidavit of Support Under Section 213A of the INA, edition
// 08/24/26. The person filling in the app is the sponsor. Household size, household income and
// asset totals are added up by src/pdf/i864Pdf.ts, which maps the answers onto the edition's fields.
// The interpreter (Part 9) and preparer (Part 10) are filled in from the last section; they sign
// and date by hand. This edition prints no mailing address or preparer's statement for them.

export const I864_EDITION = '08/24/26';

const t = (es: string, en: string): T => ({ es, en });

const money = (id: string, es: string, en: string, formRef: string, required = false): Field => ({
  id,
  type: 'number',
  required,
  label: { es, en },
  formRef,
  placeholder: '0',
  hint: t('Solo números, sin comas ni signo de dólar.', 'Digits only, no commas or dollar sign.'),
});

const count = (id: string, es: string, en: string, formRef: string): Field => ({ id, type: 'number', required: true, label: { es, en }, formRef, placeholder: '0', maxLength: 2 });

export const i864: FormDefinition = {
  id: 'i-864',
  number: 'I-864',
  edition: I864_EDITION,
  title: t('Declaración de patrocinio económico', 'Affidavit of Support'),
  summary: {
    es: 'El patrocinador (quien presentó el I-130 o un copatrocinador) demuestra que puede mantener al inmigrante.',
    en: 'The sponsor (who filed the I-130, or a joint sponsor) shows they can support the immigrant.',
  },
  intro: {
    es: 'Con el I-864 usted, el patrocinador, se compromete a mantener al inmigrante y demuestra que sus ingresos alcanzan: por lo general, al menos el 125% de la línea de pobreza para el tamaño de su hogar. Tenga a mano su declaración de impuestos más reciente y los datos de su trabajo.',
    en: 'With Form I-864 you, the sponsor, commit to support the immigrant and show that your income is enough: usually at least 125% of the poverty line for your household size. Have your most recent tax return and job details at hand.',
  },
  minutes: 30,
  pdf: {
    path: 'forms/i-864.pdf',
    fileName: 'I-864-filled.pdf',
    load: () => import('../pdf/i864Pdf').then((m) => m.fillI864),
    signHere: { es: 'Parte 8, Ítem 6', en: 'Part 8, Item 6' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/i-864 que la edición {edition} sigue vigente; si cambió, use la nueva y copie sus respuestas de esta hoja.',
      'Compare el ingreso del hogar con la tabla vigente de uscis.gov/i-864p para el tamaño de su hogar. Si no alcanza, puede sumar bienes (Parte 7) o buscar un copatrocinador.',
      'Adjunte una copia o transcripción de su declaración federal de impuestos más reciente (con los W-2 o 1099), prueba de su ciudadanía o residencia y, si suma ingresos de familiares, sus formularios I-864A.',
      'Imprima el PDF y firme la Parte 8, Ítem 6, a mano con tinta negra. Si un intérprete o preparador le ayudó, ellos firman y fechan a mano las Partes 9 y 10.',
    ],
    en: [
      'Check at uscis.gov/i-864 that edition {edition} is still current; if it changed, use the new one and copy your answers from this sheet.',
      'Compare the household income with the current table at uscis.gov/i-864p for your household size. If it falls short, you can add assets (Part 7) or find a joint sponsor.',
      'Attach a copy or transcript of your most recent federal tax return (with W-2s or 1099s), proof of your citizenship or residence and, if you add relatives’ income, their Forms I-864A.',
      'Print the PDF and sign Part 8, Item 6, by hand in black ink. If an interpreter or preparer helped you, they sign and date Parts 9 and 10 by hand.',
    ],
  },
  sections: [
    {
      id: 'basis',
      part: 'Part 1',
      title: t('Por qué patrocina', 'Why you are sponsoring'),
      questions: [
        {
          id: 'basis',
          kind: 'choice',
          formRef: 'Part 1 · Item 1 · Basis For Filing Affidavit of Support',
          question: t('¿Por qué presenta esta declaración?', 'Why are you filing this affidavit?'),
          why: t(
            'El peticionario (quien presentó el I-130) siempre debe presentar un I-864. Si sus ingresos no alcanzan, otra persona puede ser copatrocinador.',
            'The petitioner (who filed the I-130) must always file an I-864. If their income isn’t enough, someone else can be a joint sponsor.',
          ),
          options: [
            { value: 'petitioner', label: t('Soy el peticionario: presenté (o presento) el I-130 por mi familiar', 'I am the petitioner: I filed (or am filing) the I-130 for my relative') },
            { value: 'onlyJoint', label: t('Soy el único copatrocinador', 'I am the only joint sponsor') },
            { value: 'firstJoint', label: t('Soy el primero de dos copatrocinadores', 'I am the first of two joint sponsors') },
            { value: 'secondJoint', label: t('Soy el segundo de dos copatrocinadores', 'I am the second of two joint sponsors') },
            { value: 'substitute', label: t('Soy patrocinador sustituto: el peticionario falleció', 'I am a substitute sponsor: the petitioner died') },
          ],
        },
        {
          id: 'substituteRelationship',
          kind: 'fields',
          formRef: 'Part 1 · Item 1.f',
          showIf: is('basis', 'substitute'),
          question: t('¿Qué es usted del inmigrante?', 'What is your relationship to the immigrant?'),
          fields: [{ id: 'substitute.relationship', type: 'text', required: true, label: { es: 'Relación (en inglés, por ejemplo "brother")', en: 'Relationship' }, formRef: 'Part 1 · Item 1.f · I am the intending immigrant’s', maxLength: 38 }],
        },
      ],
    },
    {
      id: 'sponsor',
      part: 'Part 2',
      title: t('Sobre usted', 'About you'),
      questions: [
        {
          id: 'name',
          kind: 'fields',
          formRef: 'Part 2 · Item 1 · Sponsor’s Full Legal Name',
          question: t('¿Cuál es su nombre legal completo?', 'What is your full legal name?'),
          notice: {
            tone: 'info',
            title: { es: 'Usted es el patrocinador', en: 'You are the sponsor' },
            body: { es: 'Estas preguntas son sobre usted, la persona que se compromete a mantener al inmigrante.', en: 'These questions are about you, the person committing to support the immigrant.' },
          },
          fields: nameFields('name', 'Part 2 · Item 1').map((f) => ({ ...f, maxLength: f.id.endsWith('family') ? 30 : 18 })),
        },
        {
          id: 'mailing',
          kind: 'fields',
          formRef: 'Part 2 · Item 2 · Sponsor’s Current Mailing Address',
          question: t('¿A qué dirección le llega el correo?', 'Where do you get your mail?'),
          fields: anyAddress('mailing', 'Part 2 · Item 2', { careOf: true }),
        },
        {
          id: 'mailingSame',
          kind: 'choice',
          formRef: 'Part 2 · Item 3 · Is your current mailing address the same as your physical address?',
          question: t('¿Vive en esa misma dirección?', 'Do you live at that same address?'),
          options: yesNo,
        },
        {
          id: 'home',
          kind: 'fields',
          formRef: 'Part 2 · Item 4 · Sponsor’s Physical Address',
          showIf: is('mailingSame', 'no'),
          question: t('¿Dónde vive?', 'Where do you live?'),
          fields: anyAddress('home', 'Part 2 · Item 4'),
        },
        {
          id: 'about',
          kind: 'fields',
          formRef: 'Part 2 · Items 5–8, 10–11',
          question: t('Sus datos', 'Your details'),
          why: t('El "domicilio" es el país donde vive de forma principal; normalmente United States.', 'Your domicile is the country where you mainly live; usually United States.'),
          fields: [
            { id: 'domicile', type: 'text', required: true, label: { es: 'País de domicilio', en: 'Country of domicile' }, formRef: 'Part 2 · Item 5 · Country of Domicile', placeholder: 'United States' },
            date('dob', 'Fecha de nacimiento', 'Date of birth', 'Part 2 · Item 6 · Date of Birth'),
            { id: 'birthCountry', type: 'text', required: true, label: { es: 'País de nacimiento', en: 'Country of birth' }, formRef: 'Part 2 · Item 7 · Country of Birth' },
            { id: 'ssn', type: 'ssn', required: true, label: { es: 'Número de Seguro Social', en: 'Social Security number' }, formRef: 'Part 2 · Item 8 · U.S. Social Security Number (Required)', placeholder: '123-45-6789' },
            { id: 'aNumber', type: 'aNumber', label: { es: 'A-Number (si tiene)', en: 'A-Number (if any)' }, formRef: 'Part 2 · Item 10 · Sponsor’s A-Number' },
            { id: 'uscisAccount', type: 'uscisAccount', label: { es: 'Número de cuenta en línea de USCIS', en: 'USCIS online account number' }, formRef: 'Part 2 · Item 11' },
          ],
        },
        {
          id: 'status',
          kind: 'choice',
          formRef: 'Part 2 · Item 9 · Immigration Status',
          question: t('¿Cuál es su estatus?', 'What is your status?'),
          why: t('Debe adjuntar prueba de su ciudadanía o residencia.', 'You must attach proof of your citizenship or residence.'),
          options: [
            { value: 'A', label: t('Ciudadano/a de EE.UU.', 'U.S. citizen') },
            { value: 'B', label: t('Nacional de EE.UU.', 'U.S. national') },
            { value: 'C', label: t('Residente permanente', 'Lawful permanent resident') },
          ],
        },
        {
          id: 'activeDuty',
          kind: 'choice',
          formRef: 'Part 2 · Item 12 · I am currently on active duty in the U.S. Armed Forces or U.S. Coast Guard',
          showIf: is('basis', 'petitioner'),
          question: t('¿Está en servicio activo en las fuerzas armadas o la Guardia Costera?', 'Are you on active duty in the U.S. armed forces or Coast Guard?'),
          why: t('Si lo está y patrocina a su cónyuge o hijo/a, el mínimo baja al 100% de la línea de pobreza.', 'If so and you sponsor your spouse or child, the minimum drops to 100% of the poverty line.'),
          options: yesNo,
        },
      ],
    },
    {
      id: 'immigrant',
      part: 'Part 3',
      title: t('El inmigrante principal', 'The principal immigrant'),
      questions: [
        {
          id: 'principal.name',
          kind: 'fields',
          formRef: 'Part 3 · Item 1 · Principal Immigrant’s Full Legal Name',
          question: t('¿Cómo se llama el inmigrante principal?', 'What is the principal immigrant’s name?'),
          why: t('Es la persona por quien se presentó la petición (el beneficiario del I-130).', 'The person the petition was filed for (the I-130 beneficiary).'),
          fields: nameFields('principal', 'Part 3 · Item 1').map((f) => ({ ...f, maxLength: f.id.endsWith('family') ? 30 : 18 })),
        },
        {
          id: 'principal.mailing',
          kind: 'fields',
          formRef: 'Part 3 · Item 2 · Current Mailing Address',
          question: t('¿A qué dirección le llega el correo al inmigrante?', 'Where does the immigrant get mail?'),
          fields: anyAddress('principal.mailing', 'Part 3 · Item 2', { careOf: true }),
        },
        {
          id: 'principal.about',
          kind: 'fields',
          formRef: 'Part 3 · Items 3–7',
          question: t('Datos del inmigrante', 'The immigrant’s details'),
          fields: [
            { id: 'principal.citizenship', type: 'text', required: true, label: { es: 'País de ciudadanía', en: 'Country of citizenship' }, formRef: 'Part 3 · Item 3' },
            date('principal.dob', 'Fecha de nacimiento', 'Date of birth', 'Part 3 · Item 4'),
            { id: 'principal.aNumber', type: 'aNumber', label: { es: 'A-Number (si tiene)', en: 'A-Number (if any)' }, formRef: 'Part 3 · Item 5' },
            { id: 'principal.uscisAccount', type: 'uscisAccount', label: { es: 'Número de cuenta en línea de USCIS', en: 'USCIS online account number' }, formRef: 'Part 3 · Item 6' },
            { id: 'principal.phone', type: 'phone', label: { es: 'Teléfono de día', en: 'Daytime phone' }, formRef: 'Part 3 · Item 7' },
          ],
        },
      ],
    },
    {
      id: 'sponsored',
      part: 'Part 4',
      title: t('A quiénes patrocina', 'Who you are sponsoring'),
      questions: [
        {
          id: 'sponsorsPrincipal',
          kind: 'choice',
          formRef: 'Part 4 · Item 1 · I am sponsoring the principal immigrant named in Part 3',
          question: t('¿Patrocina usted al inmigrante principal?', 'Are you sponsoring the principal immigrant?'),
          why: t('Responda No solo si es el segundo copatrocinador o patrocina únicamente a familiares que llegarán más de 6 meses después.', 'Answer No only if you are the second joint sponsor or only sponsor relatives arriving more than six months later.'),
          options: yesNo,
        },
        {
          id: 'familyTiming',
          kind: 'choice',
          formRef: 'Part 4 · Items 2–3',
          question: t('¿Patrocina también a familiares del inmigrante (cónyuge o hijos)?', 'Are you also sponsoring the immigrant’s family members (spouse or children)?'),
          why: t('No incluya a familiares que tengan su propia petición.', 'Don’t include relatives who have their own petition.'),
          options: [
            { value: 'none', label: t('No', 'No') },
            { value: 'same', label: t('Sí, inmigran al mismo tiempo o dentro de 6 meses', 'Yes, immigrating at the same time or within six months') },
            { value: 'later', label: t('Sí, inmigran más de 6 meses después', 'Yes, immigrating more than six months later') },
          ],
        },
        ...rows({
          max: 4,
          id: 'member',
          first: is('familyTiming', 'same', 'later'),
          question: (i) => (i === 1 ? t('Un familiar que también patrocina', 'A family member you also sponsor') : t('Otro familiar', 'Another family member')),
          more: t('¿Patrocina a otro familiar más?', 'Are you sponsoring another family member?'),
          formRef: 'Part 4 · Items 4–7 · Family Members',
          fields: (i) => [
            ...nameFields(`member${i}`, `Part 4 · Family Member ${i}`).map((f) => ({ ...f, maxLength: f.id.endsWith('family') ? 30 : 18 })),
            { id: `member${i}.relationship`, type: 'text', required: true, label: { es: 'Relación con el inmigrante principal (en inglés: spouse, son, daughter)', en: 'Relationship to the principal immigrant' }, formRef: `Part 4 · Family Member ${i} · Relationship`, maxLength: 30, placeholder: 'son' },
            date(`member${i}.dob`, 'Fecha de nacimiento', 'Date of birth', `Part 4 · Family Member ${i} · Date of Birth`),
            { id: `member${i}.aNumber`, type: 'aNumber', label: { es: 'A-Number (si tiene)', en: 'A-Number (if any)' }, formRef: `Part 4 · Family Member ${i} · A-Number` },
            { id: `member${i}.uscisAccount`, type: 'uscisAccount', label: { es: 'Cuenta de USCIS', en: 'USCIS online account number' }, formRef: `Part 4 · Family Member ${i}` },
          ],
          overflow: {
            es: 'El formulario tiene espacio para 4 familiares. Si son más, escríbalos a mano en la Parte 11.',
            en: 'The form has room for 4 family members. If there are more, write them by hand in Part 11.',
          },
        }),
      ],
    },
    {
      id: 'household',
      part: 'Part 5',
      title: t('Tamaño de su hogar', 'Your household size'),
      questions: [
        {
          id: 'householdCounts',
          kind: 'fields',
          formRef: 'Part 5 · Items 2–7 · Persons NOT sponsored in this affidavit',
          question: t('¿Quiénes más forman su hogar?', 'Who else is in your household?'),
          why: t(
            'No cuente dos veces a nadie, ni a las personas que patrocina en esta declaración (las contamos solas). Usted cuenta como 1. Escriba 0 si no aplica.',
            'Don’t count anyone twice, or the people you sponsor in this affidavit (we count them for you). You count as 1. Enter 0 if it doesn’t apply.',
          ),
          fields: [
            count('hh.spouse', 'Su cónyuge (1 si está casado/a y no lo/la patrocina aquí)', 'Your spouse (1 if married and not sponsored here)', 'Part 5 · Item 3'),
            count('hh.children', 'Hijos que dependen de usted', 'Dependent children', 'Part 5 · Item 4'),
            count('hh.otherDependents', 'Otras personas que dependen de usted (en su declaración de impuestos)', 'Other dependents (on your tax return)', 'Part 5 · Item 5'),
            count('hh.previouslySponsored', 'Personas que patrocinó antes y aún tiene obligación de mantener', 'People you sponsored before who you still must support', 'Part 5 · Item 6'),
            count('hh.i864a', 'Familiares que viven con usted y suman sus ingresos con un I-864A', 'Relatives living with you who add their income with Form I-864A', 'Part 5 · Item 7'),
          ],
        },
      ],
    },
    {
      id: 'income',
      part: 'Part 6',
      title: t('Trabajo e ingresos', 'Employment and income'),
      questions: [
        {
          id: 'employment',
          kind: 'choice',
          formRef: 'Part 6 · Items 1–6 · I am currently',
          question: t('¿Cuál es su situación de trabajo?', 'What is your work situation?'),
          options: [
            { value: 'employed', label: t('Empleado/a', 'Employed') },
            { value: 'self', label: t('Trabajo por mi cuenta', 'Self-employed') },
            { value: 'retired', label: t('Jubilado/a', 'Retired') },
            { value: 'unemployed', label: t('Sin empleo', 'Unemployed') },
          ],
        },
        {
          id: 'employed',
          kind: 'fields',
          formRef: 'Part 6 · Items 1–3',
          showIf: is('employment', 'employed'),
          question: t('Sobre su trabajo', 'About your job'),
          fields: [
            { id: 'job.occupation', type: 'text', required: true, label: { es: 'Trabaja como (ocupación)', en: 'Employed as' }, formRef: 'Part 6 · Item 1 · Employed as a/an' },
            { id: 'job.employer1', type: 'text', required: true, label: { es: 'Nombre del empleador', en: 'Name of employer' }, formRef: 'Part 6 · Item 2 · Name of Employer 1', maxLength: 34 },
            { id: 'job.employer2', type: 'text', label: { es: 'Segundo empleador (si tiene)', en: 'Second employer (if any)' }, formRef: 'Part 6 · Item 3 · Name of Employer 2', maxLength: 34 },
          ],
        },
        {
          id: 'selfEmployed',
          kind: 'fields',
          formRef: 'Part 6 · Item 4',
          showIf: is('employment', 'self'),
          question: t('¿A qué se dedica?', 'What do you do?'),
          fields: [{ id: 'job.selfOccupation', type: 'text', required: true, label: { es: 'Ocupación', en: 'Occupation' }, formRef: 'Part 6 · Item 4 · Self-Employed as a/an' }],
        },
        {
          id: 'retired',
          kind: 'fields',
          formRef: 'Part 6 · Item 5',
          showIf: is('employment', 'retired'),
          question: t('¿Desde cuándo está jubilado/a?', 'Since when are you retired?'),
          fields: [date('job.retiredSince', 'Fecha', 'Date', 'Part 6 · Item 5 · Retired Since')],
        },
        {
          id: 'unemployed',
          kind: 'fields',
          formRef: 'Part 6 · Item 6',
          showIf: is('employment', 'unemployed'),
          question: t('¿Desde cuándo está sin empleo?', 'Since when are you unemployed?'),
          fields: [date('job.unemployedSince', 'Fecha', 'Date', 'Part 6 · Item 6 · Unemployed Since')],
        },
        {
          id: 'myIncome',
          kind: 'fields',
          formRef: 'Part 6 · Item 7 · My current individual annual income',
          question: t('¿Cuánto gana usted al año?', 'How much do you earn per year?'),
          why: t('Su ingreso anual actual, antes de impuestos.', 'Your current annual income, before taxes.'),
          fields: [money('income.mine', 'Ingreso anual (dólares)', 'Annual income (dollars)', 'Part 6 · Item 7', true)],
        },
        {
          id: 'hhIncome.more0',
          kind: 'choice',
          formRef: 'Part 6 · Items 8–11 · Income you are using from any other person who was counted in your household size',
          question: t('¿Suma el ingreso de otra persona de su hogar?', 'Are you adding the income of someone else in your household?'),
          why: t('Por ejemplo, su cónyuge u otro familiar que vive con usted y firma un I-864A. En algunos casos, el propio inmigrante.', 'For example, your spouse or another relative who lives with you and signs an I-864A. In some cases, the immigrant.'),
          options: yesNo,
        },
        ...rows({
          max: 4,
          id: 'hhIncome',
          first: is('hhIncome.more0', 'yes'),
          question: (i) => (i === 1 ? t('¿De quién es el ingreso?', 'Whose income is it?') : t('Otra persona', 'Another person')),
          more: t('¿Suma el ingreso de otra persona más?', 'Are you adding another person’s income?'),
          formRef: 'Part 6 · Items 8–11',
          fields: (i) => [
            { id: `hhIncome${i}.name`, type: 'text', required: true, label: { es: 'Nombre', en: 'Name' }, formRef: `Part 6 · Person ${i} · Name`, maxLength: 38 },
            { id: `hhIncome${i}.relationship`, type: 'text', required: true, label: { es: 'Relación con usted (en inglés)', en: 'Relationship' }, formRef: `Part 6 · Person ${i} · Relationship`, maxLength: 38, placeholder: 'spouse' },
            money(`hhIncome${i}.amount`, 'Ingreso anual actual', 'Current income', `Part 6 · Person ${i} · Current Income`, true),
          ],
          overflow: { es: 'Si son más de 4 personas, escríbalas a mano en la Parte 11.', en: 'If there are more than 4 people, write them by hand in Part 11.' },
        }),
        {
          id: 'i864aStatus',
          kind: 'choice',
          formRef: 'Part 6 · Items 13–14',
          showIf: is('hhIncome.more0', 'yes'),
          question: t('¿Esas personas llenaron el I-864A?', 'Have those people completed Form I-864A?'),
          options: [
            { value: 'completed', label: t('Sí, todas llenaron el I-864A y lo adjunto', 'Yes, all completed Form I-864A and I attach them') },
            { value: 'intending', label: t('Una no lo necesita: es el inmigrante y no trae dependientes', 'One doesn’t need it: they are the immigrant with no accompanying dependents') },
          ],
        },
        {
          id: 'i864aIntendingName',
          kind: 'fields',
          formRef: 'Part 6 · Item 14',
          showIf: all(is('hhIncome.more0', 'yes'), is('i864aStatus', 'intending')),
          question: t('¿Quién es esa persona?', 'Who is that person?'),
          fields: [{ id: 'i864a.intendingName', type: 'text', required: true, label: { es: 'Nombre', en: 'Name' }, formRef: 'Part 6 · Item 14', maxLength: 38 }],
        },
        {
          id: 'filedTaxes',
          kind: 'choice',
          formRef: 'Part 6 · Item 15 · Have you filed a Federal income tax return for each of the three most recent tax years?',
          question: t('¿Presentó declaración federal de impuestos en cada uno de los últimos 3 años?', 'Did you file a federal income tax return for each of the last 3 tax years?'),
          options: yesNo,
        },
        {
          id: 'taxes',
          kind: 'fields',
          formRef: 'Part 6 · Item 16 · Total income (adjusted gross income) on your Federal income tax returns',
          question: t('¿Cuál fue su ingreso total en sus declaraciones de impuestos?', 'What was your total income on your tax returns?'),
          why: t(
            'Use el "total income" (ingreso bruto ajustado) del formulario 1040. El año más reciente es obligatorio; los otros dos son opcionales. Si no tuvo que declarar ese año, escriba 0.',
            'Use the total (adjusted gross) income from Form 1040. The most recent year is required; the other two are optional. If you didn’t have to file that year, enter 0.',
          ),
          fields: [
            { id: 'tax1.year', type: 'number', required: true, label: { es: 'Año más reciente', en: 'Most recent year' }, formRef: 'Part 6 · Item 16.a · Tax Year', maxLength: 4, placeholder: '2025' },
            money('tax1.income', 'Ingreso total de ese año', 'Total income that year', 'Part 6 · Item 16.a · Total Income', true),
            { id: 'tax2.year', type: 'number', label: { es: 'Segundo año más reciente', en: '2nd most recent year' }, formRef: 'Part 6 · Item 16.b · Tax Year', maxLength: 4 },
            money('tax2.income', 'Ingreso total', 'Total income', 'Part 6 · Item 16.b · Total Income'),
            { id: 'tax3.year', type: 'number', label: { es: 'Tercer año más reciente', en: '3rd most recent year' }, formRef: 'Part 6 · Item 16.c · Tax Year', maxLength: 4 },
            money('tax3.income', 'Ingreso total', 'Total income', 'Part 6 · Item 16.c · Total Income'),
          ],
        },
        {
          id: 'notRequired',
          kind: 'choice',
          formRef: 'Part 6 · Item 17',
          showIf: is('filedTaxes', 'no'),
          question: t('¿No presentó porque sus ingresos estaban por debajo del mínimo para declarar?', 'Did you not file because your income was below the IRS filing requirement?'),
          why: t('Si es así, adjunte pruebas.', 'If so, attach evidence.'),
          options: yesNo,
        },
      ],
    },
    {
      id: 'assets',
      part: 'Part 7',
      title: t('Bienes', 'Assets'),
      questions: [
        {
          id: 'useAssets',
          kind: 'choice',
          formRef: 'Part 7 · Use of Assets to Supplement Income',
          question: t('¿Necesita sumar bienes porque sus ingresos no alcanzan?', 'Do you need to add assets because your income isn’t enough?'),
          why: t(
            'Si el ingreso de su hogar supera la línea de pobreza requerida (vea uscis.gov/i-864p), no necesita esta parte. Los bienes deben valer, en general, 5 veces lo que falta (3 veces si patrocina a su cónyuge o hijo/a).',
            'If your household income exceeds the required poverty line (see uscis.gov/i-864p), you don’t need this part. Assets generally must equal 5 times the shortfall (3 times for a spouse or child).',
          ),
          options: yesNo,
        },
        {
          id: 'myAssets',
          kind: 'fields',
          formRef: 'Part 7 · Items 1–5 · Your Assets',
          showIf: is('useAssets', 'yes'),
          question: t('Sus bienes', 'Your assets'),
          why: t('Valor neto: lo que vale menos lo que debe. Escriba 0 si no tiene.', 'Net value: what it’s worth minus what you owe. Enter 0 if none.'),
          fields: [
            money('assets.cash', 'Efectivo, ahorros y cuentas de cheques', 'Cash, savings and checking accounts', 'Part 7 · Item 1'),
            money('assets.realEstate', 'Valor neto de bienes raíces', 'Net value of real estate', 'Part 7 · Item 2'),
            money('assets.stocks', 'Acciones, bonos y certificados de depósito', 'Stocks, bonds and certificates of deposit', 'Part 7 · Item 3'),
            money('assets.household', 'Bienes de familiares de su hogar (total de sus I-864A)', 'Household members’ assets (total from their I-864As)', 'Part 7 · Item 5'),
          ],
        },
        {
          id: 'principalAssets',
          kind: 'fields',
          formRef: 'Part 7 · Items 6–9 · Assets of the principal sponsored immigrant',
          showIf: all(is('useAssets', 'yes'), is('sponsorsPrincipal', 'yes')),
          question: t('Bienes del inmigrante principal (si los suma)', 'The principal immigrant’s assets (if you add them)'),
          fields: [
            money('principalAssets.cash', 'Ahorros y cuentas de cheques', 'Savings and checking accounts', 'Part 7 · Item 6'),
            money('principalAssets.realEstate', 'Valor neto de bienes raíces', 'Net value of real estate', 'Part 7 · Item 7'),
            money('principalAssets.stocks', 'Acciones, bonos y certificados', 'Stocks, bonds and certificates', 'Part 7 · Item 8'),
          ],
        },
      ],
    },
    {
      id: 'contact',
      part: 'Part 8',
      title: t('Contacto', 'Contact'),
      questions: [
        {
          id: 'contactInfo',
          kind: 'fields',
          formRef: 'Part 8 · Items 3–5 · Sponsor’s Contact Information',
          question: t('¿Cómo puede contactarle USCIS?', 'How can USCIS contact you?'),
          fields: [
            { id: 'phone', type: 'phone', required: true, label: { es: 'Teléfono de día', en: 'Daytime phone' }, formRef: 'Part 8 · Item 3', placeholder: '213 555 0123' },
            { id: 'mobile', type: 'phone', label: { es: 'Celular', en: 'Mobile phone' }, formRef: 'Part 8 · Item 4' },
            { id: 'email', type: 'email', label: { es: 'Correo electrónico', en: 'Email' }, formRef: 'Part 8 · Item 5', maxLength: 38 },
          ],
        },
        {
          id: 'readsEnglish',
          kind: 'choice',
          formRef: 'Part 8 · Item 1 · Sponsor’s Statement',
          question: t('¿Puede leer y entender la declaración en inglés?', 'Can you read and understand the affidavit in English?'),
          why: t('Lea bien la Parte 8: al firmar acepta obligaciones legales que pueden durar muchos años.', 'Read Part 8 carefully: by signing you accept legal obligations that can last many years.'),
          notice: {
            tone: 'legal',
            title: { es: 'Es un contrato', en: 'It’s a contract' },
            body: {
              es: 'Al firmar el I-864 se compromete a mantener al inmigrante al 125% de la línea de pobreza hasta que se haga ciudadano, trabaje 40 trimestres, salga del país o fallezca. El divorcio no termina la obligación. Si tiene dudas, consulte a un abogado.',
              en: 'By signing Form I-864 you commit to support the immigrant at 125% of the poverty line until they become a citizen, work 40 quarters, leave the country or die. Divorce does not end the obligation. If in doubt, consult an attorney.',
            },
          },
          options: [
            { value: 'A', label: t('Sí, leo inglés', 'Yes, I read English') },
            { value: 'B', label: t('No, un intérprete me la leerá', 'No, an interpreter will read it to me') },
          ],
        },
        {
          id: 'interpreterLanguage',
          kind: 'fields',
          formRef: 'Part 8 · Item 1.b',
          showIf: is('readsEnglish', 'B'),
          question: t('¿En qué idioma se la leerán?', 'What language will it be read to you in?'),
          fields: [{ id: 'fluentLanguage', type: 'text', required: true, label: { es: 'Idioma', en: 'Language' }, formRef: 'Part 8 · Item 1.b', placeholder: 'Spanish' }],
        },
        {
          id: 'preparer',
          kind: 'choice',
          formRef: 'Part 8 · Item 2',
          question: t('¿Alguien más (no usted) preparó esta declaración?', 'Did someone else prepare this affidavit for you?'),
          options: yesNo,
        },
        {
          id: 'preparerName',
          kind: 'fields',
          formRef: 'Part 8 · Item 2',
          showIf: is('preparer', 'yes'),
          question: t('¿Quién la preparó?', 'Who prepared it?'),
          fields: [{ id: 'preparer.name', type: 'text', required: true, label: { es: 'Nombre del preparador', en: 'Preparer’s name' }, formRef: 'Part 8 · Item 2' }],
        },
      ],
    },
    assistanceSection({ usedInterpreter, usedPreparer, interpreterPart: 'Part 9', preparerPart: 'Part 10', address: false, statement: false }),
  ],
};
