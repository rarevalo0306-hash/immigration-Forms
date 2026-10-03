import type { DocItem } from './types';
import type { Answers } from '../types';
import { is } from '../helpers';
import { translations } from './common';

// From the I-912 instructions (edition 07/22/25): the "Documentation" paragraphs of Parts 4, 5 and 6.
export const formId = 'i-912';

/** Whether a "select all that apply" answer includes a value. */
const has = (id: string, value: string) => (a: Answers) => {
  const v = a[id];
  return Array.isArray(v) && v.includes(value);
};
const means = has('basis', 'A');
const income = has('basis', 'B');
const hardship = has('basis', 'C');

export const docs: DocItem[] = [
  {
    id: 'mainForm',
    label: { es: 'El formulario por el que pide la exención', en: 'The form whose fee you want waived' },
    detail: { es: 'El I-912 va encima y se envían juntos, sin pago.', en: 'Form I-912 goes on top and they are sent together, with no payment.' },
  },
  {
    id: 'benefitLetter',
    label: { es: 'Carta o aviso de la agencia del beneficio público', en: 'Letter or notice from the benefit agency' },
    detail: {
      es: 'Debe mostrar el nombre de quien lo recibe, la agencia, el tipo de beneficio y que está vigente. Si tiene más de 12 meses, agregue una prueba reciente.',
      en: 'It must show the name of the person receiving it, the agency, the type of benefit, and that it is current. If it is over 12 months old, add recent proof.',
    },
    when: means,
  },
  {
    id: 'taxReturn',
    label: { es: 'Su declaración federal de impuestos más reciente', en: 'Your most recent federal tax return' },
    detail: {
      es: 'También la de cada persona de su hogar que tenga ingresos. Si no declararon o ya no refleja sus ingresos: talones de pago de al menos el último mes, W-2, SSA-1099 o carta del empleador.',
      en: 'Also for each household member with income. If they didn’t file or it no longer reflects their income: pay stubs for at least the last month, W-2, SSA-1099 or an employer letter.',
    },
    when: income,
  },
  {
    id: 'otherIncome',
    label: { es: 'Prueba de otros ingresos o ayudas (si recibe)', en: 'Proof of other income or support (if you receive any)' },
    detail: {
      es: 'Por ejemplo, la orden de manutención de hijos, pensiones, Seguro Social, beneficios de veterano o desempleo, o ayuda regular de familiares.',
      en: 'For example, a child support order, pensions, Social Security, veterans or unemployment benefits, or regular support from relatives.',
    },
    when: income,
  },
  {
    id: 'unemployment',
    label: { es: 'Prueba de su desempleo', en: 'Proof of your unemployment' },
    detail: { es: 'La carta de despido o los papeles de los beneficios de desempleo que recibe.', en: 'The termination letter or papers for the unemployment benefits you receive.' },
    when: (a) => income(a) && is('employment', 'Unemployed')(a),
  },
  {
    id: 'supportLetters',
    label: { es: 'Cartas de organizaciones que le ayudan (si no tiene ingresos)', en: 'Letters from organizations that help you (if you have no income)' },
    detail: {
      es: 'Por ejemplo, de una iglesia, una organización sin fines de lucro o comunitaria, que diga que le dan apoyo.',
      en: 'For example, from a church, nonprofit or community organization, saying they support you.',
    },
    when: (a) => income(a) || hardship(a),
  },
  {
    id: 'hardshipEvidence',
    label: { es: 'Pruebas de su dificultad económica', en: 'Evidence of your financial hardship' },
    detail: {
      es: 'Según su caso: cuentas médicas, carta de despido o de desalojo, carta de un refugio, órdenes de despliegue militar, ayuda de FEMA, pérdidas del negocio, o el recibo de su caso VAWA, T o U.',
      en: 'Depending on your case: medical bills, termination or eviction letter, shelter letter, military deployment orders, FEMA assistance, business losses, or the receipt for your VAWA, T or U case.',
    },
    when: hardship,
  },
  {
    id: 'billsAndIncome',
    label: { es: 'Copias de sus cuentas mensuales y pruebas de sus ingresos', en: 'Copies of your monthly bills and proof of your income' },
    detail: { es: 'Renta o hipoteca, servicios, deudas y otros gastos, con los pagos que hace.', en: 'Rent or mortgage, utilities, debts and other expenses, with the payments you make.' },
    when: hardship,
  },
  translations,
];
