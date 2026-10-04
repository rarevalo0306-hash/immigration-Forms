import { PDFCheckBox, PDFDocument, PDFDropdown, type PDFFont, PDFTextField, StandardFonts } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { GROUND_GROUPS, GROUNDS_A, GROUNDS_C } from '../forms/i601';
import { parseUnit } from '../engine/validation';
import { assistance, usedInterpreter, usedPreparer } from '../forms/assistance';
import { fieldIndex, optionBoxes, selectOption, setFieldText, toFormText, wrap } from './common';

// Fields of USCIS Form I-601, edition 01/20/25 (public/forms/i-601.pdf), named by the last
// segment of their full name. Mapped by position:
// - Part 2, Item 1.d (U.S. city where you lived) is "p1Line1dCityOrTown", named as if in Part 1.
// - Part 3's race boxes all export "Y" and run bottom-up: [0] is Native Hawaiian, [1] American
//   Indian, [2] White, [3] Asian, [4] Black.
// - Part 3's eye-color boxes printed as Gray and Green export each other's values (GRN, GRY).
// - Part 6's given and middle names are "Pt6Line1b_GivenName" and "Pt6Line1c_MiddleName",
//   unlike every other field in the file. The Part 10 name and A-Number repeat Part 1's names
//   ("p1Line3aFamilyName[1]", "p1Line1ANum[1]").
// - Parts 8 (interpreter, left column of page 8) and 9 (preparer, right column) are "p8Line*" and
//   "p9Line*"; the interpreter's language is "P8Language". They have no address or statement boxes,
//   and their phone boxes hold 10 digits (a longer foreign number goes to Part 10).
// - The Yes/No pairs are in mixed order (Items 16.a and 19 list No first); they are picked by
//   export value.

export interface Note {
  page: string;
  part: string;
  item: string;
  text: string;
}

export interface I601Plan {
  text: Record<string, string>;
  check: string[];
  checkValue: [string, string][];
  select: Record<string, string>;
  /** Long statements: the filler keeps each in its box when it fits, or moves it to Part 10. */
  statements: { field: string; note: Omit<Note, 'text'>; text: string }[];
  /** Part 10 entries, in order. */
  notes: Note[];
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');
const list = (a: Answers, id: string) => (Array.isArray(a[id]) ? (a[id] as string[]) : []);

/** Race boxes by position (all export "Y"). */
export const RACE_BOX: Record<string, number> = { HW: 0, AI: 1, WH: 2, AS: 3, BL: 4 };
const EYES: Record<string, string> = { BN: 'BRO', BL: 'BLK', HA: 'HAZ', GN: 'GRY', BU: 'BLU', GR: 'GRN', MA: 'MAR', PN: 'PNK', UN: 'UNK' };
const HAIR: Record<string, string> = { BL: 'BLK', BR: 'BRO', BN: 'BLN', GR: 'GRY', WH: 'WHI', RD: 'RED', SA: 'SDY', NH: 'BAL', OT: 'UNK' };
const RELATIONSHIP: Record<string, string> = { spouse: 'Spouse', parent: 'Parent', child: 'Son or daughter', fiance: 'Fiance(e)' };
const STATUS: Record<string, string> = { citizen: 'U.S. Citizen', lpr: 'Lawful Permanent Resident' };

const chain = (a: Answers, id: string, max: number, first: boolean) => {
  if (!first) return 0;
  let n = 1;
  while (n < max && a[`${id}.more${n}`] === 'yes') n++;
  return n;
};

/** The selected grounds, by Part 4 item number, for the benefit chosen. */
export function selectedGrounds(a: Answers): string[] {
  if (a.benefit === 'A') return list(a, 'groundsA').filter((v) => GROUNDS_A.some((g) => g.item === v));
  if (a.benefit === 'C') return list(a, 'groundsC').filter((v) => GROUNDS_C.some((g) => g.item === v));
  return [];
}

/** Part 4, Item 40: the explanations of every selected ground, labeled by item. */
export function inadmissibilityStatement(a: Answers): string {
  if (a.benefit === 'B') return str(a, 'groundsB.explain') ? `Item 19 (${str(a, 'groundsB.specify')}): ${str(a, 'groundsB.explain')}` : '';
  const chosen = selectedGrounds(a);
  const out: string[] = [];
  for (const g of GROUND_GROUPS) {
    const items = chosen.filter((i) => g.items.includes(i));
    const explain = str(a, `ground.${g.key}.explain`);
    if (items.length && explain) out.push(`${items.length > 1 ? 'Items' : 'Item'} ${items.join(', ')} (${g.heading}): ${explain}`);
  }
  const other = chosen.find((i) => i === '18' || i === '39');
  if (other && str(a, 'ground.other.explain')) out.push(`Item ${other} (Other: ${str(a, 'ground.other.specify')}): ${str(a, 'ground.other.explain')}`);
  return out.join('\n\n');
}

/** A relative written out for Part 10. */
const relativeText = (a: Answers, p: string, relationship: string, status: string) => {
  const name = [str(a, `${p}.given`), str(a, `${p}.middle`), str(a, `${p}.family`)].filter(Boolean).join(' ');
  const address = [
    [str(a, `${p}.street`), str(a, `${p}.unit`)].filter(Boolean).join(' '),
    str(a, `${p}.city`),
    [str(a, `${p}.state`), str(a, `${p}.zip`)].filter(Boolean).join(' '),
    str(a, `${p}.province`),
    str(a, `${p}.postal`),
    str(a, `${p}.country`),
  ]
    .filter(Boolean)
    .join(', ');
  const parts = [
    `Name: ${name}`,
    address && `Address: ${address}`,
    str(a, `${p}.phone`) && `Phone: ${str(a, `${p}.phone`)}`,
    str(a, `${p}.email`) && `Email: ${str(a, `${p}.email`)}`,
    relationship && `Relationship: ${relationship}`,
    status && `Status: ${status}`,
    digits(str(a, `${p}.aNumber`)) && `A-Number: A-${digits(str(a, `${p}.aNumber`))}`,
    str(a, `${p}.dob`) && `Date of birth: ${str(a, `${p}.dob`)}`,
  ];
  return parts.filter(Boolean).join('; ');
};

export function planI601(a: Answers): I601Plan {
  const text: Record<string, string> = {};
  const check: string[] = [];
  const checkValue: [string, string][] = [];
  const select: Record<string, string> = {};
  const notes: Note[] = [];
  const statements: I601Plan['statements'] = [];
  const put = (field: string, value: string) => {
    if (value) text[field] = value;
  };
  const yn = (base: string, value: unknown) => {
    if (value === 'yes') checkValue.push([base, 'Y']);
    if (value === 'no') checkValue.push([base, 'N']);
  };
  const state = (field: string, value: string) => {
    if (value) select[field] = value.toUpperCase();
  };
  const name = (prefix: string, [family, given, middle]: string[]) => {
    put(family, str(a, `${prefix}.family`));
    put(given, str(a, `${prefix}.given`));
    put(middle, str(a, `${prefix}.middle`));
  };
  const address = (prefix: string, base: string, city: string) => {
    put(`${base}StreetNumberName[0]`, str(a, `${prefix}.street`));
    const u = parseUnit(str(a, `${prefix}.unit`));
    if (u) {
      checkValue.push([`${base}Unit`, u.kind]);
      put(`${base}AptSteFlrNumber[0]`, u.number);
    }
    put(`${base}${city}[0]`, str(a, `${prefix}.city`));
    state(`${base}State[0]`, str(a, `${prefix}.state`));
    put(`${base}ZipCode[0]`, digits(str(a, `${prefix}.zip`)).slice(0, 5));
    put(`${base}Province[0]`, str(a, `${prefix}.province`));
    put(`${base}PostalCode[0]`, str(a, `${prefix}.postal`));
    put(`${base}Country[0]`, str(a, `${prefix}.country`));
  };
  const receipt = (s: string) => s.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

  // Part 1. The name and A-Number repeat at the top of Part 10.
  const aNumber = digits(str(a, 'aNumber'));
  if (aNumber) for (const i of [0, 1]) put(`p1Line1ANum[${i}]`, aNumber.padStart(9, '0'));
  put('p1Line2USCISOnlineNum[0]', digits(str(a, 'uscisAccount')));
  for (const i of [0, 1]) name('name', [`p1Line3aFamilyName[${i}]`, `p1Line3bGivenName[${i}]`, `p1Line3cMiddleName[${i}]`]);
  const otherNames = chain(a, 'otherName', 2, a['otherName.more0'] === 'yes');
  if (otherNames >= 1) name('otherName1', ['p1Line4aFamilyName[0]', 'p1Line4bGivenName[0]', 'p1Line4cMiddleName[0]']);
  if (otherNames >= 2) {
    const n = ['family', 'given', 'middle'].map((k) => str(a, `otherName2.${k}`));
    notes.push({ page: '1', part: '1', item: '4', text: `Other name used: Family name: ${n[0]}; Given name: ${n[1]}${n[2] ? `; Middle name: ${n[2]}` : ''}` });
  }
  put('p1Line5InCareofName[0]', str(a, 'mailing.careOf'));
  address('mailing', 'p1Line5', 'CityOrTown');
  yn('p1Line6YesNo', a.mailingSame);
  if (a.mailingSame === 'no') address('home', 'p1Line7', 'CityTown');
  put('p1Line8SSN[0]', digits(str(a, 'ssn')));
  if (a.sex === 'male') checkValue.push(['p1Line9Gender', 'M']);
  if (a.sex === 'female') checkValue.push(['p1Line9Gender', 'F']);
  put('p1Line10DateofBirth[0]', str(a, 'dob'));
  put('p1Line11CityOrTownOfBirth[0]', str(a, 'birthCity'));
  put('p1Line12ProvinceOfBirth[0]', str(a, 'birthProvince'));
  put('p1Line13CountryOfBirth[0]', str(a, 'birthCountry'));
  put('p1Line14CountryOfCitzOrNat[0]', str(a, 'citizenship'));
  if (a.benefit === 'A' && a.process === 'visa') {
    put('p1Line15aCaseNumber[0]', str(a, 'consulate.caseNumber').replace(/\s/g, '').toUpperCase());
    put('p1Line15bCity[0]', str(a, 'consulate.city'));
    put('p1Line15bCountry[0]', str(a, 'consulate.country'));
  }
  yn('p1Line16aYesNo', a.i485Filed);
  if (a.i485Filed === 'yes') put('p1Line16bReceiptNumber[0]', receipt(str(a, 'i485.receipt')));
  yn('p1Line17aYesNo', a.i821Filed);
  if (a.i821Filed === 'yes') put('p1Line17bReceiptNumber[0]', receipt(str(a, 'i821.receipt')));
  yn('p1Line18aYesNo', a.i212Filed);
  if (a.i212Filed === 'yes') {
    put('p1Line18bReceiptNumber[0]', receipt(str(a, 'i212.receipt')));
    put('p1Line18cFilingLocation[0]', str(a, 'i212.location'));
    put('p1Line18dDateFiled[0]', str(a, 'i212.date'));
  }
  yn('p1Line19YesNo', a.i212WithThis);

  // Part 2: the most recent arrival, then the stay before it.
  if (a.everInUS === 'yes') {
    put('p2Line1aDateEntered[0]', str(a, 'lastEntry.date'));
    put('p2Line1bImmigrationStatus[0]', str(a, 'lastEntry.status'));
    put('p2Line1cLocation[0]', str(a, 'lastEntry.place'));
    put('p1Line1dCityOrTown[0]', str(a, 'lastEntry.city'));
    if (a['prevEntry.more0'] === 'yes') {
      put('p2Line2aDateEntered[0]', str(a, 'prevEntry1.from'));
      put('p2Line2bDepartureDate[0]', str(a, 'prevEntry1.to'));
      put('p2Line2cImmigrationStatus[0]', str(a, 'prevEntry1.status'));
      put('p2Line2dLocation[0]', str(a, 'prevEntry1.place'));
      put('p2Line2eCityOrTown[0]', str(a, 'prevEntry1.city'));
      if (a['prevEntry.more1'] === 'yes') notes.push({ page: '3', part: '2', item: '2', text: `Earlier stays: ${str(a, 'otherEntries.explain')}` });
    }
  }

  // Part 3.
  if (a.ethnicity === 'hispanic') checkValue.push(['p3Line1Ethnicity', 'H']);
  if (a.ethnicity === 'notHispanic') checkValue.push(['p3Line1Ethnicity', 'N']);
  for (const r of list(a, 'race')) if (r in RACE_BOX) check.push(`p3Line2Race[${RACE_BOX[r]}]`);
  if (a.heightFeet) select['p3Line3HeightFeet[0]'] = str(a, 'heightFeet');
  if (a.heightInches) select['p3Line3HeightInches[0]'] = str(a, 'heightInches');
  const weight = digits(str(a, 'weight'));
  if (weight) {
    const w = weight.padStart(3, '0').slice(-3);
    [1, 2, 3].forEach((i) => put(`p3Line4Weight${i}[0]`, w[i - 1]));
  }
  if (EYES[str(a, 'eyes')]) checkValue.push(['p3Line5EyeColor', EYES[str(a, 'eyes')]]);
  if (HAIR[str(a, 'hair')]) checkValue.push(['p3Line6HairColor', HAIR[str(a, 'hair')]]);

  // Part 4.
  for (const item of selectedGrounds(a)) check.push(`p4Line${item}CB[0]`);
  const grounds = selectedGrounds(a);
  if (grounds.includes('18')) put('p4Line18OtherSpecify[0]', str(a, 'ground.other.specify'));
  if (grounds.includes('39')) put('p4Line39OtherSpecify[0]', str(a, 'ground.other.specify'));
  if (a.benefit === 'B') {
    check.push('p4Line19CB[0]');
    put('p4Line19OtherSpecify[0]', str(a, 'groundsB.specify'));
  }
  statements.push({ field: 'p4Line40Explanation[0]', note: { page: '5', part: '4', item: '40' }, text: inadmissibilityStatement(a) });

  // Part 5. Not needed for SIJ / T (Section B).
  const sij = a.benefit === 'B';
  if (!sij) {
    if (a.benefit === 'A' && a.vawa === 'yes') check.push('p5VAWACB[0]');
    const qualifying = chain(a, 'qualifying', 2, a['qualifying.more0'] === 'yes');
    if (qualifying >= 1) {
      name('qualifying1', ['p5Line1aFamilyName[0]', 'p5Line1bGivenName[0]', 'p5Line1cMiddleName[0]']);
      address('qualifying1', 'p5Line2', 'CityOrTown');
      put('p5Line3DayPhone[0]', digits(str(a, 'qualifying1.phone')));
      put('p5Line4Email[0]', str(a, 'qualifying1.email'));
      put('p5Line5Relationship[0]', RELATIONSHIP[str(a, 'qualifying1.relationship')] ?? '');
      put('p5Line6ImmigrationStatus[0]', STATUS[str(a, 'qualifying1.status')] ?? '');
      put('p5Line7AlienNumber[0]', digits(str(a, 'qualifying1.aNumber')) && digits(str(a, 'qualifying1.aNumber')).padStart(9, '0'));
      put('p5Line8DateofBirth[0]', str(a, 'qualifying1.dob'));
    }
    if (qualifying >= 2) {
      check.push('p5AddlRelatives[0]');
      notes.push({ page: '6', part: '5', item: '1-8', text: `Additional qualifying relative. ${relativeText(a, 'qualifying2', RELATIONSHIP[str(a, 'qualifying2.relationship')] ?? '', STATUS[str(a, 'qualifying2.status')] ?? '')}` });
    }
    statements.push({ field: 'p5Line9ApplicantStatement[0]', note: { page: '6', part: '5', item: '9' }, text: str(a, 'hardship.statement') });
  }

  // Part 6.
  const others = chain(a, 'otherRelative', 2, a['otherRelative.more0'] === 'yes');
  if (others >= 1) {
    name('otherRelative1', ['p6Line1aFamilyName[0]', 'Pt6Line1b_GivenName[0]', 'Pt6Line1c_MiddleName[0]']);
    address('otherRelative1', 'p6Line2', 'CityOrTown');
    put('p6Line3DayPhone[0]', digits(str(a, 'otherRelative1.phone')));
    put('p6Line4Email[0]', str(a, 'otherRelative1.email'));
    put('p6Line5Relationship[0]', str(a, 'otherRelative1.relationship'));
    put('p6Line6ImmigrationStatus[0]', str(a, 'otherRelative1.status'));
    put('p6Line7AlienNumber[0]', digits(str(a, 'otherRelative1.aNumber')) && digits(str(a, 'otherRelative1.aNumber')).padStart(9, '0'));
    put('p6Line8DateofBirth[0]', str(a, 'otherRelative1.dob'));
  }
  if (others >= 2) {
    check.push('p6OtherRelatives[0]');
    notes.push({ page: '7', part: '6', item: '1-8', text: `Other relative with ties to the U.S. ${relativeText(a, 'otherRelative2', str(a, 'otherRelative2.relationship'), str(a, 'otherRelative2.status'))}` });
  }
  statements.push({ field: 'p6Line9ApplicantStatement[0]', note: { page: '7', part: '6', item: '9' }, text: str(a, 'discretion.statement') });

  // Part 7. The signature and its date stay empty: they are written by hand.
  put('p7Line1DayPhone[0]', digits(str(a, 'phone')));
  put('p7Line2MobilePhone[0]', digits(str(a, 'mobile')));
  put('p7Line3Email[0]', str(a, 'email'));

  // Parts 8 and 9. Signatures and dates stay empty.
  // Their phone boxes hold 10 digits; longer (foreign) numbers go to one Part 10 entry per person.
  const helperPhones = (part: string, who: string, [day, mobile]: string[], h: { phone: string; mobile: string }) => {
    const long: string[] = [];
    for (const [field, raw, label] of [[day, h.phone, 'daytime'], [mobile, h.mobile, 'mobile']]) {
      const n = digits(raw).replace(/^1(?=\d{10}$)/, '');
      if (n.length <= 10) put(field, n);
      else long.push(`${label} ${raw}`);
    }
    if (long.length) notes.push({ page: '8', part, item: '3-4', text: `${who} telephone: ${long.join('; ')}` });
  };
  const help = assistance(a, { interpreter: usedInterpreter(a), preparer: usedPreparer(a) });
  if (help.interpreter) {
    const h = help.interpreter;
    put('p8Line1aFamilyName[0]', h.family);
    put('p8Line1bGivenName[0]', h.given);
    put('p8Line2OrgName[0]', h.business);
    helperPhones('8', "Interpreter's", ['p8Line3DayPhone[0]', 'p8Line4MobilePhone[0]'], h);
    put('p8Line5Email[0]', h.email);
    put('P8Language[0]', h.language);
  }
  if (help.preparer) {
    const h = help.preparer;
    put('p9Line1aFamilyName[0]', h.family);
    put('p9Line1bGivenName[0]', h.given);
    put('p9Line2BusinessName[0]', h.business);
    helperPhones('9', "Preparer's", ['p9Line3DayPhone[0]', 'p9Line4MobilePhone[0]'], h);
    put('p9Line5Email[0]', h.email);
  }

  return { text, check, checkValue, select, statements: statements.filter((s) => s.text), notes: notes.filter((n) => n.text) };
}

const STATEMENT_SIZE = 9;
const NOTE_SIZE = 8;
const LINE = 1.2;

/** Fills the official I-601 PDF with the answers and returns the new file's bytes. */
export async function fillI601(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const index = fieldIndex(form);
  const plan = planI601(a);
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

  for (const [name, raw] of Object.entries(plan.text)) {
    const field = textField(name);
    if (field.isMultiline()) {
      // The "Other (specify)" boxes are multiline: wrap them here like the long statements.
      field.enableMultiline();
      setFieldText(field, wrap(toFormText(raw), font, 9, rect(field).width - 8).join('\n'), 9);
    } else setFieldText(field, raw, 9);
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

  // Long text is broken into lines here: pdf-lib's own wrapping is very slow on long text.
  const lines = (field: PDFTextField, s: string, size: number) => wrap(toFormText(s), font, size, rect(field).width - 8);
  const capacity = (field: PDFTextField, size: number) => Math.max(1, Math.floor((rect(field).height - 4) / (size * LINE)));
  const setLines = (field: PDFTextField, l: string[], size: number) => {
    field.enableMultiline();
    setFieldText(field, l.join('\n'), size);
  };

  // Each statement stays in its box when it fits; otherwise it continues in Part 10.
  const notes: Note[] = [];
  for (const s of plan.statements) {
    const box = textField(s.field);
    const l = lines(box, s.text, STATEMENT_SIZE);
    if (l.length <= capacity(box, STATEMENT_SIZE)) setLines(box, l, STATEMENT_SIZE);
    else {
      setLines(box, lines(box, `See Part 10. Additional Information, Page ${s.note.page}, Part ${s.note.part}, Item ${s.note.item}.`, STATEMENT_SIZE), STATEMENT_SIZE);
      notes.push({ ...s.note, text: s.text });
    }
  }
  notes.push(...plan.notes);
  notes.sort((x, y) => Number(x.page) - Number(y.page));

  // Part 10 has four boxes. A note takes as many boxes as it needs; what still doesn't fit goes on
  // added pages right after Part 10.
  const slots = [3, 4, 5, 6].map((n) => ({ n, box: textField(`p10Line${n}dAdditionalInfo[0]`) }));
  const extra: { note: Note; lines: string[] }[] = [];
  let slot = 0;
  notes.forEach((note, k) => {
    let rest = lines(slots[0].box, note.text, NOTE_SIZE);
    let first = true;
    // Leave one box for each note still to come, so every note starts in Part 10 when it can.
    const end = Math.max(slot + 1, slots.length - (notes.length - k - 1));
    while (rest.length && slot < Math.min(end, slots.length)) {
      const { n, box } = slots[slot++];
      const room = capacity(box, NOTE_SIZE);
      const head = first ? [] : ['(continued)'];
      let take = rest.slice(0, room - head.length);
      const last = slot >= Math.min(end, slots.length) && take.length < rest.length;
      if (last) take = take.slice(0, -1);
      rest = rest.slice(take.length);
      setFieldText(textField(`p10Line${n}aPageNumber[0]`), note.page, 9);
      setFieldText(textField(`p10Line${n}bPartNumber[0]`), note.part, 9);
      setFieldText(textField(`p10Line${n}cItemNumber[0]`), note.item, 9);
      setLines(box, [...head, ...take, ...(last ? ['(continued on the attached sheet)'] : [])], NOTE_SIZE);
      first = false;
    }
    if (rest.length) extra.push({ note, lines: first ? rest : ['(continued)', ...rest] });
  });
  if (extra.length) addSheets(doc, font, a, extra);

  doc.setTitle('Form I-601, Application for Waiver of Grounds of Inadmissibility');
  return doc.save();
}

const rect = (field: PDFTextField) => field.acroField.getWidgets()[0].getRectangle();

/** Continuation sheets for Part 10, with the name and A-Number at the top as the form asks. */
function addSheets(doc: PDFDocument, font: PDFFont, a: Answers, extra: { note: Note; lines: string[] }[]) {
  const [width, height] = [612, 792];
  const margin = 54;
  const size = 10;
  const lineHeight = size * 1.3;
  const name = toFormText([str(a, 'name.given'), str(a, 'name.middle'), str(a, 'name.family')].filter(Boolean).join(' '));
  const aNumber = digits(str(a, 'aNumber'));
  // Re-wrap at the page width.
  const body = extra.flatMap(({ note, lines }) => [
    `Page Number: ${note.page}   Part Number: ${note.part}   Item Number: ${note.item}`,
    ...wrap(lines.join(' '), font, size, width - 2 * margin),
    '',
  ]);
  let at = 9; // right after the Part 10 page
  let y = 0;
  let page = doc.insertPage(at, [width, height]);
  const header = () => {
    y = height - margin;
    page.drawText('Form I-601, Part 10. Additional Information (continued)', { x: margin, y, size: 12, font });
    y -= 20;
    page.drawText(`Name: ${name}${aNumber ? `     A-Number: A-${aNumber.padStart(9, '0')}` : ''}`, { x: margin, y, size, font });
    y -= 14;
    page.drawText('Signature: ______________________________     Date (mm/dd/yyyy): ______________', { x: margin, y, size, font });
    y -= 26;
  };
  header();
  for (const line of body) {
    if (y < margin) {
      page = doc.insertPage(++at, [width, height]);
      header();
    }
    if (line) page.drawText(line, { x: margin, y, size, font });
    y -= lineHeight;
  }
}
