import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { SAFETY_ITEMS } from '../forms/i821d';
import { assistance, type HelperPerson } from '../forms/assistance';
import { parseUnit } from '../engine/validation';
import { fieldIndex, optionBoxes, selectOption, setFieldText } from './common';

// Fields of USCIS Form I-821D, edition 01/20/25 (public/forms/i-821d.pdf), named by the last segment
// of their full name. This edition's names match the printed items; its Yes/No boxes export
// "Yes"/"No" in Parts 2-4 and "Y"/"N" in Part 1.

export interface I821DPlan {
  text: Record<string, string>;
  check: string[];
  checkValue: [string, string][];
  select: Record<string, string>;
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');

/** Address blocks: `${p}b_Street`, `${p}c_Unit` and `${p}c_Number`, `${p}d_City`, `${p}e_State`, `${p}f_ZipCode`. */
const block = (p: string, zip = `${p}f_ZipCode[0]`) => ({ street: `${p}b_Street[0]`, unit: `${p}c_Unit`, number: `${p}c_Number[0]`, city: `${p}d_City[0]`, state: `${p}e_State[0]`, zip });

const RACE: Record<string, string> = { WH: 'White', AS: 'Asian', BL: 'Black', AI: 'AmIndian', HW: 'NativeHaw' };
const EYES: Record<string, string> = { BN: 'BRO', BL: 'BLK', HA: 'HAZ', GN: 'GRN', BU: 'BLU', GR: 'GRY', MA: 'MAR', PN: 'PNK', UN: 'UNK' };
const HAIR: Record<string, string> = { BL: 'BLK', BR: 'BRO', BN: 'BLN', GR: 'GRY', WH: 'WHI', RD: 'RED', SA: 'SDY', NH: 'BAL', OT: 'UNK' };

export function planI821D(a: Answers): I821DPlan {
  const text: Record<string, string> = {};
  const check: string[] = [];
  const checkValue: [string, string][] = [];
  const select: Record<string, string> = {};
  const put = (field: string, value: string) => {
    if (value) text[field] = value;
  };
  /** Yes/No boxes: Part 1 exports Y/N, the later parts Yes/No. */
  const yn = (base: string, value: unknown, long = true) => {
    if (value === 'yes') checkValue.push([base, long ? 'Yes' : 'Y']);
    if (value === 'no') checkValue.push([base, long ? 'No' : 'N']);
  };
  const address = (prefix: string, f: ReturnType<typeof block>) => {
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
  const initial = a.requestType === 'initial';

  // Part 1. The name and A-Number repeat at the top of Part 8.
  if (a.detention === 'AM') checkValue.push(['Part1_CB', 'AM']);
  if (a.detention === 'AMNOT') checkValue.push(['Part1_CB', 'AM NOT']);
  if (initial) check.push('P1_Line1_Checkbox[0]');
  if (a.requestType === 'renewal') {
    check.push('P1_Line2_Checkbox[0]');
    put('P1_Line2_Date[0]', str(a, 'renewal.expires'));
  }
  for (const i of [0, 1]) {
    put(`P1_Line3a_Name[${i}]`, str(a, 'name.family'));
    put(`P1_Line3b_Name[${i}]`, str(a, 'name.given'));
    put(`P1_Line3c_Name[${i}]`, str(a, 'name.middle'));
  }
  put('P1_Line4a_Name[0]', str(a, 'mailing.careOf'));
  address('mailing', block('P1_Line4'));
  yn('P1_Line5_Checkbox', a.removal, false);
  if (a.removal === 'yes') {
    if (str(a, 'removal.status')) checkValue.push(['P1_Line6_CB', str(a, 'removal.status')]);
    put('P1_Line6f_Date[0]', str(a, 'removal.date'));
    put('P1_Line6g_Location[0]', str(a, 'removal.location'));
  }
  const aNumber = digits(str(a, 'aNumber'));
  if (aNumber) for (const i of [0, 1]) put(`P1_Line7_ANumber[${i}]`, aNumber.padStart(9, '0'));
  put('P1_Line8_SSN[0]', digits(str(a, 'ssn')));
  put('P1_Line9_DOB[0]', str(a, 'dob'));
  if (a.sex === 'male') checkValue.push(['P1_Line10_Gender', 'M']);
  if (a.sex === 'female') checkValue.push(['P1_Line10_Gender', 'F']);
  put('P1_Line11a_CityBirth[0]', str(a, 'birthCity'));
  put('P1_Line11b_CountryBirth[0]', str(a, 'birthCountry'));
  put('P1_Line12_CountryRes[0]', str(a, 'residence'));
  put('P1_Line13_CountryCitz[0]', str(a, 'citizenship'));
  if (['S', 'M', 'D', 'W'].includes(str(a, 'marital'))) checkValue.push(['P1_Line14_MaritalStatus', str(a, 'marital')]);
  if (a['otherName.has'] === 'yes') {
    put('P1_Line15a_Name[0]', str(a, 'otherName.family'));
    put('P1_Line15b_Name[0]', str(a, 'otherName.given'));
    put('P1_Line15c_Name[0]', str(a, 'otherName.middle'));
  }
  if (a.ethnicity === 'hispanic') checkValue.push(['P1_Line16_Checkbox', 'H']);
  if (a.ethnicity === 'notHispanic') checkValue.push(['P1_Line16_Checkbox', 'N']);
  for (const r of Array.isArray(a.race) ? a.race : []) if (RACE[r]) check.push(`P1_Line17_Race_${RACE[r]}[0]`);
  if (a.heightFeet) select['P1_Line18_Height-Ft[0]'] = str(a, 'heightFeet');
  if (a.heightInches) select['P1_Line18_Height-In[0]'] = str(a, 'heightInches');
  const weight = digits(str(a, 'weight'));
  if (weight) {
    const w = weight.padStart(3, '0').slice(-3);
    [0, 1, 2].forEach((i) => put(`P1_Line19_Weight[${i}]`, w[i]));
  }
  if (EYES[str(a, 'eyes')]) checkValue.push(['P1_Line20_Checkbox', EYES[str(a, 'eyes')]]);
  if (HAIR[str(a, 'hair')]) checkValue.push(['P1_Line21_Checkbox', HAIR[str(a, 'hair')]]);

  // Part 2: residence and travel. The present address's "To" is printed as "Present".
  yn('P2_Line1_checkbox', a.continuous);
  address(a.presentSame === 'yes' ? 'mailing' : 'present', block('P2_Line2'));
  put('P2_Line2a_Date_From[0]', str(a, 'present.from'));
  if (a['address.more0'] === 'yes') {
    for (let i = 1; i <= 3; i++) {
      if (i > 1 && a[`address.more${i - 1}`] !== 'yes') break;
      const line = `P2_Line${i + 2}`;
      address(`address${i}`, block(line, i === 1 ? 'Pt2_Line3f_ZipCode[0]' : `${line}f_ZipCode[0]`));
      put(`${line}a_Date_From[0]`, str(a, `address${i}.from`));
      put(`${line}a_Date_To[0]`, str(a, `address${i}.to`));
    }
  }
  if (a['trip.more0'] === 'yes') {
    const names = [
      ['P2_Line6a_DepDate[0]', 'P2_Line6b_RetDate[0]', 'P2_Line6c_Reason[0]'],
      ['P2_Line7a_DeptDate[0]', 'P2_Line7b_RetDate[0]', 'P2_Line7c_Reason[0]'],
    ];
    for (let i = 1; i <= 2; i++) {
      if (i > 1 && a['trip.more1'] !== 'yes') break;
      const [dep, ret, reason] = names[i - 1];
      put(dep, str(a, `trip${i}.departure`));
      put(ret, str(a, `trip${i}.return`));
      put(reason, str(a, `trip${i}.reason`));
    }
  }
  yn('P2_Line8_Checkbox', a.leftWithoutAP);
  put('P2_Line9a_Country[0]', str(a, 'passport.country'));
  put('P2_Line9b_Passport[0]', str(a, 'passport.number'));
  put('P2_Line9c_ExpDate[0]', str(a, 'passport.expires'));
  put('P2_Line10_BorderCard[0]', str(a, 'borderCard'));

  // Part 3: initial requests only.
  if (initial) {
    yn('P3_Line1_checkbox', a.before16);
    put('P3_Line2_Date[0]', str(a, 'entry.date'));
    put('P3_Line3_Place[0]', str(a, 'entry.place'));
    if (str(a, 'status2012')) select['P3_Line4_ImmStatus[0]'] = str(a, 'status2012');
    if (a.i94Has === 'yes') checkValue.push(['P3_Line5a_I94', 'Y']);
    if (a.i94Has === 'no') checkValue.push(['P3_Line5a_I94', 'N']);
    if (a.i94Has === 'yes') {
      put('P3_Line5b_I94Number[0]', digits(str(a, 'i94.number')));
      put('P3_Line5c_I94Date[0]', str(a, 'i94.until'));
    }
    put('P3_Line6_Education[0]', str(a, 'edu.how'));
    put('P3_Line7_School[0]', str(a, 'edu.school'));
    put('P3_Line8_GradDate[0]', str(a, 'edu.date'));
    if (a.military === 'yes') checkValue.push(['P3_Line9_Military', 'Y']);
    if (a.military === 'no') checkValue.push(['P3_Line9_Military', 'N']);
    if (a.military === 'yes') {
      if (str(a, 'mil.branch')) select['P3_Line9a_Branch[0]'] = str(a, 'mil.branch');
      put('P3_Line9b_SvcDate[0]', str(a, 'mil.start'));
      put('P3_Line9c_DischgDate[0]', str(a, 'mil.end'));
      if (str(a, 'mil.discharge')) select['P3_Line9d_Discharge[0]'] = str(a, 'mil.discharge');
    }
  }

  // Part 4: criminal, national security and public safety.
  for (const item of SAFETY_ITEMS) yn(`P4_Line${item.id.slice(3)}_Checkbox`, a[item.id]);

  // Part 5. The signature (Item 2.a) stays empty: it must be signed by hand.
  if (a.readsEnglish === 'A' || a.readsEnglish === 'B') checkValue.push(['P5_Line1a_1b_Checkbox', str(a, 'readsEnglish')]);
  if (a.readsEnglish === 'B') put('P5_Line1b_Language[0]', str(a, 'fluentLanguage'));
  put('P5_Line3_DayPhone[0]', digits(str(a, 'phone')));
  put('P5_Line4_MobilePhone[0]', digits(str(a, 'mobile')));
  put('P5_Line5_Email[0]', str(a, 'email'));

  // Parts 6–7: the interpreter and the preparer; their signatures and dates stay empty. This edition
  // has no mobile numbers for them (the field named P7_Line5_MobilePhone is printed "Fax Number")
  // and no preparer's statement boxes.
  const helper = (p: HelperPerson, part: string) => {
    put(`${part}_Line1a_Name[0]`, p.family);
    put(`${part}_Line1b_Name[0]`, p.given);
    put(`${part}_Line2_Organization[0]`, p.business);
    put(`${part}_Line3a_Street[0]`, p.street);
    const unit = parseUnit(p.unit);
    if (unit) {
      checkValue.push([`${part}_Line3b_Unit`, unit.kind]);
      put(`${part}_Line3b_Number[0]`, unit.number);
    }
    put(`${part}_Line3c_City[0]`, p.city);
    if (p.state) select[`${part}_Line3d_State[0]`] = p.state.toUpperCase();
    put(`${part}_Line3e_ZipCode[0]`, p.zip);
    put(`${part}_Line3f_Province[0]`, p.province);
    put(`${part}_Line3g_PostalCode[0]`, p.postal);
    put(`${part}_Line3h_Country[0]`, p.country);
  };
  const help = assistance(a, { interpreter: a.readsEnglish === 'B', preparer: a.preparer === 'yes' });
  if (help.interpreter) {
    helper(help.interpreter, 'P6');
    put('P6_Line4_DayPhone[0]', digits(help.interpreter.phone));
    put('P6_Line5_Email[0]', help.interpreter.email);
    put('P6_Language[0]', help.interpreter.language);
  }
  if (help.preparer) {
    helper(help.preparer, 'P7');
    put('P7_Line4_DayPhone[0]', digits(help.preparer.phone));
    put('P7_Line6_Email[0]', help.preparer.email);
  }

  // Part 8: the "Other" removal outcome and Part 4 explanations.
  const notes = [
    a.removal === 'yes' && a['removal.status'] === 'Other' && { page: '2', part: '1', item: '6.e', text: str(a, 'removal.explain') },
    SAFETY_ITEMS.some((i) => a[i.id] === 'yes') && { page: '4', part: '4', item: '1-7', text: str(a, 'p4.explain') },
  ].filter((n): n is { page: string; part: string; item: string; text: string } => !!n && !!n.text);
  notes.forEach((n, i) => {
    const line = `P8_Line${i + 3}`;
    put(`${line}a_Page[0]`, n.page);
    put(`${line}b_Part[0]`, n.part);
    put(`${line}c_Item[0]`, n.item);
    put(`${line}d_Narrative[0]`, n.text);
  });

  return { text, check, checkValue, select };
}

/** Fills the official I-821D PDF with the answers and returns the new file's bytes. */
export async function fillI821D(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const index = fieldIndex(form);
  const plan = planI821D(a);
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

  doc.setTitle('Form I-821D, Consideration of Deferred Action for Childhood Arrivals');
  return doc.save();
}
