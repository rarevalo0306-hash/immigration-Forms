import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { fillI765, planI765, toFormText } from './i765Pdf';

const template = readFileSync(new URL('../../public/forms/i-765.pdf', import.meta.url));

const answers: Answers = {
  reason: 'initial',
  'name.family': 'García Núñez',
  'name.given': 'María',
  hasOtherNames: 'yes',
  'otherName.family': 'Garcia',
  'otherName.given': 'Maria',
  'mailing.careOf': 'Ana Lopez',
  'mailing.street': '1234 Main St',
  'mailing.unit': 'Apt 4B',
  'mailing.city': 'Los Angeles',
  'mailing.state': 'CA',
  'mailing.zip': '90011',
  sameAddress: 'no',
  'physical.street': '55 Oak Ave',
  'physical.unit': 'Suite 2',
  'physical.city': 'Houston',
  'physical.state': 'TX',
  'physical.zip': '77002',
  aNumber: 'A001234567',
  sex: 'female',
  marital: 'married',
  previousI765: 'no',
  ssnValue: '123-45-6789',
  'citizenship.1': 'Mexico',
  'birth.city': 'Puebla',
  'birth.country': 'Mexico',
  dobValue: '03/14/1990',
  passport: 'G12345678',
  'arrival.date': '06/01/2023',
  'arrival.place': 'San Ysidro, CA',
  'status.arrival': 'Parole',
  'status.current': 'Asylum applicant',
  category: '(c)(8)',
  arrested: 'no',
  phone: '(213) 555-0123',
  email: 'maria@example.com',
  readsEnglish: 'interpreter',
  fluentLanguage: 'Spanish',
};

const helped: Answers = {
  ...answers,
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
  'prep.street': '22 Calle Sol',
  'prep.unit': 'Flr 2',
  'prep.city': 'Tijuana',
  'prep.province': 'Baja California',
  'prep.postal': '22000',
  'prep.country': 'Mexico',
  'prep.phone': '664 555 0102',
  'prep.email': 'luis@example.com',
  'prep.statement': 'attorneyNotExtends',
};

async function filled(a: Answers) {
  const doc = await PDFDocument.load(await fillI765(template, a));
  return doc.getForm();
}

describe('I-765 PDF', () => {
  it('only plans fields that exist in the official PDF, with the right kind', async () => {
    const form = (await PDFDocument.load(template)).getForm();
    const everything: Answers = { ...answers, category: '(c)(3)(C)', 'stem.degree': 'MS', 'stem.employer': 'Acme', 'stem.everify': '123456', sevisNumber: 'N0012345678' };
    const plans = [planI765(everything), planI765({ ...answers, category: '(c)(26)', 'h1b.receipt': 'IOE0123456789' }), planI765({ ...answers, category: 'other', 'category.other': '(c)(35)', 'i140.receipt': 'LIN0123456789', arrested: 'yes', readsEnglish: 'yes' })];
    for (const statement of ['notAttorney', 'attorneyExtends', 'attorneyNotExtends'])
      plans.push(planI765({ ...helped, 'prep.statement': statement, 'prep.state': 'CA', 'prep.unit': 'Ste 5' }), planI765({ ...helped, 'prep.same': 'yes', 'prep.statement': statement }));
    for (const plan of plans) {
      for (const name of Object.keys(plan.text)) expect(form.getField(name), name).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) expect(form.getField(name), name).toBeInstanceOf(PDFCheckBox);
      for (const name of Object.keys(plan.select)) expect(form.getField(name), name).toBeInstanceOf(PDFDropdown);
    }
  });

  it('writes the answers into the official form', async () => {
    const form = await filled(answers);
    const text = (n: string) => form.getTextField(`form1[0].${n}`).getText();
    const checked = (n: string) => form.getCheckBox(`form1[0].${n}`).isChecked();

    expect(text('Page1[0].Line1a_FamilyName[0]')).toBe('Garcia Nunez');
    expect(text('Page1[0].Line1b_GivenName[0]')).toBe('Maria');
    expect(checked('Page1[0].Part1_Checkbox[0]')).toBe(true);
    expect(checked('Page1[0].Part1_Checkbox[2]')).toBe(false);
    expect(text('Page1[0].Line2a_FamilyName[0]')).toBe('Garcia');

    expect(text('Page2[0].Line4a_InCareofName[0]')).toBe('Ana Lopez');
    expect(checked('Page2[0].Pt2Line5_Unit[2]')).toBe(true); // Apt
    expect(text('Page2[0].Pt2Line5_AptSteFlrNumber[0]')).toBe('4B');
    expect(form.getDropdown('form1[0].Page2[0].Pt2Line5_State[0]').getSelected()).toEqual(['CA']);
    expect(checked('Page2[0].Part2Line5_Checkbox[0]')).toBe(true); // mailing ≠ physical
    expect(checked('Page2[0].Pt2Line7_Unit[0]')).toBe(true); // Suite
    expect(text('Page2[0].Pt2Line7_CityOrTown[0]')).toBe('Houston');
    expect(text('Page2[0].Line7_AlienNumber[0]')).toBe('001234567');
    expect(checked('Page2[0].Line9_Checkbox[0]')).toBe(true); // female
    expect(checked('Page2[0].Line10_Checkbox[3]')).toBe(true); // married
    expect(checked('Page2[0].Line19_Checkbox[0]')).toBe(true); // not filed before
    expect(text('Page2[0].Line12b_SSN[0]')).toBe('123456789');

    expect(text('Page3[0].Line19_DOB[0]')).toBe('03/14/1990');
    expect(text('Page3[0].#area[1].section_1[0]')).toBe('c');
    expect(text('Page3[0].#area[1].section_2[0]')).toBe('8');
    expect(checked('Page3[0].PtLine29_YesNo[1]')).toBe(true); // (c)(8) never arrested

    expect(checked('Page4[0].Pt3Line1Checkbox[0]')).toBe(true); // interpreter
    expect(text('Page4[0].Pt3Line1b_Language[0]')).toBe('Spanish');
    expect(text('Page4[0].Pt3Line3_DaytimePhoneNumber1[0]')).toBe('2135550123');
    expect(text('Page4[0].Pt3Line7a_Signature[0]')).toBeUndefined();

    expect(text('Page7[0].Line1a_FamilyName[0]')).toBe('Garcia Nunez');
  });

  it('writes the interpreter and the preparer', async () => {
    const form = await filled(helped);
    const text = (n: string) => form.getTextField(`form1[0].${n}`).getText();
    const checked = (n: string) => form.getCheckBox(`form1[0].${n}`).isChecked();

    expect(checked('Page4[0].Part3_Checkbox[0]')).toBe(true);
    expect(text('Page4[0].Pt3Line2_RepresentativeName[0]')).toBe('Luis Ortega');
    expect(text('Page4[0].Pt4Line1a_InterpreterFamilyName[0]')).toBe('Rios');
    expect(text('Page5[0].Pt5Line3a_StreetNumberName[0]')).toBe('10 Elm St');
    expect(checked('Page5[0].Pt5Line3b_Unit[1]')).toBe(true); // Apt, by position
    expect(form.getDropdown('form1[0].Page5[0].Pt5Line3d_State[0]').getSelected()).toEqual(['TX']);
    expect(text('Page5[0].Pt4Line4_InterpreterDaytimeTelephone[0]')).toBe('2145550100');
    expect(text('Page5[0].Part4_NameofLanguage[0]')).toBe('Spanish');
    expect(text('Page5[0].Pt4Line6a_Signature[0]')).toBeUndefined();

    expect(text('Page5[0].Pt5Line1a_PreparerFamilyName[0]')).toBe('Ortega');
    expect(checked('Page5[0].Pt6Line3b_Unit[0]')).toBe(true); // Flr, by position
    expect(text('Page5[0].Pt6Line3f_Province[0]')).toBe('Baja California');
    expect(text('Page5[0].Pt5Line6_Email[0]')).toBe('luis@example.com');
    expect(checked('Page6[0].Part5Line7_Checkbox[1]')).toBe(true);
    expect(checked('Page6[0].Part5Line7b_Checkbox[1]')).toBe(true); // does not extend
    expect(text('Page6[0].Pt5Line8a_Signature[0]')).toBeUndefined();

    const same = await filled({ ...helped, 'prep.same': 'yes', 'prep.statement': 'notAttorney' });
    expect(same.getTextField('form1[0].Page5[0].Pt5Line1a_PreparerFamilyName[0]').getText()).toBe('Rios');
    expect(same.getCheckBox('form1[0].Page6[0].Part5Line7_Checkbox[0]').isChecked()).toBe(true);
    const alone = await filled(answers);
    expect(alone.getTextField('form1[0].Page5[0].Pt5Line1a_PreparerFamilyName[0]').getText()).toBeUndefined();
  });

  it('fills category follow-ups only for their category', async () => {
    const stem = await filled({ ...answers, category: '(c)(3)(C)', 'stem.degree': 'MS Comp Science', sevisNumber: 'N0012345678' });
    expect(stem.getTextField('form1[0].Page3[0].#area[1].section_3[0]').getText()).toBe('C');
    expect(stem.getTextField('form1[0].Page3[0].Line27a_Degree[0]').getText()).toBe('MS Comp Science');
    expect(stem.getTextField('form1[0].Page3[0].Line26_SEVISnumber[0]').getText()).toBe('0012345678');
    expect(stem.getCheckBox('form1[0].Page3[0].PtLine29_YesNo[1]').isChecked()).toBe(false);
  });

  it('keeps text the PDF font can draw', () => {
    expect(toFormText('Peña “Ñandú” — Ü')).toBe('Pena "Nandu" - U');
    expect(toFormText('北京 Beijing')).toBe(' Beijing');
  });
});
