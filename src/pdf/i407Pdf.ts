import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField, StandardFonts } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { parseUnit } from '../engine/validation';
import { fieldIndex, optionBoxes, selectOption, setFieldText, toFormText, wrap } from './common';

// Fields of USCIS Form I-407, edition 09/25/24 (public/forms/i-407.pdf), named by the last segment
// of their full name. Mapped by position:
// - Part 1, Item 9's Apt./Ste./Flr. number is "Part21_Item9_Number".
// - Items 15-18 are one group "Pt1Submit_Checkbox" whose order doesn't follow the page: [3] is
//   Item 15 (export A), [0] Item 16 (B), [2] Item 17 (C), [1] Item 18 (D).
// - Item 12's boxes are [0] Lost (L), [1] Other (O), [2] Stolen (S), [3] Mutilated (M); Item 11's
//   Yes/No pair is [0] No, [1] Yes.
// - Item 8 (date of last departure) comes before Item 5 in the field order; the A-Number repeats in
//   each page header as "P1_Line1_AlienNumber[1..3]". The form has no Additional Information part.

export interface I407Plan {
  text: Record<string, string>;
  check: string[];
  checkValue: [string, string][];
  select: Record<string, string>;
  /** Item 14, broken into lines by the filler. */
  long: Record<string, string>;
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');

export function planI407(a: Answers): I407Plan {
  const text: Record<string, string> = {};
  const check: string[] = [];
  const checkValue: [string, string][] = [];
  const select: Record<string, string> = {};
  const long: Record<string, string> = {};
  const put = (field: string, value: string) => {
    if (value) text[field] = value;
  };

  // Items 1-8. The A-Number repeats at the top of pages 2-4.
  const aNumber = digits(str(a, 'aNumber'));
  if (aNumber) for (const i of [0, 1, 2, 3]) put(`P1_Line1_AlienNumber[${i}]`, aNumber.padStart(9, '0'));
  put('P1_Line2_USCISOnlineAccountNumber[0]', digits(str(a, 'uscisAccount')));
  put('P1_Line3_Name[0]', str(a, 'cardName'));
  put('P1_Line4_FamilyName[0]', str(a, 'name.family'));
  put('P1_Line4_GivenName[0]', str(a, 'name.given'));
  put('P1_Line4_MiddleName[0]', str(a, 'name.middle'));
  put('P1_Line5_DateOfBirth[0]', str(a, 'dob'));
  put('P1_Line6_CountryofBirth[0]', str(a, 'birthCountry'));
  put('P1_Line7_CountryofCitizenship[0]', str(a, 'citizenship'));
  put('P1_Line8_DateOfLastDeparture[0]', str(a, 'lastDeparture'));

  // Items 9-10.
  put('Part1_Item9_InCareOfName[0]', str(a, 'mailing.careOf'));
  put('Part1_Item9_StreetName[0]', str(a, 'mailing.street'));
  const u = parseUnit(str(a, 'mailing.unit'));
  if (u) {
    checkValue.push(['Part1_Item9_Unit', u.kind]);
    put('Part21_Item9_Number[0]', u.number);
  }
  put('Part1_Item9_City[0]', str(a, 'mailing.city'));
  if (str(a, 'mailing.state')) select['Part1_Item9_State[0]'] = str(a, 'mailing.state').toUpperCase();
  put('Part1_Item9_ZipCode[0]', digits(str(a, 'mailing.zip')).slice(0, 5));
  put('Part1_Item9_Province[0]', str(a, 'mailing.province'));
  put('Part1_Item9_PostalCode[0]', str(a, 'mailing.postal'));
  put('Part1_Item9_Country[0]', str(a, 'mailing.country'));
  put('Part1_Line10_Email[0]', str(a, 'email'));

  // Items 11-14. Item 13's date is the signing date, written by hand.
  if (a.cardReturned === 'yes') checkValue.push(['P1_Line11_YesNo', 'Y']);
  if (a.cardReturned === 'no') {
    checkValue.push(['P1_Line11_YesNo', 'N']);
    if (['L', 'S', 'M', 'O'].includes(str(a, 'cardReason'))) checkValue.push(['P1_Line12', str(a, 'cardReason')]);
    check.push('Pt1Line13_Checkbox[0]');
  }
  if (a['otherDocs.has'] === 'yes' && str(a, 'otherDocs')) long['P1_Line14_OtherDocuments[0]'] = str(a, 'otherDocs');

  // Items 15-18.
  if (['A', 'B', 'C', 'D'].includes(str(a, 'submission'))) checkValue.push(['Pt1Submit_Checkbox', str(a, 'submission')]);

  // Item 19: the person's name, or the parent's or guardian's. Item 20 is signed by hand.
  const own = [str(a, 'name.given'), str(a, 'name.middle'), str(a, 'name.family')].filter(Boolean).join(' ');
  put('P1_Line19_YourName[0]', a.filer === 'guardian' ? str(a, 'guardian.name') : own);

  return { text, check, checkValue, select, long };
}

/** Fills the official I-407 PDF with the answers and returns the new file's bytes. */
export async function fillI407(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const index = fieldIndex(form);
  const plan = planI407(a);
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
  // Long text is broken into lines here: pdf-lib's own wrapping is very slow on long text.
  for (const [name, raw] of Object.entries(plan.long)) {
    const field = textField(name);
    field.enableMultiline();
    const width = field.acroField.getWidgets()[0].getRectangle().width - 8;
    setFieldText(field, wrap(toFormText(raw), font, 9, width).join('\n'), 9);
  }

  doc.setTitle('Form I-407, Record of Abandonment of Lawful Permanent Resident Status');
  return doc.save();
}
