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

/** An interpreter in Los Angeles and a preparer in Tijuana. */
const helpers: Answers = {
  readsEnglish: 'B',
  'readsEnglish.language': 'Spanish',
  preparer: 'yes',
  'preparer.name': 'Luis Pérez',
  'interp.family': 'Gómez',
  'interp.given': 'Rosa',
  'interp.business': 'Ayuda Hispana LLC',
  'interp.street': '500 Oak St',
  'interp.unit': 'Ste 210',
  'interp.city': 'Los Angeles',
  'interp.state': 'CA',
  'interp.zip': '90012',
  'interp.country': 'United States',
  'interp.phone': '(213) 555-0111',
  'interp.mobile': '213 555 0112',
  'interp.email': 'rosa@example.com',
  'interp.language': 'Spanish',
  'prep.same': 'no',
  'prep.family': 'Pérez',
  'prep.given': 'Luis',
  'prep.business': 'Pérez Law Office',
  'prep.street': '77 Av Revolución',
  'prep.unit': 'Flr 3',
  'prep.city': 'Tijuana',
  'prep.province': 'Baja California',
  'prep.postal': '22000',
  'prep.country': 'Mexico',
  'prep.phone': '664 555 0100',
  'prep.mobile': '664 555 0101',
  'prep.email': 'luis@example.com',
  'prep.statement': 'attorneyExtends',
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
      { ...householdMember, ...helpers },
      { ...householdMember, ...helpers, 'prep.same': 'yes', 'prep.statement': 'notAttorney' },
      { ...householdMember, ...helpers, readsEnglish: 'A', 'prep.statement': 'attorneyNotExtends' },
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

  it('fills the interpreter and preparer parts', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI864A(template, { ...householdMember, ...helpers }))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    const checked = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    expect(checked('P5Line5_Checkbox[2]')).toBe(true); // Part 5, Item 6
    expect(text('P5Line5c_language[0]')).toBe('Luis Perez');
    expect(checked('Part6_Line2_Checkbox[0]')).toBe(true);
    expect(text('P6Line2_Attorney[0]')).toBe('Luis Perez');
    expect(text('P8Line1a_InterpretersFamilyName[0]')).toBe('Gomez');
    expect(text('P8Line4_InterpretersDaytimePhoneNumber[1]')).toBe('2135550112');
    expect(text('P8_Language[0]')).toBe('Spanish');
    expect(text('P9Line1b_PreparersGivenName[0]')).toBe('Luis');
    expect(text('P9Line5_PreparersFaxNumber[0]')).toBe('6645550101');
    // The sponsor's interpreter counts too.
    expect(planI864A({ ...householdMember, ...helpers, readsEnglish: 'A', 'sponsor.readsEnglish': 'B' }).text['P8_Language[0]']).toBe('Spanish');
    expect(Object.keys(planI864A({ ...householdMember, ...helpers, readsEnglish: 'A', preparer: 'no' }).text).filter((k) => /^P[89]/.test(k))).toEqual([]);
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
