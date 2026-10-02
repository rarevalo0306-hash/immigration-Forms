import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { parseUnit } from '../engine/validation';
import { fieldIndex, optionBoxes, selectOption, setFieldText } from './common';

// Fields of USCIS Form I-864EZ, edition 08/24/26 (public/forms/i-864ez.pdf), named by the last
// segment of their full name. The names swap the two people's parts: the sponsor (printed Part 2)
// is "Part3_*"/"P3_*" and the immigrant (printed Part 3) is "Part2_*"/"P2_*". The sponsor's status
// boxes export A (citizen), B (permanent resident) and C (national), and Part 9 repeats the
// sponsor's name and A-Number as "Part3_Line1*[1]" and "P3_Line12c_AlienNumber[1]".

export interface I864EZPlan {
  text: Record<string, string>;
  check: string[];
  checkValue: [string, string][];
  select: Record<string, string>;
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');
const amount = (a: Answers, id: string) => Number(digits(str(a, id)) || 0);

interface AddressFields {
  careOf?: string;
  street: string;
  unit: string;
  number: string;
  city: string;
  state: string;
  zip: string;
  province: string;
  postal: string;
  country: string;
}

const SPONSOR_MAILING: AddressFields = {
  careOf: 'Part3_Line2a_InCareofName[0]',
  street: 'Part3_Line2b_StreetNumberName[0]',
  unit: 'Part3_Line2c_Unit',
  number: 'Part3_Line2c_AptSteFlrNumber[0]',
  city: 'Part3_Line2d_CityOrTown[0]',
  state: 'Part3_Line2e_State[0]',
  zip: 'Part3_Line2f_ZipCode[0]',
  province: 'Part3_Line2g_Province[0]',
  postal: 'Part3_Line2h_PostalCode[0]',
  country: 'Part3_Line2i_Country[0]',
};

const SPONSOR_HOME: AddressFields = {
  street: 'Part3_Line4a_StreetNumberNameA[0]',
  unit: 'Part3_Line4b_UnitA',
  number: 'Part3_Line4b_AptSteFlrNumberA[0]',
  city: 'Part3_Line4c_CityOrTown[0]',
  state: 'Part3_Line4d_State[0]',
  zip: 'Part3_Line4e_ZipCode[0]',
  province: 'Part3_Line4f_Province[0]',
  postal: 'Part3_Line4g_PostalCode[0]',
  country: 'Part3_Line4h_Country[0]',
};

const IMMIGRANT_MAILING: AddressFields = {
  careOf: 'P2_Line2_InCareofName[0]',
  street: 'P2_Line2_StreetNumberName[0]',
  unit: 'P2_Line2_Unit',
  number: 'P2_Line2_AptSteFlrNumber[0]',
  city: 'P2_Line2_CityOrTown[0]',
  state: 'P2_Line2_State[0]',
  zip: 'P2_Line2_ZipCode[0]',
  province: 'P2_Line2_Province[0]',
  postal: 'P2_Line2_PostalCode[0]',
  country: 'P2_Line2_Country[0]',
};

/** The app's status values are the I-864's (A citizen, B national, C resident); this form orders them differently. */
const STATUS: Record<string, string> = { A: 'A', B: 'C', C: 'B' };

/** Part 4: the household size, counting the sponsor and the immigrant as 2. */
export const householdSize = (a: Answers) => 2 + ['hh.spouse', 'hh.children', 'hh.previouslySponsored', 'hh.otherDependents'].reduce((n, id) => n + amount(a, id), 0);

export function planI864EZ(a: Answers): I864EZPlan {
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
  const address = (prefix: string, f: AddressFields) => {
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
  const aNum = (s: string) => {
    const d = digits(s);
    return d ? d.padStart(9, '0') : '';
  };

  // Part 1.
  yn('P1_Line1a_Checkbox', a['ez.petitioner']);
  yn('P1_Line1b_Checkbox', a['ez.w2']);
  yn('P1_Line1c_Checkbox', a['ez.onlyOne']);

  // Part 2: the sponsor. The name and A-Number repeat at the top of Part 9.
  for (const i of [0, 1]) {
    put(`Part3_Line1a_FamilyName[${i}]`, str(a, 'name.family'));
    put(`Part3_Line1b_GivenName[${i}]`, str(a, 'name.given'));
    put(`Part3_Line1c_MiddleName[${i}]`, str(a, 'name.middle'));
    put(`P3_Line12c_AlienNumber[${i}]`, aNum(str(a, 'aNumber')));
  }
  address('mailing', SPONSOR_MAILING);
  yn('Part3_Line3_Checkbox', a.mailingSame);
  if (a.mailingSame === 'no') address('home', SPONSOR_HOME);
  put('Part3_Line5_CountryofDomicile[0]', str(a, 'domicile'));
  put('Part3_Line6_DateOfBirth[0]', str(a, 'dob'));
  put('P3_Line9_CountryofBirth[0]', str(a, 'birthCountry'));
  put('P3_Line10_SSN[0]', digits(str(a, 'ssn')));
  if (STATUS[str(a, 'status')]) checkValue.push(['P3_Line12_Checkbox', STATUS[str(a, 'status')]]);
  put('P3_Line2_USCISOnlineAcctNumber[0]', digits(str(a, 'uscisAccount')));
  yn('P3_Line13_Checkbox', a.activeDuty);

  // Part 3: the immigrant.
  put('Part2_Line1a_FamilyName[0]', str(a, 'principal.family'));
  put('Part2_Line1b_GivenName[0]', str(a, 'principal.given'));
  put('Part2_Line1c_MiddleName[0]', str(a, 'principal.middle'));
  address('principal.mailing', IMMIGRANT_MAILING);
  put('P3_Line3_CountryNationality[0]', str(a, 'principal.citizenship'));
  put('Part2_Line4_DateOfBirth[0]', str(a, 'principal.dob'));
  put('Part2_Line5_AlienNumber[0]', aNum(str(a, 'principal.aNumber')));
  put('Part2_Line6_USCISOnlineAcctNumber[0]', digits(str(a, 'principal.uscisAccount')));
  put('Part2_Line3_DaytimeTelephoneNumber[0]', digits(str(a, 'principal.phone')));

  // Part 4. Item 1 is always 2: the sponsor and the immigrant.
  put('P4_Line1a_TotalNumberofImmigrants[0]', '2');
  const counts: [string, string][] = [
    ['P4_Line1b_Spouse[0]', 'hh.spouse'],
    ['P4_Line1c_Dependent[0]', 'hh.children'],
    ['P4_Line1d_sponsoredpersons[0]', 'hh.previouslySponsored'],
    ['P4_Line1e_otherDependents[0]', 'hh.otherDependents'],
  ];
  for (const [field, id] of counts) if (str(a, id)) put(field, String(amount(a, id)));
  put('P4_Line1f_AddTogether[0]', String(householdSize(a)));

  // Part 5.
  if (a.employment === 'employed') {
    checkValue.push(['P5_Line1_Checkbox', 'E']);
    put('P5_Line2b_NameofEmployer[0]', str(a, 'job.employer1'));
    put('P5_Line2c_NameofEmployer[0]', str(a, 'job.employer2'));
  }
  if (a.employment === 'retired') {
    checkValue.push(['P5_Line1_Checkbox', 'R']);
    put('P5_Line3b_DateofRetirement[0]', str(a, 'job.retiredSince'));
  }
  if (str(a, 'income.mine')) put('P5_Line4_AnnualIncome[0]', String(amount(a, 'income.mine')));
  yn('P5_Line5a_Checkbox', a.filedTaxes);
  ['a', 'b', 'c'].forEach((l, i) => {
    put(`P5_Line6${l}_TaxYear[0]`, digits(str(a, `tax${i + 1}.year`)));
    if (str(a, `tax${i + 1}.income`)) put(`P5_Line6${l}_TotalIncome[0]`, String(amount(a, `tax${i + 1}.income`)));
  });

  // Part 6. The signature and its date stay empty: they are written by hand.
  if (a.readsEnglish === 'A' || a.readsEnglish === 'B') checkValue.push(['P6_Line1_Checkbox', str(a, 'readsEnglish')]);
  if (a.readsEnglish === 'B') put('P6_Line1b_language[0]', str(a, 'fluentLanguage'));
  if (a.preparer === 'yes') {
    check.push('P6_Line2_Checkbox[0]');
    put('P6_Line2_Attorney[0]', str(a, 'preparer.name'));
  }
  put('P6_Line3_DaytimeTelephoneNumber[0]', digits(str(a, 'phone')));
  put('P6_Line4_MobileTelephoneNumber[0]', digits(str(a, 'mobile')));
  put('P7Line7_EmailAddress[0]', str(a, 'email'));

  return { text, check, checkValue, select };
}

/** Fills the official I-864EZ PDF with the answers and returns the new file's bytes. */
export async function fillI864EZ(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const index = fieldIndex(form);
  const plan = planI864EZ(a);
  const get = (name: string) => {
    const f = index.get(name);
    if (!f) throw new Error(`No such field: ${name}`);
    return f;
  };

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
  for (const [name, value] of Object.entries(plan.select)) {
    const field = get(name);
    if (!(field instanceof PDFDropdown)) throw new Error(`Not a dropdown: ${name}`);
    selectOption(field, value);
  }

  doc.setTitle('Form I-864EZ, Affidavit of Support Under Section 213A of the INA');
  return doc.save();
}
