import { PDFDocument, type PDFFont, PDFTextField, StandardFonts } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { fieldIndex, setFieldText, toFormText, wrap } from './common';

// Fields of USCIS Form I-765WS, edition 08/21/25 (public/forms/i-765ws.pdf), named by the last
// segment of their full name. One page, text fields only, mapped by position:
// - Part 2 is named for an individual, not a household: "Line1_IndividualAnnualIncome",
//   "Line2_IndividualAnnualExpense", "Line3_TotalAssets" (Items 1-3; the "$" is printed).
// - Part 3's explanation is two multiline fields: "Statement_From_Applicant[0]" is the short
//   box under the Part 3 heading (left column) and "Statement_From_Applicant[1]" the full-height
//   right column. Text flows from the first into the second, then onto an added page.
// - "PDF417BarCode1" is the page's barcode; it is left alone.

export interface I765WSPlan {
  text: Record<string, string>;
  check: string[];
  checkValue: [string, string][];
  select: Record<string, string>;
  /** Part 3's explanation; the filler flows it across both boxes and a continuation page. */
  statement: string;
  totals: { income: number; expenses: number; assets: number };
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const amount = (a: Answers, id: string) => Number(str(a, id).replace(/\D/g, '') || 0);
const dollars = (n: number) => n.toLocaleString('en-US');

/** Short English names for the breakdown in Part 3. */
const INCOME_NAMES: Record<string, string> = {
  'income.wages': 'wages',
  'income.self': 'self-employment',
  'income.support': 'support from family/others',
  'income.aid': 'scholarships/financial aid',
  'income.other': 'other',
};
const EXPENSE_NAMES: Record<string, string> = {
  'expense.housing': 'rent/mortgage',
  'expense.food': 'food',
  'expense.utilities': 'utilities/phone',
  'expense.transport': 'transportation',
  'expense.medical': 'medical',
  'expense.school': 'school',
  'expense.dependents': 'child care/family support',
  'expense.debts': 'debts',
  'expense.other': 'other',
};
const ASSET_NAMES: Record<string, string> = {
  'asset.cash': 'cash/bank accounts',
  'asset.vehicle': 'vehicle',
  'asset.property': 'real estate',
  'asset.other': 'other',
};

const STATEMENT = ['Statement_From_Applicant[0]', 'Statement_From_Applicant[1]'];

export function planI765WS(a: Answers): I765WSPlan {
  const text: Record<string, string> = {};
  const put = (field: string, value: string) => {
    if (value) text[field] = value;
  };
  const answered = (ids: string[]) => ids.some((id) => str(a, id) !== '');
  const items = (names: Record<string, string>) =>
    Object.entries(names)
      .filter(([id]) => amount(a, id) > 0)
      .map(([id, name]) => `${id === 'expense.other' && str(a, 'expense.otherWhat') ? `other (${str(a, 'expense.otherWhat')})` : name} $${dollars(amount(a, id))}`);
  const sum = (names: Record<string, string>) => Object.keys(names).reduce((n, id) => n + amount(a, id), 0);

  // Part 1.
  put('Line1a_FamilyName[0]', str(a, 'name.family'));
  put('Line1b_GivenName[0]', str(a, 'name.given'));
  put('Line1c_MiddleName[0]', str(a, 'name.middle'));

  // Part 2: the three totals. Income is given per month or per year; expenses are monthly.
  const months = a.incomePeriod === 'month' ? 12 : 1;
  const income = sum(INCOME_NAMES) * months;
  const monthlyExpenses = sum(EXPENSE_NAMES);
  const expenses = monthlyExpenses * 12;
  const assets = sum(ASSET_NAMES);
  if (str(a, 'incomePeriod') || answered(Object.keys(INCOME_NAMES))) put('Line1_IndividualAnnualIncome[0]', dollars(income));
  if (answered(Object.keys(EXPENSE_NAMES))) put('Line2_IndividualAnnualExpense[0]', dollars(expenses));
  if (answered(Object.keys(ASSET_NAMES))) put('Line3_TotalAssets[0]', dollars(assets));

  // Part 3: an optional breakdown of the sums, then the person's own words.
  const parts: string[] = [];
  if (a.showBreakdown === 'yes') {
    const incomeItems = items(INCOME_NAMES);
    if (text['Line1_IndividualAnnualIncome[0]'])
      parts.push(
        incomeItems.length === 0
          ? 'Annual income: $0. I have no income at this time.'
          : `Annual income: $${dollars(income)}${months === 12 ? ` ($${dollars(income / 12)} per month x 12)` : ''}. ${months === 12 ? 'Monthly' : 'Yearly'}: ${incomeItems.join(', ')}.`,
      );
    if (text['Line2_IndividualAnnualExpense[0]'])
      parts.push(`Annual expenses: $${dollars(expenses)} ($${dollars(monthlyExpenses)} per month x 12). Monthly: ${items(EXPENSE_NAMES).join(', ') || 'none'}.`);
    if (text['Line3_TotalAssets[0]']) parts.push(`Total assets: $${dollars(assets)}${assets ? `. ${items(ASSET_NAMES).join(', ')}.` : '.'}`);
  }
  const own = str(a, 'need.explain');
  const statement = [parts.join('\n'), own].filter(Boolean).join('\n\n');

  return { text, check: [], checkValue: [], select: {}, statement, totals: { income, expenses, assets } };
}

/** The printed rules in Part 3 are 18 points apart. */
const RULE = 18;

/** Fills the official I-765WS PDF with the answers and returns the new file's bytes. */
export async function fillI765WS(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const index = fieldIndex(form);
  const plan = planI765WS(a);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const textField = (name: string) => {
    const f = index.get(name);
    if (!f) throw new Error(`No such field: ${name}`);
    if (!(f instanceof PDFTextField)) throw new Error(`Not a text field: ${name}`);
    return f;
  };

  for (const f of form.getFields()) if (f instanceof PDFTextField && f.isRichFormatted()) f.disableRichFormatting();

  for (const [name, raw] of Object.entries(plan.text)) setFieldText(textField(name), raw, 9);

  // Part 3: fill the left box, then the right column, then a continuation page. Each line sits
  // between two printed rules: pdf-lib spaces lines 1.2 font heights apart, so a size whose line
  // height is half a rule, with a blank line after each line of text, lands one line per rule.
  // Long text is broken into lines here: pdf-lib's own wrapping is very slow on long text.
  if (plan.statement) {
    const size = RULE / 2 / (font.heightAtSize(1) * 1.2);
    let rest = toFormText(plan.statement).split('\n');
    STATEMENT.forEach((name, i) => {
      if (!rest.length) return;
      const box = textField(name);
      const { width, height } = box.acroField.getWidgets()[0].getRectangle();
      const lines = wrap(rest.join('\n'), font, size, width - 6);
      const fit = Math.floor(height / RULE);
      const last = i === STATEMENT.length - 1;
      const take = last && lines.length > fit ? fit - 1 : fit;
      box.enableMultiline();
      const shown = lines.slice(0, take);
      rest = lines.slice(take);
      if (last && rest.length) shown.push('(Continued on the attached page.)');
      setFieldText(box, shown.join('\n\n'), size);
    });
    if (rest.length) continuation(doc, font, a, rest.join('\n'));
  }

  doc.setTitle('Form I-765WS, Form I-765 Worksheet');
  return doc.save();
}

/** A plain letter-size page carrying the rest of Part 3, with the applicant's name on top. */
function continuation(doc: PDFDocument, font: PDFFont, a: Answers, s: string) {
  const size = 10;
  const margin = 54;
  const lineHeight = size * 1.35;
  const name = toFormText([str(a, 'name.given'), str(a, 'name.middle'), str(a, 'name.family')].filter(Boolean).join(' '));
  const lines = wrap(s, font, size, 612 - 2 * margin);
  let page = doc.addPage([612, 792]);
  let y = 0;
  const header = () => {
    y = 792 - margin;
    page.drawText('Form I-765WS, Part 3. Explanation (continued)', { x: margin, y, size: 12, font });
    y -= 18;
    if (name) page.drawText(`Name: ${name}`, { x: margin, y, size, font });
    y -= 24;
  };
  header();
  for (const line of lines) {
    if (y < margin) {
      page = doc.addPage([612, 792]);
      header();
    }
    page.drawText(line, { x: margin, y, size, font });
    y -= lineHeight;
  }
}
