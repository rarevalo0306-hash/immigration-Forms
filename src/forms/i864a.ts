import type { Field, FormDefinition } from './types';
import type { T } from '../i18n';
import { all, anyAddress, date, is, nameFields, rows, yesNo } from './helpers';

// Questions follow USCIS Form I-864A, Contract Between Sponsor and Household Member, edition
// 08/24/26. The household member answers Parts 1-4 and 6; the sponsor answers Part 5. The PDF
// mapping lives in src/pdf/i864aPdf.ts.

export const I864A_EDITION = '08/24/26';

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

const statement = (id: string, part: string, who: T): FormDefinition['sections'][number]['questions'] => [
  {
    id,
    kind: 'choice',
    formRef: `${part} · Statement`,
    question: t(`¿${who.es} puede leer y entender el contrato en inglés?`, `Can ${who.en} read and understand the contract in English?`),
    options: [
      { value: 'A', label: t('Sí, lee inglés', 'Yes, reads English') },
      { value: 'B', label: t('No, un intérprete se lo leerá', 'No, an interpreter will read it') },
    ],
  },
  {
    id: `${id}.languageQ`,
    kind: 'fields',
    formRef: `${part} · Statement`,
    showIf: is(id, 'B'),
    question: t('¿En qué idioma se lo leerán?', 'What language will it be read in?'),
    fields: [{ id: `${id}.language`, type: 'text', required: true, label: { es: 'Idioma', en: 'Language' }, formRef: `${part} · Statement`, placeholder: 'Spanish' }],
  },
];

const contact = (prefix: string, part: string, items: string): Field[] => {
  const [phone, mobile, email] = items.split(',');
  return [
    { id: `${prefix}phone`, type: 'phone', required: true, label: { es: 'Teléfono de día', en: 'Daytime phone' }, formRef: `${part} · Item ${phone}`, placeholder: '213 555 0123' },
    { id: `${prefix}mobile`, type: 'phone', label: { es: 'Celular', en: 'Mobile phone' }, formRef: `${part} · Item ${mobile}` },
    { id: `${prefix}email`, type: 'email', label: { es: 'Correo electrónico', en: 'Email' }, formRef: `${part} · Item ${email}`, maxLength: 38 },
  ];
};

export const i864a: FormDefinition = {
  id: 'i-864a',
  number: 'I-864A',
  edition: I864A_EDITION,
  title: t('Contrato entre el patrocinador y un familiar del hogar', 'Contract Between Sponsor and Household Member'),
  summary: {
    es: 'Un familiar que vive con el patrocinador suma sus ingresos al I-864. Lo llenan juntos.',
    en: 'A relative who lives with the sponsor adds their income to the I-864. They fill it in together.',
  },
  intro: {
    es: 'Con el I-864A, un familiar del hogar del patrocinador (o el propio inmigrante, si vive con él) se compromete a ayudar a mantener al inmigrante, y su ingreso cuenta para el I-864. Las preguntas son sobre usted, el familiar, salvo la Parte 5, que contesta el patrocinador. Llene un I-864A por cada familiar que suma ingresos.',
    en: 'With Form I-864A, a member of the sponsor’s household (or the immigrant, if living with the sponsor) commits to help support the immigrant, and their income counts toward the I-864. The questions are about you, the household member, except Part 5, which the sponsor answers. File one I-864A for each household member adding income.',
  },
  minutes: 20,
  pdf: {
    path: 'forms/i-864a.pdf',
    fileName: 'I-864A-filled.pdf',
    load: () => import('../pdf/i864aPdf').then((m) => m.fillI864A),
    signHere: { es: 'Parte 5, Ítem 10 (el patrocinador) y la Parte 6, Ítem 7 (el familiar)', en: 'Part 5, Item 10 (sponsor) and Part 6, Item 7 (household member)' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/i-864a que la edición {edition} sigue vigente; si cambió, use la nueva y copie sus respuestas de esta hoja.',
      'Adjunte la declaración federal de impuestos más reciente del familiar (o su transcripción) y prueba de que vive con el patrocinador.',
      'Imprima el PDF. El patrocinador firma la Parte 5, Ítem 10, y el familiar la Parte 6, Ítem 7, a mano con tinta negra.',
      'Envíe el I-864A junto con el I-864 del patrocinador.',
    ],
    en: [
      'Check at uscis.gov/i-864a that edition {edition} is still current; if it changed, use the new one and copy your answers from this sheet.',
      'Attach the household member’s most recent federal tax return (or transcript) and proof that they live with the sponsor.',
      'Print the PDF. The sponsor signs Part 5, Item 10, and the household member Part 6, Item 7, by hand in black ink.',
      'File Form I-864A together with the sponsor’s Form I-864.',
    ],
  },
  sections: [
    {
      id: 'member',
      part: 'Part 1',
      title: t('Sobre usted', 'About you'),
      questions: [
        {
          id: 'name',
          kind: 'fields',
          formRef: 'Part 1 · Item 1 · Full Name',
          question: t('¿Cuál es su nombre legal completo?', 'What is your full legal name?'),
          notice: {
            tone: 'info',
            title: { es: 'Usted es el familiar del hogar', en: 'You are the household member' },
            body: { es: 'Estas preguntas son sobre la persona que suma sus ingresos a los del patrocinador.', en: 'These questions are about the person adding their income to the sponsor’s.' },
          },
          fields: nameFields('name', 'Part 1 · Item 1').map((f) => ({ ...f, maxLength: f.id.endsWith('family') ? 30 : 18 })),
        },
        {
          id: 'mailing',
          kind: 'fields',
          formRef: 'Part 1 · Item 2 · Mailing Address',
          question: t('¿A qué dirección le llega el correo?', 'Where do you get your mail?'),
          fields: anyAddress('mailing', 'Part 1 · Item 2', { careOf: true }),
        },
        {
          id: 'mailingSame',
          kind: 'choice',
          formRef: 'Part 1 · Item 3 · Is your current mailing address the same as your physical address?',
          question: t('¿Vive en esa misma dirección?', 'Do you live at that same address?'),
          options: yesNo,
        },
        {
          id: 'home',
          kind: 'fields',
          formRef: 'Part 1 · Item 4 · Physical Address',
          showIf: is('mailingSame', 'no'),
          question: t('¿Dónde vive?', 'Where do you live?'),
          fields: anyAddress('home', 'Part 1 · Item 4'),
        },
        {
          id: 'about',
          kind: 'fields',
          formRef: 'Part 1 · Items 5–9 · Other Information',
          question: t('Sus datos', 'Your details'),
          fields: [
            date('dob', 'Fecha de nacimiento', 'Date of birth', 'Part 1 · Item 5 · Date of Birth'),
            { id: 'birthCountry', type: 'text', required: true, label: { es: 'País de nacimiento', en: 'Country of birth' }, formRef: 'Part 1 · Item 6 · Country of Birth' },
            { id: 'ssn', type: 'ssn', label: { es: 'Número de Seguro Social (si tiene)', en: 'Social Security number (if any)' }, formRef: 'Part 1 · Item 7', placeholder: '123-45-6789' },
            { id: 'aNumber', type: 'aNumber', label: { es: 'A-Number (si tiene)', en: 'A-Number (if any)' }, formRef: 'Part 1 · Item 8' },
            { id: 'uscisAccount', type: 'uscisAccount', label: { es: 'Número de cuenta en línea de USCIS', en: 'USCIS online account number' }, formRef: 'Part 1 · Item 9' },
          ],
        },
      ],
    },
    {
      id: 'relationship',
      part: 'Part 2',
      title: t('Su relación con el patrocinador', 'Your relationship to the sponsor'),
      questions: [
        {
          id: 'relationship',
          kind: 'choice',
          formRef: 'Part 2 · Items 1–3 · Relationship to the Sponsor',
          question: t('¿Quién es usted?', 'Who are you?'),
          why: t(
            'El inmigrante solo llena un I-864A si trae dependientes (cónyuge o hijos) que también se patrocinan; si no, basta con que el patrocinador lo indique en el I-864.',
            'The immigrant files an I-864A only if dependents (spouse or children) are also sponsored; otherwise the sponsor notes it on the I-864.',
          ),
          options: [
            { value: 'A', label: t('Soy el inmigrante y también el cónyuge del patrocinador', 'I am the intending immigrant and the sponsor’s spouse') },
            { value: 'B', label: t('Soy el inmigrante y vivo en el hogar del patrocinador', 'I am the intending immigrant and a member of the sponsor’s household') },
            { value: 'C', label: t('No soy el inmigrante: soy un familiar que vive con el patrocinador', 'I am not the intending immigrant: I am a relative in the sponsor’s household') },
          ],
        },
        {
          id: 'relative',
          kind: 'choice',
          formRef: 'Part 2 · Item 3 · I am related to the sponsor as his/her',
          showIf: is('relationship', 'C'),
          question: t('¿Qué es usted del patrocinador?', 'How are you related to the sponsor?'),
          options: [
            { value: '1', label: t('Cónyuge', 'Spouse') },
            { value: '2', label: t('Hijo/a de 18 años o más', 'Son or daughter (18 or older)') },
            { value: '3', label: t('Padre o madre', 'Parent') },
            { value: '4', label: t('Hermano/a', 'Brother or sister') },
            { value: '5', label: t('Otro dependiente', 'Other dependent') },
          ],
        },
        {
          id: 'relativeOther',
          kind: 'fields',
          formRef: 'Part 2 · Item 3 · Other Dependent',
          showIf: all(is('relationship', 'C'), is('relative', '5')),
          question: t('¿Qué relación tiene?', 'What is the relationship?'),
          fields: [{ id: 'relative.other', type: 'text', required: true, label: { es: 'Relación (en inglés, por ejemplo "niece")', en: 'Relationship' }, formRef: 'Part 2 · Item 3 · Other Dependent (Specify)' }],
        },
      ],
    },
    {
      id: 'income',
      part: 'Part 3',
      title: t('Trabajo e ingresos', 'Employment and income'),
      questions: [
        {
          id: 'employment',
          kind: 'choice',
          formRef: 'Part 3 · Items 1–6 · I am currently',
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
          formRef: 'Part 3 · Items 1–3',
          showIf: is('employment', 'employed'),
          question: t('Sobre su trabajo', 'About your job'),
          fields: [
            { id: 'job.occupation', type: 'text', required: true, label: { es: 'Trabaja como (ocupación)', en: 'Employed as' }, formRef: 'Part 3 · Item 1 · Employed as a/an' },
            { id: 'job.employer1', type: 'text', required: true, label: { es: 'Nombre del empleador', en: 'Name of employer' }, formRef: 'Part 3 · Item 2 · Name of Employer Number 1' },
            { id: 'job.employer2', type: 'text', label: { es: 'Segundo empleador (si tiene)', en: 'Second employer (if any)' }, formRef: 'Part 3 · Item 3 · Name of Employer Number 2' },
          ],
        },
        {
          id: 'selfEmployed',
          kind: 'fields',
          formRef: 'Part 3 · Item 4',
          showIf: is('employment', 'self'),
          question: t('¿A qué se dedica?', 'What do you do?'),
          fields: [{ id: 'job.selfOccupation', type: 'text', required: true, label: { es: 'Ocupación', en: 'Occupation' }, formRef: 'Part 3 · Item 4 · Self employed as a/an' }],
        },
        {
          id: 'retired',
          kind: 'fields',
          formRef: 'Part 3 · Item 5',
          showIf: is('employment', 'retired'),
          question: t('¿Desde cuándo está jubilado/a?', 'Since when are you retired?'),
          fields: [date('job.retiredSince', 'Fecha', 'Date', 'Part 3 · Item 5 · Retired Since')],
        },
        {
          id: 'unemployed',
          kind: 'fields',
          formRef: 'Part 3 · Item 6',
          showIf: is('employment', 'unemployed'),
          question: t('¿Desde cuándo está sin empleo?', 'Since when are you unemployed?'),
          fields: [date('job.unemployedSince', 'Fecha', 'Date', 'Part 3 · Item 6 · Unemployed since')],
        },
        {
          id: 'myIncome',
          kind: 'fields',
          formRef: 'Part 3 · Item 7 · My current individual annual income',
          question: t('¿Cuánto gana usted al año?', 'How much do you earn per year?'),
          why: t('Su ingreso anual actual, antes de impuestos. Es el que el patrocinador anota por usted en la Parte 6 del I-864.', 'Your current annual income, before taxes. The sponsor enters it for you in Part 6 of the I-864.'),
          fields: [money('income.mine', 'Ingreso anual (dólares)', 'Annual income (dollars)', 'Part 3 · Item 7', true)],
        },
      ],
    },
    {
      id: 'taxes',
      part: 'Part 4',
      title: t('Impuestos y bienes', 'Taxes and assets'),
      questions: [
        {
          id: 'filedTaxes',
          kind: 'choice',
          formRef: 'Part 4 · Item 1 · Have you filed a Federal income tax return for each of the three most recent tax years?',
          question: t('¿Presentó declaración federal de impuestos en cada uno de los últimos 3 años?', 'Did you file a federal income tax return for each of the last 3 tax years?'),
          options: yesNo,
        },
        {
          id: 'taxIncome',
          kind: 'fields',
          formRef: 'Part 4 · Item 2 · Total income (adjusted gross income)',
          question: t('¿Cuál fue su ingreso total en sus declaraciones de impuestos?', 'What was your total income on your tax returns?'),
          why: t(
            'Use el "total income" (ingreso bruto ajustado) del formulario 1040. El año más reciente es obligatorio; los otros dos son opcionales. Si no tuvo que declarar ese año, escriba 0.',
            'Use the total (adjusted gross) income from Form 1040. The most recent year is required; the other two are optional. If you didn’t have to file that year, enter 0.',
          ),
          fields: [
            { id: 'tax1.year', type: 'number', required: true, label: { es: 'Año más reciente', en: 'Most recent year' }, formRef: 'Part 4 · Item 2 · Most Recent · Tax Year', maxLength: 4, placeholder: '2025' },
            money('tax1.income', 'Ingreso total de ese año', 'Total income that year', 'Part 4 · Item 2 · Most Recent · Total Income', true),
            { id: 'tax2.year', type: 'number', label: { es: 'Segundo año más reciente', en: '2nd most recent year' }, formRef: 'Part 4 · Item 2 · 2nd Most Recent · Tax Year', maxLength: 4 },
            money('tax2.income', 'Ingreso total', 'Total income', 'Part 4 · Item 2 · 2nd Most Recent · Total Income'),
            { id: 'tax3.year', type: 'number', label: { es: 'Tercer año más reciente', en: '3rd most recent year' }, formRef: 'Part 4 · Item 2 · 3rd Most Recent · Tax Year', maxLength: 4 },
            money('tax3.income', 'Ingreso total', 'Total income', 'Part 4 · Item 2 · 3rd Most Recent · Total Income'),
          ],
        },
        {
          id: 'useAssets',
          kind: 'choice',
          formRef: 'Part 4 · Items 3–6 · My assets (complete only if necessary)',
          question: t('¿El patrocinador necesita sumar sus bienes?', 'Does the sponsor need to add your assets?'),
          why: t('Solo si los ingresos no alcanzan y el patrocinador suma bienes en la Parte 7 del I-864.', 'Only if the income isn’t enough and the sponsor adds assets in Part 7 of the I-864.'),
          options: yesNo,
        },
        {
          id: 'assets',
          kind: 'fields',
          formRef: 'Part 4 · Items 3–5',
          showIf: is('useAssets', 'yes'),
          question: t('Sus bienes', 'Your assets'),
          why: t('Valor neto: lo que vale menos lo que debe. Escriba 0 si no tiene. Sumamos el total por usted.', 'Net value: what it’s worth minus what you owe. Enter 0 if none. We add up the total for you.'),
          fields: [
            money('assets.cash', 'Efectivo, ahorros y cuentas de cheques', 'Cash, savings and checking accounts', 'Part 4 · Item 3'),
            money('assets.realEstate', 'Valor neto de bienes raíces', 'Net value of real estate', 'Part 4 · Item 4'),
            money('assets.stocks', 'Acciones, bonos, certificados de depósito y otros bienes', 'Stocks, bonds, certificates of deposit and other assets', 'Part 4 · Item 5'),
          ],
        },
      ],
    },
    {
      id: 'sponsor',
      part: 'Part 5',
      title: t('Lo contesta el patrocinador', 'The sponsor answers'),
      questions: [
        {
          id: 'sponsor.name',
          kind: 'fields',
          formRef: 'Part 5 · I, THE SPONSOR',
          question: t('¿Cuál es el nombre completo del patrocinador?', 'What is the sponsor’s full name?'),
          notice: {
            tone: 'info',
            title: { es: 'Ahora contesta el patrocinador', en: 'Now the sponsor answers' },
            body: { es: 'La Parte 5 es la promesa del patrocinador. Use los mismos datos que en su I-864.', en: 'Part 5 is the sponsor’s promise. Use the same details as on the I-864.' },
          },
          fields: nameFields('sponsor', 'Part 5 · Sponsor'),
        },
        ...rows({
          max: 4,
          id: 'imm',
          first: () => true,
          question: (i) => (i === 1 ? t('¿A quién patrocina?', 'Who are you sponsoring?') : t('Otro inmigrante', 'Another immigrant')),
          more: t('¿Patrocina a otro inmigrante en el mismo I-864?', 'Are you sponsoring another immigrant on the same I-864?'),
          formRef: 'Part 5 · Items 1–4 · Intending Immigrants',
          why: (i) => (i === 1 ? t('Las mismas personas que patrocina en su I-864: el inmigrante principal y los familiares que lo acompañan.', 'The same people you sponsor on your I-864: the principal immigrant and accompanying family.') : undefined),
          fields: (i) => [
            ...nameFields(`imm${i}`, `Part 5 · Intending Immigrant ${i}`).map((f) => ({ ...f, maxLength: f.id.endsWith('family') ? 30 : 18 })),
            date(`imm${i}.dob`, 'Fecha de nacimiento', 'Date of birth', `Part 5 · Intending Immigrant ${i} · Date of Birth`),
            { id: `imm${i}.aNumber`, type: 'aNumber', label: { es: 'A-Number (si tiene)', en: 'A-Number (if any)' }, formRef: `Part 5 · Intending Immigrant ${i} · A-Number` },
            { id: `imm${i}.uscisAccount`, type: 'uscisAccount', label: { es: 'Cuenta de USCIS', en: 'USCIS online account number' }, formRef: `Part 5 · Intending Immigrant ${i}` },
          ],
          overflow: { es: 'El formulario tiene espacio para 4 inmigrantes. Si son más, escríbalos a mano en la Parte 9.', en: 'The form has room for 4 immigrants. If there are more, write them by hand in Part 9.' },
        }),
        ...statement('sponsor.readsEnglish', 'Part 5 · Items 5.a–5.b', t('El patrocinador', 'the sponsor')),
        {
          id: 'sponsor.contact',
          kind: 'fields',
          formRef: 'Part 5 · Items 7–9 · Sponsor’s Contact Information',
          question: t('¿Cómo puede USCIS contactar al patrocinador?', 'How can USCIS contact the sponsor?'),
          fields: contact('sponsor.', 'Part 5', '7,8,9'),
        },
      ],
    },
    {
      id: 'promise',
      part: 'Part 6',
      title: t('Su promesa y contacto', 'Your promise and contact'),
      questions: [
        ...statement('readsEnglish', 'Part 6 · Items 1.a–1.b', t('Usted (el familiar)', 'you (the household member)')).map((q) =>
          q.id === 'readsEnglish'
            ? {
                ...q,
                notice: {
                  tone: 'legal' as const,
                  title: { es: 'Es un contrato', en: 'It’s a contract' },
                  body: {
                    es: 'Al firmar el I-864A usted promete ayudar a mantener a los inmigrantes y responde junto con el patrocinador por todas sus obligaciones, mientras el I-864 esté vigente. El divorcio no termina la obligación. Si tiene dudas, consulte a un abogado.',
                    en: 'By signing Form I-864A you promise to help support the immigrants and are jointly liable with the sponsor for all their obligations while the I-864 is in force. Divorce does not end the obligation. If in doubt, consult an attorney.',
                  },
                },
              }
            : q,
        ),
        {
          id: 'member.contact',
          kind: 'fields',
          formRef: 'Part 6 · Items 3–5 · Household Member’s Contact Information',
          question: t('¿Cómo puede USCIS contactarle a usted?', 'How can USCIS contact you?'),
          fields: contact('', 'Part 6', '3,4,5'),
        },
      ],
    },
  ],
};
