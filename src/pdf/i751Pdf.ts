import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { HISTORY_ITEMS } from '../forms/i751';
import { parseUnit } from '../engine/validation';
import { assistance, usedPreparer, type HelperPerson } from '../forms/assistance';
import { fieldIndex, optionBoxes, selectOption, setFieldText } from './common';

// Fields of USCIS Form I-751, edition 04/01/24 (public/forms/i-751.pdf), named by the last segment
// of their full name and placed by where they sit on the printed page. The Yes/No boxes of Part 1,
// Items 18-23 are named one item early ("Line17_Checkbox" is Item 18), the mailing address is
// "Line17*" and the children's living/applying boxes carry later item numbers; the mapping follows
// the page, not the names. Parts 9 and 10 (interpreter, preparer) carry "P6"/"Pt9" and
// "P7"/"Pt10" names (the preparer's street is "Pt9Line3_StreetNumberName"); neither has a mobile
// phone box, the preparer's Item 5 is a fax number (left blank) and the interpreter's email box
// is capped at 10 characters, so the cap is lifted when filling.

/** Boxes whose length cap is a mistake: the printed box holds a full email address. */
const UNCAPPED = new Set(['P6_Line5_InterpretersEmailAddress[0]']);

export interface I751Plan {
  text: Record<string, string>;
  check: string[];
  checkValue: [string, string][];
  select: Record<string, string>;
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');
const fullName = (a: Answers, p: string) => [str(a, `${p}.given`), str(a, `${p}.middle`), str(a, `${p}.family`)].filter(Boolean).join(' ');

interface AddressFields {
  careOf?: string;
  street: string;
  unit: string;
  number: string;
  city: string;
  state: string;
  zip: string;
  province?: string;
  postal?: string;
  country?: string;
}

const prefixed = (p: string, careOf = false): AddressFields => ({
  careOf: careOf ? `${p}_InCareofName[0]` : undefined,
  street: `${p}_StreetNumberName[0]`,
  unit: `${p}_Unit`,
  number: `${p}_AptSteFlrNumber[0]`,
  city: `${p}_CityOrTown[0]`,
  state: `${p}_State[0]`,
  zip: `${p}_ZipCode[0]`,
  province: `${p}_Province[0]`,
  postal: `${p}_PostalCode[0]`,
  country: `${p}_Country[0]`,
});

const MAILING: AddressFields = {
  careOf: 'Line17a_InCareofName[0]',
  street: 'Line17b_Street_Number_Name[0]',
  unit: 'Line17c_Unit',
  number: 'Line17c_Apt_Ste_Flr_Number[0]',
  city: 'Line17d_City_Town[0]',
  state: 'Pt1Line15e_State[0]',
  zip: 'Pt1Line15f_ZipCode[0]',
};
const PHYSICAL: AddressFields = { ...prefixed('Pt1Line17', true), province: undefined, postal: undefined, country: undefined };

/** The Yes/No base of each Part 1 question (Items 18-23). */
const HISTORY_BOXES: Record<string, string> = { q18: 'Line17_Checkbox', q19: 'Line18_Checkbox', q20: 'Line19_Checkbox', q21: 'Line20_Checkbox', q22: 'Line21_Checkbox', q23: 'Line22_Checkbox' };

/** Part 5 children: name, date of birth, A-Number, living and applying boxes, address prefix. */
const CHILDREN = [
  { name: ['Line1a_FamilyName3[0]', 'Line1b_GivenName3[0]', 'Line1c_MiddleName3[0]'], dob: 'Line2_DateOfBirth2[0]', aNumber: 'Line3_AlienNumber[0]', living: 'Part5Line5', applying: 'Part5Line6', address: 'Pt5Line6' },
  ...[0, 1, 2, 3].map((i) => ({
    name: [`Line13a_FamilyName[${i}]`, `Line13b_GivenName[${i}]`, `Line13c_MiddleName[${i}]`],
    dob: `Line14_DateOfBirth[${i}]`,
    aNumber: `Line15_AlienNumber[${i}]`,
    living: `Part5Line${11 + 6 * i}`,
    applying: `Part5Line${12 + 6 * i}`,
    address: `Pt5Line${12 + 6 * i}`,
  })),
];

const RACE: Record<string, string> = { WH: 'White', AS: 'Asian', BL: 'Black', AI: 'Indian', HW: 'Hawaiian' };
const EYES: Record<string, string> = { BN: 'BRO', BL: 'BLK', HA: 'HAZ', GN: 'GRN', BU: 'BLU', GR: 'GRY', MA: 'MAR', PN: 'PNK', UN: 'UNK' };
const HAIR: Record<string, string> = { BL: 'BLK', BR: 'BRO', BN: 'BLN', GR: 'GRY', WH: 'WHI', RD: 'RED', SA: 'SDY', NH: 'BAL', OT: 'UNK' };

export function planI751(a: Answers): I751Plan {
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
    if (f.province) put(f.province, str(a, `${prefix}.province`));
    if (f.postal) put(f.postal, str(a, `${prefix}.postal`));
    if (f.country) put(f.country, str(a, `${prefix}.country`));
  };
  const joint = a.basis === 'A' || a.basis === 'B';

  // Part 1. The name and A-Number repeat at the top of Part 11.
  for (const i of [0, 1]) {
    put(`Pt1Line1a_FamilyName[${i}]`, str(a, 'name.family'));
    put(`Pt1Line1b_GivenName[${i}]`, str(a, 'name.given'));
    put(`Pt1Line1c_MiddleName[${i}]`, str(a, 'name.middle'));
  }
  if (a['otherName.more0'] === 'yes') {
    for (const i of [1, 2]) {
      if (i > 1 && a['otherName.more1'] !== 'yes') break;
      put(`P1_Line${i + 1}a_FamilyName[0]`, str(a, `otherName${i}.family`));
      put(`P1_Line${i + 1}b_GivenName[0]`, str(a, `otherName${i}.given`));
      put(`P1_Line${i + 1}c_MiddleName[0]`, str(a, `otherName${i}.middle`));
    }
  }
  put('P1_Line4_DateOfBirth[0]', str(a, 'dob'));
  put('P1_Line5_CountryOfBirth[0]', str(a, 'birthCountry'));
  put('P1_Line6_CountryOfCitizenship[0]', str(a, 'citizenship'));
  const aNumber = digits(str(a, 'aNumber'));
  if (aNumber) for (const i of [0, 1]) put(`P1_Line7_AlienNumber[${i}]`, aNumber.padStart(9, '0'));
  put('P1_Line8_SSN[0]', digits(str(a, 'ssn')));
  put('P1_Line9_AcctIdentifier[0]', digits(str(a, 'uscisAccount')));
  if (['S', 'M', 'D', 'W'].includes(str(a, 'marital'))) checkValue.push(['Part1_Line10_MaritalStatus', str(a, 'marital')]);
  put('P1_Line11_DateOfMarriage[0]', str(a, 'marriage.date'));
  put('P1_Line12_PlaceOfMarriage[0]', str(a, 'marriage.place'));
  put('P1_Line13_DateMarriageEnded[0]', str(a, 'marriage.ended'));
  put('P1_Line14_CRExpiresOn[0]', str(a, 'crExpires'));
  address('mailing', MAILING);
  yn('Line16_Checkbox', a.physicalDifferent);
  if (a.physicalDifferent === 'yes') address('home', PHYSICAL);
  for (const item of HISTORY_ITEMS) if (!item.showIf || item.showIf(a)) yn(HISTORY_BOXES[item.id], a[item.id]);

  // Part 2: biographic information.
  if (a.ethnicity === 'hispanic') checkValue.push(['P3_checkbox6', 'H']);
  if (a.ethnicity === 'notHispanic') checkValue.push(['P3_checkbox6', 'N']);
  for (const r of Array.isArray(a.race) ? a.race : []) if (RACE[r]) check.push(`P3_checkbox7_${RACE[r]}[0]`);
  if (a.heightFeet) select['P3_Line8_HeightFeet[0]'] = str(a, 'heightFeet');
  if (a.heightInches) select['P3_Line8_HeightInches[0]'] = str(a, 'heightInches');
  const weight = digits(str(a, 'weight'));
  if (weight) {
    const w = weight.padStart(3, '0').slice(-3);
    [0, 1, 2].forEach((i) => put(`P3_Line9_HeightInches${i + 1}[0]`, w[i]));
  }
  if (EYES[str(a, 'eyes')]) checkValue.push(['P3_checkbox10', EYES[str(a, 'eyes')]]);
  if (HAIR[str(a, 'hair')]) checkValue.push(['P3_checkbox11', HAIR[str(a, 'hair')]]);

  // Part 3: basis. A joint petition picks 1.a or 1.b; a waiver checks each reason that applies.
  if (joint) checkValue.push(['Pt3Line1', str(a, 'basis')]);
  if (a.basis === 'waiver') for (const w of Array.isArray(a.waivers) ? a.waivers : []) if ('CDEFG'.includes(w)) check.push(`Pt3Line1${w.toLowerCase()}[0]`);

  // Part 4: the spouse or stepparent. Their address is the petitioner's when they live together.
  if (a.relationship === 'A' || a.relationship === 'B') checkValue.push(['Part4_Relationship', str(a, 'relationship')]);
  put('Pt4Line2a_FamilyName2[0]', str(a, 'spouse.family'));
  put('Pt4Line2b_GivenName2[0]', str(a, 'spouse.given'));
  put('Pt4Line2c_MiddleName2[0]', str(a, 'spouse.middle'));
  put('Line3_DateOfBirth[0]', str(a, 'spouse.dob'));
  put('Line4_SSN[0]', digits(str(a, 'spouse.ssn')));
  const spouseA = digits(str(a, 'spouse.aNumber'));
  if (spouseA) put('Line5_AlienNumber[0]', spouseA.padStart(9, '0'));
  const myHome = a.physicalDifferent === 'yes' ? 'home' : 'mailing';
  /** Writes the petitioner's own (U.S.) address into another person's address block. */
  const sameHome = (f: AddressFields) => {
    address(myHome, { ...f, careOf: undefined, province: undefined, postal: undefined, country: undefined });
    if (f.country && str(a, `${myHome}.street`)) put(f.country, 'United States');
  };
  if (a['spouse.livesWithYou'] === 'yes') sameHome(prefixed('Pt4Line6'));
  if (a['spouse.livesWithYou'] === 'no') address('spouseHome', prefixed('Pt4Line6'));

  // Part 5: children.
  if (a['child.more0'] === 'yes') {
    for (let i = 1; i <= 5; i++) {
      if (i > 1 && a[`child.more${i - 1}`] !== 'yes') break;
      const c = CHILDREN[i - 1];
      const id = `child${i}`;
      put(c.name[0], str(a, `${id}.family`));
      put(c.name[1], str(a, `${id}.given`));
      put(c.name[2], str(a, `${id}.middle`));
      put(c.dob, str(a, `${id}.dob`));
      const n = digits(str(a, `${id}.aNumber`));
      if (n) put(c.aNumber, n.padStart(9, '0'));
      yn(c.living, a[`${id}.living`]);
      yn(c.applying, a[`${id}.applying`]);
      if (str(a, `${id}.home.street`)) address(`${id}.home`, prefixed(c.address));
      else if (a[`${id}.living`] === 'yes') sameHome(prefixed(c.address));
    }
  }

  // Part 6: accommodations.
  yn('Part6Line1', a['acc.self']);
  if (joint) yn('Part6Line2', a['acc.spouse']);
  yn('Part6Line3', a['acc.children']);
  if (['acc.self', 'acc.spouse', 'acc.children'].some((id) => a[id] === 'yes')) {
    const acc: [string, string, string][] = [
      ['acc.deaf', 'Pt6Line4a_chbx[0]', 'Pt6Line4_DeafOrHardOfHearing[0]'],
      ['acc.blind', 'Pt6Line4b_chbx[0]', 'Pt6Line4_BlindOrSightImpaired[0]'],
      ['acc.other', 'Pt6Line4c_chbx[0]', 'Pt6Line4_AccomodationRequested[0]'],
    ];
    for (const [id, box, field] of acc) {
      if (!str(a, id)) continue;
      check.push(box);
      put(field, str(a, id));
    }
  }

  // Part 7: the petitioner. The signature (Item 6.a) stays empty: it must be signed by hand.
  if (a.readsEnglish === 'A' || a.readsEnglish === 'B') checkValue.push(['P5_Checkbox1', str(a, 'readsEnglish')]);
  if (a.readsEnglish === 'B') put('Pt5Line1b_Language[0]', str(a, 'fluentLanguage'));
  put('P5_Line3_DaytimePhoneNumber[0]', digits(str(a, 'phone')));
  put('P5_Line4_MobilePhoneNumber[0]', digits(str(a, 'mobile')));
  put('P5_Line5_EmailAddress[0]', str(a, 'email'));
  put('P7_Name[0]', fullName(a, 'name'));
  // Item 2: who prepared the petition, and whether they are an attorney (from their statement).
  const preparerBoxes = (box: string, name: string, who: string) => {
    if (a.preparer !== 'yes') return;
    check.push(box);
    put(name, str(a, 'preparer.name'));
    const statement = str(a, 'prep.statement');
    if (statement) checkValue.push([who, statement === 'notAttorney' ? 'N' : 'Y']);
  };
  preparerBoxes('P5_Checkbox2[0]', 'P5_Line2_NameofRepresentative[0]', 'P5_Checkbox2_Who');

  // Part 8: the spouse or stepparent, on a joint petition only.
  if (joint) {
    const r = str(a, 'spouse.readsEnglish');
    if (r === 'A' || r === 'B') checkValue.push(['P8_Checkbox1', r]);
    if (r === 'B') put('Pt7Line1b_Language[0]', str(a, 'spouse.language'));
    put('P5_Line3_DaytimePhoneNumber[1]', digits(str(a, 'spouse.phone')));
    put('P5_Line4_MobilePhoneNumber[1]', digits(str(a, 'spouse.mobile')));
    put('P5_Line5_EmailAddress[1]', str(a, 'spouse.email'));
    put('Pt8_Name[0]', fullName(a, 'spouse'));
    preparerBoxes('P5_Checkbox2[1]', 'P7Line2_NameofRepresentative[0]', 'P7_Checkbox2_Who');
  }

  // Parts 9 and 10: who helped. Their signatures and dates stay empty.
  const help = assistance(a, { interpreter: a.readsEnglish === 'B' || (joint && a['spouse.readsEnglish'] === 'B'), preparer: usedPreparer(a) });
  const helper = (p: HelperPerson, f: Required<Omit<AddressFields, 'careOf'>>) => {
    put(f.street, p.street);
    const u = parseUnit(p.unit);
    if (u) {
      checkValue.push([f.unit, u.kind]);
      put(f.number, u.number);
    }
    put(f.city, p.city);
    if (p.state) select[f.state] = p.state.toUpperCase();
    put(f.zip, p.zip);
    put(f.province, p.province);
    put(f.postal, p.postal);
    put(f.country, p.country);
  };
  if (help.interpreter) {
    const p = help.interpreter;
    put('P6_Line1a_InterpretersFamilyName[0]', p.family);
    put('P6_Line1b_InterpretersGivenName[0]', p.given);
    put('P6_Line2_NameofBusinessor[0]', p.business);
    helper(p, {
      street: 'P6_Line3a_StreetNumberName[0]',
      unit: 'Pt9Line3_Unit',
      number: 'Pt9Line3_AptSteFlrNumber[0]',
      city: 'Pt9Line3_CityOrTown[0]',
      state: 'Pt9Line3_State[0]',
      zip: 'Pt9Line3_ZipCode[0]',
      province: 'Pt9Line3_Province[0]',
      postal: 'Pt9Line3_PostalCode[0]',
      country: 'Pt9Line3_Country[0]',
    });
    put('P6_Line4_InterpretersDaytimePhoneNumber[0]', digits(p.phone));
    put('P6_Line5_InterpretersEmailAddress[0]', p.email);
    put('P6_Language[0]', p.language);
  }
  if (help.preparer) {
    const p = help.preparer;
    put('P7_Line1a_FamilyName[0]', p.family);
    put('P7_Line1b_PreparersGivenName[0]', p.given);
    put('P7_Line2_NameofBusinessor[0]', p.business);
    helper(p, {
      street: 'Pt9Line3_StreetNumberName[0]',
      unit: 'Pt10Line3_Unit',
      number: 'Pt10Line3_AptSteFlrNumber[0]',
      city: 'P7_Line3c_CityTown[0]',
      state: 'P7_Line3d_State[0]',
      zip: 'P7_Line3e_ZipCode[0]',
      province: 'P7_Line3f_Province[0]',
      postal: 'P7_Line3g_PostalCode[0]',
      country: 'P7_Line3h_Country[0]',
    });
    put('P7_Line4_PreparersDaytimePhoneNumber[0]', digits(p.phone));
    put('P7_Line6_PreparersEmailAddress[0]', p.email);
    if (p.statement === 'notAttorney') checkValue.push(['P7_checkbox7', 'A']);
    if (p.statement === 'attorneyExtends') check.push('P7_checkbox7[1]', 'Pt10Item7b_Extends[0]');
    if (p.statement === 'attorneyNotExtends') check.push('P7_checkbox7[1]', 'Pt10Item7b_NotExtend[0]');
  }

  // Part 11: explanations for Part 1, Items 20 and 22.
  const notes = [
    a.q20 === 'yes' && { item: '20', text: str(a, 'explain.arrests') },
    a.q22 === 'yes' && { item: '22', text: str(a, 'explain.addresses') },
  ].filter((n): n is { item: string; text: string } => !!n && !!n.text);
  notes.forEach((n, i) => {
    const line = `P8_Line${i + 3}`;
    put(`${line}a_PageNumber[0]`, '2');
    put(`${line}b_PartNumber[0]`, '1');
    put(`${line}c_ItemNumber[0]`, n.item);
    put(`${line}d_AdditionalInfo[0]`, n.text);
  });

  return { text, check, checkValue, select };
}

/** Fills the official I-751 PDF with the answers and returns the new file's bytes. */
export async function fillI751(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const index = fieldIndex(form);
  const plan = planI751(a);
  const get = (name: string) => {
    const f = index.get(name);
    if (!f) throw new Error(`No such field: ${name}`);
    return f;
  };

  // Part 11's text boxes may be rich-text fields, which pdf-lib can't read back when it redraws
  // the form; store them as plain text instead.
  for (const f of form.getFields()) if (f instanceof PDFTextField && f.isRichFormatted()) f.disableRichFormatting();

  for (const [name, raw] of Object.entries(plan.text)) {
    const field = get(name);
    if (!(field instanceof PDFTextField)) throw new Error(`Not a text field: ${name}`);
    if (UNCAPPED.has(name)) field.setMaxLength(undefined);
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

  doc.setTitle('Form I-751, Petition to Remove Conditions on Residence');
  return doc.save();
}
