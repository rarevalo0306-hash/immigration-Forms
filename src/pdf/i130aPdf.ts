import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { parseUnit } from '../engine/validation';
import { fieldIndex, optionBoxes, selectOption, setFieldText } from './common';

// Fields of USCIS Form I-130A, edition 04/01/24 (public/forms/i-130a.pdf), named by the last
// segment of their full name and placed by where they sit on the printed page. Several of the
// parents' fields carry another item's number in their name (the City of Residence of Parent 1
// is "Pt1Line14_CountryofBirth"); the mapping follows the page, not the names.

export interface I130APlan {
  text: Record<string, string>;
  check: string[];
  checkValue: [string, string][];
  select: Record<string, string>;
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');

interface AddressFields {
  street: string;
  unit: string;
  number: string;
  city: string;
  state?: string;
  zip?: string;
  province: string;
  postal: string;
  country: string;
}

/** Address blocks whose fields are lettered after the item number: 4.a street, 4.b unit, 4.c city… */
const lettered = (p: string): AddressFields => ({
  street: `${p}a_StreetNumberName[0]`,
  unit: `${p}b_Unit`,
  number: `${p}b_AptSteFlrNumber[0]`,
  city: `${p}c_CityOrTown[0]`,
  state: `${p}d_State[0]`,
  zip: `${p}e_ZipCode[0]`,
  province: `${p}f_Province[0]`,
  postal: `${p}g_PostalCode[0]`,
  country: `${p}h_Country[0]`,
});

export function planI130A(a: Answers): I130APlan {
  const text: Record<string, string> = {};
  const check: string[] = [];
  const checkValue: [string, string][] = [];
  const select: Record<string, string> = {};
  const put = (field: string, value: string) => {
    if (value) text[field] = value;
  };
  const address = (prefix: string, f: AddressFields) => {
    put(f.street, str(a, `${prefix}.street`));
    const unit = parseUnit(str(a, `${prefix}.unit`));
    if (unit) {
      checkValue.push([f.unit, unit.kind]);
      put(f.number, unit.number);
    }
    put(f.city, str(a, `${prefix}.city`));
    const st = str(a, `${prefix}.state`).toUpperCase();
    if (f.state && st) select[f.state] = st;
    if (f.zip) put(f.zip, str(a, `${prefix}.zip`));
    put(f.province, str(a, `${prefix}.province`));
    put(f.postal, str(a, `${prefix}.postal`));
    put(f.country, str(a, `${prefix}.country`));
  };

  // Part 1. The name repeats at the top of Part 7.
  const aNumber = digits(str(a, 'aNumber'));
  if (aNumber) put('Pt1Line1_AlienNumber[0]', aNumber.padStart(9, '0'));
  put('Pt2Line3_USCISELISActNumber[0]', digits(str(a, 'uscisAccount')));
  for (const i of [0, 1]) {
    put(`Pt1Line3a_FamilyName[${i}]`, str(a, 'name.family'));
    put(`Pt1Line3b_GivenName[${i}]`, str(a, 'name.given'));
    put(`Pt1Line3c_MiddleName[${i}]`, str(a, 'name.middle'));
  }

  address('home1', lettered('Pt1Line4'));
  put('Pt1Line5a_DateFrom[0]', str(a, 'home1.from'));
  if (str(a, 'home1.city')) put('Pt1Line5b_DateTo[0]', 'PRESENT');
  if (a['home.more'] === 'yes') {
    address('home2', lettered('Pt1Line6'));
    put('Pt1Line7a_DateFrom[0]', str(a, 'home2.from'));
    put('Pt1Line7b_DateTo[0]', str(a, 'home2.to'));
  }
  address('abroad', {
    street: 'Pt1Line8a_StreetNumberName[0]',
    unit: 'Pt1Line8b_Unit',
    number: 'Pt1Line8b_AptSteFlrNumber[0]',
    city: 'Pt1Line8c_CityOrTown[0]',
    province: 'Pt1Line8d_Province[0]',
    postal: 'Pt1Line8e_PostalCode[0]',
    country: 'Pt1Line8f_Country[0]',
  });
  put('Pt1Line9a_DateFrom[0]', str(a, 'abroad.from'));
  put('Pt1Line9b_DateTo[0]', str(a, 'abroad.to'));

  const parents = [
    { name: ['Pt1Line10_FamilyName[0]', 'Pt1Line10_GivenName[0]', 'Pt1Line10_MiddleName[0]'], dob: 'Pt1Line11_DateofBirth[0]', sex: 'Pt1Line12', birthCity: 'Pt1Line12CityTownOfBirth[0]', birthCountry: 'Pt1Line13_CountryofBirth[0]', city: 'Pt1Line14_CountryofBirth[0]', country: 'Pt1Line15_CountryofResidence[0]' },
    { name: ['Pt1Line16_FamilyName[0]', 'Pt1Line16_GivenName[0]', 'Pt1Line16_MiddleName[0]'], dob: 'Pt1Line17_DateofBirth[0]', sex: 'Pt1Line19', birthCity: 'Pt1Line18_CityTownOfBirth[0]', birthCountry: 'Pt1Line19_CountryofBirth[0]', city: 'Pt1Line20_CityTownVillageofRes[0]', country: 'Pt1Line21_CountryofResidence[0]' },
  ];
  parents.forEach((p, i) => {
    const id = `parent${i + 1}`;
    put(p.name[0], str(a, `${id}.family`));
    put(p.name[1], str(a, `${id}.given`));
    put(p.name[2], str(a, `${id}.middle`));
    put(p.dob, str(a, `${id}.dob`));
    if (a[`${id}.sex`] === 'male') check.push(`${p.sex}_Male[0]`);
    if (a[`${id}.sex`] === 'female') check.push(`${p.sex}_Female[0]`);
    put(p.birthCity, str(a, `${id}.birthCity`));
    put(p.birthCountry, str(a, `${id}.birthCountry`));
    put(p.city, str(a, `${id}.city`));
    put(p.country, str(a, `${id}.country`));
  });

  // Parts 2 and 3: employment. Employer 1 is the current job.
  const jobs = [
    { id: 'job1', name: 'Pt2Line1_EmployerOrCompName[0]', address: lettered('Pt2Line2'), occupation: 'Pt2Line3_Occupation[0]', from: 'Pt2Line4a_DateFrom[0]', to: 'Pt2Line4b_DateTo[0]' },
    { id: 'job2', name: 'Pt2Line5_EmployerOrCompName[0]', address: { street: 'Pt2Line6_StreetNumberName[0]', unit: 'Pt2Line6_Unit', number: 'Pt2Line6_AptSteFlrNumber[0]', city: 'Pt2Line6_CityOrTown[0]', state: 'Pt2Line6_State[0]', zip: 'Pt2Line6_ZipCode[0]', province: 'Pt2Line6_Province[0]', postal: 'Pt2Line6_PostalCode[0]', country: 'Pt2Line6_Country[0]' }, occupation: 'Pt2Line7_Occupation[0]', from: 'Pt2Line8a_DateFrom[0]', to: 'Pt2Line8b_DateTo[0]' },
    { id: 'abroadJob', name: 'Pt3Line1_EmployerOrCompName[0]', address: lettered('Pt3Line2'), occupation: 'Pt3Line3_Occupation[0]', from: 'Pt3Line4a_DateFrom[0]', to: 'Pt3Line4b_DateTo[0]' },
  ];
  for (const j of jobs) {
    if (!str(a, `${j.id}.name`)) continue;
    if (j.id === 'job2' && a['job.more'] !== 'yes') continue;
    if (j.id === 'abroadJob' && a['abroadJob.has'] !== 'yes') continue;
    put(j.name, str(a, `${j.id}.name`));
    address(j.id, j.address);
    put(j.occupation, str(a, `${j.id}.occupation`));
    put(j.from, str(a, `${j.id}.from`));
    put(j.to, j.id === 'job1' ? 'PRESENT' : str(a, `${j.id}.to`));
  }

  // Part 4. The signature (Item 6.a) stays empty: it must be signed by hand.
  if (a.readsEnglish === 'yes') checkValue.push(['Pt4Line1Checkbox', 'A']);
  if (a.readsEnglish === 'interpreter') {
    checkValue.push(['Pt4Line1Checkbox', 'B']);
    put('Pt4Line1b_Language[0]', str(a, 'fluentLanguage'));
  }
  put('Pt4Line3_DaytimePhoneNumber1[0]', digits(str(a, 'phone')));
  put('Pt4Line4_MobileNumber1[0]', digits(str(a, 'mobile')));
  put('Pt4Line5_Email[0]', str(a, 'email'));

  return { text, check, checkValue, select };
}

/** Fills the official I-130A PDF with the answers and returns the new file's bytes. */
export async function fillI130A(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const index = fieldIndex(doc.getForm());
  const plan = planI130A(a);
  const get = (name: string) => {
    const f = index.get(name);
    if (!f) throw new Error(`No such field: ${name}`);
    return f;
  };

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
  for (const [name, value] of Object.entries(plan.select)) {
    const field = get(name);
    if (!(field instanceof PDFDropdown)) throw new Error(`Not a dropdown: ${name}`);
    selectOption(field, value);
  }

  doc.setTitle('Form I-130A, Supplemental Information for Spouse Beneficiary');
  return doc.save();
}
