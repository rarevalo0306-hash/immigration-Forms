import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField, StandardFonts } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { parseUnit } from '../engine/validation';
import { fieldIndex, optionBoxes, selectOption, setFieldText, toFormText, wrap } from './common';

// Fields of USCIS Form I-102, edition 04/01/24 (public/forms/i-102.pdf), named by the last
// segment of their full name. Mapped by position:
// - Part 1, Item 5 (U.S. mailing address) is "Pt1Line5a_InCareofName" plus "Pt1Line4b-4f_*";
//   Item 4 (other name) is "Pt1Line4a_FamilyName", "P1_L4b_FirstName" and "P1_L4c_MiddleName".
// - Part 3, Item 2.a's Yes and No boxes ("Line2a_Yes", "Line2a_No") both export "Y"; they are
//   told apart by name. Item 2.b is "Pt3Line2b_AddiitionalInfo" (sic).
// - Part 7 repeats the name and A-Number as "Pt1Line3a-3c_*[1]" and "Pt1Line1_AlienNumber[1]".
// - Items 9, 10, 13 and 18.d are dropdowns whose export values are codes ("MEXIC") and whose
//   shown text is the name ("MEXICO", "SAN YSIDRO, CA"). We select by the shown name; a value
//   the list doesn't hold is typed into the dropdown instead.

export interface I102Plan {
  text: Record<string, string>;
  check: string[];
  checkValue: [string, string][];
  /** Dropdowns: the option to choose, matched loosely against the shown names. */
  select: Record<string, string>;
  /** Text for boxes that continue in Part 7 when they don't fit. */
  long: { field: string; text: string; page: string; part: string; item: string }[];
  /** Part 7 entries, in order. */
  notes: { page: string; part: string; item: string; text: string }[];
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');

/** Compares names the way the dropdowns spell them: upper case, no accents or punctuation. */
export const loose = (s: string) =>
  toFormText(s)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();

/** Country names people may write in Spanish, to the PDF's English names. */
const COUNTRY_ALIASES: Record<string, string> = {
  'ESTADOS UNIDOS': 'UNITED STATES',
  'EE UU': 'UNITED STATES',
  EEUU: 'UNITED STATES',
  USA: 'UNITED STATES',
  'REPUBLICA DOMINICANA': 'DOMINICAN REPUBLIC',
  BRASIL: 'BRAZIL',
  ESPANA: 'SPAIN',
  ALEMANIA: 'GERMANY',
  FRANCIA: 'FRANCE',
  ITALIA: 'ITALY',
  'REINO UNIDO': 'UNITED KINGDOM',
  JAPON: 'JAPAN',
  CHINA: "CHINA, PEOPLE'S REPUBLIC OF",
  FILIPINAS: 'PHILIPPINES',
  RUSIA: 'RUSSIA',
  UCRANIA: 'UKRAINE',
  BELICE: 'BELIZE',
  'TRINIDAD Y TOBAGO': 'TRINIDAD AND TOBAGO',
  'COREA DEL SUR': 'KOREA, SOUTH',
  'COREA DEL NORTE': 'KOREA, NORTH',
  TURQUIA: 'TURKEY',
  'PAISES BAJOS': 'NETHERLANDS',
  HOLANDA: 'NETHERLANDS',
  'GUYANA FRANCESA': 'FRENCH GUIANA',
  SURINAM: 'SURINAME',
};

export const countryName = (raw: string) => {
  const key = loose(raw);
  return COUNTRY_ALIASES[key] ?? key;
};

const chain = (a: Answers, id: string, max: number, first: boolean) => {
  if (!first) return 0;
  let n = 1;
  while (n < max && a[`${id}.more${n}`] === 'yes') n++;
  return n;
};

const REASON_LETTERS = 'abcdefg';
const PORT_BOX: Record<string, string> = { land: 'Pt1Line15_LandBorder[0]', air: 'Pt1Line15_Airport[0]', sea: 'Pt1Line15_Seaport[0]' };

export function planI102(a: Answers): I102Plan {
  const text: Record<string, string> = {};
  const check: string[] = [];
  const checkValue: [string, string][] = [];
  const select: Record<string, string> = {};
  const long: I102Plan['long'] = [];
  const notes: I102Plan['notes'] = [];
  const put = (field: string, value: string) => {
    if (value) text[field] = value;
  };
  const choose = (field: string, value: string) => {
    if (value) select[field] = value;
  };
  const yesNo = (value: unknown, yes: string, no: string) => {
    if (value === 'yes') check.push(yes);
    if (value === 'no') check.push(no);
  };
  const name = (prefix: string, [family, given, middle]: string[]) => {
    put(family, str(a, `${prefix}.family`));
    put(given, str(a, `${prefix}.given`));
    put(middle, str(a, `${prefix}.middle`));
  };
  const address = (prefix: string, f: { careOf: string; street: string; unit: string; number: string; city: string; state: string; zip: string }) => {
    put(f.careOf, str(a, `${prefix}.careOf`));
    put(f.street, str(a, `${prefix}.street`));
    const u = parseUnit(str(a, `${prefix}.unit`));
    if (u) {
      checkValue.push([f.unit, u.kind]);
      put(f.number, u.number);
    }
    put(f.city, str(a, `${prefix}.city`));
    choose(f.state, str(a, `${prefix}.state`).toUpperCase());
    put(f.zip, digits(str(a, `${prefix}.zip`)).slice(0, 5));
  };

  // Part 1. The name and A-Number repeat at the top of Part 7.
  const aNumber = digits(str(a, 'aNumber'));
  if (aNumber) for (const i of [0, 1]) put(`Pt1Line1_AlienNumber[${i}]`, aNumber.padStart(9, '0'));
  put('Pt1Line2_USCISAcctNumber[0]', digits(str(a, 'uscisAccount')));
  for (const i of [0, 1]) name('name', [`Pt1Line3a_FamilyName[${i}]`, `Pt1Line3b_GivenName[${i}]`, `Pt1Line3c_MiddleName[${i}]`]);
  const otherNames = chain(a, 'otherName', 3, a['otherName.more0'] === 'yes');
  if (otherNames) name('otherName1', ['Pt1Line4a_FamilyName[0]', 'P1_L4b_FirstName[0]', 'P1_L4c_MiddleName[0]']);
  if (otherNames > 1) {
    const more = [];
    for (let i = 2; i <= otherNames; i++) {
      const full = [str(a, `otherName${i}.given`), str(a, `otherName${i}.middle`), str(a, `otherName${i}.family`)].filter(Boolean).join(' ');
      if (full) more.push(full);
    }
    if (more.length) notes.push({ page: '1', part: '1', item: '4', text: `Other names used: ${more.join('; ')}` });
  }
  address('mailing', { careOf: 'Pt1Line5a_InCareofName[0]', street: 'Pt1Line4b_StreetNumberName[0]', unit: 'Pt1Line4c_Unit', number: 'Pt1Line4c_AptSteFlrNumber[0]', city: 'Pt1Line4d_CityOrTown[0]', state: 'Pt1Line4e_State[0]', zip: 'Pt1Line4f_ZipCode[0]' });
  yesNo(a.mailingSame, 'Pt1Line6_yes[0]', 'Pt1Line6_no[0]');
  if (a.mailingSame === 'no')
    address('home', { careOf: 'Pt1Line7a_InCareofName[0]', street: 'Pt1Line7b_StreetNumberName[0]', unit: 'Pt1Line7c_Unit', number: 'Pt1Line7c_AptSteFlrNumber[0]', city: 'Pt1Line7d_CityOrTown[0]', state: 'Pt1Line7e_State[0]', zip: 'Pt1Line7f_ZipCode[0]' });
  put('Pt1Line8_DateOfBirth[0]', str(a, 'dob'));
  if (str(a, 'birthCountry')) choose('Pt1Line9_CountryOfBirth[0]', countryName(str(a, 'birthCountry')));
  if (str(a, 'citizenship')) choose('Pt1Line10_CountryOfCitiz[0]', countryName(str(a, 'citizenship')));
  put('Pt1Line11_SSN[0]', digits(str(a, 'ssn')));

  // Items 12-19: entry information.
  put('Pt1Line12_DateLastAdmission[0]', str(a, 'lastEntry.date'));
  const place = [str(a, 'lastEntry.place'), str(a, 'lastEntry.state').toUpperCase()].filter(Boolean).join(', ');
  choose('Pt1Line13_POE[0]', place);
  put('Pt1Line14_ClassofAdmission[0]', str(a, 'entry.class').toUpperCase());
  if (PORT_BOX[str(a, 'portType')]) check.push(PORT_BOX[str(a, 'portType')]);
  put('Pt1Line16_NonimmigrantStatus[0]', str(a, 'status.current'));
  put('Pt1Line17_StatusExpires[0]', str(a, 'status.expires').replace(/^d\/s$/i, 'D/S'));
  put('Pt1Line18a_ArrivalDeparture[0]', str(a, 'i94.number').replace(/[\s-]/g, '').toUpperCase());
  put('Pt1Line18b_Passport[0]', str(a, 'passport.number').toUpperCase());
  put('Pt1Line18c_TravelDoc[0]', str(a, 'travelDoc.number').toUpperCase());
  if (str(a, 'passport.country')) choose('Pt1Line18d_CountryOfIssuance[0]', countryName(str(a, 'passport.country')));
  put('Pt1Line18e_ExpDate[0]', str(a, 'passport.expires'));
  // Item 19 is the name exactly as on the I-94: the legal name unless the applicant said it differs.
  name(a.i94SameName === 'no' ? 'i94' : 'name', ['Pt1Line19a_FamilyName[0]', 'Pt1Line19b_GivenName[0]', 'Pt1Line19c_MiddleName[0]']);

  // Part 2: one reason.
  const reason = str(a, 'reason');
  if (reason.length === 1 && REASON_LETTERS.includes(reason)) check.push(`Pt2Line1${reason}_Reason[0]`);
  if (reason === 'f' && str(a, 'reason.explain')) long.push({ field: 'Pt2Line1f_Explanation[0]', text: str(a, 'reason.explain'), page: '2', part: '2', item: '1.f' });

  // Part 3.
  yesNo(a.otherFiling, 'Line1a_Yes[0]', 'Line1a_No[0]');
  if (a.otherFiling === 'yes') put('Pt3Line1b_USCISFormNumber[0]', str(a, 'otherFiling.form'));
  yesNo(a.removal, 'Line2a_Yes[0]', 'Line2a_No[0]');
  if (a.removal === 'yes' && str(a, 'removal.explain')) long.push({ field: 'Pt3Line2b_AddiitionalInfo[0]', text: str(a, 'removal.explain'), page: '3', part: '3', item: '2.b' });

  // Part 4. The signature and its date stay empty: they are written by hand.
  put('Pt4Line1_DaytimePhoneNumber1[0]', digits(str(a, 'phone')).slice(-10));
  put('Pt4Line2_MobilePhoneNumber1[0]', digits(str(a, 'mobile')).slice(-10));
  put('Pt4Line3_Email[0]', str(a, 'email'));

  return { text, check, checkValue, select, long, notes };
}

const LONG_SIZE = 9;

/** Fills the official I-102 PDF with the answers and returns the new file's bytes. */
export async function fillI102(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const index = fieldIndex(form);
  const plan = planI102(a);
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
    const option = field.getOptions().find((o) => loose(o) === loose(value) && loose(o) !== '');
    if (option !== undefined) selectOption(field, option);
    else {
      // Not in the list (a small port, a country spelled differently): type it in.
      field.enableEditing();
      field.select(toFormText(value).toUpperCase());
    }
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

  // Part 2, Item 1.f and Part 3, Item 2.b stay in their boxes when they fit; otherwise they continue in Part 7.
  const notes = [...plan.notes];
  for (const l of plan.long) {
    const box = textField(l.field);
    const { height } = box.acroField.getWidgets()[0].getRectangle();
    if (lines(box, l.text, LONG_SIZE).length * LONG_SIZE * 1.2 <= height - 4) setLong(box, l.text, LONG_SIZE);
    else {
      setLong(box, `See Part 7. Additional Information, Part ${l.part}, Item ${l.item}.`, LONG_SIZE);
      notes.push({ page: l.page, part: l.part, item: l.item, text: l.text });
    }
  }
  notes.slice(0, 5).forEach((n, i) => {
    const line = `Pt7Line${i + 3}`;
    setFieldText(textField(`${line}a_PageNumber[0]`), n.page, 9);
    setFieldText(textField(`${line}b_PartNumber[0]`), n.part, 9);
    setFieldText(textField(`${line}c_ItemNumber[0]`), n.item, 9);
    setLong(textField(`${line}d_AdditionalInfo[0]`), n.text, 8);
  });

  doc.setTitle('Form I-102, Application for Replacement/Initial Nonimmigrant Arrival-Departure Document');
  return doc.save();
}
