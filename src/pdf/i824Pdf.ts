import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField, StandardFonts } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { parseUnit } from '../engine/validation';
import { fieldIndex, optionBoxes, selectOption, setFieldText, toFormText, wrap } from './common';

// Fields of USCIS Form I-824, edition 04/01/24 (public/forms/i-824.pdf), named by the last
// segment of their full name. Mapped by position:
// - Part 1, Item 1 is two separate boxes, "Checkbox1_applicant[0]" and "Checkbox1_petitioner[0]",
//   both exporting "1". Part 2's five requests are one group "P2_Request[0-4]" exporting 1a-1e;
//   the consulate under 1.b is "Lineb1_ConsulateorPOE[0]", the one under 1.c "Line1c_ConsulateorPOE[0]".
// - Part 1, Item 13.c's unit boxes are "Line13c_Unit" (no "Part1_" prefix).
// - Part 3's dependent phones carry other items' names: Item 11 is
//   "Part3_Line5i_DependentDaytimeTelephoneNumber3[0]" and Item 25 is
//   "Part3_Line25_InterpretersDaytimeTelephoneNumber3[0]". Item 33 (foreign address) has no State/ZIP.
// - Part 4, Item 2 (mobile) is "Part4_Line5_ApplicantMobilePhoneNumber[0]".
// - Part 7's name and A-Number are "Part1_Line2a_FamilyName[1]"… and "Part1_Line6_AlienNumber[1]".

export interface I824Plan {
  text: Record<string, string>;
  check: string[];
  checkValue: [string, string][];
  select: Record<string, string>;
  /** Part 7 entries, in order; the filler wraps them and carries long ones into the next box. */
  notes: { page: string; part: string; item: string; text: string }[];
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');

const STATUS: Record<string, string> = { usc: 'N/A', lpr: 'Lawful Permanent Resident' };
const RELATIONSHIP: Record<string, string> = { spouse: 'Spouse', child: 'Child' };

/** Part 3's four dependent blocks: name, date of birth, birth country, citizenship, relationship, email, phone. */
const DEPENDENTS = [
  ['Part3_Line5a_FamilyName', 'Part3_Line5b_GivenName', 'Part3_Line5c_MiddleName', 'Part3_Line6_DateofBirth', 'Part3_Line7_CountryofBirth', 'Part3_Line8_CountryOfCitizenship', 'Part3_Line9_Relationship', 'Part3_Line10_DependentEmailAddress', 'Part3_Line5i_DependentDaytimeTelephoneNumber3'],
  ['Part3_Line12a_FamilyName', 'Part3_Line12b_GivenName', 'Part3_Line12c_MiddleName', 'Part3_Line13_DateofBirth', 'Part3_Line14_CountryofBirth', 'Part3_Line15_Citizenship', 'Part3_Line16_Relationship', 'Part3_Line17_EmailAddress', 'Part3_Line18_DependentDaytimeTelephoneNumber3'],
  ['Part3_Line19a_FamilyName', 'Part3_Line19b_GivenName', 'Part3_Line19c_MiddleName', 'Part3_Line20_DateofBirth', 'Part3_Line21_Country', 'Part3_Line22_Citizenship', 'Part3_Line23_Relationship', 'Part3_Line24_EmailAddress', 'Part3_Line25_InterpretersDaytimeTelephoneNumber3'],
  ['Part3_Line26a_FamilyName', 'Part3_Line26b_GivenName', 'Part3_Line26c_MiddleName', 'Part3_Line27_DateofBirth', 'Part3_Line28_CountryOfBirth', 'Part3_Line29_Citizenship', 'Part3_Line30_Relationship', 'Part3_Line31_EmailAddress', 'Part3_Line32_DependentDaytimeTelephoneNumber3'],
].map((names) => names.map((n) => `${n}[0]`));

interface AddressFields {
  careOf?: string;
  street: string;
  /** The unit boxes' base, before "Unit" and "AptSteFlrNumber". */
  unit: string;
  city: string;
  state?: string;
  zip?: string;
  province: string;
  postal: string;
  country: string;
}

/** Addresses whose fields share one prefix ("Pt3Line3_StreetNumberName[0]"…). */
const named = (line: string, careOf = false): AddressFields => ({
  careOf: careOf ? `${line}InCareOfName[0]` : undefined,
  street: `${line}StreetNumberName[0]`,
  unit: line,
  city: `${line}CityOrTown[0]`,
  state: `${line}State[0]`,
  zip: `${line}ZipCode[0]`,
  province: `${line}Province[0]`,
  postal: `${line}PostalCode[0]`,
  country: `${line}Country[0]`,
});

const chain = (a: Answers, id: string, max: number, first: boolean) => {
  if (!first) return 0;
  let n = 1;
  while (n < max && a[`${id}.more${n}`] === 'yes') n++;
  return n;
};

export function planI824(a: Answers): I824Plan {
  const text: Record<string, string> = {};
  const check: string[] = [];
  const checkValue: [string, string][] = [];
  const select: Record<string, string> = {};
  const notes: I824Plan['notes'] = [];
  const put = (field: string, value: string) => {
    if (value) text[field] = value;
  };
  const name = (prefix: string, [family, given, middle]: string[]) => {
    put(family, str(a, `${prefix}.family`));
    put(given, str(a, `${prefix}.given`));
    put(middle, str(a, `${prefix}.middle`));
  };
  /** An address by the answers' prefix and the PDF's field names. */
  const address = (prefix: string, f: AddressFields) => {
    if (f.careOf) put(f.careOf, str(a, `${prefix}.careOf`));
    put(f.street, str(a, `${prefix}.street`));
    const u = parseUnit(str(a, `${prefix}.unit`));
    if (u) {
      checkValue.push([`${f.unit}Unit`, u.kind]);
      put(`${f.unit}AptSteFlrNumber[0]`, u.number);
    }
    put(f.city, str(a, `${prefix}.city`));
    const st = str(a, `${prefix}.state`).toUpperCase();
    if (f.state && st) select[f.state] = st;
    if (f.zip) put(f.zip, str(a, `${prefix}.zip`));
    put(f.province, str(a, `${prefix}.province`));
    put(f.postal, str(a, `${prefix}.postal`));
    put(f.country, str(a, `${prefix}.country`));
  };

  // Part 1. The name and A-Number repeat at the top of Part 7.
  if (a.filerRole === 'applicant') check.push('Checkbox1_applicant[0]');
  if (a.filerRole === 'petitioner') check.push('Checkbox1_petitioner[0]');
  for (const i of [0, 1]) name('name', [`Part1_Line2a_FamilyName[${i}]`, `Part1_Line2b_GivenName[${i}]`, `Part1_Line2c_MiddleName[${i}]`]);
  put('Part1_Line4_CurrentOrRecentImmigrationStatus[0]', STATUS[str(a, 'filerStatus')] ?? (a.filerStatus === 'other' ? str(a, 'filerStatus.other') : ''));
  put('Part1_Line5_CertificateOfNatzorCitzNumber[0]', str(a, 'certificate'));
  const aNumber = digits(str(a, 'aNumber'));
  if (aNumber) for (const i of [0, 1]) put(`Part1_Line6_AlienNumber[${i}]`, aNumber.padStart(9, '0'));
  put('Part1_Line7_DateofBirth[0]', str(a, 'dob'));
  put('Part1_Line8_CountryofBirth[0]', str(a, 'birthCountry'));
  put('Part1_Line9_CountryofCitizenship[0]', str(a, 'citizenship'));
  put('Part1_Line11_SSN[0]', digits(str(a, 'ssn')));
  put('Part1_Line12_AcctIdentifier[0]', digits(str(a, 'uscisAccount')));
  address('mailing', {
    careOf: 'Part1_Line13a_InCareOfName[0]',
    street: 'Part1_Line13b_StreetNumberName[0]',
    unit: 'Line13c_',
    city: 'Part1_Line13d_CityOrTown[0]',
    state: 'Part1_Line13e_State[0]',
    zip: 'Part1_Line13f_ZipCode[0]',
    province: 'Part1_Line13g_Province[0]',
    postal: 'Part1_Line13h_PostalCode[0]',
    country: 'Part1_Line13i_Country[0]',
  });
  // The form has no "same address" box: the physical address repeats the mailing one.
  address(a.mailingSame === 'no' ? 'home' : 'mailing', named('Part1_Line14_'));

  // Part 2.
  const request = str(a, 'request');
  if (['1a', '1b', '1c', '1d', '1e'].includes(request)) checkValue.push(['P2_Request', request]);
  if (request === '1b') put('Lineb1_ConsulateorPOE[0]', str(a, 'consulate'));
  if (request === '1c') put('Line1c_ConsulateorPOE[0]', str(a, 'consulate'));

  // Part 3, Item 1: the approved case.
  put('Part3_Line1a_FormNumber[0]', str(a, 'original.form').toUpperCase());
  put('Part3_Line1b_ReceiptNumber[0]', str(a, 'original.receipt').replace(/[^A-Za-z0-9]/g, '').toUpperCase());
  put('Part3_Line1c_Date[0]', str(a, 'original.filed'));
  put('Part3_Line1d_Date[0]', str(a, 'original.approved'));

  // Part 3, Items 2-4: the principal beneficiary, when it is someone else.
  if (a.filerRole === 'petitioner') {
    name('beneficiary', ['Part3_Line2a_FamilyName[0]', 'Part3_Line2b_GivenName[0]', 'Part3_Line2c_MiddleName[0]']);
    put('Part3_Line2d_DateofBirth[0]', str(a, 'beneficiary.dob'));
    put('Part3_Line2e_CountryofBirth[0]', str(a, 'beneficiary.birthCountry'));
    const bNumber = digits(str(a, 'beneficiary.aNumber'));
    if (bNumber) put('Part3_Line2f_AlienNumber[0]', bNumber.padStart(9, '0'));
    put('Part3_Line2g_DaytimeTelephoneNumber3[0]', digits(str(a, 'beneficiary.phone')));
    address('beneficiary.mailing', named('Pt3Line3_', true));
    address(a['beneficiary.mailingSame'] === 'no' ? 'beneficiary.home' : 'beneficiary.mailing', named('Pt3Line4_'));
  }

  // Part 3, Items 5-34: dependents following to join, only for request 1.c.
  if (request === '1c') {
    const count = chain(a, 'dependent', 4, true);
    for (let i = 1; i <= count; i++) {
      const [family, given, middle, dob, birth, citizenship, relationship, email, phone] = DEPENDENTS[i - 1];
      const p = `dependent${i}`;
      name(p, [family, given, middle]);
      put(dob, str(a, `${p}.dob`));
      put(birth, str(a, `${p}.birthCountry`));
      put(citizenship, str(a, `${p}.citizenship`));
      put(relationship, RELATIONSHIP[str(a, `${p}.relationship`)] ?? '');
      put(email, str(a, `${p}.email`));
      put(phone, digits(str(a, `${p}.phone`)));
    }
    if (count === 4 && a['dependent.more4'] === 'yes') notes.push({ page: '3', part: '3', item: '5-11', text: `Additional dependents: ${str(a, 'dependents.extra')}` });
    address('dependents.address', { ...named('Pt3Line33_', true), state: undefined, zip: undefined });
    put('Part3_Line34_ForeignNumber[0]', digits(str(a, 'dependents.phone')));
  }

  // Part 4. The signature and its date stay empty: they are written by hand.
  put('Part4_Line1_ApplicantDaytimePhoneNumber[0]', digits(str(a, 'phone')));
  put('Part4_Line5_ApplicantMobilePhoneNumber[0]', digits(str(a, 'mobile')));
  put('Part4_Line3_ApplicantEmailAddress[0]', str(a, 'email'));

  // Part 7: the optional explanation goes about the request (Part 2, Item 1).
  const additional = str(a, 'additional.text');
  if (additional) notes.push({ page: '2', part: '2', item: '1', text: additional });

  return { text, check, checkValue, select, notes: notes.filter((n) => n.text) };
}

/** Part 7's five boxes, in reading order. */
const NOTE_LINES = [3, 4, 5, 6, 7];
const NOTE_SIZE = 8;

/** Fills the official I-824 PDF with the answers and returns the new file's bytes. */
export async function fillI824(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const index = fieldIndex(form);
  const plan = planI824(a);
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

  // Part 7. Long text is broken into lines here (pdf-lib's own wrapping is very slow) and a note
  // that doesn't fit its box carries on in the next one, with the same page, part and item.
  let slot = 0;
  for (const note of plan.notes) {
    const first = textField(`Part7_Line${NOTE_LINES[0]}d_AdditionalInfo[0]`);
    const { width, height } = first.acroField.getWidgets()[0].getRectangle();
    const perBox = Math.floor((height - 4) / (NOTE_SIZE * 1.2));
    const lines = wrap(toFormText(note.text), font, NOTE_SIZE, width - 8);
    for (let start = 0; start < lines.length && slot < NOTE_LINES.length; start += perBox, slot++) {
      const line = `Part7_Line${NOTE_LINES[slot]}`;
      setFieldText(textField(`${line}a_PageNumber[0]`), note.page, 9);
      setFieldText(textField(`${line}b_PartNumber[0]`), note.part, 9);
      setFieldText(textField(`${line}c_ItemNumber[0]`), note.item, 9);
      const box = textField(`${line}d_AdditionalInfo[0]`);
      box.enableMultiline();
      setFieldText(box, lines.slice(start, start + perBox).join('\n'), NOTE_SIZE);
    }
  }

  doc.setTitle('Form I-824, Application for Action on an Approved Application or Petition');
  return doc.save();
}
