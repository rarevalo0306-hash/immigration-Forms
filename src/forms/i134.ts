import type { Field, FormDefinition, Option } from './types';
import type { T } from '../i18n';
import { all, anyAddress, date, is, nameFields, rows, yesNo } from './helpers';

// Questions follow USCIS Form I-134, Declaration of Financial Support, edition 01/20/25. The person
// filling in the app is the supporter (Part 2); when they file for themselves as the beneficiary,
// Part 3 and Part 2, Items 18-19 are skipped and the statement goes to Part 4 instead of Part 5.
// Out of scope (left for hand): Parts 6 and 7 (interpreter and preparer contact, certification and
// signature) and every signature and date. The PDF mapping lives in src/pdf/i134Pdf.ts.

export const I134_EDITION = '01/20/25';

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

/** The I-134's address boxes hold 40 characters for the city. */
const address = (prefix: string, ref: string, careOf = true): Field[] =>
  anyAddress(prefix, ref, { careOf }).map((f) => (f.id.endsWith('.city') ? { ...f, maxLength: 40 } : f));

const forOther = is('basis', 'other');

/** Part 2, Item 17: the asset types of the PDF's dropdown, one answer each. */
export const ASSETS: { id: string; type: string; label: T }[] = [
  { id: 'assets.checking', type: 'Checking - Bank Account', label: t('Cuentas de cheques', 'Checking accounts') },
  { id: 'assets.savings', type: 'Savings - Bank Account', label: t('Cuentas de ahorro', 'Savings accounts') },
  { id: 'assets.annuities', type: 'Annuities', label: t('Anualidades', 'Annuities') },
  { id: 'assets.stocks', type: 'Stocks, Bonds, Certificates of Deposit', label: t('Acciones, bonos y certificados de depósito', 'Stocks, bonds and certificates of deposit') },
  { id: 'assets.retirement', type: 'Retirement or Educational Account', label: t('Cuentas de jubilación o de estudios (401k, IRA, 529)', 'Retirement or education accounts (401k, IRA, 529)') },
  { id: 'assets.realEstate', type: 'Real Estate Holdings', label: t('Bienes raíces (valor neto: lo que vale menos lo que debe)', 'Real estate (net value: worth minus what you owe)') },
  { id: 'assets.personalProperty', type: 'Personal Property (net value)', label: t('Otros bienes personales, como un carro (valor neto)', 'Other personal property, like a car (net value)') },
];

const maritalOptions: Option[] = [
  { value: 'single', label: t('Soltero/a, nunca casado/a', 'Single, never married') },
  { value: 'married', label: t('Casado/a', 'Married') },
  { value: 'divorced', label: t('Divorciado/a', 'Divorced') },
  { value: 'widowed', label: t('Viudo/a', 'Widowed') },
  { value: 'separated', label: t('Separado/a legalmente', 'Legally separated') },
  { value: 'annulled', label: t('Matrimonio anulado', 'Marriage annulled') },
  { value: 'other', label: t('Otro', 'Other') },
];

export const i134: FormDefinition = {
  id: 'i-134',
  number: 'I-134',
  edition: I134_EDITION,
  title: t('Declaración de apoyo económico', 'Declaration of Financial Support'),
  summary: {
    es: 'Una persona en EE.UU. declara que puede mantener a alguien durante una estadía temporal (algunas visas y permisos de parole).',
    en: 'Someone in the U.S. declares they can financially support a person during a temporary stay (some visas and parole requests).',
  },
  intro: {
    es: 'Con el I-134 usted declara que puede mantener económicamente a otra persona (el beneficiario) mientras esté temporalmente en EE.UU. Lo piden algunos consulados para visas de no inmigrante y algunas solicitudes de parole. No es un contrato como el I-864, pero debe decir la verdad bajo pena de perjurio. Tenga a mano los datos de su trabajo, sus ingresos y sus cuentas.',
    en: 'With Form I-134 you declare that you can financially support another person (the beneficiary) while they are temporarily in the U.S. Some consulates ask for it for nonimmigrant visas, and some parole requests require it. It is not a contract like Form I-864, but you must tell the truth under penalty of perjury. Have your job, income and account details at hand.',
  },
  minutes: 25,
  pdf: {
    path: 'forms/i-134.pdf',
    fileName: 'I-134-filled.pdf',
    load: () => import('../pdf/i134Pdf').then((m) => m.fillI134),
    signHere: { es: 'Parte 5, Ítem 6 (Parte 4, Ítem 6 si usted es el beneficiario)', en: 'Part 5, Item 6 (Part 4, Item 6 if you are the beneficiary)' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/i-134 que la edición {edition} sigue vigente; si cambió, use la nueva y copie sus respuestas de esta hoja. Para los procesos de parole que se piden en línea (I-134A), use la cuenta de USCIS en vez de este PDF.',
      'Adjunte pruebas de sus ingresos y bienes: su declaración federal de impuestos más reciente (o transcripción del IRS), cartas de su empleador o talones de pago recientes, y estados de cuenta de sus bancos u otros bienes. Adjunte también prueba de su estatus en EE.UU.',
      'Imprima el PDF y firme a mano con tinta negra la Parte 5, Ítem 6 (o la Parte 4, Ítem 6 si llena el formulario para usted mismo). Si un intérprete o preparador le ayudó, ellos llenan y firman a mano las Partes 6 y 7.',
      'Envíe el I-134 a quien se lo pidió: normalmente el beneficiario lo lleva a su entrevista en el consulado, o se presenta según las instrucciones del programa de parole.',
    ],
    en: [
      'Check at uscis.gov/i-134 that edition {edition} is still current; if it changed, use the new one and copy your answers from this sheet. For parole processes filed online (Form I-134A), use your USCIS account instead of this PDF.',
      'Attach evidence of your income and assets: your latest federal tax return (or IRS transcript), an employer letter or recent pay stubs, and statements for your bank accounts or other assets. Also attach proof of your U.S. status.',
      'Print the PDF and sign Part 5, Item 6 (or Part 4, Item 6 if you file for yourself) by hand in black ink. If an interpreter or preparer helped you, they complete and sign Parts 6 and 7 by hand.',
      'Send Form I-134 to whoever asked for it: usually the beneficiary takes it to their consular interview, or it is filed as the parole program’s instructions say.',
    ],
  },
  sections: [
    {
      id: 'basis',
      part: 'Part 1',
      title: t('Para quién es', 'Who it is for'),
      questions: [
        {
          id: 'basis',
          kind: 'choice',
          formRef: 'Part 1 · Item 1 · I am filing this form on behalf of',
          question: t('¿Para quién llena este formulario?', 'Who are you filing this form for?'),
          why: t(
            'Lo normal es que usted, desde EE.UU., declare que mantendrá a otra persona. Elija "yo mismo" solo si usted es el beneficiario y demuestra que puede mantenerse solo.',
            'Usually you, in the U.S., declare you will support someone else. Choose "myself" only if you are the beneficiary showing you can support yourself.',
          ),
          notice: {
            tone: 'info',
            title: t('¿I-134 o I-134A?', 'Form I-134 or I-134A?'),
            body: t(
              'Algunos procesos de parole (por ejemplo, Uniting for Ukraine o la reunificación familiar) usan el formulario I-134A, que se presenta en línea. Confirme cuál le pidieron antes de seguir.',
              'Some parole processes (for example Uniting for Ukraine or family reunification parole) use Form I-134A, which is filed online. Confirm which one you were asked for before you continue.',
            ),
          },
          options: [
            { value: 'other', label: t('Otra persona (el beneficiario): yo la apoyaré económicamente', 'Another person (the beneficiary): I will support them financially') },
            { value: 'self', label: t('Yo mismo: soy el beneficiario y me mantendré solo', 'Myself: I am the beneficiary and will support myself') },
          ],
        },
      ],
    },
    {
      id: 'supporter',
      part: 'Part 2',
      title: t('Sobre usted', 'About you'),
      questions: [
        {
          id: 'name',
          kind: 'fields',
          formRef: 'Part 2 · Item 1 · Current Legal Name',
          question: t('¿Cuál es su nombre legal completo?', 'What is your full legal name?'),
          notice: {
            tone: 'info',
            title: t('Usted es quien da el apoyo', 'You are the supporter'),
            body: t('Estas preguntas son sobre usted, la persona que se compromete a apoyar económicamente al beneficiario.', 'These questions are about you, the person agreeing to financially support the beneficiary.'),
          },
          fields: nameFields('name', 'Part 2 · Item 1'),
        },
        {
          id: 'otherName.more0',
          kind: 'choice',
          formRef: 'Part 2 · Item 2 · Other Names Used',
          question: t('¿Ha usado otros nombres (de soltera, apodos, alias)?', 'Have you used other names (maiden name, nicknames, aliases)?'),
          options: yesNo,
        },
        ...rows({
          max: 2,
          id: 'otherName',
          first: is('otherName.more0', 'yes'),
          question: (i) => (i === 1 ? t('Otro nombre que ha usado', 'Another name you have used') : t('Otro nombre más', 'One more name')),
          more: t('¿Ha usado otro nombre más?', 'Have you used another name?'),
          formRef: 'Part 2 · Item 2',
          fields: (i) => nameFields(`otherName${i}`, `Part 2 · Item 2 · Name ${i}`),
          overflow: { es: 'Si son más de 2, escríbalos a mano en la Parte 8.', en: 'If there are more than 2, write them by hand in Part 8.' },
        }),
        {
          id: 'mailing',
          kind: 'fields',
          formRef: 'Part 2 · Item 3 · Current Mailing Address',
          question: t('¿A qué dirección le llega el correo?', 'Where do you get your mail?'),
          fields: address('mailing', 'Part 2 · Item 3'),
        },
        {
          id: 'mailingSame',
          kind: 'choice',
          formRef: 'Part 2 · Item 4 · Is your current mailing address the same as your current physical address?',
          question: t('¿Vive en esa misma dirección?', 'Do you live at that same address?'),
          options: yesNo,
        },
        {
          id: 'home',
          kind: 'fields',
          formRef: 'Part 2 · Item 5 · Current Physical Address',
          showIf: is('mailingSame', 'no'),
          question: t('¿Dónde vive?', 'Where do you live?'),
          fields: address('home', 'Part 2 · Item 5'),
        },
        {
          id: 'about',
          kind: 'fields',
          formRef: 'Part 2 · Items 6–9',
          question: t('Sus datos', 'Your details'),
          fields: [
            date('dob', 'Fecha de nacimiento', 'Date of birth', 'Part 2 · Item 6 · Date of Birth'),
            { id: 'birthCity', type: 'text', required: true, label: { es: 'Ciudad de nacimiento', en: 'City or town of birth' }, formRef: 'Part 2 · Item 7 · City or Town', maxLength: 40 },
            { id: 'birthState', type: 'text', label: { es: 'Estado o provincia de nacimiento', en: 'State or province of birth' }, formRef: 'Part 2 · Item 7 · State or Province', maxLength: 40 },
            { id: 'birthCountry', type: 'text', required: true, label: { es: 'País de nacimiento', en: 'Country of birth' }, formRef: 'Part 2 · Item 7 · Country' },
            { id: 'aNumber', type: 'aNumber', label: { es: 'A-Number (si tiene)', en: 'A-Number (if any)' }, formRef: 'Part 2 · Item 8' },
            { id: 'uscisAccount', type: 'uscisAccount', label: { es: 'Número de cuenta en línea de USCIS (si tiene)', en: 'USCIS online account number (if any)' }, formRef: 'Part 2 · Item 9' },
          ],
        },
        {
          id: 'status',
          kind: 'choice',
          formRef: 'Part 2 · Item 10 · What is your current immigration status?',
          question: t('¿Cuál es su estatus migratorio actual?', 'What is your current immigration status?'),
          why: t('Adjunte prueba de su estatus (pasaporte, tarjeta de residente, permiso, etc.).', 'Attach proof of your status (passport, green card, permit, etc.).'),
          options: [
            { value: 'A', label: t('Ciudadano/a de EE.UU.', 'U.S. citizen') },
            { value: 'B', label: t('Nacional de EE.UU.', 'U.S. national') },
            { value: 'C', label: t('Residente permanente', 'Lawful permanent resident') },
            { value: 'nonimmigrant', label: t('No inmigrante (con visa, por ejemplo H-1B o F-1)', 'Nonimmigrant (on a visa, for example H-1B or F-1)') },
            { value: 'asylee', label: t('Asilado/a', 'Asylee') },
            { value: 'refugee', label: t('Refugiado/a', 'Refugee') },
            { value: 'parolee', label: t('Con parole', 'Parolee') },
            { value: 'tps', label: t('Con TPS', 'TPS holder') },
            { value: 'deferred', label: t('Con acción diferida (incluido DACA) o DED', 'Deferred action (including DACA) or Deferred Enforced Departure') },
            { value: 'other', label: t('Otro', 'Other') },
          ],
        },
        {
          id: 'statusOther',
          kind: 'fields',
          formRef: 'Part 2 · Item 10 · Other (Explain)',
          showIf: is('status', 'other'),
          question: t('¿Cuál es su estatus?', 'What is your status?'),
          fields: [{ id: 'status.other', type: 'text', required: true, label: t('Estatus (en inglés)', 'Status'), formRef: 'Part 2 · Item 10 · Other (Explain)', maxLength: 50 }],
        },
        {
          id: 'relationshipQ',
          kind: 'fields',
          formRef: 'Part 2 · Item 11 · What is your relationship to the beneficiary?',
          showIf: forOther,
          question: t('¿Qué es usted del beneficiario?', 'What is your relationship to the beneficiary?'),
          fields: [{ id: 'relationship', type: 'text', required: true, label: t('Relación (en inglés, por ejemplo "brother", "aunt", "friend")', 'Relationship'), formRef: 'Part 2 · Item 11', placeholder: 'brother' }],
        },
      ],
    },
    {
      id: 'employment',
      part: 'Part 2',
      title: t('Su trabajo', 'Your employment'),
      questions: [
        {
          id: 'employment',
          kind: 'choice',
          formRef: 'Part 2 · Item 12 · Employment Status',
          question: t('¿Cuál es su situación de trabajo?', 'What is your work situation?'),
          options: [
            { value: 'employed', label: t('Empleado/a (tiempo completo, medio tiempo o por temporada)', 'Employed (full-time, part-time or seasonal)') },
            { value: 'self', label: t('Trabajo por mi cuenta', 'Self-employed') },
            { value: 'unemployed', label: t('Sin empleo', 'Unemployed or not employed') },
            { value: 'retired', label: t('Jubilado/a', 'Retired') },
            { value: 'other', label: t('Otro', 'Other') },
          ],
        },
        {
          id: 'employed',
          kind: 'fields',
          formRef: 'Part 2 · Item 12 · Employed',
          showIf: is('employment', 'employed'),
          question: t('Sobre su trabajo', 'About your job'),
          fields: [
            { id: 'job.occupation', type: 'text', required: true, label: { es: 'Trabaja como (ocupación, en inglés)', en: 'Employed as' }, formRef: 'Part 2 · Item 12 · Employed as a/an', placeholder: 'cook' },
            { id: 'job.employer1', type: 'text', required: true, label: { es: 'Nombre del empleador', en: 'Name of employer' }, formRef: 'Part 2 · Item 12 · Name of Employer' },
          ],
        },
        {
          id: 'selfEmployed',
          kind: 'fields',
          formRef: 'Part 2 · Item 12 · Self-Employed',
          showIf: is('employment', 'self'),
          question: t('¿A qué se dedica?', 'What do you do?'),
          fields: [{ id: 'job.selfOccupation', type: 'text', required: true, label: { es: 'Ocupación (en inglés)', en: 'Occupation' }, formRef: 'Part 2 · Item 12 · Self-Employed as a/an', placeholder: 'painter' }],
        },
        {
          id: 'employmentOther',
          kind: 'fields',
          formRef: 'Part 2 · Item 12 · Other (Explain)',
          showIf: is('employment', 'other'),
          question: t('Explique su situación', 'Explain your situation'),
          fields: [{ id: 'job.other', type: 'text', required: true, label: { es: 'Situación (en inglés, por ejemplo "student")', en: 'Situation' }, formRef: 'Part 2 · Item 12 · Other (Explain)' }],
        },
      ],
    },
    {
      id: 'finances',
      part: 'Part 2',
      title: t('Dependientes, ingresos y bienes', 'Dependents, income and assets'),
      questions: [
        {
          id: 'support',
          kind: 'fields',
          formRef: 'Part 2 · Items 13–14',
          question: t('¿A cuántas personas apoya ya?', 'How many people do you already support?'),
          why: t('No cuente al beneficiario de este formulario. Escriba 0 si no aplica.', 'Don’t count the beneficiary of this form. Enter 0 if it doesn’t apply.'),
          fields: [
            {
              id: 'hh.previouslySponsored',
              type: 'number',
              required: true,
              label: t('Personas por las que firmó antes un I-134, I-134A, I-864, I-864EZ o I-864A y su obligación sigue vigente', 'People you filed Form I-134, I-134A, I-864, I-864EZ or I-864A for whose support obligation has not ended'),
              formRef: 'Part 2 · Item 13',
              placeholder: '0',
              maxLength: 3,
            },
            {
              id: 'dependentsCount',
              type: 'number',
              required: true,
              label: t('Otras personas que dependen de usted, contándose a usted mismo (sin las del punto anterior)', 'Other dependents you support, including yourself (not the people above)'),
              formRef: 'Part 2 · Item 14',
              placeholder: '1',
              maxLength: 3,
            },
          ],
        },
        {
          id: 'dependent.more0',
          kind: 'choice',
          formRef: 'Part 2 · Item 15 · Your dependents and other individuals you financially support',
          question: t('¿Mantiene a otras personas (hijos, cónyuge, padres u otros)?', 'Do you financially support other people (children, spouse, parents or others)?'),
          why: t('El formulario pide sus datos. No se incluya a usted ni al beneficiario.', 'The form asks for their details. Don’t include yourself or the beneficiary.'),
          options: yesNo,
        },
        ...rows({
          max: 9,
          id: 'dependent',
          first: is('dependent.more0', 'yes'),
          question: (i) => (i === 1 ? t('Una persona que usted mantiene', 'A person you support') : t('Otra persona', 'Another person')),
          more: t('¿Mantiene a otra persona más?', 'Do you support another person?'),
          formRef: 'Part 2 · Item 15',
          fields: (i) => [
            { id: `dependent${i}.name`, type: 'text', required: true, label: t('Nombre completo', 'Full name'), formRef: `Part 2 · Item 15 · Row ${i} · Full Name` },
            date(`dependent${i}.dob`, 'Fecha de nacimiento', 'Date of birth', `Part 2 · Item 15 · Row ${i} · Date of Birth`),
            { id: `dependent${i}.relationship`, type: 'text', required: true, label: t('Relación con usted (en inglés: son, wife, mother)', 'Relationship to you'), formRef: `Part 2 · Item 15 · Row ${i} · Relationship to you`, placeholder: 'son' },
            { id: `dependent${i}.aNumber`, type: 'aNumber', label: t('A-Number (si tiene)', 'A-Number (if any)'), formRef: `Part 2 · Item 15 · Row ${i} · A-Number` },
            { id: `dependent${i}.receipt`, type: 'receipt', label: t('Número de recibo de USCIS (si tiene)', 'USCIS receipt number (if any)'), formRef: `Part 2 · Item 15 · Row ${i} · Receipt Number` },
          ],
          overflow: { es: 'El formulario tiene espacio para 9 personas. Si son más, escríbalas a mano en la Parte 8.', en: 'The form has room for 9 people. If there are more, write them by hand in Part 8.' },
        }),
        {
          id: 'myIncome',
          kind: 'fields',
          formRef: 'Part 2 · Item 16 · What is your current annual income?',
          question: t('¿Cuánto gana usted al año?', 'How much do you earn per year?'),
          why: t('Su ingreso anual actual, antes de impuestos. Adjunte pruebas (impuestos, talones de pago o carta del empleador).', 'Your current annual income, before taxes. Attach evidence (tax return, pay stubs or an employer letter).'),
          fields: [money('income.mine', 'Ingreso anual (dólares)', 'Annual income (dollars)', 'Part 2 · Item 16', true)],
        },
        {
          id: 'myAssets',
          kind: 'fields',
          formRef: 'Part 2 · Item 17 · Cash or assets available to you',
          question: t('¿Qué dinero o bienes tiene disponibles?', 'What cash or assets do you have available?'),
          why: t(
            'Escriba el valor en dólares de cada tipo; deje vacío lo que no tenga. No incluya bienes del beneficiario. Sumamos el total por usted. Adjunte estados de cuenta.',
            'Enter the dollar value of each type; leave empty what you don’t have. Don’t include the beneficiary’s assets. We add up the total for you. Attach statements.',
          ),
          fields: ASSETS.map((x) => money(x.id, x.label.es, x.label.en, `Part 2 · Item 17 · ${x.type}`)),
        },
      ],
    },
    {
      id: 'contributions',
      part: 'Part 2',
      title: t('Su ayuda al beneficiario', 'Your help to the beneficiary'),
      questions: [
        {
          id: 'contributions',
          kind: 'choice',
          formRef: 'Part 2 · Item 18 · I intend to make specific contributions to cover the beneficiary’s basic living needs',
          showIf: forOther,
          question: t('Además del apoyo económico, ¿piensa ayudar con cosas concretas (vivienda, comida, escuela, trabajo)?', 'Besides financial support, do you plan to help with specific things (housing, food, school, work)?'),
          options: yesNo,
        },
        {
          id: 'contributionsDescribe',
          kind: 'fields',
          formRef: 'Part 2 · Item 19 · Describe the specific contributions',
          showIf: all(forOther, is('contributions', 'yes')),
          question: t('Describa esa ayuda', 'Describe that help'),
          why: t(
            'Por ejemplo: vivienda segura, ayuda para buscar trabajo cuando tenga permiso, inscripción en la escuela o en beneficios a los que tenga derecho. Si le dará casa y comida, escriba la dirección donde vivirá. Escriba en inglés; si es largo, la app lo pasa a la Parte 8.',
            'For example: safe housing, help finding work once authorized, school enrollment or benefits they are eligible for. If you will provide room and board, give the address where they will live. If it is long, the app moves it to Part 8.',
          ),
          fields: [{ id: 'contributions.describe', type: 'longText', required: true, label: t('Su descripción (en inglés)', 'Your description'), formRef: 'Part 2 · Item 19' }],
        },
      ],
    },
    {
      id: 'beneficiary',
      part: 'Part 3',
      title: t('El beneficiario', 'The beneficiary'),
      questions: [
        {
          id: 'ben.name',
          kind: 'fields',
          formRef: 'Part 3 · Item 1 · Beneficiary’s Current Legal Name',
          showIf: forOther,
          question: t('¿Cómo se llama la persona que usted apoyará?', 'What is the name of the person you will support?'),
          fields: nameFields('ben', 'Part 3 · Item 1'),
        },
        {
          id: 'benOtherName.more0',
          kind: 'choice',
          formRef: 'Part 3 · Item 2 · Other Names Used',
          showIf: forOther,
          question: t('¿El beneficiario ha usado otros nombres?', 'Has the beneficiary used other names?'),
          options: yesNo,
        },
        ...rows({
          max: 2,
          id: 'benOtherName',
          first: all(forOther, is('benOtherName.more0', 'yes')),
          question: (i) => (i === 1 ? t('Otro nombre del beneficiario', 'Another name of the beneficiary') : t('Otro nombre más', 'One more name')),
          more: t('¿Ha usado otro nombre más?', 'Has the beneficiary used another name?'),
          formRef: 'Part 3 · Item 2',
          fields: (i) => nameFields(`benOtherName${i}`, `Part 3 · Item 2 · Name ${i}`),
          overflow: { es: 'Si son más de 2, escríbalos a mano en la Parte 8.', en: 'If there are more than 2, write them by hand in Part 8.' },
        }),
        {
          id: 'ben.about',
          kind: 'fields',
          formRef: 'Part 3 · Items 3–7',
          showIf: forOther,
          question: t('Datos del beneficiario', 'The beneficiary’s details'),
          fields: [
            date('ben.dob', 'Fecha de nacimiento', 'Date of birth', 'Part 3 · Item 3 · Date of Birth'),
            {
              id: 'ben.sex',
              type: 'select',
              required: true,
              label: t('Sexo', 'Sex'),
              formRef: 'Part 3 · Item 4 · Sex',
              options: [
                { value: 'male', label: t('Masculino', 'Male') },
                { value: 'female', label: t('Femenino', 'Female') },
              ],
            },
            { id: 'ben.aNumber', type: 'aNumber', label: t('A-Number (si tiene)', 'A-Number (if any)'), formRef: 'Part 3 · Item 5' },
            { id: 'ben.birthCity', type: 'text', required: true, label: t('Ciudad de nacimiento', 'City or town of birth'), formRef: 'Part 3 · Item 6 · City or Town', maxLength: 40 },
            { id: 'ben.birthState', type: 'text', label: t('Estado o provincia de nacimiento', 'State or province of birth'), formRef: 'Part 3 · Item 6 · State or Province', maxLength: 40 },
            { id: 'ben.birthCountry', type: 'text', required: true, label: t('País de nacimiento', 'Country of birth'), formRef: 'Part 3 · Item 6 · Country' },
            { id: 'ben.citizenship', type: 'text', required: true, label: t('País de ciudadanía o nacionalidad', 'Country of citizenship or nationality'), formRef: 'Part 3 · Item 7' },
          ],
        },
        {
          id: 'ben.marital',
          kind: 'choice',
          formRef: 'Part 3 · Item 8 · Marital Status',
          showIf: forOther,
          question: t('¿Cuál es el estado civil del beneficiario?', 'What is the beneficiary’s marital status?'),
          options: maritalOptions,
        },
        {
          id: 'benMaritalOther',
          kind: 'fields',
          formRef: 'Part 3 · Item 8 · Other (Explain)',
          showIf: all(forOther, is('ben.marital', 'other')),
          question: t('Explique su estado civil', 'Explain the marital status'),
          fields: [{ id: 'ben.marital.other', type: 'text', required: true, label: t('Estado civil (en inglés)', 'Marital status'), formRef: 'Part 3 · Item 8 · Other (Explain)' }],
        },
        {
          id: 'ben.mailing',
          kind: 'fields',
          formRef: 'Part 3 · Item 9 · Beneficiary’s Current Mailing Address',
          showIf: forOther,
          question: t('¿A qué dirección le llega el correo al beneficiario?', 'Where does the beneficiary get mail?'),
          fields: address('ben.mailing', 'Part 3 · Item 9'),
        },
        {
          id: 'ben.mailingSame',
          kind: 'choice',
          formRef: 'Part 3 · Item 10 · Are the beneficiary’s mailing address and physical address the same?',
          showIf: forOther,
          question: t('¿El beneficiario vive en esa misma dirección?', 'Does the beneficiary live at that same address?'),
          options: yesNo,
        },
        {
          id: 'ben.home',
          kind: 'fields',
          formRef: 'Part 3 · Item 11 · Beneficiary’s Current Physical Address',
          showIf: all(forOther, is('ben.mailingSame', 'no')),
          question: t('¿Dónde vive el beneficiario?', 'Where does the beneficiary live?'),
          fields: address('ben.home', 'Part 3 · Item 11'),
        },
        {
          id: 'stay',
          kind: 'fields',
          formRef: 'Part 3 · Item 12 · Beneficiary’s Anticipated Period of Stay in the United States',
          showIf: forOther,
          question: t('¿Desde cuándo piensa estar el beneficiario en EE.UU.?', 'From when does the beneficiary plan to be in the U.S.?'),
          why: t('Una fecha aproximada está bien si aún no sabe la exacta.', 'An approximate date is fine if you don’t know the exact one yet.'),
          fields: [date('stay.from', 'Desde (fecha)', 'From (date)', 'Part 3 · Item 12 · From', true, 'date')],
        },
        {
          id: 'stay.end',
          kind: 'choice',
          formRef: 'Part 3 · Item 12 · To (select one)',
          showIf: forOther,
          question: t('¿Hasta cuándo?', 'Until when?'),
          options: [
            { value: 'date', label: t('Hasta una fecha', 'Until a date') },
            { value: 'none', label: t('Sin fecha de fin', 'No end date') },
          ],
        },
        {
          id: 'stayTo',
          kind: 'fields',
          formRef: 'Part 3 · Item 12 · To (mm/dd/yyyy)',
          showIf: all(forOther, is('stay.end', 'date')),
          question: t('¿Hasta qué fecha?', 'Until what date?'),
          fields: [date('stay.to', 'Hasta (fecha)', 'To (date)', 'Part 3 · Item 12 · To', true, 'futureDate')],
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
          formRef: 'Part 5 · Item 1 (Part 4 · Item 1 if you are the beneficiary) · Statement',
          question: t('¿Puede leer y entender el formulario en inglés?', 'Can you read and understand the form in English?'),
          notice: {
            tone: 'legal',
            title: t('Firma bajo pena de perjurio', 'You sign under penalty of perjury'),
            body: t(
              'Al firmar declara que todo es verdad y que está dispuesto y puede mantener al beneficiario durante su estadía. Dar datos falsos puede traer multas, cárcel y problemas migratorios para usted y el beneficiario. Si tiene dudas sobre su situación, consulte a un abogado o representante acreditado.',
              'By signing you declare everything is true and that you are willing and able to support the beneficiary during their stay. False information can bring fines, prison and immigration problems for you and the beneficiary. If you have doubts about your situation, consult an attorney or accredited representative.',
            ),
          },
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
          question: t('¿En qué idioma se lo leerán?', 'What language will it be read to you in?'),
          fields: [{ id: 'fluentLanguage', type: 'text', required: true, label: t('Idioma', 'Language'), formRef: 'Part 5 · Item 1.B', placeholder: 'Spanish' }],
        },
        {
          id: 'preparer',
          kind: 'choice',
          formRef: 'Part 5 · Item 2 · Preparer',
          question: t('¿Alguien más (no usted) preparó este formulario?', 'Did someone else prepare this form for you?'),
          why: t('Si es así, esa persona también debe llenar y firmar la Parte 7 a mano.', 'If so, that person must also complete and sign Part 7 by hand.'),
          options: yesNo,
        },
        {
          id: 'preparerName',
          kind: 'fields',
          formRef: 'Part 5 · Item 2',
          showIf: is('preparer', 'yes'),
          question: t('¿Quién lo preparó?', 'Who prepared it?'),
          fields: [{ id: 'preparer.name', type: 'text', required: true, label: t('Nombre del preparador', 'Preparer’s name'), formRef: 'Part 5 · Item 2' }],
        },
        {
          id: 'contactInfo',
          kind: 'fields',
          formRef: 'Part 5 · Items 3–5 · Contact Information',
          question: t('¿Cómo pueden contactarle?', 'How can they contact you?'),
          fields: [
            { id: 'phone', type: 'phone', required: true, label: t('Teléfono de día', 'Daytime phone'), formRef: 'Part 5 · Item 3', placeholder: '213 555 0123' },
            { id: 'mobile', type: 'phone', label: t('Celular', 'Mobile phone'), formRef: 'Part 5 · Item 4' },
            { id: 'email', type: 'email', label: t('Correo electrónico', 'Email'), formRef: 'Part 5 · Item 5', maxLength: 38 },
          ],
        },
      ],
    },
  ],
};
