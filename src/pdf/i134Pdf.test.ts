import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { optionBoxes } from './common';
import { CONTRIBUTIONS_FIELD, fillI134, i134Index, planI134 } from './i134Pdf';

const template = readFileSync(new URL('../../public/forms/i-134.pdf', import.meta.url));

/** Jorge, a cook in Houston, supports his sister Lucía during a visit from Honduras. */
export const jorge: Answers = {
  basis: 'other',
  'name.family': 'Mejía',
  'name.given': 'Jorge',
  'name.middle': 'Luis',
  'otherName.more0': 'no',
  'mailing.street': '8120 Bellaire Blvd',
  'mailing.unit': 'Apt 12',
  'mailing.city': 'Houston',
  'mailing.state': 'TX',
  'mailing.zip': '77036',
  'mailing.country': 'United States',
  mailingSame: 'yes',
  dob: '03/18/1985',
  birthCity: 'San Pedro Sula',
  birthState: 'Cortes',
  birthCountry: 'Honduras',
  aNumber: 'A204555123',
  status: 'C',
  relationship: 'brother',
  employment: 'employed',
  'job.occupation': 'Line cook',
  'job.employer1': 'Pappas Restaurants Inc',
  'hh.previouslySponsored': '0',
  dependentsCount: '3',
  'dependent.more0': 'yes',
  'dependent1.name': 'Ana Mejia',
  'dependent1.dob': '07/02/1987',
  'dependent1.relationship': 'wife',
  'dependent.more1': 'yes',
  'dependent2.name': 'Mateo Mejia',
  'dependent2.dob': '11/09/2014',
  'dependent2.relationship': 'son',
  'dependent.more2': 'no',
  'income.mine': '52000',
  'assets.checking': '4200',
  'assets.savings': '9800',
  contributions: 'yes',
  'contributions.describe': 'She will live with my family at 8120 Bellaire Blvd Apt 12, Houston, TX 77036. I will pay for her food, transportation and health insurance during her visit.',
  'ben.family': 'Mejía',
  'ben.given': 'Lucía',
  'ben.middle': 'Esther',
  'benOtherName.more0': 'no',
  'ben.dob': '05/30/1992',
  'ben.sex': 'female',
  'ben.birthCity': 'San Pedro Sula',
  'ben.birthCountry': 'Honduras',
  'ben.citizenship': 'Honduras',
  'ben.marital': 'single',
  'ben.mailing.street': 'Colonia Trejo, Calle 5',
  'ben.mailing.city': 'San Pedro Sula',
  'ben.mailing.province': 'Cortes',
  'ben.mailing.postal': '21102',
  'ben.mailing.country': 'Honduras',
  'ben.mailingSame': 'yes',
  'stay.from': '12/15/2026',
  'stay.end': 'date',
  'stay.to': '01/30/2027',
  readsEnglish: 'B',
  fluentLanguage: 'Spanish',
  preparer: 'no',
  phone: '713 555 0142',
  mobile: '713 555 0199',
  email: 'jorge.mejia@example.com',
};

const longText = 'She will live with us and I will pay for everything she needs. '.repeat(20);

describe('I-134 PDF', () => {
  it('plans only fields that exist, with the right kind', async () => {
    const index = i134Index((await PDFDocument.load(template)).getForm());
    const dependents: Answers = { 'dependent.more0': 'yes' };
    for (let i = 1; i <= 9; i++) {
      dependents[`dependent${i}.name`] = `Person ${i}`;
      dependents[`dependent${i}.dob`] = '01/01/2010';
      dependents[`dependent${i}.relationship`] = 'child';
      dependents[`dependent${i}.aNumber`] = '12345678';
      dependents[`dependent${i}.receipt`] = 'IOE0912345678';
      dependents[`dependent.more${i}`] = 'yes';
    }
    const allAssets: Answers = Object.fromEntries(
      ['checking', 'savings', 'annuities', 'stocks', 'retirement', 'realEstate', 'personalProperty'].map((k, i) => [`assets.${k}`, String((i + 1) * 1000)]),
    );
    const homes: Answers = {
      mailingSame: 'no',
      'home.street': '1 Main St',
      'home.unit': 'Ste 3',
      'home.city': 'Houston',
      'home.state': 'TX',
      'home.zip': '77001',
      'home.country': 'United States',
      'ben.mailingSame': 'no',
      'ben.home.street': '2 Elm St',
      'ben.home.unit': 'Flr 2',
      'ben.home.city': 'Miami',
      'ben.home.state': 'FL',
      'ben.home.country': 'United States',
      'ben.mailing.unit': 'Apt 1',
      'ben.mailing.state': 'FL',
      'mailing.unit': 'Flr 9',
      'mailing.careOf': 'Ana Mejia',
    };
    const names: Answers = {
      'otherName.more0': 'yes',
      'otherName1.family': 'Mejia Ruiz',
      'otherName.more1': 'yes',
      'otherName2.family': 'Ruiz',
      'benOtherName.more0': 'yes',
      'benOtherName1.family': 'Ruiz',
      'benOtherName.more1': 'yes',
      'benOtherName2.given': 'Lucy',
      'ben.aNumber': '987654321',
      uscisAccount: '123412341234',
    };
    const variants: Answers[] = [
      jorge,
      { ...jorge, ...dependents, ...allAssets, ...homes, ...names },
      { ...jorge, basis: 'self', readsEnglish: 'A', preparer: 'yes', 'preparer.name': 'Ana Ruiz', employment: 'self', 'job.selfOccupation': 'Painter' },
      { ...jorge, basis: 'self', readsEnglish: 'B', employment: 'other', 'job.other': 'Student' },
      { ...jorge, preparer: 'yes', 'preparer.name': 'Ana Ruiz', readsEnglish: 'A', contributions: 'no', 'stay.end': 'none', status: 'other', 'status.other': 'Pending asylum' },
      ...['A', 'B', 'C', 'nonimmigrant', 'asylee', 'refugee', 'parolee', 'tps', 'deferred'].map((status) => ({ ...jorge, status })),
      ...['unemployed', 'retired'].map((employment) => ({ ...jorge, employment })),
      ...['married', 'divorced', 'widowed', 'separated', 'annulled', 'other'].map((m) => ({ ...jorge, 'ben.marital': m, 'ben.marital.other': 'Common law', 'ben.sex': 'male', mailingSame: 'no' })),
    ];
    for (const plan of variants.map(planI134)) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) expect(index.get(name), name).toBeInstanceOf(PDFCheckBox);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
      for (const [name, value] of Object.entries(plan.select)) {
        const f = index.get(name);
        expect(f, name).toBeInstanceOf(PDFDropdown);
        expect((f as PDFDropdown).getOptions().map((o) => o.trim()), `${name}=${value}`).toContain(value);
      }
    }
    const rich = planI134(variants[1]);
    expect(rich.text['P3[0].#subform[0].Pt2_Line15_Row9_FullName[0]']).toBe('Person 9');
    expect(rich.text['P3[0].#subform[0].P2_Line15_Row9_ANumber[0]']).toBe('012345678');
    expect(rich.text['P3[0].Pt3Line9Cell9_Total[0]']).toBe('28,000');
    expect(rich.notes[0]).toMatchObject({ part: '2', item: '17', text: 'Personal Property (net value): $7,000' });
    // The self-filer's statement goes to Part 4 and skips Part 3.
    const self = planI134(variants[2]);
    expect(self.text['PG2[0].P2_Line11_Beneficiary[0]']).toBe('Self');
    expect(self.text['P5[0].Pt4Line2_RepresentativeName[0]']).toBe('Ana Ruiz');
    expect(self.text['P8[0].Pt3Line1_FamilyName[0]']).toBeUndefined();
    expect(self.checkValue).toContainEqual(['#subform[0].Pt3Line17', 'WD']);
  });

  it('writes the answers into the official form', async () => {
    const f = i134Index((await PDFDocument.load(await fillI134(template, jorge))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    const checked = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    expect(checked('#subform[0].Pt3Line17[0]')).toBe(true);
    expect(checked('#subform[0].Pt3Line17[1]')).toBe(false);
    expect(text('#subform[0].Pt1Line1_FamilyName[0]')).toBe('Mejia');
    expect(text('P13[0].Pt1Line1_FamilyName[0]')).toBe('Mejia');
    // Three different addresses share the name "Part2_Item11_City".
    expect(text('#subform[0].Part2_Item11_City[0]')).toBe('Houston');
    expect(text('P4[0].Part2_Item11_City[0]')).toBe('San Pedro Sula');
    expect(text('PG2[0].sfPhysicalAddress[0].Part2_Item11_City[0]')).toBe('');
    expect(checked('#subform[0].Part2_Line3_Unit[0]')).toBe(true);
    expect((f.get('#subform[0].Part2_Item11_State[0]') as PDFDropdown).getSelected()[0].trim()).toBe('TX');
    expect(text('PG2[0].#area[0].P2_Line8_DateOfBirth[0]')).toBe('03/18/1985');
    expect(text('P8[0].#area[0].P2_Line8_DateOfBirth[0]')).toBe('05/30/1992');
    expect(text('PG2[0].Pt1Line5_AlienNumber[0]')).toBe('204555123');
    // Box [1] is "Lawful Permanent Resident", printed third.
    expect(checked('PG2[0].P2_Line10_ImmigrationStatus[1]')).toBe(true);
    expect(checked('PG2[0].P2_Line10_ImmigrationStatus[2]')).toBe(false);
    expect(checked('PG2[0].StatusEmployment_CB[0]')).toBe(true);
    expect(text('PG2[0].NameOfEmployer[0]')).toBe('Pappas Restaurants Inc');
    expect(text('P3[0].P3_Line14[0]')).toBe('3');
    expect(text('P3[0].#subform[0].Pt2_Line15_Row2_Relationship[0]')).toBe('son');
    expect(text('P3[0].Pt3Line116_Annual[0]')).toBe('52,000');
    expect((f.get('P3[0].Pt3Line2Cell2_TypeofAssetDropDownList[0]') as PDFDropdown).getSelected()).toEqual(['Savings - Bank Account']);
    expect(text('P3[0].Pt3Line9Cell9_Total[0]')).toBe('14,000');
    expect(text(CONTRIBUTIONS_FIELD)).toContain('Houston');
    expect(checked('P8[0].Pt3_Line4_Sex_CB[1]')).toBe(true);
    expect(text('P8[0].P2_Line8_Country[0]')).toBe('Honduras');
    expect(checked('P4[0].Pt3_Line8_MaritalStatus[0]')).toBe(true);
    expect(checked('P4[0].Pt2Line12_Date[0]')).toBe(true);
    expect(text('P4[0].Pt3_Line12_DateTo[0]')).toBe('01/30/2027');
    expect(checked('P9[0].Pt5_Line1_CB[1]')).toBe(true);
    expect(text('P9[0].Pt5_Line1b_language[0]')).toBe('Spanish');
    expect(text('P9[0].Part4_Line3_DaytimePhoneNumber3[0]')).toBe('7135550142');
    expect(text('P5[0].Part4_Line3_DaytimePhoneNumber3[0]')).toBe('');
    expect(text('P10[0].P8_Line6_Sign[0]')).toBe('');
  });

  it('moves a long Item 19 to Part 8', async () => {
    const f = i134Index((await PDFDocument.load(await fillI134(template, { ...jorge, 'contributions.describe': longText }))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    expect(text(CONTRIBUTIONS_FIELD)).toContain('See Part 8');
    expect(text('P13[0].Pt9Line3c_ItemNumber[0]')).toBe('19');
    expect(text('P13[0].Pt9Line3d_AdditionalInfo[0]')).toContain('She will live with us');
  });
});
