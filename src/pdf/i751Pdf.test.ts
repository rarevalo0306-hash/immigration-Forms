import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { fieldIndex, optionBoxes } from './common';
import { fillI751, planI751 } from './i751Pdf';

const template = readFileSync(new URL('../../public/forms/i-751.pdf', import.meta.url));

/** Carlos from the I-130 example, removing conditions jointly with María two years later. */
export const conditionalResident: Answers = {
  basis: 'A',
  'name.family': 'Ruiz',
  'name.given': 'Carlos',
  'otherName.more0': 'no',
  dob: '03/03/1983',
  birthCountry: 'Mexico',
  citizenship: 'Mexico',
  aNumber: 'A098765432',
  ssn: '987-65-4321',
  marital: 'M',
  'marriage.date': '02/14/2020',
  'marriage.place': 'Los Angeles, CA',
  crExpires: '12/01/2026',
  'mailing.street': '1234 Main St',
  'mailing.unit': 'Apt 4B',
  'mailing.city': 'Los Angeles',
  'mailing.state': 'CA',
  'mailing.zip': '90011',
  physicalDifferent: 'no',
  q18: 'no',
  q19: 'no',
  q20: 'no',
  q21: 'no',
  q22: 'yes',
  q23: 'no',
  'explain.addresses': '55 Oak Ave, Fresno, CA 93701, 06/2023 - 01/2025',
  ethnicity: 'hispanic',
  race: ['WH'] as unknown as string,
  heightFeet: '5',
  heightInches: '9',
  weight: '170',
  eyes: 'BN',
  hair: 'BL',
  relationship: 'A',
  'spouse.family': 'García',
  'spouse.given': 'María',
  'spouse.middle': 'Elena',
  'spouse.dob': '05/12/1985',
  'spouse.ssn': '123-45-6789',
  'spouse.livesWithYou': 'yes',
  'child.more0': 'yes',
  'child1.family': 'Ruiz',
  'child1.given': 'Diego',
  'child1.dob': '07/07/2010',
  'child1.living': 'yes',
  'child1.applying': 'yes',
  'child.more1': 'no',
  'acc.self': 'no',
  'acc.spouse': 'no',
  'acc.children': 'no',
  readsEnglish: 'B',
  fluentLanguage: 'Spanish',
  phone: '213 555 0188',
  'spouse.readsEnglish': 'A',
  'spouse.phone': '(213) 555-0123',
  'spouse.email': 'maria@example.com',
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

describe('I-751 PDF', () => {
  it('plans only fields that exist, with the right kind', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    const kids = Object.fromEntries(
      [1, 2, 3, 4, 5].flatMap((i) => [
        [`child${i}.family`, `K${i}`],
        [`child${i}.aNumber`, '1'],
        [`child${i}.living`, i % 2 ? 'yes' : 'no'],
        [`child${i}.applying`, i % 2 ? 'no' : 'yes'],
        [`child${i}.home.street`, i % 2 ? '' : '1 Calle'],
        [`child${i}.home.unit`, 'Ste 1'],
        [`child${i}.home.state`, 'TX'],
        [`child${i}.home.province`, 'Jalisco'],
        [`child${i}.home.postal`, '44100'],
        [`child${i}.home.country`, 'Mexico'],
        [`child.more${i}`, 'yes'],
      ]),
    );
    const variants: Answers[] = [
      conditionalResident,
      { ...conditionalResident, ...kids, basis: 'B', relationship: 'B', 'otherName.more0': 'yes', 'otherName1.family': 'R', 'otherName.more1': 'yes', 'otherName2.family': 'S', physicalDifferent: 'yes', 'home.street': '9 Elm', 'home.unit': 'Flr 2', 'home.state': 'TX', 'mailing.careOf': 'Ana', 'home.careOf': 'Bo', q18: 'yes', q19: 'yes', q20: 'yes', 'explain.arrests': 'x', q21: 'yes', q22: 'no', q23: 'yes', 'spouse.livesWithYou': 'no', 'spouseHome.street': '1 Rd', 'spouseHome.unit': 'Apt 3', 'spouseHome.state': 'NV', 'spouseHome.province': 'P', 'spouseHome.postal': '1', 'spouseHome.country': 'Mexico', 'spouse.aNumber': '5', 'acc.self': 'yes', 'acc.spouse': 'yes', 'acc.children': 'yes', 'acc.deaf': 'ASL', 'acc.blind': 'Braille', 'acc.other': 'Wheelchair', readsEnglish: 'A', 'spouse.readsEnglish': 'B', 'spouse.language': 'Spanish', mobile: '2135550000', 'spouse.mobile': '2135550001', email: 'c@d.co', ethnicity: 'notHispanic', race: ['WH', 'AS', 'BL', 'AI', 'HW'] as unknown as string },
      { ...conditionalResident, basis: 'waiver', waivers: ['C', 'D', 'E', 'F', 'G'] as unknown as string, marital: 'D', 'marriage.ended': '01/01/2025' },
      { ...conditionalResident, marital: 'W' },
      { ...conditionalResident, marital: 'S' },
      ...['BN', 'BL', 'HA', 'GN', 'BU', 'GR', 'MA', 'PN', 'UN'].map((eyes) => ({ ...conditionalResident, eyes })),
      ...['BL', 'BR', 'BN', 'GR', 'WH', 'RD', 'SA', 'NH', 'OT'].map((hair) => ({ ...conditionalResident, hair })),
      { ...conditionalResident, ...helpers },
      { ...conditionalResident, ...helpers, 'prep.same': 'yes', 'prep.statement': 'notAttorney' },
      { ...conditionalResident, ...helpers, readsEnglish: 'A', 'prep.statement': 'attorneyNotExtends', 'prep.unit': 'Apt 9', 'prep.state': 'TX' },
    ];
    for (const plan of variants.map(planI751)) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) expect(index.get(name), name).toBeInstanceOf(PDFCheckBox);
      for (const name of Object.keys(plan.select)) expect(index.get(name), name).toBeInstanceOf(PDFDropdown);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
    }
  });

  it('fills the interpreter and preparer parts', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI751(template, { ...conditionalResident, ...helpers }))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    const checked = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    expect(checked('P5_Checkbox2[0]')).toBe(true);
    expect(text('P5_Line2_NameofRepresentative[0]')).toBe('Luis Perez');
    expect(checked('P5_Checkbox2_Who[0]')).toBe(true); // is an attorney
    // Joint petition: the spouse's Item 2 names the same preparer.
    expect(checked('P5_Checkbox2[1]')).toBe(true);
    expect(text('P7Line2_NameofRepresentative[0]')).toBe('Luis Perez');
    expect(text('P6_Line1a_InterpretersFamilyName[0]')).toBe('Gomez');
    expect(checked('Pt9Line3_Unit[1]')).toBe(true); // Ste.
    expect(text('Pt9Line3_AptSteFlrNumber[0]')).toBe('210');
    expect(text('P6_Line5_InterpretersEmailAddress[0]')).toBe('rosa@example.com');
    expect(text('P6_Language[0]')).toBe('Spanish');
    expect(text('P7_Line1b_PreparersGivenName[0]')).toBe('Luis');
    expect(text('Pt9Line3_StreetNumberName[0]')).toBe('77 Av Revolucion');
    expect(checked('Pt10Line3_Unit[2]')).toBe(true); // Flr.
    expect(checked('P7_checkbox7[1]')).toBe(true);
    expect(checked('Pt10Item7b_Extends[0]')).toBe(true);
    expect(text('P7_Line5_PreparersFaxNumber[0]')).toBe('');
    const notAttorney = planI751({ ...conditionalResident, ...helpers, 'prep.statement': 'notAttorney' });
    expect(notAttorney.checkValue).toContainEqual(['P7_checkbox7', 'A']);
    expect(notAttorney.checkValue).toContainEqual(['P5_Checkbox2_Who', 'N']);
    expect(planI751({ ...conditionalResident, ...helpers, 'prep.same': 'yes' }).text['P7_Line1a_FamilyName[0]']).toBe('Gómez');
    expect(Object.keys(planI751({ ...conditionalResident, readsEnglish: 'A', preparer: 'no' }).text).filter((k) => /^(P6_|P7_Line|Pt9|Pt10)/.test(k))).toEqual([]);
  });

  it('writes the answers into the official form', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI751(template, conditionalResident))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText();
    const checked = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    expect(text('Pt1Line1a_FamilyName[0]')).toBe('Ruiz');
    expect(text('Pt1Line1a_FamilyName[1]')).toBe('Ruiz');
    expect(text('P1_Line7_AlienNumber[1]')).toBe('098765432');
    expect(checked('Part1_Line10_MaritalStatus[0]')).toBe(true); // M
    expect(text('P1_Line14_CRExpiresOn[0]')).toBe('12/01/2026');
    expect(text('Line17b_Street_Number_Name[0]')).toBe('1234 Main St');
    expect(checked('Line17c_Unit[0]')).toBe(true); // APT
    expect(checked('Line16_Checkbox[0]')).toBe(true); // No
    // Item 18 (removal proceedings) is "Line17_Checkbox"; Item 22 (other addresses) is "Line21_Checkbox".
    expect(checked('Line17_Checkbox[1]')).toBe(true); // 18: No
    expect(checked('Line21_Checkbox[1]')).toBe(true); // 22: Yes
    expect(checked('P3_checkbox6[1]')).toBe(true);
    expect(checked('Pt3Line1[0]')).toBe(true); // 1.a
    expect(checked('Part4_Relationship[1]')).toBe(true); // A
    expect(text('Pt4Line2b_GivenName2[0]')).toBe('Maria');
    expect(text('Pt4Line6_StreetNumberName[0]')).toBe('1234 Main St');
    expect(text('Pt4Line6_Country[0]')).toBe('United States');
    expect(text('Line1b_GivenName3[0]')).toBe('Diego');
    expect(checked('Part5Line5[1]')).toBe(true); // living: Yes
    expect(checked('Part5Line6[0]')).toBe(true); // applying: Yes
    expect(text('Pt5Line6_CityOrTown[0]')).toBe('Los Angeles');
    expect(checked('Part6Line1[0]')).toBe(true); // No
    expect(checked('P5_Checkbox1[1]')).toBe(true); // 1.b
    expect(text('Pt5Line1b_Language[0]')).toBe('Spanish');
    expect(text('P7_Name[0]')).toBe('Carlos Ruiz');
    expect(checked('P8_Checkbox1[0]')).toBe(true); // spouse 1.a
    expect(text('P5_Line3_DaytimePhoneNumber[1]')).toBe('2135550123');
    expect(text('Pt8_Name[0]')).toBe('Maria Elena Garcia');
    expect(text('P8_Line3c_ItemNumber[0]')).toBe('22');
  });

  it('leaves the spouse’s statement blank on a waiver', () => {
    const { text, checkValue, check } = planI751({ ...conditionalResident, basis: 'waiver', waivers: ['D'] as unknown as string });
    expect(text['Pt8_Name[0]']).toBeUndefined();
    expect(checkValue.map(([b]) => b)).not.toContain('P8_Checkbox1');
    expect(check).toContain('Pt3Line1d[0]');
  });
});
