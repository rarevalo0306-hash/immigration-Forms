import { PDFCheckBox, PDFDocument, PDFDropdown, type PDFFont, PDFTextField, StandardFonts } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { parseUnit } from '../engine/validation';
import { fieldIndex, optionBoxes, selectOption, setFieldText, toFormText, wrap } from './common';

// Fields of USCIS Form I-290B, edition 05/31/24 (public/forms/i-290b.pdf), named by the last
// segment of their full name. Mapped by position:
// - Part 1, Item 3 (business name) is "Pt1_Line3a_InCareOfName"; Item 4 (A-Number) is
//   "Pt1_Line6_AlienNumber[0]" and Item 5 "Pt1_Line7_USCISELISAcctNumber". The mailing address
//   (Item 6) is "Pt1Line6_*", without the underscore.
// - Part 2, Items 1.a-1.c are "P2_Line1_checkbox[0]" (A), "[2]" (B) and "[1]" (C): 1.b and 1.c
//   are out of order. Items 2.a-2.c export "reopen", "reconsider" and "motion".
// - Part 2, Items 3-7 are named one item early or off: Item 3 "P2_Line2_Formnumberappeal",
//   Item 4 "Pt2_Line3_ReceiptNumber", Item 5 "P2_Line4_ImmigrantClassification" (holds 4
//   characters), Item 6 "P2_Line5_DateAdverseDecision" and Item 7 "P3_Line6_USCISOffice", a
//   dropdown whose options carry leading spaces.
// - Part 4, Items 1-3 are "P4_Line3_TelephoneNumber", "P4_Line4_TelephoneNumber" and
//   "P4_Line5_Email". Part 7's name is "Pt1_Line1*[1]" and its A-Number "Pt1_Line6_AlienNumber[1]".

export interface Note {
  page: string;
  part: string;
  item: string;
  text: string;
}

export interface I290BPlan {
  text: Record<string, string>;
  check: string[];
  checkValue: [string, string][];
  select: Record<string, string>;
  /** The Part 3 statement; the filler continues it in Part 7 when it doesn't fit. */
  statement: string;
  /** Part 7 entries, in order, before the statement's continuation. */
  notes: Note[];
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');

const MOTION: Record<string, string> = { reopen: 'reopen', reconsider: 'reconsider', both: 'motion' };

export function planI290B(a: Answers): I290BPlan {
  const text: Record<string, string> = {};
  const check: string[] = [];
  const checkValue: [string, string][] = [];
  const select: Record<string, string> = {};
  const notes: Note[] = [];
  const put = (field: string, value: string) => {
    if (value) text[field] = value;
  };

  // Part 1. The name and A-Number repeat at the top of Part 7.
  if (a.filer === 'business') put('Pt1_Line3a_InCareOfName[0]', str(a, 'business.name'));
  else {
    for (const i of [0, 1]) {
      put(`Pt1_Line1a_FamilyName[${i}]`, str(a, 'name.family'));
      put(`Pt1_Line1b_GivenName[${i}]`, str(a, 'name.given'));
      put(`Pt1_Line1c_MiddleName[${i}]`, str(a, 'name.middle'));
    }
    put('P1_Line2_DateofBirth[0]', str(a, 'dob'));
  }
  const aNumber = digits(str(a, 'aNumber'));
  if (aNumber) for (const i of [0, 1]) put(`Pt1_Line6_AlienNumber[${i}]`, aNumber.padStart(9, '0'));
  put('Pt1_Line7_USCISELISAcctNumber[0]', digits(str(a, 'uscisAccount')));

  put('Pt1Line6_InCareOfName[0]', str(a, 'mailing.careOf'));
  put('Pt1Line6_StreetNumberName[0]', str(a, 'mailing.street'));
  const unit = parseUnit(str(a, 'mailing.unit'));
  if (unit) {
    checkValue.push(['Pt1Line6_Unit', unit.kind]);
    put('Pt1Line6_AptSteFlrNumber[0]', unit.number);
  }
  put('Pt1Line6_CityOrTown[0]', str(a, 'mailing.city'));
  if (str(a, 'mailing.state')) select['Pt1Line6_State[0]'] = str(a, 'mailing.state').toUpperCase();
  put('Pt1Line6_ZipCode[0]', digits(str(a, 'mailing.zip')).slice(0, 5));
  put('Pt1Line6_Province[0]', str(a, 'mailing.province'));
  put('Pt1Line6_PostalCode[0]', str(a, 'mailing.postal'));
  put('Pt1Line6_Country[0]', str(a, 'mailing.country'));

  // Part 2: one appeal box or one motion box.
  if (a.filingType === 'appeal' && ['A', 'B', 'C'].includes(str(a, 'appealBrief'))) checkValue.push(['P2_Line1_checkbox', str(a, 'appealBrief')]);
  if (MOTION[str(a, 'filingType')]) checkValue.push(['P2_Line2_checkbox', MOTION[str(a, 'filingType')]]);
  put('P2_Line2_Formnumberappeal[0]', str(a, 'decision.form').toUpperCase());
  put('Pt2_Line3_ReceiptNumber[0]', str(a, 'decision.receipt').replace(/[^A-Za-z0-9]/g, '').toUpperCase());
  put('P2_Line4_ImmigrantClassification[0]', str(a, 'decision.classification').toUpperCase());
  put('P2_Line5_DateAdverseDecision[0]', str(a, 'decision.date'));
  const office = str(a, 'decision.office');
  if (office) select['P3_Line6_USCISOffice[0]'] = office;
  if (office === 'Other') notes.push({ page: '2', part: '2', item: '7', text: `Office that issued the unfavorable decision: ${str(a, 'decision.officeOther')}` });

  // Part 4. The signature and its date stay empty: they are written by hand.
  put('P4_Line3_TelephoneNumber[0]', digits(str(a, 'phone')).slice(-10));
  put('P4_Line4_TelephoneNumber[0]', digits(str(a, 'mobile')).slice(-10));
  put('P4_Line5_Email[0]', str(a, 'email'));

  return { text, check, checkValue, select, statement: str(a, 'basis.statement'), notes: notes.filter((n) => !n.text.endsWith(': ')) };
}

const STATEMENT_SIZE = 9;
const NOTE_SIZE = 8;
const CONTINUED = '(Continued in Part 7. Additional Information.)';

/** Lines of `s` at `size` in `width`, each marked when it ends a paragraph. */
function lines(s: string, font: PDFFont, size: number, width: number) {
  return toFormText(s)
    .split('\n')
    .flatMap((p) => wrap(p, font, size, width).map((line, i, all) => ({ line, end: i === all.length - 1 })));
}

/** Rebuilds text from wrapped lines, keeping the paragraph breaks. */
const unwrap = (ls: { line: string; end: boolean }[]) => ls.map((l, i) => l.line + (i === ls.length - 1 ? '' : l.end ? '\n' : ' ')).join('');

/** Fills the official I-290B PDF with the answers and returns the new file's bytes. */
export async function fillI290B(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const index = fieldIndex(form);
  const plan = planI290B(a);
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

  const rect = (field: PDFTextField) => field.acroField.getWidgets()[0].getRectangle();
  const width = (field: PDFTextField) => rect(field).width - 8;
  const capacity = (field: PDFTextField, size: number) => Math.floor((rect(field).height - 4) / (size * 1.2));
  const setLines = (field: PDFTextField, ls: string[], size: number) => {
    field.enableMultiline();
    setFieldText(field, ls.join('\n'), size);
  };

  // Part 3 holds what fits; the rest continues in Part 7, after the other notes.
  const notes = [...plan.notes];
  if (plan.statement) {
    const box = textField('Pt3_FillableField[0]');
    const ls = lines(plan.statement, font, STATEMENT_SIZE, width(box));
    const room = capacity(box, STATEMENT_SIZE);
    if (ls.length <= room) setLines(box, ls.map((l) => l.line), STATEMENT_SIZE);
    else {
      setLines(box, [...ls.slice(0, room - 1).map((l) => l.line), CONTINUED], STATEMENT_SIZE);
      notes.push({ page: '2', part: '3', item: '', text: `Basis for the Appeal or Motion (continued from Part 3):\n${unwrap(ls.slice(room - 1))}` });
    }
  }

  // Part 7 has five boxes. A note takes as many boxes as it needs; what still doesn't fit goes on
  // added pages at the end.
  const slots = [3, 4, 5, 6, 7].map((n) => ({ n, box: textField(`Pt7_Line${n}d_AdditionalInfo[0]`) }));
  const extra: { note: Note; lines: string[] }[] = [];
  let slot = 0;
  notes.forEach((note, k) => {
    const box0 = slots[0].box;
    let rest = lines(note.text, font, NOTE_SIZE, width(box0)).map((l) => l.line);
    let first = true;
    // Leave one box for each note still to come.
    const end = Math.min(slots.length, Math.max(slot + 1, slots.length - (notes.length - k - 1)));
    while (rest.length && slot < end) {
      const { n, box } = slots[slot++];
      const head = first ? [] : ['(continued)'];
      let take = rest.slice(0, capacity(box, NOTE_SIZE) - head.length);
      const last = slot >= end && take.length < rest.length;
      if (last) take = take.slice(0, -1);
      rest = rest.slice(take.length);
      setFieldText(textField(`Pt7_Line${n}a_PageNumber[0]`), note.page, 9);
      setFieldText(textField(`Pt7_Line${n}b_PartNumber[0]`), note.part, 9);
      if (note.item) setFieldText(textField(`Pt7_Line${n}c_ItemNumber[0]`), note.item, 9);
      setLines(box, [...head, ...take, ...(last ? ['(continued on the attached sheet)'] : [])], NOTE_SIZE);
      first = false;
    }
    if (rest.length) extra.push({ note, lines: first ? rest : ['(continued)', ...rest] });
  });
  if (extra.length) addSheets(doc, font, a, extra);

  doc.setTitle('Form I-290B, Notice of Appeal or Motion');
  return doc.save();
}

/** Continuation sheets for Part 7, with the name and A-Number at the top as the form asks. */
function addSheets(doc: PDFDocument, font: PDFFont, a: Answers, extra: { note: Note; lines: string[] }[]) {
  const [width, height] = [612, 792];
  const margin = 54;
  const size = 10;
  const lineHeight = size * 1.3;
  const name = toFormText(a.filer === 'business' ? str(a, 'business.name') : [str(a, 'name.given'), str(a, 'name.middle'), str(a, 'name.family')].filter(Boolean).join(' '));
  const aNumber = digits(str(a, 'aNumber'));
  // Re-wrap at the page width.
  const body = extra.flatMap(({ note, lines: ls }) => [
    `Page Number: ${note.page}   Part Number: ${note.part}${note.item ? `   Item Number: ${note.item}` : ''}`,
    ...wrap(ls.join(' '), font, size, width - 2 * margin),
    '',
  ]);
  let y = 0;
  let page = doc.addPage([width, height]);
  const header = () => {
    y = height - margin;
    page.drawText('Form I-290B, Part 7. Additional Information (continued)', { x: margin, y, size: 12, font });
    y -= 20;
    page.drawText(`Name: ${name}${aNumber ? `     A-Number: A-${aNumber.padStart(9, '0')}` : ''}`, { x: margin, y, size, font });
    y -= 14;
    page.drawText('Signature: ______________________________     Date (mm/dd/yyyy): ______________', { x: margin, y, size, font });
    y -= 26;
  };
  header();
  for (const line of body) {
    if (y < margin) {
      page = doc.addPage([width, height]);
      header();
    }
    if (line) page.drawText(line, { x: margin, y, size, font });
    y -= lineHeight;
  }
}
