import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField, StandardFonts } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { parseUnit } from '../engine/validation';
import { fieldIndex, optionBoxes, selectOption, setFieldText, toFormText, wrap } from './common';

// Fields of USCIS Form N-565, edition 02/27/25 (public/forms/n-565.pdf), named by the last segment
// of their full name. Many names don't match the printed items, so these were mapped by position:
// - Part 1: Item 3 is "_CountryOfBirth", Item 4 "Line3_CountryOfCitizenship", Item 5
//   "P1Line4_CertificateNumber", Item 6 "ANum[0]" and Item 7 "P1Line6_*". Part 12 repeats the name
//   as "P1Line1_*[1]" and the A-Number as "ANum[1]".
// - Part 2: Item 1 is "P2_Line1_FamilyName" / "Line1_GivenName" / "Line1_MiddleName"; Item 4
//   (marital status) is "Part2_Item5" and Item 5 (lost citizenship) "Part2_Item6".
// - Part 3, Items 2.b-2.g are "Pt3CheckBox3", "4", "5" (that one is 2.d), "6" (2.e), "7" (2.f) and
//   "8a" (2.g); 2.g's explanation is "Pt3Line8b_Explanation".
// - Part 4, Item 1's boxes carry marital-status exports: "Pt4_Item1_Name" exports Single,
//   "Pt4_Item1_DOB" Married, "Pt4_Item1_Gender" (Sex) Widowed and "Pt4_Item1_Other" Divorced.
// - Part 9, Items 1-3 are "Pt9Line3_*", "Pt9Line4_*" and "Pt9Line5_Email".

export interface N565Plan {
  text: Record<string, string>;
  check: string[];
  checkValue: [string, string][];
  select: Record<string, string>;
  /** Long answers that stay in their box when they fit, or else move to Part 12. */
  long: { field: string; text: string; page: string; part: string; item: string }[];
  /** Part 12 entries, in order. */
  notes: { page: string; part: string; item: string; text: string }[];
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');
const list = (a: Answers, id: string) => (Array.isArray(a[id]) ? (a[id] as string[]) : []);

const chain = (a: Answers, id: string, max: number, first: boolean) => {
  if (!first) return 0;
  let n = 1;
  while (n < max && a[`${id}.more${n}`] === 'yes') n++;
  return n;
};

/** Part 3, Items 2.a-2.g, by position. */
const REASON_BOX: Record<string, string> = {
  lost: 'Pt3CheckBox2a[0]',
  mutilated: 'Pt3CheckBox3[0]',
  error: 'Pt3CheckBox4[0]',
  name: 'Pt3CheckBox5[0]',
  dob: 'Pt3CheckBox6[0]',
  sex: 'Pt3CheckBox7[0]',
  other: 'Pt3CheckBox8a[0]',
};

/** Part 4, Item 1, by position. */
const ERROR_BOX: Record<string, string> = { name: 'Pt4_Item1_Name[0]', dob: 'Pt4_Item1_DOB[0]', sex: 'Pt4_Item1_Gender[0]', other: 'Pt4_Item1_Other[0]' };

const MARITAL: Record<string, string> = { single: 'Single', married: 'Married', divorced: 'Divorced', widowed: 'Widowed', annulled: 'MarriageAnn' };

export function planN565(a: Answers): N565Plan {
  const text: Record<string, string> = {};
  const check: string[] = [];
  const checkValue: [string, string][] = [];
  const select: Record<string, string> = {};
  const long: N565Plan['long'] = [];
  const notes: N565Plan['notes'] = [];
  const put = (field: string, value: string) => {
    if (value) text[field] = value;
  };
  const name = (prefix: string, [family, given, middle]: string[]) => {
    put(family, str(a, `${prefix}.family`));
    put(given, str(a, `${prefix}.given`));
    put(middle, str(a, `${prefix}.middle`));
  };
  const address = (prefix: string, f: { street: string; unit: string; number: string; city: string; state: string; zip: string; province: string; postal: string; country: string }) => {
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

  // Part 1: the name as printed on the certificate (the current name when it's the same).
  name(a.certNameSame === 'no' ? 'certName' : 'name', ['P1Line1_FamilyName[0]', 'P1Line1_GivenName[0]', 'P1Line1_MiddleName[0]']);
  put('Pt1Line2_DateofBirthonCert[0]', str(a, 'dob'));
  put('_CountryOfBirth[0]', str(a, 'birthCountry'));
  put('Line3_CountryOfCitizenship[0]', str(a, 'priorCitizenship'));
  put('P1Line4_CertificateNumber[0]', str(a, 'certNumber'));
  const aNumber = digits(str(a, 'aNumber'));
  if (aNumber) for (const i of [0, 1]) put(`ANum[${i}]`, aNumber.padStart(9, '0'));
  put('P1Line6_USCISOfficeorNameofCourt[0]', str(a, 'cert.office'));
  put('P1Line6_DateOfDeclaration[0]', str(a, 'cert.date'));

  // Part 2. The current name repeats at the top of Part 12.
  name('name', ['P2_Line1_FamilyName[0]', 'Line1_GivenName[0]', 'Line1_MiddleName[0]']);
  name('name', ['P1Line1_FamilyName[1]', 'P1Line1_GivenName[1]', 'P1Line1_MiddleName[1]']);
  const otherNames = chain(a, 'otherName', 2, a['otherName.more0'] === 'yes');
  for (let i = 1; i <= otherNames; i++) {
    const n = i === 1 ? '' : '2';
    name(`otherName${i}`, [`P2Line2_FamilyName${n}[0]`, `P2Line2_GivenName${n}[0]`, `P2Line2_MiddleName${n}[0]`]);
  }
  put('P2Line3_InCareofName[0]', str(a, 'mailing.careOf'));
  address('mailing', {
    street: 'P2Line3_StreetNumberName[0]',
    unit: 'P2Line3_Unit',
    number: 'P2Line3_AptSteFlrNumber[0]',
    city: 'Pt2Line3_CityTown[0]',
    state: 'P2Line3_State[0]',
    zip: 'P2Line3_ZipCode[0]',
    province: 'P2Line3_Province[0]',
    postal: 'P2Line3_PostalCode[0]',
    country: 'P2Line3_Country[0]',
  });
  if (MARITAL[str(a, 'marital')]) checkValue.push(['Part2_Item5', MARITAL[str(a, 'marital')]]);
  if (a.lostCitizenship === 'yes') {
    checkValue.push(['Part2_Item6', 'Yes']);
    notes.push({ page: '2', part: '2', item: '5', text: str(a, 'lostCitizenship.explain') });
  }
  if (a.lostCitizenship === 'no') checkValue.push(['Part2_Item6', 'No']);

  // Part 3.
  const docType = str(a, 'docType');
  if (['NC', 'NN', 'NR', 'NDI', 'SCN'].includes(docType)) checkValue.push(['Part3_Item1', docType]);
  const reasons = docType && docType !== 'SCN' ? list(a, 'reasons').filter((r) => REASON_BOX[r]) : [];
  for (const r of reasons) check.push(REASON_BOX[r]);
  if (reasons.includes('lost') && str(a, 'lost.explain')) long.push({ field: 'Pt3Line2b_Explanation[0]', text: str(a, 'lost.explain'), page: '2', part: '3', item: '2.a(1)' });
  if (reasons.includes('other') && str(a, 'other.explain')) long.push({ field: 'Pt3Line8b_Explanation[0]', text: str(a, 'other.explain'), page: '3', part: '3', item: '2.g(1)' });

  // Part 4.
  if (reasons.includes('error')) {
    for (const e of list(a, 'errorItems')) if (ERROR_BOX[e]) check.push(ERROR_BOX[e]);
    if (str(a, 'error.explain')) long.push({ field: 'Pt4_AdditionalInfo[0]', text: str(a, 'error.explain'), page: '3', part: '4', item: '2' });
  }

  // Part 5.
  if (reasons.includes('name')) {
    if (a.nameChangeBy === 'A') {
      check.push('Pt5CheckBoxA[0]');
      put('Pt5LineA_DateChanged[0]', str(a, 'nameChange.date'));
    }
    if (a.nameChangeBy === 'B') {
      check.push('Pt5CheckBoxB[0]');
      put('Pt5LineB_DateChanged[0]', str(a, 'nameChange.date'));
    }
  }

  // Part 6.
  if (reasons.includes('dob')) {
    const by = list(a, 'dobChangeBy');
    if (by.includes('A')) {
      check.push('Pt6CheckBox1A[0]');
      put('Pt6Line1A_DateChanged[0]', str(a, 'dobChange.courtDate'));
    }
    if (by.includes('B')) {
      check.push('Pt6CheckBox1B[0]');
      put('Pt6Line1B_DateChanged[0]', str(a, 'dobChange.govDate'));
    }
    put('Line6_DateOfBirth[0]', str(a, 'newDob'));
  }

  // Part 7.
  if (reasons.includes('sex')) {
    if (a.sex === 'male') checkValue.push(['P7Line1_sex', 'M']);
    if (a.sex === 'female') checkValue.push(['P7Line1_sex', 'F']);
  }

  // Part 8. Item 4 is completed by USCIS or a consul after approval.
  if (docType === 'SCN') {
    put('Pt8Line1_NameOfForeignCountry[0]', str(a, 'foreign.country'));
    name('official', ['Pt8Line2_FamilyName[0]', 'Pt8Line2_GivenName[0]', 'Pt8Line2_MiddleName[0]']);
    put('Pt8_Line2_OfficialTitle[0]', str(a, 'official.title'));
    put('Pt8_Line2_GovAgencyName[0]', str(a, 'official.agency'));
    address('official.address', {
      street: 'Pt8Line3a_StreetNumberName[0]',
      unit: 'Pt8Line3_Unit',
      number: 'Pt8Line3_AptSteFlrNumber[0]',
      city: 'Pt8Line3_CityTown[0]',
      state: 'Pt8Line3_State[0]',
      zip: 'Pt8Line3_ZipCode[0]',
      province: 'Pt8Line3_Province[0]',
      postal: 'Pt8Line3_PostalCode[0]',
      country: 'Pt8Line3_Country[0]',
    });
  }

  // Part 9. The signature (Item 4) and its date stay empty: they are written by hand.
  put('Pt9Line3_DaytimeTelephoneNumber3[0]', digits(str(a, 'phone')));
  put('Pt9Line4_MobileTelephoneNumber3[0]', digits(str(a, 'mobile')));
  put('Pt9Line5_Email[0]', str(a, 'email'));

  return { text, check, checkValue, select, long, notes: notes.filter((n) => n.text) };
}

const LONG_SIZE = 9;

/** Fills the official N-565 PDF with the answers and returns the new file's bytes. */
export async function fillN565(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const index = fieldIndex(form);
  const plan = planN565(a);
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
  }

  // Long text is broken into lines here: pdf-lib's own wrapping is very slow on long text.
  const lines = (field: PDFTextField, s: string, size: number) => wrap(toFormText(s), font, size, field.acroField.getWidgets()[0].getRectangle().width - 8);
  const setLong = (field: PDFTextField, s: string, size: number) => {
    field.enableMultiline();
    setFieldText(field, lines(field, s, size).join('\n'), size);
  };

  // Explanations stay in their box when they fit; otherwise they continue in Part 12.
  const notes = [...plan.notes];
  for (const l of [...plan.long].reverse()) {
    const box = textField(l.field);
    const { height } = box.acroField.getWidgets()[0].getRectangle();
    const wrapped = lines(box, l.text, LONG_SIZE);
    const max = box.getMaxLength();
    const fits = wrapped.length * LONG_SIZE * 1.2 <= height - 4 && (max === undefined || wrapped.join('\n').length <= max);
    if (fits) setLong(box, l.text, LONG_SIZE);
    else {
      setLong(box, `See Part 12. Additional Information, Part ${l.part}, Item ${l.item}.`, LONG_SIZE);
      notes.unshift({ page: l.page, part: l.part, item: l.item, text: l.text });
    }
  }
  notes.slice(0, 4).forEach((n, i) => {
    const line = `P12_Line${i + 3}`;
    setFieldText(textField(`${line}a_PageNumber[0]`), n.page, 9);
    setFieldText(textField(`${line}b_PartNumber[0]`), n.part, 9);
    setFieldText(textField(`${line}c_ItemNumber[0]`), n.item, 9);
    setLong(textField(`${line}d_AdditionalInfo[0]`), n.text, 8);
  });

  doc.setTitle('Form N-565, Application for Replacement Naturalization/Citizenship Document');
  return doc.save();
}
