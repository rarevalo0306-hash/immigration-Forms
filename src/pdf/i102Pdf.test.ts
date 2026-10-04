import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { REASONS } from '../forms/i102';
import { fieldIndex, optionBoxes } from './common';
import { countryName, fillI102, planI102 } from './i102Pdf';

const template = readFileSync(new URL('../../public/forms/i-102.pdf', import.meta.url));

/** Julio, a B-2 visitor who crossed at San Ysidro, lost his paper I-94 and is extending his stay. */
export const julio: Answers = {
  reason: 'a',
  'name.family': 'Ramírez',
  'name.given': 'Julio',
  'name.middle': 'César',
  aNumber: '',
  uscisAccount: '',
  'otherName.more0': 'no',
  'mailing.careOf': 'Lucía Ramírez',
  'mailing.street': '4521 Whittier Blvd',
  'mailing.unit': 'Apt 12',
  'mailing.city': 'Los Angeles',
  'mailing.state': 'CA',
  'mailing.zip': '90022',
  mailingSame: 'yes',
  dob: '07/19/1968',
  birthCountry: 'México',
  citizenship: 'Mexico',
  ssn: '',
  'lastEntry.date': '06/02/2026',
  'lastEntry.place': 'San Ysidro',
  'lastEntry.state': 'CA',
  'entry.class': 'b2',
  portType: 'land',
  'status.current': 'B-2 visitor',
  'status.expires': '12/01/2026',
  'i94.number': '123456789A1',
  'passport.number': 'g12345678',
  'passport.country': 'Mexico',
  'passport.expires': '03/14/2031',
  i94SameName: 'yes',
  otherFiling: 'yes',
  'otherFiling.form': 'I-539, Application to Extend/Change Nonimmigrant Status',
  removal: 'no',
  phone: '(323) 555-0147',
  email: 'julio.ramirez@example.com',
};

/** A friend interpreted and a nonprofit prepared Julio's form: Parts 5 and 6. */
const helped: Answers = {
  ...julio,
  readsEnglish: 'B',
  preparer: 'yes',
  'interp.family': 'Gómez',
  'interp.given': 'Rosa',
  'interp.business': 'Servicios Latinos',
  'interp.phone': '(323) 555-0101',
  'interp.mobile': '1 323 555 0102',
  'interp.email': 'rosa@example.com',
  'interp.language': 'Spanish',
  'prep.same': 'no',
  'prep.family': 'Lee',
  'prep.given': 'Ana',
  'prep.business': 'East LA Immigrant Center',
  'prep.phone': '323 555 0199',
  'prep.mobile': '323 555 0198',
  'prep.email': 'ana@example.com',
  'prep.statement': 'notAttorney',
};

const longText = 'Immigration Court in Los Angeles, California. '.repeat(30);

describe('I-102 PDF', () => {
  it('reads Spanish country names', () => {
    expect(countryName('México')).toBe('MEXICO');
    expect(countryName('República Dominicana')).toBe('DOMINICAN REPUBLIC');
    expect(countryName('Estados Unidos')).toBe('UNITED STATES');
  });

  it('plans only fields that exist, with the right kind', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    const variants: Answers[] = [
      julio,
      helped,
      { ...helped, 'prep.same': 'yes' },
      ...['attorneyExtends', 'attorneyNotExtends'].map((st) => ({ ...helped, 'prep.statement': st })),
      ...REASONS.map((r) => ({ ...julio, reason: r.value })),
      ...['land', 'air', 'sea'].map((portType) => ({ ...julio, portType })),
      ...['Apt 3', 'Ste 200', 'Flr 2'].map((unit) => ({ ...julio, 'mailing.unit': unit, mailingSame: 'no', 'home.street': '1 Main St', 'home.unit': unit, 'home.city': 'Fresno', 'home.state': 'CA', 'home.zip': '93701', 'home.careOf': 'Ana' })),
      {
        ...julio,
        reason: 'f',
        'reason.explain': 'Date of birth is wrong.',
        aNumber: 'A12345678',
        uscisAccount: '123456789012',
        ssn: '123-45-6789',
        'otherName.more0': 'yes',
        'otherName1.family': 'Ramos',
        'otherName1.given': 'Julio',
        'otherName.more1': 'yes',
        'otherName2.family': 'Ruiz',
        'otherName2.given': 'J.',
        'otherName.more2': 'yes',
        'otherName3.family': 'Rey',
        mailingSame: 'no',
        i94SameName: 'no',
        'i94.family': 'Ramirez Lopez',
        'i94.given': 'Julio',
        'travelDoc.number': 'TD123',
        otherFiling: 'no',
        removal: 'yes',
        'removal.explain': longText,
      },
    ];
    for (const plan of variants.map(planI102)) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) expect(index.get(name), name).toBeInstanceOf(PDFCheckBox);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
      for (const name of Object.keys(plan.select)) expect(index.get(name), name).toBeInstanceOf(PDFDropdown);
      for (const l of plan.long) expect(index.get(l.field), l.field).toBeInstanceOf(PDFTextField);
    }
    const rich = planI102(variants[variants.length - 1]);
    expect(rich.check).toContain('Pt2Line1f_Reason[0]');
    expect(rich.check).toContain('Line2a_Yes[0]');
    expect(rich.check).toContain('Line1a_No[0]');
    expect(rich.text['Pt1Line19a_FamilyName[0]']).toBe('Ramirez Lopez');
    expect(rich.notes[0]).toEqual({ page: '1', part: '1', item: '4', text: 'Other names used: J. Ruiz; Rey' });
  });

  it('writes the answers into the official form', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI102(template, julio))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText();
    const checked = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    const selected = (n: string) => (f.get(n) as PDFDropdown).getSelected().map((s) => s.trim());
    expect(text('Pt1Line3a_FamilyName[0]')).toBe('Ramirez');
    expect(text('Pt1Line3a_FamilyName[1]')).toBe('Ramirez');
    // Item 5 (mailing address) lives in fields named for Item 4.
    expect(text('Pt1Line5a_InCareofName[0]')).toBe('Lucia Ramirez');
    expect(text('Pt1Line4b_StreetNumberName[0]')).toBe('4521 Whittier Blvd');
    expect(text('Pt1Line4c_AptSteFlrNumber[0]')).toBe('12');
    expect(optionBoxes(f, 'Pt1Line4c_Unit').find((o) => o.value === 'APT')?.box.isChecked()).toBe(true);
    expect(selected('Pt1Line4e_State[0]')).toEqual(['CA']);
    expect(checked('Pt1Line6_yes[0]')).toBe(true);
    expect(selected('Pt1Line9_CountryOfBirth[0]')).toEqual(['MEXICO']);
    expect(selected('Pt1Line13_POE[0]')).toEqual(['SAN YSIDRO, CA']);
    expect(text('Pt1Line14_ClassofAdmission[0]')).toBe('B2');
    expect(checked('Pt1Line15_LandBorder[0]')).toBe(true);
    expect(text('Pt1Line18a_ArrivalDeparture[0]')).toBe('123456789A1');
    expect(text('Pt1Line19b_GivenName[0]')).toBe('Julio');
    expect(checked('Pt2Line1a_Reason[0]')).toBe(true);
    expect(checked('Line1a_Yes[0]')).toBe(true);
    // Both boxes of Part 3, Item 2.a export "Y": only "No" is checked.
    expect(checked('Line2a_No[0]')).toBe(true);
    expect(checked('Line2a_Yes[0]')).toBe(false);
    expect(text('Pt4Line1_DaytimePhoneNumber1[0]')).toBe('3235550147');
    expect(text('Pt4Line4_SignatureofApplicant[0]') ?? '').toBe('');
    expect(text('Pt5Line1_InterpreterFamilyName[0]') ?? '').toBe('');
  });

  it('fills the interpreter and preparer parts', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI102(template, helped))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    expect(text('Pt5Line1_InterpreterFamilyName[0]')).toBe('Gomez');
    expect(text('Pt5Line4_MobilePhoneNumber1[0]')).toBe('3235550102');
    expect(text('Pt5FluentinLanguage[0]')).toBe('Spanish');
    expect(text('Pt6Line1_PreparerFamilyName[0]')).toBe('Lee');
    expect(text('Pt6Line4_DaytimePhoneNumber1[0]')).toBe('3235550198');
    expect(text('Pt6Line6_SignatureofPreparer[0]')).toBe('');
    const same = fieldIndex((await PDFDocument.load(await fillI102(template, { ...helped, 'prep.same': 'yes' }))).getForm());
    expect((same.get('Pt6Line1_PreparerFamilyName[0]') as PDFTextField).getText()).toBe('Gomez');
  });

  it('moves long explanations to Part 7 and types unknown ports in', async () => {
    const a: Answers = { ...julio, removal: 'yes', 'removal.explain': longText, 'lastEntry.place': 'Tiny Crossing', 'lastEntry.state': 'ND' };
    const f = fieldIndex((await PDFDocument.load(await fillI102(template, a))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText();
    expect(text('Pt3Line2b_AddiitionalInfo[0]')).toContain('See Part 7');
    expect(text('Pt7Line3b_PartNumber[0]')).toBe('3');
    expect(text('Pt7Line3c_ItemNumber[0]')).toBe('2.b');
    expect(text('Pt7Line3d_AdditionalInfo[0]')).toContain('Immigration Court');
    expect((f.get('Pt1Line13_POE[0]') as PDFDropdown).getSelected()).toEqual(['TINY CROSSING, ND']);
  });
});
