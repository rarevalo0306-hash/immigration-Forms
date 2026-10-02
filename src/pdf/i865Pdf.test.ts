import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { fieldIndex, optionBoxes } from './common';
import { fillI865, planI865 } from './i865Pdf';

const template = readFileSync(new URL('../../public/forms/i-865.pdf', import.meta.url));

/** Jorge, who sponsored his wife and stepson, moved from Fresno to San Diego. */
export const jorge: Answers = {
  'name.family': 'Ramírez',
  'name.given': 'Jorge',
  'name.middle': 'Luis',
  dob: '07/23/1978',
  'home.street': '4521 Imperial Ave',
  'home.unit': 'Apt 12',
  'home.city': 'San Diego',
  'home.state': 'CA',
  'home.zip': '92113',
  'home.country': 'United States',
  moveDate: '09/15/2026',
  mailingSame: 'no',
  'mailing.careOf': 'Maria Ramirez',
  'mailing.street': 'PO Box 3381',
  'mailing.city': 'San Diego',
  'mailing.state': 'CA',
  'mailing.zip': '92163',
  'mailing.country': 'United States',
  'mailing.since': '09/20/2026',
  oldAddress: 'yes',
  'previous.street': '1820 N Blackstone Ave',
  'previous.unit': 'Ste 5',
  'previous.city': 'Fresno',
  'previous.state': 'CA',
  'previous.zip': '93703',
  'previous.country': 'United States',
  'principal.family': 'Gómez',
  'principal.given': 'Lucía',
  'principal.aNumber': 'A 212345678',
  'member.more0': 'yes',
  'member1.family': 'Gómez',
  'member1.given': 'Mateo',
  'member1.aNumber': '212345679',
  'member.more1': 'no',
  readsEnglish: 'B',
  fluentLanguage: 'Spanish',
  preparer: 'no',
  phone: '(619) 555-0147',
  email: 'jorge.ramirez@example.com',
};

describe('I-865 PDF', () => {
  it('plans only fields that exist, with the right kind', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    const many: Answers = {};
    for (let i = 1; i <= 7; i++) {
      many[`member${i}.family`] = `Family${i}`;
      many[`member${i}.given`] = `Given${i}`;
      many[`member${i}.middle`] = 'M';
      many[`member${i}.aNumber`] = `11122233${i}`;
      many[`member.more${i}`] = 'yes';
    }
    const variants: Answers[] = [
      jorge,
      { ...jorge, ...many, 'home.unit': 'Floor 3', 'mailing.unit': 'Suite 200', readsEnglish: 'A', preparer: 'yes', 'preparer.name': 'Ana Ruiz', 'preparer.attorney': 'yes' },
      { ...jorge, mailingSame: 'yes', oldAddress: 'no', 'home.unit': 'Ste 4', 'mailing.unit': 'Apt 1', preparer: 'yes', 'preparer.name': 'Ana Ruiz', 'preparer.attorney': 'no' },
      { ...jorge, 'home.state': '', 'home.zip': '', 'home.province': 'Jalisco', 'home.postal': '44100', 'home.country': 'Mexico', mobile: '6195550199' },
    ];
    for (const plan of variants.map(planI865)) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) expect(index.get(name), name).toBeInstanceOf(PDFCheckBox);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
      for (const [name, value] of Object.entries(plan.select)) {
        expect(index.get(name), name).toBeInstanceOf(PDFDropdown);
        expect((index.get(name) as PDFDropdown).getOptions().map((o) => o.trim())).toContain(value);
      }
    }
    const big = planI865(variants[1]);
    expect(big.text['P2_Line8_AlienNumber[0]']).toBe('111222333');
    expect(big.notes.at(-1)?.text).toContain('Sponsored Immigrant 8: Family Name: Family7');
    expect(big.checkValue).toContainEqual(['P1_Line3b_Unit', 'FLR']);
    expect(big.checkValue).toContainEqual(['P1_Line6c_Unit', 'STE']);
    const same = planI865(variants[2]);
    expect(same.text['P1_Line6b_StreetNumberName[0]']).toBeUndefined();
    expect(same.notes).toEqual([]);
    expect(planI865(variants[3]).text['P1_Line3f_Province[0]']).toBe('Jalisco');
  });

  it('writes the answers into the official form', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI865(template, jorge))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    const checked = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    expect(text('P1_Line1a_FamilyName[0]')).toBe('Ramirez');
    expect(text('P1_Line1a_FamilyName[1]')).toBe('Ramirez');
    expect(text('P1_Line3b_AptSteFlrNumber[0]')).toBe('12');
    expect(checked('P1_Line3b_Unit[2]')).toBe(true); // APT
    expect((f.get('P1_Line3d_State[0]') as PDFDropdown).getSelected().map((s) => s.trim())).toEqual(['CA']);
    expect(text('P1_Line4_DateOfChangeAdd[0]')).toBe('09/15/2026');
    // Item 5 "No" is the first box of the misnamed "P4_Line5_Checkbox" pair.
    expect(checked('P4_Line5_Checkbox[0]')).toBe(true);
    expect(checked('P4_Line5_Checkbox[1]')).toBe(false);
    expect(text('P1_Line6a_InCareofName[0]')).toBe('Maria Ramirez');
    expect(text('P1_Line7_DateOfChangeAdd[0]')).toBe('09/20/2026');
    expect(text('P2_Line1a_FamilyName[0]')).toBe('Gomez');
    expect(text('P2_Line2_AlienNumber[0]')).toBe('212345678');
    expect(text('P2_Line3b_GivenName[0]')).toBe('Mateo');
    expect(text('P2_Line4_AlienNumber[0]')).toBe('212345679');
    expect(checked('P3_Line1_Checkbox[0]')).toBe(true); // 1.b
    expect(checked('P3_Line1_Checkbox[1]')).toBe(false); // 1.a
    expect(text('P3_Line1b_language[0]')).toBe('Spanish');
    expect(text('P3_Line3_DaytimeTelephoneNumber[0]')).toBe('6195550147');
    expect(text('P6_Line2c_ItemNumber[0]')).toBe('3');
    expect(text('P6_Line2d_AdditionalInfo[0]').replace(/\n+/g, ' ')).toContain('1820 N Blackstone Ave, Ste 5, Fresno, CA 93703');
    expect(text('P3_Line6b_DateofSignature[0]')).toBe('');
  });
});
