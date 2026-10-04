import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { parseUnit } from '../engine/validation';
import { assistance, type HelperPerson } from '../forms/assistance';
import { fieldIndex, optionBoxes, selectOption, setFieldText } from './common';

// Fields of USCIS Form I-130, edition 04/01/24 (public/forms/i-130.pdf), named by the last
// segment of their full name. Each was placed by where it sits on the printed page. Most boxes in
// this edition are separate checkboxes with descriptive names ("Pt2Line17_Married[0]"); option
// groups (units, eye and hair color, ethnicity, marital status) are picked by export value.

export interface I130Plan {
  text: Record<string, string>;
  /** Checkboxes checked by name. */
  check: string[];
  /** [field base name, export value] for option groups. */
  checkValue: [string, string][];
  select: Record<string, string>;
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');

/** The PDF fields of one address block; any can be absent in a given block. */
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

/** Most address blocks name their fields `<prefix>_StreetNumberName[0]`, `<prefix>_Unit`, … */
const standard = (p: string, has: { state?: boolean; zip?: boolean; foreign?: boolean } = { state: true, zip: true, foreign: true }): AddressFields => ({
  street: `${p}_StreetNumberName[0]`,
  unit: `${p}_Unit`,
  number: `${p}_AptSteFlrNumber[0]`,
  city: `${p}_CityOrTown[0]`,
  ...(has.state ? { state: `${p}_State[0]` } : {}),
  ...(has.zip ? { zip: `${p}_ZipCode[0]` } : {}),
  ...(has.foreign ? { province: `${p}_Province[0]`, postal: `${p}_PostalCode[0]`, country: `${p}_Country[0]` } : {}),
});

const FAMILY: { name: [string, string, string]; relationship: string; dob: string; country: string }[] = [
  { name: ['Pt4Line30a_FamilyName[0]', 'Pt4Line30b_GivenName[0]', 'Pt4Line30c_MiddleName[0]'], relationship: 'Pt4Line31_Relationship[0]', dob: 'Pt4Line32_DateOfBirth[0]', country: 'Pt4Line49_CountryOfBirth[0]' },
  { name: ['Pt4Line34a_FamilyName[0]', 'Pt4Line34b_GivenName[0]', 'Pt4Line34c_MiddleName[0]'], relationship: 'Pt4Line35_Relationship[0]', dob: 'Pt4Line36_DateOfBirth[0]', country: 'Pt4Line37_CountryOfBirth[0]' },
  { name: ['Pt4Line38a_FamilyName[0]', 'Pt4Line38b_GivenName[0]', 'Pt4Line38c_MiddleName[0]'], relationship: 'Pt4Line39_Relationship[0]', dob: 'Pt4Line40_DateOfBirth[0]', country: 'Pt4Line41_CountryOfBirth[0]' },
  { name: ['Pt4Line42a_FamilyName[0]', 'Pt4Line42b_GivenName[0]', 'Pt4Line42c_MiddleName[0]'], relationship: 'Pt4Line43_Relationship[0]', dob: 'Pt4Line44_DateOfBirth[0]', country: 'Pt4Line45_CountryOfBirth[0]' },
  { name: ['Pt4Line46a_FamilyName[0]', 'Pt4Line46b_GivenName[0]', 'Pt4Line46c_MiddleName[0]'], relationship: 'Pt4Line47_Relationship[0]', dob: 'Pt4Line48_DateOfBirth[0]', country: 'Pt4Line49_CountryOfBirth[1]' },
];

export function planI130(a: Answers): I130Plan {
  const text: Record<string, string> = {};
  const check: string[] = [];
  const checkValue: [string, string][] = [];
  const select: Record<string, string> = {};
  const put = (field: string, value: string) => {
    if (value) text[field] = value;
  };
  const name = (prefix: string, fields: [string, string, string]) => {
    put(fields[0], str(a, `${prefix}.family`));
    put(fields[1], str(a, `${prefix}.given`));
    put(fields[2], str(a, `${prefix}.middle`));
  };
  const yesNo = (answer: string, yes: string, no: string) => {
    if (answer === 'yes') check.push(yes);
    if (answer === 'no') check.push(no);
  };
  const sex = (answer: string, base: string) => {
    if (answer === 'male') check.push(`${base}_Male[0]`);
    if (answer === 'female') check.push(`${base}_Female[0]`);
  };
  const address = (prefix: string, f: AddressFields) => {
    if (f.careOf) put(f.careOf, str(a, `${prefix}.careOf`));
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
    if (f.province) put(f.province, str(a, `${prefix}.province`));
    if (f.postal) put(f.postal, str(a, `${prefix}.postal`));
    if (f.country) put(f.country, str(a, `${prefix}.country`));
  };
  const usState = (field: string, id: string) => {
    const st = str(a, id).toUpperCase();
    if (st) select[field] = st;
  };

  // Part 1
  const rel = { spouse: 'Pt1Line1_Spouse[0]', parent: 'Pt1Line1_Parent[0]', sibling: 'Pt1Line1_Siblings[0]', child: 'Pt1Line1_Child[0]' }[str(a, 'relationship')];
  if (rel) check.push(rel);
  if (a.relationship === 'child' || a.relationship === 'parent') {
    const how = { inWedlock: 'Pt1Line2_InWedlock[0]', stepchild: 'Pt1Line2_Stepchild[0]', outOfWedlock: 'Pt1Line2_OutOfWedlock[0]', adopted: 'Pt1Line2_AdoptedChild[0]' }[str(a, 'childRelationship')];
    if (how) check.push(how);
  }
  if (a.relationship === 'sibling') yesNo(str(a, 'siblingAdopted'), 'Pt1Line3_Yes[0]', 'Pt1Line3_No[0]');
  yesNo(str(a, 'lprByAdoption'), 'Pt1Line4_Yes[0]', 'Pt1Line4_No[0]');

  // Part 2: the petitioner. Name and A-Number repeat at the top of Part 9.
  const petA = digits(str(a, 'pet.aNumber'));
  if (petA) for (const i of [0, 1]) put(`Pt2Line1_AlienNumber[${i}]`, petA.padStart(9, '0'));
  put('Pt2Line2_USCISOnlineActNumber[0]', digits(str(a, 'pet.uscisAccount')));
  put('Pt2Line11_SSN[0]', digits(str(a, 'pet.ssn')));
  for (const i of [0, 1]) name('pet.name', [`Pt2Line4a_FamilyName[${i}]`, `Pt2Line4b_GivenName[${i}]`, `Pt2Line4c_MiddleName[${i}]`]);
  name('pet.otherName', ['Pt2Line5a_FamilyName[0]', 'Pt2Line5b_GivenName[0]', 'Pt2Line5c_MiddleName[0]']);
  put('Pt2Line6_CityTownOfBirth[0]', str(a, 'pet.birthCity'));
  put('Pt2Line7_CountryofBirth[0]', str(a, 'pet.birthCountry'));
  put('Pt2Line8_DateofBirth[0]', str(a, 'pet.dob'));
  sex(str(a, 'pet.sex'), 'Pt2Line9');

  address('pet.mailing', { ...standard('Pt2Line10'), careOf: 'Pt2Line10_InCareofName[0]' });
  yesNo(str(a, 'pet.mailingSame'), 'Pt2Line11_Yes[0]', 'Pt2Line11_No[0]');
  // Address history: the current physical address first when it differs from the mailing address.
  const history = [
    ...(a['pet.mailingSame'] === 'no' ? [{ prefix: 'pet.home1', from: str(a, 'pet.home1.from'), to: 'PRESENT' }] : []),
    ...(a['pet.home.more'] === 'yes' ? [{ prefix: 'pet.homePrev', from: str(a, 'pet.homePrev.from'), to: str(a, 'pet.homePrev.to') }] : []),
  ];
  const historyRows = [
    { fields: standard('Pt2Line12'), from: 'Pt2Line13a_DateFrom[0]', to: 'Pt2Line13b_DateTo[0]' },
    { fields: standard('Pt2Line14'), from: 'Pt2Line15a_DateFrom[0]', to: 'Pt2Line15b_DateTo[0]' },
  ];
  history.forEach((h, i) => {
    address(h.prefix, historyRows[i].fields);
    put(historyRows[i].from, h.from);
    put(historyRows[i].to, h.to);
  });

  const petMarital = { single: 'Single', married: 'Married', divorced: 'Divorced', widowed: 'Widowed', separated: 'Separated', annulled: 'Annulled' }[str(a, 'pet.marital')];
  if (petMarital) check.push(`Pt2Line17_${petMarital}[0]`);
  put('Pt2Line16_NumberofMarriages[0]', digits(str(a, 'pet.timesMarried')));
  put('Pt2Line18_DateOfMarriage[0]', str(a, 'pet.marriedOn'));
  put('Pt2Line19a_CityTown[0]', str(a, 'pet.marriedCity'));
  usState('Pt2Line19b_State[0]', 'pet.marriedState');
  put('Pt2Line19c_Province[0]', str(a, 'pet.marriedProvince'));
  put('Pt2Line19d_Country[0]', str(a, 'pet.marriedCountry'));
  name('pet.spouse1', ['PtLine20a_FamilyName[0]', 'Pt2Line20b_GivenName[0]', 'Pt2Line20c_MiddleName[0]']);
  put('Pt2Line21_DateMarriageEnded[0]', str(a, 'pet.spouse1.ended'));
  if (a['pet.spouse.more1'] === 'yes') {
    name('pet.spouse2', ['Pt2Line22a_FamilyName[0]', 'Pt2Line22b_GivenName[0]', 'Pt2Line22c_MiddleName[0]']);
    put('Pt2Line23_DateMarriageEnded[0]', str(a, 'pet.spouse2.ended'));
  }

  const parents = [
    { name: ['Pt2Line24_FamilyName[0]', 'Pt2Line24_GivenName[0]', 'Pt2Line24_MiddleName[0]'], dob: 'Pt2Line25_DateofBirth[0]', sex: 'Pt2Line26', birth: 'Pt2Line27_CountryofBirth[0]', city: 'Pt2Line28_CityTownOrVillageOfResidence[0]', country: 'Pt2Line29_CountryOfResidence[0]' },
    { name: ['Pt2Line30a_FamilyName[0]', 'Pt2Line30b_GivenName[0]', 'Pt2Line30c_MiddleName[0]'], dob: 'Pt2Line31_DateofBirth[0]', sex: 'Pt2Line32', birth: 'Pt2Line33_CountryofBirth[0]', city: 'Pt2Line34_CityTownOrVillageOfResidence[0]', country: 'Pt2Line35_CountryOfResidence[0]' },
  ] as const;
  parents.forEach((p, i) => {
    const id = `pet.parent${i + 1}`;
    name(id, [...p.name]);
    put(p.dob, str(a, `${id}.dob`));
    sex(str(a, `${id}.sex`), p.sex);
    put(p.birth, str(a, `${id}.birthCountry`));
    put(p.city, str(a, `${id}.city`));
    put(p.country, str(a, `${id}.country`));
  });

  if (a['pet.status'] === 'citizen') {
    check.push('Pt2Line36_USCitizen[0]');
    const how = { birth: 'Pt2Line23a_checkbox[0]', naturalization: 'Pt2Line23b_checkbox[0]', parents: 'Pt2Line23c_checkbox[0]' }[str(a, 'pet.citizenHow')];
    if (how) check.push(how);
    yesNo(str(a, 'pet.hasCertificate'), 'Pt2Line36_Yes[0]', 'Pt2Line36_No[0]');
    put('Pt2Line37a_CertificateNumber[0]', str(a, 'pet.cert.number'));
    put('Pt2Line37b_PlaceOfIssuance[0]', str(a, 'pet.cert.place'));
    put('Pt2Line37c_DateOfIssuance[0]', str(a, 'pet.cert.date'));
  }
  if (a['pet.status'] === 'lpr') {
    check.push('Pt2Line36_LPR[0]');
    put('Pt2Line40a_ClassOfAdmission[0]', str(a, 'pet.lpr.class').toUpperCase());
    put('Pt2Line40b_DateOfAdmission[0]', str(a, 'pet.lpr.date'));
    put('Pt2Line40d_CityOrTown[0]', str(a, 'pet.lpr.city'));
    usState('Pt2Line40e_State[0]', 'pet.lpr.state');
    yesNo(str(a, 'pet.lprByMarriage'), 'Pt2Line41_Yes[0]', 'Pt2Line41_No[0]');
  }

  // Employment: row 1 is the current job.
  const jobs = [
    { name: 'Pt2Line40_EmployerOrCompName[0]', address: standard('Pt2Line41'), occupation: 'Pt2Line42_Occupation[0]', from: 'Pt2Line43a_DateFrom[0]', to: 'Pt2Line43b_DateTo[0]' },
    { name: 'Pt2Line44_EmployerOrOrgName[0]', address: standard('Pt2Line45'), occupation: 'Pt2Line46_Occupation[0]', from: 'Pt2Line47a_DateFrom[0]', to: 'Pt2Line47b_DateTo[0]' },
  ];
  jobs.forEach((j, i) => {
    const id = `pet.job${i + 1}`;
    if (!str(a, `${id}.name`)) return;
    put(j.name, str(a, `${id}.name`));
    address(id, j.address);
    put(j.occupation, str(a, `${id}.occupation`));
    put(j.from, str(a, `${id}.from`));
    put(j.to, i === 0 ? 'PRESENT' : str(a, `${id}.to`));
  });

  // Part 3
  if (a['pet.ethnicity'] === 'hispanic') checkValue.push(['Pt3Line1_Ethnicity', 'H']);
  if (a['pet.ethnicity'] === 'notHispanic') checkValue.push(['Pt3Line1_Ethnicity', 'NH']);
  const race = Array.isArray(a['pet.race']) ? a['pet.race'] : [];
  const raceFields = { white: 'White', asian: 'Asian', black: 'Black', indian: 'AmericanIndianAlaskaNative', pacific: 'NativeHawaiianOtherPacificIslander' } as const;
  for (const [k, v] of Object.entries(raceFields)) if (race.includes(k)) check.push(`Pt3Line2_Race_${v}[0]`);
  if (a['pet.heightFeet']) select['Pt3Line3_HeightFeet[0]'] = str(a, 'pet.heightFeet');
  if (a['pet.heightInches']) select['Pt3Line3_HeightInches[0]'] = str(a, 'pet.heightInches');
  const weight = digits(str(a, 'pet.weight'));
  if (weight) {
    const w = weight.padStart(3, '0').slice(-3);
    [0, 1, 2].forEach((i) => put(`Pt3Line4_Pound${i + 1}[0]`, w[i]));
  }
  if (a['pet.eyes']) checkValue.push(['Pt3Line5_EyeColor', str(a, 'pet.eyes')]);
  if (a['pet.hair']) checkValue.push(['Pt3Line6_HairColor', str(a, 'pet.hair')]);

  // Part 4: the beneficiary
  const benA = digits(str(a, 'ben.aNumber'));
  if (benA) put('Pt4Line1_AlienNumber[0]', benA.padStart(9, '0'));
  put('Pt4Line2_USCISOnlineActNumber[0]', digits(str(a, 'ben.uscisAccount')));
  put('Pt4Line3_SSN[0]', digits(str(a, 'ben.ssn')));
  name('ben.name', ['Pt4Line4a_FamilyName[0]', 'Pt4Line4b_GivenName[0]', 'Pt4Line4c_MiddleName[0]']);
  name('ben.otherName', ['P4Line5a_FamilyName[0]', 'Pt4Line5b_GivenName[0]', 'Pt4Line5c_MiddleName[0]']);
  put('Pt4Line7_CityTownOfBirth[0]', str(a, 'ben.birthCity'));
  put('Pt4Line8_CountryOfBirth[0]', str(a, 'ben.birthCountry'));
  put('Pt4Line9_DateOfBirth[0]', str(a, 'ben.dob'));
  sex(str(a, 'ben.sex'), 'Pt4Line9');
  const prior = { yes: 'Pt4Line10_Yes[0]', no: 'Pt4Line10_No[0]', unknown: 'Pt4Line10_Unknown[0]' }[str(a, 'ben.priorPetition')];
  if (prior) check.push(prior);

  address('ben.home', standard('Pt4Line11'));
  if (a['ben.usAddress.differs'] === 'yes') {
    address('ben.usAddress', { street: 'Pt4Line12a_StreetNumberName[0]', unit: 'Pt4Line12b_Unit', number: 'Pt4Line12b_AptSteFlrNumber[0]', city: 'Pt4Line12c_CityOrTown[0]', state: 'Pt4Line12d_State[0]', zip: 'Pt4Line12e_ZipCode[0]' });
  }
  if (a['ben.abroad.differs'] === 'yes') address('ben.abroad', standard('Pt4Line13', { foreign: true }));
  put('Pt4Line14_DaytimePhoneNumber[0]', str(a, 'ben.phone'));
  put('Pt4Line15_MobilePhoneNumber[0]', str(a, 'ben.mobile'));
  put('Pt4Line16_EmailAddress[0]', str(a, 'ben.email'));

  put('Pt4Line17_NumberofMarriages[0]', digits(str(a, 'ben.timesMarried')));
  const benMarital = { single: 'SNM', married: 'M', divorced: 'D', widowed: 'W', separated: 'S', annulled: 'A' }[str(a, 'ben.marital')];
  if (benMarital) checkValue.push(['Pt4Line18_MaritalStatus', benMarital]);
  put('Pt4Line19_DateOfMarriage[0]', str(a, 'ben.marriedOn'));
  put('Pt4Line20a_CityTown[0]', str(a, 'ben.marriedCity'));
  usState('Pt4Line20b_State[0]', 'ben.marriedState');
  put('Pt4Line20c_Province[0]', str(a, 'ben.marriedProvince'));
  put('Pt4Line20d_Country[0]', str(a, 'ben.marriedCountry'));
  name('ben.spouse1', ['Pt4Line16a_FamilyName[0]', 'Pt4Line16b_GivenName[0]', 'Pt4Line16c_MiddleName[0]']);
  put('Pt4Line17_DateMarriageEnded[0]', str(a, 'ben.spouse1.ended'));
  if (a['ben.spouse.more1'] === 'yes') {
    name('ben.spouse2', ['Pt4Line18a_FamilyName[0]', 'Pt4Line18b_GivenName[0]', 'Pt4Line18c_MiddleName[0]']);
    put('Pt4Line17_DateMarriageEnded[1]', str(a, 'ben.spouse2.ended'));
  }
  FAMILY.forEach((f, i) => {
    const id = `ben.person${i + 1}`;
    if (!str(a, `${id}.family`)) return;
    name(id, f.name);
    put(f.relationship, str(a, `${id}.relationship`));
    put(f.dob, str(a, `${id}.dob`));
    put(f.country, str(a, `${id}.birthCountry`));
  });

  // Both boxes of Item 45 export "Y"; they are told apart by name.
  yesNo(str(a, 'ben.everInUS'), 'Pt4Line20_Yes[0]', 'Pt4Line20_No[0]');
  if (a['ben.inUSNow'] === 'yes') {
    if (a['ben.entry.class']) select['Pt4Line21a_ClassOfAdmission[0]'] = str(a, 'ben.entry.class');
    put('Pt4Line21b_ArrivalDeparture[0]', str(a, 'ben.entry.i94').replace(/[\s-]/g, '').toUpperCase());
    put('Pt4Line21c_DateOfArrival[0]', str(a, 'ben.entry.date'));
    put('Pt4Line21d_DateExpired[0]', str(a, 'ben.entry.expires'));
  }
  put('Pt4Line22_PassportNumber[0]', str(a, 'ben.passport.number'));
  put('Pt4Line23_TravelDocNumber[0]', str(a, 'ben.passport.travelDoc'));
  put('Pt4Line24_CountryOfIssuance[0]', str(a, 'ben.passport.country'));
  put('Pt4Line25_ExpDate[0]', str(a, 'ben.passport.expires'));
  put('Pt4Line26_NameOfCompany[0]', str(a, 'ben.job.name'));
  address('ben.job', standard('Pt4Line26'));
  put('Pt4Line27_DateEmploymentBegan[0]', str(a, 'ben.job.from'));

  yesNo(str(a, 'ben.proceedings'), 'Pt4Line28_Yes[0]', 'Pt4Line28_No[0]');
  if (a['ben.proceedings'] === 'yes') {
    const types = Array.isArray(a['ben.proceedings.type']) ? a['ben.proceedings.type'] : [];
    const typeFields = { removal: 'Removal', exclusion: 'Exclusion', rescission: 'Rescission', judicial: 'JudicialProceedings' } as const;
    for (const [k, v] of Object.entries(typeFields)) if (types.includes(k)) check.push(`Pt4Line54_${v}[0]`);
    put('Pt4Line55a_CityOrTown[0]', str(a, 'ben.proceedings.city'));
    usState('Pt4Line55b_State[0]', 'ben.proceedings.state');
    put('Pt4Line56_Date[0]', str(a, 'ben.proceedings.date'));
  }

  if (a.relationship === 'spouse') {
    address('together', standard('Pt4Line57'));
    put('Pt4Line58a_DateFrom[0]', str(a, 'together.from'));
    put('Pt4Line58b_DateTo[0]', str(a, 'together.to'));
  }
  if (a.processingPlace === 'aos') {
    put('Pt4Line60a_CityOrTown[0]', str(a, 'aos.city'));
    usState('Pt4Line60b_State[0]', 'aos.state');
  }
  if (a.processingPlace === 'consular') {
    put('Pt4Line61a_CityOrTown[0]', str(a, 'consulate.city'));
    put('Pt4Line61b_Province[0]', str(a, 'consulate.province'));
    put('Pt4Line61c_Country[0]', str(a, 'consulate.country'));
  }

  // Part 5
  yesNo(str(a, 'prevPetition'), 'Part4Line1_Yes[0]', 'Part4Line1_No[0]');
  if (a.prevPetition === 'yes') {
    name('prev', ['Pt5Line2a_FamilyName[0]', 'Pt5Line2b_GivenName[0]', 'Pt5Line2c_MiddleName[0]']);
    put('Pt5Line3a_CityOrTown[0]', str(a, 'prev.city'));
    usState('Pt5Line3b_State[0]', 'prev.state');
    put('Pt5Line4_DateFiled[0]', str(a, 'prev.date'));
    put('Pt5Line5_Result[0]', str(a, 'prev.result'));
  }
  const relatives = [
    { name: ['Pt4Line6a_FamilyName[0]', 'Pt4Line6b_GivenName[0]', 'Pt4Line6c_MiddleName[0]'], relationship: 'Pt4Line7_Relationship[0]' },
    { name: ['Pt4Line8a_FamilyName[0]', 'Pt4Line8b_GivenName[0]', 'Pt4Line8c_MiddleName[0]'], relationship: 'Pt4Line9_Relationship[0]' },
  ] as const;
  relatives.forEach((r, i) => {
    const id = `otherRelative${i + 1}`;
    if (!str(a, `${id}.family`)) return;
    name(id, [...r.name]);
    put(r.relationship, str(a, `${id}.relationship`));
  });

  // Part 6. The signature (Item 6.a) stays empty: it must be signed by hand.
  if (a.readsEnglish === 'yes') checkValue.push(['Pt6Line1Checkbox', 'A']);
  if (a.readsEnglish === 'interpreter') {
    checkValue.push(['Pt6Line1Checkbox', 'B']);
    put('Pt6Line1b_Language[0]', str(a, 'fluentLanguage'));
  }
  if (a.preparer === 'yes') {
    check.push('Pt6Line2_Checkbox[0]');
    put('Pt6Line2_RepresentativeName[0]', str(a, 'preparer.name'));
  }
  put('Pt6Line3_DaytimePhoneNumber[0]', digits(str(a, 'phone')).replace(/^1(?=\d{10}$)/, ''));
  put('Pt6Line4_MobileNumber[0]', digits(str(a, 'mobile')).replace(/^1(?=\d{10}$)/, ''));
  put('Pt6Line5_Email[0]', str(a, 'email'));

  // Parts 7–8: the interpreter and the preparer; their signatures and dates stay empty. The
  // interpreter's mobile is named Pt4Line53_DaytimePhoneNumber, the preparer's PreparerFaxNumber.
  const phone = (s: string) => digits(s).replace(/^1(?=\d{10}$)/, '');
  const helper = (p: HelperPerson, f: { family: string; given: string; business: string; addr: string; phone: string; mobile: string; email: string }) => {
    put(f.family, p.family);
    put(f.given, p.given);
    put(f.business, p.business);
    const addr = standard(f.addr);
    put(addr.street, p.street);
    const unit = parseUnit(p.unit);
    if (unit) {
      checkValue.push([addr.unit, unit.kind]);
      put(addr.number, unit.number);
    }
    put(addr.city, p.city);
    if (p.state) select[addr.state!] = p.state.toUpperCase();
    put(addr.zip!, p.zip);
    put(addr.province!, p.province);
    put(addr.postal!, p.postal);
    put(addr.country!, p.country);
    put(f.phone, phone(p.phone));
    put(f.mobile, phone(p.mobile));
    put(f.email, p.email);
  };
  const help = assistance(a, { interpreter: a.readsEnglish === 'interpreter', preparer: a.preparer === 'yes' });
  if (help.interpreter) {
    helper(help.interpreter, {
      family: 'Pt7Line1a_InterpreterFamilyName[0]',
      given: 'Pt7Line1b_InterpreterGivenName[0]',
      business: 'Pt7Line2_InterpreterBusinessorOrg[0]',
      addr: 'Pt7Line3',
      phone: 'Pt7Line4_InterpreterDaytimeTelephone[0]',
      mobile: 'Pt4Line53_DaytimePhoneNumber[0]',
      email: 'Pt7Line5_Email[0]',
    });
    put('Pt7_NameofLanguage[0]', help.interpreter.language);
  }
  if (help.preparer) {
    helper(help.preparer, {
      family: 'Pt8Line1a_PreparerFamilyName[0]',
      given: 'Pt8Line1b_PreparerGivenName[0]',
      business: 'Pt8Line2_BusinessName[0]',
      addr: 'Pt8Line3',
      phone: 'Pt8Line4_DaytimePhoneNumber[0]',
      mobile: 'Pt8Line5_PreparerFaxNumber[0]',
      email: 'Pt8Line6_Email[0]',
    });
    const st = help.preparer.statement;
    if (st === 'notAttorney') checkValue.push(['Pt8Line7_Checkbox', 'A']);
    if (st === 'attorneyExtends' || st === 'attorneyNotExtends') {
      checkValue.push(['Pt8Line7_Checkbox', 'B']);
      checkValue.push(['Pt8Line7b_Checkbox', st === 'attorneyExtends' ? 'Y' : 'N']);
    }
  }

  return { text, check, checkValue, select };
}

/** Fills the official I-130 PDF with the answers and returns the new file's bytes. */
export async function fillI130(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const index = fieldIndex(doc.getForm());
  const plan = planI130(a);
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

  doc.setTitle('Form I-130, Petition for Alien Relative');
  return doc.save();
}
