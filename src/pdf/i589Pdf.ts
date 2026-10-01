import { PDFCheckBox, PDFDocument, PDFTextField, StandardFonts, type PDFFont } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { NARRATIVES } from '../forms/i589';
import { fieldIndex, optionBoxes, setFieldText, toFormText } from './common';

// Fields of USCIS Form I-589, edition 07/28/26 (public/forms/i-589.pdf), named by the last segment
// of their full name. Most names are generic ("TextField13[n]", "DateTimeField24[0]"), so they were
// mapped by position on the printed page:
// - Part A.I: Item 2 is "TextField1[0]", Item 3 "TextField1[8]", Item 7 "TextField1[1]", the
//   residence city "TextField1[2]", Items 13-17 "TextField1[4]", "[3]", "[5]", "[6]", "[7]".
// - Part A.II: the spouse's Items 2, 4, 8, 10-13 are "TextField10[n]". For the children, "I do not
//   have any children" exports "Y" and "I have children" exports "N"; child 1's sex boxes export
//   "1"/"2" and its date of last entry is "PtAIILine15_ExpirationDate".
// - Part A.III's tables are "TextField13[0]"-"[57]" plus a "DateTimeField" per date, listed in A3.
// - Part D: "No, my family did not help" exports "1" and "Yes" exports "2".
// - Supplement B (page 12) takes the explanations that don't fit in their box.

export interface I589Narrative {
  field: string;
  part: string;
  question: string;
  text: string;
}

export interface I589Plan {
  text: Record<string, string>;
  check: string[];
  checkValue: [string, string][];
  /** "If Yes, explain" answers; the filler moves any that don't fit to Supplement B. */
  narratives: I589Narrative[];
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');
const list = (a: Answers, id: string) => (Array.isArray(a[id]) ? (a[id] as string[]) : []);
const tf13 = (n: number) => `TextField13[${n}]`;
const dtf = (n: number) => `DateTimeField${n}[0]`;

/** Part A.III's rows, by position. */
export const A3 = {
  lastAddress: [0, 1].map((r) => ({ street: tf13(r), city: tf13(2 + r), province: tf13(4 + r), country: tf13(6 + r), from: dtf(r === 0 ? 21 : 22), to: dtf(r === 0 ? 20 : 23) })),
  home: [
    [8, 10, 12, 14, 24, 26],
    [9, 11, 13, 15, 25, 27],
    [16, 17, 18, 19, 28, 29],
    [20, 21, 22, 23, 30, 31],
    [24, 25, 26, 27, 32, 33],
  ].map(([s, c, p, k, f, t]) => ({ street: tf13(s), city: tf13(c), province: tf13(p), country: tf13(k), from: dtf(f), to: dtf(t) })),
  school: [
    [28, 30, 32, 41, 40],
    [29, 31, 33, 38, 39],
    [34, 35, 36, 37, 36],
    [37, 38, 39, 34, 35],
  ].map(([n, ty, l, f, t]) => ({ name: tf13(n), type: tf13(ty), location: tf13(l), from: dtf(f), to: dtf(t) })),
  job: [
    [40, 42, 42, 44],
    [41, 43, 43, 45],
    [44, 45, 46, 47],
  ].map(([e, o, f, t]) => ({ employer: tf13(e), occupation: tf13(o), from: dtf(f), to: dtf(t) })),
  relatives: (
    [
      ['mother', 46, 49, 'm'],
      ['father', 47, 50, 'f'],
      ['sibling1', 48, 51, 's1'],
      ['sibling2', 52, 53, 's2'],
      ['sibling3', 54, 55, 's3'],
      ['sibling4', 56, 57, 's4'],
    ] as const
  ).map(([id, n, b, box], i) => ({ id, name: tf13(n), birthPlace: tf13(b), deceased: `CheckBoxAIII5\\.${box}[0]`, location: `TextField35[${i}]` })),
};

/** Part A.II's child blocks; child 1 is named differently from children 2-4. */
const child = (i: number) => {
  const s = i === 1 ? '' : String(i);
  return {
    family: `ChildLast${i}[0]`,
    given: `ChildFirst${i}[0]`,
    middle: `ChildMiddle${i}[0]`,
    dob: `ChildDOB${i}[0]`,
    birthPlace: `ChildCity${i}[0]`,
    nationality: `ChildNat${i}[0]`,
    group: `ChildRace${i}[0]`,
    aNumber: `ChildAlien${i}[0]`,
    passport: `ChildPassport${i}[0]`,
    marital: `ChildMarital${i}[0]`,
    ssn: `ChildSSN${i}[0]`,
    sex: i === 1 ? 'CheckBox12_Sex' : `CheckBox${i}6_Sex`,
    sexValues: i === 1 ? { male: '1', female: '2' } : { male: 'M', female: 'F' },
    inUS: `CheckBox${i}7`,
    location: `PtAIILine13_Specify${s}[0]`,
    entryPlace: `PtAIILine14_PlaceofLastEntry${s}[0]`,
    entryDate: i === 1 ? 'PtAIILine15_ExpirationDate[0]' : `PtAIILine15_DateofLastEntry${s}[0]`,
    i94: `PtAIILine16_I94Number${s}[0]`,
    admittedStatus: `PtAIILine17_StatusofLastAdmission${s}[0]`,
    status: i === 1 ? 'PtAIILine18_CurrentStatusofChild[0]' : `PtAIILine18_ChildCurrentStatus${s}[0]`,
    statusExpires: `PtAIILine19_ExpDateofAuthorizedStay${s}[0]`,
    courtYes: `PtAIILine20_Yes${s}[0]`,
    courtNo: `PtAIILine20_No${s}[0]`,
    includeYes: `PtAIILine21_Yes${s}[0]`,
    includeNo: `PtAIILine21_No${s}[0]`,
  };
};

/** Answers for "is there another?" chains: how many rows were filled. */
const chain = (a: Answers, id: string, max: number, first: boolean) => {
  if (!first) return 0;
  let n = 1;
  while (n < max && a[`${id}.more${n}`] === 'yes') n++;
  return n;
};

/** A phone number split into the form's area code and number boxes. */
const phone = (raw: string): [string, string] => {
  const d = digits(raw).slice(-10);
  return d.length === 10 ? [d.slice(0, 3), `${d.slice(3, 6)}-${d.slice(6)}`] : ['', d];
};

/** The explanation boxes of Parts B and C. */
const BOXES: Record<string, string> = {
  b1a: 'TextField14[0]',
  b1b: 'TextField15[0]',
  b2: 'PBL2_TextField[0]',
  b3a: 'PBL3A_TextField[0]',
  b3b: 'PBL3B_TextField[0]',
  b4: 'PB4_TextField[0]',
  c1: 'PCL1_TextField[0]',
  c2: 'PCL2B_TextField[0]',
  c3: 'PCL3_TextField[0]',
  c4: 'PCL4_TextField[0]',
  c5: 'PCL5_TextField[0]',
  c6: 'PCL6_TextField[0]',
};

/** The Yes/No boxes of Parts B and C, which export "Y" and "N". */
const YES_NO: Record<string, string> = {
  b1a: 'ckboxyn1a',
  b1b: 'ckboxyn1b',
  b2: 'ckboxyn2',
  b3a: 'ckboxyn3a',
  b3b: 'ckboxyn3b',
  b4: 'ckboxyn4',
  c1: 'ckboxync1',
  c2a: 'ckboxync2a',
  c2b: 'ckboxync2b',
  c3: 'ckboxync3',
  c4: 'PCckboxyn4',
  c5: 'ckboxync5',
  c6: 'ckboxync6',
};

const BASIS: Record<string, string> = {
  race: 'CheckBoxrace[0]',
  religion: 'CheckBoxreligion[0]',
  nationality: 'CheckBoxnationality[0]',
  politics: 'CheckBoxpolitics[0]',
  social: 'CheckBoxsocial[0]',
  torture: 'CheckBoxtorture[0]',
};

export function planI589(a: Answers): I589Plan {
  const text: Record<string, string> = {};
  const check: string[] = [];
  const checkValue: [string, string][] = [];
  const narratives: I589Narrative[] = [];
  const put = (field: string, value: string) => {
    if (value) text[field] = value;
  };
  const yn = (base: string, value: unknown, yes = 'Y', no = 'N') => {
    if (value === 'yes') checkValue.push([base, yes]);
    if (value === 'no') checkValue.push([base, no]);
  };
  const sex = (base: string, value: unknown, values = { male: 'M', female: 'F' }) => {
    if (value === 'male') checkValue.push([base, values.male]);
    if (value === 'female') checkValue.push([base, values.female]);
  };
  const aNum = (s: string) => {
    const d = digits(s);
    return d ? d.padStart(9, '0') : '';
  };

  // Part A.I. The top box asks for withholding under the Convention Against Torture.
  const basis = list(a, 'basis');
  if (basis.includes('torture')) check.push('CheckBox31[0]');
  put('PtAILine1_ANumber[0]', aNum(str(a, 'aNumber')));
  put('TextField1[0]', digits(str(a, 'ssn')));
  put('TextField1[8]', digits(str(a, 'uscisAccount')));
  put('PtAILine4_LastName[0]', str(a, 'name.family'));
  put('PtAILine5_FirstName[0]', str(a, 'name.given'));
  put('PtAILine6_MiddleName[0]', str(a, 'name.middle'));
  put('TextField1[1]', str(a, 'otherNames'));
  put('PtAILine8_StreetNumandName[0]', str(a, 'residence.street'));
  put('PtAILine8_AptNumber[0]', str(a, 'residence.apt'));
  put('TextField1[2]', str(a, 'residence.city'));
  put('PtAILine8_State[0]', str(a, 'residence.state').toUpperCase());
  put('PtAILine8_Zipcode[0]', str(a, 'residence.zip'));
  const [area, number] = phone(str(a, 'residence.phone'));
  put('PtAILine8_AreaCode[0]', area);
  put('PtAILine8_TelephoneNumber[0]', number);
  if (a.mailingSame === 'no') {
    put('PtAILine9_InCareOf[0]', str(a, 'mailing.careOf'));
    put('PtAILine9_StreetNumandName[0]', str(a, 'mailing.street'));
    put('PtAILine9_AptNumber[0]', str(a, 'mailing.apt'));
    put('PtAILine9_City[0]', str(a, 'mailing.city'));
    put('PtAILine9_State[0]', str(a, 'mailing.state').toUpperCase());
    put('PtAILine9_ZipCode[0]', str(a, 'mailing.zip'));
    const [mArea, mNumber] = phone(str(a, 'mailing.phone'));
    put('PtAILine9_AreaCode[0]', mArea);
    put('PtAILine9_TelephoneNumbe[0]', mNumber);
  }
  sex('PartALine9Sex', a.sex);
  if (['S', 'M', 'D', 'W'].includes(str(a, 'marital'))) checkValue.push(['Marital', str(a, 'marital')]);
  put('DateTimeField1[0]', str(a, 'dob'));
  put('TextField1[4]', str(a, 'birthPlace'));
  put('TextField1[3]', str(a, 'nationality'));
  put('TextField1[5]', str(a, 'nationalityBirth'));
  put('TextField1[6]', str(a, 'group'));
  put('TextField1[7]', str(a, 'religion'));
  if (['A', 'B', 'C'].includes(str(a, 'court'))) checkValue.push(['CheckBox3', str(a, 'court')]);
  put('DateTimeField6[0]', str(a, 'lastLeft'));
  put('TextField3[0]', digits(str(a, 'i94')));
  const entryFields = [
    ['DateTimeField2[0]', 'TextField4[0]', 'TextField4[1]'],
    ['DateTimeField3[0]', 'TextField4[2]', 'TextField4[3]'],
    ['DateTimeField4[0]', 'TextField4[4]', 'TextField4[5]'],
  ];
  for (let i = 1; i <= chain(a, 'entry', 3, true); i++) {
    const [d, place, status] = entryFields[i - 1];
    put(d, str(a, `entry${i}.date`));
    put(place, str(a, `entry${i}.place`));
    put(status, str(a, `entry${i}.status`));
  }
  put('DateTimeField2[1]', str(a, 'entry1.expires'));
  put('TextField5[0]', str(a, 'passport.country'));
  put('TextField5[1]', str(a, 'passport.number'));
  put('TextField5[2]', str(a, 'travelDoc'));
  put('DateTimeField2[2]', str(a, 'passport.expires'));
  put('TextField7[0]', str(a, 'nativeLanguage'));
  yn('CheckBox4', a.fluentEnglish, 'Yes', 'No');
  put('TextField7[1]', str(a, 'otherLanguages'));

  // Part A.II: the spouse.
  if (a.marital === 'M') {
    put('PtAIILine1_ANumber[0]', aNum(str(a, 'spouse.aNumber')));
    put('TextField10[1]', str(a, 'spouse.passport'));
    put('DateTimeField7[0]', str(a, 'spouse.dob'));
    put('TextField10[2]', digits(str(a, 'spouse.ssn')));
    put('PtAIILine5_LastName[0]', str(a, 'spouse.family'));
    put('PtAIILine6_FirstName[0]', str(a, 'spouse.given'));
    put('PtAIILine7_MiddleName[0]', str(a, 'spouse.middle'));
    put('TextField10[3]', str(a, 'spouse.otherNames'));
    put('DateTimeField8[0]', str(a, 'spouse.marriageDate'));
    put('TextField10[4]', str(a, 'spouse.marriagePlace'));
    put('TextField10[5]', str(a, 'spouse.birthPlace'));
    put('TextField10[0]', str(a, 'spouse.nationality'));
    put('TextField10[6]', str(a, 'spouse.group'));
    sex('CheckBox14_Sex', a['spouse.sex']);
    yn('PtAIILine15_CheckBox15', a['spouse.inUS']);
    if (a['spouse.inUS'] === 'no') put('PtAIILine15_Specify[0]', str(a, 'spouse.location'));
    if (a['spouse.inUS'] === 'yes') {
      put('PtAIILine16_PlaceofLastEntry[0]', str(a, 'spouse.entryPlace'));
      put('PtAIILine17_DateofLastEntry[0]', str(a, 'spouse.entryDate'));
      put('PtAIILine18_I94Number[0]', digits(str(a, 'spouse.i94')));
      put('PtAIILine19_StatusofLastAdmission[0]', str(a, 'spouse.admittedStatus'));
      put('PtAIILine20_SpouseCurrentStatus[0]', str(a, 'spouse.status'));
      put('PtAIILine21_ExpDateofAuthorizedStay[0]', str(a, 'spouse.statusExpires'));
      if (a['spouse.court'] === 'yes') check.push('PtAIILine22_Yes[0]');
      if (a['spouse.court'] === 'no') check.push('PtAIILine22_No[0]');
      put('PtAIILine23_PreviousArrivalDate[0]', str(a, 'spouse.previousArrival'));
      if (a['spouse.include'] === 'yes') check.push('PtAIILine24_Yes[0]');
      if (a['spouse.include'] === 'no') check.push('PtAIILine24_No[0]');
    }
  } else if (str(a, 'marital')) check.push('CheckBox5[0]');

  // Part A.II: the children.
  if (a.hasChildren === 'no') checkValue.push(['ChildrenCheckbox', 'Y']);
  if (a.hasChildren === 'yes') {
    checkValue.push(['ChildrenCheckbox', 'N']);
    put('TotalChild[0]', digits(str(a, 'children.total')));
  }
  for (let i = 1; i <= chain(a, 'child', 4, a.hasChildren === 'yes'); i++) {
    const f = child(i);
    const p = `child${i}`;
    put(f.family, str(a, `${p}.family`));
    put(f.given, str(a, `${p}.given`));
    put(f.middle, str(a, `${p}.middle`));
    put(f.dob, str(a, `${p}.dob`));
    put(f.birthPlace, str(a, `${p}.birthPlace`));
    put(f.nationality, str(a, `${p}.nationality`));
    put(f.group, str(a, `${p}.group`));
    put(f.aNumber, aNum(str(a, `${p}.aNumber`)));
    put(f.passport, str(a, `${p}.passport`));
    put(f.marital, str(a, `${p}.marital`));
    put(f.ssn, digits(str(a, `${p}.ssn`)));
    sex(f.sex, a[`${p}.sex`], f.sexValues);
    yn(f.inUS, a[`${p}.inUS`]);
    if (a[`${p}.inUS`] === 'no') put(f.location, str(a, `${p}.location`));
    if (a[`${p}.inUS`] === 'yes') {
      put(f.entryPlace, str(a, `${p}.entryPlace`));
      put(f.entryDate, str(a, `${p}.entryDate`));
      put(f.i94, digits(str(a, `${p}.i94`)));
      put(f.admittedStatus, str(a, `${p}.admittedStatus`));
      put(f.status, str(a, `${p}.status`));
      put(f.statusExpires, str(a, `${p}.statusExpires`));
      if (a[`${p}.court`] === 'yes') check.push(f.courtYes);
      if (a[`${p}.court`] === 'no') check.push(f.courtNo);
      if (a[`${p}.include`] === 'yes') check.push(f.includeYes);
      if (a[`${p}.include`] === 'no') check.push(f.includeNo);
    }
  }

  // Part A.III.
  const row = (fields: Record<string, string>, prefix: string, keys: string[]) => {
    for (const k of keys) put(fields[k], str(a, `${prefix}.${k}`));
  };
  const place = ['street', 'city', 'province', 'country', 'from', 'to'];
  row(A3.lastAddress[0], 'lastAddress1', place);
  if (a.fearSameCountry === 'no') row(A3.lastAddress[1], 'lastAddress2', place);
  for (let i = 1; i <= chain(a, 'home', 5, true); i++) row(A3.home[i - 1], `home${i}`, place);
  for (let i = 1; i <= chain(a, 'school', 4, a['school.more0'] === 'yes'); i++) row(A3.school[i - 1], `school${i}`, ['name', 'type', 'location', 'from', 'to']);
  for (let i = 1; i <= chain(a, 'job', 3, a['job.more0'] === 'yes'); i++) row(A3.job[i - 1], `job${i}`, ['employer', 'occupation', 'from', 'to']);
  const siblings = chain(a, 'sibling', 4, a['sibling.more0'] === 'yes');
  for (const r of A3.relatives) {
    if (r.id.startsWith('sibling') && Number(r.id.slice(7)) > siblings) continue;
    put(r.name, str(a, `${r.id}.name`));
    put(r.birthPlace, str(a, `${r.id}.birthPlace`));
    if (a[`${r.id}.deceased`] === 'yes') check.push(r.deceased);
    else put(r.location, str(a, `${r.id}.location`));
  }

  // Parts B and C. Item 3.B is only asked after a Yes to 3.A.
  for (const b of basis) if (BASIS[b]) check.push(BASIS[b]);
  const answers: Record<string, unknown> = { ...a };
  if (a.b3a === 'no') answers.b3b = 'no';
  for (const [id, base] of Object.entries(YES_NO)) yn(base, answers[id]);
  for (const n of NARRATIVES) {
    const asked = n.id === 'c2' ? a.c2a === 'yes' || a.c2b === 'yes' : answers[n.id] === 'yes';
    const value = str(a, n.explain);
    if (asked && value) narratives.push({ field: BOXES[n.id], part: n.part, question: n.question, text: value });
  }

  // Part D. The signature and date stay empty: they are written by hand.
  put('TextField20[0]', [str(a, 'name.given'), str(a, 'name.middle'), str(a, 'name.family')].filter(Boolean).join(' '));
  yn('PtD_ckboxynd1', a.familyHelped, '2', '1');
  if (a.familyHelped === 'yes') {
    put('PtD_ChildName1[0]', str(a, 'helper1.name'));
    put('PtD_RelationshipOfChild1[0]', str(a, 'helper1.relationship'));
    put('PtD_ChildName2[0]', str(a, 'helper2.name'));
    put('PtD_RelationshipOfChild2[0]', str(a, 'helper2.relationship'));
  }
  yn('ckboxynd2', a.preparer);
  yn('ckboxynd3', a.counselList);

  return { text, check, checkValue, narratives };
}

/** Breaks text into the lines a box of `width` points shows at `size`. */
function wrap(s: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  for (const paragraph of s.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= width) line = next;
      else {
        if (line) lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}

const NARRATIVE_SIZE = 8;

/** Fills the official I-589 PDF with the answers and returns the new file's bytes. */
export async function fillI589(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const index = fieldIndex(form);
  const plan = planI589(a);
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

  // Explanations go in their own box when they fit; the rest continue on Supplement B.
  // The lines are broken here, a little narrower than the box: pdf-lib's own wrapping is very slow
  // on long text.
  const lines = (field: PDFTextField, s: string) => wrap(toFormText(s), font, NARRATIVE_SIZE, field.acroField.getWidgets()[0].getRectangle().width - 8);
  const fits = (field: PDFTextField, s: string) => lines(field, s).length * NARRATIVE_SIZE * 1.2 <= field.acroField.getWidgets()[0].getRectangle().height - 4;
  const setNarrative = (field: PDFTextField, s: string) => {
    field.enableMultiline();
    setFieldText(field, lines(field, s).join('\n'), NARRATIVE_SIZE);
  };
  const moved: { part: string; question: string; text: string }[] = [];
  for (const n of plan.narratives) {
    const field = textField(n.field);
    if (fits(field, n.text)) setNarrative(field, n.text);
    else {
      setNarrative(field, `See Supplement B, Part ${n.part}, Question ${n.question}.`);
      moved.push(n);
    }
  }
  if (moved.length) {
    const aNumber = digits(String(a.aNumber ?? ''));
    if (aNumber) setFieldText(textField('PtAILine1_ANumber[2]'), aNumber.padStart(9, '0'), 9);
    setFieldText(textField('SupBApplicantName[0]'), plan.text['TextField20[0]'] ?? '', 9);
    setFieldText(textField('TextField31[0]'), [...new Set(moved.map((m) => m.part))].join(', '), 9);
    setFieldText(textField('TextField31[1]'), moved.map((m) => m.question).join(', '), 9);
    setNarrative(textField('TextField32[0]'), moved.map((m) => `Part ${m.part}, Question ${m.question}:\n${m.text}`).join('\n\n'));
  }

  doc.setTitle('Form I-589, Application for Asylum and for Withholding of Removal');
  return doc.save();
}
