import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { BACKGROUND_ITEMS } from '../forms/i601a';
import { fieldIndex, optionBoxes } from './common';
import { backgroundBase, fillI601A, planI601A } from './i601aPdf';

const template = readFileSync(new URL('../../public/forms/i-601a.pdf', import.meta.url));

/** Luis, who entered without inspection in 2008 and is married to a U.S. citizen. */
export const luis: Answers = {
  'name.family': 'Ramirez',
  'name.given': 'Luis',
  aNumber: 'A215559876',
  'otherName.more0': 'no',
  'mailing.street': '1450 E 4th St',
  'mailing.unit': 'Apt 2',
  'mailing.city': 'Los Angeles',
  'mailing.state': 'CA',
  'mailing.zip': '90033',
  mailingSame: 'yes',
  sex: 'male',
  dob: '09/14/1987',
  birthCity: 'Morelia',
  birthCountry: 'Mexico',
  citizenship: 'Mexico',
  'mother.family': 'Lopez',
  'mother.given': 'Maria',
  'father.family': 'Ramirez',
  'father.given': 'Jose',
  'lastEntry.date': '03/10/2008',
  'lastEntry.place': 'Tijuana',
  'lastEntry.state': 'CA',
  'lastEntry.status': 'EWI',
  'prevEntry.more0': 'no',
  proceedings: 'no',
  finalOrder: 'no',
  i871: 'no',
  voluntaryDeparture: 'no',
  ...Object.fromEntries(BACKGROUND_ITEMS.map((i) => [i.id, 'no'])),
  ethnicity: 'hispanic',
  race: ['WH'],
  heightFeet: '5',
  heightInches: '8',
  weight: '170',
  eyes: 'BN',
  hair: 'BL',
  basis: '2',
  'petition.receipt': 'IOE0912345678',
  'petition.nvc': 'CDJ2025123456',
  'petitioner.family': 'Ramirez',
  'petitioner.given': 'Ana',
  'qualifying1.family': 'Ramirez',
  'qualifying1.given': 'Ana',
  'qualifying1.relationship': 'A',
  'qualifying.more1': 'no',
  'hardship.statement': 'My wife Ana has diabetes and depends on me for her care and for our income.',
  readsEnglish: 'B',
  fluentLanguage: 'Spanish',
  preparer: 'no',
  phone: '323 555 0144',
};

describe('I-601A PDF', () => {
  it('names Items 32-45 one number early', () => {
    expect(backgroundBase('p1.32')).toBe('Pt1Checkbox31_Checkbox');
    expect(backgroundBase('p1.39a')).toBe('Pt1Checkbox38a_Checkbox');
    expect(backgroundBase('p1.40b')).toBe('Pt1Checkbox39b_Checkbox');
    expect(backgroundBase('p1.45')).toBe('Pt1Checkbox44_Checkbox');
  });

  it('plans only fields that exist, with the right kind', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    const variants: Answers[] = [
      luis,
      {
        ...luis,
        ...Object.fromEntries(BACKGROUND_ITEMS.map((i) => [i.id, 'yes'])),
        'background.explain': 'Arrested in 2010, no charges',
        'otherName.more0': 'yes',
        'otherName1.family': 'Ramos',
        'otherName.more1': 'yes',
        'otherName2.family': 'Lopez',
        mailingSame: 'no',
        'home.street': '1 Main',
        'home.unit': 'Flr 2',
        'home.state': 'CA',
        'mailing.unit': 'Ste 3',
        'prevEntry.more0': 'yes',
        'prevEntry1.place': 'Nogales',
        'prevEntry1.state': 'AZ',
        'prevEntry.more1': 'yes',
        'prevEntry2.place': 'El Paso',
        'prevEntry2.state': 'TX',
        'prevEntry.more2': 'yes',
        'otherEntries.explain': 'Laredo, TX, 2001',
        proceedings: 'yes',
        proceedingsStatus: 'A',
        finalOrder: 'yes',
        'i212.receipt': 'NBC1234567890',
        i871: 'yes',
        reinstated: 'no',
        voluntaryDeparture: 'yes',
        ethnicity: 'notHispanic',
        race: ['WH', 'AS', 'BL', 'AI', 'HW'],
        basis: '1',
        'dv.caseNumber': '2026SA12345',
        'dv.selectee.family': 'Perez',
        'qualifying.more1': 'yes',
        'qualifying2.family': 'Ramirez',
        'qualifying2.relationship': 'D',
        readsEnglish: 'A',
        preparer: 'yes',
        'preparer.name': 'Ana Ruiz',
      },
      ...['BL', 'HA', 'GN', 'BU', 'GR', 'MA', 'PN', 'UN'].map((eyes, i) => ({ ...luis, eyes, hair: ['BR', 'BN', 'GR', 'WH', 'RD', 'SA', 'NH', 'OT'][i], 'qualifying1.relationship': 'ABCD'[i % 4], basis: String((i % 4) + 2), proceedings: 'yes', proceedingsStatus: 'B' })),
    ];
    for (const plan of variants.map(planI601A)) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) expect(index.get(name), name).toBeInstanceOf(PDFCheckBox);
      for (const name of Object.keys(plan.select)) expect(index.get(name), name).toBeInstanceOf(PDFDropdown);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
    }
    expect(planI601A(variants[1]).notes.map((n) => n.item)).toEqual(['26', '32-45']);
  });

  it('writes the answers into the official form', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI601A(template, { ...luis, eyes: 'GR' }))).getForm());
    const text = (n: string) => ((f.get(n) as PDFTextField).getText() ?? '').replace(/\s+/g, ' ');
    const checked = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    expect(text('Pt1Line1_AlienNumber[0]')).toBe('215559876');
    expect(text('Pt1Line4a_FamilyName[1]')).toBe('Ramirez');
    expect(text('Pt1Line7c_AptSteFlrNumber[0]')).toBe('2');
    expect(checked('Pt1Line8_Checkbox[0]')).toBe(true); // Yes
    expect(text('Pt1Line18a_PlaceOfEntry[0]')).toBe('Tijuana');
    expect(checked('Pt1Checkbox25_Checkbox[1]')).toBe(true); // Item 26: No
    expect(checked('Pt1Checkbox30_Checkbox[1]')).toBe(true); // Item 31: No
    expect(checked('Pt1Checkbox44_Checkbox[1]')).toBe(true); // Item 45: No
    expect(checked('Pt2Checkbox1[1]')).toBe(true); // Hispanic
    expect(checked('Pt2Checkbox5[1]')).toBe(true); // the box printed as Gray
    expect(text('Pt2Line4_HeightInches1[0]')).toBe('1');
    expect(checked('Pt3Line4_Option2[0]')).toBe(true);
    expect(text('Pt3Line3a_USCISReceiptNumber[0]')).toBe('IOE0912345678');
    expect(text('Pt3Line2b_GivenName[1]')).toBe('Ana');
    expect(checked('Pt4Line2a_Checkbox[0]')).toBe(true);
    expect(text('Pt5Line1_ApplicantStatement[0]')).toContain('diabetes');
    expect(checked('Pt6Checkbox1[0]')).toBe(true); // B: interpreter
    expect(text('Pt9Line3d_AdditionalInfo[0]')).toBe('');
  });

  it('moves a long statement to Part 9', async () => {
    const long = Array(150).fill('My wife needs me to drive her to dialysis three times a week.').join(' ');
    const f = fieldIndex((await PDFDocument.load(await fillI601A(template, { ...luis, 'hardship.statement': long }))).getForm());
    const text = (n: string) => ((f.get(n) as PDFTextField).getText() ?? '').replace(/\s+/g, ' ');
    expect(text('Pt5Line1_ApplicantStatement[0]')).toBe('See Part 9. Additional Information, Part 5.');
    expect(text('Pt9Line3b_PartNumber[0]')).toBe('5');
    expect(text('Pt9Line3d_AdditionalInfo[0]')).toContain('dialysis');
  });
});
