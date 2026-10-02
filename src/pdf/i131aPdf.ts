import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField, StandardFonts } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { isLpr, isParole } from '../forms/i131a';
import { parseUnit } from '../engine/validation';
import { fieldIndex, optionBoxes, selectOption, setFieldText, toFormText, wrap } from './common';

// Fields of USCIS Form I-131A, edition 01/20/25 (public/forms/i-131a.pdf), named by the last
// segment of their full name. Mapped by position:
// - Part 3, Item 5 (I-512/I-766 expiration) is "P3_Line2_DateExpirationI512I512LI766", and
//   Item 6 (I-131 receipt number) is "P2_Line6_I131ReceiptNumber".
// - Part 4, Item 1.b's language box is "P4_Line1b_NameofInterpreter" and Item 2's preparer name
//   is "P4_Line2_Consented". Item 1's boxes export A (1.a), B (1.b) and C (Item 2), listed in the
//   PDF as [2], [1], [0].
// - Every Yes/No pair lists No first ([0] exports N, [1] Y). Unit boxes are in different orders per
//   address (Item 3: FLR, APT, STE; Item 5: APT, STE, FLR) but their export values are right.
// - Part 7 repeats the name as "Pt1_Line1a_FamilyName[1]"… and the A-Number as "Pt1_Line6_AlienNumber[1]".
// - The phone boxes hold 10 digits: longer (foreign) numbers go to Part 7.

export interface I131APlan {
  text: Record<string, string>;
  check: string[];
  checkValue: [string, string][];
  select: Record<string, string>;
  /** Part 7 entries, in order. */
  notes: { page: string; part: string; item: string; text: string }[];
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');

/** Characters that fit on Part 2, Item 1.i's single line at 9 points. */
const OTHER_FITS = 45;

export function planI131A(a: Answers): I131APlan {
  const text: Record<string, string> = {};
  const check: string[] = [];
  const checkValue: [string, string][] = [];
  const select: Record<string, string> = {};
  const notes: I131APlan['notes'] = [];
  const put = (field: string, value: string) => {
    if (value) text[field] = value;
  };
  const yn = (base: string, value: unknown) => {
    if (value === 'yes') checkValue.push([base, 'Y']);
    if (value === 'no') checkValue.push([base, 'N']);
  };
  const state = (field: string, value: string) => {
    if (value) select[field] = value.toUpperCase();
  };
  const unit = (prefix: string, base: string, numberField: string) => {
    const u = parseUnit(str(a, `${prefix}.unit`));
    if (!u) return;
    checkValue.push([base, u.kind]);
    put(numberField, u.number);
  };
  const lpr = isLpr(a);
  const parole = isParole(a);

  // Part 1. The name and A-Number repeat at the top of Part 7.
  for (const i of [0, 1]) {
    put(`Pt1_Line1a_FamilyName[${i}]`, str(a, 'name.family'));
    put(`Pt1_Line1b_GivenName[${i}]`, str(a, 'name.given'));
    put(`Pt1_Line1c_MiddleName[${i}]`, str(a, 'name.middle'));
  }
  yn('Pt1_Line2_Checkboxes', a.nameChanged);
  put('Pt1_Line3a_InCareOfName[0]', str(a, 'mailing.careOf'));
  put('Pt1_Line3b_StreetNumberName[0]', str(a, 'mailing.street'));
  unit('mailing', 'Pt1_Line3c_Unit', 'Pt1_Line3c_AptSteFlrNumber[0]');
  put('Pt1_Line3d_CityOrTown[0]', str(a, 'mailing.city'));
  state('Pt1_Line3e_State[0]', str(a, 'mailing.state'));
  put('Pt1_Line3f_ZipCode[0]', digits(str(a, 'mailing.zip')).slice(0, 5));
  put('Pt1_Line3g_Province[0]', str(a, 'mailing.province'));
  put('Pt1_Line3h_PostalCode[0]', str(a, 'mailing.postal'));
  put('Pt1_Line3i_Country[0]', str(a, 'mailing.country'));
  yn('Pt1_Line4_Checkboxes', a.mailingSame);
  if (a.mailingSame === 'no') {
    put('Pt1_Line5a_StreetNumberName[0]', str(a, 'home.street'));
    unit('home', 'Pt1_Line5b_Unit', 'Pt1_Line5b_AptSteFlrNumber[0]');
    put('Pt1_Line5c_CityOrTown[0]', str(a, 'home.city'));
    state('Pt1Line5d_State[0]', str(a, 'home.state'));
    put('Pt1Line5e_ZipCode[0]', digits(str(a, 'home.zip')).slice(0, 5));
  }
  const aNumber = digits(str(a, 'aNumber'));
  if (aNumber) for (const i of [0, 1]) put(`Pt1_Line6_AlienNumber[${i}]`, aNumber.padStart(9, '0'));
  put('Pt1_Line7_USCISOnlineAcctNumber[0]', digits(str(a, 'uscisAccount')));
  put('Pt1_Line8_SSN[0]', digits(str(a, 'ssn')));
  put('Pt1_Line9_DateOfBirth[0]', str(a, 'dob'));
  if (a.sex === 'male') checkValue.push(['Pt1_Line10_Checkboxes', 'Male']);
  if (a.sex === 'female') checkValue.push(['Pt1_Line10_Checkboxes', 'Female']);
  put('Pt1_Line11_CountryOfBirth[0]', str(a, 'birthCountry'));
  put('Pt1_Line12_CountryOfCitizenship[0]', str(a, 'citizenship'));

  // Part 2: one reason box.
  const reason = str(a, 'reason');
  if (reason) checkValue.push(['P2_Line1_checkbox', reason]);
  if (reason === 'Other') {
    const other = str(a, 'reason.other');
    if (toFormText(other).length <= OTHER_FITS) put('P2_Line1i_Other[0]', other);
    else if (other) {
      put('P2_Line1i_Other[0]', 'See Part 7. Additional Information.');
      notes.push({ page: '2', part: '2', item: '1.i', text: other });
    }
  }

  // Part 3.
  put('P3_Line1_DateDeparture[0]', str(a, 'departed'));
  put('P3_Line2_DateIntendedTravel[0]', str(a, 'returnDate'));
  if (lpr) {
    put('P3_Line3_ExpirationofPermanentCard[0]', str(a, 'cardExpires'));
    put('P3_Line4_DateReentryPermit[0]', str(a, 'reentryExpires'));
  }
  if (parole) {
    put('P3_Line2_DateExpirationI512I512LI766[0]', str(a, 'travelDocExpires'));
    put('P2_Line6_I131ReceiptNumber[0]', str(a, 'i131.receipt').replace(/[^A-Za-z0-9]/g, '').toUpperCase());
  }
  yn('P3_Line7_Checkboxes', a.proceedings);
  if (a.proceedings === 'yes') notes.push({ page: '2', part: '3', item: '7', text: str(a, 'proceedings.details') });
  if (lpr) {
    yn('P3_Line8_Checkboxes', a.abandoned);
    if (a.abandoned === 'yes') notes.push({ page: '2', part: '3', item: '8', text: str(a, 'abandoned.details') });
    yn('P3_Line9a_Checkboxes', a.carrierBefore);
    if (a.carrierBefore === 'yes') {
      put('P3_Line9b_DateIssued[0]', str(a, 'carrier.date'));
      put('P3_Line9c_Disposition[0]', str(a, 'carrier.disposition'));
      notes.push({ page: '2', part: '3', item: '9.a', text: str(a, 'carrier.details') });
    }
  }
  if (parole) {
    yn('P3_Line10_Checkboxes', a.revoked);
    if (a.revoked === 'yes') {
      put('P3_Line10b_DateRevocation[0]', str(a, 'revoked.date'));
      put('P3_Line10b_ReasonRevocation[0]', str(a, 'revoked.reason'));
      notes.push({ page: '3', part: '3', item: '10.a', text: str(a, 'revoked.details') });
    }
  }

  // Part 4. The signature and its date stay empty: they are written by hand.
  if (a.readsEnglish === 'A' || a.readsEnglish === 'B') checkValue.push(['P4_Line1_Checkbox', str(a, 'readsEnglish')]);
  if (a.readsEnglish === 'B') put('P4_Line1b_NameofInterpreter[0]', str(a, 'fluentLanguage'));
  if (a.preparer === 'yes') {
    checkValue.push(['P4_Line1_Checkbox', 'C']);
    put('P4_Line2_Consented[0]', str(a, 'preparer.name'));
  }
  const longPhones: { item: string; text: string }[] = [];
  const phone = (id: string, field: string, item: string, label: string) => {
    const raw = str(a, id);
    let d = digits(raw);
    if (d.length === 11 && d.startsWith('1')) d = d.slice(1);
    if (!d) return;
    if (d.length <= 10 && !(raw.startsWith('+') && !raw.startsWith('+1'))) put(field, d);
    else {
      put(field, 'See Pt. 7');
      longPhones.push({ item, text: `Item ${item}, ${label}: ${raw}` });
    }
  };
  phone('phone', 'P4_Line3_DaytimeTelephoneNumber[0]', '3', 'daytime telephone');
  phone('mobile', 'P4_Line4_MobileTelephoneNumber[0]', '4', 'mobile telephone');
  if (longPhones.length) notes.push({ page: '3', part: '4', item: longPhones.map((p) => p.item).join('-'), text: longPhones.map((p) => p.text).join('\n') });
  put('P4_Line5_Email[0]', str(a, 'email'));

  // Part 7 has five boxes; at most five notes can arise (1.i, 7, 8 or 10.a, 9.a, phones).
  return { text, check, checkValue, select, notes: notes.filter((n) => n.text) };
}

/** Fills the official I-131A PDF with the answers and returns the new file's bytes. */
export async function fillI131A(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const index = fieldIndex(form);
  const plan = planI131A(a);
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
  plan.notes.forEach((n, i) => {
    const line = `Pt7_Line${i + 3}`;
    setFieldText(textField(`${line}a_PageNumber[0]`), n.page, 9);
    setFieldText(textField(`${line}b_PartNumber[0]`), n.part, 9);
    setFieldText(textField(`${line}c_ItemNumber[0]`), n.item, 9);
    const box = textField(`${line}d_AdditionalInfo[0]`);
    box.enableMultiline();
    const { width, height } = box.acroField.getWidgets()[0].getRectangle();
    const lines = wrap(toFormText(n.text), font, 8, width - 8);
    // Double-spaced, the text sits on the box's printed rules (18 points apart); single-spaced when it would not fit.
    const double = lines.length * 2 * font.heightAtSize(8) * 1.2 <= height;
    setFieldText(box, lines.join(double ? '\n\n' : '\n'), 8);
  });

  doc.setTitle('Form I-131A, Application for Travel Document (Carrier Documentation)');
  return doc.save();
}
