import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField, StandardFonts } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { BACKGROUND_ITEMS } from '../forms/i601a';
import { parseUnit } from '../engine/validation';
import { assistance, type HelperPerson, usedInterpreter, usedPreparer } from '../forms/assistance';
import { fieldIndex, optionBoxes, selectOption, setFieldText, toFormText, wrap } from './common';

// Fields of USCIS Form I-601A, edition 01/20/25 (public/forms/i-601a.pdf), named by the last
// segment of their full name. Mapped by position:
// - Part 1, Item 26 is "Pt1Checkbox25_Checkbox", Item 31 "Pt1Checkbox30_Checkbox", and Items
//   32-45 are named one number early ("Pt1Checkbox31_Checkbox" is Item 32, "Pt1Checkbox38a" is
//   Item 39.a, "Pt1Checkbox39a" Item 40.a, "Pt1Checkbox44" Item 45).
// - Part 2's eye-color boxes printed as Gray and Green export each other's values (GRN, GRY).
// - Part 3's DV selectee name is "Pt3Line2*[0]" and the petitioner's "Pt3Line2*[1]".
// - Part 6, Item 1.a exports A and 1.b exports B; Item 2 is "Pt6Checkbox2".
// - Parts 7 and 8 (pages 7-8) share their address names ("Pt7Line3b_Unit" / "Pt8Line3b_Unit": [2] APT,
//   [0] STE, [1] FLR left to right, export values matching the labels). The interpreter's daytime
//   phone is "Pt7Line4_DaytimeTelephoneNumber3". Part 8, Item 7 is "Pt8Line7_Checkbox" (A = not an
//   attorney, B = attorney); the PDF prints "extends/does not extend" with no boxes to choose.

export interface I601APlan {
  text: Record<string, string>;
  check: string[];
  checkValue: [string, string][];
  select: Record<string, string>;
  /** The Part 5 statement; the filler moves it to Part 9 when it doesn't fit. */
  statement: string;
  /** Part 9 entries, in order. */
  notes: { page: string; part: string; item: string; text: string }[];
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');

/** The I-485 biographic codes, as this form exports them. */
const RACE: Record<string, string> = { WH: '1', AS: '2', BL: '3', AI: '4', HW: '5' };
const EYES: Record<string, string> = { BN: 'BRO', BL: 'BLK', HA: 'HAZ', GN: 'GRY', BU: 'BLU', GR: 'GRN', MA: 'MAR', PN: 'PNK', UN: 'UNK' };
const HAIR: Record<string, string> = { BL: 'BLK', BR: 'BRO', BN: 'BLN', GR: 'GRY', WH: 'WHI', RD: 'RED', SA: 'SDY', NH: 'BAL', OT: 'UNK' };

/** Items 32-45's Yes/No groups: each is named one item early. */
export const backgroundBase = (id: string) => {
  const item = id.slice(3); // "32", "39a"…
  const n = Number(item.replace(/\D/g, '')) - 1;
  return `Pt1Checkbox${n}${item.replace(/\d/g, '')}_Checkbox`;
};

const chain = (a: Answers, id: string, max: number, first: boolean) => {
  if (!first) return 0;
  let n = 1;
  while (n < max && a[`${id}.more${n}`] === 'yes') n++;
  return n;
};

export function planI601A(a: Answers): I601APlan {
  const text: Record<string, string> = {};
  const check: string[] = [];
  const checkValue: [string, string][] = [];
  const select: Record<string, string> = {};
  const notes: I601APlan['notes'] = [];
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
  const name = (prefix: string, [family, given, middle]: string[]) => {
    put(family, str(a, `${prefix}.family`));
    put(given, str(a, `${prefix}.given`));
    put(middle, str(a, `${prefix}.middle`));
  };
  const address = (prefix: string, line: string, [street, unit, city, st, zip]: string[]) => {
    put(`${line}${street}[0]`, str(a, `${prefix}.street`));
    const u = parseUnit(str(a, `${prefix}.unit`));
    if (u) {
      checkValue.push([`${line}${unit}_Unit`, u.kind]);
      put(`${line}${unit}_AptSteFlrNumber[0]`, u.number);
    }
    put(`${line}${city}_CityOrTown[0]`, str(a, `${prefix}.city`));
    state(`${line}${st}_State[0]`, str(a, `${prefix}.state`));
    put(`${line}${zip}_ZipCode[0]`, str(a, `${prefix}.zip`));
  };

  // Part 1. The name and A-Number repeat at the top of Part 9.
  const aNumber = digits(str(a, 'aNumber'));
  if (aNumber) for (const i of [0, 1]) put(`Pt1Line1_AlienNumber[${i}]`, aNumber.padStart(9, '0'));
  put('Pt1Line2_SSN[0]', digits(str(a, 'ssn')));
  put('Pt1Line3_USCISELISAcctNumber[0]', digits(str(a, 'uscisAccount')));
  for (const i of [0, 1]) name('name', [`Pt1Line4a_FamilyName[${i}]`, `Pt1Line4b_GivenName[${i}]`, `Pt1Line4c_MiddleName[${i}]`]);
  for (let i = 1; i <= chain(a, 'otherName', 2, a['otherName.more0'] === 'yes'); i++) {
    const l = `Pt1Line${i + 4}`;
    name(`otherName${i}`, [`${l}a_FamilyName[0]`, `${l}b_GivenName[0]`, `${l}c_MiddleName[0]`]);
  }
  put('Pt1Line7a_InCareofName[0]', str(a, 'mailing.careOf'));
  address('mailing', 'Pt1Line7', ['b_StreetNumberName', 'c', 'd', 'e', 'f']);
  yn('Pt1Line8_Checkbox', a.mailingSame);
  if (a.mailingSame === 'no') address('home', 'Pt1Line9', ['a_StreetNumberName', 'b', 'c', 'd', 'e']);
  if (a.sex === 'male') checkValue.push(['Pt1Line10_Sex', 'M']);
  if (a.sex === 'female') checkValue.push(['Pt1Line10_Sex', 'F']);
  put('Pt1Line11_DateOfBirth[0]', str(a, 'dob'));
  put('Pt1Line12_CityOrTownOfBirth[0]', str(a, 'birthCity'));
  put('Pt1Line13_CountryOfBirth[0]', str(a, 'birthCountry'));
  put('Pt1Line14_CountryOfCitizenship[0]', str(a, 'citizenship'));
  put('Pt1Line15a_MotherFamilyName[0]', str(a, 'mother.family'));
  put('Pt1Line15b_GivenName[0]', str(a, 'mother.given'));
  put('Pt1Line16a_FamilyName[0]', str(a, 'father.family'));
  put('Pt1Line16b_GivenName[0]', str(a, 'father.given'));

  // Items 17-26: entries.
  put('Pt1Line17_DateOfEntry[0]', str(a, 'lastEntry.date'));
  put('Pt1Line18a_PlaceOfEntry[0]', str(a, 'lastEntry.place'));
  state('Pt1Line18b_State[0]', str(a, 'lastEntry.state'));
  put('Pt1Line19_ImmigrationStatus[0]', str(a, 'lastEntry.status'));
  const previous = [
    ['Pt1Line20a_PlaceOfEntry[0]', 'Pt1Line20b_State[0]', 'Pt1Line21a_DateFrom[0]', 'Pt1Line21b_DateTo[0]', 'Pt1Line22_ImmigrationStatus[0]'],
    ['Pt1Line23a_PlaceOfEntry[0]', 'Pt1Line23b_State[0]', 'Pt1Line24a_DateFrom[0]', 'Pt1Line24b_DateTo[0]', 'Pt1Line25_ImmigrationStatus[0]'],
  ];
  const entries = chain(a, 'prevEntry', 2, a['prevEntry.more0'] === 'yes');
  for (let i = 1; i <= entries; i++) {
    const [place, st, from, to, status] = previous[i - 1];
    put(place, str(a, `prevEntry${i}.place`));
    state(st, str(a, `prevEntry${i}.state`));
    put(from, str(a, `prevEntry${i}.from`));
    put(to, str(a, `prevEntry${i}.to`));
    put(status, str(a, `prevEntry${i}.status`));
  }
  if (str(a, 'prevEntry.more0')) {
    const more = entries === 2 && a['prevEntry.more2'] === 'yes';
    yn('Pt1Checkbox25_Checkbox', more ? 'yes' : 'no');
    if (more) notes.push({ page: '2', part: '1', item: '26', text: str(a, 'otherEntries.explain') });
  }

  // Items 27-31: proceedings.
  yn('Pt1Checkbox27', a.proceedings);
  if (a.proceedings === 'yes' && (a.proceedingsStatus === 'A' || a.proceedingsStatus === 'B')) checkValue.push(['Pt1Checkbox28', str(a, 'proceedingsStatus')]);
  yn('Pt1Checkbox29a_Checkbox', a.finalOrder);
  if (a.finalOrder === 'yes') put('Pt1Line29b_ReceiptNumber[0]', str(a, 'i212.receipt').replace(/[^A-Za-z0-9]/g, '').toUpperCase());
  yn('Pt1Checkbox30a_Checkbox', a.i871);
  if (a.i871 === 'yes') yn('Pt1Checkbox30b_Checkbox', a.reinstated);
  yn('Pt1Checkbox30_Checkbox', a.voluntaryDeparture);

  // Items 32-45, with one explanation in Part 9.
  for (const item of BACKGROUND_ITEMS) yn(backgroundBase(item.id), a[item.id]);
  if (BACKGROUND_ITEMS.some((i) => a[i.id] === 'yes')) {
    const yes = BACKGROUND_ITEMS.filter((i) => a[i.id] === 'yes').map((i) => i.id.slice(3).replace(/([a-e])$/, '.$1'));
    notes.push({ page: '3', part: '1', item: '32-45', text: `Items ${yes.join(', ')}: ${str(a, 'background.explain')}` });
  }

  // Part 2.
  if (a.ethnicity === 'hispanic') checkValue.push(['Pt2Checkbox1', 'H']);
  if (a.ethnicity === 'notHispanic') checkValue.push(['Pt2Checkbox1', 'N']);
  for (const r of Array.isArray(a.race) ? a.race : []) if (RACE[r]) check.push(`Pt2Checkbox2_${RACE[r]}[0]`);
  if (a.heightFeet) select['Pt2Line3_HeightFeet[0]'] = str(a, 'heightFeet');
  if (a.heightInches) select['Pt2Line3_HeightInches[0]'] = str(a, 'heightInches');
  const weight = digits(str(a, 'weight'));
  if (weight) {
    const w = weight.padStart(3, '0').slice(-3);
    [1, 2, 3].forEach((i) => put(`Pt2Line4_HeightInches${i}[0]`, w[i - 1]));
  }
  if (EYES[str(a, 'eyes')]) checkValue.push(['Pt2Checkbox5', EYES[str(a, 'eyes')]]);
  if (HAIR[str(a, 'hair')]) checkValue.push(['Pt2Checkbox6', HAIR[str(a, 'hair')]]);

  // Part 3.
  const basis = str(a, 'basis');
  if (['1', '2', '3', '4', '5'].includes(basis)) check.push(`Pt3Line4_Option${basis}[0]`);
  if (basis === '1') {
    put('Pt3Line6a_DV_KCCCaseNumber[0]', str(a, 'dv.caseNumber').replace(/\s/g, '').toUpperCase());
    name('dv.selectee', ['Pt3Line2a_FamilyName[0]', 'Pt3Line2b_GivenName[0]', 'Pt3Line2c_MiddleName[0]']);
  } else if (basis) {
    put('Pt3Line3a_USCISReceiptNumber[0]', str(a, 'petition.receipt').replace(/[^A-Za-z0-9]/g, '').toUpperCase());
    put('Pt3Line3b_CSC_NVCCaseNumber[0]', str(a, 'petition.nvc').replace(/\s/g, '').toUpperCase());
    name('petitioner', ['Pt3Line2a_FamilyName[1]', 'Pt3Line2b_GivenName[1]', 'Pt3Line2c_MiddleName[1]']);
    put('Pt3Line3_CompanyOrOrgName[0]', str(a, 'petitioner.company'));
  }

  // Part 4.
  name('qualifying1', ['Pt4Line1a_FamilyName[0]', 'Pt4Line1b_GivenName[0]', 'Pt4Line1c_MiddleName[0]']);
  const rel1 = str(a, 'qualifying1.relationship');
  if ('ABCD'.includes(rel1) && rel1) check.push(`Pt4Line2${rel1.toLowerCase()}_Checkbox[0]`);
  yn('Pt4Line3_Checkbox', a['qualifying.more1']);
  if (a['qualifying.more1'] === 'yes') {
    name('qualifying2', ['Pt4Line4a_FamilyName[0]', 'Pt4Line4b_GivenName[0]', 'Pt4Line4c_MiddleName[0]']);
    const rel2 = str(a, 'qualifying2.relationship');
    if ('ABCD'.includes(rel2) && rel2) check.push(`Pt4Line5${rel2.toLowerCase()}_Checkbox[0]`);
  }

  // Part 6. The signature and its date stay empty: they are written by hand.
  if (a.readsEnglish === 'A' || a.readsEnglish === 'B') checkValue.push(['Pt6Checkbox1', str(a, 'readsEnglish')]);
  if (a.readsEnglish === 'B') put('Pt6Line1b_NameofLanguage[0]', str(a, 'fluentLanguage'));
  if (a.preparer === 'yes') {
    check.push('Pt6Checkbox2[0]');
    put('Pt6Line2_Name[0]', str(a, 'preparer.name'));
  }
  put('Pt6Line3_DaytimeTelephoneNumber[0]', digits(str(a, 'phone')));
  put('Pt6Line4_MobileTelephoneNumber[0]', digits(str(a, 'mobile')));
  put('Pt6Line5_Email[0]', str(a, 'email'));

  // Parts 7 and 8. Signatures and dates stay empty.
  const helper = (part: string, h: HelperPerson) => {
    const p = `Pt${part}Line3`;
    put(`${p}a_StreetNumberName[0]`, h.street);
    const u = parseUnit(h.unit);
    if (u) {
      checkValue.push([`${p}b_Unit`, u.kind]);
      put(`${p}b_AptSteFlrNumber[0]`, u.number);
    }
    put(`${p}c_CityOrTown[0]`, h.city);
    state(`${p}d_State[0]`, h.state);
    put(`${p}e_ZipCode[0]`, h.zip);
    put(`${p}f_Province[0]`, h.province);
    put(`${p}g_PostalCode[0]`, h.postal);
    put(`${p}h_Country[0]`, h.country);
  };
  const help = assistance(a, { interpreter: usedInterpreter(a), preparer: usedPreparer(a) });
  if (help.interpreter) {
    const h = help.interpreter;
    put('Pt7Line1a_InterpreterFamilyName[0]', h.family);
    put('Pt7Line1b_InterpreterGivenName[0]', h.given);
    put('Pt7Line2_NameofBusinessorOrgName[0]', h.business);
    helper('7', h);
    put('Pt7Line4_DaytimeTelephoneNumber3[0]', digits(h.phone));
    put('Pt7Line5_MobileTelephoneNumber[0]', digits(h.mobile));
    put('Pt7Line6_EmailAddress[0]', h.email);
    put('Pt7Line6_NameOfLanguage[0]', h.language);
  }
  if (help.preparer) {
    const h = help.preparer;
    put('Pt8Line1a_PreparerFamilyName[0]', h.family);
    put('Pt8Line1b_PreparerGivenName[0]', h.given);
    put('Pt8Line2_BusinessName[0]', h.business);
    helper('8', h);
    put('Pt8Line4_DaytimeTelephoneNumber[0]', digits(h.phone));
    put('Pt8Line5_MobileTelephoneNumber[0]', digits(h.mobile));
    put('Pt8Line6_EmailAddress[0]', h.email);
    if (h.statement === 'notAttorney') checkValue.push(['Pt8Line7_Checkbox', 'A']);
    if (h.statement === 'attorneyExtends' || h.statement === 'attorneyNotExtends') checkValue.push(['Pt8Line7_Checkbox', 'B']);
  }

  return { text, check, checkValue, select, statement: str(a, 'hardship.statement'), notes: notes.filter((n) => n.text) };
}

const STATEMENT_SIZE = 9;

/** Fills the official I-601A PDF with the answers and returns the new file's bytes. */
export async function fillI601A(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const index = fieldIndex(form);
  const plan = planI601A(a);
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
  const lines = (field: PDFTextField, s: string, size: number) => wrap(toFormText(s), font, size, field.acroField.getWidgets()[0].getRectangle().width - 8);
  const setLong = (field: PDFTextField, s: string, size: number) => {
    field.enableMultiline();
    setFieldText(field, lines(field, s, size).join('\n'), size);
  };

  // Part 5 stays in its box when it fits; otherwise it continues in Part 9.
  const notes = [...plan.notes];
  if (plan.statement) {
    const box = textField('Pt5Line1_ApplicantStatement[0]');
    const { height } = box.acroField.getWidgets()[0].getRectangle();
    if (lines(box, plan.statement, STATEMENT_SIZE).length * STATEMENT_SIZE * 1.2 <= height - 4) setLong(box, plan.statement, STATEMENT_SIZE);
    else {
      setLong(box, 'See Part 9. Additional Information, Part 5.', STATEMENT_SIZE);
      notes.unshift({ page: '6', part: '5', item: '1', text: plan.statement });
    }
  }
  notes.slice(0, 5).forEach((n, i) => {
    const line = `Pt9Line${i + 3}`;
    setFieldText(textField(`${line}a_PageNumber[0]`), n.page, 9);
    setFieldText(textField(`${line}b_PartNumber[0]`), n.part, 9);
    setFieldText(textField(`${line}c_ItemNumber[0]`), n.item, 9);
    setLong(textField(`${line}d_AdditionalInfo[0]`), n.text, 8);
  });

  doc.setTitle('Form I-601A, Application for Provisional Unlawful Presence Waiver');
  return doc.save();
}
