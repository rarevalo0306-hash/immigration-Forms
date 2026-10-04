import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { fieldIndex, optionBoxes } from './common';
import { fillI864EZ, householdSize, planI864EZ } from './i864ezPdf';

const template = readFileSync(new URL('../../public/forms/i-864ez.pdf', import.meta.url));

/** Carlos, a U.S. citizen nurse, sponsoring his wife Ana from Peru. */
export const carlos: Answers = {
  'ez.petitioner': 'yes',
  'ez.w2': 'yes',
  'ez.onlyOne': 'yes',
  'name.family': 'Mendoza',
  'name.given': 'Carlos',
  'mailing.street': '2200 Pine Ave',
  'mailing.unit': 'Apt 5',
  'mailing.city': 'Phoenix',
  'mailing.state': 'AZ',
  'mailing.zip': '85004',
  'mailing.country': 'United States',
  mailingSame: 'yes',
  domicile: 'United States',
  dob: '07/04/1985',
  birthCountry: 'United States',
  ssn: '123-45-6789',
  status: 'A',
  activeDuty: 'no',
  'principal.family': 'Quispe',
  'principal.given': 'Ana',
  'principal.mailing.street': 'Av. Arequipa 1450',
  'principal.mailing.city': 'Lima',
  'principal.mailing.province': 'Lima',
  'principal.mailing.postal': '15046',
  'principal.mailing.country': 'Peru',
  'principal.citizenship': 'Peru',
  'principal.dob': '02/12/1990',
  'hh.spouse': '0',
  'hh.children': '1',
  'hh.previouslySponsored': '0',
  'hh.otherDependents': '0',
  employment: 'employed',
  'job.employer1': 'Banner Health',
  'income.mine': '68000',
  filedTaxes: 'yes',
  'tax1.year': '2025',
  'tax1.income': '66500',
  'tax2.year': '2024',
  'tax2.income': '64000',
  readsEnglish: 'A',
  preparer: 'no',
  phone: '602 555 0199',
  email: 'carlos@example.com',
};

/** An interpreter in Los Angeles and a preparer in Tijuana. */
const helpers: Answers = {
  readsEnglish: 'B',
  fluentLanguage: 'Spanish',
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

describe('I-864EZ PDF', () => {
  it('counts the household', () => {
    expect(householdSize(carlos)).toBe(3);
    expect(householdSize({})).toBe(2);
  });

  it('plans only fields that exist, with the right kind', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    const variants: Answers[] = [
      carlos,
      { ...carlos, 'ez.w2': 'no', 'ez.onlyOne': 'no', 'ez.petitioner': 'no', mailingSame: 'no', 'home.street': '1 Main St', 'home.unit': 'Ste 2', 'home.city': 'Mesa', 'home.state': 'AZ', 'mailing.unit': 'Flr 3', status: 'B', activeDuty: 'yes', employment: 'retired', 'job.retiredSince': '01/01/2020', filedTaxes: 'no', readsEnglish: 'B', fluentLanguage: 'Spanish', preparer: 'yes', 'preparer.name': 'Ana Ruiz', 'principal.mailing.unit': 'Apt 1', 'principal.aNumber': '123456789' },
      { ...carlos, status: 'C', aNumber: 'A098765432' },
      { ...carlos, ...helpers },
      { ...carlos, ...helpers, 'prep.same': 'yes', 'prep.statement': 'notAttorney' },
      { ...carlos, ...helpers, readsEnglish: 'A', 'prep.statement': 'attorneyNotExtends' },
    ];
    for (const plan of variants.map(planI864EZ)) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) expect(index.get(name), name).toBeInstanceOf(PDFCheckBox);
      for (const name of Object.keys(plan.select)) expect(index.get(name), name).toBeInstanceOf(PDFDropdown);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
    }
  });

  it('fills the interpreter and preparer parts', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI864EZ(template, { ...carlos, ...helpers }))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    expect(text('P6_Line2_Attorney[0]')).toBe('Luis Perez');
    expect(text('P7_Line1a_InterpretersFamilyName[0]')).toBe('Gomez');
    expect(text('P7_Line4_InterpretersDaytimePhoneNumber[1]')).toBe('2135550112');
    expect(text('P7_Language[0]')).toBe('Spanish');
    expect(text('P8_Line1b_PreparersGivenName[0]')).toBe('Luis');
    expect(text('P8_Line2_PreparersBusinessName[0]')).toBe('Perez Law Office');
    expect(text('P8_Line5_PreparersFaxNumber[0]')).toBe('6645550101');
    expect(text('P8_Line8a_PreparersSignature[0]')).toBe('');
    expect(planI864EZ({ ...carlos, ...helpers, 'prep.same': 'yes' }).text['P8_Line1a_PreparersFamilyName[0]']).toBe('Gómez');
    expect(Object.keys(planI864EZ(carlos).text).filter((k) => /^P[78]_/.test(k))).toEqual([]);
  });

  it('writes the answers into the official form', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI864EZ(template, { ...carlos, status: 'C', aNumber: 'A098765432' }))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    const checked = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    expect(checked('P1_Line1a_Checkbox[1]')).toBe(true); // Yes
    expect(text('Part3_Line1a_FamilyName[0]')).toBe('Mendoza');
    expect(text('Part3_Line1a_FamilyName[1]')).toBe('Mendoza');
    expect(text('Part3_Line2c_AptSteFlrNumber[0]')).toBe('5');
    expect(checked('Part3_Line2c_Unit[0]')).toBe(true);
    expect((f.get('Part3_Line2e_State[0]') as PDFDropdown).getSelected()[0].trim()).toBe('AZ');
    expect(checked('P3_Line12_Checkbox[1]')).toBe(true); // lawful permanent resident
    expect(text('P3_Line12c_AlienNumber[0]')).toBe('098765432');
    expect(text('Part2_Line1a_FamilyName[0]')).toBe('Quispe');
    expect(text('P2_Line2_Country[0]')).toBe('Peru');
    expect(text('P4_Line1a_TotalNumberofImmigrants[0]')).toBe('2');
    expect(text('P4_Line1f_AddTogether[0]')).toBe('3');
    expect(checked('P5_Line1_Checkbox[0]')).toBe(true);
    expect(text('P5_Line2b_NameofEmployer[0]')).toBe('Banner Health');
    expect(text('P5_Line6a_TotalIncome[0]')).toBe('66500');
    expect(checked('P6_Line1_Checkbox[0]')).toBe(true);
    expect(text('P6Line6b_DateofSignature[0]')).toBe('');
  });
});
