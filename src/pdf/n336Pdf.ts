import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField, StandardFonts } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { parseUnit } from '../engine/validation';
import { assistance, usedInterpreter, usedPreparer, type HelperPerson } from '../forms/assistance';
import { fieldIndex, optionBoxes, selectOption, setFieldText, toFormText, wrap } from './common';

// Fields of USCIS Form N-336, edition 04/01/24 (public/forms/n-336.pdf), named by the last segment
// of their full name. Many names don't match the printed items, so these were mapped by position:
// - Part 2, Item 1 (receipt number) is "Pt2Line1_ExplainEligibility[0]", Item 2 (denial date)
//   "Line6_DateOfBirth[1]" and Item 3 (office) "Pt2Line1_ExplainEligibility[1]".
// - Part 4's big reasons box is "Pt3Line6_Email[0]"; Part 5, Item 5 (email) is "Pt5Line5_Email[0]".
// - Part 3's race boxes are "Line5_Race1..5" and both Asian (Race2) and Native Hawaiian (Race4)
//   export "A", so they are checked by name. Part 5, Item 1.A/1.B are the separate boxes
//   "Pt10Line1a_Checkbox"/"Pt10Line1b_Checkbox" (exports Y and N), Item 2 "Part10Line2_Checkbox".
// - Part 8's rows are scrambled: Item 3 is "Pt7Line3*", Item 4 "Pt7Line4*[2]", Item 5
//   "Pt7Line4a..c[1]" with text "Pt7Line4d_AdditionalInfo[0]", Item 6 "Pt7Line4a..c[0]" with text
//   "Pt7Line4d_AdditionalInfo[1]". Part 8's name is "Pt1Line1_*[1]"; the A-Number repeats on every
//   page as "AlienNumber[0..6]". "USCISOnlineAcctNumber[0]" is the attorney's, not the applicant's
//   (Item 4 is "Pt2Pt2Line8_USCISOnlineAcctNumber[0]").
// - Part 6 (interpreter) and Part 7 (preparer) borrow other parts' names: the interpreter's business,
//   phone, email and language are "Pt4Line*", the mobile "Pt3Line5_MobileTelephoneNumber3"; the
//   preparer's name and business are "Pt5Line1/2", the statement boxes "Pt5LineCheckbox7" (A, B) and
//   "Pt5Checkbox7b_extends"/"Pt5Checkbox7b_notextends". Their signatures and dates stay empty.

export interface N336Plan {
  text: Record<string, string>;
  check: string[];
  checkValue: [string, string][];
  select: Record<string, string>;
  /** The Part 4 statement; the filler continues it in Part 8 when it doesn't fit. */
  statement: string;
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');

const RACE: Record<string, string> = { indian: 'Line5_Race1[0]', asian: 'Line5_Race2[0]', black: 'Line5_Race3[0]', pacific: 'Line5_Race4[0]', white: 'Line5_Race5[0]' };
/** The N-400's eye and hair codes, as this form exports them. */
const EYES: Record<string, string> = { BRO: 'Brown', BLK: 'Black', HAZ: 'Hazel', GRN: 'Green', BLU: 'Blue', GRY: 'Gray', MAR: 'Maroon', PNK: 'Pink', XXX: 'Other' };
const HAIR: Record<string, string> = { BLK: 'Black', BRO: 'Brown', BLN: 'Blond', GRY: 'Gray', WHI: 'White', RED: 'Red', SDY: 'Sandy', BAL: 'Bald', XXX: 'Other' };

/** Part 8's four blocks in printed order (Items 3-6). */
export const PART8 = [
  { page: 'Pt7Line3a_PageNumber[0]', part: 'Pt7Line3b_PartNumber[0]', item: 'Pt7Line3c_ItemNumber[0]', info: 'Pt7Line3d_AdditionalInfo[0]' },
  { page: 'Pt7Line4a_PageNumber[2]', part: 'Pt7Line4b_PartNumber[2]', item: 'Pt7Line4c_ItemNumber[2]', info: 'Pt7Line4d_AdditionalInfo[2]' },
  { page: 'Pt7Line4a_PageNumber[1]', part: 'Pt7Line4b_PartNumber[1]', item: 'Pt7Line4c_ItemNumber[1]', info: 'Pt7Line4d_AdditionalInfo[0]' },
  { page: 'Pt7Line4a_PageNumber[0]', part: 'Pt7Line4b_PartNumber[0]', item: 'Pt7Line4c_ItemNumber[0]', info: 'Pt7Line4d_AdditionalInfo[1]' },
];

/** The Part 4 text: the denial reason, the applicant's reasons and what supports them. */
export function reasonsStatement(a: Answers): string {
  const parts: string[] = [];
  if (str(a, 'n400.denialReason')) parts.push(`Reason USCIS gave for denying my Form N-400: ${str(a, 'n400.denialReason')}`);
  if (str(a, 'hearing.reasons')) parts.push(`Why I believe the decision is wrong: ${str(a, 'hearing.reasons')}`);
  if (a.brief === 'attached') {
    const list = str(a, 'brief.list').replace(/\s*\n\s*/g, '; ');
    parts.push(`I am attaching a brief and/or additional evidence in support of this request${list ? `: ${list.replace(/[.;]$/, '')}.` : '.'}`);
  }
  if (a.brief === 'hearing') parts.push('I will submit a brief and/or additional evidence at the time of my hearing.');
  return parts.join('\n\n');
}

export function planN336(a: Answers): N336Plan {
  const text: Record<string, string> = {};
  const check: string[] = [];
  const checkValue: [string, string][] = [];
  const select: Record<string, string> = {};
  const put = (field: string, value: string) => {
    if (value) text[field] = value;
  };
  const name = (prefix: string, [family, given, middle]: string[]) => {
    put(family, str(a, `${prefix}.family`));
    put(given, str(a, `${prefix}.given`));
    put(middle, str(a, `${prefix}.middle`));
  };
  const address = (prefix: string, line: string) => {
    put(`${line}_StreetNumberName[0]`, str(a, `${prefix}.street`));
    const u = parseUnit(str(a, `${prefix}.unit`));
    if (u) {
      checkValue.push([`${line}_Unit`, u.kind]);
      put(`${line}_AptSteFlrNumber[0]`, u.number);
    }
    put(`${line}_CityOrTown[0]`, str(a, `${prefix}.city`));
    put(`${line}_County[0]`, str(a, `${prefix}.county`));
    if (str(a, `${prefix}.state`)) select[`${line}_State[0]`] = str(a, `${prefix}.state`).toUpperCase();
    put(`${line}_ZipCode[0]`, str(a, `${prefix}.zip`));
    if (str(a, `${prefix}.street`)) put(`${line}_Country[0]`, 'United States');
  };

  // Part 1. The name and A-Number repeat in Part 8; the A-Number tops every page.
  const aNumber = digits(str(a, 'aNumber'));
  if (aNumber) for (let i = 0; i <= 6; i++) put(`AlienNumber[${i}]`, aNumber.padStart(9, '0'));
  for (const i of [0, 1]) name('name', [`Pt1Line1_FamilyName[${i}]`, `Pt1Line1_GivenName[${i}]`, `Pt1Line1_MiddleName[${i}]`]);
  if (a.hasOtherNames === 'yes') {
    name('otherName1', ['Pt1Line2_FamilyName[0]', 'Pt1Line2_GivenName[0]', 'Pt1Line2_MiddleName[0]']);
    if (a.hasOtherNames2 === 'yes') name('otherName2', ['Pt1Line2_FamilyName2[0]', 'Pt1Line2_GivenName2[0]', 'Pt1Line2_MiddleName2[0]']);
  }
  put('Line6_DateOfBirth[0]', str(a, 'dob'));
  put('Pt2Pt2Line8_USCISOnlineAcctNumber[0]', digits(str(a, 'uscisAccount')));
  address('home', 'Pt1Line5');
  // Item 6 asks for the mailing address even when it is the same as the physical one.
  if (a.mailingSame === 'no') {
    put('Pt1Line6_InCareofName[0]', str(a, 'mailing.careOf'));
    address('mailing', 'Pt1Line6');
  } else if (a.mailingSame === 'yes') address('home', 'Pt1Line6');
  put('P4_Line1_Telephone[0]', digits(str(a, 'workPhone')));
  put('P4_Line2_Telephone[0]', digits(str(a, 'eveningPhone')));

  // Part 2.
  put('Pt2Line1_ExplainEligibility[0]', str(a, 'n400.receipt').replace(/[^A-Za-z0-9]/g, '').toUpperCase());
  put('Line6_DateOfBirth[1]', str(a, 'n400.denialDate'));
  put('Pt2Line1_ExplainEligibility[1]', str(a, 'n400.office'));
  if (a['n400.military'] === 'yes') check.push('Pt2Line4_Yes[0]');
  if (a['n400.military'] === 'no') check.push('Pt2Line4_No[0]');

  // Part 3.
  if (a.ethnicity === 'hispanic') checkValue.push(['P3Line22', 'H']);
  if (a.ethnicity === 'notHispanic') checkValue.push(['P3Line22', 'NH']);
  for (const r of Array.isArray(a.race) ? a.race : []) if (RACE[r]) check.push(RACE[r]);
  if (str(a, 'heightFeet')) select['P3_Line18_HeightFeet[0]'] = str(a, 'heightFeet');
  if (str(a, 'heightInches')) select['P3_Line18_HeightInches[0]'] = String(Number(str(a, 'heightInches')));
  const weight = digits(str(a, 'weight'));
  if (weight) {
    const w = weight.padStart(3, '0').slice(-3);
    [1, 2, 3].forEach((i) => put(`P3_Line19_Pounds${i}[0]`, w[i - 1]));
  }
  if (EYES[str(a, 'eyes')]) checkValue.push(['Pt3Line5_EyeColor', EYES[str(a, 'eyes')]]);
  if (HAIR[str(a, 'hair')]) checkValue.push(['Pt3Line6_HairColor', HAIR[str(a, 'hair')]]);

  // Part 5. The signature (Item 6) and its date stay empty: they are written by hand.
  if (a.readsEnglish === 'A') check.push('Pt10Line1a_Checkbox[0]');
  if (a.readsEnglish === 'B') {
    check.push('Pt10Line1b_Checkbox[0]');
    put('Pt10Line1b_language[0]', str(a, 'fluentLanguage'));
  }
  if (a.preparer === 'yes') {
    check.push('Part10Line2_Checkbox[0]');
    put('Pt10Line2_NameofRepresentative[0]', str(a, 'preparer.name'));
  }
  put('Pt5Line3_DaytimeTelephoneNumber3[0]', digits(str(a, 'phone')));
  put('Pt5Line4_MobileTelephoneNumber3[0]', digits(str(a, 'mobile')));
  put('Pt5Line5_Email[0]', str(a, 'email'));

  // Parts 6 and 7.
  const helper = (p: HelperPerson, f: { family: string; given: string; business: string; line: string; phone: string; mobile: string; email: string }) => {
    put(f.family, p.family);
    put(f.given, p.given);
    put(f.business, p.business);
    put(`${f.line}_StreetNumberName[0]`, p.street);
    const u = parseUnit(p.unit);
    if (u) {
      checkValue.push([`${f.line}_Unit`, u.kind]);
      put(`${f.line}_AptSteFlrNumber[0]`, u.number);
    }
    put(`${f.line}_CityOrTown[0]`, p.city);
    if (/^[A-Za-z]{2}$/.test(p.state)) select[`${f.line}_State[0]`] = p.state.toUpperCase();
    put(`${f.line}_ZipCode[0]`, p.zip);
    put(`${f.line}_Province[0]`, p.province);
    put(`${f.line}_PostalCode[0]`, p.postal);
    put(`${f.line}_Country[0]`, p.country);
    put(f.phone, digits(p.phone));
    put(f.mobile, digits(p.mobile));
    put(f.email, p.email);
  };
  const help = assistance(a, { interpreter: usedInterpreter(a), preparer: usedPreparer(a) });
  if (help.interpreter) {
    helper(help.interpreter, {
      family: 'Pt6Line1_InterpreterFamilyName[0]', given: 'Pt6Line1_InterpreterGivenName[0]', business: 'Pt4Line2_NameofBusinessorOrgName[0]', line: 'Pt6Line3',
      phone: 'Pt4Line4_DaytimeTelephoneNumber3[0]', mobile: 'Pt3Line5_MobileTelephoneNumber3[0]', email: 'Pt4Line5_EmailAddress[0]',
    });
    put('Pt4Line6a_NameOfLanguage[0]', help.interpreter.language || str(a, 'fluentLanguage'));
  }
  if (help.preparer) {
    helper(help.preparer, {
      family: 'Pt5Line1_PreparerFamilyName[0]', given: 'Pt5Line1_PreparerGivenName[0]', business: 'Pt5Line2_NameofBusinessorOrgName[0]', line: 'Pt7Line3',
      phone: 'Pt7Line4_PrepDaytimeTelePhoneNumber[0]', mobile: 'Pt7Line5_PrepMobileTelePhoneNumber[0]', email: 'Pt7Line6_EmailAddress[0]',
    });
    const st = help.preparer.statement;
    if (st === 'notAttorney') checkValue.push(['Pt5LineCheckbox7', 'A']);
    if (st === 'attorneyExtends' || st === 'attorneyNotExtends') {
      checkValue.push(['Pt5LineCheckbox7', 'B']);
      check.push(st === 'attorneyExtends' ? 'Pt5Checkbox7b_extends[0]' : 'Pt5Checkbox7b_notextends[0]');
    }
  }

  return { text, check, checkValue, select, statement: reasonsStatement(a) };
}

const REASONS_SIZE = 10;
const NOTE_SIZE = 8;
const LEADING = 1.2;

/** Fills the official N-336 PDF with the answers and returns the new file's bytes. */
export async function fillN336(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const index = fieldIndex(form);
  const plan = planN336(a);
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
  const box = (field: PDFTextField) => field.acroField.getWidgets()[0].getRectangle();
  const lines = (field: PDFTextField, s: string, size: number) => wrap(toFormText(s), font, size, box(field).width - 8);
  const room = (field: PDFTextField, size: number) => Math.floor((box(field).height - 4) / (size * LEADING));
  const setLines = (field: PDFTextField, ls: string[], size: number) => {
    field.enableMultiline();
    setFieldText(field, ls.join('\n'), size);
  };

  // Part 4 holds what fits; the rest continues in Part 8's blocks.
  if (plan.statement) {
    const reasons = textField('Pt3Line6_Email[0]');
    const all = lines(reasons, plan.statement, REASONS_SIZE);
    const cap = room(reasons, REASONS_SIZE);
    if (all.length <= cap) setLines(reasons, all, REASONS_SIZE);
    else {
      setLines(reasons, [...all.slice(0, cap - 1), '(Continued in Part 8. Additional Information.)'], REASONS_SIZE);
      // Each Part 4 line fits on one Part 8 line at the smaller size; blank lines keep the paragraphs.
      const rest = all.slice(cap - 1);
      while (rest.length && !rest[0]) rest.shift();
      let left = rest.flatMap((l) => (l ? lines(textField(PART8[0].info), l, NOTE_SIZE) : ['']));
      for (let i = 0; i < PART8.length && left.length; i++) {
        const f = PART8[i];
        const info = textField(f.info);
        const n = room(info, NOTE_SIZE);
        const last = i === PART8.length - 1;
        let chunk = left.slice(0, n);
        left = left.slice(n);
        if (last && left.length) chunk = [...chunk.slice(0, n - 1), '(Continued on an attached sheet.)'];
        setFieldText(textField(f.page), '3', 9);
        setFieldText(textField(f.part), '4', 9);
        setFieldText(textField(f.item), 'N/A', 9);
        setLines(info, chunk, NOTE_SIZE);
      }
    }
  }

  doc.setTitle('Form N-336, Request for a Hearing on a Decision in Naturalization Proceedings');
  return doc.save();
}
