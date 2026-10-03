import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { parseUnit } from '../engine/validation';
import { fieldIndex, optionBoxes, selectOption, setFieldText } from './common';

// Fields of USCIS Form I-864, edition 08/24/26 (public/forms/i-864.pdf), named by the last segment
// of their full name and placed by where they sit on the printed page. The sponsor's fields carry
// "P4" and the immigrant's "P2" although they print as Parts 2 and 3, and the Part 8 statement boxes
// share their name with the "Employed" box of Part 6; the mapping follows the page, not the names.

export interface I864Plan {
  text: Record<string, string>;
  check: string[];
  checkValue: [string, string][];
  select: Record<string, string>;
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');
const amount = (a: Answers, id: string) => Number(digits(str(a, id)) || 0);

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

/** Address blocks whose fields are lettered after the item number: 2.a in care of, 2.b street… */
const lettered = (p: string, letters: string): AddressFields => {
  const l = letters.split('');
  const at = (i: number) => `${p}${l[i]}`;
  const careOf = l.length === 10;
  const o = careOf ? 1 : 0;
  return {
    careOf: careOf ? `${at(0)}_InCareOf[0]` : undefined,
    street: `${at(o)}_StreetNumberName[0]`,
    unit: `${at(o + 1)}_Unit`,
    number: `${at(o + 2)}_AptSteFlrNumber[0]`,
    city: `${at(o + 3)}_CityOrTown[0]`,
    state: `${at(o + 4)}_State[0]`,
    zip: `${at(o + 5)}_ZipCode[0]`,
    province: `${at(o + 6)}_Province[0]`,
    postal: `${at(o + 7)}_PostalCode[0]`,
    country: `${at(o + 8)}_Country[0]`,
  };
};

const immigrantAddress: AddressFields = {
  careOf: 'P2_Line2_InCareOf[0]',
  street: 'P2_Line2_StreetNumberName[0]',
  unit: 'P2_Line2_Unit',
  number: 'P2_Line2_AptSteFlrNumber[0]',
  city: 'P2_Line2_CityOrTown[0]',
  state: 'P2_Line2_State[0]',
  zip: 'P2_Line2_ZipCode[0]',
  province: 'P2_Line2_Province[0]',
  postal: 'P2_Line2_PostalCode[0]',
  country: 'P2_Line2_Country[0]',
};

/** Part 4 family members: name, relationship, date of birth, A-Number and USCIS account. */
const members = [
  ['P3_Line3a_FamilyName[0]', 'P3_Line3b_GivenName[0]', 'P3_Line3c_MiddleName[0]', 'P3_Line4_Relationship[0]', 'P3_Line_DateOfBirth[0]', 'P2_Line5_AlienNumber[1]', 'P3_Line7_AcctIdentifier[0]'],
  ['P3_Line8a_FamilyName[0]', 'P3_Line8b_GivenName[0]', 'P3_Line8c_MiddleName[0]', 'P3_Line9_Relationship[0]', 'P3_Line10_DateOfBirth[0]', 'P3_Line11_AlienNumber[0]', 'P3_Line12_AcctIdentifier[0]'],
  ['P3_Line13a_FamilyName[0]', 'P3_Line13b_GivenName[0]', 'P3_Line13c_MiddleName[0]', 'P3_Line14_Relationship[0]', 'P3_Line15_DateOfBirth[0]', 'P2_Line5_AlienNumber[2]', 'P3_Line17_AcctIdentifier[0]'],
  ['P3_Line18a_FamilyName[0]', 'P3_Line18b_GivenName[0]', 'P3_Line18c_MiddleName[0]', 'P3_Line19_Relationship[0]', 'P3_Line20_DateOfBirth[0]', 'P3_Line21_AlienNumber[0]', 'P3_Line22_AcctIdentifier[0]'],
];

/** Part 6 people whose income is added: name, relationship and current income. */
const earners = [
  ['P6_Line3_Name[0]', 'P6_Line4_Relationship[0]', 'P6_Line5_CurrentIncome[0]'],
  ['P6_Line6_Name[0]', 'P6_Line7_Relationship[0]', 'P6_Line8_CurrentIncome[0]'],
  ['P6_Line9_Name[0]', 'P6_Line10_Relationship[0]', 'P6_Line11_CurrentIncome[0]'],
  ['P6_Line12_Name[0]', 'P6_Line13_Relationship[0]', 'P6_Line14_CurrentIncome[0]'],
];

/** Rows of a "Is there another?" table that are shown: row 1, then each one whose previous row said yes. */
function shownRows(a: Answers, id: string, max: number) {
  const out: number[] = [];
  for (let i = 1; i <= max; i++) {
    if (i > 1 && a[`${id}.more${i - 1}`] !== 'yes') break;
    out.push(i);
  }
  return out;
}

export function planI864(a: Answers): I864Plan {
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
    if (st) select[f.state] = st;
    put(f.zip, str(a, `${prefix}.zip`));
    put(f.province, str(a, `${prefix}.province`));
    put(f.postal, str(a, `${prefix}.postal`));
    put(f.country, str(a, `${prefix}.country`));
  };

  // Part 1. 1.b and 1.c are for employment-based petitions, which the app doesn't cover.
  const basis = { petitioner: '1A', onlyJoint: '1D', firstJoint: '1E', secondJoint: '1E', substitute: '1F' }[str(a, 'basis')];
  if (basis) checkValue.push(['P1_Line1a-f_CB', basis]);
  if (a.basis === 'firstJoint') checkValue.push(['P1_Line1e1_Checkbox', '1']);
  if (a.basis === 'secondJoint') checkValue.push(['P1_Line1e1_Checkbox', '2']);
  if (a.basis === 'substitute') put('P1_Line1f_Relationship[0]', str(a, 'substitute.relationship'));

  // Part 2: the sponsor. The name and A-Number repeat at the top of Part 11.
  for (const i of [0, 1]) {
    put(`P4_Line1a_FamilyName[${i}]`, str(a, 'name.family'));
    put(`P4_Line1b_GivenName[${i}]`, str(a, 'name.given'));
    put(`P4_Line1c_MiddleName[${i}]`, str(a, 'name.middle'));
  }
  address('mailing', lettered('P4_Line2', 'abcdefghij'));
  yn('P1_Line3_Checkbox', a.mailingSame);
  if (a.mailingSame === 'no') address('home', lettered('P4_Line4', 'abcdefghi'));
  put('P4_Line5_CountryOfDomicile[0]', str(a, 'domicile'));
  put('P4_Line6_DateOfBirth[0]', str(a, 'dob'));
  put('P4_Line7_CityofBirth[0]', str(a, 'birthCountry'));
  put('P4_Line10_SocialSecurityNumber[0]', digits(str(a, 'ssn')));
  const status = { A: 'P4_Line11a_Checkbox[0]', B: 'P4_Line11b_Checkbox[0]', C: 'P4_Line11c_Checkbox[0]' }[str(a, 'status')];
  if (status) check.push(status);
  const aNumber = digits(str(a, 'aNumber'));
  if (aNumber) for (const i of [0, 1]) put(`P4_Line12_AlienNumber[${i}]`, aNumber.padStart(9, '0'));
  put('P4_Line13_AcctIdentifier[0]', digits(str(a, 'uscisAccount')));
  if (a.basis === 'petitioner') yn('P4_Line14_Checkboxes', a.activeDuty);

  // Part 3: the principal immigrant.
  put('P2_Line1a_FamilyName[0]', str(a, 'principal.family'));
  put('P2_Line1b_GivenName[0]', str(a, 'principal.given'));
  put('P2_Line1c_MiddleName[0]', str(a, 'principal.middle'));
  address('principal.mailing', immigrantAddress);
  put('P2_Line3_CountryCitizenship[0]', str(a, 'principal.citizenship'));
  put('P2_Line4_DateOfBirth[0]', str(a, 'principal.dob'));
  const principalA = digits(str(a, 'principal.aNumber'));
  if (principalA) put('P2_Line5_AlienNumber[0]', principalA.padStart(9, '0'));
  put('Pt2_Line6_USCISOnlineAcctNumber[0]', digits(str(a, 'principal.uscisAccount')));
  put('P2_Line7_DaytimePhoneNumber[0]', digits(str(a, 'principal.phone')));

  // Part 4: who is sponsored, and how many.
  yn('P3_Line1_Checkbox', a.sponsorsPrincipal);
  if (a.familyTiming === 'same') check.push('P3_Line2_SponsoringFamily[0]');
  if (a.familyTiming === 'later') check.push('P3_Line2_SponsoringFamily[1]');
  const listed = a.familyTiming === 'same' || a.familyTiming === 'later' ? shownRows(a, 'member', 4) : [];
  for (const i of listed) {
    const [family, given, middle, relationship, dob, aNum, account] = members[i - 1];
    const id = `member${i}`;
    put(family, str(a, `${id}.family`));
    put(given, str(a, `${id}.given`));
    put(middle, str(a, `${id}.middle`));
    put(relationship, str(a, `${id}.relationship`));
    put(dob, str(a, `${id}.dob`));
    const n = digits(str(a, `${id}.aNumber`));
    if (n) put(aNum, n.padStart(9, '0'));
    put(account, digits(str(a, `${id}.uscisAccount`)));
  }
  const sponsored = (a.sponsorsPrincipal === 'yes' ? 1 : 0) + listed.filter((i) => str(a, `member${i}.family`)).length;

  // Part 5: household size. Item 1 is the people sponsored here; item 2 is the sponsor.
  const counts = ['hh.spouse', 'hh.children', 'hh.otherDependents', 'hh.previouslySponsored', 'hh.i864a'].map((id) => amount(a, id));
  put('P3_Line28_TotalNumberofImmigrants[0]', String(sponsored));
  put('P5_Line2_Yourself[0]', '1');
  ['P5_Line3_Married[0]', 'P5_Line4_DependentChildren[0]', 'P5_Line5_OtherDependents[0]', 'P5_Line6_Sponsors[0]', 'P5_Line7_SameResidence[0]'].forEach((f, i) => {
    if (str(a, ['hh.spouse', 'hh.children', 'hh.otherDependents', 'hh.previouslySponsored', 'hh.i864a'][i])) put(f, String(counts[i]));
  });
  put('Override[0]', String(sponsored + 1 + counts.reduce((x, y) => x + y, 0)));

  // Part 6: employment and income.
  if (a.employment === 'employed') {
    check.push('P6_Line1_Checkbox[0]');
    put('P6_Line1a_NameofEmployer[0]', str(a, 'job.occupation'));
    put('P6_Line1a1_NameofEmployer[0]', str(a, 'job.employer1'));
    put('P6_Line1a2_NameofEmployer[0]', str(a, 'job.employer2'));
  }
  if (a.employment === 'self') {
    check.push('P6_Line4_Checkbox[0]');
    put('P6_Line4a_SelfEmployedAs[0]', str(a, 'job.selfOccupation'));
  }
  if (a.employment === 'retired') {
    check.push('P6_Line5_Checkbox[0]');
    put('P6_Line5a_DateRetired[0]', str(a, 'job.retiredSince'));
  }
  if (a.employment === 'unemployed') {
    check.push('P6_Line6_Checkbox[0]');
    put('P6_Line6a_DateofUnemployment[0]', str(a, 'job.unemployedSince'));
  }
  const mine = amount(a, 'income.mine');
  if (str(a, 'income.mine')) put('P6_Line2_TotalIncome[0]', String(mine));
  let household = mine;
  if (a['hhIncome.more0'] === 'yes') {
    for (const i of shownRows(a, 'hhIncome', 4)) {
      const [name, relationship, income] = earners[i - 1];
      put(name, str(a, `hhIncome${i}.name`));
      put(relationship, str(a, `hhIncome${i}.relationship`));
      if (str(a, `hhIncome${i}.amount`)) put(income, String(amount(a, `hhIncome${i}.amount`)));
      household += amount(a, `hhIncome${i}.amount`);
    }
    if (a.i864aStatus === 'completed') check.push('P6_Line16_CompletedForm[0]');
    if (a.i864aStatus === 'intending') {
      check.push('P6_Line17_NotNeedComplete[0]');
      put('P6_Line17_Name[0]', str(a, 'i864a.intendingName'));
    }
  }
  if (str(a, 'income.mine')) put('P6_Line15_TotalHouseholdIncome[0]', String(household));
  yn('P6_Line18a_Checkbox', a.filedTaxes);
  (['a', 'b', 'c'] as const).forEach((l, i) => {
    put(`P6_Line19${l}_TaxYear[0]`, digits(str(a, `tax${i + 1}.year`)));
    if (str(a, `tax${i + 1}.income`)) put(`P6_Line19${l}_TotalIncome[0]`, String(amount(a, `tax${i + 1}.income`)));
  });
  if (a.filedTaxes === 'no' && a.notRequired === 'yes') check.push('P6_Line17_IWasNotReq[0]');

  // Part 7: assets, only when the sponsor adds them.
  if (a.useAssets === 'yes') {
    const mineAssets = ['assets.cash', 'assets.realEstate', 'assets.stocks'].map((id) => amount(a, id));
    ['P7_Line1_BalanceofAccounts[0]', 'P7_Line2_RealEstate[0]', 'P7_Line3_StocksBonds[0]'].forEach((f, i) => put(f, String(mineAssets[i])));
    const own = mineAssets.reduce((x, y) => x + y, 0);
    put('P7_Line4_Total[0]', String(own));
    const hh = amount(a, 'assets.household');
    put('P7_Line5_TotalAssetsHouseholdMembers[0]', String(hh));
    let principal = 0;
    if (a.sponsorsPrincipal === 'yes') {
      const p = ['principalAssets.cash', 'principalAssets.realEstate', 'principalAssets.stocks'].map((id) => amount(a, id));
      ['P7_Line6_BalanceofAccounts[0]', 'P7_Line7_RealEstate[0]', 'P7_Line8_StocksBonds[0]'].forEach((f, i) => put(f, String(p[i])));
      principal = p.reduce((x, y) => x + y, 0);
      put('P7_Line9_Total[0]', String(principal));
    }
    put('P7_Line10_TotalValueAssets[0]', String(own + hh + principal));
  }

  // Part 8. The signature (Item 6.a) stays empty: it must be signed by hand.
  if (a.readsEnglish === 'A') check.push('P6_Line1_Checkbox[1]');
  if (a.readsEnglish === 'B') {
    check.push('P6_Line1_Checkbox[2]');
    put('P8_Line1b_language[0]', str(a, 'fluentLanguage'));
  }
  put('P8_Line3_DaytimeTelephoneNumber[0]', digits(str(a, 'phone')));
  put('P8_Line4_MobileTelephoneNumber[0]', digits(str(a, 'mobile')));
  put('P7Line7_EmailAddress[0]', str(a, 'email'));

  return { text, check, checkValue, select };
}

/** Fills the official I-864 PDF with the answers and returns the new file's bytes. */
export async function fillI864(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const index = fieldIndex(doc.getForm());
  const plan = planI864(a);
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

  doc.setTitle('Form I-864, Affidavit of Support Under Section 213A of the INA');
  return doc.save();
}
