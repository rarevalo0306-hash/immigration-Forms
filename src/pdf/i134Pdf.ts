import { PDFCheckBox, PDFDocument, PDFDropdown, type PDFField, type PDFForm, PDFTextField, StandardFonts } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { ASSETS } from '../forms/i134';
import { parseUnit } from '../engine/validation';
import { optionBoxes, selectOption, setFieldText, toFormText, wrap } from './common';

// Fields of USCIS Form I-134, edition 01/20/25 (public/forms/i-134.pdf). Unlike most forms, the same
// last name segment names different boxes on different pages (the three addresses on pages 1, 2 and
// 5 are all "Part2_Item11_*"; "P2_Line8_DateOfBirth" is both the supporter's and the beneficiary's
// date of birth), so fields are named here by their full name without the "form1[0]." root, and were
// mapped by where they sit on the printed page:
// - Part 1's boxes are "#subform[0].Pt3Line17": [0] (export PD) is "Another individual", [1] (WD) "Myself".
// - Part 2, Item 13 is "P3_Line13" (a rich-text field) and Item 14 "P3_Line14"; Item 16 is "Pt3Line116_Annual".
// - Part 2, Item 19 (the contributions box on page 4) is "P8[0].Pt4Line1b_language"; Part 3, Item 6's
//   country is "P8[0].Part2_Item6_Country" and Item 7 (citizenship) "P8[0].P2_Line8_Country".
// - Part 2, Item 10 exports C, N, PR, NI, A (Asylee), R, P, TPS, B (deferred action) and Other;
//   Item 12's "Retired" exports M and "Unemployed" U.
// - Part 3, Item 11's unit boxes run FLR, STE, APT by index ("P2_Line10_Unit"), reversed from the page.
// - Part 4's and Part 5's phone fields are "Part4_Line3_DaytimePhoneNumber3" and
//   "Part4_Line4_SafePhoneNumber3" on both pages (P5[0] is Part 4, P9[0] is Part 5).
// - Part 8's rows are "Pt9Line3*" (Item 3), then "Pt9Line4*[0..2]" for Items 4-6, with
//   "Pt9Line3d_AdditionalInfo[1..3]" as their text.

export interface I134Plan {
  text: Record<string, string>;
  check: string[];
  checkValue: [string, string][];
  select: Record<string, string>;
  /** Part 2, Item 19; the filler moves it to Part 8 when it doesn't fit. */
  contributions: string;
  /** Part 8 entries, in order. */
  notes: { page: string; part: string; item: string; text: string }[];
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');
const amount = (a: Answers, id: string) => Number(digits(str(a, id)) || 0);
const dollars = (n: number) => n.toLocaleString('en-US');

/** Every field by its full name without the "form1[0]." root. */
export function i134Index(form: PDFForm) {
  const out = new Map<string, PDFField>();
  for (const f of form.getFields()) out.set(f.getName().replace(/^form1\[0\]\./, ''), f);
  return out;
}

const chain = (a: Answers, id: string, max: number, first: boolean) => {
  if (!first) return 0;
  let n = 1;
  while (n < max && a[`${id}.more${n}`] === 'yes') n++;
  return n;
};

const STATUS: Record<string, string> = {
  A: 'C',
  B: 'N',
  C: 'PR',
  nonimmigrant: 'NI',
  asylee: 'A',
  refugee: 'R',
  parolee: 'P',
  tps: 'TPS',
  deferred: 'B',
  other: 'Other',
};
const EMPLOYMENT: Record<string, string> = { employed: 'E', self: 'SE', unemployed: 'U', retired: 'M', other: 'O' };
const MARITAL: Record<string, string> = { single: 'S', married: 'M', divorced: 'D', widowed: 'W', separated: 'E', annulled: 'A', other: 'O' };

interface AddressFields {
  careOf: string;
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

const item11 = (p: string, unit: string, number: string): AddressFields => ({
  careOf: `${p}Part2_Item11_InCareOfName[0]`,
  street: `${p}Part2_Item11_StreetName[0]`,
  unit,
  number,
  city: `${p}Part2_Item11_City[0]`,
  state: `${p}Part2_Item11_State[0]`,
  zip: `${p}Part2_Item11_ZipCode[0]`,
  province: `${p}Part2_Item11_Province[0]`,
  postal: `${p}Part2_Item11_PostalCode[0]`,
  country: `${p}Part2_Item11_Country[0]`,
});

const MAILING = item11('#subform[0].', '#subform[0].Part2_Line3_Unit', '#subform[0].Part2_Line3_Number[0]');
const PHYSICAL = item11('PG2[0].sfPhysicalAddress[0].', 'PG2[0].sfPhysicalAddress[0].Part2_Line5_Unit', 'PG2[0].sfPhysicalAddress[0].Part2_Line5_Number[0]');
const BEN_MAILING = item11('P4[0].', 'P4[0].Part3_Item9_Unit', 'P4[0].Part3_Item9_Number[0]');
const BP = 'P4[0].sfPhysicalAddress[0].';
const BEN_PHYSICAL: AddressFields = {
  careOf: `${BP}P2_Line10_InCareOfName[0]`,
  street: `${BP}P2_Line10_StreetName[0]`,
  unit: `${BP}P2_Line10_Unit`,
  number: `${BP}P2_Line10_Number[0]`,
  city: `${BP}Pt2_Line10_City[0]`,
  state: `${BP}Pt2Line10_State[0]`,
  zip: `${BP}Pt2Line10_ZipCode[0]`,
  province: `${BP}Pt2Line10_Province[0]`,
  postal: `${BP}Pt2Line10_PostalCode[0]`,
  country: `${BP}Pt2Line10_Country[0]`,
};

/** The text fields of Part 8, Items 3-6. */
export const NOTE_ROWS = [
  ['P13[0].Pt9Line3a_PageNumber[0]', 'P13[0].Pt9Line3b_PartNumber[0]', 'P13[0].Pt9Line3c_ItemNumber[0]', 'P13[0].Pt9Line3d_AdditionalInfo[0]'],
  ...[0, 1, 2].map((i) => [`P13[0].Pt9Line4a_PageNumber[${i}]`, `P13[0].Pt9Line4b_PartNumber[${i}]`, `P13[0].Pt9Line4c_ItemNumber[${i}]`, `P13[0].Pt9Line3d_AdditionalInfo[${i + 1}]`]),
];

export const CONTRIBUTIONS_FIELD = 'P8[0].Pt4Line1b_language[0]';

export function planI134(a: Answers): I134Plan {
  const text: Record<string, string> = {};
  const check: string[] = [];
  const checkValue: [string, string][] = [];
  const select: Record<string, string> = {};
  const notes: I134Plan['notes'] = [];
  const put = (field: string, value: string) => {
    if (value) text[field] = value;
  };
  const yn = (base: string, value: unknown) => {
    if (value === 'yes') checkValue.push([base, 'Y']);
    if (value === 'no') checkValue.push([base, 'N']);
  };
  const name = (prefix: string, [family, given, middle]: string[]) => {
    put(family, str(a, `${prefix}.family`));
    put(given, str(a, `${prefix}.given`));
    put(middle, str(a, `${prefix}.middle`));
  };
  const address = (prefix: string, f: AddressFields) => {
    put(f.careOf, str(a, `${prefix}.careOf`));
    put(f.street, str(a, `${prefix}.street`));
    const u = parseUnit(str(a, `${prefix}.unit`));
    if (u) {
      checkValue.push([f.unit, u.kind]);
      put(f.number, u.number);
    }
    put(f.city, str(a, `${prefix}.city`));
    const st = str(a, `${prefix}.state`).toUpperCase();
    if (st) select[f.state] = st;
    put(f.zip, str(a, `${prefix}.zip`));
    put(f.province, str(a, `${prefix}.province`));
    put(f.postal, str(a, `${prefix}.postal`));
    put(f.country, str(a, `${prefix}.country`));
  };
  const self = a.basis === 'self';
  const other = a.basis === 'other';

  // Part 1.
  if (other) checkValue.push(['#subform[0].Pt3Line17', 'PD']);
  if (self) checkValue.push(['#subform[0].Pt3Line17', 'WD']);

  // Part 2, Items 1-11. The name and A-Number repeat at the top of Part 8.
  name('name', ['#subform[0].Pt1Line1_FamilyName[0]', '#subform[0].Pt1Line1_GivenName[0]', '#subform[0].Pt1Line1_MiddleName[0]']);
  name('name', ['P13[0].Pt1Line1_FamilyName[0]', 'P13[0].Pt1Line1_GivenName[0]', 'P13[0].Pt1Line1_MiddleName[0]']);
  for (let i = 1; i <= chain(a, 'otherName', 2, a['otherName.more0'] === 'yes'); i++)
    name(`otherName${i}`, [`#subform[0].P1_Line3_FamilyName${i}[0]`, `#subform[0].P1_Line3_GivenName${i}[0]`, `#subform[0].P1_Line3_MiddleName${i}[0]`]);
  address('mailing', MAILING);
  yn('#subform[0].Pt2_Line4_CB', a.mailingSame);
  if (a.mailingSame === 'no') address('home', PHYSICAL);
  put('PG2[0].#area[0].P2_Line8_DateOfBirth[0]', str(a, 'dob'));
  put('PG2[0].Part2_Item6_City[0]', str(a, 'birthCity'));
  put('PG2[0].Part2_Item6_Province[0]', str(a, 'birthState'));
  put('PG2[0].Part2_Item6_Country[0]', str(a, 'birthCountry'));
  const aNumber = digits(str(a, 'aNumber'));
  if (aNumber) for (const f of ['PG2[0].Pt1Line5_AlienNumber[0]', 'P13[0].Line3_ANumber[0].Pt1Line5_AlienNumber[0]']) put(f, aNumber.padStart(9, '0'));
  put('PG2[0].Pt1Line10_OnlineAccountNumber[0]', digits(str(a, 'uscisAccount')));
  if (STATUS[str(a, 'status')]) checkValue.push(['PG2[0].P2_Line10_ImmigrationStatus', STATUS[str(a, 'status')]]);
  if (a.status === 'other') put('PG2[0].P3_Line10_Other[0]', str(a, 'status.other'));
  put('PG2[0].P2_Line11_Beneficiary[0]', self ? 'Self' : str(a, 'relationship'));

  // Item 12.
  const employment = str(a, 'employment');
  if (EMPLOYMENT[employment]) checkValue.push(['PG2[0].StatusEmployment_CB', EMPLOYMENT[employment]]);
  if (employment === 'employed') {
    put('PG2[0].EmploymentType[0]', str(a, 'job.occupation'));
    put('PG2[0].NameOfEmployer[0]', str(a, 'job.employer1'));
  }
  if (employment === 'self') put('PG2[0].SelfEmploymentType[0]', str(a, 'job.selfOccupation'));
  if (employment === 'other') put('PG2[0].OtherEmployment[0]', str(a, 'job.other'));

  // Items 13-17.
  put('P3[0].P3_Line13[0]', digits(str(a, 'hh.previouslySponsored')));
  put('P3[0].P3_Line14[0]', digits(str(a, 'dependentsCount')));
  for (let i = 1; i <= chain(a, 'dependent', 9, a['dependent.more0'] === 'yes'); i++) {
    const row = `P3[0].#subform[0].Pt2_Line15_Row${i}_`;
    put(`${row}FullName[0]`, str(a, `dependent${i}.name`));
    put(`${row}DateOfBirth[0]`, str(a, `dependent${i}.dob`));
    put(`${row}Relationship[0]`, str(a, `dependent${i}.relationship`));
    const n = digits(str(a, `dependent${i}.aNumber`));
    if (n) put(`P3[0].#subform[0].P2_Line15_Row${i}_ANumber[0]`, n.padStart(9, '0'));
    put(`${row}Receipt[0]`, str(a, `dependent${i}.receipt`).replace(/[^A-Za-z0-9]/g, '').toUpperCase());
  }
  if (str(a, 'income.mine')) put('P3[0].Pt3Line116_Annual[0]', dollars(amount(a, 'income.mine')));
  const assets = ASSETS.filter((x) => amount(a, x.id) > 0);
  assets.slice(0, 6).forEach((x, i) => {
    const r = i + 1;
    select[`P3[0].Pt3Line${r}Cell${r}_TypeofAssetDropDownList[0]`] = x.type;
    put(`P3[0].Pt3Line${r}Cell${r}_Amount[0]`, dollars(amount(a, x.id)));
  });
  if (assets.length > 6) notes.push({ page: '3', part: '2', item: '17', text: assets.slice(6).map((x) => `${x.type}: $${dollars(amount(a, x.id))}`).join('; ') });
  if (assets.length) put('P3[0].Pt3Line9Cell9_Total[0]', dollars(assets.reduce((n, x) => n + amount(a, x.id), 0)));

  // Items 18-19 and Part 3: only when filing for someone else.
  let contributions = '';
  if (other) {
    yn('P8[0].Pt2_Line18_CB', a.contributions);
    if (a.contributions === 'yes') contributions = str(a, 'contributions.describe');

    name('ben', ['P8[0].Pt3Line1_FamilyName[0]', 'P8[0].Pt3Line1_GivenName[0]', 'P8[0].Pt3Line1_MiddleName[0]']);
    for (let i = 1; i <= chain(a, 'benOtherName', 2, a['benOtherName.more0'] === 'yes'); i++)
      name(`benOtherName${i}`, [`P8[0].P1_Line3_FamilyName${i}[0]`, `P8[0].P1_Line3_GivenName${i}[0]`, `P8[0].P1_Line3_MiddleName${i}[0]`]);
    put('P8[0].#area[0].P2_Line8_DateOfBirth[0]', str(a, 'ben.dob'));
    if (a['ben.sex'] === 'male') checkValue.push(['P8[0].Pt3_Line4_Sex_CB', 'M']);
    if (a['ben.sex'] === 'female') checkValue.push(['P8[0].Pt3_Line4_Sex_CB', 'F']);
    const benA = digits(str(a, 'ben.aNumber'));
    if (benA) put('P8[0].Pt3Line5_AlienNumber[0]', benA.padStart(9, '0'));
    put('P8[0].Part2_Item6_City[0]', str(a, 'ben.birthCity'));
    put('P8[0].Part2_Item6_Province[0]', str(a, 'ben.birthState'));
    put('P8[0].Part2_Item6_Country[0]', str(a, 'ben.birthCountry'));
    put('P8[0].P2_Line8_Country[0]', str(a, 'ben.citizenship'));
    if (MARITAL[str(a, 'ben.marital')]) checkValue.push(['P4[0].Pt3_Line8_MaritalStatus', MARITAL[str(a, 'ben.marital')]]);
    if (a['ben.marital'] === 'other') put('P4[0].Pt3_Line8_MaritalStatusOther[0]', str(a, 'ben.marital.other'));
    address('ben.mailing', BEN_MAILING);
    yn('P4[0].Pt3_Line10_CB', a['ben.mailingSame']);
    if (a['ben.mailingSame'] === 'no') address('ben.home', BEN_PHYSICAL);
    put('P4[0].Pt3_Line12_DateFrom[0]', str(a, 'stay.from'));
    if (a['stay.end'] === 'date') {
      check.push('P4[0].Pt2Line12_Date[0]');
      put('P4[0].Pt3_Line12_DateTo[0]', str(a, 'stay.to'));
    }
    if (a['stay.end'] === 'none') check.push('P4[0].Pt2Line12_NoDate[0]');
  }

  // Part 4 (the beneficiary filing for themselves) or Part 5. Signatures and dates stay empty.
  if (self) {
    if (a.readsEnglish === 'A') check.push('P5[0].Pt4Line1a_Checkboxa[0]');
    if (a.readsEnglish === 'B') {
      check.push('P5[0].Pt4Line1b_Checkboxb[0]');
      put('P5[0].Pt4Line1b_language[0]', str(a, 'fluentLanguage'));
    }
    if (a.preparer === 'yes') {
      check.push('P5[0].Part4_Line2_ReqServCheckbox[0]');
      put('P5[0].Pt4Line2_RepresentativeName[0]', str(a, 'preparer.name'));
    }
  } else if (other) {
    if (a.readsEnglish === 'A' || a.readsEnglish === 'B') checkValue.push(['P9[0].Pt5_Line1_CB', str(a, 'readsEnglish')]);
    if (a.readsEnglish === 'B') put('P9[0].Pt5_Line1b_language[0]', str(a, 'fluentLanguage'));
    if (a.preparer === 'yes') {
      check.push('P9[0].Part4_Line2_ReqServCheckbox[0]');
      put('P9[0].Pt5_Line2_RepresentativeName[0]', str(a, 'preparer.name'));
    }
  }
  if (self || other) {
    const p = self ? 'P5[0].' : 'P9[0].';
    put(`${p}Part4_Line3_DaytimePhoneNumber3[0]`, digits(str(a, 'phone')));
    put(`${p}Part4_Line4_SafePhoneNumber3[0]`, digits(str(a, 'mobile')));
    put(`${p}Part4_Line5_EmailAddress[0]`, str(a, 'email'));
  }

  return { text, check, checkValue, select, contributions, notes: notes.filter((n) => n.text) };
}

const LONG_SIZE = 9;

/** Fills the official I-134 PDF with the answers and returns the new file's bytes. */
export async function fillI134(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const index = i134Index(form);
  const plan = planI134(a);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const get = (name: string) => {
    const f = index.get(name);
    if (!f) throw new Error(`No such field: ${name}`);
    return f;
  };
  const textField = (name: string) => {
    const f = get(name);
    if (!(f instanceof PDFTextField)) throw new Error(`Not a text field: ${name}`);
    return f;
  };

  // Some text boxes are rich-text fields, which pdf-lib can't read back when it redraws the form;
  // store them as plain text instead.
  for (const f of form.getFields()) if (f instanceof PDFTextField && f.isRichFormatted()) f.disableRichFormatting();

  for (const [name, raw] of Object.entries(plan.text)) setFieldText(textField(name), raw, 9);
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
    // The dropdowns auto-size, which draws the asset types far larger than the table's text.
    try {
      field.setFontSize(9);
    } catch {
      field.acroField.setDefaultAppearance('/Helv 9 Tf 0 g');
    }
  }

  // Long text is broken into lines here: pdf-lib's own wrapping is very slow on long text.
  const lines = (field: PDFTextField, s: string, size: number) => wrap(toFormText(s), font, size, field.acroField.getWidgets()[0].getRectangle().width - 8);
  const setLong = (field: PDFTextField, s: string, size: number) => {
    field.enableMultiline();
    setFieldText(field, lines(field, s, size).join('\n'), size);
  };

  // Item 19 stays in its box when it fits; otherwise it continues in Part 8.
  const notes = [...plan.notes];
  if (plan.contributions) {
    const box = textField(CONTRIBUTIONS_FIELD);
    const { height } = box.acroField.getWidgets()[0].getRectangle();
    if (lines(box, plan.contributions, LONG_SIZE).length * LONG_SIZE * 1.2 <= height - 4) setLong(box, plan.contributions, LONG_SIZE);
    else {
      setLong(box, 'See Part 8. Additional Information, Part 2, Item 19.', LONG_SIZE);
      notes.unshift({ page: '4', part: '2', item: '19', text: plan.contributions });
    }
  }
  notes.slice(0, NOTE_ROWS.length).forEach((n, i) => {
    const [page, part, item, info] = NOTE_ROWS[i];
    setFieldText(textField(page), n.page, 9);
    setFieldText(textField(part), n.part, 9);
    setFieldText(textField(item), n.item, 9);
    setLong(textField(info), n.text, 8);
  });

  doc.setTitle('Form I-134, Declaration of Financial Support');
  return doc.save();
}
