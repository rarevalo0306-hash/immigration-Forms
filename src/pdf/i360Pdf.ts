import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField, StandardFonts } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { parseUnit } from '../engine/validation';
import { fieldIndex, optionBoxes, selectOption, setFieldText, toFormText, wrap } from './common';
import { assistance, usedInterpreter, usedPreparer, type HelperPerson } from '../forms/assistance';
import { CLASSIFICATIONS, RW_ATTEST, forOther, ownPart1 } from '../forms/i360';

// Fields of USCIS Form I-360, edition 01/20/25 (public/forms/i-360.pdf), named by the last segment
// of their full name. Every covered classification is filled (see src/forms/i360.ts).
// Mapped by position:
// - Part 2's boxes are "Pt2Line1[0-15]" out of printed order; their export values are the item
//   letters (A-P), so they are picked by value. Item 1.D.(1) is "Pt2Line1d1_yes" / "_no".
// - Part 6, Item 6.D (father's daytime phone) is "Pt4Line6d_DaytimeTelephoneNumber"; Item 7's
//   branches and Item 7.C are one group "Pt6Line7a" (A, F, N, M, C; O is 7.C); Items 2.A and 6.A
//   are "Pt6Line2a" / "Pt6Line6a" (U, Y, N).
// - Part 9, Items 6.C-6.E are "Pt9Line6b_DetailedDescription", "Pt9Line6c_Description" and
//   "Pt9Line6d_Description"; Item 17's name is "Pt9Line15_EmployerOrOrgName", its street
//   "Pt9_StreetNumberName" and the rest "Pt9Line17_*"; Item 19 (fax) is "Pt9_PreparerFaxNumber";
//   the certification's employer is "Pt9_PetitioningOrgName"; Item 25's units are "Pt9Lne25_Unit".
// - Part 8, Item 3.A (living in the placement) is "Pt8Line4a"; Item 4.A's "one"/"both" boxes are
//   "Pt8Line3a" (O, B) and its grounds "Pt8Line3A_Checkbox" (A abuse, B neglect, C abandonment,
//   D similar basis, with D the second widget); the "specify" text is "Pt8Line3a_Specify".
// - Part 10, Items 8.A and 8.B (marriage to the abuser) are "Pt9Line8a_DateOfMarriage" and
//   "Pt9Line8b_PlaceOfMarriage".
// - Part 13 (interpreter) mixes "Pt13Line*" with "Pt12Line4_InterpreterDaytimeTelephone",
//   "Pt12Line5_InterpreterMobileTelephone", "Pt12Line5_Email" and "Pt12_NameofLanguage" (the
//   certification's language). Part 14 (preparer) is "Pt13Line1_Preparer*", "Pt13Line2_BusinessName",
//   "Pt14Line3_*" (address), "Pt13ine5_PreparerFaxNumber" (the mobile number) and
//   "Pt13Line7_Checkbox" (A, B) with "Pt13Line7b_extends" (Y extends, N does not).
// - Part 15 is "Pt14Line3-6*", and its name and A-Number are "Pt1Line1_*[1]" and
//   "Pt1Line4_AlienNumber[1]".
// - Part 7, Item 9.A is two separate boxes "Pt7Line9a_yes" / "Pt7Line9a_no"; Part 7, Item 5 is
//   four separate boxes; Part 5's children rows have a single "Child" box each.

export interface I360Plan {
  text: Record<string, string>;
  check: string[];
  checkValue: [string, string][];
  select: Record<string, string>;
  /** Part 15 entries, in order. */
  notes: { page: string; part: string; item: string; text: string }[];
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');
const list = (a: Answers, id: string) => (Array.isArray(a[id]) ? (a[id] as string[]) : []);

const chain = (a: Answers, id: string, max: number, first: boolean) => {
  if (!first) return 0;
  let n = 1;
  while (n < max && a[`${id}.more${n}`] === 'yes') n++;
  return n;
};

/** Names of one address block's fields. */
interface AddressFields {
  careOf?: string;
  street: string;
  unit: string;
  apt: string;
  city: string;
  state: string;
  zip: string;
  province?: string;
  postal?: string;
  country?: string;
}

/** The usual block: "<line>_StreetNumberName[0]" and so on. */
const block = (line: string, careOf = false): AddressFields => ({
  careOf: careOf ? `${line}_InCareofName[0]` : undefined,
  street: `${line}_StreetNumberName[0]`,
  unit: `${line}_Unit`,
  apt: `${line}_AptSteFlrNumber[0]`,
  city: `${line}_CityOrTown[0]`,
  state: `${line}_State[0]`,
  zip: `${line}_ZipCode[0]`,
  province: `${line}_Province[0]`,
  postal: `${line}_PostalCode[0]`,
  country: `${line}_Country[0]`,
});

/** Part 9's characters per line in its one-line boxes at 9 points; longer texts go to Part 15. */
const LINE = 100;

export function planI360(a: Answers): I360Plan {
  const text: Record<string, string> = {};
  const check: string[] = [];
  const checkValue: [string, string][] = [];
  const select: Record<string, string> = {};
  const notes: I360Plan['notes'] = [];
  const put = (field: string, value: string) => {
    if (value) text[field] = value;
  };
  const yn = (base: string, value: unknown) => {
    if (value === 'yes') checkValue.push([base, 'Y']);
    if (value === 'no') checkValue.push([base, 'N']);
  };
  const name = (prefix: string, line: string, i = 0) => {
    put(`${line}_FamilyName[${i}]`, str(a, `${prefix}.family`));
    put(`${line}_GivenName[${i}]`, str(a, `${prefix}.given`));
    put(`${line}_MiddleName[${i}]`, str(a, `${prefix}.middle`));
  };
  const aNum = (field: string, id: string) => {
    const n = digits(str(a, id));
    if (n) put(field, n.padStart(9, '0'));
  };
  /** Writes an address from `get` (street, unit, city…) into the named fields. */
  const addressTo = (get: (k: string) => string, f: AddressFields) => {
    if (f.careOf) put(f.careOf, get('careOf'));
    put(f.street, get('street'));
    const u = parseUnit(get('unit'));
    if (u) {
      checkValue.push([f.unit, u.kind]);
      put(f.apt, u.number);
    }
    put(f.city, get('city'));
    const st = get('state');
    if (st) select[f.state] = st.toUpperCase();
    put(f.zip, get('zip'));
    if (f.province) put(f.province, get('province'));
    if (f.postal) put(f.postal, get('postal'));
    if (f.country) put(f.country, get('country'));
  };
  const address = (prefix: string, line: string, careOf = false) => addressTo((k) => str(a, `${prefix}.${k}`), block(line, careOf));
  /** A one-line box that holds `limit` characters; a longer text says "See Part 15" and goes there in full. */
  const fit = (field: string, value: string, limit: number, note: Omit<I360Plan['notes'][number], 'text'>) => {
    if (value.length <= limit) put(field, value.replace(/\s*\n\s*/g, ' '));
    else {
      put(field, 'See Part 15.');
      notes.push({ ...note, text: value });
    }
  };

  const cls = str(a, 'classification');
  const widow = cls === 'B';
  const sij = cls === 'C';
  const vawa = ['I', 'J', 'K'].includes(cls);
  const other = forOther(a);

  // Part 1. Someone filing for another person gives their own details in Items 1-6; a person filing
  // for themselves gives theirs, except VAWA and SIJ self-petitioners, who skip to Item 7, the
  // optional safe address.
  if (other) {
    name('petitioner', 'Pt1Line1');
    put('Pt1Line2_OnlineAcctNumber[0]', digits(str(a, 'petitioner.uscisAccount')));
    put('Pt1Line3_SSN[0]', digits(str(a, 'petitioner.ssn')));
    aNum('Pt1Line4_AlienNumber[0]', 'petitioner.aNumber');
    put('Pt1Line5_IRSTaxNumber[0]', digits(str(a, 'petitioner.itin')));
    address('petitioner', 'Pt1Line6', true);
  } else if (ownPart1(a)) {
    name('name', 'Pt1Line1');
    put('Pt1Line2_OnlineAcctNumber[0]', digits(str(a, 'uscisAccount')));
    put('Pt1Line3_SSN[0]', digits(str(a, 'ssn')));
    aNum('Pt1Line4_AlienNumber[0]', 'aNumber');
    address('mailing', 'Pt1Line6', true);
  }
  if ((vawa || sij) && a.safeAddress === 'yes') address('safe', 'Pt1Line7', true);

  // Part 2.
  if (CLASSIFICATIONS.includes(cls)) checkValue.push(['Pt2Line1', cls]);
  if (cls === 'D' && ['A', 'B', 'C'].includes(str(a, 'rw.kind'))) check.push(a['rw.kind'] === 'A' ? 'Pt2Line1d1_yes[0]' : 'Pt2Line1d1_no[0]');

  // Part 3.
  name('name', 'Pt3Line1');
  address('mailing', 'Pt3Line2', true);
  put('Pt3Line3_DateOfBirth[0]', str(a, 'dob'));
  put('Pt3Line4_CountryOfBirth[0]', str(a, 'birthCountry'));
  put('Pt3Line5_SSN[0]', digits(str(a, 'ssn')));
  aNum('Pt3Line6_AlienNumber[0]', 'aNumber');
  if (['S', 'M', 'D', 'W'].includes(str(a, 'marital'))) checkValue.push(['Pt3Line7_MaritalStatus', str(a, 'marital')]);
  if (a.inUS === 'yes') {
    put('Pt3Line8_DateOfLastArrival[0]', str(a, 'arrival.date'));
    put('Pt3Line9_I94[0]', str(a, 'i94.number').replace(/[\s-]/g, '').toUpperCase());
    put('Pt3Line10_Passport[0]', str(a, 'passport.number'));
    put('Pt3Line11_TravelDoc[0]', str(a, 'passport.travelDoc'));
    put('Pt3Line12_CountryOfIssuanceDocument[0]', str(a, 'passport.country'));
    put('Pt3Line13_ExpDate[0]', str(a, 'passport.expires'));
    put('Pt3Line14_CurrentUSCISStatus[0]', str(a, 'status.current'));
    put('Pt3Line15_DateOfExpired[0]', str(a, 'status.expires'));
  }

  // Part 4.
  const path = str(a, 'processingPath');
  if (path === 'consulate') {
    put('Pt4Line1a_CityOrTown[0]', str(a, 'consulate.city'));
    put('Part4Line1b_Country[0]', str(a, 'consulate.country'));
  }
  const foreign = ['street', 'city', 'province', 'postal', 'country'].some((k) => str(a, `foreign.${k}`));
  if (foreign) {
    name('name', 'Pt4Line2a');
    address('foreign', 'Pt4Line2b');
  }
  if (a.sex === 'male') checkValue.push(['Pt4Line3_Sex', 'M']);
  if (a.sex === 'female') checkValue.push(['Pt4Line3_Sex', 'F']);
  yn('Pt4Line4a', a.otherFilings);
  if (a.otherFilings === 'yes') put('Pt4Line4b_HowMany[0]', digits(str(a, 'otherFilings.count')));
  yn('Pt4Line5', a.removal);
  if (!sij) yn('Pt4Line6', a.workedWithout);
  if (path) yn('Pt4Line7', path === 'withI485' ? 'yes' : 'no');
  const yesItems = [a.removal === 'yes' ? '5' : '', !sij && a.workedWithout === 'yes' ? '6' : ''].filter(Boolean);
  if (yesItems.length) notes.push({ page: '4', part: '4', item: yesItems.join(', '), text: str(a, 'processing.explain') });

  // Part 5. Person 1 may be the spouse or a child; Persons 2-9 are children.
  if (vawa && cls === 'I') yn('Pt5Line1_Checkbox', a.childrenFiled);
  const relatives = chain(a, 'relative', 9, a['relative.more0'] === 'yes');
  for (let i = 1; i <= relatives; i++) {
    const line = `Pt5Line${i + 1}`;
    name(`relative${i}`, line);
    put(`${line}_DateOfBirth[0]`, str(a, `relative${i}.dob`));
    put(`${line}_CountryOfBirth[0]`, str(a, `relative${i}.birthCountry`));
    aNum(`${line}_AlienNumber[0]`, `relative${i}.aNumber`);
    if (i === 1) {
      const rel = str(a, 'relative1.relationship');
      if (rel === 'S' || rel === 'C') checkValue.push(['Pt5Line2_Relationship', rel]);
    } else check.push(`${line}_Relationship[0]`);
  }

  // Part 6.
  if (cls === 'A') {
    const alive: Record<string, string> = { unknown: 'U', yes: 'Y', no: 'N' };
    name('mother', 'Pt6Line1');
    if (alive[str(a, 'mother.alive')]) checkValue.push(['Pt6Line2a', alive[str(a, 'mother.alive')]]);
    if (a['mother.alive'] === 'yes') address('mother', 'Pt6Line2b', true);
    if (a['mother.alive'] === 'no') put('Pt6Line2c_DateofDeath[0]', str(a, 'mother.death'));
    name('father', 'Pt6Line3');
    put('Pt6Line4_DateOfBirth[0]', str(a, 'father.dob'));
    put('Pt6Line5_CountryOfBirth[0]', str(a, 'father.birthCountry'));
    if (alive[str(a, 'father.alive')]) checkValue.push(['Pt6Line6a', alive[str(a, 'father.alive')]]);
    if (a['father.alive'] === 'yes') address('father', 'Pt6Line6b', true);
    if (a['father.alive'] === 'no') put('Pt6Line6c_DateofDeath[0]', str(a, 'father.death'));
    else {
      put('Pt4Line6d_DaytimeTelephoneNumber[0]', digits(str(a, 'father.phone')));
      put('Pt6Line6e_WorkTelephoneNumber[0]', digits(str(a, 'father.workPhone')));
    }
    const service = str(a, 'father.service');
    const branch = str(a, 'father.branch');
    if (service === 'military') {
      if (['A', 'F', 'N', 'M', 'C'].includes(branch)) checkValue.push(['Pt6Line7a', branch]);
      put('Pt6Line7b_BranchServiceNumber[0]', str(a, 'father.serviceNumber'));
    }
    if (service === 'neither') {
      checkValue.push(['Pt6Line7a', 'O']);
      notes.push({ page: '7', part: '6', item: '7.C', text: str(a, 'father.explain') });
    }
    if (service === 'civilian') notes.push({ page: '7', part: '6', item: '7', text: `The father was a U.S. civilian employed abroad. ${str(a, 'father.explain')}`.trim() });
  }

  // Part 7.
  if (widow) {
    name('deceased', 'Pt7Line1');
    put('Pt7Line2_DateOfBirth[0]', str(a, 'deceased.dob'));
    put('Pt7Line3_CountryOfBirth[0]', str(a, 'deceased.birthCountry'));
    put('Pt7Line4_DateOfDeath[0]', str(a, 'deceased.death'));
    const status = str(a, 'deceased.status');
    const box: Record<string, string> = { A: 'Pt7Line5a_USCitizen[0]', B: 'Pt7Line5b_citizenabroad[0]', C: 'Pt7Line5c_USNaturalized[0]', D: 'Pt7Line5d_Other[0]' };
    if (box[status]) check.push(box[status]);
    if (status === 'C') aNum('Pt7Line5c1_AlienNumber[0]', 'deceased.aNumber');
    if (status === 'D') put('Pt7Line5d_Explain[0]', str(a, 'deceased.statusOther'));
    put('Pt7Line6_NumberofMarriages[0]', digits(str(a, 'timesMarried')));
    put('Pt7Line7_NumberofSpouseMarriages[0]', digits(str(a, 'deceased.timesMarried')));
    put('Pt7Line8a_DateofMarriage[0]', str(a, 'marriage.date'));
    put('Pt7Line8b_PlaceOfMarriage[0]', str(a, 'marriage.place'));
    if (a.remarried === 'yes') {
      check.push('Pt7Line9a_yes[0]');
      put('Pt7Line9b_DateofReMarriage[0]', str(a, 'remarried.date'));
    }
    if (a.remarried === 'no') check.push('Pt7Line9a_no[0]');
    yn('Pt7Line10', a.separated);
    if (a.separated === 'yes') notes.push({ page: '8', part: '7', item: '10', text: str(a, 'separated.explain') });
  }

  // Part 8.
  if (sij) {
    const others = chain(a, 'otherName', 2, a['otherName.more0'] === 'yes');
    for (let i = 1; i <= others; i++) name(`otherName${i}`, `Pt8Line1${'ab'[i - 1]}`);
    yn('Pt8Line2a', a.dependent);
    if (a.dependent === 'no') notes.push({ page: '8', part: '8', item: '2.A', text: str(a, 'dependent.explain') });
    put('Pt8Line2b_Name[0]', str(a, 'placement.name'));
    yn('Pt8Line2c', a.jurisdiction);
    if (a.jurisdiction === 'yes') yn('Pt8Line4a', a.residingPlacement);
    if (a.jurisdiction === 'no') {
      const why = str(a, 'jurisdictionEnded');
      if (['A', 'B', 'C'].includes(why)) checkValue.push(['Pt8Line3b_Checkbox', why]);
      if (why === 'C') notes.push({ page: '9', part: '8', item: '3.B', text: str(a, 'jurisdiction.explain') });
    }
    const reunification = str(a, 'reunification');
    if (reunification === 'O' || reunification === 'B') checkValue.push(['Pt8Line3a', reunification]);
    const grounds = list(a, 'grounds').filter((g) => ['A', 'B', 'C', 'D'].includes(g));
    for (const g of grounds) checkValue.push(['Pt8Line3A_Checkbox', g]);
    if (grounds.includes('D')) put('Pt8Line3a_Specify[0]', str(a, 'grounds.other'));
    if (reunification === 'O') put('Pt8Line4b_NameOfParent[0]', str(a, 'reunification.parent'));
    yn('Pt8Line5', a.bestInterest);
    yn('Pt8Line6a', a.hhs);
    if (a.hhs === 'yes') yn('Pt8Line6b', a.hhsAltered);
  }

  // Part 9. The employer's (Item 14) and the denomination's (Item 21) signatures stay empty.
  if (cls === 'D') {
    put('Pt9Line1a_NumberofMembers[0]', digits(str(a, 'rw.members')));
    put('Pt9Line1b_NumberofEmployees[0]', digits(str(a, 'rw.employees')));
    put('Pt9Line1c_NumberofBeneficiaries[0]', digits(str(a, 'rw.rWorkers')));
    put('Pt9Line1d_NumberofSIRWandNIRW[0]', digits(str(a, 'rw.petitions')));
    put('Pt9Line1e_NumberofSIRWPetitions[0]', digits(str(a, 'rw.selfPetitions')));
    yn('Pt9Line2', a['rw.priorR']);
    if (a['rw.priorR'] === 'yes') {
      name('name', 'Pt9Line3');
      put('Pt9Line3_DateFrom[0]', str(a, 'rw.stayFrom'));
      put('Pt9Line3_DateTo[0]', str(a, 'rw.stayTo'));
      notes.push({ page: '9', part: '9', item: '2', text: str(a, 'rw.otherStays') });
    }
    put('Pt9Line4_Position[0]', str(a, 'rw.staffPosition'));
    fit('Pt9Line4_Summary[0]', str(a, 'rw.staffSummary'), 2 * LINE, { page: '10', part: '9', item: '4' });
    fit('Pt9Line5_DescribeRelationship[0]', str(a, 'rw.orgRelationship'), LINE, { page: '10', part: '9', item: '5' });
    put('Pt9Line6a_Title[0]', str(a, 'rw.title'));
    const kind = str(a, 'rw.kind');
    if (['A', 'B', 'C'].includes(kind)) checkValue.push(['Pt9Line6b', kind]);
    fit('Pt9Line6b_DetailedDescription[0]', str(a, 'rw.duties'), LINE, { page: '10', part: '9', item: '6.C' });
    fit('Pt9Line6c_Description[0]', str(a, 'rw.qualifications'), LINE, { page: '10', part: '9', item: '6.D' });
    fit('Pt9Line6d_Description[0]', str(a, 'rw.compensation'), LINE, { page: '10', part: '9', item: '6.E' });
    put('Pt9Line6f_CompanyName[0]', str(a, 'rw.site.company'));
    address('rw.site', 'Pt9Line6f');
    for (const id of RW_ATTEST) yn(`Pt9Line${id.slice(4)}`, a[id]);
    if (RW_ATTEST.some((id) => a[id] === 'no')) notes.push({ page: '11', part: '9', item: '7-13', text: str(a, 'rw.attestExplain') });
    const affiliated = a['rw.q7'] === 'yes' && a['rw.taxBasis'] === 'C';
    if (a['rw.q7'] === 'yes' && ['A', 'B', 'C'].includes(str(a, 'rw.taxBasis'))) checkValue.push(['Pt9Line7_Checkbox', str(a, 'rw.taxBasis')]);
    if (affiliated) for (const d of list(a, 'rw.affiliatedDocs').filter((d) => ['1', '2', '3', '4'].includes(d))) check.push(`Pt9Line7_CheckboxC${d}[0]`);
    name('rw.signer', 'Pt9Line15');
    put('Pt9Line16_TitleofSignatory[0]', str(a, 'rw.signer.title'));
    put('Pt9Line15_EmployerOrOrgName[0]', str(a, 'rw.employer.name'));
    addressTo((k) => str(a, `rw.employer.${k}`), { street: 'Pt9_StreetNumberName[0]', unit: 'Pt9Line17_Unit', apt: 'Pt9Line17_AptSteFlrNumber[0]', city: 'Pt9Line17_CityOrTown[0]', state: 'Pt9Line17_State[0]', zip: 'Pt9Line17_ZipCode[0]' });
    put('Pt9_DaytimePhoneNumber1[0]', digits(str(a, 'rw.employer.phone')));
    put('Pt9_PreparerFaxNumber[0]', digits(str(a, 'rw.employer.fax')));
    put('Pt9_Email[0]', str(a, 'rw.employer.email'));
    if (affiliated) {
      put('Pt9_PetitioningOrgName[0]', str(a, 'rw.employer.name'));
      put('Pt9_ReligiousDenominationName[0]', str(a, 'rw.denomination'));
      put('Pt9_RDFamilyName[0]', str(a, 'rw.rd.family'));
      put('Pt9_RDGivenName[0]', str(a, 'rw.rd.given'));
      put('Pt9_RDMiddleName[0]', str(a, 'rw.rd.middle'));
      put('Pt9_RDTitle[0]', str(a, 'rw.rd.title'));
      put('Pt9Line24_NameofAROWRD[0]', str(a, 'rw.att.name'));
      addressTo((k) => str(a, `rw.att.${k}`), { street: 'Pt9Line25_AROWRDStreetNumberName[0]', unit: 'Pt9Lne25_Unit', apt: 'Pt9Line25_AptSteFlrNumber[0]', city: 'Pt9Line25_AROWRDCityTown[0]', state: 'Pt9Line25_AROWRDState[0]', zip: 'Pt9Line25_AROWRDZipCode[0]' });
      put('Pt9Line26_AROWRDDaytimePhoneNumber1[0]', digits(str(a, 'rw.att.phone')));
      put('Pt9Line27_AROWRDPreparerFaxNumber[0]', digits(str(a, 'rw.att.fax')));
      put('Pt9Line28_AROWRDEmail[0]', str(a, 'rw.att.email'));
      put('Pt9Line29_AROWRDIRSTaxNumber[0]', str(a, 'rw.att.irs'));
    }
  }

  // Part 10.
  if (vawa) {
    name('abuser', 'Pt10Line1');
    put('Pt10Line2_DateOfBirth[0]', str(a, 'abuser.dob'));
    put('Pt10Line3_CountryOfBirth[0]', str(a, 'abuser.birthCountry'));
    put('Pt10Line4_DateOfDeath[0]', str(a, 'abuser.death'));
    const status = str(a, 'abuser.status');
    if (['A', 'B', 'C', 'D', 'E'].includes(status)) checkValue.push(['Pt10Line5_Checkbox', status]);
    if (status === 'C') aNum('Pt10Line5c1_AlienNumber[0]', 'abuser.aNumber');
    if (status === 'D') aNum('Pt10Line5d1_AlienNumber[0]', 'abuser.aNumber');
    if (status === 'E') put('Pt10Line5e_Explain[0]', str(a, 'abuser.statusOther'));
    put('Pt10Line6_NumberofMarriages[0]', digits(str(a, 'vawa.timesMarried')));
    put('Pt10Line7_NumberofAbuseMarriages[0]', digits(str(a, 'abuser.timesMarried')));
    if (cls === 'I') {
      put('Pt9Line8a_DateOfMarriage[0]', str(a, 'vawa.marriageDate'));
      put('Pt9Line8b_PlaceOfMarriage[0]', str(a, 'vawa.marriagePlace'));
    } else {
      put('Pt9Line8a_DateOfMarriage[0]', 'N/A');
      put('Pt9Line8b_PlaceOfMarriage[0]', 'N/A');
    }
    put('Pt10Line9_DateFrom[0]', str(a, 'lived.from'));
    put('Pt10Line9_DateTo[0]', str(a, 'lived.to'));
    if (str(a, 'lived.other')) notes.push({ page: '14', part: '10', item: '9', text: str(a, 'lived.other') });
    address('together', 'Pt10Line10');
    put('Pt10Line11_DateFrom[0]', str(a, 'together.from'));
    put('Pt10Line11_DateTo[0]', str(a, 'together.to'));
    yn('Pt10Line12', a.ead);
  }

  // Part 11 when filing for yourself, Part 12 when filing for another person. The signature and its
  // date stay empty: they are written by hand. Part 12, Item 4 (title) is for organizations.
  const reads = str(a, 'readsEnglish');
  if (other) {
    if (reads === 'A' || reads === 'B') checkValue.push(['Pt12Line1_Checkbox', reads]);
    if (reads === 'B') put('Pt12Line1b_Language[0]', str(a, 'fluentLanguage'));
    if (a.preparer === 'yes') {
      check.push('Pt12Line2_Checkbox[0]');
      put('Pt12Line2_RepresentativeName[0]', str(a, 'preparer.name'));
    }
    put('Pt12Line3_AuthorizedSignatoryFamilyName[0]', str(a, 'petitioner.family'));
    put('Pt12Line3_AuthorizedSignatoryGivenName[0]', str(a, 'petitioner.given'));
    put('Pt12Line5_DaytimePhoneNumber[0]', digits(str(a, 'phone')));
    put('Pt12Line6_MobileNumber1[0]', digits(str(a, 'mobile')));
    put('Pt12Line7_Email[0]', str(a, 'email'));
  } else {
    if (reads === 'A' || reads === 'B') checkValue.push(['Pt11Line1_Checkbox', reads]);
    if (reads === 'B') put('Pt11Line1b_Language[0]', str(a, 'fluentLanguage'));
    if (a.preparer === 'yes') {
      check.push('Pt11Line2_Checkbox[0]');
      put('Pt11Line2_RepresentativeName[0]', str(a, 'preparer.name'));
    }
    put('Pt11Line3_DaytimePhoneNumber1[0]', digits(str(a, 'phone')));
    put('Pt11Line4_MobileNumber1[0]', digits(str(a, 'mobile')));
    put('Pt11Line5_Email[0]', str(a, 'email'));
  }

  // Parts 13 and 14: the interpreter and the preparer. Their signatures and dates stay empty.
  const help = assistance(a, { interpreter: usedInterpreter(a), preparer: usedPreparer(a) });
  const helperAddress = (p: HelperPerson, line: string) => addressTo((k) => (k in p ? p[k as keyof HelperPerson] : ''), block(line));
  if (help.interpreter) {
    const p = help.interpreter;
    put('Pt13Line1_InterpreterFamilyName[0]', p.family);
    put('Pt13Line1_InterpreterGivenName[0]', p.given);
    put('Pt13Line2_InterpreterBusinessorOrg[0]', p.business);
    helperAddress(p, 'Pt13Line3');
    put('Pt12Line4_InterpreterDaytimeTelephone[0]', digits(p.phone));
    put('Pt12Line5_InterpreterMobileTelephone[0]', digits(p.mobile));
    put('Pt12Line5_Email[0]', p.email);
    put('Pt12_NameofLanguage[0]', p.language);
  }
  if (help.preparer) {
    const p = help.preparer;
    put('Pt13Line1_PreparerFamilyName[0]', p.family);
    put('Pt13Line1_PreparerGivenName[0]', p.given);
    put('Pt13Line2_BusinessName[0]', p.business);
    helperAddress(p, 'Pt14Line3');
    put('Pt13Line4_DaytimePhoneNumber1[0]', digits(p.phone));
    put('Pt13ine5_PreparerFaxNumber[0]', digits(p.mobile));
    put('Pt13Line6_Email[0]', p.email);
    if (p.statement === 'notAttorney') checkValue.push(['Pt13Line7_Checkbox', 'A']);
    if (p.statement === 'attorneyExtends' || p.statement === 'attorneyNotExtends') {
      checkValue.push(['Pt13Line7_Checkbox', 'B']);
      checkValue.push(['Pt13Line7b_extends', p.statement === 'attorneyExtends' ? 'Y' : 'N']);
    }
  }

  // Part 15 header: the person filing.
  name('name', 'Pt1Line1', 1);
  aNum('Pt1Line4_AlienNumber[1]', 'aNumber');

  return { text, check, checkValue, select, notes: notes.filter((n) => n.text) };
}

const NOTE_SIZE = 8;
/** Part 15's four entries. */
const SLOTS = [3, 4, 5, 6].map((n) => `Pt14Line${n}`);

/** Fills the official I-360 PDF with the answers and returns the new file's bytes. */
export async function fillI360(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const index = fieldIndex(form);
  const plan = planI360(a);
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

  // Part 15: each note fills as many entries as it needs (pdf-lib's own wrapping is very slow, so
  // lines are broken here). What doesn't fit in the four entries points to a separate sheet.
  const box = (slot: string) => textField(`${slot}d_AdditionalInfo[0]`);
  const capacity = (slot: string) => Math.max(1, Math.floor((box(slot).acroField.getWidgets()[0].getRectangle().height - 4) / (NOTE_SIZE * 1.2)));
  const width = (slot: string) => box(slot).acroField.getWidgets()[0].getRectangle().width - 8;
  const MORE = 'Continued on a separate sheet.';
  let s = 0;
  plan.notes.forEach((n, k) => {
    let lines = wrap(toFormText(n.text), font, NOTE_SIZE, width(SLOTS[0]));
    while (lines.length && s < SLOTS.length) {
      const slot = SLOTS[s++];
      const cap = capacity(slot);
      let chunk = lines.slice(0, cap);
      lines = lines.slice(cap);
      // The last entry says so when this note or a later one doesn't fit.
      if (s === SLOTS.length && (lines.length || k < plan.notes.length - 1)) chunk = [...chunk.slice(0, chunk.length < cap ? cap : cap - 1), MORE];
      setFieldText(textField(`${slot}a_PageNumber[0]`), n.page, 9);
      setFieldText(textField(`${slot}b_PartNumber[0]`), n.part, 9);
      setFieldText(textField(`${slot}c_ItemNumber[0]`), n.item, 9);
      const field = box(slot);
      field.enableMultiline();
      setFieldText(field, chunk.join('\n'), NOTE_SIZE);
    }
  });

  doc.setTitle('Form I-360, Petition for Amerasian, Widow(er), or Special Immigrant');
  return doc.save();
}
