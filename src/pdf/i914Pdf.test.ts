import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { ELIGIBILITY_ITEMS, PROCESSING_ITEMS } from '../forms/i914';
import { CLASSES_OF_ADMISSION } from '../forms/classOfAdmission';
import { fillI914, i914Lookup, planI914, processingBase, processingPage, statusOption } from './i914Pdf';

const template = readFileSync(new URL('../../public/forms/i-914.pdf', import.meta.url));

/** Yesenia, recruited in Guatemala for a restaurant job in Houston and forced to work there, who reported it to HSI. */
export const yesenia: Answers = {
  filingType: 'A',
  'name.family': 'Xocop',
  'name.given': 'Yesenia',
  'name.middle': 'Maribel',
  'otherName.more0': 'yes',
  'otherName1.family': 'López',
  'otherName1.given': 'Maria',
  'otherName.more1': 'no',
  'home.street': '8800 Bellaire Blvd',
  'home.unit': 'Apt 214',
  'home.city': 'Houston',
  'home.state': 'TX',
  'home.zip': '77036',
  mailingSame: 'no',
  'mailing.careOf': 'Casa Libre Legal Services',
  'mailing.street': '2100 Travis St',
  'mailing.unit': 'Ste 400',
  'mailing.city': 'Houston',
  'mailing.state': 'TX',
  'mailing.zip': '77002',
  aNumber: 'A212345678',
  sex: 'female',
  dob: '04/11/1996',
  marital: 'Single',
  birthCity: 'Quetzaltenango',
  birthProvince: 'Quetzaltenango',
  birthCountry: 'Guatemala',
  citizenship: 'Guatemala',
  passport: '254813697',
  passportCountry: 'Guatemala',
  passportIssued: '01/15/2019',
  passportExpires: '01/14/2024',
  'lastEntry.city': 'Laredo',
  'lastEntry.state': 'TX',
  'lastEntry.date': '03/02/2020',
  i94: '69432178A01',
  currentStatus: 'B2 - TEMPORARY VISITOR FOR PLEASURE',
  'p3.1': 'yes',
  'p3.2a': 'yes',
  'p3.2b': 'no',
  'p3.3': 'yes',
  'p3.4': 'yes',
  reported: 'yes',
  'report.agency': 'Homeland Security Investigations, Houston',
  'report.street': '126 Northpoint Dr',
  'report.city': 'Houston',
  'report.state': 'TX',
  'report.zip': '77060',
  'report.phone': '281 555 0170',
  'report.case': 'HO13QR22HO0041',
  minor: 'no',
  complied: 'yes',
  firstEntry: 'yes',
  traffickingEntry: 'yes',
  'arrival.explain': 'I came on a visitor visa arranged by the recruiter, who kept my passport when I arrived.',
  ead: 'yes',
  petitionFamily: 'no',
  ...Object.fromEntries(PROCESSING_ITEMS.map((i) => [i.id, 'no'])),
  hasSpouse: 'no',
  'child.more0': 'yes',
  'child1.family': 'Xocop',
  'child1.given': 'Mateo',
  'child1.dob': '09/30/2016',
  'child1.birthCountry': 'Guatemala',
  'child1.city': 'Quetzaltenango',
  'child1.country': 'Guatemala',
  'child.more1': 'no',
  readsEnglish: 'B',
  fluentLanguage: 'Spanish',
  preparer: 'yes',
  'preparer.name': 'Ana Beltran',
  phone: '832 555 0142',
  safePhone: '713 555 0190',
  email: 'yesenia.x@example.com',
};

/** Yesenia's caseworker interpreted and a legal aid attorney prepared the application: Parts 7 and 8. */
const helped: Answers = {
  ...yesenia,
  'interp.family': 'Gómez',
  'interp.given': 'Rosa',
  'interp.business': 'Houston Survivor Services',
  'interp.street': '2200 Fannin St',
  'interp.unit': 'Ste 210',
  'interp.city': 'Houston',
  'interp.state': 'TX',
  'interp.zip': '77002',
  'interp.country': 'United States',
  'interp.phone': '(713) 555-0101',
  'interp.mobile': '1 713 555 0102',
  'interp.email': 'rosa@example.com',
  'interp.language': 'Spanish',
  'prep.same': 'no',
  'prep.family': 'Beltrán',
  'prep.given': 'Ana',
  'prep.business': 'Gulf Coast Legal Aid',
  'prep.street': '1415 Fannin St',
  'prep.unit': 'Floor 3',
  'prep.city': 'Houston',
  'prep.state': 'TX',
  'prep.zip': '77002',
  'prep.country': 'United States',
  'prep.phone': '713 555 0199',
  'prep.mobile': '713 555 0198',
  'prep.email': 'ana@example.com',
  'prep.statement': 'attorneyExtends',
};

const child = (i: number): Answers => ({
  [`child${i}.family`]: `Family ${i}`,
  [`child${i}.given`]: `Given ${i}`,
  [`child${i}.middle`]: `M${i}`,
  [`child${i}.dob`]: '01/01/2012',
  [`child${i}.birthCountry`]: 'Mexico',
  [`child${i}.city`]: 'Dallas',
  [`child${i}.state`]: 'TX',
  [`child${i}.country`]: 'United States',
  [`child.more${i}`]: 'yes',
});

describe('I-914 PDF', () => {
  it('names Part 4 items by position', () => {
    expect(processingBase('p4.1a')).toBe('Dq1a');
    expect(processingBase('p4.2d')).toBe('Dq3d');
    expect(processingBase('p4.4b3')).toBe('Dq5b3');
    expect(processingBase('p4.7')).toBe('Dq8');
    expect(processingBase('p4.8a')).toBe('Dq9a');
    expect(processingBase('p4.12')).toBe('Dq13');
    expect(processingBase('p4.17')).toBe('Dq18');
    expect(processingBase('p4.18')).toBe('Dq20');
    expect(processingBase('p4.20')).toBe('Dq22');
    expect(processingBase('p4.21c')).toBe('Dq23c');
    expect(processingPage('p4.2a')).toBe('4');
    expect(processingPage('p4.3a')).toBe('5');
    expect(processingPage('p4.8a')).toBe('6');
    expect(processingPage('p4.21a')).toBe('7');
  });

  it('plans only fields that exist, with the right kind', async () => {
    const form = (await PDFDocument.load(template)).getForm();
    const get = i914Lookup(form);
    const allYes = Object.fromEntries([...ELIGIBILITY_ITEMS, ...PROCESSING_ITEMS].map((i) => [i.id, 'yes']));
    const arrests: Answers = { 'arrest.more1': 'yes' };
    for (const i of [1, 2]) Object.assign(arrests, { [`arrest${i}.why`]: 'Prostitution', [`arrest${i}.date`]: '05/05/2021', [`arrest${i}.where`]: 'Houston, TX, USA', [`arrest${i}.outcome`]: 'Dismissed' });
    const variants: Answers[] = [
      yesenia,
      {
        ...yesenia,
        ...allYes,
        ...arrests,
        ...child(1),
        ...child(2),
        ...child(3),
        filingType: 'B',
        priorReceipt: 'EAC2190012345',
        'otherName.more1': 'yes',
        'otherName2.family': 'Perez',
        'otherName2.given': 'Mari',
        'otherName.more2': 'yes',
        'otherName3.family': 'Lopez',
        'otherName3.given': 'Maria',
        hasSpouse: 'yes',
        'spouse.family': 'Tzul',
        'spouse.given': 'Carlos',
        'spouse.dob': '02/02/1990',
        'spouse.birthCountry': 'Guatemala',
        'spouse.city': 'Totonicapan',
        'spouse.country': 'Guatemala',
        'processing.explain': 'The traffickers forced me.',
        reported: 'no',
        'report.circumstances': 'I was afraid of the traffickers.',
        complied: 'no',
        'complied.explain': 'Trauma.',
        firstEntry: 'no',
        'entry.date': '03/02/2020',
        'entry.city': 'Laredo',
        'entry.state': 'TX',
        'entry.status': 'B-2',
        'otherEntries.explain': '06/01/2018, Laredo, TX, B-2',
        readsEnglish: 'A',
        preparer: 'no',
        sex: 'male',
        ssn: '123-45-6789',
        uscisAccount: '123412341234',
      },
      ...['Flr 3', 'Ste 9', 'Apt 1'].map((unit) => ({ ...yesenia, 'home.unit': unit, 'mailing.unit': unit, 'report.unit': unit })),
      ...['Married', 'Divorced', 'Widowed'].map((marital) => ({ ...yesenia, marital })),
      ...['EWI - ENTRY WITHOUT INSPECTION', 'UN - UNKNOWN', 'WB - VISITOR FOR BUSINESS - VWPP/VWP'].map((currentStatus) => ({ ...yesenia, currentStatus })),
      helped,
      { ...helped, 'prep.same': 'yes', 'interp.unit': 'Apt 4', 'interp.state': '', 'interp.zip': '', 'interp.province': 'Quetzaltenango', 'interp.postal': '09001', 'interp.country': 'Guatemala' },
      ...['notAttorney', 'attorneyNotExtends'].map((st) => ({ ...helped, 'prep.statement': st })),
    ];
    for (const plan of variants.map(planI914)) {
      for (const name of Object.keys(plan.text)) expect(get(name), name).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) expect(get(name), name).toBeInstanceOf(PDFCheckBox);
      for (const [name, value] of Object.entries(plan.select)) {
        const field = get(name);
        expect(field, name).toBeInstanceOf(PDFDropdown);
        expect((field as PDFDropdown).getOptions().map((o) => o.trim()), `${name}=${value}`).toContain(value);
      }
    }
    // Every class in the shared list exists in Item 20's dropdown.
    const status = (get('P3_Line12g_CurrentNon[0]') as PDFDropdown).getOptions().map((o) => o.trim());
    for (const c of CLASSES_OF_ADMISSION) expect(status, c).toContain(statusOption(c));

    const rich = planI914(variants[1]);
    expect(rich.text['EACNumber[0]']).toBe('2190012345');
    expect(rich.text['Row2[0].Outcomeordisposition[0]']).toBe('Dismissed');
    expect(rich.text['FamilyName[3]']).toBe('Family 3');
    expect(rich.text['CountryofBirth[3]']).toBe('Guatemala');
    expect(rich.check).toContain('Dq20_yes[0]');
    expect(rich.circumstances).toBe('I was afraid of the traffickers.');
    expect(rich.notes.map((n) => n.item)).toEqual(['2', '7', '8', '8-9', '1.A']);
    expect(planI914(yesenia).notes.map((n) => [n.page, n.part, n.item])).toEqual([
      ['3', '3', '5'],
      ['3', '3', '9'],
    ]);
  });

  it('writes the answers into the official form', async () => {
    const a: Answers = { ...yesenia, 'p4.18': 'yes', 'processing.explain': 'The recruiter kept my son in Guatemala.' };
    const get = i914Lookup((await PDFDocument.load(await fillI914(template, a))).getForm());
    const text = (n: string) => (get(n) as PDFTextField).getText() ?? '';
    const checked = (n: string) => (get(n) as PDFCheckBox).isChecked();
    expect(checked('CheckBox1[0]')).toBe(true);
    expect(text('Part2_FamilyName[0]')).toBe('Xocop');
    expect(text('Part2_FamilyName[1]')).toBe('Xocop');
    expect(text('OtherNameLastName1[0]')).toBe('Lopez');
    expect(text('P1_Line6__AptSteFlrNumber[0]')).toBe('214');
    expect(checked('P1_Line6_Unit[0]')).toBe(true);
    expect(checked('P1_Line8_Unit[1]')).toBe(true);
    expect(text('P1_Line8_InCareofName[0]')).toBe('Casa Libre Legal Services');
    expect((get('P1_Line8_State[0]') as PDFDropdown).getSelected()).toEqual(['TX']);
    expect(text('Part2_Line5_AlienRegistrationNumber[1]')).toBe('212345678');
    expect(checked('Female[0]')).toBe(true);
    expect(checked('Single[0]')).toBe(true);
    // Item 14 and Item 17 are "Country of citizenship" boxes by name.
    expect(text('P3_Line11_CountryOfCitizenshipOrNationality[1]')).toBe('Guatemala');
    expect(text('P3_Line11_CountryOfCitizenshipOrNationality[2]')).toBe('Laredo');
    expect(text('P3_Line12b_ArrivalDeparture[0]')).toBe('69432178A01');
    expect((get('P3_Line12g_CurrentNon[0]') as PDFDropdown).getSelected()[0].trim()).toBe('B2 - TEMPORARY VISITOR FOR PLEASURE');
    expect(checked('Q1_yes[0]')).toBe(true);
    expect(checked('Q2b_no[0]')).toBe(true);
    expect(checked('Q3_yes[0]')).toBe(true);
    expect(checked('Q5_yes[0]')).toBe(true);
    expect(text('P3_Line5_CaseNumber[0]')).toBe('HO13QR22HO0041');
    expect(text('P3_Line5_DaytimePhoneNumber[0]')).toBe('2815550170');
    expect(checked('Q8_yes[0]')).toBe(true);
    expect(checked('Q11_no[0]')).toBe(true);
    // Item 18 is "Dq20"; Item 17 is "Dq18".
    expect(checked('Dq20_yes[0]')).toBe(true);
    expect(checked('Dq18_no[0]')).toBe(true);
    expect(checked('Dq23c_no[0]')).toBe(true);
    expect(text('FamilyName[1]')).toBe('Xocop');
    expect(text('CountryofBirth1[0]')).toBe('Guatemala');
    expect(text('CountryofBirth[4]')).toBe('Guatemala');
    expect(checked('Pt12Line1_Checkbox[1]')).toBe(true);
    expect(text('Pt12Line1b_Language[0]')).toBe('Spanish');
    expect(text('Pt12Line2_RepresentativeName[0]')).toBe('Ana Beltran');
    expect(text('Pt12Line6_MobileNumber1[0]')).toBe('7135550190');
    expect(text('Pt12Line8_Signature[0]')).toBe('');
    expect(text('P10_Line2c_ItemNumber[0]')).toBe('5');
    expect(text('P10_Line2d_AdditionalInfo[0]')).toMatch(/^Law enforcement agency and office: Homeland Security/);
    expect(text('P10_Line3c_ItemNumber[0]')).toBe('9');
    expect(text('P10_Line4a_PageNumber[0]')).toBe('6');
    expect(text('P10_Line4c_ItemNumber[0]')).toBe('18');
  });

  it('fills the interpreter and preparer parts', async () => {
    const get = i914Lookup((await PDFDocument.load(await fillI914(template, helped))).getForm());
    const text = (n: string) => (get(n) as PDFTextField).getText() ?? '';
    const checked = (n: string) => (get(n) as PDFCheckBox).isChecked();
    expect(text('Pt13Line1_InterpreterFamilyName[0]')).toBe('Gomez');
    // The unit boxes list STE, APT, FLR.
    expect(checked('Pt13Line3_Unit[0]')).toBe(true);
    expect(text('Pt13Line3_AptSteFlrNumber[0]')).toBe('210');
    expect((get('Pt13Line3_State[0]') as PDFDropdown).getSelected().map((o) => o.trim())).toEqual(['TX']);
    expect(text('Pt12Line5_InterpreterMobileTelephone[0]')).toBe('7135550102');
    expect(text('Pt12_NameofLanguage[0]')).toBe('Spanish');
    expect(text('Pt13Line1_PreparerFamilyName[0]')).toBe('Beltran');
    expect(checked('Pt14Line3_Unit[2]')).toBe(true); // Flr.
    expect(text('Pt13ine5_PreparerFaxNumber[0]')).toBe('7135550198');
    expect(checked('Pt13Line7_Checkbox[1]')).toBe(true); // 7.B
    expect(checked('Pt13Line7b_extends[1]')).toBe(true); // extends
    expect(checked('Pt13Line7b_extends[0]')).toBe(false);
    expect(text('Pt12Line6_Signature[0]')).toBe('');
    expect(text('Pt12Line8_Signature[1]')).toBe('');
  });

  it('moves long Item 5 circumstances to Part 9', async () => {
    const long = Array.from({ length: 30 }, (_, i) => `Sentence ${i + 1} about why I could not report the traffickers.`).join(' ');
    const a: Answers = { ...yesenia, reported: 'no', 'report.circumstances': long };
    const get = i914Lookup((await PDFDocument.load(await fillI914(template, a))).getForm());
    const text = (n: string) => (get(n) as PDFTextField).getText() ?? '';
    expect(text('P3_Line5_Circumstances[0]')).toBe('See Part 9. Additional Information, Part 3, Item 5.');
    expect(text('P10_Line2c_ItemNumber[0]')).toBe('5');
    expect(text('P10_Line2d_AdditionalInfo[0]')).toMatch(/^Circumstances: Sentence 1/);
    expect(text('P10_Line3c_ItemNumber[0]')).toBe('5');

    const short = i914Lookup((await PDFDocument.load(await fillI914(template, { ...yesenia, reported: 'no', 'report.circumstances': 'I was afraid.' }))).getForm());
    expect((short('P3_Line5_Circumstances[0]') as PDFTextField).getText()).toBe('I was afraid.');
  });
});
