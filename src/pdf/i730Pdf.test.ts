import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { optionBoxes } from './common';
import { fillI730, firstFieldIndex, planI730 } from './i730Pdf';

const template = readFileSync(new URL('../../public/forms/i-730.pdf', import.meta.url));

/** José, granted asylum in Los Angeles, petitioning for his wife Marisol, who is still in El Salvador. */
export const jose: Answers = {
  status: 'ASL',
  relationship: 'S',
  'relatives.total': '3',
  'relatives.this': '1',
  'name.family': 'Ramírez',
  'name.given': 'José',
  'name.middle': 'Antonio',
  'home.street': '1450 W Pico Blvd',
  'home.unit': 'Apt 12',
  'home.city': 'Los Angeles',
  'home.state': 'CA',
  'home.zip': '90015',
  'home.country': 'United States',
  mailingSame: 'yes',
  phone: '(213) 555-0147',
  mobile: '(323) 555-0199',
  email: 'jose.ramirez@example.com',
  sex: 'male',
  dob: '07/22/1988',
  birthCountry: 'El Salvador',
  citizenship: 'El Salvador',
  aNumber: 'A209876543',
  ssn: '612-34-5678',
  'otherName.more0': 'no',
  'pet.marriage.date': '12/14/2013',
  'pet.marriage.city': 'San Miguel',
  'pet.marriage.state': 'San Miguel',
  'pet.marriage.country': 'El Salvador',
  'pet.prior.more0': 'no',
  'grant.date': '03/18/2025',
  'grant.city': 'Los Angeles',
  'grant.state': 'CA',
  'ben.name.family': 'Flores',
  'ben.name.given': 'Marisol',
  'ben.name.middle': 'Esperanza',
  'ben.home.street': 'Colonia La Paz, Calle 3 #22',
  'ben.home.city': 'San Miguel',
  'ben.home.province': 'San Miguel',
  'ben.home.country': 'El Salvador',
  'ben.mailingSame': 'yes',
  'ben.phone': '+503 2661 4455',
  'ben.sex': 'female',
  'ben.dob': '05/02/1990',
  'ben.birthCountry': 'El Salvador',
  'ben.citizenship': 'El Salvador',
  'benOtherName.more0': 'yes',
  'benOtherName1.family': 'Flores de Ramírez',
  'benOtherName1.given': 'Marisol',
  'benOtherName.more1': 'no',
  'ben.prior.more0': 'no',
  'ben.location': 'B',
  'ben.consulate.place': 'San Salvador, El Salvador',
  'ben.nativeSame': 'yes',
  'ben.court': 'A',
  'ben.nativeLanguage': 'Spanish',
  'ben.english': 'no',
  late: 'no',
  readsEnglish: 'B',
  fluentLanguage: 'Spanish',
  preparer: 'no',
};

/** The same petitioner, as a refugee, for his stepdaughter who is in Texas, filing late. */
export const lucia: Answers = {
  ...jose,
  status: 'LRE',
  relationship: 'U',
  childType: 'SC',
  'pet.married': 'yes',
  'pet.spouse.family': 'Flores',
  'pet.spouse.given': 'Marisol',
  'pet.prior.more0': 'yes',
  'pet.prior1.family': 'Gómez',
  'pet.prior1.given': 'Ana',
  'pet.prior1.ended': '01/10/2011',
  'pet.prior1.endPlace.city': 'San Salvador',
  'pet.prior1.endPlace.country': 'El Salvador',
  'pet.prior.more1': 'yes',
  'pet.prior2.family': 'Ruiz',
  'pet.prior2.given': 'Carla',
  'pet.prior2.ended': '02/02/2009',
  'pet.prior2.endPlace.city': 'Usulutan',
  'pet.prior2.endPlace.country': 'El Salvador',
  'otherName.more0': 'yes',
  'otherName1.family': 'Ramos',
  'otherName1.given': 'Jose',
  'otherName.more1': 'yes',
  'otherName2.family': 'Ramirez Ramos',
  'otherName2.given': 'Jose',
  mailingSame: 'no',
  'mailing.careOf': 'Iglesia San Jose',
  'mailing.street': '200 Main St',
  'mailing.unit': 'Ste 5',
  'mailing.city': 'Los Angeles',
  'mailing.state': 'CA',
  'mailing.zip': '90012',
  'mailing.country': 'United States',
  'refugee.date': '06/01/2023',
  'refugee.city': 'Tapachula',
  'refugee.state': 'Chiapas',
  'refugee.country': 'Mexico',
  'admit.date': '09/15/2023',
  'admit.city': 'Houston',
  'admit.state': 'TX',
  'ben.name.family': 'Flores',
  'ben.name.given': 'Lucia',
  'ben.home.street': '900 Elm St',
  'ben.home.unit': 'Flr 2',
  'ben.home.city': 'Houston',
  'ben.home.state': 'TX',
  'ben.home.zip': '77002',
  'ben.home.province': '',
  'ben.home.country': 'United States',
  'ben.mailingSame': 'no',
  'ben.mailing.street': 'PO Box 77',
  'ben.mailing.unit': 'Apt 1',
  'ben.mailing.city': 'Houston',
  'ben.mailing.state': 'TX',
  'ben.mailing.zip': '77001',
  'ben.mailing.country': 'United States',
  'ben.sex': 'female',
  'ben.dob': '04/04/2010',
  'ben.aNumber': '301234567',
  'ben.ssn': '123-45-6789',
  'ben.prior.more0': 'yes',
  'ben.prior1.family': 'Perez',
  'ben.prior1.given': 'Mario',
  'ben.prior1.ended': '01/01/2025',
  'ben.prior1.endPlace.city': 'Houston',
  'ben.prior1.endPlace.state': 'TX',
  'ben.prior1.endPlace.country': 'United States',
  'ben.prior.more1': 'yes',
  'ben.prior2.family': 'Lopez',
  'ben.prior2.given': 'Rafael',
  'ben.prior2.ended': '01/01/2024',
  'ben.prior2.endPlace.city': 'Dallas',
  'ben.prior2.endPlace.country': 'United States',
  'ben.location': 'A',
  'ben.court': 'B',
  'ben.court.where': 'Houston, TX',
  'ben.english': 'yes',
  'ben.otherLanguages': 'English',
  'entry.more0': 'yes',
  'entry1.date': '05/05/2024',
  'entry1.city': 'Hidalgo',
  'entry1.state': 'TX',
  'entry1.status': 'Parolee',
  'entry1.i94': '123456789A1',
  'entry1.expires': '05/04/2026',
  'entry1.passport': 'B12345678',
  'entry1.passportExpires': '01/01/2030',
  'entry1.passportCountry': 'El Salvador',
  'entry1.travelDoc': 'TD1234567',
  'entry1.travelDocExpires': '01/01/2028',
  'entry1.travelDocCountry': 'Mexico',
  'entry.more1': 'yes',
  'entry2.date': '01/01/2022',
  'entry2.city': 'Miami',
  'entry2.state': 'FL',
  'entry2.status': 'B-2',
  'entry2.i94': '98765432101',
  'entry2.expires': '07/01/2022',
  'entry2.passport': 'A1111111',
  'entry2.passportExpires': '01/01/2025',
  'entry2.passportCountry': 'El Salvador',
  'entry2.travelDoc': 'X9',
  'entry2.travelDocExpires': '01/01/2026',
  'entry2.travelDocCountry': 'USA',
  late: 'yes',
  'late.explain': 'I did not know where my stepdaughter was until 2025, when a church in Houston found her. '.repeat(40),
  readsEnglish: 'A',
  preparer: 'yes',
  'preparer.name': 'Ana Ruiz',
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

describe('I-730 PDF', () => {
  it('plans only fields that exist, with the right kind', async () => {
    const index = firstFieldIndex((await PDFDocument.load(template)).getForm());
    const variants: Answers[] = [
      jose,
      lucia,
      { ...jose, 'ben.nativeSame': 'no', 'ben.native.family': 'Flores', 'ben.native.given': 'M', 'ben.native.careOf': 'Tia', 'ben.native.street': 'Calle 1', 'ben.native.unit': 'Apt 3', 'ben.native.city': 'Santa Ana', 'ben.native.country': 'El Salvador', 'ben.english': 'yes' },
      { ...jose, 'ben.court': 'D', 'ben.court.where': 'Miami, FL', 'entry.more0': 'yes', 'entry1.date': '01/01/2019' },
      ...['REF', 'LAS'].map((status) => ({ ...lucia, status })),
      { ...jose, ...helpers },
      { ...jose, ...helpers, 'prep.same': 'yes', 'prep.statement': 'notAttorney', 'interp.unit': 'Apt 4' },
      { ...jose, ...helpers, 'prep.statement': 'attorneyNotExtends' },
      ...['BC', 'AC'].map((childType) => ({ ...lucia, childType, 'ben.court': 'C', late: 'no', readsEnglish: 'B', 'ben.sex': 'male' })),
    ];
    for (const plan of variants.map(planI730)) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) expect(index.get(name), name).toBeInstanceOf(PDFCheckBox);
      for (const name of Object.keys(plan.select)) expect(index.get(name), name).toBeInstanceOf(PDFDropdown);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
    }
    const p = planI730(lucia);
    expect(p.text['Pt1Line19_CityTown[0]']).toBe('Usulutan');
    expect(p.text['Part2_Line20_CityTown[0]']).toBe('Dallas');
    expect(p.text['Pt2_Line48_CountryTravelDocIssuance[0]']).toBe('USA');
    expect(p.text['Pt1Line12_GivenName[0]']).toBe('Marisol');
    expect(p.text['Part2_Line12_GivenName[0]']).toBeUndefined();
    expect(p.checkValue).toContainEqual(['Part3_2year', 'N']);
    expect(planI730(jose).text['Part2_Line12_FamilyName[0]']).toBe('Ramírez');
    expect(planI730(jose).text['P2_Line22_Country[0]']).toBe('El Salvador');
    expect(planI730(jose).text['Pt2_CityCountry[0]']).toBe('San Salvador, El Salvador');
    expect(planI730(lucia).text['Pt2_CityCountry[0]']).toBeUndefined();
  });

  it('writes the answers into the official form', async () => {
    const doc = await PDFDocument.load(await fillI730(template, jose));
    const f = firstFieldIndex(doc.getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    const checked = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    expect(doc.getPageCount()).toBe(12);
    expect(checked('Status[1]')).toBe(true);
    expect(checked('Beneficiary[0]')).toBe(true);
    expect(text('TextField1[2]')).toBe('3');
    expect(text('TextField1[1]')).toBe('1');
    expect(text('Pt1Line1_FamilyName[0]')).toBe('Ramirez');
    expect(checked('P1_Line2_Unit[2]')).toBe(true);
    expect(text('P1_Line2_Number[0]')).toBe('12');
    expect(text('Part1_Item9_AlienNum[0]')).toBe('209876543');
    expect(checked('sex[0]')).toBe(true);
    expect(checked('sex[3]')).toBe(true);
    expect(text('Pt1_Line1_MiddleName[0]')).toBe('Esperanza');
    expect(text('Part2_Line22_GivenName[0]')).toBe('Marisol');
    expect(checked('Part2_Beneficiary[0]')).toBe(true);
    expect(checked('Part2_Bene_Info[0]')).toBe(true);
    // Part 3's No box is the one exporting "Y".
    expect(checked('Part3_2year[0]')).toBe(true);
    expect(checked('Part3_2year[1]')).toBe(false);
    expect(text('P5_Line1b_NameofInterpreter[0]')).toBe('Spanish');
    expect(text('P5_Line3_PetitionerDayTel[0]')).toBe('2135550147');
    expect(text('P5_L6a_PetitionerSignature[0]')).toBe('');
  });

  it('fills the interpreter and preparer parts', async () => {
    const read = async (a: Answers) => {
      const f = firstFieldIndex((await PDFDocument.load(await fillI730(template, a))).getForm());
      return { text: (n: string) => (f.get(n) as PDFTextField).getText() ?? '', checked: (n: string) => (f.get(n) as PDFCheckBox).isChecked() };
    };
    let { text, checked } = await read({ ...jose, ...helpers });
    expect(text('P7_Line1a_InterpreterFamilyName[0]')).toBe('Gomez');
    expect(checked('P7_Line3_Unit[0]')).toBe(true);
    expect(text('P7_Line3_Number[0]')).toBe('210');
    expect(text('P7_Line4_DayTelephone[0]')).toBe('7135550100');
    expect(text('P7_Language[0]')).toBe('Spanish');
    expect(text('P8_Line1a_PrepFamilyName[0]')).toBe('Lee');
    expect(checked('P8_Line3_Unit[1]')).toBe(true);
    expect(text('P8_Line3_Province[0]')).toBe('Francisco Morazan');
    expect(checked('Pt8_Line7_chkbx[1]')).toBe(true);
    expect(checked('Pt8_Line7b_Extend[0]')).toBe(true);
    expect(checked('Pt8_Line7b_DoesNotExtend[0]')).toBe(false);
    expect(text('P8_L8a_PrepSignature[0]')).toBe('');
    ({ text, checked } = await read({ ...jose, ...helpers, 'prep.same': 'yes', 'prep.statement': 'notAttorney' }));
    expect(text('P8_Line1a_PrepGivenName[0]')).toBe('Rosa');
    expect(checked('P8_Line3_Unit[0]')).toBe(true);
    expect(checked('Pt8_Line7_chkbx[0]')).toBe(true);
    ({ text } = await read(jose));
    expect(text('P7_Line1a_InterpreterFamilyName[0]')).toBe('');
  });

  it('moves a long Part 3 explanation to a continuation page', async () => {
    const doc = await PDFDocument.load(await fillI730(template, lucia));
    const f = firstFieldIndex(doc.getForm());
    expect(doc.getPageCount()).toBeGreaterThan(12);
    expect((f.get('Explanation[0]') as PDFTextField).getText()).toContain('continuation sheet');
    expect((f.get('Part3_2year[1]') as PDFCheckBox).isChecked()).toBe(true);
    expect((f.get('Pt2_Line28__State[0]') as PDFDropdown).getSelected()[0].trim()).toBe('TX');

    const short = await PDFDocument.load(await fillI730(template, { ...lucia, 'late.explain': 'My stepdaughter was missing until 2025.' }));
    expect(short.getPageCount()).toBe(12);
    expect((firstFieldIndex(short.getForm()).get('Explanation[0]') as PDFTextField).getText()).toBe('My stepdaughter was missing until 2025.');
  });
});
