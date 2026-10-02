import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField, StandardFonts } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { parseUnit } from '../engine/validation';
import { fieldIndex, optionBoxes, selectOption, setFieldText, toFormText, wrap } from './common';

// Fields of USCIS Form I-865, edition 11/10/20 (public/forms/i-865.pdf), named by the last segment
// of their full name. Mapped by position:
// - Part 1, Item 5 (physical = mailing address?) is "P4_Line5_Checkbox": [1] exports Y, [0] N.
// - Part 3, Item 1.a is "P3_Line1_Checkbox[1]" (export A) and 1.b is "P3_Line1_Checkbox[0]" (B).
// - Part 3, Item 2's "is / is not an attorney" pair is "P3_Line2_Who" (Y / N); the preparer's
//   name is "P3_Line2_Attorney". The sponsor's signature is "P5_Line6a_SignatureofApplicant".
// - Part 2's A-Numbers are not in item order: immigrant 4's is "P2_Line8_AlienNumber" but sits
//   before "P2_Line4"/"P2_Line6" in the file. Part 6 repeats the name as "P1_Line1*[1]".
// - Interpreter and preparer unit boxes (Parts 4 and 5) are out of order (APT, FLR, STE), but
//   they are left blank.

export interface I865Plan {
  text: Record<string, string>;
  check: string[];
  checkValue: [string, string][];
  select: Record<string, string>;
  /** Part 6 entries, in order. */
  notes: { page: string; part: string; item: string; text: string }[];
}

/** Part 6's text size: its line height doubled matches the printed rules. */
const NOTE_SIZE = 8;

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');

const chain = (a: Answers, id: string, max: number, first: boolean) => {
  if (!first) return 0;
  let n = 1;
  while (n < max && a[`${id}.more${n}`] === 'yes') n++;
  return n;
};

/** Part 2's four rows: name fields and A-Number. */
const P2 = [
  { name: 'P2_Line1', aNumber: 'P2_Line2_AlienNumber[0]' },
  { name: 'P2_Line3', aNumber: 'P2_Line4_AlienNumber[0]' },
  { name: 'P2_Line5', aNumber: 'P2_Line6_AlienNumber[0]' },
  { name: 'P2_Line7', aNumber: 'P2_Line8_AlienNumber[0]' },
];

/** An address on one line, for Part 6. */
const oneLine = (a: Answers, p: string) => {
  const s = (id: string) => str(a, `${p}.${id}`);
  const cityLine = [s('city'), [s('state').toUpperCase(), s('zip')].filter(Boolean).join(' '), s('province'), s('postal')].filter(Boolean).join(', ');
  return [s('street'), s('unit'), cityLine, s('country')].filter(Boolean).join(', ');
};

export function planI865(a: Answers): I865Plan {
  const text: Record<string, string> = {};
  const check: string[] = [];
  const checkValue: [string, string][] = [];
  const select: Record<string, string> = {};
  const notes: I865Plan['notes'] = [];
  const put = (field: string, value: string) => {
    if (value) text[field] = value;
  };
  const yn = (base: string, value: unknown) => {
    if (value === 'yes') checkValue.push([base, 'Y']);
    if (value === 'no') checkValue.push([base, 'N']);
  };
  const address = (prefix: string, l: string, [street, unit, city, st, zip, province, postal, country]: string[]) => {
    put(`${l}${street}_StreetNumberName[0]`, str(a, `${prefix}.street`));
    const u = parseUnit(str(a, `${prefix}.unit`));
    if (u) {
      checkValue.push([`${l}${unit}_Unit`, u.kind]);
      put(`${l}${unit}_AptSteFlrNumber[0]`, u.number);
    }
    put(`${l}${city}_CityOrTown[0]`, str(a, `${prefix}.city`));
    if (str(a, `${prefix}.state`)) select[`${l}${st}_State[0]`] = str(a, `${prefix}.state`).toUpperCase();
    put(`${l}${zip}_ZipCode[0]`, str(a, `${prefix}.zip`));
    put(`${l}${province}_Province[0]`, str(a, `${prefix}.province`));
    put(`${l}${postal}_PostalCode[0]`, str(a, `${prefix}.postal`));
    put(`${l}${country}_Country[0]`, str(a, `${prefix}.country`));
  };

  // Part 1. The name repeats at the top of Part 6.
  for (const i of [0, 1]) {
    put(`P1_Line1a_FamilyName[${i}]`, str(a, 'name.family'));
    put(`P1_Line1b_GivenName[${i}]`, str(a, 'name.given'));
    put(`P1_Line1c_MiddleName[${i}]`, str(a, 'name.middle'));
  }
  put('P1_Line2_DateOfBirth[0]', str(a, 'dob'));
  address('home', 'P1_Line3', ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
  put('P1_Line4_DateOfChangeAdd[0]', str(a, 'moveDate'));
  yn('P4_Line5_Checkbox', a.mailingSame);
  if (a.mailingSame === 'no') {
    put('P1_Line6a_InCareofName[0]', str(a, 'mailing.careOf'));
    address('mailing', 'P1_Line6', ['b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']);
    put('P1_Line7_DateOfChangeAdd[0]', str(a, 'mailing.since'));
  }
  if (a.oldAddress === 'yes' && oneLine(a, 'previous')) {
    notes.push({ page: '1', part: '1', item: '3', text: `Previous physical address (before this change): ${oneLine(a, 'previous')}` });
  }

  // Part 2: the principal immigrant, then up to 7 more; rows 5 and on go to Part 6.
  const people = [{ family: str(a, 'principal.family'), given: str(a, 'principal.given'), middle: str(a, 'principal.middle'), aNumber: digits(str(a, 'principal.aNumber')) }];
  const more = chain(a, 'member', 7, a['member.more0'] === 'yes');
  for (let i = 1; i <= more; i++)
    people.push({ family: str(a, `member${i}.family`), given: str(a, `member${i}.given`), middle: str(a, `member${i}.middle`), aNumber: digits(str(a, `member${i}.aNumber`)) });
  people.slice(0, 4).forEach((p, r) => {
    const f = P2[r];
    put(`${f.name}a_FamilyName[0]`, p.family);
    put(`${f.name}b_GivenName[0]`, p.given);
    put(`${f.name}c_MiddleName[0]`, p.middle);
    if (p.aNumber) put(f.aNumber, p.aNumber.padStart(9, '0'));
  });
  const extra = people.slice(4).filter((p) => p.family || p.given);
  if (extra.length) {
    const lines = extra.map((p, k) => {
      const name = [p.family && `Family Name: ${p.family}`, p.given && `Given Name: ${p.given}`, p.middle && `Middle Name: ${p.middle}`].filter(Boolean).join('; ');
      return `Sponsored Immigrant ${k + 5}: ${name}; A-Number: ${p.aNumber ? `A-${p.aNumber.padStart(9, '0')}` : 'None'}`;
    });
    notes.push({ page: '2', part: '2', item: '8', text: lines.join('\n') });
  }

  // Part 3. The signature and its date (Item 6) stay empty: they are written by hand.
  if (a.readsEnglish === 'A' || a.readsEnglish === 'B') checkValue.push(['P3_Line1_Checkbox', str(a, 'readsEnglish')]);
  if (a.readsEnglish === 'B') put('P3_Line1b_language[0]', str(a, 'fluentLanguage'));
  if (a.preparer === 'yes') {
    check.push('P3_Line2_Checkbox[0]');
    put('P3_Line2_Attorney[0]', str(a, 'preparer.name'));
    yn('P3_Line2_Who', a['preparer.attorney']);
  }
  put('P3_Line3_DaytimeTelephoneNumber[0]', digits(str(a, 'phone')));
  put('P3_Line4_MobileTelephoneNumber[0]', digits(str(a, 'mobile')));
  put('P3_Line5_EmailAddress[0]', str(a, 'email'));

  return { text, check, checkValue, select, notes };
}

/** Fills the official I-865 PDF with the answers and returns the new file's bytes. */
export async function fillI865(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const index = fieldIndex(form);
  const plan = planI865(a);
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

  // Some text boxes are rich-text fields, which pdf-lib can't read back when it redraws the form;
  // store them as plain text instead.
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

  // Part 6 has five blocks (Items 2-6). Lines are broken here: pdf-lib's own wrapping is very slow.
  plan.notes.slice(0, 5).forEach((n, i) => {
    const line = `P6_Line${i + 2}`;
    setFieldText(textField(`${line}a_PageNumber[0]`), n.page, 9);
    setFieldText(textField(`${line}b_PartNumber[0]`), n.part, 9);
    setFieldText(textField(`${line}c_ItemNumber[0]`), n.item, 9);
    const box = textField(`${line}d_AdditionalInfo[0]`);
    box.enableMultiline();
    // Double-spaced at this size, the text sits between the printed rules (18 points apart).
    const lines = wrap(toFormText(n.text), font, NOTE_SIZE, box.acroField.getWidgets()[0].getRectangle().width - 8);
    setFieldText(box, lines.join('\n\n'), NOTE_SIZE);
  });

  doc.setTitle("Form I-865, Sponsor's Notice of Change of Address");
  return doc.save();
}
