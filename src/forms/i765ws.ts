import type { Answers, Field, FormDefinition } from './types';
import type { T } from '../i18n';
import { is, nameFields, yesNo } from './helpers';

// Questions follow USCIS Form I-765WS, Form I-765 Worksheet, edition 08/21/25.
// The PDF mapping lives in src/pdf/i765wsPdf.ts.
//
// The worksheet has three parts and no signature. The app asks for each income source, monthly
// expense and asset separately and the filler adds up the three totals Part 2 asks for (annual
// income, annual expenses, total assets). Part 3's explanation can start with a short breakdown
// of those sums. Everything on the form is covered; nothing is left for hand.

export const I765WS_EDITION = '08/21/25';

const t = (es: string, en: string): T => ({ es, en });

const money = (id: string, es: string, en: string, formRef: string): Field => ({
  id,
  type: 'number',
  label: { es, en },
  formRef,
  placeholder: '0',
  maxLength: 9,
  hint: t('Solo números, sin comas ni signo de dólar. Déjelo vacío si no aplica.', 'Digits only, no commas or dollar sign. Leave it empty if it does not apply.'),
});

/** Income sources, in U.S. dollars per `incomePeriod`. */
export const INCOME: { id: string; label: T }[] = [
  { id: 'income.wages', label: t('Sueldo o salario (antes de impuestos)', 'Wages or salary (before taxes)') },
  { id: 'income.self', label: t('Trabajo por su cuenta o trabajos ocasionales (ganancia)', 'Self-employment or odd jobs (net earnings)') },
  { id: 'income.support', label: t('Dinero que le dan familiares u otras personas', 'Money given to you by family or others') },
  { id: 'income.aid', label: t('Becas o ayuda financiera para estudios', 'Scholarships or financial aid') },
  { id: 'income.other', label: t('Otros ingresos', 'Other income') },
];

/** Monthly expenses, in U.S. dollars. */
export const EXPENSES: { id: string; label: T }[] = [
  { id: 'expense.housing', label: t('Renta o hipoteca (su parte)', 'Rent or mortgage (your share)') },
  { id: 'expense.food', label: t('Comida', 'Food') },
  { id: 'expense.utilities', label: t('Luz, agua, gas, internet y teléfono', 'Utilities, internet and phone') },
  { id: 'expense.transport', label: t('Transporte (pago del carro, gasolina, seguro, pasajes)', 'Transportation (car payment, gas, insurance, fares)') },
  { id: 'expense.medical', label: t('Gastos médicos y seguro de salud', 'Medical costs and health insurance') },
  { id: 'expense.school', label: t('Escuela o universidad (colegiatura, libros)', 'School or college (tuition, books)') },
  { id: 'expense.dependents', label: t('Cuidado de hijos o apoyo a familiares', 'Child care or support for family members') },
  { id: 'expense.debts', label: t('Deudas (tarjetas de crédito, préstamos)', 'Debts (credit cards, loans)') },
  { id: 'expense.other', label: t('Otros gastos', 'Other expenses') },
];

/** Assets, in U.S. dollars. */
export const ASSETS: { id: string; label: T }[] = [
  { id: 'asset.cash', label: t('Efectivo y cuentas de banco (cheques y ahorros)', 'Cash and bank accounts (checking and savings)') },
  { id: 'asset.vehicle', label: t('Valor de su carro o vehículo (lo que vale menos lo que debe)', 'Value of your car (what it is worth minus what you owe)') },
  { id: 'asset.property', label: t('Casa o terreno (lo que vale menos lo que debe)', 'House or land (what it is worth minus what you owe)') },
  { id: 'asset.other', label: t('Otros bienes (inversiones, cuentas de retiro, negocio)', 'Other assets (investments, retirement accounts, business)') },
];

const answered = (ids: string[]) => (a: Answers) => ids.some((id) => String(a[id] ?? '').trim() !== '');

export const i765ws: FormDefinition = {
  id: 'i-765ws',
  number: 'I-765WS',
  edition: I765WS_EDITION,
  title: t('Hoja de trabajo del Formulario I-765', 'Form I-765 Worksheet'),
  summary: {
    es: 'Muestre su necesidad económica de trabajar: ingresos, gastos y bienes. Va con el I-765 de DACA ((c)(33)) o acción diferida ((c)(14)).',
    en: 'Show your economic need to work: income, expenses and assets. Goes with a DACA ((c)(33)) or deferred action ((c)(14)) Form I-765.',
  },
  intro: {
    es: 'Si pide permiso de trabajo en la categoría (c)(33) (DACA) o (c)(14) (acción diferida), USCIS le pide esta hoja junto con el I-765 para ver si necesita trabajar por razones económicas. Solo pide tres números: lo que gana al año, lo que gasta al año y lo que valen sus bienes. Aquí le preguntamos por partes, en números redondos, y la app hace las sumas. No necesita poner los datos de otras personas de su hogar ni enviar pruebas.',
    en: 'If you are applying for a work permit in category (c)(33) (DACA) or (c)(14) (deferred action), USCIS asks for this worksheet with your Form I-765 to see whether you need to work for economic reasons. It only asks for three numbers: what you earn in a year, what you spend in a year and what your assets are worth. We ask piece by piece, in round numbers, and the app does the math. You do not need to include other household members’ finances or send evidence.',
  },
  minutes: 10,
  pdf: {
    path: 'forms/i-765ws.pdf',
    fileName: 'I-765WS-filled.pdf',
    load: () => import('../pdf/i765wsPdf').then((m) => m.fillI765WS),
    signHere: { es: 'No se firma (firme el I-765, Parte 3)', en: 'No signature (sign Form I-765, Part 3)' },
  },
  nextSteps: {
    es: [
      'Confirme en uscis.gov/i-765ws que la edición {edition} sigue vigente.',
      'Revise que los tres totales de la Parte 2 tengan sentido: son por año (los gastos mensuales se multiplicaron por 12). No hace falta adjuntar pruebas, pero USCIS revisará las que envíe (talones de pago, recibos de renta).',
      'Imprima el PDF. La hoja no se firma: firme a mano el I-765, Parte 3.',
      'Póngala justo detrás del I-765 y envíelos juntos (con el I-821D si es DACA). Si no la incluye, USCIS puede rechazar o retrasar su permiso de trabajo.',
    ],
    en: [
      'Check at uscis.gov/i-765ws that edition {edition} is still current.',
      'Make sure the three totals in Part 2 make sense: they are per year (monthly expenses were multiplied by 12). Evidence is not required, but USCIS will review any you send (pay stubs, rent receipts).',
      'Print the PDF. The worksheet is not signed: sign Form I-765, Part 3, by hand.',
      'Place it right behind Form I-765 and send them together (with Form I-821D for DACA). Without it, USCIS may reject or delay your work permit.',
    ],
  },
  sections: [
    {
      id: 'name',
      part: 'Part 1',
      title: t('Su nombre', 'Your name'),
      questions: [
        {
          id: 'name',
          kind: 'fields',
          formRef: 'Part 1 · Items 1.a–1.c · Your Full Name',
          question: t('¿Cuál es su nombre completo?', 'What is your full name?'),
          why: t('Escríbalo igual que en su I-765.', 'Write it exactly as on your Form I-765.'),
          fields: nameFields('name', 'Part 1 · Item 1'),
        },
      ],
    },
    {
      id: 'income',
      part: 'Part 2',
      title: t('Sus ingresos', 'Your income'),
      questions: [
        {
          id: 'incomePeriod',
          kind: 'choice',
          formRef: 'Part 2 · Item 1 · My current annual income',
          question: t('¿Prefiere dar sus ingresos por mes o por año?', 'Would you rather give your income per month or per year?'),
          why: t(
            'El formulario pide su ingreso anual actual, solo el suyo (no el de su hogar). Si cobra cada semana o cada mes, elija "por mes" y la app lo multiplica por 12.',
            'The form asks for your current annual income, yours alone (not your household’s). If you are paid weekly or monthly, choose "per month" and the app multiplies by 12.',
          ),
          options: [
            { value: 'month', label: t('Por mes', 'Per month') },
            { value: 'year', label: t('Por año', 'Per year') },
          ],
        },
        {
          id: 'incomeSources',
          kind: 'fields',
          formRef: 'Part 2 · Item 1',
          showIf: is('incomePeriod', 'month', 'year'),
          question: t('¿Cuánto dinero recibe, y de dónde?', 'How much money do you receive, and from where?'),
          why: t(
            'Use números redondos de lo que recibe ahora. Si hoy no tiene ingresos, deje todo vacío: la app pondrá 0.',
            'Use round numbers for what you receive now. If you have no income today, leave everything empty: the app will enter 0.',
          ),
          fields: INCOME.map((s) => money(s.id, s.label.es, s.label.en, 'Part 2 · Item 1')),
        },
      ],
    },
    {
      id: 'expenses',
      part: 'Part 2',
      title: t('Sus gastos', 'Your expenses'),
      questions: [
        {
          id: 'monthlyExpenses',
          kind: 'fields',
          formRef: 'Part 2 · Item 2 · My current annual expenses',
          question: t('¿Cuánto paga cada mes?', 'How much do you pay each month?'),
          why: t(
            'Ponga solo lo que usted paga (si comparte la renta, solo su parte). La app suma todo y lo multiplica por 12 para el total anual.',
            'Enter only what you pay (if you share the rent, only your share). The app adds it all up and multiplies by 12 for the annual total.',
          ),
          fields: EXPENSES.map((e) => money(e.id, e.label.es, e.label.en, 'Part 2 · Item 2')),
        },
        {
          id: 'otherExpenseWhat',
          kind: 'fields',
          formRef: 'Part 3 · Explanation',
          showIf: answered(['expense.other']),
          question: t('¿Qué son esos otros gastos?', 'What are those other expenses?'),
          fields: [{ id: 'expense.otherWhat', type: 'text', label: t('Descripción breve (en inglés)', 'Short description'), formRef: 'Part 3', placeholder: 'Gym, clothing', maxLength: 60 }],
        },
      ],
    },
    {
      id: 'assets',
      part: 'Part 2',
      title: t('Sus bienes', 'Your assets'),
      questions: [
        {
          id: 'assetValues',
          kind: 'fields',
          formRef: 'Part 2 · Item 3 · The total current value of my assets',
          question: t('¿Cuánto valen sus bienes hoy?', 'What are your assets worth today?'),
          why: t(
            'Solo lo suyo. Si no tiene, deje todo vacío: la app pondrá 0. La app suma el total.',
            'Yours only. If you have none, leave everything empty: the app will enter 0. The app adds up the total.',
          ),
          fields: ASSETS.map((s) => money(s.id, s.label.es, s.label.en, 'Part 2 · Item 3')),
        },
      ],
    },
    {
      id: 'explanation',
      part: 'Part 3',
      title: t('Su explicación', 'Your explanation'),
      questions: [
        {
          id: 'showBreakdown',
          kind: 'choice',
          formRef: 'Part 3 · Explanation',
          question: t('¿Quiere que la explicación empiece con el detalle de sus sumas?', 'Should the explanation start with the breakdown of your totals?'),
          why: t(
            'Por ejemplo: "Monthly expenses: rent $700, food $300…". Ayuda a USCIS a entender de dónde salen los números. Lo recomendamos.',
            'For example: "Monthly expenses: rent $700, food $300…". It helps USCIS see where the numbers come from. We recommend it.',
          ),
          options: yesNo,
        },
        {
          id: 'needStatement',
          kind: 'fields',
          formRef: 'Part 3 · Explanation',
          question: t('¿Quiere explicar por qué necesita trabajar?', 'Would you like to explain why you need to work?'),
          why: t(
            'Es opcional. Cuente en pocas líneas su situación: por ejemplo, que paga su renta y sus estudios, que ayuda a su familia, o que sus ingresos bajaron. Si no cabe, sigue en una hoja adjunta.',
            'It is optional. Describe your situation in a few lines: for example, that you pay your rent and school, help your family, or that your income went down. If it does not fit, it continues on an attached page.',
          ),
          fields: [{ id: 'need.explain', type: 'longText', label: t('Su explicación (en inglés)', 'Your explanation'), formRef: 'Part 3' }],
        },
      ],
    },
  ],
};
