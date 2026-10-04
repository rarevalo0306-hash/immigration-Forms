import { PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { CATEGORIES, flaggedI485 } from '../forms/i485';
import { P9_ITEMS } from '../forms/i485Part9';
import { parseUnit } from '../engine/validation';
import { assistance } from '../forms/assistance';
import { fieldIndex, optionBoxes, selectOption, setFieldText } from './common';

// Fields of USCIS Form I-485, edition 09/18/26 (public/forms/i-485.pdf), named by the last segment
// of their full name and placed by where they sit on the printed page. Names often carry another
// part's or item's number (Part 8's ethnicity is "Pt7Line1_Ethnicity"; Part 4's financial support
// is "Part4Line7_StreetName[1]"), so the mapping follows the page. Option groups and Yes/No pairs
// are picked by export value.

export interface I485Plan {
  text: Record<string, string>;
  checkValue: [string, string][];
  select: Record<string, string>;
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');
const aNum = (s: string) => {
  const d = digits(s);
  return d ? d.padStart(9, '0') : '';
};

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

/** Every page carries the A-Number at the top; these are the copies, page by page. */
const A_NUMBER_COPIES = 25;

/** Part 14's four blocks, top to bottom: page, part, item and text. */
const PART14 = [0, 1, 2, 3].map((i) => ({
  page: `Pt9Line3a_PageNumber[${i}]`,
  part: `Pt9Line3b_PartNumber[${i}]`,
  item: `Pt9Line3c_ItemNumber[${i}]`,
  text: `P14_Line${i + 2}_AdditionalInfo[0]`,
}));

export function planI485(a: Answers): I485Plan {
  const text: Record<string, string> = {};
  const checkValue: [string, string][] = [];
  const select: Record<string, string> = {};
  const put = (field: string, value: string) => {
    if (value) text[field] = value;
  };
  const yesNo = (base: string, answer: string) => {
    if (answer === 'yes') checkValue.push([base, 'Y']);
    if (answer === 'no') checkValue.push([base, 'N']);
  };
  const name = (prefix: string, family: string, given: string, middle: string) => {
    put(family, str(a, `${prefix}.family`));
    put(given, str(a, `${prefix}.given`));
    put(middle, str(a, `${prefix}.middle`));
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

  // Part 1
  const aNumber = aNum(str(a, 'aNumber'));
  if (aNumber) for (let i = 0; i < A_NUMBER_COPIES; i++) put(`Pt1Line4_AlienNumber[${i}]`, aNumber);
  checkValue.push(['Pt1Line4_YN', aNumber ? 'Y' : 'N']);
  for (const i of [0, 1]) name('name', `Pt1Line1_FamilyName[${i}]`, `Pt1Line1_GivenName[${i}]`, `Pt1Line1_MiddleName[${i}]`);
  if (a.hasOtherNames === 'yes') {
    name('otherName1', 'Pt1Line2_FamilyName[0]', 'Pt1Line2_GivenName[0]', 'Pt1Line2_MiddleName[0]');
    if (a.hasOtherNames2 === 'yes') name('otherName2', 'Pt1Line2a_FamilyName[0]', 'Pt1Line2a_GivenName[0]', 'Pt1Line2a_MiddleName[0]');
  }
  put('Pt1Line3_DOB[0]', str(a, 'dob'));
  yesNo('Pt1Line3_YN', str(a, 'otherDob'));
  if (a.otherDob === 'yes') {
    put('Pt1Line3A_OtherDOB[0]', str(a, 'otherDob1'));
    put('Pt1Line3B_OtherDOB[0]', str(a, 'otherDob2'));
  }
  const otherA = [aNum(str(a, 'otherA1')), aNum(str(a, 'otherA2'))].filter(Boolean);
  checkValue.push(['Pt1Line5_YN', otherA.length ? 'Y' : 'N']);
  otherA.forEach((n, i) => put(`Pt1Line5${'AB'[i]}_ANumber[0]`, n));
  if (a.sex === 'male') checkValue.push(['Pt1Line6_CB_Sex', 'M']);
  if (a.sex === 'female') checkValue.push(['Pt1Line6_CB_Sex', 'F']);
  put('Pt1Line7_CityTownOfBirth[0]', str(a, 'birthCity'));
  put('Pt1Line7_CountryOfBirth[0]', str(a, 'birthCountry'));
  put('Pt1Line8_CountryofCitizenshipNationality[0]', str(a, 'citizenship'));
  put('Pt1Line9_USCISAccountNumber[0]', digits(str(a, 'uscisAccount')));

  put('Pt1Line10_PassportNum[0]', str(a, 'passport.number'));
  put('Pt1Line10_ExpDate[0]', str(a, 'passport.expires'));
  put('Pt1Line10_Passport[0]', str(a, 'passport.country'));
  put('Pt1Line10_VisaNum[0]', str(a, 'visa.number'));
  put('Pt1Line10_NonImmDate[0]', str(a, 'visa.issued'));
  put('Pt1Line10_CityTown[0]', str(a, 'arrival.city'));
  if (str(a, 'arrival.state')) select['Pt1Line10_State[0]'] = str(a, 'arrival.state').toUpperCase();
  put('Pt1Line10_DateofArrival[0]', str(a, 'arrival.date'));
  const how = { admitted: ['11A', 'Pt1Line11_Admitted[0]'], paroled: ['11B', 'Pt1Line11_Paroled[0]'], ewi: ['11C', ''], other: ['11D', 'Pt1Line11_Other[0]'] }[str(a, 'arrivalHow')];
  if (how) {
    checkValue.push(['Pt2Line11_CB', how[0]]);
    if (how[1]) put(how[1], str(a, 'arrivalAs.text'));
  }
  if (a.arrivalHow !== 'ewi') {
    put('P1Line12_FamilyName[0]', str(a, 'i94.family'));
    put('P1Line13_GivenName[0]', str(a, 'i94.given'));
    put('P1Line12_I94[0]', str(a, 'i94.number').replace(/[\s-]/g, '').toUpperCase());
    put('Pt1Line12_Date[0]', str(a, 'i94.expires'));
    put('Pt1Line12_Status[0]', str(a, 'i94.status'));
  }
  yesNo('Pt1Line13_YN', str(a, 'firstTime'));
  put('Pt1Line14_Status[0]', str(a, 'status.current'));
  put('Pt1Line15_Date[0]', str(a, 'status.expires'));
  yesNo('Pt1Line16_YN', str(a, 'crewmanVisa'));
  yesNo('Pt1Line17_YN', str(a, 'crewmanArrival'));

  address('home', { careOf: 'Part1_Item18_InCareOfName[0]', street: 'Pt1Line18_StreetNumberName[0]', unit: 'Pt1Line18US_Unit', number: 'Pt1Line18US_AptSteFlrNumber[0]', city: 'Pt1Line18_CityOrTown[0]', state: 'Pt1Line18_State[0]', zip: 'Pt1Line18_ZipCode[0]' });
  put('Pt1Line18_Date[0]', str(a, 'home.from'));
  yesNo('Pt1Line18_YN', str(a, 'mailingSame'));
  if (a.mailingSame === 'no') {
    address('mailing', { careOf: 'Pt1Line18_CurrentInCareOfName[0]', street: 'Pt1Line18_CurrentStreetNumberName[0]', unit: 'Pt1Line18_CurrentUnit', number: 'Pt1Line18_CurrentAptSteFlrNumber[0]', city: 'Pt1Line18_CurrentCityOrTown[0]', state: 'Pt1Line18_CurrentState[0]', zip: 'Pt1Line18_CurrentZipCode[0]' });
  }
  yesNo('Pt1Line18_last5yrs_YN', str(a, 'fiveYears'));
  if (a.fiveYears === 'no') {
    address('prior', { careOf: 'Pt1Line18_PriorInCareOfName[0]', street: 'Pt1Line18_PriorStreetName[0]', unit: 'Pt1Line18_PriorAddress_Unit', number: 'Pt1Line18_PriorAddress_Number[0]', city: 'Pt1Line18_PriorCity[0]', state: 'Pt1Line18_PriorState[0]', zip: 'Pt1Line18_PriorZipCode[0]', province: 'Pt1Line18_PriorProvince[0]', postal: 'Pt1Line18_PriorPostalCode[0]', country: 'Pt1Line18_PriorCountry[0]' });
    put('Pt1Line18_PriorDateFrom[0]', str(a, 'prior.from'));
    put('Pt1Line18PriorDateTo[0]', str(a, 'prior.to'));
  }
  address('abroad', { street: 'Pt1Line18_RecentStreetName[0]', unit: 'Pt1Line18_RecentUnit', number: 'Pt1Line18_RecentNumber[0]', city: 'Pt1Line18_RecentCity[0]', state: 'Pt1Line18_RecentState[0]', zip: 'Pt1Line18_RecentZipCode[0]', province: 'Pt1Line18_RecentProvince[0]', postal: 'Pt1Line18_RecentPostalCode[0]', country: 'Pt1Line18_RecentCountry[0]' });
  put('Pt1Line18_RecentDateFrom[0]', str(a, 'abroad.from'));
  put('Pt1Line18_RecentDateTo[0]', str(a, 'abroad.to'));

  yesNo('Pt1Line19_YN', str(a, 'ssaIssued'));
  if (a.ssaIssued === 'yes') put('Pt1Line19_SSN[0]', digits(str(a, 'ssn')));
  yesNo('Pt1Line19_SSA_YN', str(a, 'ssaWants'));
  if (a.ssaWants === 'yes') yesNo('Pt1Line19_Consent_YN', str(a, 'ssaConsent'));

  // Part 2
  yesNo('Pt2Line1_YN', str(a, 'eoir'));
  put('Pt2Line2_Receipt[0]', str(a, 'petition.receipt'));
  put('Pt2Line2_Date[0]', str(a, 'petition.priority'));
  if (a.applicantType === 'principal') checkValue.push(['Pt2Line2_CB', '1fA']);
  if (a.applicantType === 'derivative') {
    checkValue.push(['Pt2Line2_CB', '1fB']);
    name('principal', 'Pt2Line2_FamilyName[0]', 'Pt2Line2_GivenName[0]', 'Pt2Line2_MiddleName[0]');
    put('Pt2Line2_AlienNumber[0]', aNum(str(a, 'principal.aNumber')));
    put('Pt1Line2_DOB[0]', str(a, 'principal.dob'));
  }
  const cat = CATEGORIES.find((c) => c.value === a.category);
  if (cat) {
    const group = { a: 'Pt2Line3a_CB', d: 'Pt2Line3d_AsyleeRefugeeCB', f: 'Pt2Line3f_CB', g: 'Pt2Line3g_CB' }[cat.box[1] as 'a' | 'd' | 'f' | 'g'];
    checkValue.push([group, cat.box]);
  }
  if (a.category === 'asylee') put('Pt2Line3d_Asylum[0]', str(a, 'category.asylumDate'));
  if (a.category === 'refugee') put('Pt2Line3d_Refugee[0]', str(a, 'category.refugeeDate'));
  if (a.category === 'dv') put('Pt2Line1g_DV[0]', str(a, 'category.dvRank'));
  if (a.category === 'other') put('Pt2Line1g_OtherEligibility[0]', str(a, 'category.other'));
  yesNo('Pt2Line4_CB', str(a, 'section245i'));
  yesNo('Pt2Line5_CB', str(a, 'cspa'));

  // Part 3
  if (a.affidavitExemption) checkValue.push(['Pt3Line1_CB', str(a, 'affidavitExemption')]);

  // Part 4
  yesNo('Pt4Line1_YN', str(a, 'prevImmigrantVisa'));
  if (a.prevImmigrantVisa === 'yes') {
    put('Pt4Line2_CityTown[0]', str(a, 'prevVisa.city'));
    put('Pt4Line2_CityTownOfBirth[0]', str(a, 'prevVisa.country'));
    put('Pt4Line3_Decision[0]', str(a, 'prevVisa.decision'));
    put('Pt4Line4_Date[0]', str(a, 'prevVisa.date'));
  }
  yesNo('Pt4Line5_YN', str(a, 'prevLprInUS'));
  yesNo('Pt4Line6_YN', str(a, 'rescinded'));
  put('Pt4Line7_EmployerName[0]', str(a, 'job.type'));
  put('Pt4Line7_EmployerName[2]', str(a, 'job.name'));
  put('Pt4Line7_EmployerName[1]', str(a, 'job.occupation'));
  address('job', { street: 'Part4Line7_StreetName[0]', unit: 'P4Line7_Unit', number: 'P4Line7_Number[0]', city: 'P4Line7_City[0]', state: 'P4Line7_State[0]', zip: 'P4Line7_ZipCode[0]', province: 'P4Line7_Province[0]', postal: 'P4Line7_PostalCode[0]', country: 'P4Line7_Country[0]' });
  put('Pt4Line7_DateFrom[0]', str(a, 'job.from'));
  if (str(a, 'job.type')) put('Pt4Line7_DateTo[0]', 'PRESENT');
  put('Part4Line7_StreetName[1]', str(a, 'job.support'));
  if (a['abroadJob.has'] === 'yes') {
    put('Pt4Line8_EmployerName[0]', str(a, 'abroadJob.name'));
    put('Pt4Line8_Occupation[0]', str(a, 'abroadJob.occupation'));
    address('abroadJob', { street: 'P4Line8_StreetName[0]', unit: 'P4Line8_Unit', number: 'P4Line8_Number[0]', city: 'P4Line8_City[0]', state: 'P4Line8_State[0]', zip: 'P4Line8_ZipCode[0]', province: 'P4Line8_Province[0]', postal: 'P4Line8_PostalCode[0]', country: 'P4Line8_Country[0]' });
    put('Pt4Line8_DateFrom[0]', str(a, 'abroadJob.from'));
    put('Pt4Line8_DateTo[0]', str(a, 'abroadJob.to'));
  }

  // Part 5
  name('parent1', 'Pt5Line1_FamilyName[0]', 'Pt5Line1_GivenName[0]', 'Pt5Line1_MiddleName[0]');
  name('parent1.birth', 'Pt5Line2_FamilyName[0]', 'Pt5Line2_GivenName[0]', 'Pt5Line2_MiddleName[0]');
  put('Pt5Line3_DateofBirth[0]', str(a, 'parent1.dob'));
  put('Pt5Line5_CityTownOfBirth[0]', str(a, 'parent1.country'));
  name('parent2', 'Pt5Line6_FamilyName[0]', 'Pt5Line6_GivenName[0]', 'Pt5Line6_MiddleName[0]');
  name('parent2.birth', 'Pt5Line7_FamilyName[0]', 'Pt5Line7_GivenName[0]', 'Pt5Line7_MiddleName[0]');
  put('Pt5Line8_DateofBirth[0]', str(a, 'parent2.dob'));
  put('Pt5Line10_CityTownOfBirth[0]', str(a, 'parent2.country'));

  // Part 6
  const marital = { single: '1', married: '2', divorced: '3', widowed: '4', annulled: '5', separated: '7' }[str(a, 'marital')];
  if (marital) checkValue.push(['Pt6Line1_MaritalStatus', marital]);
  const married = a.marital === 'married' || a.marital === 'separated';
  if (married) yesNo('Pt5Line2_YNNA', str(a, 'spouseMilitary'));
  else if (a.marital) checkValue.push(['Pt5Line2_YNNA', 'A']);
  put('Pt6Line3_TimesMarried[0]', digits(str(a, 'timesMarried')));
  if (married) {
    name('spouse', 'Pt6Line4_FamilyName[0]', 'Pt6Line4_GivenName[0]', 'Pt6Line4_MiddleName[0]');
    put('Pt6Line5_AlienNumber[0]', aNum(str(a, 'spouse.aNumber')));
    put('Pt5Line8_DateofBirth[1]', str(a, 'spouse.dob'));
    put('Pt6Line7_Country[0]', str(a, 'spouse.birthCountry'));
    address('spouse.home', { street: 'Part6Line8_StreetName[0]', unit: 'P6Line8_Unit', number: 'P6Line8_Number[0]', city: 'P6Line8_City[0]', state: 'P6Line8_State[0]', zip: 'P6Line8_ZipCode[0]', province: 'P6Line8_Province[0]', postal: 'P6Line8_PostalCode[0]', country: 'P6Line8_Country[0]' });
    put('Pt6Line10_CityTownOfBirth[0]', str(a, 'spouse.marriedCity'));
    put('Pt6Line10_State[0]', str(a, 'spouse.marriedState'));
    put('Pt6Line10_Country[0]', str(a, 'spouse.marriedCountry'));
    put('Pt5Line8_DateofBirth[2]', str(a, 'spouse.married'));
    yesNo('Pt6Line11_YN', str(a, 'spouseApplying'));
  }
  if (str(a, 'prior.family')) {
    name('prior', 'Pt6Line12_FamilyName[0]', 'Pt6Line12_GivenName[0]', 'Pt6Line12_MiddleName[0]');
    put('Pt5Line8_DateofBirth[3]', str(a, 'prior.dob'));
    put('Pt6Line14_Country[0]', str(a, 'prior.birthCountry'));
    put('Pt6Line15_Country[0]', str(a, 'prior.citizenship'));
    put('Pt6Line16_DateofBirth[0]', str(a, 'prior.married'));
    put('Pt6Line10_CityTownOfBirth[1]', str(a, 'prior.marriedCity'));
    put('Pt6Line10_State[1]', str(a, 'prior.marriedState'));
    put('Pt6Line10_Country[1]', str(a, 'prior.marriedCountry'));
    put('Pt6Line18_CityTownOfBirth[0]', str(a, 'prior.endedCity'));
    put('Pt6Line18_State[0]', str(a, 'prior.endedState'));
    put('Pt6Line18_Country[0]', str(a, 'prior.endedCountry'));
    put('Pt6Line16_DateofBirth[1]', str(a, 'prior.ended'));
    if (a['prior.how']) checkValue.push(['Pt6Line19_MaritalStatus', str(a, 'prior.how')]);
  }

  // Part 7
  put('Pt6Line1_TotalChildren[0]', digits(str(a, 'childrenCount')));
  for (const c of [1, 2]) {
    const id = `child${c}`;
    const p = `Pt7Line${c + 1}`;
    if (!str(a, `${id}.family`)) continue;
    name(id, `${p}_FamilyName[0]`, `${p}_GivenName[0]`, `${p}_MiddleName[0]`);
    put(`${p}_AlienNumber[0]`, aNum(str(a, `${id}.aNumber`)));
    put(`${p}_DateofBirth[0]`, str(a, `${id}.dob`));
    put(`${p}_Country[0]`, str(a, `${id}.country`));
    put(`${p}_Relationship[0]`, str(a, `${id}.relationship`));
    yesNo(`${p}_YN`, str(a, `${id}.applying`));
  }

  // Part 8
  if (a.ethnicity === 'hispanic') checkValue.push(['Pt7Line1_Ethnicity', 'H']);
  if (a.ethnicity === 'notHispanic') checkValue.push(['Pt7Line1_Ethnicity', 'N']);
  for (const r of Array.isArray(a.race) ? a.race : []) checkValue.push(['Pt7Line2_Race', r]);
  if (a.heightFeet) select['Pt7Line3_HeightFeet[0]'] = str(a, 'heightFeet');
  if (a.heightInches) select['Pt7Line3_HeightInches[0]'] = str(a, 'heightInches');
  const weight = digits(str(a, 'weight'));
  if (weight) {
    const w = weight.padStart(3, '0').slice(-3);
    [0, 1, 2].forEach((i) => put(`Pt7Line4_Weight${i + 1}[0]`, w[i]));
  }
  if (a.eyes) checkValue.push(['Pt7Line5_Eyecolor', str(a, 'eyes')]);
  if (a.hair) checkValue.push(['Pt7Line6_Haircolor', str(a, 'hair')]);

  // Part 9
  for (const it of P9_ITEMS) yesNo(it.field, str(a, `p9.${it.item}`));
  if (a['p9.1'] === 'yes') {
    put('Pt9Line2_Organization1[0]', str(a, 'org1.name'));
    put('Pt9Line3_CityTownOfBirth[0]', str(a, 'org1.city'));
    put('Pt9Line3_State[0]', str(a, 'org1.state'));
    put('Pt9Line3_Country[0]', str(a, 'org1.country'));
    put('Pt9Line4_FamilyName[0]', str(a, 'org1.nature'));
    put('Pt9Line4_Involvement[0]', str(a, 'org1.involvement'));
    put('Pt9Line5_DateFrom[0]', str(a, 'org1.from'));
    put('Pt9Line5_DateTo[0]', str(a, 'org1.to'));
  }
  if (a['p9.83'] === 'yes') put('Pt9Line86_Nationality[0]', str(a, 'draft.status'));

  if (a['publicCharge.exemption']) checkValue.push(['Pt9Line56_CB', str(a, 'publicCharge.exemption')]);
  if (a['publicCharge.exemption'] === '23') {
    put('Pt9Line57_HouseholdSize[0]', str(a, 'pc.household'));
    if (a['pc.income']) checkValue.push(['Pt9Line53_CB', str(a, 'pc.income')]);
    if (a['pc.assets']) checkValue.push(['Pt9Line59_CB', str(a, 'pc.assets')]);
    if (a['pc.liabilities']) checkValue.push(['Pt9Line60_CB', str(a, 'pc.liabilities')]);
    if (a['pc.education']) checkValue.push(['Pt9Line61_CB', str(a, 'pc.education')]);
    if (a['pc.education'] === 'C') put('Pt9Line61_diploma[0]', str(a, 'pc.grade'));
    str(a, 'pc.skills')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 8)
      .forEach((line, i) => put(`TextField${i + 1}[0]`, line));
    yesNo('Pt9Line63_YesNo', str(a, 'pc.benefits'));
    if (a['pc.benefits'] === 'yes') {
      for (const r of [1, 2, 3, 4]) {
        const id = `pc.benefit${r}`;
        if (!str(a, `${id}.name`)) continue;
        const col = (n: number) => `Pt8Line68c_Column${n}Row${r}[0]`;
        put(col(1), str(a, `${id}.name`));
        put(col(2), str(a, `${id}.start`));
        put(col(3), str(a, `${id}.end`));
        put(col(4), str(a, `${id}.amount`));
        put(col(5), str(a, `${id}.reason`));
      }
    }
  }

  // Part 10. The signature (Item 4) stays empty: it must be signed by hand.
  put('Pt3Line3_DaytimePhoneNumber1[0]', digits(str(a, 'phone')).replace(/^1(?=\d{10}$)/, ''));
  put('Pt3Line4_MobileNumber1[0]', digits(str(a, 'mobile')).replace(/^1(?=\d{10}$)/, ''));
  put('Pt3Line5_Email[0]', str(a, 'email'));

  // Parts 11–12: the interpreter and the preparer; their signatures and dates stay empty. This
  // edition has no address or statement boxes for them. The interpreter's phones and email are
  // named P3_Line4–6, and the preparer's given name Pt12Line1a.
  const phone = (s: string) => digits(s).replace(/^1(?=\d{10}$)/, '');
  const help = assistance(a, { interpreter: a.readsEnglish === 'B', preparer: a.preparer === 'yes' });
  if (help.interpreter) {
    const p = help.interpreter;
    put('Pt11Line1a_FamilyName[0]', p.family);
    put('Pt11Line1b_GivenName[0]', p.given);
    put('Pt11Line2_OrgName[0]', p.business);
    put('P3_Line4_DaytimeTelePhoneNumber[0]', phone(p.phone));
    put('P3_Line5_MobileTelePhoneNumber[0]', phone(p.mobile));
    put('P3_Line6_Email[0]', p.email);
    put('Part11_NameofLanguage[0]', p.language);
  }
  if (help.preparer) {
    const p = help.preparer;
    put('Pt12Line1_PreparerFamilyName[0]', p.family);
    put('Pt12Line1a_PreparerGivenName[0]', p.given);
    put('Pt12Line2_BusinessName[0]', p.business);
    put('Pt12Line3_PreparerDaytimePhoneNumber1[0]', phone(p.phone));
    put('Pt12Line4_PreparerMobileNumber[0]', phone(p.mobile));
    put('Pt12Line5_PreparerEmail[0]', p.email);
  }

  // Part 14: the first explanations of Part 9 answers.
  flaggedI485(a)
    .filter((it) => str(a, `explain.${it.item}.text`))
    .slice(0, PART14.length)
    .forEach((it, i) => {
      put(PART14[i].page, String(it.page));
      put(PART14[i].part, '9');
      put(PART14[i].item, it.item);
      put(PART14[i].text, str(a, `explain.${it.item}.text`));
    });

  return { text, checkValue, select };
}

/** Fills the official I-485 PDF with the answers and returns the new file's bytes. */
export async function fillI485(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const index = fieldIndex(form);
  const plan = planI485(a);
  const get = (name: string) => {
    const f = index.get(name);
    if (!f) throw new Error(`No such field: ${name}`);
    return f;
  };

  // Part 14's text boxes are rich-text fields, which pdf-lib can't read back when it redraws the
  // form; store them as plain text instead.
  for (const f of form.getFields()) if (f instanceof PDFTextField && f.isRichFormatted()) f.disableRichFormatting();

  for (const [name, raw] of Object.entries(plan.text)) {
    const field = get(name);
    if (!(field instanceof PDFTextField)) throw new Error(`Not a text field: ${name}`);
    setFieldText(field, raw, 9);
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

  doc.setTitle('Form I-485, Application to Register Permanent Residence or Adjust Status');
  return doc.save();
}

