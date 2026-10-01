import { PDFCheckBox, PDFDocument, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { fieldIndex, optionBoxes, setFieldText } from './common';

// Fields of USCIS Form I-912, edition 07/22/25 (public/forms/i-912.pdf), named by the last segment
// of their full name. Many names don't match the printed items, so these were mapped by position:
// - Part 2, Item 1 (parent or guardian) is "P1_Line1_Checkbox[1]".
// - In Part 3's table the date of birth of rows 2-4 is "Part4_Line2b..d_DateofBirth2..4" and their
//   relationship "Part3_Line1_DateofBirth2..4"; row 1's relationship is "Part4_Line2a_RelationshipToYou1".
// - Part 4's eight rows are "…1[0]"-"…4[0]" and then "…1[1]"-"…4[1]".
// - Part 5, Items 6-8 are "MonthlyIncome", "AvgHousehold" and "Total"; Item 1's "Other" text is
//   "Part3_Line3_Other".
// - Part 10 repeats the name and A-Number as "P2_L2_*[1]" and "P2_Line3_AlienNumber[1]".

export interface I912Plan {
  text: Record<string, string>;
  check: string[];
  checkValue: [string, string][];
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');
const amount = (a: Answers, id: string) => Number(digits(str(a, id)) || 0);
const list = (a: Answers, id: string) => (Array.isArray(a[id]) ? (a[id] as string[]) : []);
const dollars = (n: number) => n.toLocaleString('en-US');

/** How many forms a "Forms Being Filed" cell names ("I-485, I-765 and I-131" → 3). */
export const countForms = (s: string) => (s.match(/\b[A-Z]{1,2}-?\d{1,4}[A-Z]{0,2}\b/gi) ?? []).length;

/** Answers for "is there another?" chains: how many rows were filled. */
const chain = (a: Answers, id: string, max: number, first: boolean) => {
  if (!first) return 0;
  let n = 1;
  while (n < max && a[`${id}.more${n}`] === 'yes') n++;
  return n;
};

/** Part 3's columns, row by row (1-4). */
const P3 = [1, 2, 3, 4].map((r) => ({
  name: `Part3_Line1_Name${r}[0]`,
  aNumber: r === 1 ? 'P3_Line1_AlienNumber[0]' : `P3_Line1_AlienNumber${r}[0]`,
  dob: r === 1 ? 'Part3_Line1_DateofBirth1[0]' : `Part4_Line2${'abcd'[r - 1]}_DateofBirth${r}[0]`,
  relationship: r === 1 ? 'Part4_Line2a_RelationshipToYou1[0]' : `Part3_Line1_DateofBirth${r}[0]`,
  forms: `Part3_Line1_FormsFiled${r}[0]`,
}));

export function planI912(a: Answers): I912Plan {
  const text: Record<string, string> = {};
  const check: string[] = [];
  const checkValue: [string, string][] = [];
  const put = (field: string, value: string) => {
    if (value) text[field] = value;
  };
  const yn = (base: string, value: unknown) => {
    if (value === 'yes') checkValue.push([base, 'Yes']);
    if (value === 'no') checkValue.push([base, 'No']);
  };
  const basis = list(a, 'basis');

  // Part 1.
  if (basis.includes('A')) check.push('P1_Line1_Checkbox[0]');
  if (basis.includes('B')) check.push('P1_Line2_Checkbox[0]');
  if (basis.includes('C')) check.push('P1_Line3_Checkbox[0]');
  put('P1_ImmStatus[0]', str(a, 'immStatus'));

  // Part 2. The name and A-Number repeat at the top of Part 10.
  if (a.guardian === 'yes') check.push('P1_Line1_Checkbox[1]');
  for (const i of [0, 1]) {
    put(`P2_L2_FamilyName[${i}]`, str(a, 'name.family'));
    put(`P2_L2_GivenName[${i}]`, str(a, 'name.given'));
    put(`P2_L2_MiddleName[${i}]`, str(a, 'name.middle'));
  }
  const otherNames = chain(a, 'otherName', 2, a['otherName.more0'] === 'yes');
  for (let i = 1; i <= otherNames; i++) {
    const p = i === 1 ? 'P2_L3' : 'P2_3';
    put(`${p}_FamilyName[0]`, str(a, `otherName${i}.family`));
    put(`${p}_GivenName[0]`, str(a, `otherName${i}.given`));
    put(`${p}_MiddleName[0]`, str(a, `otherName${i}.middle`));
  }
  const aNumber = digits(str(a, 'aNumber'));
  if (aNumber) for (const i of [0, 1]) put(`P2_Line3_AlienNumber[${i}]`, aNumber.padStart(9, '0'));
  put('P2_Line4_AcctIdentifier[0]', digits(str(a, 'uscisAccount')));
  put('P2_5_DateOfBirth[0]', str(a, 'dob'));
  put('P2_Line6_SSN[0]', digits(str(a, 'ssn')));
  if (str(a, 'marital')) checkValue.push(['P2_7_MaritalStatus', str(a, 'marital')]);
  if (a.marital === 'Other') put('Part2_Line7_OtherText[0]', str(a, 'marital.other'));

  // Part 3: the requestor's own row first (when they file anything), then family members.
  const people: { name: string; aNumber: string; dob: string; relationship: string; forms: string }[] = [];
  if (str(a, 'self.forms')) {
    const name = [str(a, 'name.given'), str(a, 'name.middle'), str(a, 'name.family')].filter(Boolean).join(' ');
    people.push({ name, aNumber, dob: str(a, 'dob'), relationship: 'Self', forms: str(a, 'self.forms') });
  }
  const family = chain(a, 'family', 3, a['family.more0'] === 'yes');
  for (let i = 1; i <= family; i++)
    people.push({
      name: str(a, `family${i}.name`),
      aNumber: digits(str(a, `family${i}.aNumber`)),
      dob: str(a, `family${i}.dob`),
      relationship: str(a, `family${i}.relationship`),
      forms: str(a, `family${i}.forms`),
    });
  people.slice(0, 4).forEach((p, r) => {
    const f = P3[r];
    put(f.name, p.name);
    if (p.aNumber) put(f.aNumber, p.aNumber.padStart(9, '0'));
    put(f.dob, p.dob);
    put(f.relationship, p.relationship);
    put(f.forms, p.forms);
  });
  const totalForms = people.reduce((n, p) => n + countForms(p.forms), 0);
  if (totalForms) put('Part3_Line1_TotalForms[0]', String(totalForms));

  // Part 4.
  const benefits = chain(a, 'benefit', 8, basis.includes('A'));
  for (let i = 1; i <= benefits; i++) {
    const s = `${((i - 1) % 4) + 1}[${i > 4 ? 1 : 0}]`;
    put(`Part4_Line1_FullName${s}`, str(a, `benefit${i}.name`));
    put(`Part4_Line1_Relationship${s}`, str(a, `benefit${i}.relationship`));
    put(`Part4_Line1_Agency${s}`, str(a, `benefit${i}.agency`));
    put(`Part4_Line1_TypeofBene${s}`, str(a, `benefit${i}.type`));
    put(`Part4_Line1_DateAward${s}`, str(a, `benefit${i}.awarded`));
    put(`Part4_Line1_ExpDate${s}`, str(a, `benefit${i}.expires`));
  }

  // Part 5. Item 8 is the sum of Items 6 and 7.
  if (basis.includes('B')) {
    const employment = str(a, 'employment');
    if (employment) checkValue.push(['P5_1_EmploymentStatus', employment]);
    if (employment === 'Other') put('Part3_Line3_Other[0]', str(a, 'employment.other'));
    if (employment === 'Unemployed') {
      yn('Part5_Line2_chbxyesno', a.unemploymentBenefits);
      put('P5_2a_DateOfUnemployment[0]', str(a, 'unemployed.date'));
    }
    put('Part5_Line3_TotalHouseSize[0]', digits(str(a, 'householdSize')));
    put('Part5_Line4_TotalHousehold[0]', digits(str(a, 'earners')));
    put('Part5_Line5_NameHousehold[0]', str(a, 'headOfHousehold'));
    if (str(a, 'agi.yours')) put('MonthlyIncome[0]', dollars(amount(a, 'agi.yours')));
    if (str(a, 'agi.family')) put('AvgHousehold[0]', dollars(amount(a, 'agi.family')));
    if (str(a, 'agi.yours') || str(a, 'agi.family')) put('Total[0]', dollars(amount(a, 'agi.yours') + amount(a, 'agi.family')));
    yn('Part5_Line9_checkbox', a.changes);
    if (a.changes === 'yes') put('Part5_Line9_Explanation[0]', str(a, 'changes.explain'));
  }

  // Part 6.
  if (basis.includes('C')) {
    put('Part6_Line1_Situation[0]', str(a, 'situation'));
    const assets = chain(a, 'asset', 3, a['asset.more0'] === 'yes');
    let total = 0;
    for (let i = 1; i <= assets; i++) {
      put(`Part7_Line2${'abc'[i - 1]}_TypeOfAsset[0]`, str(a, `asset${i}.type`));
      put(`Assets${i}[0]`, dollars(amount(a, `asset${i}.value`)));
      total += amount(a, `asset${i}.value`);
    }
    if (assets) put('TotalAssets[0]', dollars(total));
    if (str(a, 'expenses.total')) put('Part6_Line3_Total[0]', dollars(amount(a, 'expenses.total')));
    const expenses = list(a, 'expenseTypes');
    for (const e of expenses) checkValue.push(['P6_Line3_Checkbox', e]);
    if (expenses.includes('O')) put('P6_Line3_Other[0]', str(a, 'expenses.other'));
  }

  // Part 7. The signature (Item 6) and its date stay empty: they are written by hand.
  if (a.readsEnglish === 'A' || a.readsEnglish === 'B') checkValue.push(['P7_L1_chbx', str(a, 'readsEnglish')]);
  if (a.readsEnglish === 'B') put('P7_L1B_Name[0]', str(a, 'fluentLanguage'));
  if (a.preparer === 'yes') {
    check.push('P7_L2_chbx[0]');
    put('P7_L2_Name[0]', str(a, 'preparer.name'));
  }
  put('P7_L3_DaytimeTelePhoneNumber1[0]', digits(str(a, 'phone')));
  put('P7_L4_MobileTelePhoneNumber1[0]', digits(str(a, 'mobile')));
  put('P7_L5_EmailAddress[0]', str(a, 'email'));

  return { text, check, checkValue };
}

/** Fills the official I-912 PDF with the answers and returns the new file's bytes. */
export async function fillI912(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const index = fieldIndex(form);
  const plan = planI912(a);
  const get = (name: string) => {
    const f = index.get(name);
    if (!f) throw new Error(`No such field: ${name}`);
    return f;
  };

  // Some text boxes are rich-text fields, which pdf-lib can't read back when it redraws the form;
  // store them as plain text instead.
  for (const f of form.getFields()) if (f instanceof PDFTextField && f.isRichFormatted()) f.disableRichFormatting();

  for (const [name, raw] of Object.entries(plan.text)) {
    const field = get(name);
    if (!(field instanceof PDFTextField)) throw new Error(`Not a text field: ${name}`);
    setFieldText(field, raw, 9);
  }
  for (const name of plan.check) {
    const field = get(name);
    if (!(field instanceof PDFCheckBox)) throw new Error(`Not a checkbox: ${name}`);
    field.check();
  }
  for (const [base, value] of plan.checkValue) {
    const match = optionBoxes(index, base).find((o) => o.value === value);
    if (!match) throw new Error(`No "${value}" box in ${base}`);
    match.box.check();
  }

  doc.setTitle('Form I-912, Request for Fee Waiver');
  return doc.save();
}
