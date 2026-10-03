import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { BACKGROUND_ITEMS, IMMIGRANT_ITEMS } from '../forms/i539';
import { I539_CURRENT_STATUSES, I539_NEW_STATUSES } from '../forms/i539Status';
import { fieldIndex, optionBoxes } from './common';
import { fillI539, part4Box, planI539 } from './i539Pdf';

const template = readFileSync(new URL('../../public/forms/i-539.pdf', import.meta.url));

const allNo = Object.fromEntries([...IMMIGRANT_ITEMS, ...BACKGROUND_ITEMS].map((i) => [i.id, 'no']));

/** Lucía, visiting her daughter in Houston on a B-2, asking for three more months with her husband. */
export const lucia: Answers = {
  'name.family': 'Ramírez',
  'name.given': 'Lucía',
  'name.middle': 'Elena',
  'mailing.careOf': 'Sofia Ramirez',
  'mailing.street': '4521 Westheimer Rd',
  'mailing.unit': 'Apt 12',
  'mailing.city': 'Houston',
  'mailing.state': 'TX',
  'mailing.zip': '77027',
  mailingSame: 'yes',
  birthCountry: 'Mexico',
  citizenship: 'Mexico',
  dob: '03/14/1962',
  'lastEntry.date': '07/02/2026',
  'i94.number': '123456789A1',
  'passport.number': 'G12345678',
  'passport.country': 'Mexico',
  'passport.expires': '05/20/2031',
  currentStatus: 'B2 - TEMPORARY VISITOR FOR PLEASURE',
  statusDS: 'no',
  'i94.expires': '01/01/2027',
  appType: 'extension',
  coApplicants: 'family',
  peopleCount: '2',
  'extend.until': '04/01/2027',
  relGranted: 'no',
  relPetition: 'N',
  passportChanged: 'no',
  'abroad.street': 'Calle Hidalgo 245',
  'abroad.city': 'Guadalajara',
  'abroad.province': 'Jalisco',
  'abroad.postal': '44100',
  'abroad.country': 'Mexico',
  ...allNo,
  employed: 'no',
  'support.explain': 'My husband and I are retired and live on his pension of about $1,800 per month, plus savings of $22,000 in our bank in Guadalajara. Our daughter, Sofia Ramirez, a U.S. citizen, also provides housing. Bank statements and her support letter are attached.',
  exchangeVisitor: 'no',
  phone: '713 555 0142',
  email: 'lucia.ramirez@example.com',
};

describe('I-539 PDF', () => {
  it('numbers the Part 4 boxes in printed order', () => {
    expect(part4Box('p4.3')).toBe('P4_checkbox3');
    expect(part4Box('p4.7a')).toBe('P4_checkbox7');
    expect(part4Box('p4.8a')).toBe('P4_checkbox12');
    expect(part4Box('p4.9')).toBe('P4_checkbox14');
    expect(part4Box('p4.13')).toBe('P4_checkbox18');
  });

  it('plans only fields that exist, with the right kind', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    const allYes = Object.fromEntries([...IMMIGRANT_ITEMS, ...BACKGROUND_ITEMS].map((i) => [i.id, 'yes']));
    const variants: Answers[] = [
      lucia,
      { ...lucia, ...allYes, 'background.explain': 'Explained', mailingSame: 'no', 'home.street': '1 Main St', 'home.unit': 'Ste 3', 'home.city': 'Austin', 'home.state': 'TX', 'home.zip': '78701', statusDS: 'yes', employed: 'yes', 'employed.explain': 'Worked', exchangeVisitor: 'yes', 'exchange.explain': 'J-1 2019', coApplicants: 'alone' },
      { ...lucia, appType: 'change', newStatus: 'F1 - STUDENT - ACADEMIC', 'change.effective': '01/10/2027', 'school.name': 'Houston Community College', sevis: 'N0012345678', relGranted: 'yes', relForm: 'A', 'rel.receipt': 'IOE0123456789', 'mailing.unit': 'Flr 2', passportChanged: 'yes', 'newPassport.number': 'G7', 'newPassport.country': 'Mexico', 'newPassport.expires': '01/01/2035', 'abroad.unit': 'Apt 1' },
      { ...lucia, appType: 'reinstatement', relPetition: 'A', relForm: 'B', 'abroad.unit': 'Ste 9', 'abroad.street': 'X' },
      { ...lucia, relPetition: 'B', relForm: 'B', 'rel.given': 'Carlos', 'rel.family': 'Ramirez', 'rel.filed': '06/01/2026', 'abroad.unit': 'Flr 4' },
      ...I539_CURRENT_STATUSES.map((currentStatus) => ({ ...lucia, currentStatus })),
      ...I539_NEW_STATUSES.map((newStatus) => ({ ...lucia, appType: 'change', newStatus })),
    ];
    for (const plan of variants.map(planI539)) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) expect(index.get(name), name).toBeInstanceOf(PDFCheckBox);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
      for (const [name, value] of Object.entries(plan.select)) {
        const field = index.get(name);
        expect(field, name).toBeInstanceOf(PDFDropdown);
        expect((field as PDFDropdown).getOptions().map((o) => o.trim()), `${name}=${value}`).toContain(value);
      }
    }
    const all = planI539(variants[1]);
    expect(all.notes.map((n) => n.item)).toEqual(['3-13', '14', '15']);
    expect(all.check).toContain('P4_checkbox20_Yes[0]');
    expect(planI539({ ...lucia, 'p4.7d': 'yes', 'background.explain': 'x' }).notes[0]).toMatchObject({ page: '4', item: '7.d', text: 'Item 7.d: x' });
    expect(planI539({ ...lucia, 'p4.3': 'yes', 'p4.6': 'yes', 'background.explain': 'x' }).notes[0]).toMatchObject({ page: '3', item: '3,6' });
  });

  it('writes the answers into the official form', async () => {
    const answers: Answers = { ...lucia, 'p4.4': 'yes', 'background.explain': 'My daughter filed Form I-130 for me in 2025 (receipt IOE0912345678). It is pending. I will return to Mexico before my stay ends.' };
    const f = fieldIndex((await PDFDocument.load(await fillI539(template, answers))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    const checked = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    expect(text('P1Line1a_FamilyName[0]')).toBe('Ramirez');
    expect(text('P1Line1a_FamilyName[1]')).toBe('Ramirez');
    expect(text('P1_Line1b_GivenName[0]')).toBe('Lucia');
    expect(text('Part2_Item11_StreetName[0]')).toBe('4521 Westheimer Rd');
    expect(text('Part1_Item4_Number[0]')).toBe('12');
    expect(checked('Part1_Item4_Unit[0]')).toBe(true);
    expect(checked('P1_checkbox5[1]')).toBe(true);
    expect(text('SupA_Line1j_ArrivalDeparture[0]')).toBe('123456789A1');
    expect((f.get('Pt1Line15a_NewStatus[0]') as PDFDropdown).getSelected()[0].trim()).toBe('B2 - TEMPORARY VISITOR FOR PLEASURE');
    expect(text('SupA_Line1p_DateExpires[0]')).toBe('01/01/2027');
    // Extension is the B export, the middle box.
    expect(checked('P2_checkbox[0]')).toBe(true);
    expect(checked('P2_checkbox[2]')).toBe(false);
    expect(checked('P2_checkbox4[1]')).toBe(true);
    expect(text('P2_Line5b_TotalNumber[0]')).toBe('2');
    expect(text('P3_Line1a_DateExtended[0]')).toBe('04/01/2027');
    expect(checked('P3_checkbox2a[0]')).toBe(true);
    expect(checked('P3_checkbox1[0]')).toBe(true);
    // Part 4, Item 2's abroad address is named after Part 2.
    expect(text('P2_Line10_City[0]')).toBe('Guadalajara');
    expect(checked('P4_checkbox4_Yes[0]')).toBe(true);
    expect(checked('P4_checkbox3_No[0]')).toBe(true);
    expect(checked('P4_checkbox19_No[0]')).toBe(true);
    expect(checked('P4_checkbox20_No[0]')).toBe(true);
    expect(text('P8_Line3_C_ItemNumber[0]')).toBe('4');
    expect(text('P8_Line3_D_AdditionalInfo[0]')).toContain('Item 4: My daughter filed Form I-130');
    expect(text('P8_Line4_C_ItemNumber[0]')).toBe('14');
    expect(text('P8_Line4_D_AdditionalInfo[0]')).toContain('How I am supporting myself');
    expect(text('P5_Line3_DaytimePhoneNumber[0]')).toBe('7135550142');
    expect(text('P6_Line7_SignatureApplicant[0]')).toBe('');
    expect(text('SupA_Line1k_Passport[1]')).toBe('');
  });

  it('continues a long explanation in the next Part 8 boxes', async () => {
    const long = Array(50).fill('I worked part time at a restaurant on weekends.').join(' ');
    const f = fieldIndex((await PDFDocument.load(await fillI539(template, { ...lucia, employed: 'yes', 'employed.explain': long, 'p4.12': 'yes', 'background.explain': long }))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    expect([3, 4, 5, 6].map((n) => text(`P8_Line${n}_C_ItemNumber[0]`))).toEqual(['12', '12', '12', '14']);
    expect(text('P8_Line6_D_AdditionalInfo[0]')).toMatch(/\(Continued on attached sheet\.\)$/);
  });
});
