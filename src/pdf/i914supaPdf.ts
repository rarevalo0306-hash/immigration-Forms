import { PDFCheckBox, PDFDocument, PDFDropdown, type PDFField, PDFTextField, StandardFonts } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { CRIME_ITEMS, PROCESSING_ITEMS } from '../forms/i914supa';
import { assistance, type HelperPerson, usedInterpreter, usedPreparer } from '../forms/assistance';
import { parseUnit } from '../engine/validation';
import { fieldIndex, optionBoxes, selectOption, setFieldText, toFormText, wrap } from './common';
import { statusOption } from './i914Pdf';

// Fields of USCIS Form I-914, Supplement A, edition 01/20/25 (public/forms/i-914supa.pdf), named by
// the last segment of their full name (all unique). Mapped by position:
// - Part 4's Yes/No boxes are "pELine<n><x>YesNo" with [0] = Yes and [1] = No; from Item 18 the
//   names run one number ahead ("pELine19YesNo" is Item 18 … "pELine22a-c" are Items 21.A-C), and
//   Item 3.A's Yes box exports "Y1". Part 3, Item 19 is "Q1_*", Item 23 "Q23_*", Item 25 "Q25[0/1]".
// - Part 3 carries Part 2/Part 4 names: Item 10.B (date the prior marriage ended) is
//   "Line16_ExpDate[0]" while Item 17 (passport expiration) is "Line16_ExpDate[1]"; Item 10.C's
//   state/province is "P2_Line11_StateProvince[1]" and Item 12's "[0]"; Item 22.C (date authorized
//   stay expired) is "Line22_IssuedDate", Item 22.D (status) the dropdown "Line22_CurrentNon" and
//   Item 24's dates are "Pt4Line24_IssuedDate<A-E>".
// - Checkbox groups are out of printed order but export the printed value (Part 1 "H/C/P/S" and
//   "A/C/CP/CU", Part 2 Item 4 "C/P/A", marital "S/M/D/W/A", Apt./Ste./Flr. "APT/STE/FLR"), so they
//   are picked by export value. The interpreter's unit boxes are "pGLine3AptSteFlr", not "*Unit".
// - Part 5, Item 6's "Applicant's Phone Number" and "Safe Phone Number" repeat Items 3-4's names
//   ("pFLine3DayPhone[1]", "pFLine4MobilePhone[1]"). Part 8's name boxes are "P3Line1_*" and its
//   A-Number "ANum[1]" ("ANum[0]" is the family member's, Part 3, Item 5).

export interface I914SupANote {
  page: string;
  part: string;
  item: string;
  text: string;
}

export interface I914SupAPlan {
  text: Record<string, string>;
  check: string[];
  /** [checkbox group base, export value] */
  checkValue: [string, string][];
  select: Record<string, string>;
  /** Part 8 entries, in order; the filler splits long ones over several blocks. */
  notes: I914SupANote[];
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');
const phone = (s: string) => digits(s).replace(/^1(?=\d{10}$)/, '');

const chain = (a: Answers, id: string, max: number, first: boolean) => {
  if (!first) return 0;
  let n = 1;
  while (n < max && a[`${id}.more${n}`] === 'yes') n++;
  return n;
};

/** Part 4 item ("fam.p4.10a", "fam.p4.4b3") → the PDF's checkbox base ("pELine10aYesNo"). */
export function processingBase(id: string): string {
  const item = id.slice('fam.p4.'.length);
  const n = Number(/^\d+/.exec(item)![0]);
  return `pELine${n <= 17 ? n : n + 1}${item.slice(String(n).length)}YesNo`;
}

/** The printed item ("10.A", "4.B.(3)"). */
const printed = (id: string) => {
  const m = /^(\d+)([a-z]?)(\d?)$/.exec(id.slice('fam.p4.'.length))!;
  return `${m[1]}${m[2] ? `.${m[2].toUpperCase()}` : ''}${m[3] ? `.(${m[3]})` : ''}`;
};

/** The page each Part 4 item is printed on. */
export function processingPage(id: string): string {
  const n = Number(/^\d+/.exec(id.slice('fam.p4.'.length))![0]);
  if (n <= 2) return '5';
  if (n <= 7) return '6';
  if (n <= 16) return '7';
  return '8';
}

/** Part 1's export values. */
const ITEM1: Record<string, string> = { spouse: 'H', child: 'C', parent: 'P', sibling: 'S' };
const ITEM2: Record<string, string> = { spouseChild: 'A', grandchild: 'C', adultSibling: 'CP', nieceNephew: 'CU' };
const I914_STATUS: Record<string, string> = { together: 'C', pending: 'P', approved: 'A' };
const COURT: Record<string, string> = { removal: 'A', exclusion: 'B', deportation: 'C', rescission: 'D' };

export function planI914SupA(a: Answers): I914SupAPlan {
  const text: Record<string, string> = {};
  const check: string[] = [];
  const checkValue: [string, string][] = [];
  const select: Record<string, string> = {};
  const notes: I914SupANote[] = [];
  const put = (field: string, value: string) => {
    if (value) text[field] = value;
  };
  const yn = (yes: string, no: string, value: unknown) => {
    if (value === 'yes') check.push(yes);
    if (value === 'no') check.push(no);
  };
  const state = (field: string, value: string) => {
    if (value) select[field] = value.toUpperCase();
  };
  const name = (prefix: string, [family, given, middle]: string[]) => {
    put(family, str(a, `${prefix}.family`));
    put(given, str(a, `${prefix}.given`));
    put(middle, str(a, `${prefix}.middle`));
  };
  const unit = (raw: string, group: string, number: string) => {
    const u = parseUnit(raw);
    if (!u) return;
    checkValue.push([group, u.kind]);
    put(number, u.number);
  };

  // Part 1.
  const relation = str(a, 'fam.relation');
  if (ITEM1[relation]) checkValue.push(['pAFamilyMember', ITEM1[relation]]);
  if (ITEM2[relation]) checkValue.push(['pBFamilyMember', ITEM2[relation]]);

  // Part 2: you, the principal. The name and A-Number repeat at the top of Part 8.
  name('name', ['P2Line1_FamilyName[0]', 'P2Line1_GivenName[0]', 'P2Line1_MiddleName[0]']);
  name('name', ['P3Line1_FamilyName[0]', 'P3Line1_GivenName[0]', 'P3Line1_MiddleName[0]']);
  put('P2Line2_DateOfBirth[0]', str(a, 'dob'));
  const aNumber = digits(str(a, 'aNumber'));
  if (aNumber) {
    put('P2Line3_ANum[0]', aNumber.padStart(9, '0'));
    put('ANum[1]', aNumber.padStart(9, '0'));
  }
  if (I914_STATUS[str(a, 'i914Status')]) checkValue.push(['P2Line4_I914Status', I914_STATUS[str(a, 'i914Status')]]);

  // Part 3: the family member.
  name('fam.name', ['FamilyName[0]', 'GivenName[0]', 'MiddleName[0]']);
  const otherNames = chain(a, 'fam.otherName', 3, a['fam.otherName.more0'] === 'yes');
  if (otherNames >= 1) name('fam.otherName1', ['P4_Line1_FamilyName[0]', 'Line1_GivenName[0]', 'Line1_MiddleName[0]']);
  if (otherNames >= 2) name('fam.otherName2', ['P4_Line2_FamilyName[0]', 'Line2_GivenName[0]', 'Line2_MiddleName[0]']);
  if (otherNames === 3) {
    const n3 = [str(a, 'fam.otherName3.given'), str(a, 'fam.otherName3.middle'), str(a, 'fam.otherName3.family')].filter(Boolean).join(' ');
    notes.push({ page: '2', part: '3', item: '2', text: `Other name used: ${n3}` });
  }

  if (a['fam.inUS'] === 'yes' || a['fam.hasIntended'] === 'yes') {
    put('P1Line3_StreetNumberName[0]', str(a, 'fam.home.street'));
    unit(str(a, 'fam.home.unit'), 'P1Line3_Unit', 'P1Line3_AptSteFlrNumber[0]');
    put('Pt1Line3_CityTown[0]', str(a, 'fam.home.city'));
    state('P1Line3_State[0]', str(a, 'fam.home.state'));
    put('P1Line3_ZipCode[0]', str(a, 'fam.home.zip'));
  }
  if (a['fam.mailingSafe'] === 'yes') {
    put('InCareOf[0]', str(a, 'fam.mailing.careOf'));
    put('P4Line4_StreetNumberName[0]', str(a, 'fam.mailing.street'));
    unit(str(a, 'fam.mailing.unit'), 'P4Line4_Unit', 'P4Line4_AptSteFlrNumber[0]');
    put('Pt4Line4_CityTown[0]', str(a, 'fam.mailing.city'));
    state('P4Line4_State[0]', str(a, 'fam.mailing.state'));
    put('P4Line4_ZipCode[0]', str(a, 'fam.mailing.zip'));
  }

  const famA = digits(str(a, 'fam.aNumber'));
  if (famA) put('ANum[0]', famA.padStart(9, '0'));
  put('P4_Line6_USCISELISAcctNumber[0]', digits(str(a, 'fam.uscisAccount')));
  put('P4_Line7_SSN[0]', digits(str(a, 'fam.ssn')));
  if (a['fam.sex'] === 'male') checkValue.push(['P4_Line8_Sex', 'M']);
  if (a['fam.sex'] === 'female') checkValue.push(['P4_Line8_Sex', 'F']);
  const marital = { Single: 'S', Married: 'M', Divorced: 'D', Widowed: 'W', Annulled: 'A' }[str(a, 'fam.marital')];
  if (marital) checkValue.push(['P4_Line9_MaritalStatus', marital]);

  const prior = ['Divorced', 'Widowed', 'Annulled'].includes(str(a, 'fam.marital')) || (a['fam.marital'] === 'Married' && a['fam.priorMarried'] === 'yes');
  if (prior) {
    name('fam.prior', ['P4_Line1_FamilyName[1]', 'Line1_GivenName[1]', 'Line1_MiddleName[1]']);
    put('Line16_ExpDate[0]', str(a, 'fam.prior.ended'));
    put('Line11_CityTown[0]', str(a, 'fam.prior.city'));
    put('P2_Line11_StateProvince[1]', str(a, 'fam.prior.province'));
    put('P2_Line11_Country[0]', str(a, 'fam.prior.country'));
    if (['A', 'D', 'S', 'W'].includes(str(a, 'fam.prior.how'))) checkValue.push(['P4_Line10D_MaririageEnded', str(a, 'fam.prior.how')]);
    if (str(a, 'fam.prior.others')) notes.push({ page: '2', part: '3', item: '10', text: `Other prior marriages: ${str(a, 'fam.prior.others')}` });
  }

  put('P3_Line2_DateOfBirth[0]', str(a, 'fam.dob'));
  put('Line11_CityTown[1]', str(a, 'fam.birthCity'));
  put('P2_Line11_StateProvince[0]', str(a, 'fam.birthProvince'));
  put('P2_Line11_Country[1]', str(a, 'fam.birthCountry'));
  put('Part2Line12_CountryOfCitizenship[0]', str(a, 'fam.citizenship'));
  put('Part2Line13_PassportorTravDoc[0]', str(a, 'fam.passport'));
  put('Line_CountryOfIssuance[0]', str(a, 'fam.passportCountry'));
  put('Line15_IssuedDate[0]', str(a, 'fam.passportIssued'));
  put('Line16_ExpDate[1]', str(a, 'fam.passportExpires'));
  if (str(a, 'fam.currentStatus')) select['Line20_CurrentNon[0]'] = statusOption(str(a, 'fam.currentStatus'));

  yn('Q1_yes[0]', 'Q1_no[0]', a['fam.inUS']);
  if (a['fam.inUS'] === 'yes') {
    put('Line20A_CityTown[0]', str(a, 'fam.lastEntry.city'));
    state('P4_Line20A_State[0]', str(a, 'fam.lastEntry.state'));
    put('Line20B_DateofLastEntry[0]', str(a, 'fam.lastEntry.date'));
    put('Line20C_ArrivalDeparture[0]', str(a, 'fam.i94').replace(/[\s-]/g, '').toUpperCase());
  }
  if (a['fam.inUS'] === 'no') {
    if (['CON', 'PFI', 'POE'].includes(str(a, 'fam.office'))) checkValue.push(['Pt4Line21A_Checkbox', str(a, 'fam.office')]);
    put('Line21B_CityorTown[0]', str(a, 'fam.office.city'));
    put('Part4_21c_State_or_ForeignCountry[0]', str(a, 'fam.office.place'));
    put('Pt3Line21D_StreetNumberName[0]', str(a, 'fam.abroad.street'));
    unit(str(a, 'fam.abroad.unit'), 'Pt3Line21D_Unit', 'Pt3Line21D_AptSteFlrNumber[0]');
    put('Pt3Line21D_CityTown[0]', str(a, 'fam.abroad.city'));
    state('Pt3Line21D_State[0]', str(a, 'fam.abroad.state'));
    put('Pt3Line21D_ZipCode[0]', str(a, 'fam.abroad.zip'));
    put('Pt3Line21D_Province[0]', str(a, 'fam.abroad.province'));
    put('Pt3Line21D_PostalCode[0]', str(a, 'fam.abroad.postal'));
    put('Pt3Line21D_Country[0]', str(a, 'fam.abroad.country'));
  }

  if (a['fam.traveled'] === 'yes') {
    put('Line22A_CityTown[0]', str(a, 'fam.prevEntry.city'));
    state('P4_Line22A_State[0]', str(a, 'fam.prevEntry.state'));
    put('Line22B_DateofLastEntry[0]', str(a, 'fam.prevEntry.date'));
    put('Line22_IssuedDate[0]', str(a, 'fam.prevEntry.stayExpired'));
    if (str(a, 'fam.prevEntry.status')) select['Line22_CurrentNon[0]'] = statusOption(str(a, 'fam.prevEntry.status'));
  }

  yn('Q23_yes[0]', 'Q23_no[0]', a['fam.court']);
  if (a['fam.court'] === 'yes') {
    const types = ([] as string[]).concat(a['fam.courtTypes'] ?? []);
    for (const [type, letter] of Object.entries(COURT)) {
      const when = str(a, `fam.court.${type}`);
      if (types.includes(type) || when) check.push(`Pt4Line24${letter}_checkbox${letter}[0]`);
      put(`Pt4Line24_IssuedDate${letter}[0]`, when);
    }
    const next = str(a, 'fam.court.nextHearing');
    if (next) {
      check.push('Pt4Line24E_checkboxE[0]');
      put('Pt4Line24_IssuedDateE[0]', next);
    }
  }
  yn('Q25[0]', 'Q25[1]', a['fam.ead']);

  // Part 4.
  for (const item of PROCESSING_ITEMS) yn(`${processingBase(item.id)}[0]`, `${processingBase(item.id)}[1]`, a[item.id]);
  const arrests = chain(a, 'fam.arrest', 5, CRIME_ITEMS.some((i) => a[i.id] === 'yes'));
  for (let i = 1; i <= arrests; i++) {
    put(`pEWhyCharged${i}[0]`, str(a, `fam.arrest${i}.why`));
    put(`pEArrestDate${i}[0]`, str(a, `fam.arrest${i}.date`));
    put(`pEWhereCharged${i}[0]`, str(a, `fam.arrest${i}.where`));
    put(`pEOutcome${i}[0]`, str(a, `fam.arrest${i}.outcome`));
  }
  const yes = PROCESSING_ITEMS.filter((i) => a[i.id] === 'yes');
  if (yes.length && str(a, 'fam.processing.explain')) {
    const items = yes.map((i) => printed(i.id));
    notes.push({ page: processingPage(yes[0].id), part: '4', item: items[0], text: `Part 4, Item${items.length > 1 ? 's' : ''} ${items.join(', ')}: ${str(a, 'fam.processing.explain')}` });
  }

  // Part 5. The signatures (Items 6 and 7) and their dates stay empty: they are written by hand.
  if (a.readsEnglish === 'A' || a.readsEnglish === 'B') checkValue.push(['pFLine1Interpreter', str(a, 'readsEnglish')]);
  if (a.readsEnglish === 'B') put('pFLine1Language[0]', str(a, 'fluentLanguage'));
  if (a.preparer === 'yes') {
    check.push('pFLine2Preparer[0]');
    put('pFLine2PreparerName[0]', str(a, 'preparer.name'));
  }
  for (const i of [0, 1]) put(`pFLine3DayPhone[${i}]`, phone(str(a, 'phone')));
  put('pFLine4MobilePhone[0]', phone(str(a, 'mobile')));
  put('pFLine4MobilePhone[1]', phone(str(a, 'safePhone')));
  put('pFLine5Email[0]', str(a, 'email'));

  // Parts 6 and 7: the interpreter and the preparer. They sign and date by hand.
  const helper = (p: HelperPerson, f: { family: string; given: string; business: string; line: string; unit: string; city: string; phone: string; mobile: string; email: string }) => {
    put(f.family, p.family);
    put(f.given, p.given);
    put(f.business, p.business);
    put(`${f.line}StreetNumberName[0]`, p.street);
    unit(p.unit, f.unit, `${f.line}AptSteFlrNumber[0]`);
    put(f.city, p.city);
    state(`${f.line}State[0]`, p.state);
    put(`${f.line}ZipCode[0]`, p.zip);
    put(`${f.line}Province[0]`, p.province);
    put(`${f.line}PostalCode[0]`, p.postal);
    put(`${f.line}Country[0]`, p.country);
    put(f.phone, phone(p.phone));
    put(f.mobile, phone(p.mobile));
    put(f.email, p.email);
  };
  const help = assistance(a, { interpreter: usedInterpreter(a), preparer: usedPreparer(a) });
  if (help.interpreter) {
    helper(help.interpreter, {
      family: 'pGLine1FamilyName[0]',
      given: 'pGLine1GivenName[0]',
      business: 'pGLine2OrgName[0]',
      line: 'pGLine3',
      unit: 'pGLine3AptSteFlr',
      city: 'pGLine3CityOrTown[0]',
      phone: 'pGLine4DayPhone[0]',
      mobile: 'pGLine5MobilePhone[0]',
      email: 'pGLine6Email[0]',
    });
    put('pGNameofLanguage[0]', help.interpreter.language);
  }
  if (help.preparer) {
    helper(help.preparer, {
      family: 'pHLine1FamilyName[0]',
      given: 'pHLine1GivenName[0]',
      business: 'pHLine2BusinessName[0]',
      line: 'pHLine3',
      unit: 'pHLine3Unit',
      city: 'pHLine3CityOrTown[0]',
      phone: 'pHLine4DayPhone[0]',
      mobile: 'pHLine5MobilePhone[0]',
      email: 'pHLine6Email[0]',
    });
    const st = help.preparer.statement;
    if (st === 'notAttorney') checkValue.push(['pHLine7PrepStatement', 'A']);
    if (st === 'attorneyExtends' || st === 'attorneyNotExtends') {
      checkValue.push(['pHLine7PrepStatement', 'B']);
      checkValue.push(['pHLine7Extend', st === 'attorneyExtends' ? 'Y' : 'N']);
    }
  }

  return { text, check, checkValue, select, notes: notes.filter((n) => n.text && !n.text.endsWith(': ')) };
}

/** Part 8's four blocks, printed as Items 3-6 (Item 5's item box is "P8_Line5_ItemNumber"). */
const BLOCKS = [3, 4, 5, 6].map((n) => ({
  page: `P8_Line${n}a_PageNumber[0]`,
  part: `P8_Line${n}b_PartNumber[0]`,
  item: n === 5 ? 'P8_Line5_ItemNumber[0]' : `P8_Line${n}c_ItemNumber[0]`,
  info: `P8_Line${n}d_AdditionalInfo[0]`,
}));

const NOTE_SIZE = 8;

/** Fills the official I-914 Supplement A PDF with the answers and returns the new file's bytes. */
export async function fillI914SupA(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const index = fieldIndex(form);
  const plan = planI914SupA(a);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const get = (name: string): PDFField => {
    const f = index.get(name);
    if (!f) throw new Error(`No such field: ${name}`);
    return f;
  };
  const textField = (name: string) => {
    const f = get(name);
    if (!(f instanceof PDFTextField)) throw new Error(`Not a text field: ${name}`);
    return f;
  };
  const width = (field: PDFTextField) => field.acroField.getWidgets()[0].getRectangle().width - 8;
  const height = (field: PDFTextField) => field.acroField.getWidgets()[0].getRectangle().height - 4;

  // Some text boxes are rich-text fields, which pdf-lib can't read back when it redraws the form;
  // store them as plain text instead.
  for (const f of form.getFields()) if (f instanceof PDFTextField && f.isRichFormatted()) f.disableRichFormatting();

  for (const [name, raw] of Object.entries(plan.text)) {
    const field = textField(name);
    if (field.isMultiline()) setFieldText(field, wrap(toFormText(raw), font, NOTE_SIZE, width(field)).join('\n'), NOTE_SIZE);
    else setFieldText(field, raw, 9);
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

  // Part 8: long notes are broken into lines and run on into the next block when they don't fit;
  // what is left after the fourth block goes on a separate sheet.
  const first = textField(BLOCKS[0].info);
  const perBlock = Math.max(1, Math.floor(height(first) / (NOTE_SIZE * 1.2)));
  const chunks: { note: I914SupANote; lines: string[] }[] = [];
  for (const note of plan.notes) {
    const lines = wrap(toFormText(note.text), font, NOTE_SIZE, width(first));
    for (let i = 0; i < lines.length; i += perBlock) chunks.push({ note, lines: lines.slice(i, i + perBlock) });
  }
  if (chunks.length > BLOCKS.length) {
    const last = chunks[BLOCKS.length - 1].lines;
    last[last.length - 1] = 'Continued on a separate sheet.';
  }
  chunks.slice(0, BLOCKS.length).forEach(({ note, lines }, i) => {
    const b = BLOCKS[i];
    setFieldText(textField(b.page), note.page, 9);
    setFieldText(textField(b.part), note.part, 9);
    setFieldText(textField(b.item), note.item, 9);
    const info = textField(b.info);
    info.enableMultiline();
    setFieldText(info, lines.join('\n'), NOTE_SIZE);
  });

  doc.setTitle('Form I-914, Supplement A, Application for Derivative T Nonimmigrant Status');
  return doc.save();
}
