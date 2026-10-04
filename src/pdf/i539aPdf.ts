import { PDFDocument, PDFDropdown, PDFTextField, StandardFonts } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { CO_ITEMS } from '../forms/i539a';
import { assistance, usedInterpreter, usedPreparer } from '../forms/assistance';
import { fieldIndex, optionBoxes, selectOption, setFieldText, toFormText, wrap } from './common';

// Fields of USCIS Form I-539A, edition 08/28/24 (public/forms/i-539a.pdf), named by the last
// segment of their full name. Mapped by position:
// - Part 1 (the principal) is "P1Line1a_FamilyName" etc.; Part 2 (the co-applicant) is
//   "P2_Line1a_FamilyName[0]", repeated as "[1]" at the top of Part 7. "USCISOnlineAcctNumber" is the
//   attorney's account; the co-applicant's (Item 10) is "Pt1Line10_USCISELISAcctNumber".
// - Part 2, Item 9 (current passport): number "P1_Line13_Passport", country of issuance
//   "P1_Line13b_CountryOfCitizenship", expiration "P1_Line13b_ExpDate".
// - Part 3's Yes/No pairs export Y ([1], left) / N ([0], right). Their names mostly follow the
//   printed items, but Item 13 is "P3_Line12_SoldProvWeap", and the file order differs from the print.
//   Item 10's "P3_Line10_MilUnit" is a military-unit question, not an Apt./Ste./Flr. group: the form
//   has no addresses.
// - Part 4 contact is "P12_*"; Part 5 (interpreter) "P14_*" with the language "P7_Line6_Language";
//   Part 6 (preparer) "P15_*". The interpreter's and preparer's signatures are "P12_SignatureApplicant[1]"
//   and "[2]" (left blank). Part 7's boxes are "P11_LineNA/B/C" (page, part, item) and "P7_LineND".

export interface I539APlan {
  text: Record<string, string>;
  checkValue: [string, string][];
  select: Record<string, string>;
  /** Part 7 entries, in order. */
  notes: { page: string; part: string; item: string; text: string }[];
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');

/** Part 3's Yes/No pairs, in printed order (Items 1-18). */
export const PART3 = [
  'P3_Line1_ImmVisa',
  'P3_Line2_PetFiled',
  'P3_Line3_I485Filed',
  'P3_Line4_CrimOffense',
  'P3_Line5_TorGeno',
  'P3_Line6_Killing',
  'P3_Line7_IntSevInjury',
  'P3_Line8_SexContRel',
  'P3_Line9_LimDenRelBel',
  'P3_Line10_MilUnit',
  'P3_Line11_WorkPrison',
  'P3_Line12_MemOfGroup',
  'P3_Line12_SoldProvWeap',
  'P3_Line14_WeapParamilTrg',
  'P3_Line15_NonImmViolSt',
  'P3_Line16_RemProceed',
  'P3_Line17_AdmitGrantExt',
  'P3_Line18_J1J2Visitor',
];

export function planI539A(a: Answers): I539APlan {
  const text: Record<string, string> = {};
  const checkValue: [string, string][] = [];
  const select: Record<string, string> = {};
  const notes: I539APlan['notes'] = [];
  const put = (field: string, value: string) => {
    if (value) text[field] = value;
  };
  const yn = (item: number, v: unknown) => {
    if (v === 'yes') checkValue.push([PART3[item - 1], 'Y']);
    if (v === 'no') checkValue.push([PART3[item - 1], 'N']);
  };

  // Part 1: the principal applicant.
  put('P1Line1a_FamilyName[0]', str(a, 'name.family'));
  put('P1_Line1b_GivenName[0]', str(a, 'name.given'));
  put('P1_Line1c_MiddleName[0]', str(a, 'name.middle'));

  // Part 2: the co-applicant. The name and A-Number repeat at the top of Part 7.
  for (const i of [0, 1]) {
    put(`P2_Line1a_FamilyName[${i}]`, str(a, 'co.name.family'));
    put(`P2_Line1b_GivenName[${i}]`, str(a, 'co.name.given'));
    put(`P2_Line1c_MiddleName[${i}]`, str(a, 'co.name.middle'));
  }
  put('SupA_Line2_DateOfBirth[0]', str(a, 'co.dob'));
  put('SupA_Line3_CountryOfBirth[0]', str(a, 'co.birthCountry'));
  put('SupA_Line1f_CountryOfCitz[0]', str(a, 'co.citizenship'));
  put('SupA_Line1g_SSN[0]', digits(str(a, 'co.ssn')));
  const aNumber = digits(str(a, 'co.aNumber'));
  if (aNumber) for (const i of [0, 1]) put(`Pt1Line6_AlienNumber[${i}]`, aNumber.padStart(9, '0'));
  put('SupA_Line1i_DateOfArrival[0]', str(a, 'co.lastEntry.date'));
  put('SupA_Line1j_ArrivalDeparture[0]', str(a, 'co.i94.number').replace(/[\s-]/g, '').toUpperCase());
  put('SupA_Line1k_Passport[0]', str(a, 'co.passport.number'));
  put('SupA_Line1l_TravelDoc[0]', str(a, 'co.passport.travelDoc'));
  put('SupA_Line1m_CountryOfIssuance[0]', str(a, 'co.passport.country'));
  put('SupA_Line1n_ExpDate[0]', str(a, 'co.passport.expires'));
  if (a['co.currentStatus']) select['Pt1Line15a_NewStatus[0]'] = str(a, 'co.currentStatus');
  // The form has no D/S box: the expiration date says "D/S".
  if (a['co.statusDS'] === 'yes') put('SupA_Line1p_DateExpires[0]', 'D/S');
  if (a['co.statusDS'] === 'no') put('SupA_Line1p_DateExpires[0]', str(a, 'co.i94.expires'));
  if (a['co.passportChanged'] === 'yes') {
    put('P1_Line13_Passport[0]', str(a, 'co.newPassport.number'));
    put('P1_Line13b_CountryOfCitizenship[0]', str(a, 'co.newPassport.country'));
    put('P1_Line13b_ExpDate[0]', str(a, 'co.newPassport.expires'));
  }
  put('Pt1Line10_USCISELISAcctNumber[0]', digits(str(a, 'co.uscisAccount')));

  // Part 3.
  CO_ITEMS.forEach((item, i) => yn(i + 1, a[item.id]));
  yn(17, a['co.employed']);
  yn(18, a['co.exchangeVisitor']);

  // Part 7: one entry per explanation. The item box holds 6 characters.
  const yes = CO_ITEMS.map((item, i) => (a[item.id] === 'yes' ? String(i + 1) : '')).filter(Boolean);
  if (yes.length) {
    const joined = yes.join(',');
    const item = joined.length <= 6 ? joined : `${yes[0]}-${yes[yes.length - 1]}`;
    notes.push({ page: '2', part: '3', item, text: `Item${yes.length > 1 ? 's' : ''} ${yes.join(', ')}: ${str(a, 'co.background.explain')}` });
  }
  if (a['co.employed'] === 'yes') notes.push({ page: '2', part: '3', item: '17', text: `Employment in the United States: ${str(a, 'co.employed.explain')}` });
  if (a['co.employed'] === 'no') notes.push({ page: '2', part: '3', item: '17', text: `How I am supporting myself: ${str(a, 'co.support.explain')}` });
  if (a['co.exchangeVisitor'] === 'yes') notes.push({ page: '2', part: '3', item: '18', text: `Dates in J-1/J-2 status: ${str(a, 'co.exchange.explain')}` });

  // Part 4. The signature and its date stay empty: they are written by hand.
  put('P12_Line3_Telephone[0]', digits(str(a, 'co.phone')));
  put('P12_Line3_Mobile[0]', digits(str(a, 'co.mobile')));
  put('P12_Line5_Email[0]', str(a, 'co.email'));

  // Parts 5 and 6: no address and no preparer's statement on this form.
  const help = assistance(a, { interpreter: usedInterpreter(a), preparer: usedPreparer(a) });
  const i = help.interpreter;
  if (i) {
    put('P14_Line1_nterpreterFamilyName[0]', i.family);
    put('P14_Line1_nterpreterGivenName[0]', i.given);
    put('P14_Line2_NameofBusinessorOrgName[0]', i.business);
    put('P14_Line4_Telephone[0]', digits(i.phone));
    put('P14_Line5_Mobile[0]', digits(i.mobile));
    put('P14_Line5_EmailAddress[0]', i.email);
    put('P7_Line6_Language[0]', i.language);
  }
  const p = help.preparer;
  if (p) {
    put('P15_Line1_PreparerFamilyName[0]', p.family);
    put('P15_Line1_PreparerGivenName[0]', p.given);
    put('P15_Line2_NameofBusinessorOrgName[0]', p.business);
    put('P15_Line4_Telephone[0]', digits(p.phone));
    put('P15_Line5_Mobile[0]', digits(p.mobile));
    put('P15_Line6_Email[0]', p.email);
  }

  return { text, checkValue, select, notes: notes.filter((n) => !n.text.endsWith(': ')) };
}

const NOTE_SIZE = 8;
const NOTE_BOXES = [3, 4, 5, 6];

/** Fills the official I-539A PDF with the answers and returns the new file's bytes. */
export async function fillI539A(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const index = fieldIndex(form);
  const plan = planI539A(a);
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

  // Part 7: each explanation fills as many boxes as it needs, in order. Long text is broken into
  // lines here: pdf-lib's own wrapping is very slow on long text.
  const box = (n: number) => textField(`P7_Line${n}D[0]`);
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
    const n = NOTE_BOXES[i];
    setFieldText(textField(`P11_Line${n}A[0]`), c.page, 9);
    setFieldText(textField(`P11_Line${n}B[0]`), c.part, 9);
    setFieldText(textField(`P11_Line${n}C[0]`), c.item, 9);
    const f = box(n);
    f.enableMultiline();
    setFieldText(f, c.lines.join('\n'), NOTE_SIZE);
  });

  doc.setTitle('Form I-539A, Supplemental Information for Application to Extend/Change Nonimmigrant Status');
  return doc.save();
}
