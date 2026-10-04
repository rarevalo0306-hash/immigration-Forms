import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { fieldIndex, optionBoxes } from './common';
import { fillI864, planI864 } from './i864Pdf';

const template = readFileSync(new URL('../../public/forms/i-864.pdf', import.meta.url));

/** The wife in the I-130 example, sponsoring her husband and his son. */
export const sponsor: Answers = {
  basis: 'petitioner',
  'name.family': 'García',
  'name.given': 'María',
  'name.middle': 'Elena',
  'mailing.street': '1234 Main St',
  'mailing.unit': 'Apt 4B',
  'mailing.city': 'Los Angeles',
  'mailing.state': 'CA',
  'mailing.zip': '90011',
  'mailing.country': 'United States',
  mailingSame: 'yes',
  domicile: 'United States',
  dob: '05/12/1985',
  birthCountry: 'Mexico',
  ssn: '123-45-6789',
  aNumber: 'A12345678',
  status: 'A',
  activeDuty: 'no',
  'principal.family': 'Ruiz',
  'principal.given': 'Carlos',
  'principal.mailing.street': '1234 Main St',
  'principal.mailing.unit': 'Apt 4B',
  'principal.mailing.city': 'Los Angeles',
  'principal.mailing.state': 'CA',
  'principal.mailing.zip': '90011',
  'principal.mailing.country': 'United States',
  'principal.citizenship': 'Mexico',
  'principal.dob': '03/03/1983',
  'principal.aNumber': 'A098765432',
  'principal.phone': '213 555 0188',
  sponsorsPrincipal: 'yes',
  familyTiming: 'same',
  'member1.family': 'Ruiz',
  'member1.given': 'Diego',
  'member1.relationship': 'son',
  'member1.dob': '07/07/2010',
  'member.more1': 'no',
  'hh.spouse': '0',
  'hh.children': '1',
  'hh.otherDependents': '0',
  'hh.previouslySponsored': '0',
  'hh.i864a': '1',
  employment: 'employed',
  'job.occupation': 'Nurse',
  'job.employer1': 'St. Mary Hospital',
  'income.mine': '52000',
  'hhIncome.more0': 'yes',
  'hhIncome1.name': 'Ana Garcia',
  'hhIncome1.relationship': 'sister',
  'hhIncome1.amount': '18,000',
  'hhIncome.more1': 'no',
  i864aStatus: 'completed',
  filedTaxes: 'yes',
  'tax1.year': '2025',
  'tax1.income': '51000',
  'tax2.year': '2024',
  'tax2.income': '48000',
  useAssets: 'yes',
  'assets.cash': '10000',
  'assets.realEstate': '0',
  'assets.stocks': '2500',
  'assets.household': '0',
  'principalAssets.cash': '3000',
  phone: '(213) 555-0123',
  email: 'maria@example.com',
  readsEnglish: 'B',
  fluentLanguage: 'Spanish',
};

/** An interpreter in Los Angeles and a preparer in Tijuana. */
const helpers: Answers = {
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

describe('I-864 PDF', () => {
  it('plans only fields that exist, with the right kind', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    const variants: Answers[] = [
      sponsor,
      { ...sponsor, basis: 'firstJoint', mailingSame: 'no', 'home.street': '9 Elm', 'home.unit': 'Ste 2', 'home.city': 'Austin', 'home.state': 'TX', status: 'C', familyTiming: 'later', 'member.more1': 'yes', 'member2.family': 'R', 'member.more2': 'yes', 'member3.family': 'S', 'member3.aNumber': '1', 'member.more3': 'yes', 'member4.family': 'T', 'member4.aNumber': '2', employment: 'self', 'job.selfOccupation': 'Painter', 'hhIncome.more1': 'yes', 'hhIncome2.name': 'B', 'hhIncome.more2': 'yes', 'hhIncome3.name': 'C', 'hhIncome.more3': 'yes', 'hhIncome4.name': 'D', i864aStatus: 'intending', 'i864a.intendingName': 'Carlos Ruiz', filedTaxes: 'no', notRequired: 'yes', readsEnglish: 'A', mobile: '2135550000', 'principal.mailing.unit': 'Flr 3' },
      { ...sponsor, basis: 'secondJoint', employment: 'retired', 'job.retiredSince': '01/01/2020', 'principal.mailing.state': 'NY' },
      { ...sponsor, basis: 'onlyJoint', employment: 'unemployed', 'job.unemployedSince': '01/01/2024', status: 'B' },
      { ...sponsor, basis: 'substitute', 'substitute.relationship': 'brother', activeDuty: 'yes' },
      { ...sponsor, ...helpers },
      { ...sponsor, ...helpers, 'prep.same': 'yes', 'prep.statement': 'notAttorney' },
      { ...sponsor, ...helpers, readsEnglish: 'A', 'prep.statement': 'attorneyNotExtends' },
    ];
    for (const plan of variants.map(planI864)) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) expect(index.get(name), name).toBeInstanceOf(PDFCheckBox);
      for (const name of Object.keys(plan.select)) expect(index.get(name), name).toBeInstanceOf(PDFDropdown);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
    }
  });

  it('adds up household size, income and assets', () => {
    const { text } = planI864(sponsor);
    expect(text['P3_Line28_TotalNumberofImmigrants[0]']).toBe('2');
    expect(text['Override[0]']).toBe('5');
    expect(text['P6_Line15_TotalHouseholdIncome[0]']).toBe('70000');
    expect(text['P7_Line4_Total[0]']).toBe('12500');
    expect(text['P7_Line9_Total[0]']).toBe('3000');
    expect(text['P7_Line10_TotalValueAssets[0]']).toBe('15500');
    // Only family members immigrating later: the principal isn't counted.
    expect(planI864({ ...sponsor, sponsorsPrincipal: 'no', familyTiming: 'later' }).text['P3_Line28_TotalNumberofImmigrants[0]']).toBe('1');
  });

  it('fills the interpreter and preparer parts', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI864(template, { ...sponsor, ...helpers }))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    expect((f.get('P8_Line2_Checkbox[0]') as PDFCheckBox).isChecked()).toBe(true);
    expect(text('P8_Line2_Attorney[0]')).toBe('Luis Perez');
    expect(text('P9_Line1a_InterpretersFamilyName[0]')).toBe('Gomez');
    expect(text('P8Line2_InterpretersBusinessName[0]')).toBe('Ayuda Hispana LLC');
    expect(text('P9_Line4_InterpretersDaytimePhoneNumber[1]')).toBe('2135550112');
    expect(text('P9_Language[0]')).toBe('Spanish');
    expect(text('P10_Line1b_PreparersGivenName[0]')).toBe('Luis');
    expect(text('P10_Line5_PreparersFaxNumber[0]')).toBe('6645550101');
    expect(text('P9_Line6a_InterpretersSignature[0]')).toBe('');
    // The same person interpreted and prepared: Part 10 repeats the interpreter.
    const same = planI864({ ...sponsor, ...helpers, 'prep.same': 'yes' }).text;
    expect(same['P10_Line1a_PreparersFamilyName[0]']).toBe('Gómez');
    // No help, nothing in Parts 9 and 10.
    const none = planI864({ ...sponsor, ...helpers, readsEnglish: 'A', preparer: 'no' }).text;
    expect(Object.keys(none).filter((k) => /^P(9|10)_/.test(k))).toEqual([]);
  });

  it('writes the answers into the official form', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI864(template, sponsor))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText();
    const checked = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    expect(checked('P1_Line1a-f_CB[0]')).toBe(true);
    expect(text('P4_Line1a_FamilyName[0]')).toBe('Garcia');
    expect(text('P4_Line1b_GivenName[1]')).toBe('Maria');
    expect(checked('P4_Line2c_Unit[0]')).toBe(true);
    expect(text('P4_Line2d_AptSteFlrNumber[0]')).toBe('4B');
    expect((f.get('P4_Line2f_State[0]') as PDFDropdown).getSelected()[0].trim()).toBe('CA');
    expect(checked('P1_Line3_Checkbox[0]')).toBe(true);
    expect(text('P4_Line10_SocialSecurityNumber[0]')).toBe('123456789');
    expect(checked('P4_Line11a_Checkbox[0]')).toBe(true);
    expect(text('P4_Line12_AlienNumber[0]')).toBe('012345678');
    expect(checked('P4_Line14_Checkboxes[1]')).toBe(true);
    expect(text('P2_Line5_AlienNumber[0]')).toBe('098765432');
    expect(text('P2_Line7_DaytimePhoneNumber[0]')).toBe('2135550188');
    expect(checked('P3_Line1_Checkbox[0]')).toBe(true);
    expect(checked('P3_Line2_SponsoringFamily[0]')).toBe(true);
    expect(checked('P3_Line2_SponsoringFamily[1]')).toBe(false);
    expect(text('P3_Line3b_GivenName[0]')).toBe('Diego');
    expect(text('P3_Line4_Relationship[0]')).toBe('son');
    expect(text('P5_Line2_Yourself[0]')).toBe('1');
    expect(checked('P6_Line1_Checkbox[0]')).toBe(true);
    expect(text('P6_Line1a1_NameofEmployer[0]')).toBe('St. Mary Hospital');
    expect(text('P6_Line5_CurrentIncome[0]')).toBe('18000');
    expect(checked('P6_Line16_CompletedForm[0]')).toBe(true);
    expect(checked('P6_Line18a_Checkbox[0]')).toBe(true);
    expect(text('P6_Line19b_TaxYear[0]')).toBe('2024');
    // Part 8: the interpreter box, not the "Employed" box that shares its name.
    expect(checked('P6_Line1_Checkbox[1]')).toBe(false);
    expect(checked('P6_Line1_Checkbox[2]')).toBe(true);
    expect(text('P8_Line1b_language[0]')).toBe('Spanish');
    expect(text('P8_Line3_DaytimeTelephoneNumber[0]')).toBe('2135550123');
    expect(text('P7Line7_EmailAddress[0]')).toBe('maria@example.com');
  });
});
