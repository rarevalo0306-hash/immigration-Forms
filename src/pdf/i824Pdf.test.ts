import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { fieldIndex, optionBoxes } from './common';
import { fillI824, planI824 } from './i824Pdf';

const template = readFileSync(new URL('../../public/forms/i-824.pdf', import.meta.url));

/** Jorge, a new resident through his job, asking for his wife and son in Guatemala to follow to join him. */
export const jorge: Answers = {
  request: '1c',
  consulate: 'Guatemala City, Guatemala',
  'original.form': 'I-485',
  'original.receipt': 'IOE-0912345678',
  'original.filed': '03/15/2024',
  'original.approved': '06/20/2026',
  filerRole: 'applicant',
  'name.family': 'Pérez',
  'name.given': 'Jorge',
  'name.middle': 'Luis',
  filerStatus: 'lpr',
  aNumber: 'A212345678',
  dob: '11/02/1988',
  birthCountry: 'Guatemala',
  citizenship: 'Guatemala',
  ssn: '612-34-5678',
  'mailing.street': '4521 Fruitridge Rd',
  'mailing.unit': 'Apt 12',
  'mailing.city': 'Sacramento',
  'mailing.state': 'CA',
  'mailing.zip': '95820',
  'mailing.country': 'United States',
  mailingSame: 'yes',
  'dependent1.family': 'Ramírez',
  'dependent1.given': 'Ana',
  'dependent1.middle': 'Lucía',
  'dependent1.dob': '05/14/1990',
  'dependent1.birthCountry': 'Guatemala',
  'dependent1.citizenship': 'Guatemala',
  'dependent1.relationship': 'spouse',
  'dependent1.email': 'ana.ramirez@example.com',
  'dependent1.phone': '5025551234',
  'dependent.more1': 'yes',
  'dependent2.family': 'Pérez Ramírez',
  'dependent2.given': 'Mateo',
  'dependent2.dob': '08/30/2015',
  'dependent2.birthCountry': 'Guatemala',
  'dependent2.citizenship': 'Guatemala',
  'dependent2.relationship': 'child',
  'dependent.more2': 'no',
  'dependents.address.street': '5a Avenida 10-25',
  'dependents.address.unit': 'Apt 3',
  'dependents.address.city': 'Quetzaltenango',
  'dependents.address.province': 'Quetzaltenango',
  'dependents.address.postal': '09001',
  'dependents.address.country': 'Guatemala',
  'dependents.phone': '5025551234',
  'additional.text': 'My wife and son were my spouse and child when I adjusted status on 06/20/2026.',
  phone: '916 555 0142',
  mobile: '916 555 0199',
  email: 'jorge.perez@example.com',
};

/** Carmen, a citizen who lost the approval notice of her I-130 for her brother. */
const carmen: Answers = {
  request: '1a',
  'original.form': 'I-130',
  'original.receipt': 'MSC2190123456',
  'original.filed': '01/10/2021',
  'original.approved': '02/02/2023',
  filerRole: 'petitioner',
  'name.family': 'Flores',
  'name.given': 'Carmen',
  filerStatus: 'usc',
  certificate: '12345678',
  dob: '07/07/1975',
  birthCountry: 'El Salvador',
  citizenship: 'United States',
  uscisAccount: '123456789012',
  'mailing.careOf': 'Rosa Flores',
  'mailing.street': '800 Main St',
  'mailing.unit': 'Ste 200',
  'mailing.city': 'Houston',
  'mailing.state': 'TX',
  'mailing.zip': '77002',
  'mailing.country': 'United States',
  mailingSame: 'no',
  'home.street': '15 Elm St',
  'home.unit': 'Flr 2',
  'home.city': 'Houston',
  'home.state': 'TX',
  'home.zip': '77003',
  'home.country': 'United States',
  'beneficiary.family': 'Flores',
  'beneficiary.given': 'Miguel',
  'beneficiary.dob': '03/03/1980',
  'beneficiary.birthCountry': 'El Salvador',
  'beneficiary.aNumber': '98765432',
  'beneficiary.phone': '50371234567',
  'beneficiary.mailing.street': 'Calle Arce 123',
  'beneficiary.mailing.unit': 'Apt 5',
  'beneficiary.mailing.city': 'San Salvador',
  'beneficiary.mailing.country': 'El Salvador',
  'beneficiary.mailingSame': 'no',
  'beneficiary.home.street': 'Colonia Escalon 4',
  'beneficiary.home.unit': 'Ste 1',
  'beneficiary.home.city': 'San Salvador',
  'beneficiary.home.country': 'El Salvador',
  'additional.text': 'The original approval notice was lost when I moved. '.repeat(40),
  phone: '713 555 0100',
  email: 'carmen@example.com',
};

const fourDependents: Answers = { ...jorge };
for (let i = 1; i <= 4; i++) {
  fourDependents[`dependent${i}.family`] = `Family ${i}`;
  fourDependents[`dependent${i}.given`] = `Given ${i}`;
  fourDependents[`dependent${i}.middle`] = 'M';
  fourDependents[`dependent${i}.dob`] = '01/01/2010';
  fourDependents[`dependent${i}.birthCountry`] = 'Guatemala';
  fourDependents[`dependent${i}.citizenship`] = 'Guatemala';
  fourDependents[`dependent${i}.relationship`] = 'child';
  fourDependents[`dependent${i}.email`] = `kid${i}@example.com`;
  fourDependents[`dependent${i}.phone`] = '5025550000';
  fourDependents[`dependent.more${i}`] = 'yes';
}
fourDependents['dependents.extra'] = 'Sofia Perez, 02/02/2018, born Guatemala, citizen of Guatemala, child.';

/** A friend interpreted and a nonprofit prepared Jorge's form: Parts 5 and 6. */
const helped: Answers = {
  ...jorge,
  readsEnglish: 'B',
  preparer: 'yes',
  'interp.family': 'Gómez',
  'interp.given': 'Rosa',
  'interp.business': 'Servicios Latinos',
  'interp.phone': '(916) 555-0101',
  'interp.mobile': '1 916 555 0102',
  'interp.email': 'rosa@example.com',
  'interp.language': 'Spanish',
  'prep.same': 'no',
  'prep.family': 'Lee',
  'prep.given': 'Ana',
  'prep.business': 'Sacramento Immigrant Center',
  'prep.phone': '916 555 0199',
  'prep.mobile': '916 555 0198',
  'prep.email': 'ana.lee.immigration.help@example.com',
  'prep.statement': 'notAttorney',
};

describe('I-824 PDF', () => {
  it('plans only fields that exist, with the right kind', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    const variants: Answers[] = [
      jorge,
      carmen,
      fourDependents,
      { ...carmen, request: '1b', consulate: 'Monterrey, Mexico', filerStatus: 'other', 'filerStatus.other': 'H-1B', 'beneficiary.mailingSame': 'yes' },
      { ...carmen, request: '1d', mobile: '713 555 0101' },
      { ...carmen, request: '1e', 'mailing.unit': 'Apt 1', 'home.unit': 'Ste 9' },
      { ...jorge, filerRole: 'petitioner', 'mailing.unit': 'Flr 3', 'dependents.address.unit': 'Ste 4' },
      { ...jorge, 'dependents.address.unit': 'Flr 5', 'beneficiary.mailing.unit': 'Flr 1' },
      helped,
      { ...helped, 'prep.same': 'yes' },
      ...['attorneyExtends', 'attorneyNotExtends'].map((st) => ({ ...helped, 'prep.statement': st })),
    ];
    for (const plan of variants.map(planI824)) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) expect(index.get(name), name).toBeInstanceOf(PDFCheckBox);
      for (const name of Object.keys(plan.select)) expect(index.get(name), name).toBeInstanceOf(PDFDropdown);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
    }
    expect(planI824(variants[2]).text['Part3_Line25_InterpretersDaytimeTelephoneNumber3[0]']).toBe('5025550000');
    expect(planI824(variants[2]).notes[0].item).toBe('5-11');
    expect(planI824(variants[3]).text['Lineb1_ConsulateorPOE[0]']).toBe('Monterrey, Mexico');
    expect(planI824(variants[3]).text['Part1_Line4_CurrentOrRecentImmigrationStatus[0]']).toBe('H-1B');
    expect(planI824(variants[3]).text['Pt3Line4_StreetNumberName[0]']).toBe('Calle Arce 123');
    expect(planI824(carmen).text['Part3_Line5a_FamilyName[0]']).toBeUndefined();
    expect(planI824(jorge).text['Part3_Line2a_FamilyName[0]']).toBeUndefined();
  });

  it('writes the answers into the official form', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI824(template, jorge))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText();
    const checked = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    expect(checked('Checkbox1_applicant[0]')).toBe(true);
    expect(checked('Checkbox1_petitioner[0]')).toBe(false);
    expect(checked('P2_Request[2]')).toBe(true);
    expect(checked('P2_Request[0]')).toBe(false);
    expect(text('Line1c_ConsulateorPOE[0]')).toBe('Guatemala City, Guatemala');
    expect(text('Part1_Line2a_FamilyName[0]')).toBe('Perez');
    expect(text('Part1_Line2a_FamilyName[1]')).toBe('Perez');
    expect(text('Part1_Line6_AlienNumber[1]')).toBe('212345678');
    expect(text('Part1_Line4_CurrentOrRecentImmigrationStatus[0]')).toBe('Lawful Permanent Resident');
    expect(checked('Line13c_Unit[0]')).toBe(true);
    expect(text('Line13c_AptSteFlrNumber[0]')).toBe('12');
    expect((f.get('Part1_Line13e_State[0]') as PDFDropdown).getSelected()[0].trim()).toBe('CA');
    expect(text('Part1_Line14_StreetNumberName[0]')).toBe('4521 Fruitridge Rd');
    expect(text('Part3_Line1b_ReceiptNumber[0]')).toBe('IOE0912345678');
    expect(text('Part3_Line1d_Date[0]')).toBe('06/20/2026');
    expect(text('Part3_Line9_Relationship[0]')).toBe('Spouse');
    expect(text('Part3_Line5i_DependentDaytimeTelephoneNumber3[0]')).toBe('5025551234');
    expect(text('Part3_Line16_Relationship[0]')).toBe('Child');
    expect(text('Pt3Line33_CityOrTown[0]')).toBe('Quetzaltenango');
    expect(text('Part4_Line5_ApplicantMobilePhoneNumber[0]')).toBe('9165550199');
    expect(text('Part7_Line3c_ItemNumber[0]')).toBe('1');
    expect(text('Part4_Line4_Signature[0]') ?? '').toBe('');
    expect(text('Part5_Line1_InterpretersFamilyName[0]') ?? '').toBe('');
  });

  it('fills the interpreter and preparer parts', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI824(template, helped))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    expect(text('Part5_Line1_InterpretersFamilyName[0]')).toBe('Gomez');
    expect(text('Part5_Line4_InterpretersMobileTelephoneNumber[0]')).toBe('9165550102');
    expect(text('Part5_Line5_InterpreterEmailAddress[0]')).toBe('rosa@example.com');
    expect(text('Part5_Line6_Language[0]')).toBe('Spanish');
    expect(text('Part6_Line1_PreparerFamilyName[0]')).toBe('Lee');
    expect(text('Part6_Line4_PreparersMobileNumber3[0]')).toBe('9165550198');
    // The preparer's email is longer than the box: it goes to Part 7.
    expect(text('Part6_Line5_PreparerEmailAddress[0]')).toBe('See Part 7');
    expect(planI824(helped).notes).toContainEqual({ page: '5', part: '6', item: '5', text: "Preparer's email address: ana.lee.immigration.help@example.com" });
    expect(text('Part6_Line6_PreparerSignature[0]')).toBe('');
    const same = fieldIndex((await PDFDocument.load(await fillI824(template, { ...helped, 'prep.same': 'yes' }))).getForm());
    expect((same.get('Part6_Line1_PreparerFamilyName[0]') as PDFTextField).getText()).toBe('Gomez');
  });

  it('carries a long explanation into the next Part 7 boxes', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI824(template, carmen))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    expect(text('Part7_Line3d_AdditionalInfo[0]')).toContain('approval notice');
    expect(text('Part7_Line4d_AdditionalInfo[0]')).toContain('approval notice');
    expect(text('Part7_Line4b_PartNumber[0]')).toBe('2');
    expect(text('Part3_Line2f_AlienNumber[0]')).toBe('098765432');
    expect(text('Pt3Line3_InCareOfName[0]')).toBe('');
    expect(text('Part1_Line13a_InCareOfName[0]')).toBe('Rosa Flores');
    expect(text('Part1_Line14_StreetNumberName[0]')).toBe('15 Elm St');
  });
});
