import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFDocument, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { ASSETS, EXPENSES, INCOME } from '../forms/i765ws';
import { fieldIndex } from './common';
import { fillI765WS, planI765WS } from './i765wsPdf';

const template = readFileSync(new URL('../../public/forms/i-765ws.pdf', import.meta.url));

/** Daniela, a DACA recipient renewing her work permit while she studies and works part time. */
export const daniela: Answers = {
  'name.family': 'Ramírez',
  'name.given': 'Daniela',
  'name.middle': 'Sofía',
  incomePeriod: 'month',
  'income.wages': '1600',
  'income.support': '200',
  'expense.housing': '650',
  'expense.food': '300',
  'expense.utilities': '90',
  'expense.transport': '220',
  'expense.school': '150',
  'expense.dependents': '100',
  'expense.other': '40',
  'expense.otherWhat': 'Clothing',
  'asset.cash': '1200',
  'asset.vehicle': '3500',
  showBreakdown: 'yes',
  'need.explain':
    'I work part time as a cashier while I study nursing at community college. My income pays my share of the rent, my bus and car costs, and my books. I also send money to help my mother with groceries. Without a work permit I could not continue school or support myself.',
};

describe('I-765WS PDF', () => {
  it('adds up the totals', () => {
    const { totals, text } = planI765WS(daniela);
    expect(totals).toEqual({ income: 21600, expenses: 18600, assets: 4700 });
    expect(text['Line1_IndividualAnnualIncome[0]']).toBe('21,600');
    expect(text['Line2_IndividualAnnualExpense[0]']).toBe('18,600');
    expect(text['Line3_TotalAssets[0]']).toBe('4,700');
    expect(planI765WS({ ...daniela, incomePeriod: 'year', 'income.wages': '19000', 'income.support': '' }).totals.income).toBe(19000);
    // No income and no assets still write 0 once those screens were answered.
    const none = planI765WS({ incomePeriod: 'month', 'asset.cash': '0' });
    expect(none.text['Line1_IndividualAnnualIncome[0]']).toBe('0');
    expect(none.text['Line3_TotalAssets[0]']).toBe('0');
    expect(none.text['Line2_IndividualAnnualExpense[0]']).toBeUndefined();
  });

  it('writes the breakdown before the explanation only when asked', () => {
    const plan = planI765WS(daniela);
    expect(plan.statement).toMatch(/^Annual income: \$21,600 \(\$1,800 per month x 12\)\. Monthly: wages \$1,600, support from family\/others \$200\./);
    expect(plan.statement).toContain('other (Clothing) $40');
    expect(plan.statement).toContain('Total assets: $4,700. cash/bank accounts $1,200, vehicle $3,500.');
    expect(plan.statement.endsWith(String(daniela['need.explain']))).toBe(true);
    expect(planI765WS({ ...daniela, showBreakdown: 'no' }).statement).toBe(daniela['need.explain']);
    expect(planI765WS({ ...daniela, showBreakdown: 'no', 'need.explain': '' }).statement).toBe('');
  });

  it('plans only fields that exist, with the right kind', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    const every: Answers = {};
    for (const f of [...INCOME, ...EXPENSES, ...ASSETS]) every[f.id] = '123';
    const variants: Answers[] = [
      daniela,
      { ...daniela, ...every, incomePeriod: 'year' },
      { ...daniela, showBreakdown: 'no', 'need.explain': '' },
      { 'name.family': 'Cruz', 'name.given': 'Luis' },
      {},
    ];
    for (const plan of variants.map(planI765WS)) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      expect(plan.check).toEqual([]);
      expect(plan.checkValue).toEqual([]);
    }
    for (const name of ['Statement_From_Applicant[0]', 'Statement_From_Applicant[1]']) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
    expect(planI765WS(variants[1]).totals).toEqual({ income: 615, expenses: 13284, assets: 492 });
  });

  it('writes the answers into the official form', async () => {
    const doc = await PDFDocument.load(await fillI765WS(template, daniela));
    const f = fieldIndex(doc.getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    expect(text('Line1a_FamilyName[0]')).toBe('Ramirez');
    expect(text('Line1b_GivenName[0]')).toBe('Daniela');
    expect(text('Line1c_MiddleName[0]')).toBe('Sofia');
    expect(text('Line1_IndividualAnnualIncome[0]')).toBe('21,600');
    expect(text('Line2_IndividualAnnualExpense[0]')).toBe('18,600');
    expect(text('Line3_TotalAssets[0]')).toBe('4,700');
    expect(text('Statement_From_Applicant[0]')).toMatch(/^Annual income: \$21,600/);
    expect(doc.getPageCount()).toBe(1);
  });

  it('flows a long explanation into the right column and a continuation page', async () => {
    const long = Array.from({ length: 60 }, (_, i) => `Sentence ${i + 1} about my rent, my school costs and how I help my family every month.`).join(' ');
    const doc = await PDFDocument.load(await fillI765WS(template, { ...daniela, 'need.explain': long }));
    const f = fieldIndex(doc.getForm());
    const right = (f.get('Statement_From_Applicant[1]') as PDFTextField).getText() ?? '';
    expect(right).toContain('Sentence');
    expect(right.endsWith('(Continued on the attached page.)')).toBe(true);
    expect(doc.getPageCount()).toBe(2);
  });
});
