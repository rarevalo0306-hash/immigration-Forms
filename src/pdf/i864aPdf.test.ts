import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { fieldIndex, optionBoxes } from './common';
import { fillI864A, planI864A } from './i864aPdf';

const template = readFileSync(new URL('../../public/forms/i-864a.pdf', import.meta.url));

/** The sister in the I-864 example, adding her income to María's affidavit. */
export const householdMember: Answers = {
  'name.family': 'García',
  'name.given': 'Ana',
  'mailing.street': '1234 Main St',
  'mailing.unit': 'Apt 4B',
  'mailing.city': 'Los Angeles',
  'mailing.state': 'CA',
  'mailing.zip': '90011',
  'mailing.country': 'United States',
  mailingSame: 'yes',
  dob: '09/09/1988',
  birthCountry: 'Mexico',
  ssn: '987-65-4321',
  aNumber: 'A23456789',
  relationship: 'C',
  relative: '4',
  employment: 'employed',
  'job.occupation': 'Cashier',
  'job.employer1': 'Food 4 Less',
  'income.mine': '18,000',
  filedTaxes: 'yes',
  'tax1.year': '2025',
  'tax1.income': '17500',
  useAssets: 'yes',
  'assets.cash': '4000',
  'assets.realEstate': '0',
  'assets.stocks': '1000',
  'sponsor.family': 'García',
  'sponsor.given': 'María',
  'sponsor.middle': 'Elena',
  'imm1.family': 'Ruiz',
  'imm1.given': 'Carlos',
  'imm1.dob': '03/03/1983',
  'imm1.aNumber': 'A098765432',
  'imm.more1': 'yes',
  'imm2.family': 'Ruiz',
  'imm2.given': 'Diego',
  'imm2.dob': '07/07/2010',
  'imm.more2': 'no',
  'sponsor.readsEnglish': 'A',
  'sponsor.phone': '(213) 555-0123',
  'sponsor.email': 'maria@example.com',
  readsEnglish: 'B',
  'readsEnglish.language': 'Spanish',
  phone: '213 555 0199',
};

describe('I-864A PDF', () => {
  it('plans only fields that exist, with the right kind', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    const variants: Answers[] = [
      householdMember,
      { ...householdMember, mailingSame: 'no', 'home.street': '9 Elm', 'home.unit': 'Ste 2', 'home.city': 'Austin', 'home.state': 'TX', 'mailing.unit': 'Flr 3', relative: '5', 'relative.other': 'niece', employment: 'self', 'job.selfOccupation': 'Painter', filedTaxes: 'no', 'imm.more2': 'yes', 'imm3.family': 'S', 'imm3.aNumber': '1', 'imm.more3': 'yes', 'imm4.family': 'T', 'imm4.aNumber': '2', 'imm4.dob': '01/01/2001', 'imm4.uscisAccount': '123456789012', 'sponsor.readsEnglish': 'B', 'sponsor.readsEnglish.language': 'Spanish', readsEnglish: 'A', mobile: '2135550000', 'sponsor.mobile': '2135550001' },
      { ...householdMember, relationship: 'A', employment: 'retired', 'job.retiredSince': '01/01/2020' },
      { ...householdMember, relationship: 'B', employment: 'unemployed', 'job.unemployedSince': '01/01/2024', relative: '1' },
      ...['1', '2', '3'].map((relative) => ({ ...householdMember, relative })),
    ];
    for (const plan of variants.map(planI864A)) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) expect(index.get(name), name).toBeInstanceOf(PDFCheckBox);
      for (const name of Object.keys(plan.select)) expect(index.get(name), name).toBeInstanceOf(PDFDropdown);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
    }
    // Only the household member who isn't the immigrant gives a relationship.
    expect(planI864A({ ...householdMember, relationship: 'B', relative: '1' }).checkValue.map(([b]) => b)).not.toContain('P2_Line3_A_Relationship');
  });

  it('writes the answers into the official form', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI864A(template, householdMember))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText();
    const checked = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    expect(text('P1_Line1a_FamilyName[0]')).toBe('Garcia');
    expect(text('Pt1Line1b_GivenName[0]')).toBe('Ana');
    expect(checked('P1_Line2_Unit[2]')).toBe(true); // APT
    expect(text('P1_Line2_AptSteFlrNumber[0]')).toBe('4B');
    expect(checked('P1_Line3_CB[1]')).toBe(true); // Yes
    expect(text('P1_Line7_SSN[0]')).toBe('987654321');
    expect(text('Pt1Line3e_AlienNumber[0]')).toBe('023456789');
    expect(checked('P2_Line1-3_Checkbox[2]')).toBe(true);
    expect(checked('P2_Line3_A_Relationship[3]')).toBe(true);
    expect(checked('P3_Line1_Employment[0]')).toBe(true);
    expect(text('P3_Line2_Employed[0]')).toBe('Food 4 Less');
    expect(text('P3_Line2_CurrentIncome[0]')).toBe('18000');
    expect(checked('P4_Line1_CB[0]')).toBe(true);
    expect(text('P4_Line6_TotalAssets[0]')).toBe('5000');
    expect(text('P5_SponsorName[0]')).toBe('Maria Elena Garcia');
    expect(text('P5_IntendingMigrants[0]')).toBe('2');
    expect(text('P5_Line2b_GivenName[0]')).toBe('Diego');
    expect(text('P5_Line1e_ANumber[0]')).toBe('098765432');
    expect(checked('P5Line5_Checkbox[1]')).toBe(true); // 5.a
    expect(text('Pt2Line3_DaytimePhone[0]')).toBe('2135550123');
    expect(text('Part9_Iamfluent[0]')).toBe('Ana Garcia');
    expect(text('Part9_Iamfluent[1]')).toBe('2');
    expect(checked('Part6_Line1_Checkbox[0]')).toBe(true); // 1.b
    expect(text('P6Line1b_language[0]')).toBe('Spanish');
    expect(text('P7Line5_DaytimeTelephoneNumber[0]')).toBe('2135550199');
    expect(text('P7Line6a_EmailAddress[0]')).toBe('Ana Garcia');
  });
});
