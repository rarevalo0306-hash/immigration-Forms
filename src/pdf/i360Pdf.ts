import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField, StandardFonts } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { parseUnit } from '../engine/validation';
import { fieldIndex, optionBoxes, selectOption, setFieldText, toFormText, wrap } from './common';

// Fields of USCIS Form I-360, edition 01/20/25 (public/forms/i-360.pdf), named by the last segment
// of their full name. Only the widow(er), VAWA and SIJ parts are filled (see src/forms/i360.ts).
// Mapped by position:
// - Part 2's boxes are "Pt2Line1[0-15]" out of printed order; their export values are the item
//   letters (A-P), so they are picked by value.
// - Part 8, Item 3.A (living in the placement) is "Pt8Line4a"; Item 4.A's "one"/"both" boxes are
//   "Pt8Line3a" (O, B) and its grounds "Pt8Line3A_Checkbox" (A abuse, B neglect, C abandonment,
//   D similar basis, with D the second widget); the "specify" text is "Pt8Line3a_Specify".
// - Part 10, Items 8.A and 8.B (marriage to the abuser) are "Pt9Line8a_DateOfMarriage" and
//   "Pt9Line8b_PlaceOfMarriage".
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
  /** An address block whose fields are "<line>_StreetNumberName[0]" and so on. */
  const address = (prefix: string, line: string, careOf = false) => {
    if (careOf) put(`${line}_InCareofName[0]`, str(a, `${prefix}.careOf`));
    put(`${line}_StreetNumberName[0]`, str(a, `${prefix}.street`));
    const u = parseUnit(str(a, `${prefix}.unit`));
    if (u) {
      checkValue.push([`${line}_Unit`, u.kind]);
      put(`${line}_AptSteFlrNumber[0]`, u.number);
    }
    put(`${line}_CityOrTown[0]`, str(a, `${prefix}.city`));
    const st = str(a, `${prefix}.state`);
    if (st) select[`${line}_State[0]`] = st.toUpperCase();
    put(`${line}_ZipCode[0]`, str(a, `${prefix}.zip`));
    put(`${line}_Province[0]`, str(a, `${prefix}.province`));
    put(`${line}_PostalCode[0]`, str(a, `${prefix}.postal`));
    put(`${line}_Country[0]`, str(a, `${prefix}.country`));
  };

  const cls = str(a, 'classification');
  const widow = cls === 'B';
  const sij = cls === 'C';
  const vawa = ['I', 'J', 'K'].includes(cls);

  // Part 1. A widow(er) is both petitioner and beneficiary and fills Items 1-6; VAWA and SIJ
  // self-petitioners skip to Item 7, the optional safe address.
  if (widow) {
    name('name', 'Pt1Line1');
    put('Pt1Line2_OnlineAcctNumber[0]', digits(str(a, 'uscisAccount')));
    put('Pt1Line3_SSN[0]', digits(str(a, 'ssn')));
    aNum('Pt1Line4_AlienNumber[0]', 'aNumber');
    address('mailing', 'Pt1Line6', true);
  }
  if ((vawa || sij) && a.safeAddress === 'yes') address('safe', 'Pt1Line7', true);

  // Part 2.
  if (widow || sij || vawa) checkValue.push(['Pt2Line1', cls]);

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

  // Part 11. The signature (Item 6) and its date stay empty: they are written by hand.
  if (a.readsEnglish === 'A' || a.readsEnglish === 'B') checkValue.push(['Pt11Line1_Checkbox', str(a, 'readsEnglish')]);
  if (a.readsEnglish === 'B') put('Pt11Line1b_Language[0]', str(a, 'fluentLanguage'));
  if (a.preparer === 'yes') {
    check.push('Pt11Line2_Checkbox[0]');
    put('Pt11Line2_RepresentativeName[0]', str(a, 'preparer.name'));
  }
  put('Pt11Line3_DaytimePhoneNumber1[0]', digits(str(a, 'phone')));
  put('Pt11Line4_MobileNumber1[0]', digits(str(a, 'mobile')));
  put('Pt11Line5_Email[0]', str(a, 'email'));

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
  let s = 0;
  for (const n of plan.notes) {
    let lines = wrap(toFormText(n.text), font, NOTE_SIZE, width(SLOTS[0]));
    while (lines.length && s < SLOTS.length) {
      const slot = SLOTS[s++];
      const cap = capacity(slot);
      let chunk = lines.slice(0, cap);
      lines = lines.slice(cap);
      if (lines.length && s === SLOTS.length) chunk = [...chunk.slice(0, cap - 1), 'Continued on a separate sheet.'];
      setFieldText(textField(`${slot}a_PageNumber[0]`), n.page, 9);
      setFieldText(textField(`${slot}b_PartNumber[0]`), n.part, 9);
      setFieldText(textField(`${slot}c_ItemNumber[0]`), n.item, 9);
      const field = box(slot);
      field.enableMultiline();
      setFieldText(field, chunk.join('\n'), NOTE_SIZE);
    }
  }

  doc.setTitle('Form I-360, Petition for Amerasian, Widow(er), or Special Immigrant');
  return doc.save();
}
