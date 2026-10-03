import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { parseUnit } from '../engine/validation';
import { fieldIndex, optionBoxes, selectOption, setFieldText } from './common';

// Fields of USCIS Form I-864A, edition 08/24/26 (public/forms/i-864a.pdf), named by the last
// segment of their full name and placed by where they sit on the printed page. Part 5's fourth
// immigrant carries Part 2 names (its A-Number is "P2_Line5_SSN"), the household member's name in
// Part 6 is "Part9_Iamfluent[0]" and the printed name in Item 6 is "P7Line6a_EmailAddress"; the
// mapping follows the page, not the names.

export interface I864APlan {
  text: Record<string, string>;
  check: string[];
  checkValue: [string, string][];
  select: Record<string, string>;
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');
const amount = (a: Answers, id: string) => Number(digits(str(a, id)) || 0);
const fullName = (a: Answers, p: string) => [str(a, `${p}.given`), str(a, `${p}.middle`), str(a, `${p}.family`)].filter(Boolean).join(' ');

const address = (p: string, careOf: boolean) => ({
  careOf: careOf ? `${p}_InCareOfName[0]` : undefined,
  street: `${p}_StreetNumberName[0]`,
  unit: `${p}_Unit`,
  number: `${p}_AptSteFlrNumber[0]`,
  city: `${p}_CityOrTown[0]`,
  state: `${p}_State[0]`,
  zip: `${p}_ZipCode[0]`,
  province: `${p}_Province[0]`,
  postal: `${p}_PostalCode[0]`,
  country: `${p}_Country[0]`,
});

/** Part 5 immigrants: family, given, middle, date of birth, A-Number and USCIS account. */
const immigrants = [
  ...[1, 2, 3].map((n) => ['a_FamilyName', 'b_GivenName', 'c_MiddleName', 'd_DateOfBirth', 'e_ANumber', 'f_USCISAcctNumber'].map((s) => `P5_Line${n}${s}[0]`)),
  ['Part2Line4a_FamilyName[0]', 'Part2Line4a_GivenName[0]', 'Part2Line4a_MiddleName[0]', 'P2_Line8_DateOfBirth[0]', 'P2_Line5_SSN[0]', 'P2_Line6_USCISELISAcctNumber[0]'],
];

export function planI864A(a: Answers): I864APlan {
  const text: Record<string, string> = {};
  const check: string[] = [];
  const checkValue: [string, string][] = [];
  const select: Record<string, string> = {};
  const put = (field: string, value: string) => {
    if (value) text[field] = value;
  };
  const yn = (base: string, value: unknown) => {
    if (value === 'yes') checkValue.push([base, 'Y']);
    if (value === 'no') checkValue.push([base, 'N']);
  };
  const fillAddress = (prefix: string, f: ReturnType<typeof address>) => {
    if (f.careOf) put(f.careOf, str(a, `${prefix}.careOf`));
    put(f.street, str(a, `${prefix}.street`));
    const unit = parseUnit(str(a, `${prefix}.unit`));
    if (unit) {
      checkValue.push([f.unit, unit.kind]);
      put(f.number, unit.number);
    }
    put(f.city, str(a, `${prefix}.city`));
    const st = str(a, `${prefix}.state`).toUpperCase();
    if (st) select[f.state] = st;
    put(f.zip, str(a, `${prefix}.zip`));
    put(f.province, str(a, `${prefix}.province`));
    put(f.postal, str(a, `${prefix}.postal`));
    put(f.country, str(a, `${prefix}.country`));
  };

  // Part 1: the household member. The name and A-Number repeat at the top of Part 9.
  for (const p of ['P1_Line1', 'Pt1Line1']) {
    put(`${p}a_FamilyName[0]`, str(a, 'name.family'));
    put(`${p}b_GivenName[0]`, str(a, 'name.given'));
    put(`${p}c_MiddleName[0]`, str(a, 'name.middle'));
  }
  fillAddress('mailing', address('P1_Line2', true));
  yn('P1_Line3_CB', a.mailingSame);
  if (a.mailingSame === 'no') fillAddress('home', address('P1_Line4', false));
  put('P1_Line5_DateOfBirth[0]', str(a, 'dob'));
  put('P1_Line6_CountryofBirth[0]', str(a, 'birthCountry'));
  put('P1_Line7_SSN[0]', digits(str(a, 'ssn')));
  const aNumber = digits(str(a, 'aNumber'));
  if (aNumber) for (const f of ['P1_Line8_AlienNumber[0]', 'Pt1Line3e_AlienNumber[0]']) put(f, aNumber.padStart(9, '0'));
  put('P1_Line9_USCISOnlineAcctNumber[0]', digits(str(a, 'uscisAccount')));

  // Part 2: relationship to the sponsor.
  const rel = str(a, 'relationship');
  if (['A', 'B', 'C'].includes(rel)) checkValue.push(['P2_Line1-3_Checkbox', rel]);
  if (rel === 'C' && str(a, 'relative')) {
    checkValue.push(['P2_Line3_A_Relationship', str(a, 'relative')]);
    if (a.relative === '5') put('P2_Line3_A_Other[0]', str(a, 'relative.other'));
  }

  // Part 3: employment and income.
  if (a.employment === 'employed') {
    check.push('P3_Line1_Employment[0]');
    put('P3_Line1a_Employed[0]', str(a, 'job.occupation'));
    put('P3_Line2_Employed[0]', str(a, 'job.employer1'));
    put('P3_Line3_Employed[0]', str(a, 'job.employer2'));
  }
  if (a.employment === 'self') {
    check.push('P3_Line4_Employment[0]');
    put('P3_Line4a_SelfEmployedDescription[0]', str(a, 'job.selfOccupation'));
  }
  if (a.employment === 'retired') {
    check.push('P3_Line5_Employment[0]');
    put('P3_Line5a_EmployedDate[0]', str(a, 'job.retiredSince'));
  }
  if (a.employment === 'unemployed') {
    check.push('P3_Line6_Employment[0]');
    put('P3_Line6a_EmployedDate[0]', str(a, 'job.unemployedSince'));
  }
  if (str(a, 'income.mine')) put('P3_Line2_CurrentIncome[0]', String(amount(a, 'income.mine')));

  // Part 4: taxes and, when needed, assets.
  yn('P4_Line1_CB', a.filedTaxes);
  (['a', 'b', 'c'] as const).forEach((l, i) => {
    put(`P4_Line2${l}_TaxYear[0]`, digits(str(a, `tax${i + 1}.year`)));
    if (str(a, `tax${i + 1}.income`)) put(`P4_Line2${l}_TotalIncome[0]`, String(amount(a, `tax${i + 1}.income`)));
  });
  if (a.useAssets === 'yes') {
    const values = ['assets.cash', 'assets.realEstate', 'assets.stocks'].map((id) => amount(a, id));
    ['P4_Line3_Assets[0]', 'P4_Line4_Assets[0]', 'P4_Line5_Assets[0]'].forEach((f, i) => put(f, String(values[i])));
    put('P4_Line6_TotalAssets[0]', String(values.reduce((x, y) => x + y, 0)));
  }

  // Part 5: the sponsor's promise. The signature (Item 10) stays empty.
  put('P5_SponsorName[0]', fullName(a, 'sponsor'));
  const listed: number[] = [];
  for (let i = 1; i <= 4; i++) {
    if (i > 1 && a[`imm.more${i - 1}`] !== 'yes') break;
    if (str(a, `imm${i}.family`)) listed.push(i);
  }
  for (const i of listed) {
    const [family, given, middle, dob, aNum, account] = immigrants[i - 1];
    put(family, str(a, `imm${i}.family`));
    put(given, str(a, `imm${i}.given`));
    put(middle, str(a, `imm${i}.middle`));
    put(dob, str(a, `imm${i}.dob`));
    const n = digits(str(a, `imm${i}.aNumber`));
    if (n) put(aNum, n.padStart(9, '0'));
    put(account, digits(str(a, `imm${i}.uscisAccount`)));
  }
  if (listed.length) {
    put('P5_IntendingMigrants[0]', String(listed.length));
    put('Part9_Iamfluent[1]', String(listed.length));
  }
  if (a['sponsor.readsEnglish'] === 'A') checkValue.push(['P5Line5_Checkbox', 'A']);
  if (a['sponsor.readsEnglish'] === 'B') {
    checkValue.push(['P5Line5_Checkbox', 'B']);
    put('P5Line5b_language[0]', str(a, 'sponsor.readsEnglish.language'));
  }
  put('Pt2Line3_DaytimePhone[0]', digits(str(a, 'sponsor.phone')));
  put('Pt2Line4_Mobilephone[0]', digits(str(a, 'sponsor.mobile')));
  put('Pt2Line5_EmailAddress[0]', str(a, 'sponsor.email'));

  // Part 6: the household member's promise. The signature (Item 7) stays empty.
  const member = fullName(a, 'name');
  put('Part9_Iamfluent[0]', member);
  put('P7Line6a_EmailAddress[0]', member);
  if (a.readsEnglish === 'A') checkValue.push(['Part6_Line1_Checkbox', 'A']);
  if (a.readsEnglish === 'B') {
    checkValue.push(['Part6_Line1_Checkbox', 'B']);
    put('P6Line1b_language[0]', str(a, 'readsEnglish.language'));
  }
  put('P7Line5_DaytimeTelephoneNumber[0]', digits(str(a, 'phone')));
  put('P7Line6_MobileTelephoneNumber[0]', digits(str(a, 'mobile')));
  put('P7Line7_EmailAddress[0]', str(a, 'email'));

  return { text, check, checkValue, select };
}

/** Fills the official I-864A PDF with the answers and returns the new file's bytes. */
export async function fillI864A(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const index = fieldIndex(doc.getForm());
  const plan = planI864A(a);
  const get = (name: string) => {
    const f = index.get(name);
    if (!f) throw new Error(`No such field: ${name}`);
    return f;
  };

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
  for (const [name, value] of Object.entries(plan.select)) {
    const field = get(name);
    if (!(field instanceof PDFDropdown)) throw new Error(`Not a dropdown: ${name}`);
    selectOption(field, value);
  }

  doc.setTitle('Form I-864A, Contract Between Sponsor and Household Member');
  return doc.save();
}
