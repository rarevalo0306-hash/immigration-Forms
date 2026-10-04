import { PDFCheckBox, PDFDocument, PDFDropdown, type PDFField, type PDFFont, PDFTextField, StandardFonts, rgb } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { FACTORS, HOW_LEFT } from '../forms/i212';
import { parseUnit } from '../engine/validation';
import { assistance, usedInterpreter, usedPreparer } from '../forms/assistance';
import { fieldsBySegment, optionBoxes, selectOption, setFieldText, toFormText, wrap } from './common';

// Fields of USCIS Form I-212, edition 01/20/25 (public/forms/i-212.pdf), named by the last segment
// of their full name. Mapped by position:
// - Many names carry another part's or item's number: Part 1, Item 11 (date of birth) is
//   "p2Line14DateOfBirth", Items 8-20 are "p1Line11"-"p1Line23" (SSN "p1Line11SSN", sex
//   "p1Line13Gender", Item 16 "p1Line19aDOSNumber", Item 19 "p1Line22YesNo"); Part 2, Item 13 is
//   "p2Line3ReEnterDate"; Part 6 (applicant contact) is "p7Line*", Part 7 (interpreter) "p8Line*" and
//   "p8InterpreterLanguage", and Part 8 (preparer) "p9Line*". Parts 7 and 8 have no address or
//   statement boxes, and their phone boxes hold 10 digits (a longer foreign number goes to Part 9).
// - Part 9's name and A-Number reuse Part 1's segment names ("p1Line2FamilyName[0]",
//   "p1Line1AlienNumber[0]") on another page: the filler fills every field sharing a name.
// - Part 9's entries 3-7 are "p10Line3"-"p10Line7".
// - Part 3, Item 2 ("Explain why you would like to reenter") is a single line; the statement
//   moves to Part 9 when it doesn't fit, and Part 9 continues on an added sheet when it is full.
// - Box order differs from the printed order (Race: Asian before White; Sex: Female before Male),
//   so every group is checked by export value.

export interface I212Note {
  page: string;
  part: string;
  item: string;
  text: string;
}

export interface I212Plan {
  text: Record<string, string>;
  check: string[];
  checkValue: [string, string][];
  select: Record<string, string>;
  /** The Part 3, Item 2 statement; the filler moves it to Part 9 when it doesn't fit. */
  statement: string;
  /** Part 9 entries, in order. */
  notes: I212Note[];
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');
const receipt = (s: string) => s.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

const chain = (a: Answers, id: string, max: number, first: boolean) => {
  if (!first) return 0;
  let n = 1;
  while (n < max && a[`${id}.more${n}`] === 'yes') n++;
  return n;
};

const fullName = (a: Answers, p: string) => [str(a, `${p}.given`), str(a, `${p}.middle`), str(a, `${p}.family`)].filter(Boolean).join(' ');

export function planI212(a: Answers): I212Plan {
  const text: Record<string, string> = {};
  const check: string[] = [];
  const checkValue: [string, string][] = [];
  const select: Record<string, string> = {};
  const notes: I212Note[] = [];
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
  const name = (prefix: string, line: string) => {
    put(`${line}FamilyName[0]`, str(a, `${prefix}.family`));
    put(`${line}GivenName[0]`, str(a, `${prefix}.given`));
    put(`${line}MiddleName[0]`, str(a, `${prefix}.middle`));
  };
  const address = (prefix: string, line: string) => {
    put(`${line}StreetNumName[0]`, str(a, `${prefix}.street`));
    const u = parseUnit(str(a, `${prefix}.unit`));
    if (u) {
      checkValue.push([`${line}Unit`, u.kind]);
      put(`${line}AptSteFlrNumber[0]`, u.number);
    }
    put(`${line}CityOrTown[0]`, str(a, `${prefix}.city`));
    state(`${line}State[0]`, str(a, `${prefix}.state`));
    put(`${line}ZipCode[0]`, str(a, `${prefix}.zip`));
    put(`${line}Province[0]`, str(a, `${prefix}.province`));
    put(`${line}PostalCode[0]`, str(a, `${prefix}.postal`));
    put(`${line}Country[0]`, str(a, `${prefix}.country`));
  };

  // Part 1. The name and A-Number repeat at the top of Part 9 under the same field names.
  const aNumber = digits(str(a, 'aNumber'));
  if (aNumber) put('p1Line1AlienNumber[0]', aNumber.padStart(9, '0'));
  name('name', 'p1Line2');
  const others = chain(a, 'otherName', 2, a['otherName.more0'] === 'yes');
  for (let i = 1; i <= others; i++) name(`otherName${i}`, `p1Line${i + 2}`);
  put('p1Line5InCareofName[0]', str(a, 'mailing.careOf'));
  address('mailing', 'p1Line5');
  yn('p1Line6YesNo', a.mailingSame);
  if (a.mailingSame === 'no') address('home', 'p1Line7');
  put('p1Line11SSN[0]', digits(str(a, 'ssn')));
  put('p1Line12USCISNumber[0]', digits(str(a, 'uscisAccount')));
  if (a.sex === 'male') checkValue.push(['p1Line13Gender', 'M']);
  if (a.sex === 'female') checkValue.push(['p1Line13Gender', 'F']);
  put('p2Line14DateOfBirth[0]', str(a, 'dob'));
  put('p1Line15CityTownofBirth[0]', str(a, 'birthCity'));
  put('p1Line16StateProvofBirth[0]', str(a, 'birthProvince'));
  put('p1Line17CountryofBirth[0]', str(a, 'birthCountry'));
  put('p1Line18Citizenship[0]', str(a, 'citizenship'));

  // Items 16-20: the case this request goes with.
  if (a.processing === 'visa') {
    put('p1Line19aDOSNumber[0]', str(a, 'consular.case').replace(/\s/g, '').toUpperCase());
    put('p1Line20City[0]', str(a, 'consulate.city'));
    put('p1Line20Country[0]', str(a, 'consulate.country'));
  }
  if (a.processing === 'adjust') {
    put('p1Line21USCISReceipt[0]', receipt(str(a, 'adjust.receipt')));
    put('p1Line21FileLocation[0]', str(a, 'adjust.office'));
    put('p1Line21DateFiled[0]', str(a, 'adjust.date'));
  }
  yn('p1Line22YesNo', a.i601);
  if (a.i601 === 'no' && a.prevI601 === 'yes') {
    put('p1Line23601Receipt[0]', receipt(str(a, 'prevI601.receipt')));
    put('p1Line23FileLocation[0]', str(a, 'prevI601.office'));
    put('p1Line23DateFiled[0]', str(a, 'prevI601.date'));
  }

  // Part 2.
  const felony = a.felony === 'yes' && (a.arriving === 'yes' || a.deportable === 'yes');
  yn('p2Line1YesNo', a.arriving);
  if (a.arriving === 'yes') {
    if (a['arriving.count'] === 'once') checkValue.push(['p2Line1CheckBox', '1b']);
    if (a['arriving.count'] === 'more') checkValue.push(['p2Line1CheckBox', '1c']);
    if (felony) checkValue.push(['p2Line1CheckBox', '1d']);
    put('p2Line2DateRemoved[0]', str(a, 'arriving.date'));
    put('p2Line3City[0]', str(a, 'arriving.city'));
    state('p2Line4State[0]', str(a, 'arriving.state'));
  }
  yn('p2Line5YesNo', a.deportable);
  if (a.deportable === 'yes') {
    if (a['deportable.count'] === 'once') checkValue.push(['p2Line5CheckBox', '5b']);
    if (a['deportable.count'] === 'more') checkValue.push(['p2Line5CheckBox', '5c']);
    if (felony) checkValue.push(['p2Line5CheckBox', '5d']);
    put('p2Line6Date[0]', str(a, 'deportable.date'));
    put('p2Line7City[0]', str(a, 'deportable.city'));
    state('p2Line7State[0]', str(a, 'deportable.state'));
  }
  if (felony) {
    const items = [a.arriving === 'yes' ? '1.d' : '', a.deportable === 'yes' ? '5.d' : ''].filter(Boolean);
    notes.push({ page: '3', part: '2', item: items.length === 2 ? '1d, 5d' : items[0], text: `Aggravated felony convictions: ${str(a, 'felony.explain')}` });
  }
  yn('p2Line8YesNo', a.unlawfulPresence);
  if (a.unlawfulPresence === 'yes') {
    put('p2Line9From[0]', str(a, 'presence.from'));
    put('p2Line9To[0]', str(a, 'presence.to'));
    put('p2Line10DateDeparted[0]', str(a, 'presence.departed'));
    put('p2Line11City[0]', str(a, 'presence.departure.city'));
    state('p2Line11State[0]', str(a, 'presence.departure.state'));
    put('p2Line12City[0]', str(a, 'presence.reentry.city'));
    state('p2Line12State[0]', str(a, 'presence.reentry.state'));
    put('p2Line3ReEnterDate[0]', str(a, 'presence.reentryDate'));
    if (str(a, 'presence.other')) notes.push({ page: '3', part: '2', item: '9', text: `Other periods of unlawful presence: ${str(a, 'presence.other')}` });
  }
  yn('p2Line14YesNo', a.reentry);
  if (a.reentry === 'yes') {
    put('p2Line15DateExcluded[0]', str(a, 'reentry.removedDate'));
    put('p2Line16City[0]', str(a, 'reentry.city'));
    state('p2Line16State[0]', str(a, 'reentry.state'));
    put('p2Line17DateEntered[0]', str(a, 'reentry.date'));
  }
  const several = a['arriving.count'] === 'more' || a['deportable.count'] === 'more' || a.reentry === 'yes';
  const removals = chain(a, 'removal', 5, several);
  if (removals) {
    const how = (v: string) => HOW_LEFT.find((h) => h.value === v)?.label.en ?? '';
    const list = [...Array(removals)].map((_, k) => {
      const p = `removal${k + 1}`;
      return `${k + 1}. ${[str(a, `${p}.date`), str(a, `${p}.place`), how(str(a, `${p}.how`))].filter(Boolean).join(' - ')}`;
    });
    const where = a.reentry === 'yes' ? { page: '4', item: '15' } : { page: '3', item: '2-7' };
    notes.push({ ...where, part: '2', text: `All dates I was excluded, deported, or removed, or departed with an outstanding order:\n${list.join('\n')}` });
  }

  // Part 3.
  const seeking = str(a, 'seeking');
  if (['P', 'V', 'S', 'O'].includes(seeking)) checkValue.push(['p3Line1CheckBox', seeking]);
  if (seeking === 'O') put('p3Line1OtherExplain[0]', str(a, 'seeking.other'));
  const relatives = chain(a, 'family', 4, a['family.more0'] === 'yes');
  if (relatives) {
    name('family1', 'p3Line3');
    put('p3Line3Relationship[0]', str(a, 'family1.relationship'));
    const status = str(a, 'family1.status');
    if (status === 'LPR' || status === 'CIT') checkValue.push(['p3Line4CheckBox', status]);
  }
  if (relatives > 1) {
    const list = [...Array(relatives - 1)].map((_, k) => {
      const p = `family${k + 2}`;
      const status = { CIT: 'U.S. citizen', LPR: 'lawful permanent resident' }[str(a, `${p}.status`)] ?? '';
      return `${fullName(a, p)} (${[str(a, `${p}.relationship`), status].filter(Boolean).join(', ')})`;
    });
    notes.push({ page: '4', part: '3', item: '3', text: `Other U.S. citizen or LPR family members: ${list.join('; ')}.` });
  }

  // Item 2: the favorable factors open the applicant's own statement.
  const factors = (Array.isArray(a.factors) ? a.factors : [])
    .map((v) => FACTORS.find((f) => f.value === v)?.label.en)
    .filter(Boolean);
  const statement = [factors.length ? `Favorable factors: ${factors.join('; ')}.` : '', str(a, 'reason.statement')].filter(Boolean).join('\n\n');

  // Part 4.
  if (a.ethnicity === 'hispanic') checkValue.push(['p4Line1Ethnicity', 'H']);
  if (a.ethnicity === 'notHispanic') checkValue.push(['p4Line1Ethnicity', 'N']);
  for (const r of Array.isArray(a.race) ? a.race : []) if (['WH', 'AS', 'BL', 'AI', 'HW'].includes(r)) checkValue.push(['p4Line2Race', r]);
  if (a.heightFeet) select['p4Line3HeightFeet[0]'] = str(a, 'heightFeet');
  if (a.heightInches) select['p4Line3HeightInches[0]'] = str(a, 'heightInches');
  const weight = digits(str(a, 'weight'));
  if (weight) {
    const w = weight.padStart(3, '0').slice(-3);
    [1, 2, 3].forEach((i) => put(`p4Line4HeightInches${i}[0]`, w[i - 1]));
  }
  // The I-485 codes the app uses are this form's own export values.
  if (str(a, 'eyes')) checkValue.push(['p4Line5Eyecolor', str(a, 'eyes')]);
  if (str(a, 'hair')) checkValue.push(['p4Line6Haircolor', str(a, 'hair')]);

  // Part 6. The signature and its date stay empty: they are written by hand.
  put('p7Line3DayPhone[0]', digits(str(a, 'phone')));
  put('p7Line4MobilePhone[0]', digits(str(a, 'mobile')));
  put('p7Line5Email[0]', str(a, 'email'));

  // Parts 7 and 8 (page 8). Signatures and dates stay empty.
  const helperPhones = (part: string, who: string, [day, mobile]: string[], h: { phone: string; mobile: string }) => {
    const long: string[] = [];
    for (const [field, raw, label] of [[day, h.phone, 'daytime'], [mobile, h.mobile, 'mobile']]) {
      const n = digits(raw).replace(/^1(?=\d{10}$)/, '');
      if (n.length <= 10) put(field, n);
      else long.push(`${label} ${raw}`);
    }
    if (long.length) notes.push({ page: '8', part, item: '3-4', text: `${who} telephone: ${long.join('; ')}` });
  };
  const help = assistance(a, { interpreter: usedInterpreter(a), preparer: usedPreparer(a) });
  if (help.interpreter) {
    const h = help.interpreter;
    put('p8Line1FamilyName[0]', h.family);
    put('p8Line1GivenName[0]', h.given);
    put('p8Line2BusinessorOrg[0]', h.business);
    helperPhones('7', "Interpreter's", ['p8Line4DayPhone[0]', 'p8Line5MobilePhone[0]'], h);
    put('p8Line6Email[0]', h.email);
    put('p8InterpreterLanguage[0]', h.language);
  }
  if (help.preparer) {
    const h = help.preparer;
    put('p9Line1FamilyName[0]', h.family);
    put('p9Line1GivenName[0]', h.given);
    put('p9Line2BusinessorOrg[0]', h.business);
    helperPhones('8', "Preparer's", ['p9Line4DayPhone[0]', 'p9Line5MobilePhone[0]'], h);
    put('p9Line6Email[0]', h.email);
  }

  return { text, check, checkValue, select, statement, notes: notes.filter((n) => n.text) };
}

const ITEM2 = 'p3Line2Explain[0]';
const NOTE_SIZE = 8;
const LINE = 1.2;

/** Draws the Part 9 entries that didn't fit in its boxes on added pages. */
function continuationPages(doc: PDFDocument, font: PDFFont, bold: PDFFont, header: string, chunks: (I212Note & { lines: string[] })[]) {
  const size = 9;
  const [width, height, margin] = [612, 792, 54];
  let page = doc.addPage([width, height]);
  let y = height - margin;
  const line = (s: string, f = font) => {
    if (y < margin) {
      page = doc.addPage([width, height]);
      y = height - margin;
    }
    page.drawText(s, { x: margin, y, size, font: f, color: rgb(0, 0, 0) });
    y -= size * 1.4;
  };
  line('Form I-212, Part 9. Additional Information (continued)', bold);
  line(header);
  y -= size;
  for (const c of chunks) {
    line(`Page Number ${c.page}   Part Number ${c.part}   Item Number ${c.item}`, bold);
    for (const l of c.lines) line(l);
    y -= size;
  }
  y -= size;
  line('Signature: ______________________________     Date (mm/dd/yyyy): ______________');
}

/** Fills the official I-212 PDF with the answers and returns the new file's bytes. */
export async function fillI212(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const fields = form.getFields();
  const index = fieldsBySegment(fields);
  const plan = planI212(a);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const all = (name: string): PDFField[] => {
    const f = index.get(name);
    if (!f) throw new Error(`No such field: ${name}`);
    return f;
  };
  const textFields = (name: string) =>
    all(name).map((f) => {
      if (!(f instanceof PDFTextField)) throw new Error(`Not a text field: ${name}`);
      return f;
    });
  const single = new Map([...index].map(([k, v]) => [k, v[0]]));

  for (const f of fields) if (f instanceof PDFTextField && f.isRichFormatted()) f.disableRichFormatting();

  for (const [name, raw] of Object.entries(plan.text)) for (const f of textFields(name)) setFieldText(f, raw, 9);
  for (const name of plan.check)
    for (const f of all(name)) {
      if (!(f instanceof PDFCheckBox)) throw new Error(`Not a checkbox: ${name}`);
      f.check();
    }
  for (const [base, value] of plan.checkValue) {
    const match = optionBoxes(single, base).find((o) => o.value === value);
    if (!match) throw new Error(`No "${value}" box in ${base}`);
    match.box.check();
  }
  for (const [name, value] of Object.entries(plan.select))
    for (const f of all(name)) {
      if (!(f instanceof PDFDropdown)) throw new Error(`Not a dropdown: ${name}`);
      selectOption(f, value);
    }

  // Part 3, Item 2 is one line: the statement stays there only when it fits. It goes after the
  // short entries, so they stay on the form and only the statement continues on added pages.
  const notes = [...plan.notes];
  if (plan.statement) {
    const [box] = textFields(ITEM2);
    const s = toFormText(plan.statement);
    const fits = !s.includes('\n') && font.widthOfTextAtSize(s, 9) <= box.acroField.getWidgets()[0].getRectangle().width - 6;
    if (fits) setFieldText(box, s, 9);
    else {
      setFieldText(box, 'See Part 9. Additional Information.', 9);
      notes.push({ page: '4', part: '3', item: '2', text: plan.statement });
    }
  }

  // Part 9: long entries are broken into lines here (pdf-lib's own wrapping is very slow) and
  // split across boxes; whatever doesn't fit in the five boxes goes on added pages.
  const [sample] = textFields('p10Line3AdditionalInfo[0]');
  const rect = sample.acroField.getWidgets()[0].getRectangle();
  const perBox = Math.floor((rect.height - 4) / (NOTE_SIZE * LINE));
  const chunks: (I212Note & { lines: string[] })[] = [];
  for (const n of notes) {
    const lines = wrap(toFormText(n.text), font, NOTE_SIZE, rect.width - 8);
    // Each box after the first one of an entry opens with "(continued)".
    for (let i = 0; i < lines.length; ) {
      const take = i ? perBox - 1 : perBox;
      chunks.push({ ...n, lines: i ? ['(continued)', ...lines.slice(i, i + take)] : lines.slice(i, i + take) });
      i += take;
    }
  }
  chunks.slice(0, 5).forEach((c, i) => {
    const line = `p10Line${i + 3}`;
    setFieldText(textFields(`${line}PageNumber[0]`)[0], c.page, 9);
    setFieldText(textFields(`${line}PartNumber[0]`)[0], c.part, 9);
    setFieldText(textFields(`${line}ItemNumber[0]`)[0], c.item, 9);
    const [box] = textFields(`${line}AdditionalInfo[0]`);
    box.enableMultiline();
    setFieldText(box, c.lines.join('\n'), NOTE_SIZE);
  });
  if (chunks.length > 5) {
        const who = [str(a, 'name.family'), str(a, 'name.given'), str(a, 'name.middle')].filter(Boolean).join(', ');
    const aNumber = digits(str(a, 'aNumber'));
    continuationPages(doc, font, bold, toFormText(`Name: ${who}${aNumber ? `     A-Number: A-${aNumber.padStart(9, '0')}` : ''}`), chunks.slice(5));
  }

  doc.setTitle('Form I-212, Application for Permission to Reapply for Admission into the United States After Deportation or Removal');
  return doc.save();
}
