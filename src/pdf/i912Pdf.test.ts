import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { fieldIndex, optionBoxes } from './common';
import { countForms, fillI912, planI912 } from './i912Pdf';

const template = readFileSync(new URL('../../public/forms/i-912.pdf', import.meta.url));

/** Rosa, on Medicaid and with a low income, applying for citizenship with her son's work permit. */
export const rosa: Answers = {
  basis: ['A', 'B'],
  immStatus: 'Lawful permanent resident',
  guardian: 'no',
  'name.family': 'Hernández',
  'name.given': 'Rosa',
  'name.middle': 'María',
  'otherName.more0': 'yes',
  'otherName1.family': 'López',
  'otherName1.given': 'Rosa',
  'otherName.more1': 'no',
  aNumber: 'A123456789',
  dob: '04/12/1980',
  ssn: '123-45-6789',
  marital: 'Divorced',
  'self.forms': 'N-400',
  'family.more0': 'yes',
  'family1.name': 'Diego Hernandez',
  'family1.aNumber': '987654321',
  'family1.dob': '09/01/2004',
  'family1.relationship': 'son',
  'family1.forms': 'I-765, I-131',
  'family.more1': 'no',
  'benefit1.name': 'Rosa Hernandez',
  'benefit1.relationship': 'self',
  'benefit1.agency': 'LA County DPSS',
  'benefit1.type': 'Medicaid',
  'benefit1.awarded': '01/15/2025',
  'benefit1.expires': '01/14/2027',
  'benefit.more1': 'no',
  employment: 'Employed',
  householdSize: '2',
  earners: '1',
  'agi.yours': '18500',
  'agi.family': '2400',
  changes: 'no',
  readsEnglish: 'B',
  fluentLanguage: 'Spanish',
  preparer: 'no',
  phone: '213 555 0123',
  email: 'rosa@example.com',
};

describe('I-912 PDF', () => {
  it('counts the forms in a cell', () => {
    expect(countForms('I-485, I-765 and I-131')).toBe(3);
    expect(countForms('N-400')).toBe(1);
    expect(countForms('')).toBe(0);
  });

  it('plans only fields that exist, with the right kind', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    const benefits: Answers = {};
    for (let i = 1; i <= 8; i++) {
      benefits[`benefit${i}.name`] = `Person ${i}`;
      benefits[`benefit${i}.agency`] = 'DPSS';
      benefits[`benefit${i}.expires`] = '01/01/2027';
      benefits[`benefit.more${i}`] = 'yes';
    }
    const variants: Answers[] = [
      rosa,
      { ...rosa, ...benefits, basis: ['A', 'B', 'C'], guardian: 'yes', marital: 'Other', 'marital.other': 'Common law', 'otherName.more1': 'yes', 'otherName2.family': 'Ruiz' },
      { ...rosa, 'family.more1': 'yes', 'family2.name': 'Ana', 'family.more2': 'yes', 'family3.name': 'Luis', 'family3.aNumber': '111222333' },
      { ...rosa, basis: ['B'], employment: 'Unemployed', unemploymentBenefits: 'yes', 'unemployed.date': '03/01/2026', changes: 'yes', 'changes.explain': 'Lost my job', preparer: 'yes', 'preparer.name': 'Ana Ruiz', readsEnglish: 'A' },
      { ...rosa, basis: ['B'], employment: 'Other', 'employment.other': 'Student', unemploymentBenefits: 'no' },
      { ...rosa, basis: ['C'], situation: 'Medical debt', 'asset.more0': 'yes', 'asset1.type': 'Checking', 'asset1.value': '300', 'asset.more1': 'yes', 'asset2.type': 'Savings', 'asset2.value': '50', 'asset.more2': 'yes', 'asset3.type': 'Stock', 'asset3.value': '10', 'expenses.total': '2100', expenseTypes: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'O'], 'expenses.other': 'Phone' },
      ...['Single', 'Married', 'Widowed', 'Annulled', 'Legally Seperated'].map((marital) => ({ ...rosa, marital })),
    ];
    for (const plan of variants.map(planI912)) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) expect(index.get(name), name).toBeInstanceOf(PDFCheckBox);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
    }
    expect(planI912(variants[1]).text['Part4_Line1_FullName4[1]']).toBe('Person 8');
    expect(planI912(variants[2]).text['P3_Line1_AlienNumber4[0]']).toBe('111222333');
    expect(planI912(variants[5]).text['TotalAssets[0]']).toBe('360');
  });

  it('writes the answers into the official form', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI912(template, rosa))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText();
    const checked = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    expect(checked('P1_Line1_Checkbox[0]')).toBe(true);
    expect(checked('P1_Line2_Checkbox[0]')).toBe(true);
    expect(checked('P1_Line3_Checkbox[0]')).toBe(false);
    expect(checked('P1_Line1_Checkbox[1]')).toBe(false);
    expect(text('P2_L2_FamilyName[0]')).toBe('Hernandez');
    expect(text('P2_L2_FamilyName[1]')).toBe('Hernandez');
    expect(text('P2_L3_FamilyName[0]')).toBe('Lopez');
    expect(text('P2_Line3_AlienNumber[0]')).toBe('123456789');
    expect(text('Part3_Line1_Name1[0]')).toBe('Rosa Maria Hernandez');
    expect(text('Part4_Line2a_RelationshipToYou1[0]')).toBe('Self');
    expect(text('Part4_Line2b_DateofBirth2[0]')).toBe('09/01/2004');
    expect(text('Part3_Line1_DateofBirth2[0]')).toBe('son');
    expect(text('Part3_Line1_TotalForms[0]')).toBe('3');
    expect(text('Part4_Line1_Agency1[0]')).toBe('LA County DPSS');
    expect(text('Total[0]')).toBe('20,900');
    expect(text('P7_L1B_Name[0]')).toBe('Spanish');
    expect(text('P7_L6_Date[0]') ?? '').toBe('');
    expect(text('Part6_Line1_Situation[0]') ?? '').toBe('');
  });
});
