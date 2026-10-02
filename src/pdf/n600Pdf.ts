import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { parseUnit } from '../engine/validation';
import { fieldIndex, optionBoxes, selectOption, setFieldText } from './common';

// Fields of USCIS Form N-600, edition 01/20/25 (public/forms/n-600.pdf), named by the last segment
// of their full name. Many names carry another part's number, so they were mapped by position:
// - Part 2's Items 1-5 are "Pt1Line1_*" and "P1_Line2-5_*"; the mailing address (Item 11) is
//   "P2_Line10_*" and the physical address (Item 12) "P2_Line11_*".
// - Item 16 is "P2_Line16_LostLPR", Item 17 "P2_Line15_AppliedFor", Item 18
//   "P2_Line15_PrevAppliedFor"; Item 20 is "P2_Line17_Adopted", Item 20.E "P2_Line18_ReAdopted",
//   Item 23 "P2_Line23", Item 24 "P2_Line20" and Item 25 "P2_Line22".
// - Part 3 (the U.S. citizen parent) is "P4_*"/"Pt4*", Part 4 (the other parent) "P5_*"/"Pt5*",
//   and Part 5 (the guardian) "P5_Line1-3_*[1]". Part 4's spouse's marriage city is
//   "P2_Line14A_City[1]" and its marriage date "P5_Line9F_DateofBirth[0]".
// - Part 6's mother box exports "F" and the father box "M"; its dates and Part 7's are
//   "P5_Line9F_DateofBirth[1]"-"[20]".
// - Marital status boxes export S, M, D, W, E (separated), A (annulled) and O.

export interface N600Plan {
  text: Record<string, string>;
  check: string[];
  checkValue: [string, string][];
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
  state: string;
  zip: string;
  province: string;
  postal: string;
  country: string;
}

const address = (street: string, prefix: string, city = `${prefix}_City[0]`): AddressFields => ({
  street,
  unit: `${prefix}_Unit`,
  number: `${prefix}_Number[0]`,
  city,
  state: `${prefix}_State[0]`,
  zip: `${prefix}_ZipCode[0]`,
  province: `${prefix}_Province[0]`,
  postal: `${prefix}_PostalCode[0]`,
  country: `${prefix}_Country[0]`,
});

const MAILING: AddressFields = {
  careOf: 'P2_Line10_InCareOfName[0]',
  street: 'P2_Line10_StreetName[0]',
  unit: 'P2_Line10_Unit',
  number: 'P2_Line10_Number[0]',
  city: 'Pt2_Line10_City[0]',
  state: 'Pt2Line10_State[0]',
  zip: 'Pt2Line10_ZipCode[0]',
  province: 'Pt2Line10_Province[0]',
  postal: 'Pt2Line10_PostalCode[0]',
  country: 'Pt2Line10_Country[0]',
};

const HOME: AddressFields = {
  street: 'P2_Line11_PhysicalStreetName[0]',
  unit: 'P2_Line11_Unit',
  number: 'P2_Line11_Number[0]',
  city: 'Pt2Line11_City[0]',
  state: 'Pt2Line11_State[0]',
  zip: 'Pt2Line11_ZipCode[0]',
  province: 'Pt2Line11_Province[0]',
  postal: 'Pt2Line11_PostalCode[0]',
  country: 'Pt2Line11_Country[0]',
};

interface ParentFields {
  name: [string, string, string];
  dob: string;
  mother: string;
  father: string;
  birthCountry: string;
  citizenship?: string;
  address: AddressFields;
  isCitizen?: [string, string];
  citizenBy: string;
  citizenByValues: Record<string, string>;
  acquisition: [string, string];
  abroad: [string, string];
  nat: { place: string; city: string; state: string; certificate: string; aNumber: string; date: string };
  lost: string;
  timesMarried: string;
  marital: string;
  maritalOther: string;
  spouseIsParent: [string, string] | string;
  spouse: {
    name: [string, string, string];
    dob: string;
    birthCountry: string;
    citizenship: string;
    address: AddressFields;
    marriageDate: string;
    marriageCity: string;
    marriageState: string;
    marriageCountry: string;
    status: string;
    statusOther: string;
  };
}

/** Part 3: the U.S. citizen parent. */
const PARENT1: ParentFields = {
  name: ['P4_Line1_FamilyName[0]', 'P4_Line1_GivenName[0]', 'P4_Line1_MiddleName[0]'],
  dob: 'P4_Line2_DateOfBirth[0]',
  mother: 'Pt3Line3_Mother[0]',
  father: 'Pt3Line3_Father[0]',
  birthCountry: 'P4_Line3_CountryOfBirth[0]',
  address: address('P4_Line5_physicalAddress[0]', 'P4_Line5', 'P4_Line5_city[0]'),
  citizenBy: 'P4_Line6_fcitizen',
  citizenByValues: { birth: 'A', acquisition: 'B', abroad: 'C', naturalization: 'N' },
  acquisition: ['Pt4Line6_CitizenNo1[0]', 'Pt4Line6_AlienNumber1[0]'],
  abroad: ['Pt4Line6_CitizenNo2[0]', 'Pt4Line6_AlienNumber2[0]'],
  nat: { place: 'Pt4Line6_Place[0]', city: 'Pt4Line6_CityOrTown[0]', state: 'Pt4Line6_State[0]', certificate: 'Pt4Line6_CertNo[0]', aNumber: 'Pt4Line6_AlienNumber2[1]', date: 'Pt4Line6_DateOfNat[0]' },
  lost: 'P4_Line7',
  timesMarried: 'P4_Line8A_TimesMarried[0]',
  marital: 'P4_Line8B_MaritalStatus',
  maritalOther: 'P4_Line8B_MaritalStatusOther[0]',
  spouseIsParent: ['Pt3Line9_Yes[0]', 'Pt3Line9_No[0]'],
  spouse: {
    name: ['P4_Line9A_FamilyName[0]', 'P4_Line9A_GivenName[0]', 'P4_Line9A_iddleName[0]'],
    dob: 'P4_Line9B_DateofBirth[0]',
    birthCountry: 'P4_Line9C_Country[0]',
    citizenship: 'P4_Line9D_Country[0]',
    address: address('P4_Line9E_StreetName[0]', 'P4_Line9E'),
    marriageDate: 'P4_Line9F_DateofMarriage[0]',
    marriageCity: 'P4_Line9G_City[0]',
    marriageState: 'P4_Line9G_State[0]',
    marriageCountry: 'Pt4Line9G_Country[0]',
    status: 'P4_Line9H_Immigration',
    statusOther: 'P4_Line9H_ImmigrationOther[0]',
  },
};

/** Part 4: the other parent. */
const PARENT2: ParentFields = {
  name: ['P5_Line1_FamilyName[0]', 'P5_Line1_GivenName[0]', 'P5_Line1_MiddleName[0]'],
  dob: 'P5_Line2_DateOfBirth[0]',
  mother: 'Pt4Line3_Mother[0]',
  father: 'Pt4Line3_Father[0]',
  birthCountry: 'P5_Line2_CountryOfBirth[0]',
  citizenship: 'P5_Line4_CountryOfBirth[0]',
  address: address('P5_Line5_PhysicalAddressStreetName[0]', 'P5_Line5'),
  isCitizen: ['Pt4Line7_Yes[0]', 'Pt4Line7_No[0]'],
  citizenBy: 'P5_Line6_fcitizen',
  citizenByValues: { birth: 'A', acquisition: 'B', abroad: 'C', naturalization: 'D' },
  acquisition: ['Pt5Line6_CitizenNo1[0]', 'Pt5Line6_AlienNumber1[0]'],
  abroad: ['Pt5Line6_CitizenNo2[0]', 'Pt5Line6_AlienNumber2[0]'],
  nat: { place: 'Pt5Line6_Place[0]', city: 'Pt5Line6_CityOrTown[0]', state: 'Pt5Line6_State[0]', certificate: 'Pt5Line6_CertNo[0]', aNumber: 'Pt5Line6_AlienNumber2[1]', date: 'Pt5Line6_DateOfNat[0]' },
  lost: 'P5_Line7',
  timesMarried: 'P5_Line8A[0]',
  marital: 'P5_Line8B_MaritalStatus',
  maritalOther: 'P5_Line8B_MaritalStatusOther[0]',
  spouseIsParent: 'P4_Line11',
  spouse: {
    name: ['P5_Line9A_FamilyName[0]', 'P5_Line9A_GivenName[0]', 'P5_Line9A_MiddleName[0]'],
    dob: 'P5_Line9B_DateofBirth[0]',
    birthCountry: 'P5_Line9C_Country[0]',
    citizenship: 'P5_Line9D_Country[0]',
    address: address('P5_Line9E_StreetName[0]', 'P5_Line9E'),
    marriageDate: 'P5_Line9F_DateofBirth[0]',
    marriageCity: 'P2_Line14A_City[1]',
    marriageState: 'Pt5Line9G_State[0]',
    marriageCountry: 'Pt5Line9G_Country[0]',
    status: 'P5_Line9H_Immigration',
    statusOther: 'P5_Line9H_ImmigrationOther[0]',
  },
};

const GUARDIAN_ADDRESS = address('P5_Line3_PhysicalAddressStreetName[0]', 'P5_Line3');

/** Part 6's eight periods (From, To) and Part 7's two, by index into "P5_Line9F_DateofBirth". */
const presenceField = (n: number) => `P5_Line9F_DateofBirth[${n}]`;
const MILITARY: [number, number][] = [
  [18, 17],
  [20, 19],
];

/** Answers for "is there another?" chains: how many rows were filled. */
const chain = (a: Answers, id: string, max: number, first: boolean) => {
  if (!first) return 0;
  let n = 1;
  while (n < max && a[`${id}.more${n}`] === 'yes') n++;
  return n;
};

export function planN600(a: Answers): N600Plan {
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
  const pair = ([yes, no]: [string, string], value: unknown) => {
    if (value === 'yes') check.push(yes);
    if (value === 'no') check.push(no);
  };
  const state = (field: string, value: string) => {
    if (value) select[field] = value.toUpperCase();
  };
  const aNum = (s: string) => {
    const d = digits(s);
    return d ? d.padStart(9, '0') : '';
  };
  const fillAddress = (prefix: string, f: AddressFields) => {
    if (f.careOf) put(f.careOf, str(a, `${prefix}.careOf`));
    put(f.street, str(a, `${prefix}.street`));
    const unit = parseUnit(str(a, `${prefix}.unit`));
    if (unit) {
      checkValue.push([f.unit, unit.kind]);
      put(f.number, unit.number);
    }
    put(f.city, str(a, `${prefix}.city`));
    state(f.state, str(a, `${prefix}.state`));
    put(f.zip, str(a, `${prefix}.zip`));
    put(f.province, str(a, `${prefix}.province`));
    put(f.postal, str(a, `${prefix}.postal`));
    put(f.country, str(a, `${prefix}.country`));
  };
  const name = (prefix: string, [family, given, middle]: [string, string, string]) => {
    put(family, str(a, `${prefix}.family`));
    put(given, str(a, `${prefix}.given`));
    put(middle, str(a, `${prefix}.middle`));
  };

  // The child's A-Number heads every page.
  const aNumber = aNum(str(a, 'aNumber'));
  if (aNumber) for (let i = 0; i <= 16; i++) put(`Line1_AlienNumber[${i}]`, aNumber);

  // Part 1.
  if (a.filer === 'child') check.push('Pt1Line1_child[0]');
  if (a.filer === 'parent' || a.filer === 'guardian') check.push('Pt1Line1_citzparent[0]');
  if (str(a, 'relationship')) checkValue.push(['Part1_Eligibility', str(a, 'relationship')]);
  if (a.relationship === 'E') put('P1_Line1_other_explain[0]', str(a, 'relationship.other'));

  // Part 2: the child. The name repeats at the top of Part 11.
  for (const i of [0, 1]) name('name', [`Pt1Line1_FamilyName[${i}]`, `Pt1Line1_GivenName[${i}]`, `Pt1Line1_MiddleName[${i}]`]);
  if (a.cardNameDifferent === 'yes') name('cardName', ['P1_Line2_FamilyName[0]', 'P1_Line2_GivenName[0]', 'P1_Line2_MiddleName[0]']);
  for (let i = 1; i <= chain(a, 'otherName', 2, a['otherName.more0'] === 'yes'); i++) name(`otherName${i}`, [`P1_Line3_FamilyName${i}[0]`, `P1_Line3_GivenName${i}[0]`, `P1_Line3_MiddleName${i}[0]`]);
  put('P1_Line4_SSN[0]', digits(str(a, 'ssn')));
  put('P1_Line5_USCISELISAcctNumber[0]', digits(str(a, 'uscisAccount')));
  put('P2_Line8_DateOfBirth[0]', str(a, 'dob'));
  put('P2_Line10_CountryOfBirth[0]', str(a, 'birthCountry'));
  put('P2_Line8_Country[0]', str(a, 'priorCitizenship'));
  if (a.sex === 'male') checkValue.push(['P2_Line9_Gender', 'M']);
  if (a.sex === 'female') checkValue.push(['P2_Line9_Gender', 'F']);
  if (str(a, 'heightFeet')) select['P3_Line3_HeightFeet[0]'] = str(a, 'heightFeet');
  if (str(a, 'heightInches')) select['P3_Line3_HeightInches[0]'] = str(a, 'heightInches');
  fillAddress('mailing', MAILING);
  if (a.mailingSame === 'no') fillAddress('home', HOME);
  if (str(a, 'marital')) checkValue.push(['P2_Line12_MaritalStatus', str(a, 'marital')]);
  if (a.marital === 'O') put('P2_Line12_MaritalStatusOther[0]', str(a, 'maritalOther'));
  yn('P2_Line13_ArmedForces', a.armedForces);

  // Item 15: entry and residence.
  put('P2_Line14A_City[0]', str(a, 'entry.port'));
  put('P2_Line14A_DateOfEntry[0]', str(a, 'entry.date'));
  name('entryName', ['P2_Line14A_FamilyName[0]', 'P2_Line14A_GivenName[0]', 'P2_Line14A_MiddleName[0]']);
  if (a.entryDoc === 'passport') {
    check.push('Pt2Line14B_PassportChbx[0]');
    put('Pt2Line14B_PassportNumber[0]', str(a, 'entryDoc.number'));
  }
  if (a.entryDoc === 'travelDoc') {
    check.push('Pt2Line14B_TravelDocChbx[0]');
    put('Pt2Line14B_TravelDocNumber[0]', str(a, 'entryDoc.number'));
  }
  if (a.entryDoc === 'passport' || a.entryDoc === 'travelDoc') {
    put('P2_Line14B_CountryOfIssuance[0]', str(a, 'entryDoc.country'));
    put('P2_Line14B_DateIssued[0]', str(a, 'entryDoc.issued'));
  }
  yn('P2_Line15C_LPR', a.wasLPR);
  if (a.wasLPR === 'yes') {
    put('P2_Line14D_DateLPR[0]', str(a, 'lpr.date'));
    put('P2_Line14D_Status_GrantedLPR[0]', str(a, 'lpr.office'));
    yn('P2_Line16_LostLPR', a.lostLPR);
    if (a.lostLPR === 'yes') put('P2_Line16_Explain[0]', str(a, 'lostLPR.explain'));
  }
  yn('P2_Line15_AppliedFor', a.prevN600);
  if (a.prevN600 === 'yes') put('P2_Line17_Explain[0]', str(a, 'prevN600.explain'));
  yn('P2_Line15_PrevAppliedFor', a.prevPassport);
  if (a.prevPassport === 'yes') put('P2_Line15_Explain[0]', str(a, 'prevPassport.explain'));
  yn('P2_Line19', a.custody);

  // Items 20-25.
  yn('P2_Line17_Adopted', a.adopted);
  if (a.adopted === 'yes') {
    put('Pt2Line17A_City[0]', str(a, 'adoption.city'));
    state('Pt2Line17A_State[0]', str(a, 'adoption.state'));
    put('Pt2Line17A_Country[0]', str(a, 'adoption.country'));
    put('Pt2Line17B_AdoptionDate[0]', str(a, 'adoption.date'));
    put('Pt2Line17C_LegalCustodyDate[0]', str(a, 'adoption.legal'));
    put('Pt2Line17D_PhysicalCustody[0]', str(a, 'adoption.physical'));
    yn('P2_Line18_ReAdopted', a.adoptionFinal);
    if (a.adoptionFinal === 'yes') pair(['Pt2Line21_Yes[0]', 'Pt2Line21_No[0]'], a.adoptionRecognized);
    if (a.adoptionFinal === 'no' || a.adoptionRecognized === 'no') {
      put('Pt2Line18A_City[0]', str(a, 'readoption.city'));
      state('Pt2Line18A_State[0]', str(a, 'readoption.state'));
      put('Pt2Line18A_Country[0]', str(a, 'readoption.country'));
      put('P2_Line18B_Adoption[0]', str(a, 'readoption.date'));
      put('P2_Line18C_Legal[0]', str(a, 'readoption.legal'));
      put('P2_Line18D_Physical[0]', str(a, 'readoption.physical'));
    }
  }
  if (a.adopted === 'no') {
    yn('P2_Line23', a.parentsMarriedAtBirth);
    if (a.parentsMarriedAtBirth === 'no') yn('P2_Line20', a.parentsMarriedAfter);
  }
  if (str(a, 'absent')) {
    yn('P2_Line22', a.absent);
    const trips = [
      ['P2_Line22A[0]', 'P2_Line22B[0]', 'P2_Line22C_Place[0]', 'P2_Line22C_State[0]'],
      ['P2_Line22D[0]', 'P2_Line22E[0]', 'P2_Line22F_City[0]', 'P2_Line22F_State[0]'],
    ];
    for (let i = 1; i <= chain(a, 'absence', 2, a.absent === 'yes'); i++) {
      const [left, returned, city, st] = trips[i - 1];
      put(left, str(a, `absence${i}.left`));
      put(returned, str(a, `absence${i}.returned`));
      put(city, str(a, `absence${i}.city`));
      state(st, str(a, `absence${i}.state`));
    }
  }

  // Parts 3 and 4.
  const parent = (p: string, f: ParentFields) => {
    name(p, f.name);
    put(f.dob, str(a, `${p}.dob`));
    if (a[`${p}.role`] === 'mother') check.push(f.mother);
    if (a[`${p}.role`] === 'father') check.push(f.father);
    put(f.birthCountry, str(a, `${p}.birthCountry`));
    if (f.citizenship) put(f.citizenship, str(a, `${p}.citizenship`));
    fillAddress(`${p}.address`, f.address);
    if (f.isCitizen) pair(f.isCitizen, a[`${p}.isCitizen`]);
    // For the other parent, Items 8-9 apply only when they are a citizen.
    if (!f.isCitizen || a[`${p}.isCitizen`] === 'yes') {
      const by = str(a, `${p}.citizenBy`);
      if (f.citizenByValues[by]) checkValue.push([f.citizenBy, f.citizenByValues[by]]);
      if (by === 'acquisition' || by === 'abroad') {
        const [certificate, aNumberField] = by === 'acquisition' ? f.acquisition : f.abroad;
        put(certificate, str(a, `${p}.certificate`));
        put(aNumberField, aNum(str(a, `${p}.aNumber`)));
      }
      if (by === 'naturalization') {
        put(f.nat.place, str(a, `${p}.natPlace`));
        put(f.nat.city, str(a, `${p}.natCity`));
        state(f.nat.state, str(a, `${p}.natState`));
        put(f.nat.certificate, str(a, `${p}.natCertificate`));
        put(f.nat.aNumber, aNum(str(a, `${p}.natANumber`)));
        put(f.nat.date, str(a, `${p}.natDate`));
      }
      yn(f.lost, a[`${p}.lost`]);
    }
    put(f.timesMarried, digits(str(a, `${p}.timesMarried`)));
    if (str(a, `${p}.marital`)) checkValue.push([f.marital, str(a, `${p}.marital`)]);
    if (a[`${p}.marital`] === 'O') put(f.maritalOther, str(a, `${p}.maritalOther`));
    if (a[`${p}.marital`] !== 'M') return;
    if (typeof f.spouseIsParent === 'string') yn(f.spouseIsParent, a[`${p}.spouseIsParent`]);
    else pair(f.spouseIsParent, a[`${p}.spouseIsParent`]);
    if (a[`${p}.spouseIsParent`] !== 'no') return;
    const s = f.spouse;
    name(`${p}.spouse`, s.name);
    put(s.dob, str(a, `${p}.spouse.dob`));
    put(s.birthCountry, str(a, `${p}.spouse.birthCountry`));
    put(s.citizenship, str(a, `${p}.spouse.citizenship`));
    fillAddress(`${p}.spouse.address`, s.address);
    put(s.marriageDate, str(a, `${p}.spouse.marriageDate`));
    put(s.marriageCity, str(a, `${p}.spouse.marriageCity`));
    state(s.marriageState, str(a, `${p}.spouse.marriageState`));
    put(s.marriageCountry, str(a, `${p}.spouse.marriageCountry`));
    if (str(a, `${p}.spouse.status`)) checkValue.push([s.status, str(a, `${p}.spouse.status`)]);
    if (a[`${p}.spouse.status`] === 'O') put(s.statusOther, str(a, `${p}.spouse.statusOther`));
  };
  parent('parent1', PARENT1);
  if (a['parent2.known'] === 'yes') parent('parent2', PARENT2);

  // Part 5.
  if (a.filer === 'guardian') {
    name('guardian', ['P5_Line1_FamilyName[1]', 'P5_Line1_GivenName[1]', 'P5_Line1_MiddleName[1]']);
    put('P5_Line2_DateOfBirth[1]', str(a, 'guardian.dob'));
    fillAddress('guardian.address', GUARDIAN_ADDRESS);
  }

  // Parts 6 and 7: only for citizenship claimed at birth abroad.
  if (a.atBirth === 'yes') {
    if (a.presenceParent === 'mother') check.push('P6_UScitizen[0]');
    if (a.presenceParent === 'father') check.push('P6_UScitizen[1]');
    for (let i = 1; i <= chain(a, 'presence', 8, true); i++) {
      put(presenceField(2 * i - 1), str(a, `presence${i}.from`));
      put(presenceField(2 * i), str(a, `presence${i}.to`));
    }
    yn('P7_Line1', a.parentMilitary);
    if (a.parentMilitary === 'yes') {
      put('P7_Line2_IfYesProvide[0]', str(a, 'military.name'));
      MILITARY.forEach(([from, to], i) => {
        put(presenceField(from), str(a, `military${i + 1}.from`));
        put(presenceField(to), str(a, `military${i + 1}.to`));
      });
      if (str(a, 'discharge')) checkValue.push(['P7_Line4_Discharge', str(a, 'discharge')]);
      if (a.discharge === 'OE') put('P7_Line4_OtherExplain[0]', str(a, 'discharge.other'));
    }
  }

  // Part 8. The signature and its date stay empty: they are written by hand.
  if (a.readsEnglish === 'A' || a.readsEnglish === 'B') checkValue.push(['P8_Line1', str(a, 'readsEnglish')]);
  if (a.readsEnglish === 'B') put('P8_Line1B_Language[0]', str(a, 'fluentLanguage'));
  if (a.preparer === 'yes') {
    checkValue.push(['P8_Line2', 'Y']);
    put('P8_Line2_Preparer[0]', str(a, 'preparer.name'));
  }
  put('P8_Line3[0]', digits(str(a, 'phone')));
  put('P8_Line4[0]', digits(str(a, 'mobile')));
  put('P8_Line5[0]', str(a, 'email'));

  // Part 11: the parents' loss-of-citizenship explanations.
  const notes = [
    a['parent1.lost'] === 'yes' && { page: '6', part: '3', item: '7', text: str(a, 'parent1.lost.explain') },
    a['parent2.known'] === 'yes' && a['parent2.isCitizen'] === 'yes' && a['parent2.lost'] === 'yes' && { page: '8', part: '4', item: '9', text: str(a, 'parent2.lost.explain') },
  ].filter((n): n is { page: string; part: string; item: string; text: string } => !!n && !!n.text);
  notes.forEach((n, i) => {
    const line = `P11_Line${i + 3}`;
    put(`${line}A[0]`, n.page);
    put(`${line}B[0]`, n.part);
    put(`${line}C[0]`, n.item);
    put(`${line}D[0]`, n.text);
  });

  return { text, check, checkValue, select };
}

/** Fills the official N-600 PDF with the answers and returns the new file's bytes. */
export async function fillN600(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const index = fieldIndex(form);
  const plan = planN600(a);
  const get = (name: string) => {
    const f = index.get(name);
    if (!f) throw new Error(`No such field: ${name}`);
    return f;
  };

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
  for (const [name, value] of Object.entries(plan.select)) {
    const field = get(name);
    if (!(field instanceof PDFDropdown)) throw new Error(`Not a dropdown: ${name}`);
    selectOption(field, value);
  }

  doc.setTitle('Form N-600, Application for Certificate of Citizenship');
  return doc.save();
}
