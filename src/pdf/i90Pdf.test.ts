import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { fieldIndex, optionBoxes } from './common';
import { fillI90, planI90 } from './i90Pdf';

const template = readFileSync(new URL('../../public/forms/i-90.pdf', import.meta.url));

/** María from the I-130 example, renewing her card after she married and changed her name. */
export const resident: Answers = {
  aNumber: 'A12345678',
  'name.family': 'García Ruiz',
  'name.given': 'María',
  'name.middle': 'Elena',
  nameChanged: 'Y',
  'cardName.family': 'García',
  'cardName.given': 'María',
  'cardName.middle': 'Elena',
  'mailing.street': '1234 Main St',
  'mailing.unit': 'Apt 4B',
  'mailing.city': 'Los Angeles',
  'mailing.state': 'CA',
  'mailing.zip': '90011',
  'mailing.country': 'United States',
  mailingSame: 'yes',
  sex: 'female',
  dob: '05/12/1985',
  birthCity: 'Guadalajara',
  birthCountry: 'Mexico',
  motherGiven: 'Rosa',
  fatherGiven: 'Juan',
  coa: 'f21',
  admissionDate: '06/01/2015',
  ssn: '123-45-6789',
  status: '1a',
  reasonA: '2e',
  'location.applied': 'U.S. Consulate, Ciudad Juarez, Mexico',
  'location.issued': 'U.S. Consulate, Ciudad Juarez, Mexico',
  enteredWithVisa: 'yes',
  'arrival.destination': 'Los Angeles, CA',
  'arrival.poe': 'San Ysidro, CA',
  proceedings: 'no',
  abandoned: 'no',
  ethnicity: 'hispanic',
  race: ['WH'] as unknown as string,
  heightFeet: '5',
  heightInches: '3',
  weight: '130',
  eyes: 'BN',
  hair: 'BL',
  accommodation: 'no',
  readsEnglish: 'B',
  fluentLanguage: 'Spanish',
  phone: '(213) 555-0123',
  email: 'maria@example.com',
};

describe('I-90 PDF', () => {
  it('plans only fields that exist, with the right kind', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    const variants: Answers[] = [
      resident,
      ...['2a', '2b', '2c', '2d', '2f', '2g1', '2g2', '2h1', '2h2', '2i', '2j'].map((reasonA) => ({ ...resident, status: '1b', reasonA, 'poe.cityState': 'Laredo, TX' })),
      ...['3a', '3b', '3c', '3d', '3e'].map((reasonB) => ({ ...resident, status: '1c', reasonB })),
      { ...resident, nameChanged: 'NA', mailingSame: 'no', 'home.street': '9 Elm', 'home.unit': 'Ste 2', 'home.city': 'Austin', 'home.state': 'TX', 'mailing.unit': 'Flr 3', 'mailing.careOf': 'Ana', sex: 'male', proceedings: 'yes', abandoned: 'yes', 'explain.proceedings': 'x', 'explain.abandoned': 'y', ethnicity: 'notHispanic', race: ['WH', 'AS', 'BL', 'AI', 'HW'] as unknown as string, accommodation: 'yes', 'acc.deaf': 'ASL', 'acc.blind': 'Braille', 'acc.other': 'Wheelchair', readsEnglish: 'A', mobile: '2135550000' },
      { ...resident, nameChanged: 'N', accommodation: 'no' },
      ...['BN', 'BL', 'HA', 'GN', 'BU', 'GR', 'MA', 'PN', 'UN'].map((eyes) => ({ ...resident, eyes })),
      ...['BL', 'BR', 'BN', 'GR', 'WH', 'RD', 'SA', 'NH', 'OT'].map((hair) => ({ ...resident, hair })),
    ];
    for (const plan of variants.map(planI90)) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) expect(index.get(name), name).toBeInstanceOf(PDFCheckBox);
      for (const name of Object.keys(plan.select)) expect(index.get(name), name).toBeInstanceOf(PDFDropdown);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
    }
  });

  it('writes the answers into the official form', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI90(template, resident))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText();
    const checked = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    expect(text('P1_Line1_AlienNumber[0]')).toBe('012345678');
    expect(text('P1_Line1_AlienNumber[1]')).toBe('012345678');
    expect(text('P1_Line3a_FamilyName[0]')).toBe('Garcia Ruiz');
    expect(text('P1_Line3a_FamilyName[1]')).toBe('Garcia Ruiz');
    expect(checked('P1_checkbox4[0]')).toBe(true);
    expect(text('P1_Line5a_FamilyName[0]')).toBe('Garcia');
    expect(checked('P1_checkbox6c_Unit[0]')).toBe(true);
    expect(text('P1_Line6c_AptSteFlrNumber[0]')).toBe('4B');
    expect((f.get('P1_Line6e_State[0]') as PDFDropdown).getSelected()[0].trim()).toBe('CA');
    expect(checked('P1_Line8_female[0]')).toBe(true);
    expect(text('P1_Line14_ClassOfAdmission[0]')).toBe('F21');
    expect(checked('P2_checkbox1[0]')).toBe(true);
    expect(checked('P2_checkbox2[0]')).toBe(true); // 2.e
    expect(text('P3_Line3a1_CityandState[0]')).toBe('San Ysidro, CA');
    expect(checked('P3_checkbox4[0]')).toBe(true); // No
    expect(checked('P3_checkbox6[1]')).toBe(true); // Hispanic
    expect(checked('P3_checkbox7_White[0]')).toBe(true);
    expect([1, 2, 3].map((i) => text(`P3_Line9_HeightInches${i}[0]`)).join('')).toBe('130');
    expect(checked('P3_checkbox10[5]')).toBe(true); // BRO
    expect(checked('P3_checkbox11[8]')).toBe(true); // BLK
    expect(checked('P4_checkbox1[0]')).toBe(true); // No
    expect(checked('P5_Checkbox1b[0]')).toBe(true);
    expect(text('P5_Line1b_Language[0]')).toBe('Spanish');
    expect(text('P5_Line3_DaytimePhoneNumber[0]')).toBe('2135550123');
  });

  it('writes Part 3 explanations into Part 8', () => {
    const { text } = planI90({ ...resident, abandoned: 'yes', 'explain.abandoned': 'I signed Form I-407 in 2019 by mistake.' });
    expect(text['P8_Line3c_ItemNumber[0]']).toBe('5');
    expect(text['P8_Line3d_AdditionalInfo[0]']).toBe('I signed Form I-407 in 2019 by mistake.');
    expect(text['P8_Line4d_AdditionalInfo[0]']).toBeUndefined();
  });
});
