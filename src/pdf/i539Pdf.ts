import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField, StandardFonts } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { BACKGROUND_ITEMS, IMMIGRANT_ITEMS } from '../forms/i539';
import { parseUnit } from '../engine/validation';
import { assistance, usedInterpreter, usedPreparer } from '../forms/assistance';
import { fieldIndex, optionBoxes, selectOption, setFieldText, toFormText, wrap } from './common';

// Fields of USCIS Form I-539, edition 08/28/24 (public/forms/i-539.pdf), named by the last
// segment of their full name. Mapped by position:
// - Part 1's mailing address is "Part2_Item11_*" (its unit boxes "Part1_Item4_Unit"); Items 7-10
//   are "P1_Line6..9_*" and Item 11 is "SupA_Line1i..n_*". Item 12's current status is the
//   dropdown "Pt1Line15a_NewStatus".
// - Part 2, Item 5 (school) is "SupA_Line1k_Passport[1]" and Item 6 (SEVIS) "SupA_Line1k_Passport[2]".
// - Part 2, Item 1 exports A = reinstatement, B = extension, C = change; Item 3 exports D/E.
// - Part 3, Item 6's first name is "P3_Line4_NameofPetitioner[0]" and last name "[1]"; Part 4,
//   Item 1's passport number is "P4_Line1a_CountryOfIssuance[1]" (the country is "[0]").
// - Part 4's Yes/No boxes are separate "P4_checkboxN_Yes/No" fields numbered in printed order
//   from 3 to 20, so Item 7.a is checkbox7, 8.a is checkbox12, 9 is checkbox14 and 15 is checkbox20.
// - Part 5's contact items 1-3 are "P5_Line3..5_*".
// - Part 6 (interpreter) borrows Part 7's names: its name and business are "P7_Line1_Preparer*" and
//   "P7_Line2_PreparerNameofBusinessorOrgName", its language "P7_Line6_Language"; its phones are
//   "P6_Line4_DaytimePhoneNumber[0]" (daytime) and "[1]" (mobile). Its signature is
//   "P6_Line7_SignatureApplicant[1]". Part 7's mobile is "P7_Line5_FaxPhoneNumber". Neither part has
//   an address or preparer's statement boxes.

export interface I539Plan {
  text: Record<string, string>;
  check: string[];
  checkValue: [string, string][];
  select: Record<string, string>;
  /** Part 8 entries, in order. */
  notes: { page: string; part: string; item: string; text: string }[];
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');

/** Part 4's items in printed order, as the PDF numbers their Yes/No boxes (3-20). */
const PART4 = [...IMMIGRANT_ITEMS, ...BACKGROUND_ITEMS].map((i) => i.id);
export const part4Box = (id: string) => `P4_checkbox${PART4.indexOf(id) + 3}`;

/** "p4.7d" → "7.d" */
const itemNumber = (id: string) => id.slice(3).replace(/([a-e])$/, '.$1');

export function planI539(a: Answers): I539Plan {
  const text: Record<string, string> = {};
  const check: string[] = [];
  const checkValue: [string, string][] = [];
  const select: Record<string, string> = {};
  const notes: I539Plan['notes'] = [];
  const put = (field: string, value: string) => {
    if (value) text[field] = value;
  };
  const state = (field: string, value: string) => {
    if (value) select[field] = value.toUpperCase();
  };
  const unit = (prefix: string, base: string, number: string) => {
    const u = parseUnit(str(a, `${prefix}.unit`));
    if (u) {
      checkValue.push([base, u.kind]);
      put(number, u.number);
    }
  };

  // Part 1. The name and A-Number repeat at the top of Part 8.
  for (const i of [0, 1]) {
    put(`P1Line1a_FamilyName[${i}]`, str(a, 'name.family'));
    put(`P1_Line1b_GivenName[${i}]`, str(a, 'name.given'));
    put(`P1_Line1c_MiddleName[${i}]`, str(a, 'name.middle'));
  }
  const aNumber = digits(str(a, 'aNumber'));
  if (aNumber) for (const i of [0, 1]) put(`Pt1Line2_AlienNumber[${i}]`, aNumber.padStart(9, '0'));
  put('Pt1Line2_USCISOnlineAcctNumber[0]', digits(str(a, 'uscisAccount')));
  put('Part2_Item11_InCareOfName[0]', str(a, 'mailing.careOf'));
  put('Part2_Item11_StreetName[0]', str(a, 'mailing.street'));
  unit('mailing', 'Part1_Item4_Unit', 'Part1_Item4_Number[0]');
  put('Part2_Item11_City[0]', str(a, 'mailing.city'));
  state('Part2_Item11_State[0]', str(a, 'mailing.state'));
  put('Part2_Item11_ZipCode[0]', str(a, 'mailing.zip'));
  if (a.mailingSame === 'yes') checkValue.push(['P1_checkbox5', 'Y']);
  if (a.mailingSame === 'no') {
    checkValue.push(['P1_checkbox5', 'N']);
    put('Part1_Item6_StreetName[0]', str(a, 'home.street'));
    unit('home', 'Part1_Item6_Unit', 'Part1_Item6_Number[0]');
    put('Part1_Item6_City[0]', str(a, 'home.city'));
    state('Part1_Item6_State[0]', str(a, 'home.state'));
    put('Part1_Item6_ZipCode[0]', str(a, 'home.zip'));
  }
  put('P1_Line6_CountryOfBirth[0]', str(a, 'birthCountry'));
  put('P1_Line7_CountryOfCitizenship[0]', str(a, 'citizenship'));
  put('P1_Line8_DateOfBirth[0]', str(a, 'dob'));
  put('P1_Line9_SSN[0]', digits(str(a, 'ssn')));
  put('SupA_Line1i_DateOfArrival[0]', str(a, 'lastEntry.date'));
  put('SupA_Line1j_ArrivalDeparture[0]', str(a, 'i94.number').replace(/[\s-]/g, '').toUpperCase());
  put('SupA_Line1k_Passport[0]', str(a, 'passport.number'));
  put('SupA_Line1l_TravelDoc[0]', str(a, 'passport.travelDoc'));
  put('SupA_Line1m_CountryOfIssuance[0]', str(a, 'passport.country'));
  put('SupA_Line1n_ExpDate[0]', str(a, 'passport.expires'));
  if (a.currentStatus) select['Pt1Line15a_NewStatus[0]'] = str(a, 'currentStatus');
  if (a.statusDS === 'yes') check.push('P1_Checkbox12c[0]');
  if (a.statusDS === 'no') put('SupA_Line1p_DateExpires[0]', str(a, 'i94.expires'));

  // Part 2.
  const type = ({ reinstatement: 'A', extension: 'B', change: 'C' } as Record<string, string>)[str(a, 'appType')];
  if (type) checkValue.push(['P2_checkbox', type]);
  if (a.appType === 'change') {
    if (a.newStatus) select['Pt2Line2a_NewStatus[0]'] = str(a, 'newStatus');
    put('Pt2Line2b_EffectiveDate[0]', str(a, 'change.effective'));
  }
  if (a.coApplicants === 'alone') {
    checkValue.push(['P2_checkbox4', 'D']);
    put('P2_Line5b_TotalNumber[0]', '1');
  }
  if (a.coApplicants === 'family') {
    checkValue.push(['P2_checkbox4', 'E']);
    put('P2_Line5b_TotalNumber[0]', digits(str(a, 'peopleCount')));
  }
  put('SupA_Line1k_Passport[1]', str(a, 'school.name'));
  put('SupA_Line1k_Passport[2]', str(a, 'sevis').toUpperCase());

  // Part 3.
  put('P3_Line1a_DateExtended[0]', str(a, 'extend.until'));
  if (a.relGranted === 'yes') checkValue.push(['P3_checkbox2a', 'Y']);
  if (a.relGranted === 'no') checkValue.push(['P3_checkbox2a', 'N']);
  const petition = str(a, 'relPetition');
  if (['A', 'B', 'N'].includes(petition)) checkValue.push(['P3_checkbox1', petition]);
  if (a.relGranted === 'yes' || petition === 'A' || petition === 'B') {
    const form = str(a, 'relForm');
    if (form === 'A' || form === 'B') checkValue.push(['P3_checkbox4', form]);
    put('P3_Line5_ReceiptNumber[0]', str(a, 'rel.receipt').replace(/[^A-Za-z0-9]/g, '').toUpperCase());
  }
  if (petition === 'B') {
    put('P3_Line4_NameofPetitioner[0]', str(a, 'rel.given'));
    put('P3_Line4_NameofPetitioner[1]', str(a, 'rel.family'));
    put('P3_Line5_DateFiled[0]', str(a, 'rel.filed'));
  }

  // Part 4.
  if (a.passportChanged === 'yes') {
    put('P4_Line1a_CountryOfIssuance[1]', str(a, 'newPassport.number'));
    put('P4_Line1a_CountryOfIssuance[0]', str(a, 'newPassport.country'));
    put('P4_Line1b_ExpirationDate[0]', str(a, 'newPassport.expires'));
  }
  put('P2_Line10_StreetName[0]', str(a, 'abroad.street'));
  unit('abroad', 'P2_Line10_Unit', 'P2_Line10_Number[0]');
  put('P2_Line10_City[0]', str(a, 'abroad.city'));
  put('P2_Line10_Province[0]', str(a, 'abroad.province'));
  put('P2_Line10_PostalCode[0]', str(a, 'abroad.postal'));
  put('P2_Line10_Country[0]', str(a, 'abroad.country'));
  const yn = (box: string, v: unknown) => {
    if (v === 'yes') check.push(`${box}_Yes[0]`);
    if (v === 'no') check.push(`${box}_No[0]`);
  };
  for (const id of PART4) yn(part4Box(id), a[id]);
  yn('P4_checkbox19', a.employed);
  yn('P4_checkbox20', a.exchangeVisitor);

  // Part 8: one entry per explanation.
  const yes = PART4.filter((id) => a[id] === 'yes');
  if (yes.length) {
    const items = yes.map(itemNumber);
    // The item box holds 6 characters: "7.d", "3,6", or a range like "3-13".
    const short = yes.map((id) => id.slice(3));
    const item = items.join(',').length <= 6 ? items.join(',') : short.join(',').length <= 6 ? short.join(',') : `${short[0]}-${short[short.length - 1]}`;
    const page = IMMIGRANT_ITEMS.some((i) => i.id === yes[0]) ? '3' : '4';
    notes.push({ page, part: '4', item, text: `Item${items.length > 1 ? 's' : ''} ${items.join(', ')}: ${str(a, 'background.explain')}` });
  }
  if (a.employed === 'yes') notes.push({ page: '4', part: '4', item: '14', text: `Employment in the United States: ${str(a, 'employed.explain')}` });
  if (a.employed === 'no') notes.push({ page: '4', part: '4', item: '14', text: `How I am supporting myself: ${str(a, 'support.explain')}` });
  if (a.exchangeVisitor === 'yes') notes.push({ page: '4', part: '4', item: '15', text: `Dates in J-1/J-2 status: ${str(a, 'exchange.explain')}` });

  // Part 5. The signature and its date stay empty: they are written by hand.
  put('P5_Line3_DaytimePhoneNumber[0]', digits(str(a, 'phone')));
  put('P5_Line4_MobilePhoneNumber[0]', digits(str(a, 'mobile')));
  put('P5_Line5_EmailAddress[0]', str(a, 'email'));

  // Parts 6 and 7: the interpreter and the preparer. Signatures and dates are written by hand.
  const help = assistance(a, { interpreter: usedInterpreter(a), preparer: usedPreparer(a) });
  if (help.interpreter) {
    const p = help.interpreter;
    put('P7_Line1_PreparerFamilyName[0]', p.family);
    put('P7_Line1_PreparerGivenName[0]', p.given);
    put('P7_Line2_PreparerNameofBusinessorOrgName[0]', p.business);
    put('P6_Line4_DaytimePhoneNumber[0]', digits(p.phone).slice(-10));
    put('P6_Line4_DaytimePhoneNumber[1]', digits(p.mobile).slice(-10));
    put('P6_Line5_EmailAddress[0]', p.email);
    put('P7_Line6_Language[0]', p.language);
  }
  if (help.preparer) {
    const p = help.preparer;
    put('P7_Line1a_PreparerFamilyName[0]', p.family);
    put('P7_Line1b_PreparerGivenName[0]', p.given);
    put('P7_Line2_BusinessName[0]', p.business);
    put('P7_Line4_PreparerDaytimePhoneNumber[0]', digits(p.phone).slice(-10));
    put('P7_Line5_FaxPhoneNumber[0]', digits(p.mobile).slice(-10));
    put('P7_Line6_EmailAddress[0]', p.email);
  }

  return { text, check, checkValue, select, notes: notes.filter((n) => !n.text.endsWith(': ')) };
}

const NOTE_SIZE = 8;
const NOTE_BOXES = [3, 4, 5, 6];

/** Fills the official I-539 PDF with the answers and returns the new file's bytes. */
export async function fillI539(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const index = fieldIndex(form);
  const plan = planI539(a);
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

  // Part 8: each explanation fills as many boxes as it needs, in order. Long text is broken into
  // lines here: pdf-lib's own wrapping is very slow on long text.
  const box = (n: number) => textField(`P8_Line${n}_D_AdditionalInfo[0]`);
  const { width, height } = box(3).acroField.getWidgets()[0].getRectangle();
  const perBox = Math.floor((height - 4) / (NOTE_SIZE * 1.2));
  const chunks: { page: string; part: string; item: string; lines: string[] }[] = [];
  for (const n of plan.notes) {
    const lines = wrap(toFormText(n.text), font, NOTE_SIZE, width - 8);
    for (let i = 0; i < lines.length; i += perBox) chunks.push({ ...n, lines: lines.slice(i, i + perBox) });
  }
  if (chunks.length > NOTE_BOXES.length) {
    // More than the page holds: the person attaches a continuation sheet.
    const last = chunks[NOTE_BOXES.length - 1];
    last.lines = [...last.lines.slice(0, perBox - 1), '(Continued on attached sheet.)'];
  }
  chunks.slice(0, NOTE_BOXES.length).forEach((c, i) => {
    const line = `P8_Line${NOTE_BOXES[i]}`;
    setFieldText(textField(`${line}_A_PageNumber[0]`), c.page, 9);
    setFieldText(textField(`${line}_B_PartNumber[0]`), c.part, 9);
    setFieldText(textField(`${line}_C_ItemNumber[0]`), c.item, 9);
    const f = box(NOTE_BOXES[i]);
    f.enableMultiline();
    setFieldText(f, c.lines.join('\n'), NOTE_SIZE);
  });

  doc.setTitle('Form I-539, Application to Extend/Change Nonimmigrant Status');
  return doc.save();
}
