import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { fieldIndex, optionBoxes } from './common';
import { fillI130A, planI130A } from './i130aPdf';

const template = readFileSync(new URL('../../public/forms/i-130a.pdf', import.meta.url));

/** The husband in the I-130 example, filling in his I-130A. */
export const spouseBeneficiary: Answers = {
  'name.family': 'Ruiz',
  'name.given': 'Carlos',
  aNumber: 'A098765432',
  'home1.street': '1234 Main St',
  'home1.unit': 'Apt 4B',
  'home1.city': 'Los Angeles',
  'home1.state': 'CA',
  'home1.zip': '90011',
  'home1.country': 'United States',
  'home1.from': '02/14/2020',
  'home.more': 'yes',
  'home2.street': 'Calle 5 #20',
  'home2.city': 'Monterrey',
  'home2.province': 'Nuevo Leon',
  'home2.postal': '64000',
  'home2.country': 'Mexico',
  'home2.from': '01/01/2010',
  'home2.to': '01/09/2019',
  'abroad.street': 'Calle 5 #20',
  'abroad.city': 'Monterrey',
  'abroad.province': 'Nuevo Leon',
  'abroad.country': 'Mexico',
  'abroad.from': '01/01/2010',
  'abroad.to': '01/09/2019',
  'parent1.family': 'Ruiz',
  'parent1.given': 'Pedro',
  'parent1.sex': 'male',
  'parent1.birthCity': 'Saltillo',
  'parent1.birthCountry': 'Mexico',
  'parent1.city': 'Monterrey',
  'parent1.country': 'Mexico',
  'parent2.family': 'Vega',
  'parent2.given': 'Rosa',
  'parent2.sex': 'female',
  'parent2.dob': '04/04/1960',
  'parent2.birthCity': 'Monterrey',
  'parent2.birthCountry': 'Mexico',
  'parent2.city': 'deceased',
  'job1.name': 'Unemployed',
  'job.more': 'yes',
  'job2.name': 'Taller Ruiz',
  'job2.city': 'Monterrey',
  'job2.country': 'Mexico',
  'job2.occupation': 'Mechanic',
  'job2.from': '01/01/2012',
  'job2.to': '12/31/2018',
  'abroadJob.has': 'no',
  phone: '213 555 0188',
  readsEnglish: 'interpreter',
  fluentLanguage: 'Spanish',
};

/** Someone interpreted and someone else prepared the form. */
const helped: Answers = {
  ...spouseBeneficiary,
  readsEnglish: 'interpreter',
  preparer: 'yes',
  'preparer.name': 'Luis Ortega',
  'interp.family': 'Ríos',
  'interp.given': 'Ana',
  'interp.business': 'Ayuda Legal',
  'interp.street': '10 Elm St',
  'interp.unit': 'Apt 3',
  'interp.city': 'Dallas',
  'interp.state': 'TX',
  'interp.zip': '75201',
  'interp.country': 'United States',
  'interp.phone': '214 555 0100',
  'interp.mobile': '214 555 0101',
  'interp.email': 'ana@example.com',
  'interp.language': 'Spanish',
  'prep.family': 'Ortega',
  'prep.given': 'Luis',
  'prep.business': 'Ortega Law',
  'prep.street': '22 Calle Sol',
  'prep.unit': 'Flr 2',
  'prep.city': 'Tijuana',
  'prep.province': 'Baja California',
  'prep.postal': '22000',
  'prep.country': 'Mexico',
  'prep.phone': '664 555 0102',
  'prep.mobile': '664 555 0103',
  'prep.email': 'luis@example.com',
  'prep.statement': 'attorneyNotExtends',
};

/** Every preparer's statement, with the same person or someone else preparing. */
const helpVariants: Answers[] = ['notAttorney', 'attorneyExtends', 'attorneyNotExtends'].flatMap((statement) => [
  { ...helped, 'prep.statement': statement, 'interp.unit': 'Ste 1', 'prep.unit': 'Apt 2', 'prep.state': 'CA', 'prep.zip': '92101' },
  { ...helped, 'prep.statement': statement, 'prep.same': 'yes' },
]);

describe('I-130A PDF', () => {
  it('plans only fields that exist, with the right kind', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    const variants: Answers[] = [
      spouseBeneficiary,
      { ...spouseBeneficiary, readsEnglish: 'yes', 'abroadJob.has': 'yes', 'abroadJob.name': 'X', 'abroadJob.unit': 'Ste 2', 'abroadJob.state': 'TX', 'home2.unit': 'Flr 3', 'home2.state': 'NY', 'abroad.unit': 'Apt 1', 'job2.state': 'CA', 'job1.state': 'CA' },
      ...helpVariants,
    ];
    for (const plan of variants.map(planI130A)) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) expect(index.get(name), name).toBeInstanceOf(PDFCheckBox);
      for (const name of Object.keys(plan.select)) expect(index.get(name), name).toBeInstanceOf(PDFDropdown);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
    }
  });

  it('writes the answers into the official form', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI130A(template, spouseBeneficiary))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText();
    const on = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    expect(text('Pt1Line1_AlienNumber[0]')).toBe('098765432');
    expect(text('Pt1Line3a_FamilyName[0]')).toBe('Ruiz');
    expect(text('Pt1Line3a_FamilyName[1]')).toBe('Ruiz');
    expect(on('Pt1Line4b_Unit[0]')).toBe(true); // APT
    expect((f.get('Pt1Line4d_State[0]') as PDFDropdown).getSelected()).toEqual(['CA']);
    expect(text('Pt1Line5b_DateTo[0]')).toBe('PRESENT');
    expect(text('Pt1Line6f_Province[0]')).toBe('Nuevo Leon');
    expect(text('Pt1Line8f_Country[0]')).toBe('Mexico');
    expect(text('Pt1Line9b_DateTo[0]')).toBe('01/09/2019');
    expect(text('Pt1Line12CityTownOfBirth[0]')).toBe('Saltillo'); // Parent 1, Item 13
    expect(text('Pt1Line14_CountryofBirth[0]')).toBe('Monterrey'); // Parent 1, Item 15: city of residence
    expect(on('Pt1Line12_Male[0]') && on('Pt1Line19_Female[0]')).toBe(true);
    expect(text('Pt1Line20_CityTownVillageofRes[0]')).toBe('deceased');
    expect(text('Pt2Line1_EmployerOrCompName[0]')).toBe('Unemployed');
    expect(text('Pt2Line4b_DateTo[0]')).toBe('PRESENT');
    expect(text('Pt2Line7_Occupation[0]')).toBe('Mechanic');
    expect(text('Pt3Line1_EmployerOrCompName[0]')).toBeUndefined();
    expect(on('Pt4Line1Checkbox[0]')).toBe(true); // B: interpreter
    expect(text('Pt4Line3_DaytimePhoneNumber1[0]')).toBe('2135550188');
    expect(text('Pt4Line6a_Signature[0]')).toBeUndefined();
  });

  it('writes the interpreter and the preparer', async () => {
    const filled = async (a: Answers) => fieldIndex((await PDFDocument.load(await fillI130A(template, a))).getForm());
    const f = await filled(helped);
    const text = (n: string) => (f.get(n) as PDFTextField).getText();
    const on = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    expect(on('Pt4_Checkbox[0]')).toBe(true);
    expect(text('Pt4Line2_RepresentativeName[0]')).toBe('Luis Ortega');
    expect(text('Pt5Line1a_InterpreterFamilyName[0]')).toBe('Rios');
    expect(on('Pt5Line3b_Unit[0]')).toBe(true); // Apt
    expect(text('Pt5Line4_InterpreterDaytimeTelephone[1]')).toBe('2145550101'); // mobile
    expect(text('Pt5_NameofLanguage[0]')).toBe('Spanish');
    expect(text('Pt5Line6a_Signature[0]')).toBeUndefined();
    expect(text('Pt6Line1a_PreparerFamilyName[0]')).toBe('Ortega');
    expect(on('Pt6Line3b_Unit[2]')).toBe(true); // Flr
    expect(text('Pt6Line3f_Province[0]')).toBe('Baja California');
    expect(text('Pt6Line5_PreparerFaxNumber[0]')).toBe('6645550103'); // printed "Mobile"
    expect(on('Pt6Line7_Checkbox[1]') && on('Pt6Line7b_Checkbox[1]')).toBe(true); // attorney, does not extend
    expect(text('Pt6Line8a_Signature[0]')).toBeUndefined();
    const same = await filled({ ...helped, 'prep.same': 'yes', 'prep.statement': 'notAttorney' });
    expect((same.get('Pt6Line1a_PreparerFamilyName[0]') as PDFTextField).getText()).toBe('Rios');
    expect((same.get('Pt6Line7_Checkbox[0]') as PDFCheckBox).isChecked()).toBe(true);
    expect(((await filled(spouseBeneficiary)).get('Pt5Line1a_InterpreterFamilyName[0]') as PDFTextField).getText()).toBeUndefined();
  });
});
