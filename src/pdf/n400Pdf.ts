import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { flaggedPart9, PART14_BLOCKS } from '../forms/n400';
import { assistance, usedInterpreter, usedPreparer } from '../forms/assistance';
import { parseUnit } from '../engine/validation';
import { fieldIndex, optionBoxes, selectOption, setFieldText } from './common';

export { fieldIndex, optionBoxes };

// Fields of USCIS Form N-400, edition 01/20/25 (public/forms/n-400.pdf). Each field is named here by
// the last segment of its full name (e.g. "P2_Line1_FamilyName[0]"), which is unique in this edition.
// The edition's internal names and tooltips are often out of step with the printed form, so every
// mapping below was placed by where the field sits on the page.
//
// Yes/No pairs and other option boxes are picked by their export value ("Y", "N", "APT", "BRO"…),
// not by index, because the indexes don't follow the printed order.

export interface N400Plan {
  text: Record<string, string>;
  /** [field base name, export value] for option boxes. */
  checkValue: [string, string][];
  /** Checkboxes picked by full segment, where export values repeat (Race). */
  check: string[];
  select: Record<string, string>;
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');

const PART9_FIELDS: Record<string, string> = {
  '1': 'P9_Line1', '2': 'P9_Line2', '3': 'P9_Line3', '4': 'P9_Line4', '5.a': 'P9_5a', '5.b': 'P9_5b',
  '6.a': 'P12_6a', '6.b': 'P12_6b', '6.c': 'P12_6c',
  '7.a': 'P9_Line7a', '7.b': 'P9_Line7\\.b\\.', '7.c': 'P9_Line7\\.c', '7.d': 'P11_7d', '7.e': 'P9_Line7\\.e', '7.f': 'P9_Line7\\.f', '7.g': 'P9_Line7\\.g',
  '8.a': 'P9_Line8a', '8.b': 'P9_Line8b', '9': 'P9_Line9', '10.a': 'P9_Line10a', '10.b': 'P9_Line10b', '10.c': 'P9_Line10c',
  '11': 'P9_Line11', '12': 'P9_Line12', '13': 'P9_Line13', '14': 'P9_Line14', '15.a': 'P9_Line15a', '15.b': 'P9_Line15b', '16': 'P12_Line16',
  '17.a': 'P11_Line17A', '17.b': 'P11_Line17B', '17.c': 'P11_Line17C', '17.d': 'P12_Line17d', '17.e': 'P12_Line17e', '17.f': 'P12_Line17f', '17.g': 'P12_Line17g', '17.h': 'P12_Line17h',
  '18': 'P12_Line18', '19': 'P12_Line19', '20': 'P12_Line20', '21': 'P12_Line21', '22.a': 'P9_Line22a', '22.b': 'Pt9_Line22b',
  '23': 'P12_Line23', '24': 'P12_Line24', '25': 'P12_Line25', '26.a': 'P12_Line26a', '26.b': 'P12_Line26b', '26.c': 'P12_Line26c', '26.d': 'P11_Line26d',
  '27': 'P12_Line27', '28': 'P12_Line28', '29': 'P9_Line29', '30.a': 'P12_Line30a', '30.b': 'P12_Line30b',
  '31': 'P12_Line31', '32': 'P12_Line32', '33': 'P12_Line33', '34': 'P12_Line34', '35': 'P12_Line35', '36': 'P12_Line36', '37': 'P12_Line37',
};

/** Part 14's four answer blocks: page, part, item and text fields, top to bottom. */
const PART14 = [
  ['P11_Line3A[0]', 'P11_Line3B[0]', 'P11_Line3C[0]', 'P11_Line3D[0]'],
  ['P11_Line4A[0]', 'P11_Line4B[0]', 'P11_Line4C[0]', 'P11_Line4D[0]'],
  ['P11_Line5A[0]', 'P11_Line5B[0]', 'P11_Line5C[0]', 'P11_Line5D[0]'],
  ['P11_Line6A[0]', 'P11_Line6B[0]', 'P11_Line6C[0]', 'P11_Line6D[0]'],
] as const;

export function planN400(a: Answers): N400Plan {
  const text: Record<string, string> = {};
  const checkValue: [string, string][] = [];
  const check: string[] = [];
  const select: Record<string, string> = {};
  const put = (field: string, value: string) => {
    if (value) text[field] = value;
  };
  const yesNo = (base: string, answer: string) => {
    if (answer === 'yes') checkValue.push([base, 'Y']);
    if (answer === 'no') checkValue.push([base, 'N']);
  };

  // Part 1 and the A-Number at the top of every page.
  if (a.eligibility) checkValue.push(['Part1_Eligibility', str(a, 'eligibility')]);
  if (a.eligibility === 'G') put('Part1Line5_OtherExplain[0]', str(a, 'eligibility.other'));
  const aNumber = digits(str(a, 'aNumber'));
  if (aNumber) for (let i = 0; i <= 13; i++) put(`Line1_AlienNumber[${i}]`, aNumber.padStart(9, '0'));

  // Part 2
  for (const i of [0, 1]) {
    // [1] is the name repeated at the top of Part 14.
    put(`P2_Line1_FamilyName[${i}]`, str(a, 'name.family'));
    put(`P2_Line1_GivenName[${i}]`, str(a, 'name.given'));
    put(`P2_Line1_MiddleName[${i}]`, str(a, 'name.middle'));
  }
  if (a.hasOtherNames === 'yes') {
    put('Line2_FamilyName1[0]', str(a, 'otherName1.family'));
    put('Line3_GivenName1[0]', str(a, 'otherName1.given'));
    put('Line3_MiddleName1[0]', str(a, 'otherName1.middle'));
    if (a.hasOtherNames2 === 'yes') {
      put('Line2_FamilyName2[0]', str(a, 'otherName2.family'));
      put('Line3_GivenName2[0]', str(a, 'otherName2.given'));
      put('Line3_MiddleName2[0]', str(a, 'otherName2.middle'));
    }
  }
  yesNo('P2_Line34_NameChange', str(a, 'nameChange'));
  if (a.nameChange === 'yes') {
    put('Part2Line3_FamilyName[0]', str(a, 'newName.family'));
    put('Part2Line4a_GivenName[0]', str(a, 'newName.given'));
    put('Part2Line4a_MiddleName[0]', str(a, 'newName.middle'));
  }
  put('P2_Line6_USCISELISAcctNumber[0]', digits(str(a, 'uscisAccount')));
  if (a.sex === 'male') checkValue.push(['P2_Line7_Gender', 'M']);
  if (a.sex === 'female') checkValue.push(['P2_Line7_Gender', 'F']);
  put('P2_Line8_DateOfBirth[0]', str(a, 'dob'));
  put('P2_Line9_DateBecamePermanentResident[0]', str(a, 'lprDate'));
  put('P2_Line10_CountryOfBirth[0]', str(a, 'birthCountry'));
  put('P2_Line11_CountryOfNationality[0]', str(a, 'citizenship'));
  yesNo('P2_Line10_claimdisability', str(a, 'parentCitizen'));
  yesNo('P2_Line11_claimdisability', str(a, 'disability'));
  yesNo('Line12a_Checkbox', str(a, 'ssaCard'));
  if (a.ssaCard === 'yes') {
    put('Line12b_SSN[0]', digits(str(a, 'ssn')));
    yesNo('Line12\\.c_Checkbox', str(a, 'ssaConsent'));
  }

  // Part 3
  if (a.ethnicity === 'hispanic') checkValue.push(['P7_Line1_Ethnicity', 'Y']);
  if (a.ethnicity === 'notHispanic') checkValue.push(['P7_Line1_Ethnicity', 'N']);
  const race = Array.isArray(a.race) ? a.race : [];
  (['indian', 'asian', 'black', 'pacific', 'white'] as const).forEach((r, i) => {
    if (race.includes(r)) check.push(`P7_Line2_Race[${i}]`);
  });
  if (a.heightFeet) select['P7_Line3_HeightFeet[0]'] = str(a, 'heightFeet');
  if (a.heightInches) select['P7_Line3_HeightInches[0]'] = str(a, 'heightInches');
  const weight = digits(str(a, 'weight'));
  if (weight) {
    const w = weight.padStart(3, '0').slice(-3);
    put('P7_Line4_Pounds1[0]', w[0]);
    put('P7_Line4_Pounds2[0]', w[1]);
    put('P7_Line4_Pounds3[0]', w[2]);
  }
  if (a.eyes) checkValue.push(['P7_Line5_Eye', str(a, 'eyes')]);
  if (a.hair) checkValue.push(['P7_Line6_Hair', str(a, 'hair')]);

  // Part 4
  const usAddress = (prefix: string, f: { careOf: string; street: string; unit: string; number: string; city: string; state: string; zip: string }) => {
    put(f.careOf, str(a, `${prefix}.careOf`));
    put(f.street, str(a, `${prefix}.street`));
    const unit = parseUnit(str(a, `${prefix}.unit`));
    if (unit) {
      checkValue.push([f.unit, unit.kind]);
      put(f.number, unit.number);
    }
    put(f.city, str(a, `${prefix}.city`));
    const st = str(a, `${prefix}.state`).toUpperCase();
    if (st) select[f.state] = st;
    put(f.zip, str(a, `${prefix}.zip`));
  };
  usAddress('home', { careOf: 'P4_Line1_InCareOfName[0]', street: 'P4_Line1_StreetName[0]', unit: 'P4_Line1_Unit', number: 'P4_Line1_Number[0]', city: 'P4_Line1_City[0]', state: 'P4_Line1_State[0]', zip: 'P4_Line1_ZipCode[0]' });
  // The "To" date of the current address is printed on the form as PRESENT.
  put('P4_Line1_DatesofResidence[1]', str(a, 'home.from'));
  const prevTo = ['P4_Line3_From1[1]', 'P4_Line3_To2[0]', 'P4_Line3_To3[0]'];
  for (const r of [1, 2, 3]) {
    const p = `prevHome${r}`;
    if (!str(a, `${p}.street`)) continue;
    put(`P4_Line3_PhysicalAddress${r}[0]`, str(a, `${p}.street`));
    put(`P4_Line3_CityTown${r}[0]`, str(a, `${p}.city`));
    put(`P4_Line3_State${r}[0]`, str(a, `${p}.state`));
    put(`P4_Line3_ZipCode${r}[0]`, str(a, `${p}.zip`));
    put(`P4_Line3_Country${r}[0]`, str(a, `${p}.country`));
    put(`P4_Line3_From${r}[0]`, str(a, `${p}.from`));
    put(prevTo[r - 1], str(a, `${p}.to`));
  }
  yesNo('Pt3_Line2a_Checkbox', str(a, 'mailingSame'));
  if (a.mailingSame === 'no') {
    usAddress('mailing', { careOf: 'P5_Line1b_InCareOfName[0]', street: 'P5_Line1b_StreetName[0]', unit: 'P5_Line1b_Unit', number: 'P5_Line1b_Number[0]', city: 'P5_Line1b_City[0]', state: 'P4_Line1_State[1]', zip: 'P5_Line1b_ZipCode[0]' });
  }

  // Part 5
  const marital = { single: 'S', married: 'M', divorced: 'D', widowed: 'W', separated: 'E', annulled: 'A' }[str(a, 'marital')];
  if (marital) checkValue.push(['P10_Line1_MaritalStatus', marital]);
  yesNo('P7_Line2_Forces', str(a, 'spouseMilitary'));
  put('Part9Line3_TimesMarried[0]', digits(str(a, 'timesMarried')));
  put('P10_Line4a_FamilyName[0]', str(a, 'spouse.family'));
  put('P10_Line4a_GivenName[0]', str(a, 'spouse.given'));
  put('P10_Line4a_MiddleName[0]', str(a, 'spouse.middle'));
  put('P10_Line4d_DateofBirth[0]', str(a, 'spouse.dob'));
  put('P10_Line4e_DateEnterMarriage[0]', str(a, 'spouse.married'));
  yesNo('P10_Line5_Citizen', str(a, 'spouseSameAddress'));
  if (a.spouseCitizenHow === 'birth') checkValue.push(['P10_Line5a_When', 'B']);
  if (a.spouseCitizenHow === 'other') {
    checkValue.push(['P10_Line5a_When', 'O']);
    put('P10_Line5b_DateBecame[0]', str(a, 'spouse.citizenDate'));
  }
  const spouseA = digits(str(a, 'spouse.aNumber'));
  if (spouseA) put('P7_Line6_ANumber[0]', spouseA.padStart(9, '0'));
  put('P10_Line4g_Employer[0]', digits(str(a, 'spouse.timesMarried')));
  put('TextField1[0]', str(a, 'spouse.employer'));

  // Part 6
  put('P11_Line1_TotalChildren[0]', digits(str(a, 'childrenCount')));
  const support = ['P9_Line5a', 'P6_ChildTwo', 'P6_ChildThree'];
  for (const r of [1, 2, 3]) {
    const c = `child${r}`;
    if (!str(a, `${c}.name`)) continue;
    put(`P7_EmployerName${r}[0]`, str(a, `${c}.name`));
    put(`P7_From${r}[0]`, str(a, `${c}.dob`));
    put(`P7_OccupationFieldStudy${r}[0]`, str(a, `${c}.residence`));
    put(`P7_OccupationFieldStudy${r}[1]`, str(a, `${c}.relationship`));
    yesNo(support[r - 1], str(a, `${c}.support`));
  }

  // Part 7. Row 1 is the current one: its "To" column is printed as PRESENT.
  for (const r of [1, 2, 3]) {
    const j = `job${r}`;
    if (!str(a, `${j}.name`)) continue;
    put(`P5_EmployerName${r}[0]`, str(a, `${j}.name`));
    put(`P7_City${r}[0]`, str(a, `${j}.city`));
    put(`P7_State${r}[0]`, str(a, `${j}.state`));
    put(`P7_ZipCode${r}[0]`, str(a, `${j}.zip`));
    put(`P7_Country${r}[0]`, str(a, `${j}.country`));
    put(`P7_From${r}[1]`, str(a, `${j}.from`));
    if (r > 1) put(`P7_To${r}[0]`, str(a, `${j}.to`));
    put(`P7_OccupationFieldStudy${r}[2]`, str(a, `${j}.occupation`));
  }

  // Part 8
  for (const r of [1, 2, 3, 4, 5, 6]) {
    const t = `trip${r}`;
    if (!str(a, `${t}.left`)) continue;
    put(`P8_Line1_DateLeft${r}[0]`, str(a, `${t}.left`));
    put(`P8_Line1_DateReturn${r}[0]`, str(a, `${t}.returned`));
    put(r === 1 ? 'P9_Line1_Countries1[0]' : `P8_Line1_Countries${r}[0]`, str(a, `${t}.countries`));
  }

  // Part 9
  for (const [item, base] of Object.entries(PART9_FIELDS)) yesNo(base, str(a, `p9.${item}`));
  // Item 22.a asks "Are you a male who…": a woman's answer is No.
  if (a.sex === 'female') yesNo(PART9_FIELDS['22.a'], 'no');
  for (const r of [1, 2, 3, 4, 5]) {
    const c = `crime${r}`;
    if (!str(a, `${c}.what`)) continue;
    put(`P12_Line29_why${r}[0]`, str(a, `${c}.what`));
    put(`P12_Line29_Date${r}[0]`, str(a, `${c}.date`));
    put(`P12_Line29_DateOfConv${r}[0]`, str(a, `${c}.convicted`));
    put(`P12_Line29_Outcome${r}[1]`, str(a, `${c}.place`));
    put(`P12_Line29_Outcome${r}[0]`, str(a, `${c}.result`));
    put(`P12_Line29_Outcome${r}[2]`, str(a, `${c}.sentence`));
  }
  put('P9_Line22c_Date[0]', str(a, 'ss.date'));
  put('P9_Line22c_SSNumber[0]', digits(str(a, 'ss.number')));
  put('P9_NobilityTitles[0]', str(a, 'nobilityTitles'));

  // Part 10
  yesNo('P10_Line1_Citizen', str(a, 'feeReduction'));
  if (a.feeReduction === 'yes') {
    put('P10_Line2_TotalHouseholdIn[0]', digits(str(a, 'household.income')));
    put('P10_Line3_HouseHoldSize[0]', digits(str(a, 'household.size')));
    put('P11_Line1_TotalChildren[1]', digits(str(a, 'household.earners')));
    yesNo('P10_Line5a', str(a, 'headOfHousehold'));
    put('P10_Line5b_NameOfHousehold[0]', str(a, 'headName'));
  }

  // Part 11. The signature (Item 4) stays empty: it must be signed by hand.
  put('P12_Line3_Telephone[0]', digits(str(a, 'phone')).replace(/^1(?=\d{10}$)/, ''));
  put('P12_Line3_Mobile[0]', digits(str(a, 'mobile')).replace(/^1(?=\d{10}$)/, ''));
  put('P12_Line5_Email[0]', str(a, 'email'));

  // Parts 12 and 13: the interpreter and the preparer. They sign and date by hand. Neither part
  // has an address or (for the preparer) an attorney statement in this edition.
  const phone = (s: string) => digits(s).replace(/^1(?=\d{10}$)/, '');
  const help = assistance(a, { interpreter: usedInterpreter(a), preparer: usedPreparer(a) });
  if (help.interpreter) {
    const p = help.interpreter;
    put('P14_Line1_nterpreterFamilyName[0]', p.family);
    put('P14_Line1_nterpreterGivenName[0]', p.given);
    put('P14_Line2_NameofBusinessorOrgName[0]', p.business);
    put('P14_Line4_Telephone[0]', phone(p.phone));
    put('P14_Line5_Mobile[0]', phone(p.mobile));
    put('P14_Line5_EmailAddress[0]', p.email);
    put('P14_NameOfLanguage[0]', p.language);
  }
  if (help.preparer) {
    const p = help.preparer;
    put('P15_Line1_PreparerFamilyName[0]', p.family);
    put('P15_Line1_PreparerGivenName[0]', p.given);
    put('P15_Line2_NameofBusinessorOrgName[0]', p.business);
    put('P15_Line4_Telephone[0]', phone(p.phone));
    put('P15_Line5_Mobile[0]', phone(p.mobile));
    put('P15_Line6_Email[0]', p.email);
  }

  // Part 14: the first explanations of Part 9 answers.
  flaggedPart9(a)
    .filter((e) => str(a, `explain.${e.item}.text`))
    .slice(0, PART14_BLOCKS)
    .forEach((e, i) => {
      const [page, part, item, body] = PART14[i];
      put(page, String(e.page));
      put(part, '9');
      put(item, e.item);
      put(body, str(a, `explain.${e.item}.text`));
    });

  return { text, checkValue, check, select };
}

/** Fills the official N-400 PDF with the answers and returns the new file's bytes. */
export async function fillN400(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const index = fieldIndex(doc.getForm());
  const plan = planN400(a);
  const get = (name: string) => {
    const f = index.get(name);
    if (!f) throw new Error(`No such field: ${name}`);
    return f;
  };

  for (const [name, raw] of Object.entries(plan.text)) {
    const field = get(name);
    if (!(field instanceof PDFTextField)) throw new Error(`Not a text field: ${name}`);
    // Many N-400 fields auto-size their text, which fills a table cell with one huge word.
    setFieldText(field, raw, 9);
  }
  for (const [base, value] of plan.checkValue) {
    const match = optionBoxes(index, base).find((o) => o.value === value);
    if (!match) throw new Error(`No "${value}" box in ${base}`);
    match.box.check();
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

  doc.setTitle('Form N-400, Application for Naturalization');
  return doc.save();
}
