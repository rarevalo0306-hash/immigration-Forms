import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { CRIME_ITEMS } from '../forms/i129f';
import { fieldIndex, optionBoxes } from './common';
import { fillI129F, planI129F, unitBox } from './i129fPdf';

const template = readFileSync(new URL('../../public/forms/i-129f.pdf', import.meta.url));

/** Daniel, a U.S. citizen in Houston, petitioning for his fiancée Lucía in Bogotá. */
export const petitioner: Answers = {
  classification: 'A',
  'pet.ssn': '123-45-6789',
  'pet.family': 'Smith',
  'pet.given': 'Daniel',
  'pet.otherName.has': 'no',
  'pet.mailing.street': '500 Elm St',
  'pet.mailing.unit': 'Apt 12',
  'pet.mailing.city': 'Houston',
  'pet.mailing.state': 'TX',
  'pet.mailing.zip': '77002',
  'pet.mailing.country': 'United States',
  'pet.mailingSame': 'yes',
  'pet.home1.from': '03/01/2019',
  'pet.home2Has': 'no',
  'pet.job1.name': 'Acme Energy',
  'pet.job1.city': 'Houston',
  'pet.job1.state': 'TX',
  'pet.job1.country': 'United States',
  'pet.job1.occupation': 'Engineer',
  'pet.job1.from': '06/01/2018',
  'pet.job2Has': 'no',
  'pet.sex': 'male',
  'pet.dob': '04/04/1990',
  'pet.marital': 'S',
  'pet.birthCity': 'Austin',
  'pet.birthState': 'Texas',
  'pet.birthCountry': 'United States',
  'pet.parent1.family': 'Smith',
  'pet.parent1.given': 'John',
  'pet.parent1.sex': 'male',
  'pet.parent1.birthCountry': 'United States',
  'pet.parent1.city': 'Austin',
  'pet.parent1.country': 'United States',
  'pet.parent2.family': 'Smith',
  'pet.parent2.given': 'Ana',
  'pet.parent2.dob': '01/01/1962',
  'pet.parent2.sex': 'female',
  'pet.parent2.birthCountry': 'Mexico',
  'pet.parent2.city': 'Austin',
  'pet.parent2.country': 'United States',
  'pet.prevMarried': 'no',
  'pet.citizenVia': 'A',
  'pet.priorPetition': 'no',
  'pet.kids': 'no',
  'pet.res1.state': 'TX',
  'pet.res1.country': 'United States',
  'ben.family': 'Gómez',
  'ben.given': 'Lucía',
  'ben.dob': '09/09/1993',
  'ben.sex': 'female',
  'ben.marital': 'S',
  'ben.birthCity': 'Medellin',
  'ben.birthCountry': 'Colombia',
  'ben.citizenship': 'Colombia',
  'ben.otherName.has': 'no',
  'ben.mailing.street': 'Calle 80 # 12-34',
  'ben.mailing.city': 'Bogota',
  'ben.mailing.province': 'Cundinamarca',
  'ben.mailing.postal': '110221',
  'ben.mailing.country': 'Colombia',
  'ben.mailingSame': 'yes',
  'ben.home1.from': '01/01/2020',
  'ben.home2Has': 'yes',
  'ben.home2.street': 'Carrera 43 # 5-10',
  'ben.home2.city': 'Medellin',
  'ben.home2.country': 'Colombia',
  'ben.home2.from': '01/01/2015',
  'ben.home2.to': '12/31/2019',
  'ben.job1.name': 'Banco Andino',
  'ben.job1.city': 'Bogota',
  'ben.job1.country': 'Colombia',
  'ben.job1.occupation': 'Accountant',
  'ben.job1.from': '02/01/2020',
  'ben.job2Has': 'no',
  'ben.parent1.family': 'Gómez',
  'ben.parent1.given': 'Luis',
  'ben.parent1.dob': '05/05/1960',
  'ben.parent1.sex': 'male',
  'ben.parent1.birthCountry': 'Colombia',
  'ben.parent1.city': 'Medellin',
  'ben.parent1.country': 'Colombia',
  'ben.parent2.family': 'Restrepo',
  'ben.parent2.given': 'Marta',
  'ben.parent2.sex': 'female',
  'ben.parent2.birthCountry': 'Colombia',
  'ben.parent2.city': 'deceased',
  'ben.prevMarried': 'no',
  'ben.everInUS': 'no',
  'ben.kids': 'no',
  'ben.us.street': '500 Elm St',
  'ben.us.unit': 'Apt 12',
  'ben.us.city': 'Houston',
  'ben.us.state': 'TX',
  'ben.us.zip': '77002',
  'ben.abroad.street': 'Calle 80 # 12-34',
  'ben.abroad.city': 'Bogota',
  'ben.abroad.country': 'Colombia',
  'ben.abroad.phone': '3001234567',
  'ben.native.has': 'no',
  related: 'N',
  met: 'Y',
  'met.describe': 'We met in Bogota in June 2025 and again in Houston in December 2025.',
  imb: 'no',
  'consulate.city': 'Bogota',
  'consulate.country': 'Colombia',
  'crime.1': 'no',
  'crime.2a': 'no',
  'crime.2b': 'no',
  'crime.2c': 'no',
  'crime.4a': 'no',
  waiver: 'D',
  ethnicity: 'notHispanic',
  race: ['WH'] as unknown as string,
  heightFeet: '6',
  heightInches: '1',
  weight: '185',
  eyes: 'GR',
  hair: 'BR',
  phone: '713 555 0100',
  email: 'daniel@example.com',
};

/** Someone interpreted and someone else prepared the form. */
const helped: Answers = {
  ...petitioner,
  readsEnglish: 'B',
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

describe('I-129F PDF', () => {
  it('plans only fields that exist, with the right kind', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    const full: Answers = {
      ...petitioner,
      classification: 'B',
      filedI130: 'yes',
      'pet.aNumber': '1',
      'pet.uscisAccount': '123456789012',
      'pet.otherName.has': 'yes',
      'pet.otherName.family': 'S',
      'pet.mailing.careOf': 'X',
      'pet.mailing.province': 'P',
      'pet.mailing.postal': '1',
      'pet.mailingSame': 'no',
      'pet.home1.street': '1 A',
      'pet.home1.unit': 'Ste 2',
      'pet.home1.state': 'CA',
      'pet.home1.province': 'P',
      'pet.home1.postal': '1',
      'pet.home1.country': 'US',
      'pet.home2Has': 'yes',
      'pet.home2.street': '2 B',
      'pet.home2.unit': 'Flr 3',
      'pet.home2.state': 'NY',
      'pet.home2.province': 'P',
      'pet.home2.postal': '2',
      'pet.home2.country': 'US',
      'pet.job1.unit': 'Ste 1',
      'pet.job1.province': 'P',
      'pet.job1.postal': '1',
      'pet.job2Has': 'yes',
      'pet.job2.name': 'Old Co',
      'pet.job2.unit': 'Apt 1',
      'pet.job2.state': 'FL',
      'pet.job2.province': 'P',
      'pet.job2.postal': '1',
      'pet.job2.country': 'US',
      'pet.job2.to': '01/01/2018',
      'pet.marital': 'D',
      'pet.prevMarried': 'yes',
      'pet.prevSpouse.family': 'P',
      'pet.prevSpouse.ended': '01/01/2015',
      'pet.citizenVia': 'B',
      'pet.certificate': 'yes',
      'pet.cert.number': '123',
      'pet.cert.place': 'Houston',
      'pet.cert.date': '01/01/2010',
      'pet.priorPetition': 'yes',
      'pet.prior.aNumber': '2',
      'pet.prior.family': 'Q',
      'pet.prior.date': '01/01/2016',
      'pet.prior.result': 'denied',
      'pet.kids': 'yes',
      'pet.kid1.age': '5',
      'pet.kid2.age': '7',
      'pet.res2.state': 'CA',
      'pet.res2.country': 'United States',
      'ben.aNumber': '3',
      'ben.ssn': '1',
      'ben.marital': 'W',
      'ben.otherName.has': 'yes',
      'ben.otherName.family': 'R',
      'ben.mailing.careOf': 'Y',
      'ben.mailing.unit': 'Apt 2',
      'ben.mailing.state': 'TX',
      'ben.mailing.zip': '77002',
      'ben.mailingSame': 'no',
      'ben.home1.street': '3 C',
      'ben.home1.unit': 'Apt 4',
      'ben.home1.state': 'TX',
      'ben.home1.province': 'P',
      'ben.home1.postal': '1',
      'ben.home1.country': 'CO',
      'ben.home2.unit': 'Ste 5',
      'ben.home2.state': 'TX',
      'ben.home2.province': 'P',
      'ben.home2.postal': '1',
      'ben.job1.unit': 'Flr 1',
      'ben.job1.state': 'TX',
      'ben.job1.province': 'P',
      'ben.job1.postal': '1',
      'ben.job2Has': 'yes',
      'ben.job2.name': 'Old',
      'ben.job2.unit': 'Apt 1',
      'ben.job2.state': 'TX',
      'ben.job2.province': 'P',
      'ben.job2.postal': '1',
      'ben.job2.country': 'CO',
      'ben.job2.to': '01/01/2020',
      'ben.prevMarried': 'yes',
      'ben.prevSpouse.family': 'T',
      'ben.prevSpouse.ended': '01/01/2018',
      'ben.everInUS': 'yes',
      'ben.inUSNow': 'yes',
      'ben.entry.as': 'visitor',
      'ben.entry.i94': '12345678901',
      'ben.entry.date': '01/01/2026',
      'ben.entry.until': '07/01/2026',
      'ben.passport': 'AB123',
      'ben.travelDoc': 'X1',
      'ben.passportCountry': 'Colombia',
      'ben.passportExpires': '01/01/2030',
      'ben.kids': 'yes',
      'ben.kid.family': 'G',
      'ben.kid.birthCountry': 'Colombia',
      'ben.kid.dob': '01/01/2015',
      'ben.kid.withBen': 'no',
      'ben.kid.home.street': '4 D',
      'ben.kid.home.unit': 'Ste 1',
      'ben.kid.home.state': 'TX',
      'ben.kid.home.province': 'P',
      'ben.kid.home.postal': '1',
      'ben.kid.home.country': 'CO',
      'ben.us.phone': '7135550000',
      'ben.abroad.unit': 'Apt 9',
      'ben.abroad.province': 'Cundinamarca',
      'ben.abroad.postal': '110221',
      related: 'Y',
      'related.how': 'third cousin',
      met: 'N',
      imb: 'yes',
      'imb.name': 'X',
      'imb.family': 'Y',
      'imb.given': 'Z',
      'imb.org': 'O',
      'imb.website': 'w.co',
      'imb.street': '5 E',
      'imb.unit': 'Flr 2',
      'imb.city': 'Kyiv',
      'imb.province': 'K',
      'imb.postal': '1',
      'imb.country': 'Ukraine',
      'imb.phone': '1234567890',
      ...Object.fromEntries(CRIME_ITEMS.map((i) => [i.id, 'yes'])),
      'crime.battered': ['A', 'B', 'C'] as unknown as string,
      'crime.describe': 'x',
      ethnicity: 'hispanic',
      race: ['WH', 'AS', 'BL', 'AI', 'HW'] as unknown as string,
      mobile: '7135550001',
    };
    const variants: Answers[] = [
      petitioner,
      full,
      ...['A', 'B', 'C'].map((waiver) => ({ ...petitioner, waiver })),
      { ...petitioner, related: 'A', met: 'A', 'pet.citizenVia': 'C', 'pet.certificate': 'no', 'pet.marital': 'M', 'ben.marital': 'M' },
      ...['BN', 'BL', 'HA', 'GN', 'BU', 'GR', 'MA', 'PN', 'UN'].map((eyes) => ({ ...petitioner, eyes })),
      ...['BL', 'BR', 'BN', 'GR', 'WH', 'RD', 'SA', 'NH', 'OT'].map((hair) => ({ ...petitioner, hair })),
      ...helpVariants,
    ];
    for (const plan of variants.map(planI129F)) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) expect(index.get(name), name).toBeInstanceOf(PDFCheckBox);
      for (const name of Object.keys(plan.select)) expect(index.get(name), name).toBeInstanceOf(PDFDropdown);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
      for (const [base, kind] of plan.unit) expect(() => unitBox(index, base, kind), `${base}=${kind}`).not.toThrow();
    }
  });

  it('writes the answers into the official form', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI129F(template, petitioner))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText();
    const checked = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    expect(checked('Pt1Line4a_Checkboxes[0]')).toBe(true); // K-1
    expect(text('Pt1Line6b_GivenName[1]')).toBe('Daniel');
    // The leftmost box, printed "Apt.", exports "FLR" on this edition.
    expect(checked('Pt1Line8_Unit[1]')).toBe(true);
    expect(checked('Pt1Line9_Unit[1]')).toBe(true);
    expect(checked('Pt2Line45b_Unit[2]')).toBe(true);
    expect(checked('Pt1Line8j_Checkboxes[0]')).toBe(true); // Yes
    expect(text('Pt1Line9_StreetNumberName[0]')).toBe('500 Elm St');
    expect(text('Pt1Line10b_ToFrom[0]')).toBe('PRESENT');
    expect(text('Pt1Line13_NameofEmployer[0]')).toBe('Acme Energy');
    expect(text('Pt1Line16b_ToFrom[0]')).toBe('PRESENT');
    expect(checked('Pt1Line21_Checkbox[0]')).toBe(true); // Male
    expect(text('Pt1Line31_CityTownOfBirth[0]')).toBe('Austin');
    expect(checked('Pt1Line40_Checkbox[0]')).toBe(true); // birth in the U.S.
    expect((f.get('Pt1Line50a_State[0]') as PDFDropdown).getSelected()[0].trim()).toBe('TX');
    expect(text('Pt2Line1a_FamilyName[0]')).toBe('Gomez');
    expect(text('Pt2Line12_CityOrTown[0]')).toBe('Bogota');
    expect(text('Pt2Line14_CityOrTown[0]')).toBe('Medellin');
    expect(text('Pt2Line15b_ToFrom[0]')).toBe('12/31/2019');
    expect(text('Pt1Line11_DateofBirth[0]')).toBe('05/05/1960'); // beneficiary's Parent 1
    expect(text('Pt2Line33a_CityTownOfBirth[0]')).toBe('deceased');
    expect(text('Pt2Line45c_CityOrTown[0]')).toBe('Houston');
    expect(text('Pt2Line47_Country[0]')).toBe('Colombia');
    expect(checked('Pt2Line51_Checkboxes[1]')).toBe(true); // No
    expect(checked('Pt2Line53_Checkboxes[2]')).toBe(true); // Yes
    expect(text('Pt2Line62a_CityTown[0]')).toBe('Bogota');
    expect(checked('Pt3Line1_Checkboxes[1]')).toBe(true);
    expect(checked('Pt3Line5_Checkboxes[2]')).toBe(true); // 5.d
    expect(checked('Pt4Line2_Checkbox[2]')).toBe(true); // White
    expect(checked('Pt4Line5_Checkbox[1]')).toBe(true); // printed "Gray"
    expect(checked('Pt4Line6_HairColor[7]')).toBe(true); // Brown
    expect(text('Pt5Line1_DaytimePhoneNumber1[0]')).toBe('7135550100');
  });

  it('writes the interpreter and the preparer', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI129F(template, helped))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText();
    expect(text('Pt6Line1_InterpreterFamilyName[0]')).toBe('Rios');
    expect(text('Pt6Line2_NameofBusinessorOrgName[0]')).toBe('Ayuda Legal');
    expect(text('Pt6Line4_InterpreterDaytimeTelephone[1]')).toBe('2145550101'); // mobile
    expect(text('Pt6_NameOfLanguage[0]')).toBe('Spanish');
    expect(text('Pt6Line6_Signature[0]')).toBeUndefined();
    expect(text('Pt7Line1_PreparerFamilyName[0]')).toBe('Ortega');
    expect(text('Pt7Line4_PreparerMobileNumber[0]')).toBe('6645550103');
    expect(text('Pt7Line5_Email[0]')).toBe('luis@example.com');
    expect(text('Pt7Line6_SignatureofPreparer[0]')).toBeUndefined();
    expect(planI129F({ ...helped, 'prep.same': 'yes' }).text['Pt7Line1_PreparerFamilyName[0]']).toBe('Ríos');
    expect(planI129F(petitioner).text['Pt6Line1_InterpreterFamilyName[0]']).toBeUndefined();
  });
});
