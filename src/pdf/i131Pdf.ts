import { PDFCheckBox, PDFDocument, PDFDropdown, type PDFField, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { AP_BASES, REFUGEE_ITEMS } from '../forms/i131';
import { parseUnit } from '../engine/validation';
import { fieldsBySegment, selectOption, setFieldText } from './common';

export { fieldsBySegment };

// Fields of USCIS Form I-131, edition 01/20/25 (public/forms/i-131.pdf), named by the last segment
// of their full name and placed by where they sit on the printed page. Unlike the other forms, the
// same last segment repeats across pages: every application-type box is a "CB_AppType[n]" on its
// own page (told apart by export value, 1-37), and the name and A-Number repeat at the top of
// Part 13. The plan names each field once; the filler fills every field that shares the name.

export interface I131Plan {
  text: Record<string, string>;
  check: string[];
  /** [base, export value]: the box among `base[0]`, `base[1]`… (on any page) that sets this value. */
  checkValue: [string, string][];
  select: Record<string, string>;
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');

const address = (p: string) => ({
  careOf: `${p}_InCareofName[0]`,
  street: `${p}_StreetNumberName[0]`,
  unit: `${p}_Unit`,
  number: `${p}_AptSteFlrNumber[0]`,
  city: `${p}_CityTown[0]`,
  state: `${p}_State[0]`,
  zip: `${p}_ZipCode[0]`,
  province: `${p}_Province[0]`,
  postal: `${p}_PostalCode[0]`,
  country: `${p}_Country[0]`,
});

/** The text field under each advance parole basis (Part 1, Item 5), by the basis's letter. */
const AP_FIELDS: Record<string, string> = Object.fromEntries('ABCEFGHIJKLM'.split('').map((l) => [l, `P1_Line5${l}[0]`]));

/** The I-485 biographic codes the questions use, translated to this form's export values. */
const RACE: Record<string, string> = { WH: 'P3_Line2_Race_White[0]', AS: 'P3_Line2_Race_Asian[0]', BL: 'P3_Line2_Race_Black[0]', AI: 'P3_Line2_Race_American[0]', HW: 'P3_Line2_Race_Hawaiian[0]' };
const EYES: Record<string, string> = { BN: 'BRN', BL: 'BLK', HA: 'HZL', GN: 'GRN', BU: 'BLU', GR: 'GRY', MA: 'MRN', PN: 'PNK', UN: 'OTH' };
const HAIR: Record<string, string> = { BL: 'BLK', BR: 'BRN', BN: 'BND', GR: 'GRY', WH: 'WHT', RD: 'RED', SA: 'SDY', NH: 'BLD', OT: 'OTH' };

export function planI131(a: Answers): I131Plan {
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
    put(f.careOf, str(a, `${prefix}.careOf`));
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
  const appType = str(a, 'appType');
  const reentryOrRefugee = ['1', '2', '3'].includes(appType);

  // Part 1: application type. Advance parole checks the box of its basis (export values 5-17).
  if (['1', '2', '3', '4'].includes(appType)) checkValue.push(['CB_AppType', appType]);
  if (appType === '4') put('P1_Line4[0]', str(a, 'tps.receipt'));
  const basis = AP_BASES.find((b) => b.value === a.apBasis);
  if (appType === '5' && basis) {
    checkValue.push(['CB_AppType', basis.value]);
    const field = AP_FIELDS[basis.letter];
    if (basis.detail === 'receiptOptional') put(field, str(a, 'ap.i485Receipt'));
    if (basis.detail === 'receipt') put(field, str(a, 'ap.receipt'));
    if (basis.detail === 'coa') put(field, str(a, 'ap.coa'));
    if (basis.detail === 'explain') put(field, str(a, 'ap.explain'));
  }
  yn('P1_Line13_YesNo', a.refugeeStatus);

  // Part 2: about you. The name and A-Number repeat at the top of Part 13.
  put('Part2_Line1_FamilyName[0]', str(a, 'name.family'));
  put('Part2_Line1_GivenName[0]', str(a, 'name.given'));
  put('Part2_Line1_MiddleName[0]', str(a, 'name.middle'));
  if (a['otherName.more0'] === 'yes') {
    for (let i = 1; i <= 3; i++) {
      if (i > 1 && a[`otherName.more${i - 1}`] !== 'yes') break;
      put(`Part2_Line2_FamilyName${i}[0]`, str(a, `otherName${i}.family`));
      put(`Part2_Line2_GivenName${i}[0]`, str(a, `otherName${i}.given`));
      put(`Part2_Line2_MiddleName${i}[0]`, str(a, `otherName${i}.middle`));
    }
  }
  fillAddress('mailing', address('Part2_Line3'));
  if (a.mailingSame === 'no') fillAddress('home', address('Part2_Line4'));
  const aNumber = digits(str(a, 'aNumber'));
  if (aNumber) put('Part2_Line5_AlienNumber[0]', aNumber.padStart(9, '0'));
  put('Part2_Line6_CountryOfBirth[0]', str(a, 'birthCountry'));
  put('Part2_Line7_CountryOfCitizenshiporNationality[0]', str(a, 'citizenship'));
  if (a.sex === 'male') checkValue.push(['Part2_Line8_Gender', 'M']);
  if (a.sex === 'female') checkValue.push(['Part2_Line8_Gender', 'F']);
  put('Part2_Line9_DateOfBirth[0]', str(a, 'dob'));
  put('Part2_Line10_SSN[0]', digits(str(a, 'ssn')));
  put('Part2_Line11_USCISOnlineAcctNumber[0]', digits(str(a, 'uscisAccount')));
  if (appType === '4' || appType === '5') {
    put('Part2_Line12_ClassofAdmission[0]', str(a, 'coa').toUpperCase());
    put('Part2_Line13_I94RecordNo[0]', digits(str(a, 'i94')));
    put('Part2_Line14_I94ExpDate[0]', str(a, 'i94.until'));
  }

  // Part 3: biographic information.
  if (a.ethnicity === 'hispanic') checkValue.push(['P3_Line1_Ethnicity', 'H']);
  if (a.ethnicity === 'notHispanic') checkValue.push(['P3_Line1_Ethnicity', 'NH']);
  for (const r of Array.isArray(a.race) ? a.race : []) if (RACE[r]) check.push(RACE[r]);
  if (a.heightFeet) select['P3_Line3_HeightFeet[0]'] = str(a, 'heightFeet');
  if (a.heightInches) select['P3_Line3_HeightInches[0]'] = str(a, 'heightInches');
  const weight = digits(str(a, 'weight'));
  if (weight) {
    const w = weight.padStart(3, '0').slice(-3);
    [0, 1, 2].forEach((i) => put(`P3_Line4_Pound${i + 1}[0]`, w[i]));
  }
  if (EYES[str(a, 'eyes')]) checkValue.push(['P3_Line5_EyeColor', EYES[str(a, 'eyes')]]);
  if (HAIR[str(a, 'hair')]) checkValue.push(['P3_Line6_HairColor', HAIR[str(a, 'hair')]]);

  // Part 4: processing information.
  yn('P4_Line1_YesNo', a.proceedings);
  yn('P4_Line2a_YesNo', a.prevReentry);
  if (a.prevReentry === 'yes') {
    put('P4_Line2b_DateIssued[0]', str(a, 'prevReentry.date'));
    put('P4_Line2c_Disposition[0]', str(a, 'prevReentry.disposition'));
  }
  yn('P4_Line3a_YesNo', a.prevAP);
  if (a.prevAP === 'yes') {
    put('P4_Line3b_DateIssued[0]', str(a, 'prevAP.date'));
    put('P4_Line3c_Disposition[0]', str(a, 'prevAP.disposition'));
  }
  yn('P4_Line4_YesNo', a.replacement);
  if (a.replacement === 'yes') {
    if (str(a, 'replacementReason')) checkValue.push(['P4_Line5', str(a, 'replacementReason')]);
    if (a.replacementReason === '3' || a.replacementReason === '4') {
      for (const c of Array.isArray(a.corrections) ? a.corrections : []) check.push(`P4_Line6a_${c}[0]`);
    }
    put('P4_Line6a_Explanation[0]', str(a, 'replacement.explain'));
    put('P4_Line6b_ReceiptNumber[0]', str(a, 'replacement.receipt'));
  }
  if (reentryOrRefugee) {
    if (a.deliverTo === 'A') checkValue.push(['P4_Line7a', 'A']);
    if (a.deliverTo === 'B') {
      checkValue.push(['P4_Line7a', 'B']);
      put('P4_Line7b_CityOrTown[0]', str(a, 'pickup.city'));
      put('P4_Line7b_Country[0]', str(a, 'pickup.country'));
      if (a.notice === 'A') checkValue.push(['P4_Line8_CB', 'A']);
      if (a.notice === 'B') {
        checkValue.push(['P4_Line8_CB', 'B']);
        fillAddress('noticeAddress', address('P4_Line9a'));
        // 9.b and 9.c are named after each other's neighbor: the phone is "9b_Email".
        put('P4_Line9b_Email[0]', digits(str(a, 'noticeAddress.phone')));
        put('P4_Line9c_Email[0]', str(a, 'noticeAddress.email'));
      }
    }
  }

  // Part 5: reentry permit.
  if (appType === '1' && str(a, 'timeOutside')) check.push(`P5_Line1_${str(a, 'timeOutside')}[0]`);

  // Part 6: refugee travel document. Item 4.c has a separately named box per answer.
  const additional: { page: string; part: string; item: string; text: string }[] = [];
  if (appType === '2' || appType === '3') {
    put('P6_Line1_CountryRefugee[0]', str(a, 'rtd.country'));
    for (const item of REFUGEE_ITEMS) {
      const n = item.id.slice(4);
      if (n === '4c') {
        if (a[item.id] === 'yes') check.push('Line4c_Yes[0]');
        if (a[item.id] === 'no') check.push('Line4c_No[0]');
      } else yn(`P6_Line${n}_YesNo`, a[item.id]);
    }
    if (REFUGEE_ITEMS.some((i) => a[i.id] === 'yes')) additional.push({ page: '9', part: '6', item: '2-4.c', text: str(a, 'rtd.explain') });
    yn('P6_Line5_YesNo', a['rtd.beforeDeparture']);
    if (a['rtd.beforeDeparture'] === 'no') {
      yn('P6_Line6a_YesNo', a['rtd.outside']);
      if (a['rtd.outside'] === 'yes') {
        put('P6_Line6b_CityOrTown[0]', str(a, 'rtd.location'));
        put('P6_Line6c_Country[0]', str(a, 'rtd.countries'));
      }
    }
  }

  // Part 7: proposed travel, for advance parole.
  if (appType === '5') {
    put('P7_Line1_DateOfDeparture[0]', str(a, 'trip.departure'));
    put('P7_Line2_Purpose[0]', str(a, 'trip.purpose'));
    put('P7_Line3_ListCountries[0]', str(a, 'trip.countries'));
    if (a['trip.trips'] === 'O' || a['trip.trips'] === 'M') checkValue.push(['P7_Line4_CB', str(a, 'trip.trips')]);
    put('P7_Line5_ExpectedLengthTrip[0]', digits(str(a, 'trip.days')));
  }

  // Part 10: contact. The signature (Item 4) stays empty: it must be signed by hand.
  put('Part10_Line1_DayPhone[0]', digits(str(a, 'phone')));
  put('Part10_Line2_MobilePhone[0]', digits(str(a, 'mobile')));
  put('Part10_Line3_Email[0]', str(a, 'email'));

  // Part 13: additional information.
  additional.filter((x) => x.text).slice(0, 5).forEach((x, i) => {
    const line = `Part13_Line${i + 3}`;
    put(`${line}_PageNumber[0]`, x.page);
    put(`${line}_PartNumber[0]`, x.part);
    put(`${line}_ItemNumber[0]`, x.item);
    put(`${line}_AdditionalInfo[0]`, x.text);
  });

  return { text, check, checkValue, select };
}

/** The boxes `base[n]` on every page, with the export value each one sets. */
export function boxesOf(index: Map<string, PDFField[]>, base: string) {
  const out: { box: PDFCheckBox; value: string }[] = [];
  for (const [segment, fields] of index) {
    if (!segment.startsWith(`${base}[`) || !/^\[\d+\]$/.test(segment.slice(base.length))) continue;
    for (const f of fields) {
      if (!(f instanceof PDFCheckBox)) throw new Error(`Not a checkbox: ${segment}`);
      const on = f.acroField.getWidgets()[0].getOnValue();
      out.push({ box: f, value: on ? on.decodeText().trim() : '' });
    }
  }
  return out;
}

/** Fills the official I-131 PDF with the answers and returns the new file's bytes. */
export async function fillI131(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const fields = doc.getForm().getFields();
  const index = fieldsBySegment(fields);
  const plan = planI131(a);

  // Part 13's text boxes are rich-text fields, which pdf-lib can't read back when it redraws the
  // form; store them as plain text instead.
  for (const f of fields) if (f instanceof PDFTextField && f.isRichFormatted()) f.disableRichFormatting();
  const get = (name: string) => {
    const f = index.get(name);
    if (!f) throw new Error(`No such field: ${name}`);
    return f;
  };

  for (const [name, raw] of Object.entries(plan.text)) {
    for (const field of get(name)) {
      if (!(field instanceof PDFTextField)) throw new Error(`Not a text field: ${name}`);
      setFieldText(field, raw, 9);
    }
  }
  for (const name of plan.check) {
    for (const field of get(name)) {
      if (!(field instanceof PDFCheckBox)) throw new Error(`Not a checkbox: ${name}`);
      field.check();
    }
  }
  for (const [base, value] of plan.checkValue) {
    const matches = boxesOf(index, base).filter((o) => o.value === value);
    if (matches.length !== 1) throw new Error(`${matches.length} "${value}" boxes in ${base}`);
    matches[0].box.check();
  }
  for (const [name, value] of Object.entries(plan.select)) {
    for (const field of get(name)) {
      if (!(field instanceof PDFDropdown)) throw new Error(`Not a dropdown: ${name}`);
      selectOption(field, value);
    }
  }

  doc.setTitle('Form I-131, Application for Travel Documents, Parole Documents, and Arrival/Departure Records');
  return doc.save();
}
