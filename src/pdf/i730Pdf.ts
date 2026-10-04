import { PDFCheckBox, PDFDocument, PDFDropdown, type PDFField, type PDFForm, PDFTextField, StandardFonts, rgb } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { parseUnit } from '../engine/validation';
import { assistance, type HelperPerson, usedInterpreter, usedPreparer } from '../forms/assistance';
import { lastSegment, optionBoxes, selectOption, setFieldText, toFormText, wrap } from './common';

// Fields of USCIS Form I-730, edition 01/20/25 (public/forms/i-730.pdf), named by the last
// segment of their full name. Mapped by position:
// - "TextField1[0-2]" (the "Number of relatives ... ( _ of _ )" blanks on page 1) and "CheckBox1[0]"
//   repeat on page 12 (Part 9, officer only), so this filler indexes the FIRST field with each name.
//   On page 1, "TextField1[2]" is the count, "TextField1[1]" this petition's number and
//   "TextField1[0]" the total after "of".
// - Part 3, Item 1's printed Yes box exports "N" and the No box exports "Y" ("Part3_2year").
// - Part 1, Item 20 (place prior marriage 2 ended) is "Pt1Line19_CityTown/StateorProvince/Country";
//   Item 25 is "Pt1Line25_DateRefugeeStatusApproved".
// - Part 2, Item 1's middle name is "Pt1_Line1_MiddleName"; Items 32, 35 and 37 are
//   "Pt2_Line24_PassportNumber", "Pt2_Line24_TravelDocumentNumber" and "Pt2_Line24_CountryTravDocIssuance";
//   Item 27 is "P2_Line26_DateOfArrival".
// - Part 5, Item 1.b's language blank is "P5_Line1b_NameofInterpreter", and Item 2's preparer name
//   is "P5_Line2b_Consented". The sex boxes of Parts 1 and 2 are "sex[0-1]" and "sex[2-3]" (1 = Male).
// - Parts 7 and 8 (pages 10-11): the unit boxes "P7_Line3_Unit" / "P8_Line3_Unit" are [2] APT, [0] STE,
//   [1] FLR left to right, and their export values match the printed labels. The interpreter's phone
//   boxes hold 10 digits. Part 8, Item 7 is "Pt8_Line7_chkbx" (A = not an attorney, B = attorney), with
//   "Pt8_Line7b_Extend" / "Pt8_Line7b_DoesNotExtend".
// The form has no additional-information part: a Part 3 explanation that doesn't fit its box
// continues on pages added at the end.

export interface I730Plan {
  text: Record<string, string>;
  check: string[];
  checkValue: [string, string][];
  select: Record<string, string>;
  /** Part 3's explanation; the filler adds a continuation page when it doesn't fit. */
  explanation: string;
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');

const chain = (a: Answers, id: string, max: number, first: boolean) => {
  if (!first) return 0;
  let n = 1;
  while (n < max && a[`${id}.more${n}`] === 'yes') n++;
  return n;
};

/** Every field by the last segment of its name, keeping the first one when a name repeats. */
export function firstFieldIndex(form: PDFForm) {
  const out = new Map<string, PDFField>();
  for (const f of form.getFields()) {
    const s = lastSegment(f.getName());
    if (!out.has(s)) out.set(s, f);
  }
  return out;
}

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

const helperAddress = (p: string, street: string, city: string): AddressFields => ({
  street: `${p}_Line3_${street}[0]`,
  unit: `${p}_Line3_Unit`,
  number: `${p}_Line3_Number[0]`,
  city: `${p}_Line3_${city}[0]`,
  state: `${p}_Line3_State[0]`,
  zip: `${p}_Line3_ZipCode[0]`,
  province: `${p}_Line3_Province[0]`,
  postal: `${p}_Line3_PostalCode[0]`,
  country: `${p}_Line3_Country[0]`,
});
const P7_ADDRESS = helperAddress('P7', 'InterpretersStreetName', 'City');
const P8_ADDRESS = helperAddress('P8', 'PrepStreetName', 'CityTown');

const P1_HOME: AddressFields = { street: 'P1_Line2_StreetName[0]', unit: 'P1_Line2_Unit', number: 'P1_Line2_Number[0]', city: 'P1_Line2_City[0]', state: 'P1_Line2_State[0]', zip: 'P1_Line2_ZipCode[0]', province: 'P1_Line2_Province[0]', postal: 'P1_Line2_PostalCode[0]', country: 'P1_Line2_Country[0]' };
const P1_MAIL: AddressFields = { careOf: 'P1_Line3_InCareofName[0]', street: 'P1_Line3_StreetNumberName[0]', unit: 'P1_Line3__Unit', number: 'P1_Line3__UnitAptSteFlrNumber[0]', city: 'P1_Line3_CityTown[0]', state: 'P1_Line3_State[0]', zip: 'P1_Line3_ZipCode[0]', province: 'P1_Line3_Province[0]', postal: 'P1_Line3_PostalCode[0]', country: 'P1_Line3_Country[0]' };
const P2_HOME: AddressFields = { street: 'P2_Line2_StreetName[0]', unit: 'P2_Line2_Unit', number: 'P2_Line2_Number[0]', city: 'P2_Line2_City[0]', state: 'P2_Line2_State[0]', zip: 'P2_Line2_ZipCode[0]', province: 'P2_Line2_Province[0]', postal: 'P2_Line2_PostalCode[0]', country: 'P2_Line2_Country[0]' };
const P2_MAIL: AddressFields = { careOf: 'P2_Line3_InCareofName[0]', street: 'P2_Line3_StreetNumberName[0]', unit: 'P2_Line3_Unit', number: 'P2_Line3_AptSteFlrNumber[0]', city: 'P2_Line3_CityTown[0]', state: 'P2_Line3_State[0]', zip: 'P2_Line3_ZipCode[0]', province: 'P2_Line3_Province[0]', postal: 'P2_Line3_PostalCode[0]', country: 'P2_Line3_Country[0]' };
const P2_NATIVE: AddressFields = { careOf: 'Part2_Line22_InCareofName[0]', street: 'Part2_Line22_StreetNumberName[0]', unit: 'P2_Line22_Unit', number: 'P2_Line22_Unit_AptSteFlrNumber[0]', city: 'P2_Line22_CityTown[0]', state: 'P2_Line22_State[0]', zip: 'P2_Line22_ZipCode[0]', province: 'P2_Line22_Province[0]', postal: 'P2_Line22_PostalCode[0]', country: 'P2_Line22_Country[0]' };

/** Part 2's two entry blocks (Items 27-37 and 38-48). */
const ENTRIES = [
  { date: 'P2_Line26_DateOfArrival[0]', city: 'Pt2_Line28_City[0]', state: 'Pt2_Line28__State[0]', status: 'Pt2_Line29_ArrivalStatus[0]', i94: 'Pt2_Line30_I94Number[0]', expires: 'P2_Line31_DateStatusExpires[0]', passport: 'Pt2_Line24_PassportNumber[0]', passportExpires: 'P2_Line33_DatePassportExpire[0]', passportCountry: 'Pt2_Line34_CountryIssuance[0]', travelDoc: 'Pt2_Line24_TravelDocumentNumber[0]', travelDocExpires: 'P2_Line36_TravelDocExpire[0]', travelDocCountry: 'Pt2_Line24_CountryTravDocIssuance[0]' },
  { date: 'P2_Line38_DateOfArrival[0]', city: 'Pt2_Line39_City[0]', state: 'Pt2_Line39_State[0]', status: 'Pt2_Line40_ArrivalStatus[0]', i94: 'Pt2_Line41_I94Number[0]', expires: 'Pt2_Line42_StatusExpires[0]', passport: 'Pt2_Line43_PassportNumber[0]', passportExpires: 'Pt2_Line44_PassportExpiration[0]', passportCountry: 'Pt2_Line45_CountryIssuancePassport[0]', travelDoc: 'Pt2_Line46_TravelDocumentNumber[0]', travelDocExpires: 'Pt2_Line47_TravelDocExpiration[0]', travelDocCountry: 'Pt2_Line48_CountryTravelDocIssuance[0]' },
];

export function planI730(a: Answers): I730Plan {
  const text: Record<string, string> = {};
  const check: string[] = [];
  const checkValue: [string, string][] = [];
  const select: Record<string, string> = {};
  const put = (field: string, value: string) => {
    if (value) text[field] = value;
  };
  const state = (field: string, value: string) => {
    if (value) select[field] = value.toUpperCase();
  };
  const name = (prefix: string, [family, given, middle]: string[]) => {
    put(family, str(a, `${prefix}.family`));
    put(given, str(a, `${prefix}.given`));
    put(middle, str(a, `${prefix}.middle`));
  };
  const address = (prefix: string, f: AddressFields) => {
    if (f.careOf) put(f.careOf, str(a, `${prefix}.careOf`));
    put(f.street, str(a, `${prefix}.street`));
    const u = parseUnit(str(a, `${prefix}.unit`));
    if (u) {
      checkValue.push([f.unit, u.kind]);
      put(f.number, u.number);
    }
    put(f.city, str(a, `${prefix}.city`));
    state(f.state, str(a, `${prefix}.state`));
    put(f.zip, str(a, `${prefix}.zip`));
    put(f.province, str(a, `${prefix}.province`));
    put(f.postal, str(a, `${prefix}.postal`));
    put(f.country, str(a, `${prefix}.country`));
  };
  const place = (prefix: string, [city, st, country]: string[]) => {
    put(city, str(a, `${prefix}.city`));
    put(st, str(a, `${prefix}.state`));
    put(country, str(a, `${prefix}.country`));
  };
  const spouse = a.relationship === 'S';

  // Page 1.
  if (['REF', 'ASL', 'LRE', 'LAS'].includes(str(a, 'status'))) checkValue.push(['Status', str(a, 'status')]);
  if (spouse) checkValue.push(['Beneficiary', 'S']);
  if (a.relationship === 'U') {
    checkValue.push(['Beneficiary', 'U']);
    if (['BC', 'SC', 'AC'].includes(str(a, 'childType'))) checkValue.push(['Child', str(a, 'childType')]);
  }
  const total = digits(str(a, 'relatives.total'));
  put('TextField1[2]', total);
  put('TextField1[1]', digits(str(a, 'relatives.this')));
  put('TextField1[0]', total);

  // Part 1.
  name('name', ['Pt1Line1_FamilyName[0]', 'Pt1Line1_GivenName[0]', 'Pt1Line1_MiddleName[0]']);
  address('home', P1_HOME);
  if (a.mailingSame === 'no') address('mailing', P1_MAIL);
  put('TelephoneNumber\\.[0]', str(a, 'phone'));
  put('E-mailAddress[0]', str(a, 'email'));
  if (a.sex === 'male') check.push('sex[0]');
  if (a.sex === 'female') check.push('sex[1]');
  put('DateofBirth[0]', str(a, 'dob'));
  put('CountryofBirth[0]', str(a, 'birthCountry'));
  put('CountryofCitizenshipNationality[0]', str(a, 'citizenship'));
  const aNumber = digits(str(a, 'aNumber'));
  if (aNumber) put('Part1_Item9_AlienNum[0]', aNumber.padStart(9, '0'));
  put('P1_Line10_SSN[0]', digits(str(a, 'ssn')));
  for (let i = 1; i <= chain(a, 'otherName', 2, a['otherName.more0'] === 'yes'); i++)
    name(`otherName${i}`, [`Part1_Line11_FamilyName${i}[0]`, `Part1_Line11_GivenName${i}[0]`, `Part1_Line11_MiddleName${i}[0]`]);
  // Items 12-14: when the beneficiary is the spouse, the current spouse is the beneficiary.
  const married = spouse || (a.relationship === 'U' && a['pet.married'] === 'yes');
  if (married) {
    name(spouse ? 'ben.name' : 'pet.spouse', ['Pt1Line12_FamilyName[0]', 'Pt1Line12_GivenName[0]', 'Pt1Line12_MiddleName[0]']);
    put('Pt1_Line13_DateofPresentMarriage[0]', str(a, 'pet.marriage.date'));
    place('pet.marriage', ['Pt1_Line14_CityTown[0]', 'Pt1_Line14_StateorProvince[0]', 'Pt1_Line14_Country[0]']);
  }
  const petPrior = [
    { name: ['Part1_Line15_FamilyName1[0]', 'Part1_Line15_GivenName1[0]', 'Part1_Line15_MiddleName1[0]'], ended: 'Pt1Line16_DateofPriorMarriage[0]', place: ['Pt1Line17_CityTown[0]', 'Pt1Line17_StateorProvince[0]', 'Pt1Line17_Country[0]'] },
    { name: ['Part1_Line18_FamilyName[0]', 'Part1_Line18_GivenName[0]', 'Part1_Line18_MiddleName[0]'], ended: 'Pt1Line19_DateofPriorMarriage[0]', place: ['Pt1Line19_CityTown[0]', 'Pt1Line19_StateorProvince[0]', 'Pt1Line19_Country[0]'] },
  ];
  for (let i = 1; i <= chain(a, 'pet.prior', 2, a['pet.prior.more0'] === 'yes'); i++) {
    const f = petPrior[i - 1];
    name(`pet.prior${i}`, f.name);
    put(f.ended, str(a, `pet.prior${i}.ended`));
    place(`pet.prior${i}.endPlace`, f.place);
  }
  if (a.status === 'ASL' || a.status === 'LAS') {
    put('Pt1Line21_DateofAsyleeStatus[0]', str(a, 'grant.date'));
    put('Pt1Line22_CityTown[0]', str(a, 'grant.city'));
    put('Pt1Line22_StateorProvince[0]', str(a, 'grant.state').toUpperCase());
  }
  if (a.status === 'REF' || a.status === 'LRE') {
    put('Pt1Line23_DateRefugeeStatusApproved[0]', str(a, 'refugee.date'));
    place('refugee', ['Pt1Line24_CityTown[0]', 'Pt1Line24_StateorProvince[0]', 'Pt1Line24_Country[0]']);
    put('Pt1Line25_DateRefugeeStatusApproved[0]', str(a, 'admit.date'));
    put('Pt1Line26_CityTown[0]', str(a, 'admit.city'));
    put('Pt1Line26_State[0]', str(a, 'admit.state').toUpperCase());
  }

  // Part 2.
  name('ben.name', ['Pt2_Line1_FamilyName[0]', 'Pt2_Line1_GivenName[0]', 'Pt1_Line1_MiddleName[0]']);
  address('ben.home', P2_HOME);
  if (a['ben.mailingSame'] === 'no') address('ben.mailing', P2_MAIL);
  put('TelephoneNumber\\.[1]', str(a, 'ben.phone'));
  put('BeneficiaryE-mailAddress[0]', str(a, 'ben.email'));
  if (a['ben.sex'] === 'male') check.push('sex[2]');
  if (a['ben.sex'] === 'female') check.push('sex[3]');
  put('DateofBirth[1]', str(a, 'ben.dob'));
  put('CountryofBirth[1]', str(a, 'ben.birthCountry'));
  put('CountryofCitizenshipNationality[1]', str(a, 'ben.citizenship'));
  const benA = digits(str(a, 'ben.aNumber'));
  if (benA) put('Part2_Iine9_AlienNum[0]', benA.padStart(9, '0'));
  put('Part2_Iine9_SSN[0]', digits(str(a, 'ben.ssn')));
  for (let i = 1; i <= chain(a, 'benOtherName', 2, a['benOtherName.more0'] === 'yes'); i++)
    name(`benOtherName${i}`, [`Part2_Line11_FamilyName${i}[0]`, `Part2_Line11_GivenName${i}[0]`, `Part2_Line11_MiddleName${i}[0]`]);
  if (spouse) {
    name('name', ['Part2_Line12_FamilyName[0]', 'Part2_Line12_GivenName[0]', 'Part2_Line12_MiddleName[0]']);
    put('Part2_Line13_DateofPresentMarriage[0]', str(a, 'pet.marriage.date'));
    place('pet.marriage', ['Part2_Line14_CityTown[0]', 'Part2_Line14_StateorProvince[0]', 'Part2_Line14_Country[0]']);
  }
  const benPrior = [
    { name: ['Part2_Line15_FamilyName[0]', 'Part2_Line15_GivenName[0]', 'Part2_Line15_MiddleName[0]'], ended: 'Part2_Line16_DateofPriorMarriage[0]', place: ['Part2_Line17_CityTown[0]', 'Part2_Line17_StateorProvince[0]', 'Part2_Line17_Country[0]'] },
    { name: ['Part2_Line18_FamilyName[0]', 'Part2_Line18_GivenName[0]', 'Part2_Line18_MiddleName[0]'], ended: 'Part2_Line19_DateofPriorMarriage[0]', place: ['Part2_Line20_CityTown[0]', 'Part2_Line20_StateorProvince[0]', 'Part2_Line20_Country[0]'] },
  ];
  for (let i = 1; i <= chain(a, 'ben.prior', 2, a['ben.prior.more0'] === 'yes'); i++) {
    const f = benPrior[i - 1];
    name(`ben.prior${i}`, f.name);
    put(f.ended, str(a, `ben.prior${i}.ended`));
    place(`ben.prior${i}.endPlace`, f.place);
  }

  // Item 21: A = in the U.S., B = abroad. Item 22 repeats the name and mailing address abroad.
  if (a['ben.location'] === 'A') checkValue.push(['Part2_Beneficiary', 'A']);
  if (a['ben.location'] === 'B') {
    checkValue.push(['Part2_Beneficiary', 'B']);
    put('Pt2_CityCountry[0]', str(a, 'ben.consulate.place'));
    const native = ['Part2_Line22_FamilyName[0]', 'Part2_Line22_GivenName[0]', 'Part2_Line22_MiddleName[0]'];
    if (a['ben.nativeSame'] === 'yes') {
      name('ben.name', native);
      address(a['ben.mailingSame'] === 'no' ? 'ben.mailing' : 'ben.home', P2_NATIVE);
    } else if (a['ben.nativeSame'] === 'no') {
      name('ben.native', native);
      address('ben.native', P2_NATIVE);
    }
  }

  // Items 23-26.
  const court = str(a, 'ben.court');
  if (['A', 'B', 'C', 'D'].includes(court)) checkValue.push(['Part2_Bene_Info', court]);
  if (court === 'B') put('Pt2_CourtProceedings[0]', str(a, 'ben.court.where'));
  if (court === 'D') put('Pt2_PastCourtProceedings[0]', str(a, 'ben.court.where'));
  put('Pt2_Line24_BenNativeLanguage[0]', str(a, 'ben.nativeLanguage'));
  if (a['ben.english'] === 'yes') checkValue.push(['Part2_bene_english', 'Y']);
  if (a['ben.english'] === 'no') checkValue.push(['Part2_bene_english', 'N']);
  put('Pt2_Line26_FluentLanguage[0]', str(a, 'ben.otherLanguages'));

  // Items 27-48.
  const entries = ['B', 'C', 'D'].includes(court) ? chain(a, 'entry', 2, a['entry.more0'] === 'yes') : 0;
  for (let i = 1; i <= entries; i++) {
    const f = ENTRIES[i - 1];
    const v = (k: string) => str(a, `entry${i}.${k}`);
    put(f.date, v('date'));
    put(f.city, v('city'));
    state(f.state, v('state'));
    put(f.status, v('status'));
    put(f.i94, v('i94').replace(/[\s-]/g, '').toUpperCase());
    put(f.expires, v('expires'));
    put(f.passport, v('passport'));
    put(f.passportExpires, v('passportExpires'));
    put(f.passportCountry, v('passportCountry'));
    put(f.travelDoc, v('travelDoc'));
    put(f.travelDocExpires, v('travelDocExpires'));
    put(f.travelDocCountry, v('travelDocCountry'));
  }

  // Part 3: the printed Yes box exports "N" and the No box "Y".
  if (a.late === 'yes') checkValue.push(['Part3_2year', 'N']);
  if (a.late === 'no') checkValue.push(['Part3_2year', 'Y']);

  // Part 5. The signature (Item 6) and its date stay empty: they are written by hand.
  if (a.readsEnglish === 'A' || a.readsEnglish === 'B') checkValue.push(['P5_Line1_Checkbox', str(a, 'readsEnglish')]);
  if (a.readsEnglish === 'B') put('P5_Line1b_NameofInterpreter[0]', str(a, 'fluentLanguage'));
  if (a.preparer === 'yes') {
    check.push('P5_Line2_Checkbox[0]');
    put('P5_Line2b_Consented[0]', str(a, 'preparer.name'));
  }
  put('P5_Line3_PetitionerDayTel[0]', digits(str(a, 'phone')).replace(/^1(?=\d{10}$)/, ''));
  put('P5_Line4_PetitionerMobileTel[0]', digits(str(a, 'mobile')).replace(/^1(?=\d{10}$)/, ''));
  put('P5_Line5_PetitionerEmailAddress[0]', str(a, 'email'));

  // Parts 7 and 8. Signatures and dates stay empty.
  const phone = (s: string) => digits(s).replace(/^1(?=\d{10}$)/, '');
  const helper = (h: HelperPerson, f: AddressFields) => {
    put(f.street, h.street);
    const u = parseUnit(h.unit);
    if (u) {
      checkValue.push([f.unit, u.kind]);
      put(f.number, u.number);
    }
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
    put('P7_Line1a_InterpreterFamilyName[0]', h.family);
    put('P7_Line1b_InterpreterGivenName[0]', h.given);
    put('P7_Line2_InterpreterBusiness[0]', h.business);
    helper(h, P7_ADDRESS);
    put('P7_Line4_DayTelephone[0]', phone(h.phone));
    put('P7_Line5_MobileTelephone[0]', phone(h.mobile));
    put('P7_Line6_InterEmailAddress[0]', h.email);
    put('P7_Language[0]', h.language);
  }
  if (help.preparer) {
    const h = help.preparer;
    put('P8_Line1a_PrepFamilyName[0]', h.family);
    put('P8_Line1a_PrepGivenName[0]', h.given);
    put('P8_Line1a_PrepBusiness[0]', h.business);
    helper(h, P8_ADDRESS);
    put('P8_Line4_DayTelephone[0]', phone(h.phone));
    put('P8_Line5_MobileTelephone[0]', phone(h.mobile));
    put('P8_Line6_PrepEmailAddress[0]', h.email);
    if (h.statement === 'notAttorney') checkValue.push(['Pt8_Line7_chkbx', 'A']);
    if (h.statement === 'attorneyExtends' || h.statement === 'attorneyNotExtends') checkValue.push(['Pt8_Line7_chkbx', 'B']);
    if (h.statement === 'attorneyExtends') check.push('Pt8_Line7b_Extend[0]');
    if (h.statement === 'attorneyNotExtends') check.push('Pt8_Line7b_DoesNotExtend[0]');
  }

  return { text, check, checkValue, select, explanation: a.late === 'yes' ? str(a, 'late.explain') : '' };
}

const EXPLAIN_SIZE = 9;

/** Fills the official I-730 PDF with the answers and returns the new file's bytes. */
export async function fillI730(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const index = firstFieldIndex(form);
  const plan = planI730(a);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
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

  // Part 3's explanation stays in its box when it fits; otherwise the box points to added pages.
  if (plan.explanation) {
    const box = textField('Explanation[0]');
    const { width, height } = box.acroField.getWidgets()[0].getRectangle();
    const lines = wrap(toFormText(plan.explanation), font, EXPLAIN_SIZE, width - 8);
    box.enableMultiline();
    if (lines.length * EXPLAIN_SIZE * 1.2 <= height - 4) setFieldText(box, lines.join('\n'), EXPLAIN_SIZE);
    else {
      setFieldText(box, 'See the attached continuation sheet (Page 7, Part 3, Item 1).', EXPLAIN_SIZE);
      addContinuation(doc, a, plan.explanation, font, bold);
    }
  }

  doc.setTitle('Form I-730, Refugee/Asylee Relative Petition');
  return doc.save();
}

/** Appends letter-size pages holding the Part 3 explanation, headed with the petitioner's name and A-Number. */
function addContinuation(doc: PDFDocument, a: Answers, explanation: string, font: Awaited<ReturnType<PDFDocument['embedFont']>>, bold: typeof font) {
  const [w, h, margin, size] = [612, 792, 54, 10];
  const lines = wrap(toFormText(explanation), font, size, w - 2 * margin);
  const who = toFormText([str(a, 'name.given'), str(a, 'name.middle'), str(a, 'name.family')].filter(Boolean).join(' '));
  const aNumber = digits(str(a, 'aNumber'));
  let page = doc.addPage([w, h]);
  let y = h - margin;
  const header = () => {
    page.drawText('Form I-730 - Continuation Sheet', { x: margin, y, size: 12, font: bold });
    y -= 18;
    page.drawText(`Petitioner: ${who}${aNumber ? `   A-Number: A-${aNumber.padStart(9, '0')}` : ''}`, { x: margin, y, size, font });
    y -= 14;
    page.drawText('Page 7, Part 3. Two-Year Filing Deadline, Item 1 (explanation of the delay)', { x: margin, y, size, font: bold });
    y -= 20;
  };
  header();
  for (const line of lines) {
    if (y < margin) {
      page = doc.addPage([w, h]);
      y = h - margin;
      header();
    }
    page.drawText(line, { x: margin, y, size, font, color: rgb(0, 0, 0) });
    y -= size * 1.35;
  }
}
