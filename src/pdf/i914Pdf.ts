import { PDFCheckBox, PDFDocument, PDFDropdown, type PDFField, type PDFForm, PDFTextField, StandardFonts } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { CRIME_ITEMS, ELIGIBILITY_ITEMS, PROCESSING_ITEMS } from '../forms/i914';
import { parseUnit } from '../engine/validation';
import { assistance, usedInterpreter, usedPreparer, type HelperPerson } from '../forms/assistance';
import { fieldIndex, selectOption, setFieldText, toFormText, wrap } from './common';

// Fields of USCIS Form I-914, edition 01/20/25 (public/forms/i-914.pdf), named by the last segment
// of their full name. Mapped by position:
// - Every Yes/No answer is two separate checkboxes ("Q1_yes", "Dq1a_no"), not a group; Part 3,
//   Item 3 is "Q3_*" but sits after Item 11 in the field order. Part 4's names run one number
//   ahead from Item 2: "Dq3*" is Item 2, "Dq4*" Item 3 … "Dq13" Item 12, and "Dq18" is Item 17,
//   "Dq20" Item 18, "Dq21" Item 19, "Dq22" Item 20 and "Dq23*" Item 21 (there is no "Dq19").
// - Part 2's Items 5-20 carry Part 3 names: Item 14 (passport country) and Item 17 (city of entry)
//   are "P3_Line11_CountryOfCitizenshipOrNationality[1]" and "[2]"; Item 10 (date of birth) is
//   "P1_Line2_DateOfBirth", Item 19 (I-94) "P3_Line12b_ArrivalDeparture" and Item 20 (status) the
//   dropdown "P3_Line12g_CurrentNon".
// - Part 4, Item 1's table has two rows whose fields share their last segment
//   ("Row1[0].Outcomeordisposition[0]" and "Row2[0].Outcomeordisposition[0]"); they are named here
//   with the row and looked up by full name.
// - Part 5's boxes are all "CountryofBirth": the spouse's city and country of residence are
//   "CountryofBirth[0]" and "[1]", the spouse's country of birth "[3]" and date of birth
//   "DateofBirth[1]"; each child's state is "P1_Line8_State[1..3]".
// - Part 6, Item 4 (safe phone) is "Pt12Line6_MobileNumber1"; Part 9's blocks, printed as Items
//   3-6, are "P10_Line2*"-"P10_Line5*". Part 9 repeats the name and A-Number as "Part2_*[1]".
// - Parts 7 and 8 mix "Pt12"/"Pt13"/"Pt14" names: the interpreter's name and business are
//   "Pt13Line1_Interpreter*" / "Pt13Line2_InterpreterBusinessorOrg", address "Pt13Line3_*", phones
//   "Pt12Line4_InterpreterDaytimeTelephone" / "Pt12Line5_InterpreterMobileTelephone", email
//   "Pt12Line5_Email" and language "Pt12_NameofLanguage". The preparer's address is "Pt14Line3_*",
//   mobile "Pt13ine5_PreparerFaxNumber" (sic); Item 7.A/7.B are "Pt13Line7_Checkbox[0]"/"[1]" and
//   7.B's extends / does not extend are "Pt13Line7b_extends[1]" (Y) / "[0]" (N). Both unit groups
//   list STE, APT, FLR ([0]-[2]); the boxes print as Apt., Ste., Flr.

export interface I914Note {
  page: string;
  part: string;
  item: string;
  text: string;
}

export interface I914Plan {
  text: Record<string, string>;
  check: string[];
  select: Record<string, string>;
  /** Part 3, Item 5's circumstances; the filler moves them to Part 9 when they don't fit. */
  circumstances: string;
  /** Part 9 entries, in order; the filler splits long ones over several blocks. */
  notes: I914Note[];
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');

const chain = (a: Answers, id: string, max: number, first: boolean) => {
  if (!first) return 0;
  let n = 1;
  while (n < max && a[`${id}.more${n}`] === 'yes') n++;
  return n;
};

/** Part 4 item ("p4.10a", "p4.4b3") → the PDF's checkbox base ("Dq11a", "Dq5b3"). */
export function processingBase(id: string): string {
  const item = id.slice(3);
  const n = Number(/^\d+/.exec(item)![0]);
  const rest = item.slice(String(n).length);
  const named = n === 1 ? 1 : n <= 17 ? n + 1 : n + 2;
  return `Dq${named}${rest}`;
}

/** The printed item ("10.A", "4.B.(3)"). */
const printed = (id: string) => {
  const m = /^(\d+)([a-z]?)(\d?)$/.exec(id.slice(3))!;
  return `${m[1]}${m[2] ? `.${m[2].toUpperCase()}` : ''}${m[3] ? `.(${m[3]})` : ''}`;
};

/** The page each Part 4 item is printed on. */
export function processingPage(id: string): string {
  const n = Number(/^\d+/.exec(id.slice(3))![0]);
  if (n <= 2) return '4';
  if (n <= 7) return '5';
  if (n <= 20) return '6';
  return '7';
}

/** Part 3's Yes/No boxes. */
const P3: Record<string, string> = { 'p3.1': 'Q1', 'p3.2a': 'Q2', 'p3.2b': 'Q2b', 'p3.3': 'Q3', 'p3.4': 'Q4' };

/** Part 4, Item 1's table rows, by full-name suffix. */
const ARREST = [1, 2].map((r) => ({
  why: `Row${r}[0].Whywereyouarrestedciteddetainedorcharged[0]`,
  date: `Row${r}[0].Dateofarrestcitationdetentioncharge[0]`,
  where: `Row${r}[0].Wherewereyouarrestedciteddetainedorcharged[0]`,
  outcome: `Row${r}[0].Outcomeordisposition[0]`,
}));

/** Part 5's children, Items 2.A-2.C. */
const CHILDREN = [
  { name: ['FamilyName[1]', 'GivenName[1]', 'MiddleName[1]'], dob: 'DateofBirth[0]', birth: 'CountryofBirth1[0]', city: 'CountryofBirth[2]', state: 'P1_Line8_State[1]', country: 'CountryofBirth[4]' },
  { name: ['FamilyName[2]', 'GivenName[2]', 'MiddleName[2]'], dob: 'DateofBirth[2]', birth: 'CountryofBirth2[0]', city: 'CountryofBirth[5]', state: 'P1_Line8_State[2]', country: 'CountryofBirth[6]' },
  { name: ['FamilyName[3]', 'GivenName[3]', 'MiddleName[3]'], dob: 'DateofBirth[3]', birth: 'CountryofBirth3[0]', city: 'CountryofBirth[7]', state: 'P1_Line8_State[3]', country: 'CountryofBirth[8]' },
];

/** Part 2, Item 20's dropdown spells one class differently from the shared list. */
export const statusOption = (value: string) => (value.startsWith('WB - ') ? 'WB - VISITOR FOR BUSINESS - VWPP' : value);

export function planI914(a: Answers): I914Plan {
  const text: Record<string, string> = {};
  const check: string[] = [];
  const select: Record<string, string> = {};
  const notes: I914Note[] = [];
  const put = (field: string, value: string) => {
    if (value) text[field] = value;
  };
  const yn = (base: string, value: unknown) => {
    if (value === 'yes') check.push(`${base}_yes[0]`);
    if (value === 'no') check.push(`${base}_no[0]`);
  };
  const state = (field: string, value: string) => {
    if (value) select[field] = value.toUpperCase();
  };
  const name = (prefix: string, [family, given, middle]: string[]) => {
    put(family, str(a, `${prefix}.family`));
    put(given, str(a, `${prefix}.given`));
    put(middle, str(a, `${prefix}.middle`));
  };
  const address = (prefix: string, line: string, city: string, number = `${line}_AptSteFlrNumber[0]`) => {
    put(`${line}_StreetNumberName[0]`, str(a, `${prefix}.street`));
    const u = parseUnit(str(a, `${prefix}.unit`));
    if (u) {
      check.push(`${line}_Unit[${['APT', 'STE', 'FLR'].indexOf(u.kind)}]`);
      put(number, u.number);
    }
    put(city, str(a, `${prefix}.city`));
    state(`${line}_State[0]`, str(a, `${prefix}.state`));
    put(`${line}_ZipCode[0]`, str(a, `${prefix}.zip`));
  };

  // Part 1.
  if (a.filingType === 'A') check.push('CheckBox1[0]');
  if (a.filingType === 'B') {
    check.push('CheckBox1[1]');
    put('EACNumber[0]', digits(str(a, 'priorReceipt')).slice(-10));
  }

  // Part 2. The name and A-Number repeat at the top of Part 9.
  for (const i of [0, 1]) name('name', [`Part2_FamilyName[${i}]`, `Part2_GivenName[${i}]`, `Part2_MiddleName[${i}]`]);
  const otherNames = chain(a, 'otherName', 3, a['otherName.more0'] === 'yes');
  if (otherNames >= 1) name('otherName1', ['OtherNameLastName1[0]', 'OtherNameFirst1[0]', 'OtherNameMiddle1[0]']);
  if (otherNames >= 2) name('otherName2', ['OtherNameLastName2[0]', 'OtherNameFirst2[0]', 'OtherNameMiddle2[0]']);
  if (otherNames === 3) {
    const n3 = [str(a, 'otherName3.given'), str(a, 'otherName3.middle'), str(a, 'otherName3.family')].filter(Boolean).join(' ');
    notes.push({ page: '1', part: '2', item: '2', text: `Other name used: ${n3}` });
  }

  address('home', 'P1_Line6', 'P1_Line6_CityTown[0]', 'P1_Line6__AptSteFlrNumber[0]');
  if (a.mailingSame === 'no') {
    put('P1_Line8_InCareofName[0]', str(a, 'mailing.careOf'));
    address('mailing', 'P1_Line8', 'P1_Line8_CityOrTown[0]');
  }

  const aNumber = digits(str(a, 'aNumber'));
  if (aNumber) for (const i of [0, 1]) put(`Part2_Line5_AlienRegistrationNumber[${i}]`, aNumber.padStart(9, '0'));
  put('P3_Line7_USCISOnlineAcctNumber[0]', digits(str(a, 'uscisAccount')));
  put('P3_Line5_SSN[0]', digits(str(a, 'ssn')));
  if (a.sex === 'male') check.push('Male[0]');
  if (a.sex === 'female') check.push('Female[0]');
  if (['Single', 'Married', 'Divorced', 'Widowed'].includes(str(a, 'marital'))) check.push(`${str(a, 'marital')}[0]`);
  put('P1_Line2_DateOfBirth[0]', str(a, 'dob'));
  put('P3_Line8_CityOrTownOfBirth[0]', str(a, 'birthCity'));
  put('P3_Line9_ProvinceOfBirth[0]', str(a, 'birthProvince'));
  put('P3_Line10_CountryOfBirth[0]', str(a, 'birthCountry'));
  put('P3_Line11_CountryOfCitizenshipOrNationality[0]', str(a, 'citizenship'));
  put('P3_Line12c_PassportorTravDoc[0]', str(a, 'passport'));
  put('P3_Line11_CountryOfCitizenshipOrNationality[1]', str(a, 'passportCountry'));
  put('P3_Line12d_DatePassportIssued[0]', str(a, 'passportIssued'));
  put('P3_Line12d_DatePExp[0]', str(a, 'passportExpires'));
  put('P3_Line11_CountryOfCitizenshipOrNationality[2]', str(a, 'lastEntry.city'));
  state('P3_Line17_State[0]', str(a, 'lastEntry.state'));
  put('P3_Line18d_Date[0]', str(a, 'lastEntry.date'));
  put('P3_Line12b_ArrivalDeparture[0]', str(a, 'i94').replace(/[\s-]/g, '').toUpperCase());
  if (str(a, 'currentStatus')) select['P3_Line12g_CurrentNon[0]'] = statusOption(str(a, 'currentStatus'));

  // Part 3.
  for (const item of ELIGIBILITY_ITEMS) yn(P3[item.id], a[item.id]);
  yn('Q5', a.reported);
  let circumstances = '';
  if (a.reported === 'yes') {
    notes.push({ page: '3', part: '3', item: '5', text: `Law enforcement agency and office: ${str(a, 'report.agency')}` });
    address('report', 'P3_Line5', 'P3_Line5_CityOrTown[0]');
    put('P3_Line5_DaytimePhoneNumber[0]', digits(str(a, 'report.phone')));
    put('P3_Line5_CaseNumber[0]', str(a, 'report.case'));
  }
  if (a.reported === 'no') circumstances = str(a, 'report.circumstances');
  yn('Q6', a.minor);
  yn('Q7', a.complied);
  if (a.complied === 'no' && a.minor === 'no') notes.push({ page: '3', part: '3', item: '7', text: str(a, 'complied.explain') });
  yn('Q8', a.firstEntry);
  if (a.firstEntry === 'no') {
    put('DateofEntry[0]', str(a, 'entry.date'));
    put('PlaceofEntry[0]', str(a, 'entry.city'));
    state('ddState[0]', str(a, 'entry.state'));
    put('Status[0]', str(a, 'entry.status'));
    if (str(a, 'otherEntries.explain')) notes.push({ page: '3', part: '3', item: '8', text: `Other entries in the past five years: ${str(a, 'otherEntries.explain')}` });
  }
  yn('Q9', a.traffickingEntry);
  if (a.firstEntry === 'no' || a.traffickingEntry) notes.push({ page: '3', part: '3', item: a.firstEntry === 'no' ? '8-9' : '9', text: `Circumstances of my most recent arrival: ${str(a, 'arrival.explain')}` });
  yn('Q10', a.ead);
  yn('Q11', a.petitionFamily);

  // Part 4.
  for (const item of PROCESSING_ITEMS) yn(processingBase(item.id), a[item.id]);
  const arrests = chain(a, 'arrest', 2, CRIME_ITEMS.slice(1).some((i) => a[i.id] === 'yes'));
  for (let i = 1; i <= arrests; i++) {
    const f = ARREST[i - 1];
    put(f.why, str(a, `arrest${i}.why`));
    put(f.date, str(a, `arrest${i}.date`));
    put(f.where, str(a, `arrest${i}.where`));
    put(f.outcome, str(a, `arrest${i}.outcome`));
  }
  const yes = PROCESSING_ITEMS.filter((i) => a[i.id] === 'yes');
  if (yes.length && str(a, 'processing.explain')) {
    const items = yes.map((i) => printed(i.id));
    notes.push({ page: processingPage(yes[0].id), part: '4', item: items[0], text: `Part 4, Item${items.length > 1 ? 's' : ''} ${items.join(', ')}: ${str(a, 'processing.explain')}` });
  }

  // Part 5.
  if (a.hasSpouse === 'yes') {
    name('spouse', ['FamilyName[0]', 'GivenName[0]', 'MiddleName[0]']);
    put('DateofBirth[1]', str(a, 'spouse.dob'));
    put('CountryofBirth[3]', str(a, 'spouse.birthCountry'));
    put('CountryofBirth[0]', str(a, 'spouse.city'));
    put('CountryofBirth[1]', str(a, 'spouse.country'));
  }
  const children = chain(a, 'child', 3, a['child.more0'] === 'yes');
  for (let i = 1; i <= children; i++) {
    const f = CHILDREN[i - 1];
    name(`child${i}`, f.name);
    put(f.dob, str(a, `child${i}.dob`));
    put(f.birth, str(a, `child${i}.birthCountry`));
    put(f.city, str(a, `child${i}.city`));
    state(f.state, str(a, `child${i}.state`));
    put(f.country, str(a, `child${i}.country`));
  }

  // Part 6. The signature (Item 6) and its date stay empty: they are written by hand.
  if (a.readsEnglish === 'A') check.push('Pt12Line1_Checkbox[0]');
  if (a.readsEnglish === 'B') {
    check.push('Pt12Line1_Checkbox[1]');
    put('Pt12Line1b_Language[0]', str(a, 'fluentLanguage'));
  }
  if (a.preparer === 'yes') {
    check.push('Pt12Line2_Checkbox[0]');
    put('Pt12Line2_RepresentativeName[0]', str(a, 'preparer.name'));
  }
  put('Pt12Line5_DaytimePhoneNumber[0]', digits(str(a, 'phone')));
  put('Pt12Line6_MobileNumber1[0]', digits(str(a, 'safePhone')));
  put('Pt12Line7_Email[0]', str(a, 'email'));

  // Parts 7 and 8: the interpreter and the preparer. Signatures and dates are written by hand.
  const help = assistance(a, { interpreter: usedInterpreter(a), preparer: usedPreparer(a) });
  const helper = (p: HelperPerson, line: string, f: { family: string; given: string; business: string; phone: string; mobile: string; email: string }) => {
    put(f.family, p.family);
    put(f.given, p.given);
    put(f.business, p.business);
    put(`${line}_StreetNumberName[0]`, p.street);
    const u = parseUnit(p.unit);
    if (u) {
      check.push(`${line}_Unit[${['STE', 'APT', 'FLR'].indexOf(u.kind)}]`);
      put(`${line}_AptSteFlrNumber[0]`, u.number);
    }
    put(`${line}_CityOrTown[0]`, p.city);
    state(`${line}_State[0]`, p.state);
    put(`${line}_ZipCode[0]`, digits(p.zip).slice(0, 5));
    put(`${line}_Province[0]`, p.province);
    put(`${line}_PostalCode[0]`, p.postal);
    put(`${line}_Country[0]`, p.country);
    put(f.phone, digits(p.phone).slice(-10));
    put(f.mobile, digits(p.mobile).slice(-10));
    put(f.email, p.email);
  };
  if (help.interpreter) {
    helper(help.interpreter, 'Pt13Line3', {
      family: 'Pt13Line1_InterpreterFamilyName[0]',
      given: 'Pt13Line1_InterpreterGivenName[0]',
      business: 'Pt13Line2_InterpreterBusinessorOrg[0]',
      phone: 'Pt12Line4_InterpreterDaytimeTelephone[0]',
      mobile: 'Pt12Line5_InterpreterMobileTelephone[0]',
      email: 'Pt12Line5_Email[0]',
    });
    put('Pt12_NameofLanguage[0]', help.interpreter.language);
  }
  if (help.preparer) {
    helper(help.preparer, 'Pt14Line3', {
      family: 'Pt13Line1_PreparerFamilyName[0]',
      given: 'Pt13Line1_PreparerGivenName[0]',
      business: 'Pt13Line2_BusinessName[0]',
      phone: 'Pt13Line4_DaytimePhoneNumber1[0]',
      mobile: 'Pt13ine5_PreparerFaxNumber[0]',
      email: 'Pt13Line6_Email[0]',
    });
    const st = help.preparer.statement;
    if (st === 'notAttorney') check.push('Pt13Line7_Checkbox[0]');
    if (st === 'attorneyExtends' || st === 'attorneyNotExtends') check.push('Pt13Line7_Checkbox[1]', st === 'attorneyExtends' ? 'Pt13Line7b_extends[1]' : 'Pt13Line7b_extends[0]');
  }

  return { text, check, select, circumstances, notes: notes.filter((n) => n.text && !n.text.endsWith(': ')) };
}

/** Part 9's four blocks, printed as Items 3-6. */
const BLOCKS = [2, 3, 4, 5].map((n) => ({
  page: `P10_Line${n}a_PageNumber[0]`,
  part: `P10_Line${n}b_PartNumber[0]`,
  item: `P10_Line${n}c_ItemNumber[0]`,
  info: `P10_Line${n}d_AdditionalInfo[0]`,
}));

const NOTE_SIZE = 8;
const CELL_SIZE = 8;

/** Finds a field by its last segment, or by the end of its full name ("Row2[0].Outcomeordisposition[0]"). */
export function i914Lookup(form: PDFForm) {
  const index = fieldIndex(form);
  const fields = form.getFields();
  return (name: string): PDFField | undefined => (name.includes('.') ? fields.find((f) => f.getName().endsWith(`.${name}`)) : index.get(name));
}

/** Fills the official I-914 PDF with the answers and returns the new file's bytes. */
export async function fillI914(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const lookup = i914Lookup(form);
  const plan = planI914(a);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const get = (name: string) => {
    const f = lookup(name);
    if (!f) throw new Error(`No such field: ${name}`);
    return f;
  };
  const textField = (name: string) => {
    const f = get(name);
    if (!(f instanceof PDFTextField)) throw new Error(`Not a text field: ${name}`);
    return f;
  };
  const width = (field: PDFTextField) => field.acroField.getWidgets()[0].getRectangle().width - 8;
  const height = (field: PDFTextField) => field.acroField.getWidgets()[0].getRectangle().height - 4;

  // Some text boxes are rich-text fields, which pdf-lib can't read back when it redraws the form;
  // store them as plain text instead.
  for (const f of form.getFields()) if (f instanceof PDFTextField && f.isRichFormatted()) f.disableRichFormatting();

  for (const [name, raw] of Object.entries(plan.text)) {
    const field = textField(name);
    // Multiline boxes (the Part 4 table) are broken into lines here; pdf-lib's own wrapping is slow.
    if (field.isMultiline()) setFieldText(field, wrap(toFormText(raw), font, CELL_SIZE, width(field)).join('\n'), CELL_SIZE);
    else setFieldText(field, raw, 9);
  }
  for (const name of plan.check) {
    const field = get(name);
    if (!(field instanceof PDFCheckBox)) throw new Error(`Not a checkbox: ${name}`);
    field.check();
  }
  for (const [name, value] of Object.entries(plan.select)) {
    const field = get(name);
    if (!(field instanceof PDFDropdown)) throw new Error(`Not a dropdown: ${name}`);
    selectOption(field, value);
  }

  const notes = [...plan.notes];
  // Part 3, Item 5's circumstances stay in their box when they fit; otherwise they go to Part 9.
  if (plan.circumstances) {
    const box = textField('P3_Line5_Circumstances[0]');
    const lines = wrap(toFormText(plan.circumstances), font, NOTE_SIZE, width(box));
    if (lines.length <= Math.floor(height(box) / (NOTE_SIZE * 1.2))) setFieldText(box, lines.join('\n'), NOTE_SIZE);
    else {
      setFieldText(box, 'See Part 9. Additional Information, Part 3, Item 5.', NOTE_SIZE);
      const at = notes.findIndex((n) => n.part !== '1' && n.part !== '2');
      notes.splice(at < 0 ? notes.length : at, 0, { page: '3', part: '3', item: '5', text: `Circumstances: ${plan.circumstances}` });
    }
  }

  // Part 9: long notes are broken into lines and run on into the next block when they don't fit;
  // what is left after the fourth block goes on a separate sheet.
  const first = textField(BLOCKS[0].info);
  const perBlock = Math.floor(height(first) / (NOTE_SIZE * 1.2));
  const chunks: { note: I914Note; lines: string[] }[] = [];
  for (const note of notes) {
    const lines = wrap(toFormText(note.text), font, NOTE_SIZE, width(first));
    for (let i = 0; i < lines.length; i += perBlock) chunks.push({ note, lines: lines.slice(i, i + perBlock) });
  }
  if (chunks.length > BLOCKS.length) {
    const last = chunks[BLOCKS.length - 1].lines;
    last[last.length - 1] = 'Continued on a separate sheet.';
  }
  chunks.slice(0, BLOCKS.length).forEach(({ note, lines }, i) => {
    const b = BLOCKS[i];
    setFieldText(textField(b.page), note.page, 9);
    setFieldText(textField(b.part), note.part, 9);
    setFieldText(textField(b.item), note.item, 9);
    const info = textField(b.info);
    info.enableMultiline();
    setFieldText(info, lines.join('\n'), NOTE_SIZE);
  });

  doc.setTitle('Form I-914, Application for T Nonimmigrant Status');
  return doc.save();
}
