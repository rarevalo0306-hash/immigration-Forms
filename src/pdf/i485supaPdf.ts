import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { parseUnit } from '../engine/validation';
import { assistance, usedInterpreter, usedPreparer } from '../forms/assistance';
import { otherPrincipal } from '../forms/i485supa';
import { fieldIndex, optionBoxes, selectOption, setFieldText } from './common';

// Fields of USCIS Supplement A to Form I-485, edition 09/18/26 (public/forms/i-485supa.pdf), named
// by the last segment of their full name. Mapped by position:
// - Part 1, Item 2's unit boxes are "Part1_Line2_CB" (no "Unit" suffix), listed FLR, APT, STE with
//   padded export values ("FLR ", " APT", " STE"); on the page they read Apt., Ste., Flr. The street
//   box holds 25 characters. Item 2 is a U.S. address only (no province, postal code or country).
// - Part 2, Item 1's five boxes are one group "Part2_Line1_Checkbox" (A-E), but 1.d and 1.e ([3], [4])
//   come after Part 3's boxes in the field order. Part 3's ten boxes are "Part3_Line1_Checkbox" (A-J).
// - The signatures are text fields ("Part4_Line4_Signature", "Part5_Line6_Signature"…), left blank.
// - Parts 5 and 6 hold only name, business, phones (10 digits) and email; the interpreter's language
//   ("I am fluent in English and ___") is "Part5_NameofLanguage". There is no Additional Information part.

export interface I485supaPlan {
  text: Record<string, string>;
  check: string[];
  checkValue: [string, string][];
  select: Record<string, string>;
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');
const list = (a: Answers, id: string) => (Array.isArray(a[id]) ? (a[id] as string[]) : []);
const aNum = (s: string) => {
  const d = digits(s);
  return d ? d.padStart(9, '0') : '';
};

export function planI485supa(a: Answers): I485supaPlan {
  const text: Record<string, string> = {};
  const check: string[] = [];
  const checkValue: [string, string][] = [];
  const select: Record<string, string> = {};
  const put = (field: string, value: string) => {
    if (value) text[field] = value;
  };

  // Part 1.
  put('Part1_Line1_FamilyName[0]', str(a, 'name.family'));
  put('Part1_Line1_GivenName[0]', str(a, 'name.given'));
  put('Part1_Line1_MiddleName[0]', str(a, 'name.middle'));
  put('Part1_Line2_InCareofName[0]', str(a, 'mailing.careOf'));
  put('Part1_Line2_StreetNumberName[0]', str(a, 'mailing.street'));
  const u = parseUnit(str(a, 'mailing.unit'));
  if (u) {
    checkValue.push(['Part1_Line2_CB', u.kind]);
    put('Part1_Line2_AptSteFlrNumber[0]', u.number);
  }
  put('Part1_Line2_CityOrTown[0]', str(a, 'mailing.city'));
  if (str(a, 'mailing.state')) select['Part1_Line2_State[0]'] = str(a, 'mailing.state').toUpperCase();
  put('Part1_Line2_ZipCode[0]', digits(str(a, 'mailing.zip')).slice(0, 5));
  put('Part1_Line3_AlienNumber[0]', aNum(str(a, 'aNumber')));
  put('Part1_Line4_USCISELISAcctNumber[0]', digits(str(a, 'uscisAccount')));
  put('Part1_Line5_DateOfBirth[0]', str(a, 'dob'));
  put('Part1_Line6_CountryofBirth[0]', str(a, 'birthCountry'));
  put('Part1_Line7_CountryofCitizenship[0]', str(a, 'citizenship'));

  // Part 2. When the applicant is the principal beneficiary (1.a, 1.b), Items 3-4 are their own.
  const basis = str(a, 'basis245i');
  if (['A', 'B', 'C', 'D', 'E'].includes(basis)) checkValue.push(['Part2_Line1_Checkbox', basis]);
  put('Part2_Line2_ReceiptNumber[0]', str(a, 'qualifying.receipt').replace(/[^A-Za-z0-9]/g, '').toUpperCase());
  const principal = otherPrincipal(a) ? 'qualPrincipal' : basis === 'A' || basis === 'B' ? 'name' : '';
  if (principal) {
    put('Part2_Line3_FamilyName[0]', str(a, `${principal}.family`));
    put('Part2_Line3_GivenName[0]', str(a, `${principal}.given`));
    put('Part2_Line3_MiddleName[0]', str(a, `${principal}.middle`));
    put('Part2_Line4_AlienNumber[0]', aNum(str(a, principal === 'name' ? 'aNumber' : 'qualPrincipal.aNumber')));
  }
  put('Part2_Line5_Category[0]', str(a, 'supa.category'));

  // Part 3.
  for (const bar of list(a, 'bars')) if ('ABCDEFGHIJ'.includes(bar) && bar.length === 1) checkValue.push(['Part3_Line1_Checkbox', bar]);

  // Part 4. The signature (Item 4) and its date stay empty: they are written by hand.
  put('Part4_Line1_DayPhone[0]', digits(str(a, 'phone')).slice(-10));
  put('Part4_Line2_MobilePhone[0]', digits(str(a, 'mobile')).slice(-10));
  put('Part4_Line3_Email[0]', str(a, 'email'));

  // Parts 5 and 6: the interpreter and the preparer.
  const help = assistance(a, { interpreter: usedInterpreter(a), preparer: usedPreparer(a) });
  if (help.interpreter) {
    const p = help.interpreter;
    put('Part5_Line1_InterpreterFamilyName[0]', p.family);
    put('Part5_Line1_InterpreterGivenName[0]', p.given);
    put('Part5_Line2_InterpreterBusinessorOrg[0]', p.business);
    put('Part5_Line3_DayPhone[0]', digits(p.phone).slice(-10));
    put('Part5_Line4_MobilePhone[0]', digits(p.mobile).slice(-10));
    put('Part5_Line5_Email[0]', p.email);
    put('Part5_NameofLanguage[0]', p.language);
  }
  if (help.preparer) {
    const p = help.preparer;
    put('Part6_Line1_PreparerFamilyName[0]', p.family);
    put('Part6_Line1_PreparerGivenName[0]', p.given);
    put('Part6_Line2_BusinessName[0]', p.business);
    put('Part6_Line3_DayPhone[0]', digits(p.phone).slice(-10));
    put('Part6_Line4_MobilePhone[0]', digits(p.mobile).slice(-10));
    put('Part6_Line5_Email[0]', p.email);
  }

  return { text, check, checkValue, select };
}

/** Fills the official Supplement A PDF with the answers and returns the new file's bytes. */
export async function fillI485supa(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const index = fieldIndex(form);
  const plan = planI485supa(a);
  const get = (name: string) => {
    const f = index.get(name);
    if (!f) throw new Error(`No such field: ${name}`);
    return f;
  };

  // Some text boxes are rich-text fields, which pdf-lib can't read back when it redraws the form;
  // store them as plain text instead.
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

  doc.setTitle('Supplement A to Form I-485, Adjustment of Status Under Section 245(i)');
  return doc.save();
}
