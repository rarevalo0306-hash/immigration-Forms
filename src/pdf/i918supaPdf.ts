import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField, StandardFonts } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { FAM_CRIME_ITEMS, FAM_PROCEEDINGS, FAM_PROCESSING_ITEMS, usedInterpreter, usedPreparer } from '../forms/i918supa';
import { assistance, type HelperPerson } from '../forms/assistance';
import { parseUnit } from '../engine/validation';
import { fieldIndex, optionBoxes, selectOption, setFieldText, toFormText, wrap } from './common';

// Fields of USCIS Form I-918, Supplement A, edition 01/20/25 (public/forms/i-918supa.pdf), named by
// the last segment of their full name. Mapped by position; every checkbox group's export values
// match the printed labels, but many names carry another part's item number:
// - Part 3 (the family member): other names (Item 2) are "Pt1Line2*"; the safe mailing address
//   (Item 4) is "P1_Line4*" with units "P3_Line4c_Unit"; Items 9 and 10 are "P1_Line3h_Country" and
//   "P1_Line3h_CountryofCiti"; Item 18 is "P1_LinePart3_Line18_ExpDateforPassport10_DateOfBirth".
// - Part 4: the safe foreign address (Item 4) is "P1_Line4*[1]" with units "P1_Line4c_Unit" and its
//   city "Part4_Line5c_CityOrTown"; prior spouse 5's name is "Pt4Line1a_*Name", 5.d is
//   "Part4_Line6d_DateMarriageEnded" and 5.e/5.f "Part4_Line4e/4f"; spouse 6's 6.d-6.f are
//   "Part4_Line7d/7e/7f". Item 7 is "Pt2Line7*" (7.a exports Y/N with No first); Item 8 (work
//   permit) is "UsenamePart4_Line9_chbxyesno".
// - Part 5: from Item 4 on, each Yes/No pair is named one number up: Item 4.a is
//   "Part5_Line5a_chbxyesno", Item 9 "Part5_Line10", Item 29.c "Part5_Line30c". Item 3.f is
//   "P3_3f_Outcome".
// - Part 9's given name is "Pt1LinPart9_Line1b_InterpretersGivenNamee1b_GivenName", its phones are
//   "P6_Line4_InterpretersDaytimeTelephoneNumber3[0]" (daytime) and "[1]" (mobile). Part 10's are
//   "P7_*", with the mobile phone "P7_Line5_PreparersFaxNumber3"; Item 7 exports A/B and 7.b's
//   "Part10_Line7b_Extend" exports Y (extends) / N (does not extend).
// - Part 11, Item 7.d is "P8_Line6d_AdditionalInfo[1]"; Part 11 repeats the principal's name as
//   "Pt1Line1*[1]" and A-Number as "Part2_Line3_AlienNumber[1]".

export interface I918SupANote {
  page: string;
  part: string;
  item: string;
  text: string;
}

export interface I918SupAPlan {
  text: Record<string, string>;
  check: string[];
  checkValue: [string, string][];
  select: Record<string, string>;
  /** Part 11 entries, in order; the filler splits long ones over several blocks. */
  notes: I918SupANote[];
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');
const phone = (s: string) => digits(s).replace(/^1(?=\d{10}$)/, '');
const list = (a: Answers, id: string) => (Array.isArray(a[id]) ? (a[id] as string[]) : []);

const chain = (a: Answers, id: string, max: number, first: boolean) => {
  if (!first) return 0;
  let n = 1;
  while (n < max && a[`${id}.more${n}`] === 'yes') n++;
  return n;
};

/** Part 5 item ("fam.p5.10a") → the printed item ("10.a"). */
const printed = (id: string) => id.slice(7).replace(/([a-z])$/, '.$1');

/** Part 5 item → the PDF's Yes/No group: from Item 4 on, the names are one number up. */
export function processingBase(id: string): string {
  const item = id.slice(7);
  const n = Number(item.replace(/\D/g, ''));
  const letter = item.replace(/\d/g, '');
  return `Part5_Line${n === 1 ? 1 : n + 1}${letter}_chbxyesno`;
}

/** The page each Part 5 item is printed on. */
export function processingPage(id: string): string {
  const n = Number(id.slice(7).replace(/\D/g, ''));
  if (n === 1) return '4';
  if (n <= 8) return '5';
  if (n <= 17) return '6';
  return '7';
}

interface AddressFields {
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

const helperAddress = (p: string): AddressFields => ({
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
const P9_ADDRESS = helperAddress('Pt9Line3');
const P10_ADDRESS = helperAddress('Pt10Line3');

/** Part 6 rows (Items 1-4, 5-8, 9-12). */
const P6 = [1, 5, 9].map((n) => ({
  name: [`Part6_Line${n}a_FamilyName[0]`, `Part6_Line${n}b_GivenName[0]`, `Part6_Line${n}c_MiddleName[0]`],
  dob: `Part6_Line${n + 1}_DateOfBirth[0]`,
  country: `Part6_Line${n + 2}_CountryOfBirth[0]`,
  rel: `Part6_Line${n + 3}_Relationship[0]`,
}));

/** Part 4, Items 5 and 6 (prior spouses). */
const PRIOR = [
  { name: ['Pt4Line1a_FamilyName[0]', 'Pt4Line1a_GivenName[0]', 'Pt4Line1a_MiddleName[0]'], ended: 'Part4_Line6d_DateMarriageEnded[0]', where: 'Part4_Line4e_WhereMarriageEnded[0]', how: 'Part4_Line4f_HowMarriageEnded[0]' },
  { name: ['Pt4Line6a_FamilyName[0]', 'Pt4Line6a_GivenName[0]', 'Pt4Line6a_MiddleName[0]'], ended: 'Part4_Line7d_DateMarriageEnded[0]', where: 'Part4_Line7e_WhereMarriageEnded[0]', how: 'Part4_Line7f_HowMarriageEnded[0]' },
];

/** Part 5, Items 2 and 3 (arrests). */
const ARREST = [2, 3].map((n) => ({
  why: `Part5_Line${n}a_WhyArrested[0]`,
  date: `Part5_Line${n}b_DateOfArrest[0]`,
  city: `Part5_Line${n}c_CityOrTown[0]`,
  state: `Pt5Line${n}d_State[0]`,
  country: `Part5_Line${n}e_Country[0]`,
  outcome: n === 2 ? 'Part5_Line2f_Outcome[0]' : 'P3_3f_Outcome[0]',
}));

const PROCEEDING_FIELDS: Record<string, [string, string]> = {
  b: ['Pt2Line7b_RemovalCheckbox[0]', 'Pt2Line7b_DateOfRemoval[0]'],
  c: ['Pt2Line7c_ExclusionCheckbox[0]', 'Pt2Line7c_DateOfExclusion[0]'],
  d: ['Pt2Line7d_DeportationCheckbox[0]', 'Pt2Line7d_DateOfDeportation[0]'],
  e: ['Pt2Line7e_RescissionCheckbox[0]', 'Pt2Line7e_DateOfRecission[0]'],
  f: ['Pt2Line7f_JudicialProceedingsCheckbox[0]', 'Pt2Line7f_DateOfProceedings[0]'],
};

export function planI918SupA(a: Answers): I918SupAPlan {
  const text: Record<string, string> = {};
  const check: string[] = [];
  const checkValue: [string, string][] = [];
  const select: Record<string, string> = {};
  const notes: I918SupANote[] = [];
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
  const unit = (raw: string, boxes: string, number: string) => {
    const u = parseUnit(raw);
    if (u) {
      checkValue.push([boxes, u.kind]);
      put(number, u.number);
    }
  };
  const inUS = a['fam.inUS'] === 'yes';
  const outside = a['fam.inUS'] === 'no';

  // Part 1.
  if (['Spouse', 'Child', 'Parent', 'Unmarried'].includes(str(a, 'relationship'))) checkValue.push(['Part1_Line1_checkbox', str(a, 'relationship')]);

  // Part 2 (the principal). The name and A-Number repeat at the top of Part 11.
  for (const i of [0, 1]) name('name', [`Pt1Line1a_FamilyName[${i}]`, `Pt1Line1b_GivenName[${i}]`, `Pt1Line1c_MiddleName[${i}]`]);
  put('Part2_Line2_DateOfBirth[0]', str(a, 'dob'));
  const aNumber = digits(str(a, 'aNumber'));
  if (aNumber) for (const i of [0, 1]) put(`Part2_Line3_AlienNumber[${i}]`, aNumber.padStart(9, '0'));
  put('P2_Line4_USCISELISAcctNumber[0]', digits(str(a, 'uscisAccount')));
  if (['Pending', 'Approved'].includes(str(a, 'i918Status'))) checkValue.push(['Part2_Line5_checkbox', str(a, 'i918Status')]);

  // Part 3 (the family member).
  name('fam.name', ['Pt3Line1a_FamilyName[0]', 'Pt3Line1b_GivenName[0]', 'Pt3Line1c_MiddleName[0]']);
  const otherNames = chain(a, 'fam.otherName', 2, a['fam.otherName.more0'] === 'yes');
  if (otherNames) name('fam.otherName1', ['Pt1Line2a_FamilyName[0]', 'Pt1Line2b_GivenName[0]', 'Pt1Line2c_MiddleName[0]']);
  if (otherNames === 2) {
    const n2 = [str(a, 'fam.otherName2.given'), str(a, 'fam.otherName2.middle'), str(a, 'fam.otherName2.family')].filter(Boolean).join(' ');
    notes.push({ page: '1', part: '3', item: '2', text: `Other name used by the family member: ${n2}` });
  }
  put('Pt3Line3a_StreetNumberName[0]', str(a, 'fam.home.street'));
  unit(str(a, 'fam.home.unit'), 'Pt3Line3b_Unit', 'Pt3Line3b_AptSteFlrNumber[0]');
  put('Pt3Line3c_CityTown[0]', str(a, 'fam.home.city'));
  state('Pt3Line3d_State[0]', str(a, 'fam.home.state'));
  put('Pt3Line3e_ZipCode[0]', str(a, 'fam.home.zip'));
  if (a['fam.mailingSame'] === 'no') {
    put('P1_Line4a_InCareofName[0]', str(a, 'fam.mailing.careOf'));
    put('P1_Line4b_StreetNumberName[0]', str(a, 'fam.mailing.street'));
    unit(str(a, 'fam.mailing.unit'), 'P3_Line4c_Unit', 'P3_Line4c_AptSteFlrNumber[0]');
    put('P1_Line4d_CityTown[0]', str(a, 'fam.mailing.city'));
    state('P1_Line4e_State[0]', str(a, 'fam.mailing.state'));
    put('P1_Line4f_ZipCode[0]', str(a, 'fam.mailing.zip'));
    put('P1_Line4g_Province[0]', str(a, 'fam.mailing.province'));
    put('P1_Line4h_PostalCode[0]', str(a, 'fam.mailing.postal'));
    put('P1_Line4i_Country[0]', str(a, 'fam.mailing.country'));
  }
  const famA = digits(str(a, 'fam.aNumber'));
  if (famA) put('Part3_Line5_AlienNumber[0]', famA.padStart(9, '0'));
  put('Part3_Line6_SSN[0]', digits(str(a, 'fam.ssn')));
  put('Part3_Line7_USCISELISAcctNumber[0]', digits(str(a, 'fam.uscisAccount')));
  put('Part3_Line8_DateOfBirth[0]', str(a, 'fam.dob'));
  put('P1_Line3h_Country[0]', str(a, 'fam.birthCountry'));
  put('P1_Line3h_CountryofCiti[0]', str(a, 'fam.citizenship'));
  if (['Single', 'Married', 'Divorced', 'Widowed'].includes(str(a, 'fam.marital'))) checkValue.push(['Part3_Line11_checkbox', str(a, 'fam.marital')]);
  if (a['fam.sex'] === 'male') checkValue.push(['P3_Line12_checkbox', 'Male']);
  if (a['fam.sex'] === 'female') checkValue.push(['P3_Line12_checkbox', 'Female']);
  put('Part3_Line13_PrincipalAlienI-94[0]', str(a, 'fam.i94').replace(/[\s-]/g, '').toUpperCase());
  put('Part3_Line14_PassportNumber[0]', str(a, 'fam.passport'));
  put('Part3_Line15_TravelDoc[0]', str(a, 'fam.travelDoc'));
  put('Part3_Line16_CountryOfIssuance[0]', str(a, 'fam.passportCountry'));
  put('Part3_Line17_DateofIssuance[0]', str(a, 'fam.passportIssued'));
  put('P1_LinePart3_Line18_ExpDateforPassport10_DateOfBirth[0]', str(a, 'fam.passportExpires'));

  // Part 4.
  if (inUS) {
    put('Part4_Line1a_DateOfLastEntry[0]', str(a, 'fam.lastEntry.date'));
    put('Part4_Line1b_CityOrTown[0]', str(a, 'fam.lastEntry.city'));
    state('Pt4Line1c_State[0]', str(a, 'fam.lastEntry.state'));
    put('Part4_Line1d_CurrentImmigration[0]', str(a, 'fam.currentStatus'));
  }
  if (outside) {
    if (a['fam.beenInUS'] === 'yes') {
      put('Part4_Line2a_DateOfLastEntry[0]', str(a, 'fam.prevEntry.date'));
      put('Part4_Line2b_CityOrTown[0]', str(a, 'fam.prevEntry.city'));
      state('Pt4Line2c_State[0]', str(a, 'fam.prevEntry.state'));
      put('Part4_Line2d_DateOfAuthStay[0]', str(a, 'fam.prevEntry.stayExpired'));
      put('Part4_Line2e_StatusOfEntry[0]', str(a, 'fam.prevEntry.status'));
    }
    const notify = str(a, 'fam.notify');
    if (['Consulate', 'Pre-Flight', 'Port of Entry'].includes(notify)) {
      checkValue.push(['Pt4Line3a_Checkboxes', notify]);
      put('Pt4Line3b_CityOrTown[0]', str(a, 'fam.office.city'));
      state('Pt4Line3c_State[0]', str(a, 'fam.office.state'));
      put('Pt4Line3d_Country[0]', str(a, 'fam.office.country'));
    }
    if (notify === 'address') {
      put('P1_Line4b_StreetNumberName[1]', str(a, 'fam.foreign.street'));
      unit(str(a, 'fam.foreign.unit'), 'P1_Line4c_Unit', 'P1_Line4c_AptSteFlrNumber[0]');
      put('Part4_Line5c_CityOrTown[0]', str(a, 'fam.foreign.city'));
      put('P1_Line4g_Province[1]', str(a, 'fam.foreign.province'));
      put('P1_Line4h_PostalCode[1]', str(a, 'fam.foreign.postal'));
      put('P1_Line4i_Country[1]', str(a, 'fam.foreign.country'));
    }
  }
  const priors = chain(a, 'fam.priorSpouse', 2, a.relationship !== 'Unmarried' && a['fam.priorSpouse.more0'] === 'yes');
  for (let i = 1; i <= priors; i++) {
    const f = PRIOR[i - 1];
    name(`fam.priorSpouse${i}`, f.name);
    put(f.ended, str(a, `fam.priorSpouse${i}.ended`));
    put(f.where, str(a, `fam.priorSpouse${i}.where`));
    put(f.how, str(a, `fam.priorSpouse${i}.how`));
  }
  yn('Pt2Line7a_chbxyesno', a['fam.proceedings'], 'Y', 'N');
  if (a['fam.proceedings'] === 'yes') {
    const types = list(a, 'fam.proceedingsTypes');
    for (const p of FAM_PROCEEDINGS)
      if (types.includes(p.value)) {
        check.push(PROCEEDING_FIELDS[p.value][0]);
        put(PROCEEDING_FIELDS[p.value][1], str(a, `fam.proceedings.${p.value}`));
      }
    notes.push({ page: '3', part: '4', item: '7', text: str(a, 'fam.proceedings.explain') });
  }
  // Item 8: a family member abroad can't get a work permit yet, so the answer is No.
  if (inUS) yn('UsenamePart4_Line9_chbxyesno', a['fam.ead']);
  if (outside) checkValue.push(['UsenamePart4_Line9_chbxyesno', 'No']);

  // Part 5.
  for (const item of FAM_PROCESSING_ITEMS) yn(processingBase(item.id), a[item.id]);
  const arrests = chain(a, 'fam.arrest', 2, FAM_CRIME_ITEMS.slice(1).some((i) => a[i.id] === 'yes'));
  for (let i = 1; i <= arrests; i++) {
    const f = ARREST[i - 1];
    put(f.why, str(a, `fam.arrest${i}.why`));
    put(f.date, str(a, `fam.arrest${i}.date`));
    put(f.city, str(a, `fam.arrest${i}.city`));
    state(f.state, str(a, `fam.arrest${i}.state`));
    put(f.country, str(a, `fam.arrest${i}.country`));
    put(f.outcome, str(a, `fam.arrest${i}.outcome`));
  }
  const yes = FAM_PROCESSING_ITEMS.filter((i) => a[i.id] === 'yes');
  if (yes.length && str(a, 'fam.processing.explain')) {
    const items = yes.map((i) => printed(i.id));
    notes.push({ page: processingPage(yes[0].id), part: '5', item: items[0], text: `Part 5, Item${items.length > 1 ? 's' : ''} ${items.join(', ')}: ${str(a, 'fam.processing.explain')}` });
  }

  // Part 6.
  const relatives = chain(a, 'fam.relative', 3, a['fam.relative.more0'] === 'yes');
  for (let i = 1; i <= relatives; i++) {
    const f = P6[i - 1];
    name(`fam.relative${i}`, f.name);
    put(f.dob, str(a, `fam.relative${i}.dob`));
    put(f.country, str(a, `fam.relative${i}.birthCountry`));
    put(f.rel, str(a, `fam.relative${i}.relationship`));
  }

  // Part 7 (the principal). The signature (Item 6) and its date stay empty.
  if (a.readsEnglish === 'A' || a.readsEnglish === 'B') checkValue.push(['Part7_Line1_ReadCheckbox', str(a, 'readsEnglish')]);
  if (a.readsEnglish === 'B') put('Part7_Line1b_Language[0]', str(a, 'fluentLanguage'));
  if (a.preparer === 'yes') {
    check.push('Part7_Line2_ReqServCheckbox[0]');
    put('Part7_Line2_Attorney[0]', str(a, 'preparer.name'));
  }
  put('Part7_Line3_DaytimePhoneNumber[0]', phone(str(a, 'phone')));
  put('Part7_Line5_MobilePhoneNumber[0]', phone(str(a, 'mobile')));
  put('Part7_Line6_EmailAddress[0]', str(a, 'email'));

  // Part 8 (the family member, only when in the U.S.). The signature and date stay empty.
  if (inUS) {
    const reads = str(a, 'fam.readsEnglish');
    if (reads === 'A' || reads === 'B') checkValue.push(['Part8_Line1_ReadCheckbox', reads]);
    if (reads === 'B') put('Part8_Line1b_Language[0]', str(a, 'fam.fluentLanguage'));
    if (a['fam.preparer'] === 'yes') {
      check.push('Part8_Line2_ReqServCheckbox[0]');
      put('Part8_Line2_Attorney[0]', str(a, 'fam.preparer.name'));
    }
    put('Part8_Line3_DaytimePhoneNumber3[0]', phone(str(a, 'fam.phone')));
    put('Part8_Line4_MobilePhoneNumber3[0]', phone(str(a, 'fam.mobile')));
    put('Part8_Line5_EmailAddress[0]', str(a, 'fam.email'));
  }

  // Parts 9 and 10. Signatures and dates stay empty.
  const helper = (h: HelperPerson, f: AddressFields) => {
    put(f.street, h.street);
    unit(h.unit, f.unit, f.number);
    put(f.city, h.city);
    state(f.state, h.state);
    put(f.zip, h.zip);
    put(f.province, h.province);
    put(f.postal, h.postal);
    put(f.country, h.country);
  };
  const help = assistance(a, { interpreter: usedInterpreter(a), preparer: usedPreparer(a) });
  if (help.interpreter) {
    const h = help.interpreter;
    put('Part9_Line1a_InterpretersFamilyName[0]', h.family);
    put('Pt1LinPart9_Line1b_InterpretersGivenNamee1b_GivenName[0]', h.given);
    put('Part9_Line2_IntrpretersBusinessName[0]', h.business);
    helper(h, P9_ADDRESS);
    put('P6_Line4_InterpretersDaytimeTelephoneNumber3[0]', phone(h.phone));
    put('P6_Line4_InterpretersDaytimeTelephoneNumber3[1]', phone(h.mobile));
    put('P6_Line5_EmailAddress[0]', h.email);
    put('Part9_Language[0]', h.language);
  }
  if (help.preparer) {
    const h = help.preparer;
    put('P7_Line1a_PreparersFamilyName[0]', h.family);
    put('P7_Line1b_PreparersGivenName[0]', h.given);
    put('P7_Line2_PreparersBusinessName[0]', h.business);
    helper(h, P10_ADDRESS);
    put('P7_Line4_PreparersDaytimeTelephoneNumber3[0]', phone(h.phone));
    put('P7_Line5_PreparersFaxNumber3[0]', phone(h.mobile));
    put('P7_Line6_EmailAddress[0]', h.email);
    if (h.statement === 'notAttorney') checkValue.push(['Part10_Line7_Attorney', 'A']);
    if (h.statement === 'attorneyExtends' || h.statement === 'attorneyNotExtends') checkValue.push(['Part10_Line7_Attorney', 'B']);
    if (h.statement === 'attorneyExtends') checkValue.push(['Part10_Line7b_Extend', 'Y']);
    if (h.statement === 'attorneyNotExtends') checkValue.push(['Part10_Line7b_Extend', 'N']);
  }

  return { text, check, checkValue, select, notes: notes.filter((n) => n.text) };
}

/** Part 11's five blocks, Items 3-7. */
const BLOCKS = [3, 4, 5, 6, 7].map((n) => ({
  page: `P8_Line${n}a_PageNumber[0]`,
  part: `P8_Line${n}b_PartNumber[0]`,
  item: `P8_Line${n}c_ItemNumber[0]`,
  info: n === 7 ? 'P8_Line6d_AdditionalInfo[1]' : `P8_Line${n}d_AdditionalInfo[0]`,
}));

const NOTE_SIZE = 8;

/** Fills the official I-918 Supplement A PDF with the answers and returns the new file's bytes. */
export async function fillI918SupA(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const index = fieldIndex(form);
  const plan = planI918SupA(a);
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

  // Part 11: long notes are broken into lines here (pdf-lib's own wrapping is very slow) and run on
  // into the next block when they don't fit; what is left after the fifth block goes on a separate sheet.
  const box = textField(BLOCKS[0].info).acroField.getWidgets()[0].getRectangle();
  const perBlock = Math.floor((box.height - 4) / (NOTE_SIZE * 1.2));
  const chunks: { note: I918SupANote; lines: string[] }[] = [];
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

  doc.setTitle('Form I-918, Supplement A, Petition for Qualifying Family Member of U-1 Recipient');
  return doc.save();
}
