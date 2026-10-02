import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField, StandardFonts } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { CRIME_ITEMS, ELIGIBILITY_ITEMS, PROCEEDINGS, PROCESSING_ITEMS } from '../forms/i918';
import { parseUnit } from '../engine/validation';
import { fieldIndex, optionBoxes, selectOption, setFieldText, toFormText, wrap } from './common';

// Fields of USCIS Form I-918, edition 01/20/25 (public/forms/i-918.pdf), named by the last segment
// of their full name. Mapped by position:
// - Part 1, Item 13 (I-94) is "Pt2Line14b_ArrivalDeparture", Item 17 (passport issued) is
//   "P1_Line17_DateOfBirth" and Item 21 (stay expired) is "P1_Line21_DateOfLastEntry".
// - Part 2, Item 7.a's Yes/No pair exports Y/N with No first; Item 12.b's unit boxes are
//   "P2_Line14b_Unit". Part 3, Item 3.b's date is "P3_Line3b_DateOfBirth".
// - Part 4 has five people but only three sets of names: rows 4 (Items 16-20) and 5 (Items 21-25)
//   are rows 2 and 3's names with index [1] ("P4_Line6a_FamilyName[1]" is Item 16.a).
// - Part 5, Item 2's preparer name is "P5_Line2_Attorney", Item 4 (mobile) is
//   "P5_Line5_SafePhoneNumber3" and Item 5 (email) "P5_Line6_EmailAddress"; Item 1.a exports A and
//   1.b exports B.
// - Part 8, Item 7.d is "P8_Line6d_AdditionalInfo[1]". Part 8 repeats the name and A-Number as
//   "Pt1Line1*[1]" and "P1_Line5_AlienNumber[1]".

export interface I918Note {
  page: string;
  part: string;
  item: string;
  text: string;
}

export interface I918Plan {
  text: Record<string, string>;
  check: string[];
  checkValue: [string, string][];
  select: Record<string, string>;
  /** Part 8 entries, in order; the filler splits long ones over several blocks. */
  notes: I918Note[];
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

/** Part 3 item ("p3.10a") → the PDF's Yes/No group and the printed item ("10.a"). */
export const processingBase = (id: string) => `P3_${id.slice(3)}_chbxyesno`;
const printed = (id: string) => id.slice(3).replace(/([a-z])$/, '.$1');

/** The page each Part 3 item is printed on. */
export function processingPage(id: string): string {
  const item = id.slice(3);
  const n = Number(item.replace(/\D/g, ''));
  if (n === 1) return 'abcde'.includes(item.slice(-1)) ? '3' : '4';
  if (n <= 5 || item === '6a' || item === '6b') return '4';
  if (n <= 12 || item === '13a') return '5';
  return '6';
}

/** Part 4 rows: the names each person's boxes carry. */
const P4 = [
  { name: ['P4_Line1a_FamilyName[0]', 'P4_Line1b_GivenName[0]', 'P4_Line1c_MiddleName[0]'], dob: 'P4_Line2_DateOfBirth[0]', country: 'P4_Line3_CountryOfBirth[0]', rel: 'P4_Line4_Relationship[0]', loc: 'P4_Line5_CurrentLocation[0]' },
  ...[[6, 0], [11, 0], [6, 1], [11, 1]].map(([l, k]) => ({
    name: [`P4_Line${l}a_FamilyName[${k}]`, `P4_Line${l}b_GivenName[${k}]`, `P4_Line${l}c_MiddleName[${k}]`],
    dob: `P4_Line${l + 1}_DateOfBirth[${k}]`,
    country: `P4_Line${l + 2}_CountryOfBirth[${k}]`,
    rel: `P4_Line${l + 3}_Relationship[${k}]`,
    loc: `P4_Line${l + 4}_CurrentLocation[${k}]`,
  })),
];

export function planI918(a: Answers): I918Plan {
  const text: Record<string, string> = {};
  const check: string[] = [];
  const checkValue: [string, string][] = [];
  const select: Record<string, string> = {};
  const notes: I918Note[] = [];
  const put = (field: string, value: string) => {
    if (value) text[field] = value;
  };
  const yn = (base: string, value: unknown, yes = 'Yes', no = 'No') => {
    if (value === 'yes') checkValue.push([base, yes]);
    if (value === 'no') checkValue.push([base, no]);
  };
  const state = (field: string, value: string) => {
    if (value) select[field] = value.toUpperCase();
  };
  const name = (prefix: string, [family, given, middle]: string[]) => {
    put(family, str(a, `${prefix}.family`));
    put(given, str(a, `${prefix}.given`));
    put(middle, str(a, `${prefix}.middle`));
  };
  const unit = (prefix: string, boxes: string, number: string) => {
    const u = parseUnit(str(a, `${prefix}.unit`));
    if (u) {
      checkValue.push([boxes, u.kind]);
      put(number, u.number);
    }
  };

  // Part 1. The name and A-Number repeat at the top of Part 8.
  for (const i of [0, 1]) name('name', [`Pt1Line1a_FamilyName[${i}]`, `Pt1Line1b_GivenName[${i}]`, `Pt1Line1c_MiddleName[${i}]`]);
  const otherNames = chain(a, 'otherName', 2, a['otherName.more0'] === 'yes');
  if (otherNames) name('otherName1', ['P1_Line2a_OtherFamilyName[0]', 'P1_Line2b_OtherGivenName[0]', 'P1_Line2c_OtherMiddleName[0]']);
  if (otherNames === 2) {
    const n2 = [str(a, 'otherName2.given'), str(a, 'otherName2.middle'), str(a, 'otherName2.family')].filter(Boolean).join(' ');
    notes.push({ page: '1', part: '1', item: '2', text: `Other name used: ${n2}` });
  }

  put('P1_Line3a_StreetNumberName[0]', str(a, 'home.street'));
  unit('home', 'P1_Line3b_Unit', 'P1_Line3b_AptSteFlrNumber[0]');
  put('P1_Line3c_CityTown[0]', str(a, 'home.city'));
  state('P1_Line3d_State[0]', str(a, 'home.state'));
  put('P1_Line3e_ZipCode[0]', str(a, 'home.zip'));
  put('P1_Line3f_Province[0]', str(a, 'home.province'));
  put('P1_Line3g_PostalCode[0]', str(a, 'home.postal'));
  put('P1_Line3h_Country[0]', str(a, 'home.country'));

  if (a.mailingSame === 'no') {
    put('P1_Line4a_InCareofName[0]', str(a, 'mailing.careOf'));
    put('P1_Line4b_StreetNumberName[0]', str(a, 'mailing.street'));
    unit('mailing', 'P1_Line4c_Unit', 'P1_Line4c_AptSteFlrNumber[0]');
    put('P1_Line4d_CityTown[0]', str(a, 'mailing.city'));
    state('P1_Line4e_State[0]', str(a, 'mailing.state'));
    put('P1_Line4f_ZipCode[0]', str(a, 'mailing.zip'));
    put('P1_Line4g_Province[0]', str(a, 'mailing.province'));
    put('P1_Line4h_PostalCode[0]', str(a, 'mailing.postal'));
    put('P1_Line4i_Country[0]', str(a, 'mailing.country'));
  }

  const aNumber = digits(str(a, 'aNumber'));
  if (aNumber) for (const i of [0, 1]) put(`P1_Line5_AlienNumber[${i}]`, aNumber.padStart(9, '0'));
  put('P1_Line6_SSN[0]', digits(str(a, 'ssn')));
  put('P1_Line7_USCISELISAcctNumber[0]', digits(str(a, 'uscisAccount')));
  if (['Single', 'Married', 'Divorced', 'Widowed'].includes(str(a, 'marital'))) checkValue.push(['P1_Line8_checkboxes', str(a, 'marital')]);
  if (a.sex === 'male') checkValue.push(['P1_Line9_checkboxes', 'Male']);
  if (a.sex === 'female') checkValue.push(['P1_Line9_checkboxes', 'Female']);
  put('P1_Line10_DateOfBirth[0]', str(a, 'dob'));
  put('P1_Line11_CountryOfBirth[0]', str(a, 'birthCountry'));
  put('P1_Line12_CountryOfCitizenship[0]', str(a, 'citizenship'));
  put('Pt2Line14b_ArrivalDeparture[0]', str(a, 'i94').replace(/[\s-]/g, '').toUpperCase());
  put('P1_Line14_PassportNumber[0]', str(a, 'passport'));
  put('P1_Line15_TravelDoc[0]', str(a, 'travelDoc'));
  put('P1_Line16_CountryOfIssuance[0]', str(a, 'passportCountry'));
  put('P1_Line17_DateOfBirth[0]', str(a, 'passportIssued'));
  put('P1_Line18_ExpDate[0]', str(a, 'passportExpires'));
  put('P1_Line19a_PlaceOfLastEntry[0]', str(a, 'lastEntry.city'));
  state('Pt1Line19b_State[0]', str(a, 'lastEntry.state'));
  put('P1_Line20_DateOfLastEntry[0]', str(a, 'lastEntry.date'));
  put('P1_Line21_DateOfLastEntry[0]', str(a, 'stayExpired'));
  put('P1_Line22_CurrentImmigration[0]', str(a, 'currentStatus'));

  // Part 2.
  ELIGIBILITY_ITEMS.forEach((item, i) => yn(`P2_Line${i + 1}_chbxyesno`, a[item.id]));
  yn('Pt2Line7a_chbxyesno', a.proceedings, 'Y', 'N');
  if (a.proceedings === 'yes') {
    const types = list(a, 'proceedingsTypes');
    const FIELDS: Record<string, [string, string]> = {
      b: ['Pt2Line7b_RemovalCheckbox[0]', 'Pt2Line7b_DateOfRemoval[0]'],
      c: ['Pt2Line7c_ExclusionCheckbox[0]', 'Pt2Line7c_DateOfExclusion[0]'],
      d: ['Pt2Line7d_DeportationCheckbox[0]', 'Pt2Line7d_DateOfDeportation[0]'],
      e: ['Pt2Line7e_RescissionCheckbox[0]', 'Pt2Line7e_DateOfRecission[0]'],
      f: ['Pt2Line7f_JudicialProceedingsCheckbox[0]', 'Pt2Line7f_DateOfProceedings[0]'],
    };
    for (const p of PROCEEDINGS)
      if (types.includes(p.value)) {
        check.push(FIELDS[p.value][0]);
        put(FIELDS[p.value][1], str(a, `proceedings.${p.value}`));
      }
    notes.push({ page: '2', part: '2', item: '7', text: str(a, 'proceedings.explain') });
  }

  const ENTRY = [8, 9, 10].map((n) => ({
    date: `P2_Line${n}a_DateOfEntry[0]`,
    city: n === 8 ? 'P2_Line8b_CityOrTown[0]' : `Pt2Line${n}b_CityOrTown[0]`,
    state: `Pt2Line${n}c_State[0]`,
    status: n === 8 ? 'P2_Line8d_StatusOfTimeEntry[0]' : `P2_Pt2Line${n}d_StatusOfTimeEntry[0]`,
  }));
  const entries = chain(a, 'entry', 3, a['entry.more0'] === 'yes');
  for (let i = 1; i <= entries; i++) {
    const f = ENTRY[i - 1];
    put(f.date, str(a, `entry${i}.date`));
    put(f.city, str(a, `entry${i}.city`));
    state(f.state, str(a, `entry${i}.state`));
    put(f.status, str(a, `entry${i}.status`));
  }
  if (entries === 3 && a['entry.more3'] === 'yes') notes.push({ page: '3', part: '2', item: '8-10', text: str(a, 'otherEntries.explain') });

  if (a.outsideUS === 'yes') {
    const notify = str(a, 'notify');
    if (['Consulate', 'Pre-Flight', 'Port of Entry'].includes(notify)) {
      checkValue.push(['P2_Line11a_Checkboxes', notify]);
      put('Pt2Line11b_CityTown[0]', str(a, 'office.city'));
      state('Pt2Line11c_State[0]', str(a, 'office.state'));
      put('P2_Line11d_Country[0]', str(a, 'office.country'));
    }
    if (notify === 'address') {
      put('P2_Line12a_StreetNumberName[0]', str(a, 'foreign.street'));
      unit('foreign', 'P2_Line14b_Unit', 'P2_Line12b_AptSteFlrNumber[0]');
      put('P2_Line12c_CityOrTown[0]', str(a, 'foreign.city'));
      put('P2_Line12d_Province[0]', str(a, 'foreign.province'));
      put('P2_Line12e_PostalCode[0]', str(a, 'foreign.postal'));
      put('P2_Line12f_Country[0]', str(a, 'foreign.country'));
    }
  }

  // Part 3.
  for (const item of PROCESSING_ITEMS) yn(processingBase(item.id), a[item.id]);
  const ARREST = [2, 3].map((n) => ({
    why: `P3_Line${n}a_WhyArrested[0]`,
    date: n === 2 ? 'P3_Line2b_DateOfArrest[0]' : 'P3_Line3b_DateOfBirth[0]',
    city: `P3_Line${n}c_CityOrTown[0]`,
    state: `Pt3Line${n}d_State[0]`,
    country: `P3_Line${n}e_Country[0]`,
    outcome: `P3_Line${n}f_Outcome[0]`,
  }));
  const arrests = chain(a, 'arrest', 2, CRIME_ITEMS.slice(1).some((i) => a[i.id] === 'yes'));
  for (let i = 1; i <= arrests; i++) {
    const f = ARREST[i - 1];
    put(f.why, str(a, `arrest${i}.why`));
    put(f.date, str(a, `arrest${i}.date`));
    put(f.city, str(a, `arrest${i}.city`));
    state(f.state, str(a, `arrest${i}.state`));
    put(f.country, str(a, `arrest${i}.country`));
    put(f.outcome, str(a, `arrest${i}.outcome`));
  }
  const yes = PROCESSING_ITEMS.filter((i) => a[i.id] === 'yes');
  if (yes.length && str(a, 'processing.explain')) {
    const items = yes.map((i) => printed(i.id));
    notes.push({ page: processingPage(yes[0].id), part: '3', item: items[0], text: `Part 3, Item${items.length > 1 ? 's' : ''} ${items.join(', ')}: ${str(a, 'processing.explain')}` });
  }

  // Part 4.
  const family = chain(a, 'familyMember', 5, a['familyMember.more0'] === 'yes');
  for (let i = 1; i <= family; i++) {
    const f = P4[i - 1];
    name(`familyMember${i}`, f.name);
    put(f.dob, str(a, `familyMember${i}.dob`));
    put(f.country, str(a, `familyMember${i}.birthCountry`));
    put(f.rel, str(a, `familyMember${i}.relationship`));
    put(f.loc, str(a, `familyMember${i}.location`));
  }
  yn('P4_26_chbxyesno', a.petitionFamily);

  // Part 5. The signature (Item 6) and its date stay empty: they are written by hand.
  if (a.readsEnglish === 'A' || a.readsEnglish === 'B') checkValue.push(['P5_Line1_ReadCheckbox', str(a, 'readsEnglish')]);
  if (a.readsEnglish === 'B') put('P5_Line1b_Language[0]', str(a, 'fluentLanguage'));
  if (a.preparer === 'yes') {
    check.push('P5_Line2_ReqServCheckbox[0]');
    put('P5_Line2_Attorney[0]', str(a, 'preparer.name'));
  }
  put('P5_Line3_DaytimePhoneNumber3[0]', digits(str(a, 'phone')));
  put('P5_Line5_SafePhoneNumber3[0]', digits(str(a, 'mobile')));
  put('P5_Line6_EmailAddress[0]', str(a, 'email'));

  return { text, check, checkValue, select, notes: notes.filter((n) => n.text) };
}

/** Part 8's five blocks, Items 3-7. */
const BLOCKS = [3, 4, 5, 6, 7].map((n) => ({
  page: `P8_Line${n}a_PageNumber[0]`,
  part: `P8_Line${n}b_PartNumber[0]`,
  item: `P8_Line${n}c_ItemNumber[0]`,
  info: n === 7 ? 'P8_Line6d_AdditionalInfo[1]' : `P8_Line${n}d_AdditionalInfo[0]`,
}));

const NOTE_SIZE = 8;

/** Fills the official I-918 PDF with the answers and returns the new file's bytes. */
export async function fillI918(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const index = fieldIndex(form);
  const plan = planI918(a);
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

  // Part 8: long notes are broken into lines here (pdf-lib's own wrapping is very slow) and run on
  // into the next block when they don't fit; what is left after the fifth block goes on a separate sheet.
  const box = textField(BLOCKS[0].info).acroField.getWidgets()[0].getRectangle();
  const perBlock = Math.floor((box.height - 4) / (NOTE_SIZE * 1.2));
  const chunks: { note: (typeof plan.notes)[number]; lines: string[] }[] = [];
  for (const note of plan.notes) {
    const lines = wrap(toFormText(note.text), font, NOTE_SIZE, box.width - 8);
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

  doc.setTitle('Form I-918, Petition for U Nonimmigrant Status');
  return doc.save();
}
