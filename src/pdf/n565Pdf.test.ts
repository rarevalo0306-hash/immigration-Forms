import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { fieldIndex, optionBoxes } from './common';
import { fillN565, planN565 } from './n565Pdf';

const template = readFileSync(new URL('../../public/forms/n-565.pdf', import.meta.url));

/** Jorge, naturalized in Houston, whose certificate was stolen with his wallet. */
export const jorge: Answers = {
  docType: 'NN',
  reasons: ['lost'],
  'lost.explain': 'On March 14, 2025, my wallet was stolen on a METRO bus in Houston, TX. My certificate was inside. I filed a police report.',
  'name.family': 'Ramírez',
  'name.given': 'Jorge',
  'name.middle': 'Luis',
  certNameSame: 'yes',
  dob: '07/22/1978',
  birthCountry: 'Mexico',
  priorCitizenship: 'Mexico',
  certNumber: '41234567',
  aNumber: 'A098765432',
  'cert.office': 'USCIS Houston Field Office',
  'cert.date': '05/10/2016',
  'otherName.more0': 'no',
  'mailing.street': '8120 Bellaire Blvd',
  'mailing.unit': 'Apt 12',
  'mailing.city': 'Houston',
  'mailing.state': 'TX',
  'mailing.zip': '77036',
  'mailing.country': 'United States',
  marital: 'married',
  lostCitizenship: 'no',
  phone: '713 555 0142',
  email: 'jorge.ramirez@example.com',
};

/** An interpreter and a different preparer helped. */
const helped: Answers = {
  readsEnglish: 'B',
  preparer: 'yes',
  'interp.family': 'Gómez',
  'interp.given': 'Lucía',
  'interp.business': 'Ayuda Legal',
  'interp.street': '10 Elm St',
  'interp.unit': 'Apt 7',
  'interp.city': 'Houston',
  'interp.state': 'TX',
  'interp.country': 'United States',
  'interp.phone': '713 555 0100',
  'interp.mobile': '713 555 0101',
  'interp.email': 'lucia@example.com',
  'interp.language': 'Spanish',
  'prep.same': 'no',
  'prep.family': 'Ruiz',
  'prep.given': 'Mario',
  'prep.business': 'Ruiz Forms',
  'prep.phone': '713 555 0200',
  'prep.mobile': '713 555 0201',
  'prep.email': 'mario@example.com',
  'prep.statement': 'notAttorney',
};

const long = 'I left the certificate in a folder at my old apartment when I moved in 2024. '.repeat(6);

describe('N-565 PDF', () => {
  it('plans only fields that exist, with the right kind', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    const variants: Answers[] = [
      jorge,
      ...['NC', 'NR', 'NDI'].map((docType) => ({ ...jorge, docType })),
      ...['single', 'divorced', 'widowed', 'annulled'].map((marital) => ({ ...jorge, marital })),
      {
        ...jorge,
        reasons: ['lost', 'mutilated', 'error', 'name', 'dob', 'sex', 'other'],
        'other.explain': 'Other reason',
        errorItems: ['name', 'dob', 'sex', 'other'],
        'error.explain': 'Family name misspelled',
        nameChangeBy: 'A',
        'nameChange.date': '06/01/2020',
        dobChangeBy: ['A', 'B'],
        'dobChange.courtDate': '01/02/2021',
        'dobChange.govDate': '02/03/2021',
        newDob: '07/23/1978',
        sex: 'female',
        certNameSame: 'no',
        'certName.family': 'Ramires',
        'certName.given': 'Jorge',
        'otherName.more0': 'yes',
        'otherName1.family': 'Ramirez Soto',
        'otherName1.given': 'Jorge',
        'otherName.more1': 'yes',
        'otherName2.family': 'Soto',
        'otherName2.given': 'Jorge',
        'otherName2.middle': 'L',
        'mailing.careOf': 'Ana Soto',
        'mailing.unit': 'Ste 3',
        lostCitizenship: 'yes',
        'lostCitizenship.explain': 'Naturalized in Spain',
      },
      { ...jorge, reasons: ['name'], nameChangeBy: 'B', 'nameChange.date': '06/01/2020', sex: 'male', 'mailing.unit': 'Floor 2', mobile: '713 555 0199' },
      { ...jorge, reasons: ['sex'], sex: 'male' },
      {
        ...jorge,
        docType: 'SCN',
        'foreign.country': 'Mexico',
        'official.family': 'Perez',
        'official.given': 'Ana',
        'official.middle': 'Maria',
        'official.title': 'Consul',
        'official.agency': 'Secretaria de Relaciones Exteriores',
        'official.address.street': '4507 San Jacinto St',
        'official.address.unit': 'Apt 1',
        'official.address.city': 'Houston',
        'official.address.state': 'TX',
        'official.address.zip': '77004',
        'official.address.province': 'n/a',
        'official.address.postal': '0',
        'official.address.country': 'United States',
      },
      { ...jorge, 'official.address.unit': 'Ste 4', docType: 'SCN' },
      { ...jorge, 'official.address.unit': 'Flr 4', docType: 'SCN', 'mailing.province': 'Jalisco', 'mailing.postal': '44100' },
      { ...jorge, ...helped },
      { ...jorge, ...helped, 'prep.same': 'yes', 'prep.statement': 'attorneyExtends' },
      { ...jorge, ...helped, readsEnglish: 'A', 'prep.statement': 'attorneyNotExtends' },
    ];
    for (const plan of variants.map(planN565)) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) expect(index.get(name), name).toBeInstanceOf(PDFCheckBox);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
      for (const name of Object.keys(plan.select)) expect(index.get(name), name).toBeInstanceOf(PDFDropdown);
      for (const l of plan.long) expect(index.get(l.field), l.field).toBeInstanceOf(PDFTextField);
    }
    const all = planN565(variants[8]);
    expect(all.check).toEqual(expect.arrayContaining(['Pt3CheckBox2a[0]', 'Pt3CheckBox3[0]', 'Pt3CheckBox4[0]', 'Pt3CheckBox5[0]', 'Pt3CheckBox6[0]', 'Pt3CheckBox7[0]', 'Pt3CheckBox8a[0]']));
    expect(all.text['P1Line1_FamilyName[0]']).toBe('Ramires');
    expect(all.text['P1Line1_FamilyName[1]']).toBe('Ramírez');
    expect(all.text['P2Line2_MiddleName2[0]']).toBe('L');
    expect(all.notes[0].item).toBe('5');
    // Reasons and Part 8 don't apply to each other.
    expect(planN565({ ...variants[8], docType: 'SCN' }).check).toEqual([]);
    expect(planN565(jorge).text['Pt8Line1_NameOfForeignCountry[0]']).toBeUndefined();
  });

  it('writes the answers into the official form', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillN565(template, jorge))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText();
    const checked = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    expect(text('P1Line1_FamilyName[0]')).toBe('Ramirez');
    expect(text('P2_Line1_FamilyName[0]')).toBe('Ramirez');
    expect(text('_CountryOfBirth[0]')).toBe('Mexico');
    expect(text('P1Line4_CertificateNumber[0]')).toBe('41234567');
    expect(text('ANum[0]')).toBe('098765432');
    expect(text('ANum[1]')).toBe('098765432');
    expect(text('P1Line6_DateOfDeclaration[0]')).toBe('05/10/2016');
    expect(text('P2Line3_AptSteFlrNumber[0]')).toBe('12');
    expect((f.get('P2Line3_State[0]') as PDFDropdown).getSelected().map((s) => s.trim())).toEqual(['TX']);
    expect(optionBoxes(f, 'P2Line3_Unit').find((o) => o.value === 'APT')?.box.isChecked()).toBe(true);
    expect(optionBoxes(f, 'Part3_Item1').find((o) => o.value === 'NN')?.box.isChecked()).toBe(true);
    expect(optionBoxes(f, 'Part3_Item1').find((o) => o.value === 'NC')?.box.isChecked()).toBe(false);
    // Part 2, Item 4 (marital status) is named "Part2_Item5".
    expect(optionBoxes(f, 'Part2_Item5').find((o) => o.value === 'Married')?.box.isChecked()).toBe(true);
    expect(optionBoxes(f, 'Part2_Item6').find((o) => o.value === 'No')?.box.isChecked()).toBe(true);
    expect(checked('Pt3CheckBox2a[0]')).toBe(true);
    expect(checked('Pt3CheckBox3[0]')).toBe(false);
    expect(text('Pt3Line2b_Explanation[0]')).toContain('METRO bus');
    expect(text('Pt9Line3_DaytimeTelephoneNumber3[0]')).toBe('7135550142');
    expect(text('Pt9Line5_Email[0]')).toBe('jorge.ramirez@example.com');
    expect(text('Pt9Line6_DateofSignature[0]') ?? '').toBe('');
    expect(text('P12_Line3d_AdditionalInfo[0]') ?? '').toBe('');
  });

  it('fills the interpreter’s and preparer’s parts', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillN565(template, { ...jorge, ...helped }))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText();
    expect(text('Pt10Line1_InterpreterFamilyName[0]')).toBe('Gomez');
    expect(text('Pt10Line4_DaytimeTelephoneNumber[0]')).toBe('7135550100');
    expect(text('Pt10Line6_Email[0]')).toBe('lucia@example.com');
    expect(text('Pt10_Iamfluent[0]')).toBe('Spanish');
    expect(text('Pt11Line1_PreparerFamilyName[0]')).toBe('Ruiz');
    expect(text('Pt11Line4_DaytimeTelephoneNumber[0]')).toBe('7135550200');
    expect(text('Pt11Line8_DateOfSignature[0]')).toBeUndefined();

    const same = fieldIndex(await PDFDocument.load(await fillN565(template, { ...jorge, ...helped, 'prep.same': 'yes' })).then((d) => d.getForm()));
    expect((same.get('Pt11Line1_PreparerFamilyName[0]') as PDFTextField).getText()).toBe('Gomez');

    const alone = fieldIndex((await PDFDocument.load(await fillN565(template, jorge))).getForm());
    expect((alone.get('Pt10Line1_InterpreterFamilyName[0]') as PDFTextField).getText()).toBeUndefined();
  });

  it('moves long explanations to Part 12', async () => {
    const a: Answers = { ...jorge, reasons: ['lost', 'error'], 'lost.explain': long, errorItems: ['sex'], 'error.explain': 'Sex printed as male.', lostCitizenship: 'yes', 'lostCitizenship.explain': 'Renounced at a consulate' };
    const f = fieldIndex((await PDFDocument.load(await fillN565(template, a))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    // Part 4, Item 1's "Sex" box is "Pt4_Item1_Gender" (export Widowed).
    expect((f.get('Pt4_Item1_Gender[0]') as PDFCheckBox).isChecked()).toBe(true);
    expect((f.get('Pt4_Item1_Name[0]') as PDFCheckBox).isChecked()).toBe(false);
    expect(text('Pt3Line2b_Explanation[0]')).toContain('See Part 12');
    expect(text('Pt4_AdditionalInfo[0]')).toBe('Sex printed as male.');
    expect(text('P12_Line3b_PartNumber[0]')).toBe('3');
    expect(text('P12_Line3c_ItemNumber[0]')).toBe('2.a(1)');
    expect(text('P12_Line3d_AdditionalInfo[0]')).toContain('old apartment');
    expect(text('P12_Line4b_PartNumber[0]')).toBe('2');
    expect(text('P12_Line4d_AdditionalInfo[0]')).toBe('Renounced at a consulate');
  });
});
