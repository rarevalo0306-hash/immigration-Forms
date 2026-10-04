import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { ELIGIBILITY_ITEMS, PROCESSING_ITEMS } from '../forms/i918';
import { fieldIndex, optionBoxes } from './common';
import { fillI918, planI918, processingPage } from './i918Pdf';

const template = readFileSync(new URL('../../public/forms/i-918.pdf', import.meta.url));

/** Marisol, a domestic violence survivor in Houston who helped the police, with two children. */
export const marisol: Answers = {
  'name.family': 'Ramírez',
  'name.given': 'Marisol',
  'name.middle': 'Guadalupe',
  'otherName.more0': 'yes',
  'otherName1.family': 'Ortega',
  'otherName1.given': 'Marisol',
  'otherName.more1': 'no',
  'home.street': '4521 Telephone Rd',
  'home.unit': 'Apt 12',
  'home.city': 'Houston',
  'home.state': 'TX',
  'home.zip': '77087',
  'home.country': 'United States',
  mailingSame: 'no',
  'mailing.careOf': 'Casa de Esperanza',
  'mailing.street': 'PO Box 2210',
  'mailing.city': 'Houston',
  'mailing.state': 'TX',
  'mailing.zip': '77252',
  'mailing.country': 'United States',
  aNumber: 'A098765432',
  marital: 'Married',
  sex: 'female',
  dob: '07/19/1988',
  birthCountry: 'Honduras',
  citizenship: 'Honduras',
  passport: 'G1234567',
  passportCountry: 'Honduras',
  passportIssued: '02/10/2014',
  passportExpires: '02/09/2024',
  'lastEntry.city': 'Hidalgo',
  'lastEntry.state': 'TX',
  'lastEntry.date': '05/03/2015',
  stayExpired: 'EWI',
  currentStatus: 'No status',
  'p2.1': 'yes',
  'p2.2': 'yes',
  'p2.3': 'yes',
  'p2.4': 'yes',
  'p2.5': 'yes',
  'p2.6': 'no',
  proceedings: 'no',
  'entry.more0': 'no',
  outsideUS: 'no',
  ...Object.fromEntries(PROCESSING_ITEMS.map((i) => [i.id, 'no'])),
  'familyMember.more0': 'yes',
  'familyMember1.family': 'Ramirez',
  'familyMember1.given': 'Daniel',
  'familyMember1.dob': '11/02/2016',
  'familyMember1.birthCountry': 'United States',
  'familyMember1.relationship': 'Son',
  'familyMember1.location': 'Houston, TX',
  'familyMember.more1': 'yes',
  'familyMember2.family': 'Ramirez',
  'familyMember2.given': 'Sofia',
  'familyMember2.dob': '03/22/2010',
  'familyMember2.birthCountry': 'Honduras',
  'familyMember2.relationship': 'Daughter',
  'familyMember2.location': 'Houston, TX',
  'familyMember.more2': 'no',
  petitionFamily: 'yes',
  readsEnglish: 'B',
  fluentLanguage: 'Spanish',
  preparer: 'yes',
  'preparer.name': 'Laura Mendez',
  phone: '713 555 0198',
  mobile: '713 555 0144',
  email: 'marisol.r@example.com',
};

/** An interpreter in the U.S. and a different preparer abroad. */
export const helpers: Answers = {
  readsEnglish: 'B',
  fluentLanguage: 'Spanish',
  preparer: 'yes',
  'preparer.name': 'Ana Lee',
  'interp.family': 'Gómez',
  'interp.given': 'Rosa',
  'interp.business': 'Ayuda Hispana',
  'interp.street': '100 Main St',
  'interp.unit': 'Ste 210',
  'interp.city': 'Houston',
  'interp.state': 'TX',
  'interp.zip': '77002',
  'interp.country': 'United States',
  'interp.phone': '713 555 0100',
  'interp.mobile': '713 555 0101',
  'interp.email': 'rosa@example.com',
  'interp.language': 'Spanish',
  'prep.same': 'no',
  'prep.family': 'Lee',
  'prep.given': 'Ana',
  'prep.business': 'Lee Immigration Law',
  'prep.street': 'Calle Real 5',
  'prep.unit': 'Flr 3',
  'prep.city': 'Tegucigalpa',
  'prep.province': 'Francisco Morazan',
  'prep.postal': '11101',
  'prep.country': 'Honduras',
  'prep.phone': '504 2555 0100',
  'prep.mobile': '504 9555 0101',
  'prep.email': 'ana@example.com',
  'prep.statement': 'attorneyExtends',
};

describe('I-918 PDF', () => {
  it('knows the page of each Part 3 item', () => {
    expect(processingPage('p3.1a')).toBe('3');
    expect(processingPage('p3.1f')).toBe('4');
    expect(processingPage('p3.6b')).toBe('4');
    expect(processingPage('p3.6c')).toBe('5');
    expect(processingPage('p3.13a')).toBe('5');
    expect(processingPage('p3.13b')).toBe('6');
    expect(processingPage('p3.29c')).toBe('6');
  });

  it('plans only fields that exist, with the right kind', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    const allYes = Object.fromEntries([...ELIGIBILITY_ITEMS, ...PROCESSING_ITEMS].map((i) => [i.id, 'yes']));
    const family: Answers = {};
    for (let i = 1; i <= 5; i++) {
      family[`familyMember${i}.family`] = `Family ${i}`;
      family[`familyMember${i}.given`] = `Given ${i}`;
      family[`familyMember${i}.middle`] = `M${i}`;
      family[`familyMember${i}.dob`] = '01/01/2010';
      family[`familyMember${i}.birthCountry`] = 'Mexico';
      family[`familyMember${i}.relationship`] = 'Child';
      family[`familyMember${i}.location`] = 'Dallas, TX';
      family[`familyMember.more${i}`] = 'yes';
    }
    const arrests: Answers = {};
    for (const i of [1, 2]) {
      arrests[`arrest${i}.why`] = 'Shoplifting';
      arrests[`arrest${i}.date`] = '01/01/2012';
      arrests[`arrest${i}.city`] = 'Austin';
      arrests[`arrest${i}.state`] = 'TX';
      arrests[`arrest${i}.country`] = 'United States';
      arrests[`arrest${i}.outcome`] = 'Dismissed';
    }
    const entries: Answers = { 'entry.more0': 'yes', 'entry.more1': 'yes', 'entry.more2': 'yes', 'entry.more3': 'yes', 'otherEntries.explain': 'Two more entries in 2021' };
    for (const i of [1, 2, 3]) {
      entries[`entry${i}.date`] = '01/01/2022';
      entries[`entry${i}.city`] = 'Laredo';
      entries[`entry${i}.state`] = 'TX';
      entries[`entry${i}.status`] = 'B-2';
    }
    const variants: Answers[] = [
      marisol,
      { ...marisol, ...allYes, ...family, ...arrests, ...entries, 'arrest.more1': 'yes', 'processing.explain': 'Arrested in 2012.', 'otherName.more1': 'yes', 'otherName2.family': 'Ruiz', 'otherName2.given': 'Marisol' },
      { ...marisol, proceedings: 'yes', proceedingsTypes: ['b', 'c', 'd', 'e', 'f'], 'proceedings.b': 'Current', 'proceedings.c': '01/01/2001', 'proceedings.d': '01/01/2002', 'proceedings.e': '01/01/2003', 'proceedings.f': '01/01/2004', 'proceedings.explain': 'Houston immigration court' },
      ...['Consulate', 'Pre-Flight', 'Port of Entry'].map((notify) => ({ ...marisol, outsideUS: 'yes', notify, 'office.city': 'Tegucigalpa', 'office.state': 'TX', 'office.country': 'Honduras' })),
      { ...marisol, outsideUS: 'yes', notify: 'address', 'foreign.street': 'Colonia Kennedy 5', 'foreign.unit': 'Ste 3', 'foreign.city': 'Tegucigalpa', 'foreign.province': 'FM', 'foreign.postal': '11101', 'foreign.country': 'Honduras' },
      { ...marisol, 'home.unit': 'Flr 2', 'mailing.unit': 'Ste 100', sex: 'male', readsEnglish: 'A', petitionFamily: 'no', uscisAccount: '123412341234', ssn: '123-45-6789', i94: '12345678901', travelDoc: 'TD123' },
      { ...marisol, 'home.unit': 'Apt 3', 'mailing.unit': 'Apt 5', 'foreign.unit': 'Apt 7', outsideUS: 'yes', notify: 'address' },
      { ...marisol, 'home.unit': 'Ste 3', 'mailing.unit': 'Flr 9', 'foreign.unit': 'Flr 1', outsideUS: 'yes', notify: 'address', ...Object.fromEntries(ELIGIBILITY_ITEMS.map((i) => [i.id, 'no'])) },
      ...['Single', 'Divorced', 'Widowed'].map((marital) => ({ ...marisol, marital })),
      { ...marisol, ...helpers },
      { ...marisol, ...helpers, 'prep.same': 'yes', 'prep.statement': 'notAttorney', 'interp.unit': 'Apt 4' },
      { ...marisol, ...helpers, 'prep.statement': 'attorneyNotExtends' },
    ];
    for (const plan of variants.map(planI918)) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) expect(index.get(name), name).toBeInstanceOf(PDFCheckBox);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
      for (const name of Object.keys(plan.select)) expect(index.get(name), name).toBeInstanceOf(PDFDropdown);
    }
    const rich = planI918(variants[1]);
    expect(rich.text['P4_Line11a_FamilyName[1]']).toBe('Family 5');
    expect(rich.text['P4_Line6a_FamilyName[1]']).toBe('Family 4');
    expect(rich.text['P3_Line3b_DateOfBirth[0]']).toBe('01/01/2012');
    expect(rich.notes.map((n) => n.item)).toEqual(['2', '8-10', '1.a']);
    expect(rich.notes[2].page).toBe('3');
    expect(planI918(variants[2]).notes[0]).toMatchObject({ page: '2', part: '2', item: '7' });
  });

  it('writes the answers into the official form', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI918(template, marisol))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    const checked = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    expect(text('Pt1Line1a_FamilyName[0]')).toBe('Ramirez');
    expect(text('Pt1Line1a_FamilyName[1]')).toBe('Ramirez');
    expect(text('P1_Line2a_OtherFamilyName[0]')).toBe('Ortega');
    expect(text('P1_Line3b_AptSteFlrNumber[0]')).toBe('12');
    expect(checked('P1_Line3b_Unit[2]')).toBe(true);
    expect(text('P1_Line4a_InCareofName[0]')).toBe('Casa de Esperanza');
    expect((f.get('P1_Line4e_State[0]') as PDFDropdown).getSelected()).toEqual(['TX']);
    expect(text('P1_Line5_AlienNumber[1]')).toBe('098765432');
    expect(checked('P1_Line8_checkboxes[3]')).toBe(true);
    expect(checked('P1_Line9_checkboxes[0]')).toBe(true);
    expect(text('P1_Line17_DateOfBirth[0]')).toBe('02/10/2014');
    expect(text('P1_Line21_DateOfLastEntry[0]')).toBe('EWI');
    expect(checked('P2_Line4_chbxyesno[0]')).toBe(true);
    expect(checked('P2_Line6_chbxyesno[1]')).toBe(true);
    // Item 7.a's No is the first box.
    expect(checked('Pt2Line7a_chbxyesno[0]')).toBe(true);
    expect(checked('P3_29c_chbxyesno[1]')).toBe(true);
    expect(text('P4_Line6b_GivenName[0]')).toBe('Sofia');
    expect(checked('P4_26_chbxyesno[0]')).toBe(true);
    expect(checked('P5_Line1_ReadCheckbox[0]')).toBe(true);
    expect(text('P5_Line1b_Language[0]')).toBe('Spanish');
    expect(text('P5_Line2_Attorney[0]')).toBe('Laura Mendez');
    expect(text('P5_Line5_SafePhoneNumber3[0]')).toBe('7135550144');
    expect(text('P5_Line6_EmailAddress[0]')).toBe('marisol.r@example.com');
    expect(text('P5_Line7a_Signature[0]')).toBe('');
    expect(text('P8_Line3d_AdditionalInfo[0]')).toBe('');
  });

  it('fills the interpreter and preparer parts', async () => {
    const read = async (a: Answers) => {
      const f = fieldIndex((await PDFDocument.load(await fillI918(template, a))).getForm());
      return { text: (n: string) => (f.get(n) as PDFTextField).getText() ?? '', checked: (n: string) => (f.get(n) as PDFCheckBox).isChecked() };
    };
    let { text, checked } = await read({ ...marisol, ...helpers });
    expect(text('P6_Line1a_InterpretersFamilyName[0]')).toBe('Gomez');
    expect(checked('Pt6Line3_Unit[0]')).toBe(true);
    expect(text('Pt6Line3_AptSteFlrNumber[0]')).toBe('210');
    expect(text('P6_Line4_InterpretersDaytimeTelephoneNumber3[1]')).toBe('7135550101');
    expect(text('Part7_Line6_Language[0]')).toBe('Spanish');
    expect(text('P7_Line1a_PreparersFamilyName[0]')).toBe('Lee');
    expect(checked('Pt7Line3_Unit[1]')).toBe(true);
    expect(text('P7_Line5_PreparersFaxNumber3[0]')).toBe('50495550101');
    expect(checked('P7_Line7_Checkbox[1]')).toBe(true);
    expect(checked('P7_Line7_Extend[1]')).toBe(true);
    expect(checked('P7_Line7_Extend[0]')).toBe(false);
    expect(text('P7_Line8a_InterpretersSignature[0]')).toBe('');
    ({ text, checked } = await read({ ...marisol, ...helpers, 'prep.same': 'yes', 'prep.statement': 'attorneyNotExtends' }));
    expect(text('P7_Line1b_PreparersGivenName[0]')).toBe('Rosa');
    expect(checked('Pt7Line3_Unit[0]')).toBe(true);
    expect(checked('P7_Line7_Extend[0]')).toBe(true);
    ({ text } = await read(marisol));
    expect(text('P6_Line1a_InterpretersFamilyName[0]')).toBe('');
  });

  it('runs a long Part 3 explanation on into the next Part 8 blocks', async () => {
    const long = Array.from({ length: 60 }, (_, i) => `Sentence ${i + 1} about the arrest in Austin and the dismissed charge.`).join(' ');
    const a: Answers = { ...marisol, 'p3.1b': 'yes', 'arrest1.why': 'Theft', 'arrest.more1': 'no', 'processing.explain': long };
    const f = fieldIndex((await PDFDocument.load(await fillI918(template, a))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    expect(text('P8_Line3c_ItemNumber[0]')).toBe('1.b');
    expect(text('P8_Line3a_PageNumber[0]')).toBe('3');
    expect(text('P8_Line3d_AdditionalInfo[0]')).toMatch(/^Part 3, Item 1\.b: Sentence 1/);
    expect(text('P8_Line4c_ItemNumber[0]')).toBe('1.b');
    expect(text('P8_Line4d_AdditionalInfo[0]')).not.toBe('');
  });
});
