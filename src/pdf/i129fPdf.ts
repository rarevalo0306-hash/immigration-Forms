import { PDFCheckBox, PDFDocument, PDFDropdown, type PDFField, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { CRIME_ITEMS } from '../forms/i129f';
import { parseUnit } from '../engine/validation';
import { assistance } from '../forms/assistance';
import { fieldIndex, optionBoxes, selectOption, setFieldText } from './common';

// Fields of USCIS Form I-129F, edition 01/20/25 (public/forms/i-129f.pdf), named by the last segment
// of their full name and placed by where they sit on the printed page. Several names point at
// another item: Item 41 is "Pt1Line20_Checkboxes", Item 42 is "Pt1Line21*", the beneficiary's
// Parent 1 date of birth is "Pt1Line11_DateofBirth", the native-alphabet city is "Pt2Line28c", and
// the eye-color boxes printed as Gray and Green export each other's values. The mapping follows the
// page, not the names. Most Apt./Ste./Flr. boxes export each other's values, so those are picked
// by position too.

export interface I129FPlan {
  text: Record<string, string>;
  check: string[];
  checkValue: [string, string][];
  /** [base, APT | STE | FLR]: picked by position, since most of this edition's unit boxes export the wrong value. */
  unit: [string, string][];
  select: Record<string, string>;
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');

interface AddressFields {
  careOf?: string;
  street: string;
  unit: string;
  number: string;
  city: string;
  state?: string;
  zip?: string;
  province?: string;
  postal?: string;
  country?: string;
}

const prefixed = (p: string, opts: { careOf?: string; usOnly?: boolean; abroadOnly?: boolean } = {}): AddressFields => ({
  careOf: opts.careOf,
  street: `${p}_StreetNumberName[0]`,
  unit: `${p}_Unit`,
  number: `${p}_AptSteFlrNumber[0]`,
  city: `${p}_CityOrTown[0]`,
  state: opts.abroadOnly ? undefined : `${p}_State[0]`,
  zip: opts.abroadOnly ? undefined : `${p}_ZipCode[0]`,
  province: opts.usOnly ? undefined : `${p}_Province[0]`,
  postal: opts.usOnly ? undefined : `${p}_PostalCode[0]`,
  country: opts.usOnly ? undefined : `${p}_Country[0]`,
});

/** Parent blocks: name, date of birth, sex, country of birth, city and country of residence. */
const PARENTS = {
  'pet.parent1': { name: 'Pt1Line27', dob: 'Pt1Line28_DateofBirth[0]', sex: 'Pt1Line29_Checkbox', birth: 'Pt1Line30_CountryOfCitzOrNationality[0]', city: 'Pt1Line31_CityTownOfBirth[0]', country: 'Pt1Line31_CountryOfCitzOrNationality[0]' },
  'pet.parent2': { name: 'Pt1Line32', dob: 'Pt1Line33_DateofBirth[0]', sex: 'Pt1Line34_Checkbox', birth: 'Pt1Line35_CountryOfCitzOrNationality[0]', city: 'Pt1Line36a_CityTownOfBirth[0]', country: 'Pt1Line36b_CountryOfCitzOrNationality[0]' },
  'ben.parent1': { name: 'Pt2Line24', dob: 'Pt1Line11_DateofBirth[0]', sex: 'Pt2Line26_Checkbox', birth: 'Pt2Line27_CountryOfCitzOrNationality[0]', city: 'Pt2Line28a_CityTownOfBirth[0]', country: 'Pt2Line28b_CountryOfCitzOrNationality[0]' },
  'ben.parent2': { name: 'Pt2Line29', dob: 'Pt2Line30_DateofBirth[0]', sex: 'Pt2Line31_Checkbox', birth: 'Pt2Line32_CountryOfCitzOrNationality[0]', city: 'Pt2Line33a_CityTownOfBirth[0]', country: 'Pt2Line33b_CountryOfCitzOrNationality[0]' },
};

/** Address history and jobs, by person: item numbers of each block. */
const PEOPLE = {
  pet: { mailing: prefixed('Pt1Line8', { careOf: 'Pt1Line8_InCareofName[0]' }), home: ['Pt1Line9', 'Pt1Line10', 'Pt1Line11', 'Pt1Line12'], job1: ['Pt1Line13', 'Pt1Line14', 'Pt1Line15', 'Pt1Line16'], job2: ['Pt1Line17', 'Pt1Line18', 'Pt1Line19', 'Pt1Line20'] },
  ben: { mailing: prefixed('Pt2Line11', { careOf: 'Pt2Line11_InCareOfName[0]' }), home: ['Pt2Line12', 'Pt2Line13', 'Pt2Line14', 'Pt2Line15'], job1: ['Pt2Line16', 'Pt2Line17', 'Pt2Line18', 'Pt2Line19'], job2: ['Pt2Line20', 'Pt2Line21', 'Pt2Line22', 'Pt2Line23'] },
};

const RACE: Record<string, string> = { HW: 'Pt4Line2_Checkbox[0]', AI: 'Pt4Line2_Checkbox[1]', WH: 'Pt4Line2_Checkbox[2]', AS: 'Pt4Line2_Checkbox[3]', BL: 'Pt4Line2_Checkbox[4]' };
// The boxes printed as Gray and Green export "GRN" and "GRY".
const EYES: Record<string, string> = { BN: 'BRO', BL: 'BLK', HA: 'HAZ', GN: 'GRY', BU: 'BLU', GR: 'GRN', MA: 'MAR', PN: 'PNK', UN: 'UNK' };
const HAIR: Record<string, string> = { BL: 'BLK', BR: 'BRO', BN: 'BLN', GR: 'GRY', WH: 'WHI', RD: 'RED', SA: 'SDY', NH: 'BAL', OT: 'UNK' };
const CRIME_BOXES: Record<string, string> = { 'crime.1': 'Pt3Line1_Checkboxes', 'crime.2a': 'P3Line2a_Checkboxes', 'crime.2b': 'P3Line2b_Checkboxes', 'crime.2c': 'P3Line2c_Checkboxes', 'crime.4a': 'Part3Line4a_Checkboxes' };

export function planI129F(a: Answers): I129FPlan {
  const text: Record<string, string> = {};
  const check: string[] = [];
  const checkValue: [string, string][] = [];
  const unitBoxes: [string, string][] = [];
  const select: Record<string, string> = {};
  const put = (field: string, value: string) => {
    if (value) text[field] = value;
  };
  const yn = (base: string, value: unknown) => {
    if (value === 'yes') checkValue.push([base, 'Y']);
    if (value === 'no') checkValue.push([base, 'N']);
  };
  const name = (p: string, id: string) => {
    put(`${p}a_FamilyName[0]`, str(a, `${id}.family`));
    put(`${p}b_GivenName[0]`, str(a, `${id}.given`));
    put(`${p}c_MiddleName[0]`, str(a, `${id}.middle`));
  };
  const address = (prefix: string, f: AddressFields) => {
    if (f.careOf) put(f.careOf, str(a, `${prefix}.careOf`));
    put(f.street, str(a, `${prefix}.street`));
    const unit = parseUnit(str(a, `${prefix}.unit`));
    if (unit) {
      unitBoxes.push([f.unit, unit.kind]);
      put(f.number, unit.number);
    }
    put(f.city, str(a, `${prefix}.city`));
    const st = str(a, `${prefix}.state`).toUpperCase();
    if (f.state && st) select[f.state] = st;
    if (f.zip) put(f.zip, str(a, `${prefix}.zip`));
    if (f.province) put(f.province, str(a, `${prefix}.province`));
    if (f.postal) put(f.postal, str(a, `${prefix}.postal`));
    if (f.country) put(f.country, str(a, `${prefix}.country`));
  };
  const sex = (base: string, value: unknown) => {
    if (value === 'male') checkValue.push([base, 'M']);
    if (value === 'female') checkValue.push([base, 'F']);
  };
  const aNum = (field: string, value: string) => {
    const n = digits(value);
    if (n) put(field, n.padStart(9, '0'));
  };

  // Part 1: classification and the petitioner. The name and A-Number repeat at the top of Part 8.
  aNum('Pt1Line1_AlienNumber[0]', str(a, 'pet.aNumber'));
  aNum('Pt1Line1_AlienNumber[1]', str(a, 'pet.aNumber'));
  put('Pt1Line2_AcctIdentifier[0]', digits(str(a, 'pet.uscisAccount')));
  put('Pt1Line3_SSN[0]', digits(str(a, 'pet.ssn')));
  if (a.classification === 'A' || a.classification === 'B') checkValue.push(['Pt1Line4a_Checkboxes', str(a, 'classification')]);
  if (a.classification === 'B') yn('Pt1Line5_Checkboxes', a.filedI130);
  for (const i of [0, 1]) {
    put(`Pt1Line6a_FamilyName[${i}]`, str(a, 'pet.family'));
    put(`Pt1Line6b_GivenName[${i}]`, str(a, 'pet.given'));
    put(`Pt1Line6c_MiddleName[${i}]`, str(a, 'pet.middle'));
  }
  if (a['pet.otherName.has'] === 'yes') name('Pt1Line7', 'pet.otherName');

  // Address history and jobs, the same way for both people. Physical address 1 is the current one:
  // the mailing address when the person lives there.
  for (const who of ['pet', 'ben'] as const) {
    const p = PEOPLE[who];
    address(`${who}.mailing`, p.mailing);
    // Only the petitioner's block has a box for it; for the beneficiary it only picks physical address 1.
    if (who === 'pet') yn('Pt1Line8j_Checkboxes', a['pet.mailingSame']);
    const [home1, home1Dates, home2, home2Dates] = p.home;
    address(a[`${who}.mailingSame`] === 'yes' ? `${who}.mailing` : `${who}.home1`, prefixed(home1));
    put(`${home1Dates}a_DateFrom[0]`, str(a, `${who}.home1.from`));
    put(`${home1Dates}b_ToFrom[0]`, 'PRESENT');
    if (a[`${who}.home2Has`] === 'yes') {
      address(`${who}.home2`, prefixed(home2));
      put(`${home2Dates}a_DateFrom[0]`, str(a, `${who}.home2.from`));
      put(`${home2Dates}b_ToFrom[0]`, str(a, `${who}.home2.to`));
    }
    for (const n of [1, 2] as const) {
      if (n === 2 && a[`${who}.job2Has`] !== 'yes') continue;
      const [nameItem, addressItem, occupationItem, datesItem] = p[`job${n}`];
      const id = `${who}.job${n}`;
      if (!str(a, `${id}.name`)) continue;
      put(`${nameItem}_NameofEmployer[0]`, str(a, `${id}.name`));
      address(id, prefixed(addressItem));
      put(`${occupationItem}_Occupation[0]`, str(a, `${id}.occupation`));
      put(`${datesItem}a_DateFrom[0]`, str(a, `${id}.from`));
      put(`${datesItem}b_ToFrom[0]`, n === 1 ? 'PRESENT' : str(a, `${id}.to`));
    }
  }

  sex('Pt1Line21_Checkbox', a['pet.sex']);
  put('Pt1Line22_DateofBirth[0]', str(a, 'pet.dob'));
  if (str(a, 'pet.marital')) checkValue.push(['Pt1Line23_Checkbox', str(a, 'pet.marital')]);
  put('Pt1Line24_CityTownOfBirth[0]', str(a, 'pet.birthCity'));
  put('Pt1Line25_ProvinceOrStateOfBirth[0]', str(a, 'pet.birthState'));
  put('Pt1Line26_CountryOfCitzOrNationality[0]', str(a, 'pet.birthCountry'));
  for (const [id, f] of Object.entries(PARENTS)) {
    name(f.name, id);
    put(f.dob, str(a, `${id}.dob`));
    sex(f.sex, a[`${id}.sex`]);
    put(f.birth, str(a, `${id}.birthCountry`));
    put(f.city, str(a, `${id}.city`));
    put(f.country, str(a, `${id}.country`));
  }
  yn('Pt1Line37_Checkboxes', a['pet.prevMarried']);
  if (a['pet.prevMarried'] === 'yes') {
    name('Pt1Line38', 'pet.prevSpouse');
    put('Pt1Line39_DateMarriageEnded[0]', str(a, 'pet.prevSpouse.ended'));
  }
  if (['A', 'B', 'C'].includes(str(a, 'pet.citizenVia'))) checkValue.push(['Pt1Line40_Checkbox', str(a, 'pet.citizenVia')]);
  if (a['pet.citizenVia'] === 'B' || a['pet.citizenVia'] === 'C') {
    yn('Pt1Line20_Checkboxes', a['pet.certificate']);
    if (a['pet.certificate'] === 'yes') {
      put('Pt1Line21a_CertificateNumber[0]', str(a, 'pet.cert.number'));
      put('Pt1Line21b_PlaceofIssuance[0]', str(a, 'pet.cert.place'));
      put('Pt1Line21c_DateOfIssuance[0]', str(a, 'pet.cert.date'));
    }
  }
  yn('Pt1Line43_Checkboxes', a['pet.priorPetition']);
  if (a['pet.priorPetition'] === 'yes') {
    aNum('Pt1Line44_AlienNumber[0]', str(a, 'pet.prior.aNumber'));
    name('Pt1Line45', 'pet.prior');
    put('Pt1Line46_DateOfFiling[0]', str(a, 'pet.prior.date'));
    put('Pt1Line47_Result[0]', str(a, 'pet.prior.result'));
  }
  yn('Pt1Line48_Checkboxes', a['pet.kids']);
  if (a['pet.kids'] === 'yes') {
    put('Pt1Line49a_Age[0]', digits(str(a, 'pet.kid1.age')));
    put('Pt1Line49b_Age[0]', digits(str(a, 'pet.kid2.age')));
  }
  for (const n of [1, 2]) {
    const st = str(a, `pet.res${n}.state`).toUpperCase();
    if (st) select[`Pt1Line5${n - 1}a_State[0]`] = st;
    put(`Pt1Line5${n - 1}b_CountryOfCitzOrNationality[0]`, str(a, `pet.res${n}.country`));
  }

  // Part 2: the beneficiary.
  name('Pt2Line1', 'ben');
  aNum('Pt2Line2_AlienNumber[0]', str(a, 'ben.aNumber'));
  put('Pt2Line3_SSN[0]', digits(str(a, 'ben.ssn')));
  put('Pt2Line4_DateOfBirth[0]', str(a, 'ben.dob'));
  sex('Pt2Line5_Checkboxes', a['ben.sex']);
  if (str(a, 'ben.marital')) checkValue.push(['Pt2Line6_Checkboxes', str(a, 'ben.marital')]);
  put('Pt2Line7_CityTownOfBirth[0]', str(a, 'ben.birthCity'));
  put('Pt2Line8_CountryOfBirth[0]', str(a, 'ben.birthCountry'));
  put('Pt2Line9_CountryofCitzOrNationality[0]', str(a, 'ben.citizenship'));
  if (a['ben.otherName.has'] === 'yes') name('Pt2Line10', 'ben.otherName');
  yn('Pt2Line34_Checkboxes', a['ben.prevMarried']);
  if (a['ben.prevMarried'] === 'yes') {
    name('Pt2Line35', 'ben.prevSpouse');
    put('Pt2Line36_DateMarriageEnded[0]', str(a, 'ben.prevSpouse.ended'));
  }
  yn('Pt2Line37_Checkboxes', a['ben.everInUS']);
  if (a['ben.everInUS'] === 'yes' && a['ben.inUSNow'] === 'yes') {
    put('Pt2Line38a_LastArrivedAs[0]', str(a, 'ben.entry.as'));
    put('Pt2Line38b_ArrivalDeparture[0]', digits(str(a, 'ben.entry.i94')));
    put('Pt2Line38c_DateofArrival[0]', str(a, 'ben.entry.date'));
    put('Pt2Line38d_DateExpired[0]', str(a, 'ben.entry.until'));
    put('Pt2Line38e_Passport[0]', str(a, 'ben.passport'));
    put('Pt2Line38f_TravelDoc[0]', str(a, 'ben.travelDoc'));
    put('Pt2Line38g_CountryOfIssuance[0]', str(a, 'ben.passportCountry'));
    put('Pt2Line38h_ExpDate[0]', str(a, 'ben.passportExpires'));
  }
  yn('Pt2Line39_Checkboxes', a['ben.kids']);
  if (a['ben.kids'] === 'yes') {
    name('Pt2Line40', 'ben.kid');
    put('Pt2Line41_CountryOfBirth[0]', str(a, 'ben.kid.birthCountry'));
    put('Pt2Line42_DateofBirth[0]', str(a, 'ben.kid.dob'));
    yn('Pt2Line43_Checkboxes', a['ben.kid.withBen']);
    if (a['ben.kid.withBen'] === 'no') address('ben.kid.home', prefixed('Pt2Line44'));
  }
  address('ben.us', { street: 'Pt2Line45a_StreetNumberName[0]', unit: 'Pt2Line45b_Unit', number: 'Pt2Line45b_AptSteFlrNumber[0]', city: 'Pt2Line45c_CityOrTown[0]', state: 'Pt2Line45d_State[0]', zip: 'Pt2Line45e_ZipCode[0]' });
  put('Pt2Line46_DayTimeTelephoneNumber[0]', digits(str(a, 'ben.us.phone')));
  address('ben.abroad', prefixed('Pt2Line47', { abroadOnly: true }));
  put('Pt2Line48_DaytimeTelephoneNum[0]', digits(str(a, 'ben.abroad.phone')));
  if (['Y', 'N', 'A'].includes(str(a, 'related'))) checkValue.push(['Pt2Line51_Checkboxes', str(a, 'related')]);
  if (a.related === 'Y') put('Pt2Line52_Relationship[0]', str(a, 'related.how'));
  if (['Y', 'N', 'A'].includes(str(a, 'met'))) checkValue.push(['Pt2Line53_Checkboxes', str(a, 'met')]);
  if (a.met === 'Y' || a.met === 'N') put('Pt2Line54_Describe[0]', str(a, 'met.describe'));
  yn('Pt2Line55_Checkboxes', a.imb);
  if (a.imb === 'yes') {
    put('Pt2Line56_IMBName[0]', str(a, 'imb.name'));
    put('Pt2Line57a_IMBFamilyName[0]', str(a, 'imb.family'));
    put('Pt2Line57b_IMB_GivenName[0]', str(a, 'imb.given'));
    put('Pt2Line58_IMBOrgName[0]', str(a, 'imb.org'));
    put('Pt2Line59_IMBWebsite[0]', str(a, 'imb.website'));
    address('imb', { ...prefixed('Pt2Line60', { abroadOnly: true }), street: 'Pt2Line60a_StreetNumberName[0]' });
    put('Pt2Line61_DaytimeTelephoneNum[0]', digits(str(a, 'imb.phone')));
  }
  put('Pt2Line62a_CityTown[0]', str(a, 'consulate.city'));
  put('Pt2Line62b_Country[0]', str(a, 'consulate.country'));

  // Part 3: criminal information and waivers.
  for (const item of CRIME_ITEMS) yn(CRIME_BOXES[item.id], a[item.id]);
  if (['crime.2a', 'crime.2b', 'crime.2c'].some((id) => a[id] === 'yes')) {
    for (const v of Array.isArray(a['crime.battered']) ? a['crime.battered'] : []) if ('ABC'.includes(v)) checkValue.push(['Pt3Line3_Checkboxes', v]);
  }
  if (CRIME_ITEMS.some((i) => a[i.id] === 'yes')) put('Pt3Line4B_Describe[0]', str(a, 'crime.describe'));
  if (['A', 'B', 'C', 'D'].includes(str(a, 'waiver'))) checkValue.push(['Pt3Line5_Checkboxes', str(a, 'waiver')]);

  // Part 4: biographic information.
  if (a.ethnicity === 'hispanic') checkValue.push(['Pt4Line1_Checkbox', 'H']);
  if (a.ethnicity === 'notHispanic') checkValue.push(['Pt4Line1_Checkbox', 'N']);
  for (const r of Array.isArray(a.race) ? a.race : []) if (RACE[r]) check.push(RACE[r]);
  if (a.heightFeet) select['Pt4Line3_HeightFeet[0]'] = str(a, 'heightFeet');
  if (a.heightInches) select['Pt4Line3_HeightInches[0]'] = str(a, 'heightInches');
  const weight = digits(str(a, 'weight'));
  if (weight) {
    const w = weight.padStart(3, '0').slice(-3);
    [0, 1, 2].forEach((i) => put(`Pt4Line4_HeightInches${i + 1}[0]`, w[i]));
  }
  if (EYES[str(a, 'eyes')]) checkValue.push(['Pt4Line5_Checkbox', EYES[str(a, 'eyes')]]);
  if (HAIR[str(a, 'hair')]) checkValue.push(['Pt4Line6_HairColor', HAIR[str(a, 'hair')]]);

  // Part 5: contact. The signature (Item 4) stays empty: it must be signed by hand.
  put('Pt5Line1_DaytimePhoneNumber1[0]', digits(str(a, 'phone')));
  put('Pt5Line2_MobileNumber1[0]', digits(str(a, 'mobile')));
  put('Pt5Line3_Email[0]', str(a, 'email'));

  // Parts 6–7: the interpreter and the preparer; their signatures and dates stay empty. This edition
  // has no address or statement boxes for them. The interpreter's mobile (Item 4) is the second
  // "Pt6Line4_InterpreterDaytimeTelephone"; "Pt6Line4_Signature" is the petitioner's signature.
  const phone = (s: string) => digits(s).replace(/^1(?=\d{10}$)/, '');
  const help = assistance(a, { interpreter: a.readsEnglish === 'B', preparer: a.preparer === 'yes' });
  if (help.interpreter) {
    const p = help.interpreter;
    put('Pt6Line1_InterpreterFamilyName[0]', p.family);
    put('Pt6Line1_InterpreterGivenName[0]', p.given);
    put('Pt6Line2_NameofBusinessorOrgName[0]', p.business);
    put('Pt6Line4_InterpreterDaytimeTelephone[0]', phone(p.phone));
    put('Pt6Line4_InterpreterDaytimeTelephone[1]', phone(p.mobile));
    put('Pt6Line5_Email[0]', p.email);
    put('Pt6_NameOfLanguage[0]', p.language);
  }
  if (help.preparer) {
    const p = help.preparer;
    put('Pt7Line1_PreparerFamilyName[0]', p.family);
    put('Pt7Line1b_PreparerGivenName[0]', p.given);
    put('Pt7Line2_NameofBusinessorOrgName[0]', p.business);
    put('Pt7Line3_DaytimePhoneNumber1[0]', phone(p.phone));
    put('Pt7Line4_PreparerMobileNumber[0]', phone(p.mobile));
    put('Pt7Line5_Email[0]', p.email);
  }

  return { text, check, checkValue, unit: unitBoxes, select };
}

/**
 * The Apt., Ste. or Flr. box of an address, by where it sits: the boxes are printed in that order
 * from left to right, but most of this edition's export "FLR", "APT", "STE" in that order instead.
 */
export function unitBox(index: Map<string, PDFField>, base: string, kind: string): PDFCheckBox {
  const boxes = optionBoxes(index, base).map((o) => ({ box: o.box, x: o.box.acroField.getWidgets()[0].getRectangle().x }));
  if (boxes.length !== 3) throw new Error(`Expected 3 unit boxes in ${base}`);
  boxes.sort((p, q) => p.x - q.x);
  const i = ['APT', 'STE', 'FLR'].indexOf(kind);
  if (i < 0) throw new Error(`No "${kind}" unit`);
  return boxes[i].box;
}

/** Fills the official I-129F PDF with the answers and returns the new file's bytes. */
export async function fillI129F(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const index = fieldIndex(form);
  const plan = planI129F(a);
  const get = (name: string) => {
    const f = index.get(name);
    if (!f) throw new Error(`No such field: ${name}`);
    return f;
  };

  // Long text boxes may be rich-text fields, which pdf-lib can't read back when it redraws the
  // form; store them as plain text instead.
  for (const f of form.getFields()) if (f instanceof PDFTextField && f.isRichFormatted()) f.disableRichFormatting();

  for (const [name, raw] of Object.entries(plan.text)) {
    const field = get(name);
    if (!(field instanceof PDFTextField)) throw new Error(`Not a text field: ${name}`);
    setFieldText(field, raw, 9);
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
  for (const [base, kind] of plan.unit) unitBox(index, base, kind).check();
  for (const [name, value] of Object.entries(plan.select)) {
    const field = get(name);
    if (!(field instanceof PDFDropdown)) throw new Error(`Not a dropdown: ${name}`);
    selectOption(field, value);
  }

  doc.setTitle('Form I-129F, Petition for Alien Fiance(e)');
  return doc.save();
}
