import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { fieldIndex, optionBoxes } from './common';
import { fillI360, planI360 } from './i360Pdf';

const template = readFileSync(new URL('../../public/forms/i-360.pdf', import.meta.url));

/** Guadalupe, abused by her permanent-resident husband, self-petitioning under VAWA with a safe address. */
export const guadalupe: Answers = {
  classification: 'I',
  'name.family': 'Ramírez',
  'name.given': 'Guadalupe',
  'name.middle': 'Inés',
  'mailing.street': '845 W Olive Ave',
  'mailing.unit': 'Apt 12',
  'mailing.city': 'Fresno',
  'mailing.state': 'CA',
  'mailing.zip': '93728',
  'mailing.country': 'United States',
  safeAddress: 'yes',
  'safe.careOf': 'Centro Legal del Valle',
  'safe.street': '2100 Tulare St',
  'safe.unit': 'Ste 300',
  'safe.city': 'Fresno',
  'safe.state': 'CA',
  'safe.zip': '93721',
  'safe.country': 'United States',
  dob: '03/14/1990',
  birthCountry: 'Mexico',
  ssn: '',
  aNumber: 'A098765432',
  marital: 'M',
  inUS: 'yes',
  'arrival.date': '06/02/2015',
  'i94.number': '69384712A23',
  'passport.number': 'G12345678',
  'passport.country': 'Mexico',
  'passport.expires': '05/01/2024',
  'status.current': 'B-2 visitor (expired)',
  'status.expires': '12/01/2015',
  'abuser.family': 'Castillo',
  'abuser.given': 'Javier',
  'abuser.dob': '11/20/1986',
  'abuser.birthCountry': 'Mexico',
  'abuser.status': 'D',
  'abuser.aNumber': '201234567',
  'vawa.timesMarried': '1',
  'abuser.timesMarried': '2',
  'vawa.marriageDate': '08/15/2016',
  'vawa.marriagePlace': 'Fresno, California',
  'lived.from': '08/15/2016',
  'lived.to': '02/10/2026',
  'lived.other': 'We also lived together from 01/2016 to 07/2016 at 312 E Belmont Ave, Fresno, CA, before the wedding.',
  'together.street': '1520 N Maple Ave',
  'together.city': 'Fresno',
  'together.state': 'CA',
  'together.zip': '93703',
  'together.country': 'United States',
  'together.from': '03/01/2020',
  'together.to': '02/10/2026',
  ead: 'yes',
  childrenFiled: 'no',
  'relative.more0': 'yes',
  'relative1.family': 'Castillo',
  'relative1.given': 'Javier',
  'relative1.dob': '11/20/1986',
  'relative1.birthCountry': 'Mexico',
  'relative1.relationship': 'S',
  'relative1.aNumber': '201234567',
  'relative.more1': 'yes',
  'relative2.family': 'Castillo Ramirez',
  'relative2.given': 'Sofía',
  'relative2.dob': '04/09/2018',
  'relative2.birthCountry': 'United States',
  'relative.more2': 'no',
  processingPath: 'withI485',
  'foreign.city': 'Morelia',
  'foreign.province': 'Michoacan',
  'foreign.country': 'Mexico',
  sex: 'female',
  otherFilings: 'yes',
  'otherFilings.count': '2',
  removal: 'no',
  workedWithout: 'yes',
  'processing.explain': 'I worked cleaning houses in Fresno, CA from 2016 to 2025 without employment authorization.',
  readsEnglish: 'B',
  fluentLanguage: 'Spanish',
  preparer: 'yes',
  'preparer.name': 'Centro Legal del Valle',
  phone: '559 555 0147',
  email: 'lupe.safe@example.com',
};

/** Ernesto, widower of a naturalized citizen, applying from abroad. */
export const ernesto: Answers = {
  classification: 'B',
  'name.family': 'Morales',
  'name.given': 'Ernesto',
  'mailing.street': 'Calle 5 de Mayo 210',
  'mailing.city': 'Guadalajara',
  'mailing.province': 'Jalisco',
  'mailing.postal': '44100',
  'mailing.country': 'Mexico',
  uscisAccount: '123456789012',
  dob: '07/07/1975',
  birthCountry: 'Mexico',
  aNumber: '',
  marital: 'W',
  inUS: 'no',
  'deceased.family': 'Morales',
  'deceased.given': 'Carmen',
  'deceased.dob': '01/02/1978',
  'deceased.birthCountry': 'Mexico',
  'deceased.death': '03/03/2026',
  'deceased.status': 'C',
  'deceased.aNumber': '055443322',
  timesMarried: '1',
  'deceased.timesMarried': '1',
  'marriage.date': '10/10/2010',
  'marriage.place': 'Guadalajara, Mexico',
  remarried: 'no',
  separated: 'no',
  'relative.more0': 'no',
  processingPath: 'consulate',
  'consulate.city': 'Ciudad Juarez',
  'consulate.country': 'Mexico',
  sex: 'male',
  otherFilings: 'no',
  removal: 'no',
  workedWithout: 'no',
  readsEnglish: 'A',
  preparer: 'no',
  phone: '523312345678',
};

/** Kevin, a Special Immigrant Juvenile with an order against one parent. */
export const kevin: Answers = {
  classification: 'C',
  'name.family': 'Hernández',
  'name.given': 'Kevin',
  'mailing.street': '77 Elm St',
  'mailing.city': 'Houston',
  'mailing.state': 'TX',
  'mailing.zip': '77002',
  'mailing.country': 'United States',
  safeAddress: 'no',
  dob: '05/05/2009',
  birthCountry: 'Honduras',
  marital: 'S',
  inUS: 'yes',
  'otherName.more0': 'yes',
  'otherName1.family': 'Lopez',
  'otherName1.given': 'Kevin',
  'otherName.more1': 'yes',
  'otherName2.family': 'Hernandez Lopez',
  'otherName2.given': 'Kevin',
  dependent: 'yes',
  'placement.name': 'Maria Lopez (legal guardian)',
  jurisdiction: 'yes',
  residingPlacement: 'yes',
  reunification: 'O',
  grounds: ['A', 'C'],
  'reunification.parent': 'Jose Hernandez',
  bestInterest: 'yes',
  hhs: 'yes',
  hhsAltered: 'no',
  'relative.more0': 'no',
  processingPath: 'later',
  sex: 'male',
  otherFilings: 'no',
  removal: 'yes',
  'processing.explain': 'I am in removal proceedings before the Houston Immigration Court; my next hearing is 01/15/2027.',
  readsEnglish: 'A',
  preparer: 'no',
  phone: '713 555 0199',
};

describe('I-360 PDF', () => {
  it('plans only fields that exist, with the right kind', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    const children: Answers = {};
    for (let i = 2; i <= 9; i++) {
      children[`relative${i}.family`] = `Child ${i}`;
      children[`relative${i}.dob`] = '01/01/2015';
      children[`relative${i}.aNumber`] = '123123123';
      children[`relative.more${i - 1}`] = 'yes';
    }
    const variants: Answers[] = [
      guadalupe,
      ernesto,
      kevin,
      { ...guadalupe, ...children, classification: 'J', 'abuser.status': 'C', 'relative1.relationship': 'C', 'safe.unit': 'Flr 2', 'mailing.unit': 'Ste 4' },
      { ...guadalupe, classification: 'K', 'abuser.status': 'E', 'abuser.statusOther': 'Citizen, unknown how', ead: 'no', removal: 'yes', readsEnglish: 'A' },
      ...['A', 'B'].map((s) => ({ ...guadalupe, 'abuser.status': s })),
      { ...ernesto, 'deceased.status': 'D', 'deceased.statusOther': 'Citizen by birth in Puerto Rico', remarried: 'yes', 'remarried.date': '05/05/2026', separated: 'yes', 'separated.explain': 'Separated by court order in 2024.' },
      ...['A', 'B'].map((s) => ({ ...ernesto, 'deceased.status': s, marital: 'D' })),
      { ...kevin, jurisdiction: 'no', jurisdictionEnded: 'C', 'jurisdiction.explain': 'Court closed the case', dependent: 'no', 'dependent.explain': 'Order pending', reunification: 'B', grounds: ['A', 'B', 'C', 'D'], 'grounds.other': 'Abuse by caretaker', hhsAltered: 'yes', 'otherName.more0': 'no' },
      ...['A', 'B'].map((r) => ({ ...kevin, jurisdiction: 'no', jurisdictionEnded: r, hhs: 'no' })),
      { ...kevin, sex: 'female', marital: 'M' },
    ];
    for (const plan of variants.map(planI360)) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) expect(index.get(name), name).toBeInstanceOf(PDFCheckBox);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
      for (const name of Object.keys(plan.select)) expect(index.get(name), name).toBeInstanceOf(PDFDropdown);
      for (const n of plan.notes) expect(n.item.length, n.item).toBeLessThanOrEqual(6);
    }
    expect(planI360(variants[3]).text['Pt5Line10_FamilyName[0]']).toBe('Child 9');
    expect(planI360(variants[3]).check).toContain('Pt5Line10_Relationship[0]');
    expect(planI360(variants[3]).text['Pt9Line8a_DateOfMarriage[0]']).toBe('N/A');
    expect(planI360(variants[7]).notes.map((n) => n.item)).toEqual(['10']);
    expect(planI360(variants[10]).notes.map((n) => n.item)).toEqual(['5', '2.A', '3.B']);
    // Self-petitioners skip Part 1, Items 1-6; a widow(er) fills them.
    expect(planI360(guadalupe).text['Pt1Line1_FamilyName[0]']).toBeUndefined();
    expect(planI360(ernesto).text['Pt1Line1_FamilyName[0]']).toBe('Morales');
    // SIJ doesn't answer Part 4, Item 6.
    expect(planI360({ ...kevin, workedWithout: 'yes' }).checkValue.some(([b]) => b === 'Pt4Line6')).toBe(false);
  });

  it('writes the answers into the official form', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI360(template, guadalupe))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    const checked = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    const value = (base: string, v: string) => optionBoxes(f, base).find((o) => o.value === v)!.box.isChecked();
    expect(value('Pt2Line1', 'I')).toBe(true);
    expect(value('Pt2Line1', 'J')).toBe(false);
    expect(text('Pt1Line1_FamilyName[0]')).toBe('');
    expect(text('Pt1Line7_InCareofName[0]')).toBe('Centro Legal del Valle');
    expect(value('Pt1Line7_Unit', 'STE')).toBe(true);
    expect(text('Pt3Line1_FamilyName[0]')).toBe('Ramirez');
    expect(text('Pt3Line6_AlienNumber[0]')).toBe('098765432');
    expect(value('Pt3Line2_Unit', 'APT')).toBe(true);
    expect((f.get('Pt3Line2_State[0]') as PDFDropdown).getSelected()).toEqual(['CA']);
    expect(value('Pt3Line7_MaritalStatus', 'M')).toBe(true);
    expect(text('Pt3Line9_I94[0]')).toBe('69384712A23');
    expect(text('Pt4Line2b_CityOrTown[0]')).toBe('Morelia');
    expect(value('Pt4Line3_Sex', 'F')).toBe(true);
    expect(value('Pt4Line7', 'Y')).toBe(true);
    expect(value('Pt4Line6', 'Y')).toBe(true);
    expect(value('Pt5Line2_Relationship', 'S')).toBe(true);
    expect(checked('Pt5Line3_Relationship[0]')).toBe(true);
    expect(text('Pt5Line3_GivenName[0]')).toBe('Sofia');
    expect(value('Pt10Line5_Checkbox', 'D')).toBe(true);
    expect(text('Pt10Line5d1_AlienNumber[0]')).toBe('201234567');
    // Part 10, Item 8 is named after Part 9.
    expect(text('Pt9Line8b_PlaceOfMarriage[0]')).toBe('Fresno, California');
    expect(text('Pt10Line10_StreetNumberName[0]')).toBe('1520 N Maple Ave');
    expect(value('Pt10Line12', 'Y')).toBe(true);
    expect(value('Pt11Line1_Checkbox', 'B')).toBe(true);
    expect(text('Pt11Line1b_Language[0]')).toBe('Spanish');
    expect(checked('Pt11Line2_Checkbox[0]')).toBe(true);
    expect(text('Pt11Line3_DaytimePhoneNumber1[0]')).toBe('5595550147');
    expect(text('Pt11Line6_Signature[0]')).toBe('');
    // Part 15 (named Pt14), with the header name in Pt1Line1_*[1].
    expect(text('Pt1Line1_FamilyName[1]')).toBe('Ramirez');
    expect(text('Pt14Line3b_PartNumber[0]')).toBe('4');
    expect(text('Pt14Line3c_ItemNumber[0]')).toBe('6');
    expect(text('Pt14Line3d_AdditionalInfo[0]')).toContain('cleaning houses');
    expect(text('Pt14Line4b_PartNumber[0]')).toBe('10');
    expect(text('Pt14Line4d_AdditionalInfo[0]')).toContain('Belmont');
  });

  it('fills the SIJ part, with its misnamed items', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI360(template, kevin))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    const value = (base: string, v: string) => optionBoxes(f, base).find((o) => o.value === v)!.box.isChecked();
    expect(value('Pt2Line1', 'C')).toBe(true);
    expect(text('Pt8Line1b_FamilyName[0]')).toBe('Hernandez Lopez');
    // Item 3.A is "Pt8Line4a"; Item 4.A's one/both is "Pt8Line3a".
    expect(value('Pt8Line4a', 'Y')).toBe(true);
    expect(value('Pt8Line3a', 'O')).toBe(true);
    expect(value('Pt8Line3A_Checkbox', 'A')).toBe(true);
    expect(value('Pt8Line3A_Checkbox', 'C')).toBe(true);
    expect(value('Pt8Line3A_Checkbox', 'B')).toBe(false);
    expect(text('Pt8Line4b_NameOfParent[0]')).toBe('Jose Hernandez');
    expect(value('Pt8Line6b', 'N')).toBe(true);
    expect(value('Pt4Line7', 'N')).toBe(true);
    expect(optionBoxes(f, 'Pt4Line6').some((o) => o.box.isChecked())).toBe(false);
    expect(text('Pt14Line3d_AdditionalInfo[0]')).toContain('Houston Immigration Court');
  });

  it('continues a long note in the next Part 15 entries', async () => {
    const long = Array.from({ length: 120 }, (_, i) => `Sentence ${i + 1} about the period we lived together.`).join(' ');
    const f = fieldIndex((await PDFDocument.load(await fillI360(template, { ...guadalupe, workedWithout: 'no', 'lived.other': long }))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    expect(text('Pt14Line3c_ItemNumber[0]')).toBe('9');
    expect(text('Pt14Line4c_ItemNumber[0]')).toBe('9');
    expect(text('Pt14Line6d_AdditionalInfo[0]')).toContain('Continued on a separate sheet.');
  });
});
