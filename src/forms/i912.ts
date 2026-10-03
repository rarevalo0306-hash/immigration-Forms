import type { Answers, Field, FormDefinition } from './types';
import type { T } from '../i18n';
import { all, date, is, nameFields, rows, yesNo } from './helpers';

// Questions follow USCIS Form I-912, Request for Fee Waiver, edition 07/22/25.
// The PDF mapping lives in src/pdf/i912Pdf.ts.

export const I912_EDITION = '07/22/25';

const t = (es: string, en: string): T => ({ es, en });

/** Whether a "select all that apply" answer includes a value. */
const has =
  (id: string, value: string) =>
  (a: Answers): boolean => {
    const v = a[id];
    return Array.isArray(v) && v.includes(value);
  };

const means = has('basis', 'A');
const income = has('basis', 'B');
const hardship = has('basis', 'C');

const money = (id: string, es: string, en: string, formRef: string, required = false): Field => ({
  id,
  type: 'number',
  required,
  label: { es, en },
  formRef,
  placeholder: '0',
  hint: t('Solo números, sin comas ni signo de dólar.', 'Digits only, no commas or dollar sign.'),
});

/** Part 6, Item 3: the expense boxes, by the PDF's export values. */
export const EXPENSES: { value: string; label: T }[] = [
  { value: 'A', label: t('Renta o hipoteca', 'Rent and/or mortgage') },
  { value: 'B', label: t('Comida', 'Food') },
  { value: 'C', label: t('Luz, agua, gas (servicios)', 'Utilities') },
  { value: 'D', label: t('Cuidado de niños o ancianos', 'Child and/or elder care') },
  { value: 'E', label: t('Seguros', 'Insurance') },
  { value: 'F', label: t('Préstamos o tarjetas de crédito', 'Loans and/or credit cards') },
  { value: 'G', label: t('Pago del carro', 'Car payment') },
  { value: 'H', label: t('Transporte al trabajo', 'Commuting costs') },
  { value: 'I', label: t('Gastos médicos', 'Medical expenses') },
  { value: 'J', label: t('Gastos escolares', 'School expenses') },
  { value: 'O', label: t('Otro', 'Other') },
];

export const i912: FormDefinition = {
  id: 'i-912',
  number: 'I-912',
  edition: I912_EDITION,
  title: t('Solicitud de exención de tarifa', 'Request for Fee Waiver'),
  summary: {
    es: 'Pida que USCIS no le cobre la tarifa si recibe beneficios públicos, gana poco o pasa por dificultades económicas.',
    en: 'Ask USCIS to waive the filing fee if you receive public benefits, have a low income or face financial hardship.',
  },
  intro: {
    es: 'El I-912 se envía junto con el formulario por el que no quiere pagar (por ejemplo el N-400, I-90, I-765 o I-821D renovación). No todos los formularios permiten exención: revise la lista en uscis.gov/i-912 antes de presentar. Puede incluir en una sola solicitud a los familiares que presentan formularios al mismo tiempo.',
    en: 'Form I-912 is sent together with the form whose fee you want waived (for example the N-400, I-90, I-765 or a DACA renewal). Not every form allows a waiver: check the list at uscis.gov/i-912 before filing. One request can cover family members filing at the same time.',
  },
  minutes: 25,
  pdf: {
    path: 'forms/i-912.pdf',
    fileName: 'I-912-filled.pdf',
    load: () => import('../pdf/i912Pdf').then((m) => m.fillI912),
    signHere: { es: 'Parte 7, Ítem 6', en: 'Part 7, Item 6' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/i-912 que la edición {edition} sigue vigente y que el formulario que presenta permite exención de tarifa.',
      'Adjunte las pruebas de cada razón que marcó: la carta del beneficio público (con su nombre, la agencia y que está vigente), su declaración de impuestos o W-2 más reciente, o comprobantes de sus gastos y deudas.',
      'Imprima el PDF y firme la Parte 7, Ítem 6, a mano con tinta negra. Si un intérprete o preparador le ayudó, ellos llenan y firman a mano las Partes 8 y 9.',
      'Ponga el I-912 encima del formulario por el que pide la exención y envíelos juntos, sin cheque. Si USCIS la niega, le devolverá todo y podrá volver a presentar con el pago.',
    ],
    en: [
      'Check at uscis.gov/i-912 that edition {edition} is still current and that the form you are filing allows a fee waiver.',
      'Attach evidence for each basis you selected: the benefit letter (with your name, the agency and that it is current), your latest tax return or W-2, or proof of your expenses and debts.',
      'Print the PDF and sign Part 7, Item 6, by hand in black ink. If an interpreter or preparer helped you, they complete and sign Parts 8 and 9 by hand.',
      'Place Form I-912 on top of the form whose fee you want waived and send them together, without a check. If USCIS denies it, everything is returned and you can file again with the fee.',
    ],
  },
  sections: [
    {
      id: 'basis',
      part: 'Part 1',
      title: t('Por qué pide la exención', 'Basis for your request'),
      questions: [
        {
          id: 'basis',
          kind: 'choice',
          multiple: true,
          formRef: 'Part 1 · Item 1 · Basis for Your Request',
          question: t('¿Por qué no puede pagar la tarifa? Marque todas las que apliquen.', 'Why can’t you pay the fee? Select all that apply.'),
          why: t('Basta con una razón, pero marcar más de una (con sus pruebas) ayuda si USCIS no acepta alguna.', 'One basis is enough, but selecting more than one (with evidence) helps if USCIS does not accept one of them.'),
          options: [
            { value: 'A', label: t('Yo, mi cónyuge o el jefe de mi hogar recibimos un beneficio público según los ingresos (Medicaid, SNAP/cupones, TANF, SSI)', 'I, my spouse or my head of household receive a means-tested benefit (Medicaid, SNAP, TANF, SSI)') },
            { value: 'B', label: t('El ingreso de mi hogar es igual o menor al 150% de la línea federal de pobreza', 'My household income is at or below 150% of the Federal Poverty Guidelines') },
            { value: 'C', label: t('Tengo dificultades económicas (gastos médicos, desempleo, desastre, deudas)', 'I have a financial hardship (medical bills, unemployment, disaster, debts)') },
          ],
        },
        {
          id: 'status',
          kind: 'fields',
          formRef: 'Part 1 · Item 2',
          question: t('¿Cuál es su estatus migratorio actual?', 'What is your current immigration status?'),
          fields: [
            {
              id: 'immStatus',
              type: 'text',
              required: true,
              label: { es: 'Estatus (en inglés)', en: 'Status' },
              formRef: 'Part 1 · Item 2',
              placeholder: 'Lawful permanent resident',
              hint: t('Por ejemplo: Lawful permanent resident, DACA recipient, TPS, Asylee, Parolee.', 'For example: Lawful permanent resident, DACA recipient, TPS, Asylee, Parolee.'),
            },
          ],
        },
      ],
    },
    {
      id: 'requestor',
      part: 'Part 2',
      title: t('Sus datos', 'About you'),
      questions: [
        {
          id: 'guardian',
          kind: 'choice',
          formRef: 'Part 2 · Item 1',
          question: t('¿Llena esto como padre o tutor legal de la persona que pide la exención?', 'Are you a parent or legal guardian filing for the person requesting the fee waiver?'),
          why: t('Solo si la persona es menor de 14 años o tiene una discapacidad que le impide firmar. Si no, conteste No y ponga sus propios datos.', 'Only if the person is under 14 or has a disability that keeps them from signing. Otherwise answer No and give your own information.'),
          options: yesNo,
        },
        {
          id: 'name',
          kind: 'fields',
          formRef: 'Part 2 · Item 2 · Full Name',
          question: t('¿Cuál es su nombre completo?', 'What is your full name?'),
          fields: nameFields('name', 'Part 2 · Item 2'),
        },
        {
          id: 'otherName.more0',
          kind: 'choice',
          formRef: 'Part 2 · Item 3 · Other Names Used',
          question: t('¿Ha usado otros nombres (de soltera, apodos, alias)?', 'Have you used other names (maiden name, nicknames, aliases)?'),
          options: yesNo,
        },
        ...rows({
          max: 2,
          id: 'otherName',
          first: is('otherName.more0', 'yes'),
          question: (i) => (i === 1 ? t('Otro nombre que ha usado', 'Another name you have used') : t('Otro nombre más', 'One more name')),
          more: t('¿Ha usado otro nombre más?', 'Have you used another name?'),
          formRef: 'Part 2 · Item 3',
          fields: (i) => nameFields(`otherName${i}`, `Part 2 · Item 3 · Name ${i}`),
          overflow: { es: 'Si son más de 2, escríbalos a mano en la Parte 10.', en: 'If there are more than 2, write them by hand in Part 10.' },
        }),
        {
          id: 'ids',
          kind: 'fields',
          formRef: 'Part 2 · Items 4–7',
          question: t('Sus números y fecha de nacimiento', 'Your numbers and date of birth'),
          fields: [
            { id: 'aNumber', type: 'aNumber', label: { es: 'A-Number (si tiene)', en: 'A-Number (if any)' }, formRef: 'Part 2 · Item 4' },
            { id: 'uscisAccount', type: 'uscisAccount', label: { es: 'Cuenta en línea de USCIS (si tiene)', en: 'USCIS online account number (if any)' }, formRef: 'Part 2 · Item 5' },
            date('dob', 'Fecha de nacimiento', 'Date of birth', 'Part 2 · Item 6'),
            { id: 'ssn', type: 'ssn', label: { es: 'Número de Seguro Social (si tiene)', en: 'U.S. Social Security number (if any)' }, formRef: 'Part 2 · Item 7' },
          ],
        },
        {
          id: 'marital',
          kind: 'choice',
          formRef: 'Part 2 · Item 8 · Marital Status',
          question: t('¿Cuál es su estado civil?', 'What is your marital status?'),
          options: [
            { value: 'Single', label: t('Soltero(a), nunca casado(a)', 'Single, never married') },
            { value: 'Married', label: t('Casado(a)', 'Married') },
            { value: 'Divorced', label: t('Divorciado(a)', 'Divorced') },
            { value: 'Widowed', label: t('Viudo(a)', 'Widowed') },
            { value: 'Annulled', label: t('Matrimonio anulado', 'Marriage annulled') },
            { value: 'Legally Seperated', label: t('Separado(a)', 'Separated') },
            { value: 'Other', label: t('Otro', 'Other') },
          ],
        },
        {
          id: 'maritalOther',
          kind: 'fields',
          formRef: 'Part 2 · Item 8 · Other (Explain)',
          showIf: is('marital', 'Other'),
          question: t('Explique su estado civil', 'Explain your marital status'),
          fields: [{ id: 'marital.other', type: 'text', required: true, label: { es: 'Estado civil (en inglés)', en: 'Marital status' }, formRef: 'Part 2 · Item 8', maxLength: 50 }],
        },
      ],
    },
    {
      id: 'applicants',
      part: 'Part 3',
      title: t('Formularios incluidos', 'Forms included'),
      questions: [
        {
          id: 'selfForms',
          kind: 'fields',
          formRef: 'Part 3 · Item 1 · Row 1',
          question: t('¿Qué formularios presenta usted con esta exención?', 'Which forms are you filing with this fee waiver?'),
          why: t('Ponga solo los suyos; los de sus familiares van en las siguientes pantallas. Si llena esto como padre o tutor y usted no presenta nada, déjelo en blanco.', 'List only your own; your family members’ go on the next screens. If you are a parent or guardian filing nothing yourself, leave it blank.'),
          fields: [{ id: 'self.forms', type: 'text', label: { es: 'Formularios (separados por comas)', en: 'Forms (comma separated)' }, formRef: 'Part 3 · Item 1 · Forms Being Filed', placeholder: 'N-400', maxLength: 30 }],
        },
        {
          id: 'family.more0',
          kind: 'choice',
          formRef: 'Part 3 · Item 1 · Family Members',
          question: t('¿Algún familiar presenta formularios con esta misma exención?', 'Is a family member filing forms with this same fee waiver?'),
          options: yesNo,
        },
        ...rows({
          max: 3,
          id: 'family',
          first: is('family.more0', 'yes'),
          question: (i) => (i === 1 ? t('Un familiar incluido', 'A family member included') : t('Otro familiar', 'Another family member')),
          more: t('¿Incluye a otro familiar?', 'Are you including another family member?'),
          formRef: 'Part 3 · Item 1',
          fields: (i) => [
            { id: `family${i}.name`, type: 'text', required: true, label: { es: 'Nombre completo', en: 'Full name' }, formRef: `Part 3 · Row ${i + 1} · Full Name`, maxLength: 40 },
            { id: `family${i}.aNumber`, type: 'aNumber', label: { es: 'A-Number (si tiene)', en: 'A-Number (if any)' }, formRef: `Part 3 · Row ${i + 1} · A-Number` },
            date(`family${i}.dob`, 'Fecha de nacimiento', 'Date of birth', `Part 3 · Row ${i + 1} · Date of Birth`),
            { id: `family${i}.relationship`, type: 'text', required: true, label: { es: 'Relación con usted (en inglés)', en: 'Relationship to you' }, formRef: `Part 3 · Row ${i + 1} · Relationship to You`, placeholder: 'son', maxLength: 20 },
            { id: `family${i}.forms`, type: 'text', required: true, label: { es: 'Formularios que presenta', en: 'Forms being filed' }, formRef: `Part 3 · Row ${i + 1} · Forms Being Filed`, placeholder: 'I-765', maxLength: 30 },
          ],
          overflow: { es: 'Si son más, escríbalos a mano en la Parte 10.', en: 'If there are more, write them by hand in Part 10.' },
        }),
      ],
    },
    {
      id: 'benefits',
      part: 'Part 4',
      title: t('Beneficios públicos', 'Means-tested benefits'),
      questions: rows({
        max: 8,
        id: 'benefit',
        first: means,
        question: (i) => (i === 1 ? t('¿Quién recibe el beneficio?', 'Who receives the benefit?') : t('Otro beneficio', 'Another benefit')),
        why: (i) => (i === 1 ? t('Ponga cada beneficio de usted, su cónyuge o el jefe de su hogar que viva con usted. Adjunte la carta de la agencia que diga que está vigente.', 'List each benefit received by you, your spouse or the head of household living with you. Attach the agency letter showing it is current.') : undefined),
        more: t('¿Hay otro beneficio?', 'Is there another benefit?'),
        formRef: 'Part 4 · Item 1 · Means-Tested Benefit Recipients',
        fields: (i) => [
          { id: `benefit${i}.name`, type: 'text', required: true, label: { es: 'Nombre completo de quien lo recibe', en: 'Full name of the person receiving it' }, formRef: `Part 4 · Row ${i} · Full Name`, maxLength: 30 },
          { id: `benefit${i}.relationship`, type: 'text', required: true, label: { es: 'Relación con usted (en inglés)', en: 'Relationship to you' }, formRef: `Part 4 · Row ${i} · Relationship`, placeholder: 'self', maxLength: 15 },
          { id: `benefit${i}.agency`, type: 'text', required: true, label: { es: 'Agencia que lo otorga', en: 'Agency awarding the benefit' }, formRef: `Part 4 · Row ${i} · Name of Agency`, placeholder: 'LA County DPSS', maxLength: 25 },
          { id: `benefit${i}.type`, type: 'text', required: true, label: { es: 'Tipo de beneficio', en: 'Type of benefit' }, formRef: `Part 4 · Row ${i} · Type of Benefit`, placeholder: 'Medicaid', maxLength: 15 },
          date(`benefit${i}.awarded`, 'Fecha en que se otorgó', 'Date awarded', `Part 4 · Row ${i} · Date Benefit was Awarded`),
          date(`benefit${i}.expires`, 'Fecha en que vence (o se renueva)', 'Date it expires (or must be renewed)', `Part 4 · Row ${i} · Date Benefit Expires`, true, 'date'),
        ],
        overflow: { es: 'Si son más de 8, escríbalos a mano en la Parte 10.', en: 'If there are more than 8, write them by hand in Part 10.' },
      }),
    },
    {
      id: 'income',
      part: 'Part 5',
      title: t('Ingresos del hogar', 'Household income'),
      questions: [
        {
          id: 'employment',
          kind: 'choice',
          formRef: 'Part 5 · Item 1 · Employment Status',
          showIf: income,
          question: t('¿Cuál es su situación de empleo?', 'What is your employment status?'),
          options: [
            { value: 'Employed', label: t('Empleado(a) (tiempo completo, parcial, temporal o por cuenta propia)', 'Employed (full-time, part-time, seasonal, self-employed)') },
            { value: 'Unemployed', label: t('Desempleado(a) o sin trabajo', 'Unemployed or not employed') },
            { value: 'Retired', label: t('Jubilado(a)', 'Retired') },
            { value: 'Other', label: t('Otro', 'Other') },
          ],
        },
        {
          id: 'employmentOther',
          kind: 'fields',
          formRef: 'Part 5 · Item 1 · Other (Explain)',
          showIf: all(income, is('employment', 'Other')),
          question: t('Explique su situación de empleo', 'Explain your employment status'),
          fields: [{ id: 'employment.other', type: 'text', required: true, label: { es: 'Situación (en inglés)', en: 'Status' }, formRef: 'Part 5 · Item 1', maxLength: 40 }],
        },
        {
          id: 'unemploymentBenefits',
          kind: 'choice',
          formRef: 'Part 5 · Item 2',
          showIf: all(income, is('employment', 'Unemployed')),
          question: t('¿Recibe beneficios de desempleo?', 'Are you receiving unemployment benefits?'),
          options: yesNo,
        },
        {
          id: 'unemployedSince',
          kind: 'fields',
          formRef: 'Part 5 · Item 2.A',
          showIf: all(income, is('employment', 'Unemployed')),
          question: t('¿Desde cuándo está sin trabajo?', 'When did you become unemployed?'),
          fields: [date('unemployed.date', 'Fecha en que quedó sin trabajo', 'Date you became unemployed', 'Part 5 · Item 2.A')],
        },
        {
          id: 'household',
          kind: 'fields',
          formRef: 'Part 5 · Items 3–5',
          showIf: income,
          question: t('Su hogar', 'Your household'),
          why: t('Cuente a usted, su cónyuge si viven juntos, sus hijos menores de 21 que viven con usted y a quienes declara como dependientes en los impuestos.', 'Count yourself, your spouse if living together, your children under 21 living with you, and anyone you claim as a dependent on your taxes.'),
          fields: [
            { id: 'householdSize', type: 'number', required: true, label: { es: 'Número total de personas en su hogar', en: 'Total household size' }, formRef: 'Part 5 · Item 3', placeholder: '3', maxLength: 3 },
            { id: 'earners', type: 'number', required: true, label: { es: 'Cuántas ganan dinero (incluyéndose)', en: 'Members earning income, including yourself' }, formRef: 'Part 5 · Item 4', placeholder: '1', maxLength: 3 },
            { id: 'headOfHousehold', type: 'text', label: { es: 'Jefe del hogar (si no es usted)', en: 'Head of household (if not you)' }, formRef: 'Part 5 · Item 5', maxLength: 40 },
          ],
        },
        {
          id: 'agi',
          kind: 'fields',
          formRef: 'Part 5 · Items 6–8 · Your Annual Household Income',
          showIf: income,
          question: t('Ingreso bruto ajustado del último año', 'Adjusted gross income for the last year'),
          why: t('Es el "adjusted gross income" de su declaración de impuestos (línea 11 del Formulario 1040). Si no declaró, use el total de sus W-2 o recibos de pago. La app suma el total del Ítem 8.', 'It is the adjusted gross income on your tax return (Form 1040, line 11). If you did not file, use the total on your W-2s or pay stubs. The app adds up Item 8.'),
          fields: [
            money('agi.yours', 'Su ingreso anual', 'Your annual adjusted gross income', 'Part 5 · Item 6', true),
            money('agi.family', 'Ingreso anual de los demás en su hogar (sin el suyo)', 'Annual income of the other household members (not yours)', 'Part 5 · Item 7'),
          ],
        },
        {
          id: 'changes',
          kind: 'choice',
          formRef: 'Part 5 · Item 9',
          showIf: income,
          question: t('¿Ha cambiado algo desde su última declaración de impuestos (ingresos, estado civil, dependientes)?', 'Has anything changed since you filed your last tax return (income, marital status, dependents)?'),
          options: yesNo,
        },
        {
          id: 'changesExplain',
          kind: 'fields',
          formRef: 'Part 5 · Item 9',
          showIf: all(income, is('changes', 'yes')),
          question: t('Explique qué cambió', 'Explain what changed'),
          fields: [{ id: 'changes.explain', type: 'longText', required: true, label: { es: 'Qué cambió y desde cuándo (en inglés)', en: 'What changed and since when' }, formRef: 'Part 5 · Item 9' }],
        },
      ],
    },
    {
      id: 'hardship',
      part: 'Part 6',
      title: t('Dificultad económica', 'Financial hardship'),
      questions: [
        {
          id: 'hardshipStory',
          kind: 'fields',
          formRef: 'Part 6 · Item 1',
          showIf: hardship,
          question: t('Describa su situación', 'Describe your situation'),
          why: t('Cuente qué le causó gastos, deudas o pérdida de ingresos (desempleo, enfermedad, desastre, falta de vivienda) y ponga los montos. Adjunte pruebas.', 'Explain what caused your expenses, debts or loss of income (unemployment, illness, disaster, homelessness) and give the amounts. Attach evidence.'),
          fields: [{ id: 'situation', type: 'longText', required: true, label: { es: 'Su situación (en inglés)', en: 'Your situation' }, formRef: 'Part 6 · Item 1' }],
        },
        {
          id: 'asset.more0',
          kind: 'choice',
          formRef: 'Part 6 · Item 2 · Assets',
          showIf: hardship,
          question: t('¿Tiene dinero o bienes que pueda convertir rápido en efectivo (cuentas de banco, acciones, bonos)?', 'Do you have cash or assets you can quickly convert to cash (bank accounts, stocks, bonds)?'),
          why: t('No cuente cuentas de jubilación.', 'Do not include retirement accounts.'),
          options: yesNo,
        },
        ...rows({
          max: 3,
          id: 'asset',
          first: all(hardship, is('asset.more0', 'yes')),
          question: (i) => (i === 1 ? t('Un bien o cuenta', 'An asset') : t('Otro bien o cuenta', 'Another asset')),
          more: t('¿Tiene otro?', 'Do you have another one?'),
          formRef: 'Part 6 · Item 2',
          fields: (i) => [
            { id: `asset${i}.type`, type: 'text', required: true, label: { es: 'Tipo (en inglés)', en: 'Type of asset' }, formRef: `Part 6 · Item 2 · Row ${i} · Type of Asset`, placeholder: 'Checking account', maxLength: 30 },
            money(`asset${i}.value`, 'Valor en dólares', 'Value (U.S. dollars)', `Part 6 · Item 2 · Row ${i} · Value`, true),
          ],
          overflow: { es: 'Si son más de 3, escríbalos a mano en la Parte 10 y súmelos al total.', en: 'If there are more than 3, write them by hand in Part 10 and add them to the total.' },
        }),
        {
          id: 'expenses',
          kind: 'fields',
          formRef: 'Part 6 · Item 3 · Total Monthly Expenses and Liabilities',
          showIf: hardship,
          question: t('¿Cuánto gasta y paga de deudas al mes en total?', 'What are your total monthly expenses and liabilities?'),
          fields: [money('expenses.total', 'Total mensual (ponga 0 si no tiene)', 'Monthly total (enter 0 if none)', 'Part 6 · Item 3', true)],
        },
        {
          id: 'expenseTypes',
          kind: 'choice',
          multiple: true,
          formRef: 'Part 6 · Item 3',
          showIf: hardship,
          question: t('¿En qué gasta cada mes? Marque todas las que apliquen.', 'What do you pay each month? Select all that apply.'),
          options: EXPENSES,
        },
        {
          id: 'expenseOther',
          kind: 'fields',
          formRef: 'Part 6 · Item 3 · Other',
          showIf: all(hardship, has('expenseTypes', 'O')),
          question: t('¿Qué otros gastos tiene?', 'What other expenses do you have?'),
          fields: [{ id: 'expenses.other', type: 'text', required: true, label: { es: 'Otros gastos (en inglés)', en: 'Other expenses' }, formRef: 'Part 6 · Item 3 · Other', maxLength: 60 }],
        },
      ],
    },
    {
      id: 'statement',
      part: 'Part 7',
      title: t('Declaración y contacto', 'Statement and contact'),
      questions: [
        {
          id: 'readsEnglish',
          kind: 'choice',
          formRef: 'Part 7 · Item 1 · Requestor’s Statement Regarding the Interpreter',
          question: t('¿Puede leer y entender el formulario en inglés?', 'Can you read and understand the form in English?'),
          options: [
            { value: 'A', label: t('Sí, leo inglés', 'Yes, I read English') },
            { value: 'B', label: t('No, un intérprete me lo leerá', 'No, an interpreter will read it to me') },
          ],
        },
        {
          id: 'interpreterLanguage',
          kind: 'fields',
          formRef: 'Part 7 · Item 1.B',
          showIf: is('readsEnglish', 'B'),
          question: t('¿En qué idioma se lo leerán?', 'What language will it be read in?'),
          fields: [{ id: 'fluentLanguage', type: 'text', required: true, label: { es: 'Idioma', en: 'Language' }, formRef: 'Part 7 · Item 1.B', placeholder: 'Spanish', maxLength: 30 }],
        },
        {
          id: 'preparer',
          kind: 'choice',
          formRef: 'Part 7 · Item 2 · Statement Regarding the Preparer',
          question: t('¿Alguien más (no usted) preparó esta solicitud?', 'Did someone else prepare this request for you?'),
          why: t('Si es así, esa persona también debe llenar y firmar la Parte 9 a mano.', 'If so, that person must also complete and sign Part 9 by hand.'),
          options: yesNo,
        },
        {
          id: 'preparerName',
          kind: 'fields',
          formRef: 'Part 7 · Item 2',
          showIf: is('preparer', 'yes'),
          question: t('¿Quién la preparó?', 'Who prepared it?'),
          fields: [{ id: 'preparer.name', type: 'text', required: true, label: { es: 'Nombre del preparador', en: 'Preparer’s name' }, formRef: 'Part 7 · Item 2', maxLength: 40 }],
        },
        {
          id: 'contactInfo',
          kind: 'fields',
          formRef: 'Part 7 · Items 3–5 · Requestor’s Contact Information',
          question: t('¿Cómo puede contactarle USCIS?', 'How can USCIS contact you?'),
          fields: [
            { id: 'phone', type: 'phone', required: true, label: { es: 'Teléfono de día', en: 'Daytime phone' }, formRef: 'Part 7 · Item 3', placeholder: '213 555 0123' },
            { id: 'mobile', type: 'phone', label: { es: 'Celular', en: 'Mobile phone' }, formRef: 'Part 7 · Item 4' },
            { id: 'email', type: 'email', label: { es: 'Correo electrónico', en: 'Email' }, formRef: 'Part 7 · Item 5' },
          ],
        },
      ],
    },
  ],
};
