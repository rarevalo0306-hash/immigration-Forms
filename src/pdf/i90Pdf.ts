import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { parseUnit } from '../engine/validation';
import { assistance, usedInterpreter, usedPreparer, type HelperPerson } from '../forms/assistance';
import { fieldIndex, optionBoxes, selectOption, setFieldText } from './common';

// Fields of USCIS Form I-90, edition 01/20/25 (public/forms/i-90.pdf), named by the last segment of
// their full name. This edition's names match the printed items, except that the weight boxes are
// "P3_Line9_HeightInches1-3" and the Part 3 biographic items are numbered 6-11. In Part 7 the
// preparer's printed "Mobile Telephone Number" is "P7_Line5_PreparersFaxNumber", the interpreter's
// is "P6_Line4_InterpretersDaytimePhoneNumber[1]", and the extends / does not extend boxes are
// "P7_checkbox7Extend" exporting E / D.

export interface I90Plan {
  text: Record<string, string>;
  check: string[];
  checkValue: [string, string][];
  select: Record<string, string>;
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');

/** The I-485 biographic codes the questions use, translated to this form's export values. */
const RACE: Record<string, string> = { WH: 'White', AS: 'Asian', BL: 'Black', AI: 'Indian', HW: 'Hawaiian' };
const EYES: Record<string, string> = { BN: 'BRO', BL: 'BLK', HA: 'HAZ', GN: 'GRN', BU: 'BLU', GR: 'GRY', MA: 'MAR', PN: 'PNK', UN: 'UNK' };
const HAIR: Record<string, string> = { BL: 'BLK', BR: 'BRO', BN: 'BLN', GR: 'GRY', WH: 'WHI', RD: 'RED', SA: 'SDY', NH: 'BAL', OT: 'UNK' };

export function planI90(a: Answers): I90Plan {
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
  /** Address fields lettered after the item: `letters` gives the letter of street, unit, city, state, zip, province, postal, country. */
  const address = (prefix: string, item: string, letters: string, unitBox: string) => {
    const [street, unitL, city, state, zip, province, postal, country] = letters.split('').map((l) => `P1_Line${item}${l}`);
    put(`${street}_StreetNumberName[0]`, str(a, `${prefix}.street`));
    const unit = parseUnit(str(a, `${prefix}.unit`));
    if (unit) {
      checkValue.push([unitBox, unit.kind]);
      put(`${unitL}_AptSteFlrNumber[0]`, unit.number);
    }
    put(`${city}_CityOrTown[0]`, str(a, `${prefix}.city`));
    const st = str(a, `${prefix}.state`).toUpperCase();
    if (st) select[`${state}_State[0]`] = st;
    put(`${zip}_ZipCode[0]`, str(a, `${prefix}.zip`));
    put(`${province}_Province[0]`, str(a, `${prefix}.province`));
    put(`${postal}_PostalCode[0]`, str(a, `${prefix}.postal`));
    put(`${country}_Country[0]`, str(a, `${prefix}.country`));
  };

  // Part 1. The name and A-Number repeat at the top of Part 8.
  const aNumber = digits(str(a, 'aNumber'));
  if (aNumber) for (const i of [0, 1]) put(`P1_Line1_AlienNumber[${i}]`, aNumber.padStart(9, '0'));
  put('P1_Line2_AcctIdentifier[0]', digits(str(a, 'uscisAccount')));
  for (const i of [0, 1]) {
    put(`P1_Line3a_FamilyName[${i}]`, str(a, 'name.family'));
    put(`P1_Line3b_GivenName[${i}]`, str(a, 'name.given'));
    put(`P1_Line3c_MiddleName[${i}]`, str(a, 'name.middle'));
  }
  if (['Y', 'N', 'NA'].includes(str(a, 'nameChanged'))) checkValue.push(['P1_checkbox4', str(a, 'nameChanged')]);
  if (a.nameChanged === 'Y') {
    put('P1_Line5a_FamilyName[0]', str(a, 'cardName.family'));
    put('P1_Line5b_GivenName[0]', str(a, 'cardName.given'));
    put('P1_Line5c_MiddleName[0]', str(a, 'cardName.middle'));
  }
  put('P1_Line6a_InCareofName[0]', str(a, 'mailing.careOf'));
  address('mailing', '6', 'bcdefghi', 'P1_checkbox6c_Unit');
  if (a.mailingSame === 'no') address('home', '7', 'abcdefgh', 'P1_checkbox7b_Unit');
  if (a.sex === 'male') check.push('P1_Line8_male[0]');
  if (a.sex === 'female') check.push('P1_Line8_female[0]');
  put('P1_Line9_DateOfBirth[0]', str(a, 'dob'));
  put('P1_Line10_CityTownOfBirth[0]', str(a, 'birthCity'));
  put('P1_Line11_CountryofBirth[0]', str(a, 'birthCountry'));
  put('P1_Line12_MotherGivenName[0]', str(a, 'motherGiven'));
  put('P1_Line13_FatherGivenName[0]', str(a, 'fatherGiven'));
  put('P1_Line14_ClassOfAdmission[0]', str(a, 'coa').toUpperCase());
  put('P1_Line15_DateOfAdmission[0]', str(a, 'admissionDate'));
  put('P1_Line16_SSN[0]', digits(str(a, 'ssn')));

  // Part 2: status and reason, from Section A or Section B depending on the status.
  const status = str(a, 'status');
  if (['1a', '1b', '1c'].includes(status)) checkValue.push(['P2_checkbox1', status]);
  if ((status === '1a' || status === '1b') && str(a, 'reasonA')) {
    checkValue.push(['P2_checkbox2', str(a, 'reasonA')]);
    if (a.reasonA === '2h1') put('P2_Line2h1_CityandState[0]', str(a, 'poe.cityState'));
  }
  if (status === '1c' && str(a, 'reasonB')) checkValue.push(['P2_checkbox3', str(a, 'reasonB')]);

  // Part 3: processing information.
  put('P3_Line1_LocationAppliedVisa[0]', str(a, 'location.applied'));
  put('P3_Line2_LocationIssuedVisa[0]', str(a, 'location.issued'));
  if (a.enteredWithVisa === 'yes') {
    put('P3_Line3a_Destination[0]', str(a, 'arrival.destination'));
    put('P3_Line3a1_CityandState[0]', str(a, 'arrival.poe'));
  }
  yn('P3_checkbox4', a.proceedings);
  yn('P3_checkbox5', a.abandoned);
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

  // Part 4: accommodations.
  yn('P4_checkbox1', a.accommodation);
  if (a.accommodation === 'yes') {
    (['a', 'b', 'c'] as const).forEach((l, i) => {
      const value = str(a, ['acc.deaf', 'acc.blind', 'acc.other'][i]);
      if (!value) return;
      check.push(`P4_checkbox1${l}[0]`);
      put(`P4_Line1${l}_AccomodationRequested[0]`, value);
    });
  }

  // Part 5. The signature (Item 6.a) stays empty: it must be signed by hand.
  if (a.readsEnglish === 'A') check.push('P5_Checkbox1a[0]');
  if (a.readsEnglish === 'B') {
    check.push('P5_Checkbox1b[0]');
    put('P5_Line1b_Language[0]', str(a, 'fluentLanguage'));
  }
  put('P5_Line3_DaytimePhoneNumber[0]', digits(str(a, 'phone')));
  put('P5_Line4_MobilePhoneNumber[0]', digits(str(a, 'mobile')));
  put('P5_Line5_EmailAddress[0]', str(a, 'email'));
  if (a.preparer === 'yes') {
    check.push('P5_Checkbox2[0]');
    put('P5_Line2_NameofRepresentative[0]', str(a, 'preparer.name'));
  }

  // Parts 6 and 7: who helped. Their signatures and dates stay empty.
  const help = assistance(a, { interpreter: usedInterpreter(a), preparer: usedPreparer(a) });
  const helper = (l: string, p: HelperPerson) => {
    put(`${l}_Line3a_StreetNumberName[0]`, p.street);
    const u = parseUnit(p.unit);
    if (u) {
      checkValue.push([`${l}_checkbox3b_Unit`, u.kind]);
      put(`${l}_Line3b_AptSteFlrNumber[0]`, u.number);
    }
    put(`${l}_Line3c_CityTown[0]`, p.city);
    if (p.state) select[`${l}_Line3d_State[0]`] = p.state.toUpperCase();
    put(`${l}_Line3e_ZipCode[0]`, p.zip);
    put(`${l}_Line3f_Province[0]`, p.province);
    put(`${l}_Line3g_PostalCode[0]`, p.postal);
    put(`${l}_Line3h_Country[0]`, p.country);
  };
  if (help.interpreter) {
    const p = help.interpreter;
    put('P6_Line1a_InterpretersFamilyName[0]', p.family);
    put('P6_Line1b_InterpretersGivenName[0]', p.given);
    put('P6_Line2_NameofBusinessor[0]', p.business);
    helper('P6', p);
    put('P6_Line4_InterpretersDaytimePhoneNumber[0]', digits(p.phone));
    put('P6_Line4_InterpretersDaytimePhoneNumber[1]', digits(p.mobile));
    put('P6_Line5_InterpretersEmailAddress[0]', p.email);
    put('P6_Language[0]', p.language);
  }
  if (help.preparer) {
    const p = help.preparer;
    put('P7_Line1a_FamilyName[0]', p.family);
    put('P7_Line1b_PreparersGivenName[0]', p.given);
    put('P7_Line2_NameofBusinessor[0]', p.business);
    helper('P7', p);
    put('P7_Line4_PreparersDaytimePhoneNumber[0]', digits(p.phone));
    put('P7_Line5_PreparersFaxNumber[0]', digits(p.mobile));
    put('P7_Line6_PreparersEmailAddress[0]', p.email);
    if (p.statement === 'notAttorney') checkValue.push(['P7_checkbox7', 'A']);
    if (p.statement === 'attorneyExtends') checkValue.push(['P7_checkbox7', 'B'], ['P7_checkbox7Extend', 'E']);
    if (p.statement === 'attorneyNotExtends') checkValue.push(['P7_checkbox7', 'B'], ['P7_checkbox7Extend', 'D']);
  }

  // Part 8: explanations for Part 3, Items 4 and 5.
  const lines = ['P8_Line3', 'P8_Line4'];
  const notes = [
    a.proceedings === 'yes' && { item: '4', text: str(a, 'explain.proceedings') },
    a.abandoned === 'yes' && { item: '5', text: str(a, 'explain.abandoned') },
  ].filter((n): n is { item: string; text: string } => !!n && !!n.text);
  notes.forEach((n, i) => {
    put(`${lines[i]}a_PageNumber[0]`, '3');
    put(`${lines[i]}b_PartNumber[0]`, '3');
    put(`${lines[i]}c_ItemNumber[0]`, n.item);
    put(`${lines[i]}d_AdditionalInfo[0]`, n.text);
  });

  return { text, check, checkValue, select };
}

/** Fills the official I-90 PDF with the answers and returns the new file's bytes. */
export async function fillI90(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const index = fieldIndex(form);
  const plan = planI90(a);
  const get = (name: string) => {
    const f = index.get(name);
    if (!f) throw new Error(`No such field: ${name}`);
    return f;
  };

  // Part 8's text boxes may be rich-text fields, which pdf-lib can't read back when it redraws
  // the form; store them as plain text instead.
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

  doc.setTitle('Form I-90, Application to Replace Permanent Resident Card');
  return doc.save();
}
