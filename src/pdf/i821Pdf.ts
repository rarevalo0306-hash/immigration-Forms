import { PDFCheckBox, PDFDocument, PDFDropdown, type PDFField, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { flaggedI821, P7_ITEMS } from '../forms/i821Part7';
import { assistance, type HelperPerson } from '../forms/assistance';
import { parseUnit } from '../engine/validation';
import { fieldIndex, fieldsBySegment, optionBoxes, selectOption, setFieldText } from './common';

// Fields of USCIS Form I-821, edition 01/20/25 (public/forms/i-821.pdf), named by the last segment of
// their full name and placed by where they sit on the printed page. Part 2's names run behind the
// printed items from Item 18 on (the date of last entry, Item 19, is "P2_Line7_DateOfBirth"), and
// one name repeats: the date of birth (Item 10) and the date of the current marriage (Item 18) are
// both "Part2_Item10_DateOfBirth[0]". A name with "#n" picks the n-th field (from 0) with that
// name; a plain name fills them all (the name and A-Number repeat at the top of Part 11).
//
// Parts 4-6 and 9-10 have more such names, matched by position:
// - Part 4's online account number "Part4_Item1_USCISNumber[0]" is also Child 2's (Part 6, Item 9);
//   Part 4, Item 11 is "_YesNoDontKnow"; Child 1's Item 7 is "Part5_Item7_ChildAppTPS" and Child 2's
//   TPS dates are "Part6_Item13_ChildTPSFrom" / "Part6_Item12_ChildTPSTo".
// - The interpreter's language (Part 9's certification) is "Part6_Item12_Province[0]" #1, after
//   Child 2's province (#0). The interpreter's mobile is "Part10_Item5_MobilePhone[0]" #0 and the
//   preparer's #1; the interpreter's given name is "Part9_Item1_GivenName[1]".
// - Part 5's "I do not know" boxes export "I" or "D" depending on the item, so the Yes / No / Don't
//   know boxes are picked by position.

export interface I821Plan {
  text: Record<string, string>;
  check: string[];
  checkValue: [string, string][];
  select: Record<string, string>;
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');

const RACE: Record<string, string> = { WH: 'W', AS: 'A', BL: 'B', AI: 'I', HW: 'H' };

export function planI821(a: Answers): I821Plan {
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
  const address = (prefix: string, p: string, careOf = false) => {
    if (careOf) put(`${p}_InCareofName[0]`, str(a, `${prefix}.careOf`));
    put(`${p}_StreetNumberName[0]`, str(a, `${prefix}.street`));
    const unit = parseUnit(str(a, `${prefix}.unit`));
    if (unit) {
      checkValue.push([`${p}_Unit`, unit.kind]);
      put(`${p}_AptSteFlrNumber[0]`, unit.number);
    }
    put(`${p}_CityOrTown[0]`, str(a, `${prefix}.city`));
    const st = str(a, `${prefix}.state`).toUpperCase();
    if (st) select[`${p}_State[0]`] = st;
    put(`${p}_ZipCode[0]`, str(a, `${prefix}.zip`));
  };
  const notes: { page: string; part: string; item: string; text: string }[] = [];
  /** An address with province, postal code and country; `names` overrides a field's full name. */
  const fullAddress = (src: Pick<HelperPerson, 'street' | 'unit' | 'city' | 'state' | 'zip' | 'province' | 'postal' | 'country'>, p: string, names: Partial<Record<'province', string>> = {}) => {
    put(`${p}_StreetNumberName[0]`, src.street);
    const unit = parseUnit(src.unit);
    if (unit) {
      checkValue.push([`${p}_Unit`, unit.kind]);
      put(`${p}_AptSteFlrNumber[0]`, unit.number);
    }
    put(`${p}_CityOrTown[0]`, src.city);
    if (src.state) select[`${p}_State[0]`] = src.state.toUpperCase();
    put(`${p}_ZipCode[0]`, src.zip);
    put(names.province ?? `${p}_Province[0]`, src.province);
    put(`${p}_PostalCode[0]`, src.postal);
    put(`${p}_Country[0]`, src.country);
  };
  const addressOf = (prefix: string) => ({
    street: str(a, `${prefix}.street`),
    unit: str(a, `${prefix}.unit`),
    city: str(a, `${prefix}.city`),
    state: str(a, `${prefix}.state`),
    zip: str(a, `${prefix}.zip`),
    province: str(a, `${prefix}.province`),
    postal: str(a, `${prefix}.postal`),
    country: str(a, `${prefix}.country`),
  });
  const aNum = (field: string, id: string) => {
    const n = digits(str(a, id));
    if (n) put(field, n.padStart(9, '0'));
  };
  /** Yes / No / I don't know boxes `base[0..2]`, by position. */
  const ynd = (base: string, value: unknown, values: [string, string, string]) => {
    const k = ['yes', 'no', 'unknown'].indexOf(String(value ?? ''));
    if (k >= 0) checkValue.push([base, values[k]]);
  };
  /** TPS dates: "Present" when only the start is known, "I do not know the dates" when neither is. */
  const tpsDates = (id: string, from: string, to: string, present: string, unknown: string) => {
    const f = str(a, `${id}.tpsFrom`);
    const t = str(a, `${id}.tpsTo`);
    put(from, f);
    put(to, t);
    if (f && !t) check.push(present);
    if (!f && !t) check.push(unknown);
  };

  // Part 1: type of application.
  if (a.appType === '1a' || a.appType === '1b') checkValue.push(['Part1_Item1_ApplicationType', str(a, 'appType')]);
  if (a.appType === '1b' && a.grantedBy === 'U') check.push('Part1_Item2_GrantedTPSU[0]');
  if (a.appType === '1b' && a.grantedBy === 'I') check.push('Part1_Item2_GrantedTPSI[0]');
  if (a.appType === '1a' && str(a, 'prior.explain')) notes.push({ page: '1', part: '1', item: '1.a', text: str(a, 'prior.explain') });
  if (a.ead === 'A' || a.ead === 'B') checkValue.push(['Part1_Item3_EADApp', str(a, 'ead')]);
  put('Part1_TPScountry[0]', str(a, 'tpsCountry'));

  // Part 2: about you.
  put('Part2_Item1_FamilyName[0]', str(a, 'name.family'));
  put('Part2_Item1_GivenName[0]', str(a, 'name.given'));
  put('Part2_Item1_MiddleName[0]', str(a, 'name.middle'));
  if (a['otherName.more0'] === 'yes') {
    for (const i of [1, 2]) {
      if (i > 1 && a['otherName.more1'] !== 'yes') break;
      put(`Part2_Item${i + 1}_FamilyName[0]`, str(a, `otherName${i}.family`));
      put(`Part2_Item${i + 1}_GivenName[0]`, str(a, `otherName${i}.given`));
      put(`Part2_Item${i + 1}_MiddleName[0]`, str(a, `otherName${i}.middle`));
    }
  }
  address('mailing', 'Part2_Item4', true);
  yn('Part2_Item5_YN', a.mailingSame);
  if (a.mailingSame === 'no') address('home', 'Part2_Item6');
  const aNumber = digits(str(a, 'aNumber'));
  if (aNumber) put('Part2_Item7_AlienNumber[0]', aNumber.padStart(9, '0'));
  put('Part2_Item8_AcctIdentifier[0]', digits(str(a, 'uscisAccount')));
  put('Part2_Item9_SocialSecurityNumber[0]', digits(str(a, 'ssn')));
  put('Part2_Item10_DateOfBirth[0]#0', str(a, 'dob'));
  put('Part2_Item11_DateOfBirth[1]', str(a, 'otherDob1'));
  put('Part2_Item11_DateOfBirth[0]', str(a, 'otherDob2'));
  if (a.sex === 'male') checkValue.push(['Part2_Item12_Sex', 'M']);
  if (a.sex === 'female') checkValue.push(['Part2_Item12_Sex', 'F']);
  put('Part2_Item13_CityOrTown[0]', str(a, 'birthCity'));
  put('Part2_Item14_CountryofBirth[0]', str(a, 'birthCountry'));
  ['a', 'b', 'c', 'd'].forEach((l, i) => {
    put(`Part2_Item15${l}[0]`, str(a, `residence${i + 1}`));
    put(`Part2_Item16${l}[0]`, str(a, `citizenship${i + 1}`));
  });
  if (str(a, 'marital')) checkValue.push(['Part2_Item17_MaritalStatus', str(a, 'marital')]);
  if (a.marital === 'O') put('Part2_Item17_MaritalStatusOther[0]', str(a, 'marital.other'));
  if (a.marital === 'M') put('Part2_Item10_DateOfBirth[0]#1', str(a, 'marriage.date'));
  put('P2_Line7_DateOfBirth[0]', str(a, 'entry.date'));
  put('Part2_Item19_ImmigrationStatus[0]', str(a, 'entry.status'));
  put('Part2_Item20_PortofEntry[0]', str(a, 'entry.port'));
  put('Part2_Item20_CityOrTown[0]', str(a, 'entry.city'));
  const entryState = str(a, 'entry.state').toUpperCase();
  if (entryState) select['Part2_Item20_State[0]'] = entryState;
  put('Part2_Item22_I94[0]', digits(str(a, 'i94')));
  put('Part2_Item21_AuthorizedPdofStay[0]', str(a, 'i94.until'));
  put('Part2_Item22_Passport[0]', str(a, 'passport.number'));
  put('Part2_Item22_Passport[1]', str(a, 'travelDoc'));
  put('Part2_Item23a_AddlPassport[0]', str(a, 'passport.other1'));
  put('Part2_Item23b_AddlPassport[0]', str(a, 'passport.other2'));
  put('Part2_Item24_CountryofIssuance[0]', str(a, 'passport.country'));
  put('Part2_Item24_PassportExpiration[0]', str(a, 'passport.expires'));
  put('Part2_Item25_ImmigrationStatus[0]', str(a, 'currentStatus'));
  yn('Part2_Item25_ImmigrationProceedings', a.proceedings);
  if (a.proceedings === 'yes') {
    for (const v of Array.isArray(a.proceedingTypes) ? a.proceedingTypes : []) if ('ABC'.includes(v)) checkValue.push(['Part2_Item27_ProceedingType', v]);
    put('Part2_Item28_LocDOJProceedings[0]', str(a, 'proc.location'));
    put('Part2_Item29_LocFedCtProceedings[0]', str(a, 'proc.federal'));
    put('Part2_Item31a_ProceedingDateFrom[0]', str(a, 'proc.from'));
    if (str(a, 'proc.to')) put('Part2_Item31b_ProceedingDateTo[0]', str(a, 'proc.to'));
    else if (str(a, 'proc.from')) check.push('Part2_Item31e_Present[0]');
  }

  // Part 3: biographic information. This edition's eye and hair boxes use the I-485 codes.
  if (a.ethnicity === 'hispanic') checkValue.push(['Part3_Item1_Ethnicity', 'H']);
  if (a.ethnicity === 'notHispanic') checkValue.push(['Part3_Item1_Ethnicity', 'N']);
  for (const r of Array.isArray(a.race) ? a.race : []) if (RACE[r]) check.push(`Part3_Item2_Race${RACE[r]}[0]`);
  if (a.heightFeet) select['Pt2Line3_HeightFeet[0]'] = str(a, 'heightFeet');
  if (a.heightInches) select['Pt2Line3_HeightInches[0]'] = str(a, 'heightInches');
  const weight = digits(str(a, 'weight'));
  if (weight) {
    const w = weight.padStart(3, '0').slice(-3);
    [0, 1, 2].forEach((i) => put(`Pt2Line4_HeightInches${i + 1}[0]`, w[i]));
  }
  if (str(a, 'eyes')) checkValue.push(['Part3_Item5_Eyecolor', str(a, 'eyes')]);
  if (str(a, 'hair')) checkValue.push(['Part3_Item6_Haircolor', str(a, 'hair')]);

  // Parts 4-6: only for late initial filers.
  const late = a.appType === '1a' && a.lateInitial === 'yes';
  if (late && (a.marital === 'M' || a.marital === 'E')) {
    put('Part4_Item1_USCISNumber[0]#0', digits(str(a, 'spouse.uscisAccount')));
    aNum('Part4_Item2_AlienNumber[0]', 'spouse.aNumber');
    put('Part4_Item3_FamilyName[0]', str(a, 'spouse.family'));
    put('Part4_Item3_GivenName[0]', str(a, 'spouse.given'));
    put('Part4_Item3_MiddleName[0]', str(a, 'spouse.middle'));
    fullAddress(addressOf('spouse'), 'Part4_Item4');
    put('Part4_Item5_DateOfBirth[0]', str(a, 'spouse.dob'));
    put('Part4_Item6_DateOfMarriage[0]', str(a, 'marriage.date'));
    const city = str(a, 'spouse.marriageCity');
    const country = str(a, 'spouse.marriageCountry');
    put('Part4_Item7_PlaceofMarriage[0]', str(a, 'spouse.marriagePlace') || [city, country].filter(Boolean).join(', '));
    put('Part4_Item8_CityOrTown[0]', city);
    const st = str(a, 'spouse.marriageState').toUpperCase();
    if (st) select['Part4_Item8_State[0]'] = st;
    put('Part4_Item8_Province[0]', str(a, 'spouse.marriageProvince'));
    put('Part4_Item8_Country[0]', country);
    if (a['spouse.tps'] === 'yes') check.push('Part4_Item9_TPSY[0]');
    if (a['spouse.tps'] === 'no') check.push('Part4_Item9_TPSN[0]');
    if (a['spouse.tps'] === 'yes') {
      tpsDates('spouse', 'Part4_Item10b_DateFrom[0]', 'Part4_Item10c_DateTo[0]', 'Part4_Item10d_Present[0]', 'Part4_Item10e_IDK[0]');
      ynd('_YesNoDontKnow', a['spouse.tpsValid'], ['Y', 'N', 'D']);
    }
  }
  if (late && a.marital !== 'S' && a['formerSpouse.more0'] === 'yes') {
    const former = [
      { p: 'former1', n: 1, aNum: 'Part5_Item3_AlienNumber[0]', tps: 'Part5_Item8_YDI', dates: 9, applying: 'Part5_Item10_YNI' },
      { p: 'former2', n: 11, aNum: 'Part5_Item13_AlienNumber[0]', tps: 'Part5_Item18_YNI', dates: 19, applying: 'Part5_Item20_YNI' },
    ];
    former.forEach((f, i) => {
      if (i > 0 && a['formerSpouse.more1'] !== 'yes') return;
      const it = (k: number) => `Part5_Item${f.n + k}`;
      put(`${it(0)}_FamilyName[0]`, str(a, `${f.p}.family`));
      put(`${it(0)}_GivenName[0]`, str(a, `${f.p}.given`));
      put(`${it(0)}_MiddleName[0]`, str(a, `${f.p}.middle`));
      put(`${it(1)}_FSpouseNationalities[0]`, str(a, `${f.p}.nationality`));
      aNum(f.aNum, `${f.p}.aNumber`);
      put(`${it(3)}_FSpouseDOB[0]`, str(a, `${f.p}.dob`));
      put(`${it(4)}_FSpouseDOD[0]`, str(a, `${f.p}.dod`));
      put(`${it(5)}_MarriageFrom[0]`, str(a, `${f.p}.from`));
      put(`${it(5)}_MarriageTo[0]`, str(a, `${f.p}.to`));
      put(`${it(6)}_MarriageEnded[0]`, str(a, `${f.p}.ended`));
      // The "I do not know" boxes export "I", except Item 10's, which exports "D".
      ynd(f.tps, a[`${f.p}.tps`], ['Y', 'N', 'I']);
      if (a[`${f.p}.tps`] === 'yes') {
        const d = `Part5_Item${f.dates}`;
        tpsDates(f.p, `${d}a_DateFrom[0]`, `${d}b_DateTo[0]`, `${d}c_Present[0]`, `${d}d_IDK[0]`);
      }
      ynd(f.applying, a[`${f.p}.applying`], ['Y', 'N', f.applying === 'Part5_Item10_YNI' ? 'D' : 'I']);
    });
  }
  if (late && a['child.more0'] === 'yes') {
    const children = [
      { p: 'child1', name: 'Part6_Item1', account: 'Part6_Item2_USCISNumber[0]', aNum: 'Part6_Item3_AlienNumber[0]', dob: 'Part6_Item4_DateOfBirth[0]', addr: 'Part6_Item5', province: undefined, from: 'Part6_Item6_ChildTPSFrom[0]', to: 'Part6_Item6_ChildTPSTo[0]', applying: 'Part5_Item7_ChildAppTPS' },
      { p: 'child2', name: 'Part6_Item8', account: 'Part4_Item1_USCISNumber[0]#1', aNum: 'Part6_Item10_AlienNumber[0]', dob: 'Part6_Item11_DateOfBirth[0]', addr: 'Part6_Item12', province: 'Part6_Item12_Province[0]#0', from: 'Part6_Item13_ChildTPSFrom[0]', to: 'Part6_Item12_ChildTPSTo[0]', applying: 'Part6_Item14_ChildAppTPS' },
    ];
    children.forEach((c, i) => {
      if (i > 0 && a['child.more1'] !== 'yes') return;
      put(`${c.name}_FamilyName[0]`, str(a, `${c.p}.family`));
      put(`${c.name}_GivenName[0]`, str(a, `${c.p}.given`));
      put(`${c.name}_MiddleName[0]`, str(a, `${c.p}.middle`));
      put(c.account, digits(str(a, `${c.p}.uscisAccount`)));
      aNum(c.aNum, `${c.p}.aNumber`);
      put(c.dob, str(a, `${c.p}.dob`));
      fullAddress(addressOf(c.p), c.addr, c.province ? { province: c.province } : {});
      put(c.from, str(a, `${c.p}.tpsFrom`));
      put(c.to, str(a, `${c.p}.tpsTo`));
      yn(c.applying, a[`${c.p}.applying`]);
    });
  }

  // Part 7: eligibility.
  put('Part7_Item1_CountryResidence[0]', str(a, 'nationalOf'));
  put('Part7_Item1_EnterUS[0]', str(a, 'residingSince'));
  yn('Part7_Item1_Travel', a.otherCountries);
  if (a.otherCountries === 'yes') {
    put('Part7_Item2_CountriesTraveled[0]', str(a, 'other.countries'));
    put('Part7_Item2_CountriesTraveledFrom[0]', str(a, 'other.from'));
    put('Part7_Item2_CountriesTraveledTo[0]', str(a, 'other.to'));
    put('Part7_Item2_ImmigrationStatus[0]', str(a, 'other.status'));
  }
  yn('Part7_Item2_ImmigrationOffer', a.offered);
  if (a.offered === 'yes') {
    put('Part7_Item2_DescribeCountries[0]', str(a, 'offered.what'));
    put('Part7_Item2_DidNotAccept[0]', str(a, 'offered.why'));
  }
  for (const it of P7_ITEMS) if (!it.showIf || it.showIf(a)) yn(it.field, a[`p7.${it.item}`]);
  const flagged = flaggedI821(a);
  if (flagged.length && str(a, 'p7.explain')) notes.push({ page: '7', part: '7', item: flagged.length === 1 ? flagged[0].item : `${flagged[0].item}+`, text: str(a, 'p7.explain') });

  // Part 8: statement and contact. The signature (Item 6.a) stays empty: it must be signed by hand.
  if (a.readsEnglish === '1a' || a.readsEnglish === '1b') checkValue.push(['Part8_Item1_AppStmt', str(a, 'readsEnglish')]);
  if (a.readsEnglish === '1b') put('Part8_Item1_Language[0]', str(a, 'fluentLanguage'));
  put('Part8_Item3_DayPhone[0]', digits(str(a, 'phone')));
  put('Part8_Item4_MobilePhone[0]', digits(str(a, 'mobile')));
  put('Part8_Item5_Email[0]', str(a, 'email'));
  if (a.preparer === 'yes') {
    check.push('Part8_Item2_Preparer[0]');
    put('Part8_Item2_PrepName[0]', str(a, 'preparer.name'));
  }

  // Parts 9-10: the interpreter's and preparer's details. Their signatures and dates stay empty.
  const help = assistance(a, { interpreter: a.readsEnglish === '1b', preparer: a.preparer === 'yes' });
  if (help.interpreter) {
    const p = help.interpreter;
    put('Part9_Item1_FamilyName[0]', p.family);
    put('Part9_Item1_GivenName[1]', p.given);
    put('Part9_Item2_OrgName[0]', p.business);
    fullAddress(p, 'Part9_Item3');
    put('Part9_Item4_DaytimePhone[0]', digits(p.phone));
    put('Part10_Item5_MobilePhone[0]#0', digits(p.mobile));
    put('Part9_Item5_Email[0]', p.email);
    put('Part6_Item12_Province[0]#1', p.language);
  }
  if (help.preparer) {
    const p = help.preparer;
    put('Part10_Item1_FamilyName[0]', p.family);
    put('Part10_Item1_GivenName[0]', p.given);
    put('Part10_Item2_OrgName[0]', p.business);
    fullAddress(p, 'Part10_Item3');
    put('Part10_Item4_DaytimePhone[0]', digits(p.phone));
    put('Part10_Item5_MobilePhone[0]#1', digits(p.mobile));
    put('Part10_Item6_Email[0]', p.email);
    if (p.statement === 'notAttorney') checkValue.push(['Part10_Item7_PreparerStmt', 'A']);
    if (p.statement === 'attorneyExtends' || p.statement === 'attorneyNotExtends') {
      checkValue.push(['Part10_Item7_PreparerStmt', 'B']);
      check.push(p.statement === 'attorneyExtends' ? 'Part10_Item7b_Extend[0]' : 'Part10_Item7b_NotExtend[0]');
    }
  }

  // Part 11: additional information.
  notes.slice(0, 5).forEach((n, i) => {
    const line = `AI_${i + 3}`;
    put(`${line}a_PageNumber[0]`, n.page);
    put(`${line}b_PartNumber[0]`, n.part);
    put(`${line}c_ItemNumber[0]`, n.item);
    put(`${line}d_AdditionalInfo[0]`, n.text);
  });

  return { text, check, checkValue, select };
}

/** The fields a plan name points at: "name#n" is the n-th field with that name, "name" all of them. */
export function resolve(index: Map<string, PDFField[]>, name: string): PDFField[] {
  const [base, n] = name.split('#');
  const all = index.get(base);
  if (!all) throw new Error(`No such field: ${base}`);
  if (n === undefined) return all;
  const one = all[Number(n)];
  if (!one) throw new Error(`No field ${name}`);
  return [one];
}

/** Fills the official I-821 PDF with the answers and returns the new file's bytes. */
export async function fillI821(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const fields = form.getFields();
  const all = fieldsBySegment(fields);
  const index = fieldIndex(form);
  const plan = planI821(a);

  // Part 11's text boxes may be rich-text fields, which pdf-lib can't read back when it redraws
  // the form; store them as plain text instead.
  for (const f of fields) if (f instanceof PDFTextField && f.isRichFormatted()) f.disableRichFormatting();

  for (const [name, raw] of Object.entries(plan.text)) {
    for (const field of resolve(all, name)) {
      if (!(field instanceof PDFTextField)) throw new Error(`Not a text field: ${name}`);
      setFieldText(field, raw, 9);
    }
  }
  for (const name of plan.check) {
    for (const field of resolve(all, name)) {
      if (!(field instanceof PDFCheckBox)) throw new Error(`Not a checkbox: ${name}`);
      field.check();
    }
  }
  for (const [base, value] of plan.checkValue) {
    const match = optionBoxes(index, base).find((o) => o.value === value);
    if (!match) throw new Error(`No "${value}" box in ${base}`);
    match.box.check();
  }
  for (const [name, value] of Object.entries(plan.select)) {
    for (const field of resolve(all, name)) {
      if (!(field instanceof PDFDropdown)) throw new Error(`Not a dropdown: ${name}`);
      selectOption(field, value);
    }
  }

  doc.setTitle('Form I-821, Application for Temporary Protected Status');
  return doc.save();
}
