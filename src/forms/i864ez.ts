import type { Answers, Field, FormDefinition, YesNoItem } from './types';
import type { T } from '../i18n';
import { anyAddress, date, is, nameFields, yesNo } from './helpers';

// Questions follow USCIS Form I-864EZ, Affidavit of Support Under Section 213A of the INA,
// edition 08/24/26. The PDF mapping lives in src/pdf/i864ezPdf.ts. Answer ids match the I-864's
// where the question is the same.

export const I864EZ_EDITION = '08/24/26';

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

const count = (id: string, es: string, en: string, formRef: string, maxLength = 2): Field => ({ id, type: 'number', required: true, label: { es, en }, formRef, placeholder: '0', maxLength });

/** Part 1: who may use this short form. */
export const QUALIFY_ITEMS: YesNoItem[] = [
  { id: 'ez.petitioner', formRef: 'Part 1 · Item 1', label: t('Soy el peticionario: presenté el I-130 (u otra petición) por el familiar que patrocino.', 'I am the petitioner of the family member sponsored on this affidavit.') },
  { id: 'ez.w2', formRef: 'Part 1 · Item 2', label: t('Uso solo mis propios ingresos de trabajo o jubilación, que aparecen en formularios W-2.', 'I am using my own earned or retirement income, documented on IRS Form W-2.') },
  { id: 'ez.onlyOne', formRef: 'Part 1 · Item 3', label: t('El inmigrante que patrocino es la única persona que inmigra con esa petición (sin cónyuge ni hijos que lo acompañen).', 'The sponsored immigrant is the only person immigrating based on the underlying visa petition.') },
];

/** Whether any Part 1 answer means the sponsor must use Form I-864 instead. */
export const needsI864 = (a: Answers) => QUALIFY_ITEMS.some((i) => a[i.id] === 'no');

export const i864ez: FormDefinition = {
  id: 'i-864ez',
  number: 'I-864EZ',
  edition: I864EZ_EDITION,
  title: t('Declaración de patrocinio económico (versión corta)', 'Affidavit of Support (short form)'),
  summary: {
    es: 'La versión corta del I-864: para el peticionario que patrocina a una sola persona con sus propios ingresos de W-2.',
    en: 'The short version of Form I-864: for a petitioner sponsoring one person with their own W-2 income.',
  },
  intro: {
    es: 'El I-864EZ es la misma promesa de mantener al inmigrante que el I-864, pero más corto. Solo puede usarlo si (1) usted presentó la petición, (2) usa solo sus propios ingresos de trabajo o jubilación con W-2 (no bienes, ni ingresos de otras personas, ni trabajo por cuenta propia), y (3) patrocina a una sola persona. Si algo de eso no se cumple, use el I-864, que también está en esta app.',
    en: 'Form I-864EZ is the same promise to support the immigrant as Form I-864, but shorter. You can only use it if (1) you filed the petition, (2) you use only your own W-2 earned or retirement income (no assets, other people’s income or self-employment), and (3) you sponsor only one person. If any of that is not true, use Form I-864, which is also in this app.',
  },
  minutes: 15,
  pdf: {
    path: 'forms/i-864ez.pdf',
    fileName: 'I-864EZ-filled.pdf',
    load: () => import('../pdf/i864ezPdf').then((m) => m.fillI864EZ),
    signHere: { es: 'Parte 6, Ítem 6', en: 'Part 6, Item 6' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/i-864ez que la edición {edition} sigue vigente; si cambió, use la nueva y copie sus respuestas de esta hoja.',
      'Compare su ingreso con la tabla vigente de uscis.gov/i-864p para el tamaño de su hogar (por lo general el 125% de la línea de pobreza). Si no alcanza, necesita el I-864 con bienes o un copatrocinador.',
      'Adjunte una copia o transcripción de su declaración federal de impuestos más reciente con sus W-2, y prueba de su ciudadanía o residencia.',
      'Imprima el PDF y firme la Parte 6, Ítem 6, a mano con tinta negra. Si un intérprete o preparador le ayudó, ellos llenan y firman a mano las Partes 7 y 8.',
    ],
    en: [
      'Check at uscis.gov/i-864ez that edition {edition} is still current; if it changed, use the new one and copy your answers from this sheet.',
      'Compare your income with the current table at uscis.gov/i-864p for your household size (usually 125% of the poverty line). If it falls short, you need Form I-864 with assets or a joint sponsor.',
      'Attach a copy or transcript of your most recent federal tax return with your W-2s, and proof of your citizenship or residence.',
      'Print the PDF and sign Part 6, Item 6, by hand in black ink. If an interpreter or preparer helped you, they complete and sign Parts 7 and 8 by hand.',
    ],
  },
  sections: [
    {
      id: 'qualify',
      part: 'Part 1',
      title: t('¿Puede usar este formulario?', 'Can you use this form?'),
      questions: [
        {
          id: 'qualify',
          kind: 'yesNoList',
          formRef: 'Part 1 · Items 1–3 · Qualifying to Use Form I-864EZ',
          question: t('Conteste Sí o No a cada una', 'Answer Yes or No to each one'),
          why: t('Si alguna es No, debe usar el I-864.', 'If any of them is No, you must use Form I-864.'),
          items: QUALIFY_ITEMS,
        },
        {
          id: 'useI864',
          kind: 'choice',
          formRef: 'Part 1 · No (Use Form I-864)',
          showIf: needsI864,
          question: t('Este formulario no es para su caso', 'This form is not for your case'),
          notice: {
            tone: 'legal',
            title: t('Use el I-864', 'Use Form I-864'),
            body: t('USCIS rechaza el I-864EZ si alguna respuesta de la Parte 1 es No. Vuelva al inicio y llene el I-864 en esta app; muchas respuestas son las mismas.', 'USCIS rejects Form I-864EZ if any Part 1 answer is No. Go back to the start and fill in Form I-864 in this app; many answers are the same.'),
          },
          options: [
            { value: 'switch', label: t('Entendido, llenaré el I-864', 'Understood, I will fill in Form I-864') },
            { value: 'review', label: t('Me equivoqué; voy a corregir mis respuestas', 'I made a mistake; I will correct my answers') },
          ],
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
          formRef: 'Part 2 · Item 1',
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
          formRef: 'Part 2 · Item 2 · Current Mailing Address',
          question: t('¿A qué dirección le llega el correo?', 'Where do you get your mail?'),
          fields: anyAddress('mailing', 'Part 2 · Item 2', { careOf: true }),
        },
        {
          id: 'mailingSame',
          kind: 'choice',
          formRef: 'Part 2 · Item 3',
          question: t('¿Vive en esa misma dirección?', 'Do you live at that same address?'),
          options: yesNo,
        },
        {
          id: 'home',
          kind: 'fields',
          formRef: 'Part 2 · Item 4 · Physical Address',
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
            { id: 'domicile', type: 'text', required: true, label: { es: 'País de domicilio', en: 'Country of domicile' }, formRef: 'Part 2 · Item 5', placeholder: 'United States' },
            date('dob', 'Fecha de nacimiento', 'Date of birth', 'Part 2 · Item 6'),
            { id: 'birthCountry', type: 'text', required: true, label: { es: 'País de nacimiento', en: 'Country of birth' }, formRef: 'Part 2 · Item 7' },
            { id: 'ssn', type: 'ssn', required: true, label: { es: 'Número de Seguro Social', en: 'Social Security number' }, formRef: 'Part 2 · Item 8 (Required)', placeholder: '123-45-6789' },
            { id: 'aNumber', type: 'aNumber', label: { es: 'A-Number (si tiene)', en: 'A-Number (if any)' }, formRef: 'Part 2 · Item 10' },
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
          formRef: 'Part 2 · Item 12 · Military Service',
          question: t('¿Está en servicio activo en las fuerzas armadas o la Guardia Costera?', 'Are you on active duty in the U.S. armed forces or Coast Guard?'),
          why: t('Si lo está y patrocina a su cónyuge o hijo/a, el mínimo baja al 100% de la línea de pobreza.', 'If so and you sponsor your spouse or child, the minimum drops to 100% of the poverty line.'),
          options: yesNo,
        },
      ],
    },
    {
      id: 'immigrant',
      part: 'Part 3',
      title: t('El inmigrante', 'The immigrant'),
      questions: [
        {
          id: 'principal.name',
          kind: 'fields',
          formRef: 'Part 3 · Item 1 · Name of Immigrant',
          question: t('¿Cómo se llama el inmigrante que patrocina?', 'What is the name of the immigrant you sponsor?'),
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
      id: 'household',
      part: 'Part 4',
      title: t('Tamaño de su hogar', 'Your household size'),
      questions: [
        {
          id: 'householdCounts',
          kind: 'fields',
          formRef: 'Part 4 · Items 2–5',
          question: t('¿Quiénes más forman su hogar?', 'Who else is in your household?'),
          why: t(
            'Usted y el inmigrante ya cuentan como 2 (Ítem 1). No cuente a nadie dos veces: si patrocina a su cónyuge, ponga 0 en cónyuge. Escriba 0 si no aplica. La app suma el total.',
            'You and the immigrant already count as 2 (Item 1). Don’t count anyone twice: if you are sponsoring your spouse, enter 0 for spouse. Enter 0 if it doesn’t apply. The app adds up the total.',
          ),
          fields: [
            count('hh.spouse', 'Su cónyuge (1 si está casado/a y no lo/la patrocina aquí)', 'Your spouse (1 if married and not sponsored here)', 'Part 4 · Item 2', 1),
            count('hh.children', 'Hijos menores de 21 que dependen de usted', 'Dependent children under 21', 'Part 4 · Item 3'),
            count('hh.previouslySponsored', 'Personas que patrocinó antes con un I-864 y aún tiene obligación de mantener', 'People you sponsored before on Form I-864 who you still must support', 'Part 4 · Item 4'),
            count('hh.otherDependents', 'Otros dependientes en su última declaración de impuestos', 'Other dependents on your latest tax return', 'Part 4 · Item 5'),
          ],
        },
      ],
    },
    {
      id: 'income',
      part: 'Part 5',
      title: t('Trabajo e ingresos', 'Employment and income'),
      questions: [
        {
          id: 'employment',
          kind: 'choice',
          formRef: 'Part 5 · Item 1 · I am currently',
          question: t('¿Cuál es su situación de trabajo?', 'What is your work situation?'),
          why: t('Si trabaja por su cuenta o no tiene empleo, use el I-864.', 'If you are self-employed or unemployed, use Form I-864.'),
          options: [
            { value: 'employed', label: t('Empleado/a', 'Employed') },
            { value: 'retired', label: t('Jubilado/a', 'Retired') },
          ],
        },
        {
          id: 'employed',
          kind: 'fields',
          formRef: 'Part 5 · Item 2 · Current Occupation',
          showIf: is('employment', 'employed'),
          question: t('¿Para quién trabaja?', 'Who do you work for?'),
          fields: [
            { id: 'job.employer1', type: 'text', required: true, label: { es: 'Nombre del empleador', en: 'Name of employer' }, formRef: 'Part 5 · Item 2 · Name of Employer 1' },
            { id: 'job.employer2', type: 'text', label: { es: 'Segundo empleador (si tiene)', en: 'Second employer (if any)' }, formRef: 'Part 5 · Item 2 · Name of Employer 2' },
          ],
        },
        {
          id: 'retired',
          kind: 'fields',
          formRef: 'Part 5 · Item 3',
          showIf: is('employment', 'retired'),
          question: t('¿Desde cuándo está jubilado/a?', 'Since when are you retired?'),
          fields: [date('job.retiredSince', 'Fecha de jubilación', 'Date of retirement', 'Part 5 · Item 3')],
        },
        {
          id: 'myIncome',
          kind: 'fields',
          formRef: 'Part 5 · Item 4 · My current individual annual income',
          question: t('¿Cuánto gana usted al año?', 'How much do you earn per year?'),
          why: t('Su ingreso anual actual, antes de impuestos.', 'Your current annual income, before taxes.'),
          fields: [money('income.mine', 'Ingreso anual (dólares)', 'Annual income (dollars)', 'Part 5 · Item 4', true)],
        },
        {
          id: 'filedTaxes',
          kind: 'choice',
          formRef: 'Part 5 · Item 5',
          question: t('¿Presentó declaración federal de impuestos en cada uno de los últimos 3 años?', 'Did you file a federal income tax return for each of the last 3 tax years?'),
          options: yesNo,
        },
        {
          id: 'taxes',
          kind: 'fields',
          formRef: 'Part 5 · Item 6 · Total income (adjusted gross income)',
          question: t('¿Cuál fue su ingreso total en sus declaraciones de impuestos?', 'What was your total income on your tax returns?'),
          why: t(
            'Use el ingreso bruto ajustado ("adjusted gross income") del formulario 1040. El año más reciente es obligatorio y debe adjuntar esa declaración; los otros dos son opcionales.',
            'Use the adjusted gross income from Form 1040. The most recent year is required and you must attach that return; the other two are optional.',
          ),
          fields: [
            { id: 'tax1.year', type: 'number', required: true, label: { es: 'Año más reciente', en: 'Most recent year' }, formRef: 'Part 5 · Item 6 · Most Recent · Tax Year', maxLength: 4, placeholder: '2025' },
            money('tax1.income', 'Ingreso total de ese año', 'Total income that year', 'Part 5 · Item 6 · Most Recent · Total Income', true),
            { id: 'tax2.year', type: 'number', label: { es: 'Segundo año más reciente', en: '2nd most recent year' }, formRef: 'Part 5 · Item 6 · 2nd Most Recent · Tax Year', maxLength: 4 },
            money('tax2.income', 'Ingreso total', 'Total income', 'Part 5 · Item 6 · 2nd Most Recent · Total Income'),
            { id: 'tax3.year', type: 'number', label: { es: 'Tercer año más reciente', en: '3rd most recent year' }, formRef: 'Part 5 · Item 6 · 3rd Most Recent · Tax Year', maxLength: 4 },
            money('tax3.income', 'Ingreso total', 'Total income', 'Part 5 · Item 6 · 3rd Most Recent · Total Income'),
          ],
        },
      ],
    },
    {
      id: 'contact',
      part: 'Part 6',
      title: t('Declaración y contacto', 'Statement and contact'),
      questions: [
        {
          id: 'readsEnglish',
          kind: 'choice',
          formRef: 'Part 6 · Item 1 · Sponsor’s Statement',
          question: t('¿Puede leer y entender la declaración en inglés?', 'Can you read and understand the affidavit in English?'),
          notice: {
            tone: 'legal',
            title: { es: 'Es un contrato', en: 'It’s a contract' },
            body: {
              es: 'Al firmar se compromete a mantener al inmigrante al 125% de la línea de pobreza hasta que se haga ciudadano, trabaje 40 trimestres, salga del país o fallezca. El divorcio no termina la obligación. También autoriza a USCIS a consultar su historial de crédito. Si tiene dudas, consulte a un abogado.',
              en: 'By signing you commit to support the immigrant at 125% of the poverty line until they become a citizen, work 40 quarters, leave the country or die. Divorce does not end the obligation. You also authorize USCIS to check your credit report. If in doubt, consult an attorney.',
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
          formRef: 'Part 6 · Item 1.b',
          showIf: is('readsEnglish', 'B'),
          question: t('¿En qué idioma se la leerán?', 'What language will it be read to you in?'),
          fields: [{ id: 'fluentLanguage', type: 'text', required: true, label: { es: 'Idioma', en: 'Language' }, formRef: 'Part 6 · Item 1.b', placeholder: 'Spanish' }],
        },
        {
          id: 'preparer',
          kind: 'choice',
          formRef: 'Part 6 · Item 2',
          question: t('¿Alguien más (no usted) preparó esta declaración?', 'Did someone else prepare this affidavit for you?'),
          options: yesNo,
        },
        {
          id: 'preparerName',
          kind: 'fields',
          formRef: 'Part 6 · Item 2',
          showIf: is('preparer', 'yes'),
          question: t('¿Quién la preparó?', 'Who prepared it?'),
          fields: [{ id: 'preparer.name', type: 'text', required: true, label: { es: 'Nombre del preparador', en: 'Preparer’s name' }, formRef: 'Part 6 · Item 2' }],
        },
        {
          id: 'contactInfo',
          kind: 'fields',
          formRef: 'Part 6 · Items 3–5 · Sponsor’s Contact Information',
          question: t('¿Cómo puede contactarle USCIS?', 'How can USCIS contact you?'),
          fields: [
            { id: 'phone', type: 'phone', required: true, label: { es: 'Teléfono de día', en: 'Daytime phone' }, formRef: 'Part 6 · Item 3', placeholder: '213 555 0123' },
            { id: 'mobile', type: 'phone', label: { es: 'Celular', en: 'Mobile phone' }, formRef: 'Part 6 · Item 4' },
            { id: 'email', type: 'email', label: { es: 'Correo electrónico', en: 'Email' }, formRef: 'Part 6 · Item 5', maxLength: 38 },
          ],
        },
      ],
    },
  ],
};
