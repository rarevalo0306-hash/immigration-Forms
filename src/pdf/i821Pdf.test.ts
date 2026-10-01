import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { P7_ITEMS } from '../forms/i821Part7';
import { fieldIndex, fieldsBySegment, lastSegment, optionBoxes } from './common';
import { fillI821, planI821, resolve } from './i821Pdf';

const template = readFileSync(new URL('../../public/forms/i-821.pdf', import.meta.url));

const allNo = Object.fromEntries(P7_ITEMS.map((it) => [`p7.${it.item}`, 'no']));
const allYes = Object.fromEntries(P7_ITEMS.map((it) => [`p7.${it.item}`, 'yes']));

/** Andrés, re-registering the TPS for Venezuela he has had since 2021. */
export const reRegistrant: Answers = {
  appType: '1b',
  grantedBy: 'U',
  ead: 'A',
  tpsCountry: 'Venezuela',
  'name.family': 'Pérez',
  'name.given': 'Andrés',
  'otherName.more0': 'no',
  'mailing.street': '200 NW 7th St',
  'mailing.unit': 'Apt 12',
  'mailing.city': 'Miami',
  'mailing.state': 'FL',
  'mailing.zip': '33136',
  mailingSame: 'yes',
  aNumber: 'A240123456',
  dob: '02/11/1988',
  sex: 'male',
  birthCity: 'Maracaibo',
  birthCountry: 'Venezuela',
  residence1: 'Venezuela',
  citizenship1: 'Venezuela',
  marital: 'M',
  'marriage.date': '06/20/2015',
  'entry.date': '08/14/2019',
  'entry.status': 'visitor',
  'entry.port': 'Miami International Airport',
  'entry.city': 'Miami',
  'entry.state': 'FL',
  i94: '98765432101',
  'i94.until': '02/13/2020',
  'passport.number': '123456789',
  'passport.country': 'Venezuela',
  'passport.expires': '05/01/2024',
  currentStatus: 'TPS',
  proceedings: 'no',
  ethnicity: 'hispanic',
  race: ['WH'] as unknown as string,
  heightFeet: '5',
  heightInches: '10',
  weight: '175',
  eyes: 'BN',
  hair: 'BL',
  nationalOf: 'Venezuela',
  residingSince: '08/14/2019',
  otherCountries: 'no',
  offered: 'no',
  ...allNo,
  readsEnglish: '1b',
  fluentLanguage: 'Spanish',
  phone: '305 555 0177',
  email: 'andres@example.com',
};

describe('I-821 PDF', () => {
  it('maps every Part 7 Yes/No pair once', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    const fields = new Set(P7_ITEMS.map((it) => it.field));
    expect(fields.size).toBe(P7_ITEMS.length);
    for (const it of P7_ITEMS) {
      const values = optionBoxes(index, it.field).map((o) => o.value);
      expect(values, it.item).toContain('Y');
      expect(values, it.item).toContain('N');
    }
    // Every Part 7 Yes/No pair on the form is one of the items (1.c and 5 are asked separately).
    const onForm = [...index.keys()].filter((k) => /^Part7_Item\d+[a-e]?_YND?\[0\]$/.test(k)).map((k) => k.replace('[0]', ''));
    expect(onForm.sort()).toEqual([...fields].sort());
  });

  it('plans only fields that exist, with the right kind', async () => {
    const form = (await PDFDocument.load(template)).getForm();
    const all = fieldsBySegment(form.getFields());
    const index = fieldIndex(form);
    const full: Answers = {
      ...reRegistrant,
      ...allYes,
      appType: '1a',
      'prior.explain': 'Applied 2021, receipt IOE0912345678, approved.',
      ead: 'B',
      'otherName.more0': 'yes',
      'otherName1.family': 'P',
      'otherName.more1': 'yes',
      'otherName2.family': 'Q',
      'mailing.careOf': 'X',
      mailingSame: 'no',
      'home.street': '1 A',
      'home.unit': 'Ste 2',
      'home.city': 'Doral',
      'home.state': 'FL',
      'home.zip': '33172',
      uscisAccount: '123456789012',
      ssn: '123-45-6789',
      otherDob1: '02/12/1988',
      otherDob2: '02/13/1988',
      sex: 'female',
      ...Object.fromEntries([1, 2, 3, 4].flatMap((i) => [[`residence${i}`, 'X'], [`citizenship${i}`, 'Y']])),
      marital: 'O',
      'marital.other': 'Common-law',
      travelDoc: 'T1',
      'passport.other1': 'P2',
      'passport.other2': 'P3',
      proceedings: 'yes',
      proceedingTypes: ['A', 'B', 'C'] as unknown as string,
      'proc.location': 'Miami, FL',
      'proc.federal': 'S.D. Fla.',
      'proc.from': '01/01/2020',
      ethnicity: 'notHispanic',
      race: ['WH', 'AS', 'BL', 'AI', 'HW'] as unknown as string,
      otherCountries: 'yes',
      'other.countries': 'Colombia',
      'other.from': '01/01/2018',
      'other.to': '08/01/2019',
      'other.status': 'visitor',
      offered: 'yes',
      'offered.what': 'x',
      'offered.why': 'y',
      'p7.explain': 'z',
      readsEnglish: '1a',
      mobile: '3055550000',
    };
    const variants: Answers[] = [
      reRegistrant,
      full,
      { ...full, 'proc.to': '01/01/2021', grantedBy: 'I', appType: '1b' },
      ...['S', 'D', 'W', 'E', 'A'].map((marital) => ({ ...reRegistrant, marital })),
      ...['BN', 'BL', 'HA', 'GN', 'BU', 'GR', 'MA', 'PN', 'UN'].map((eyes) => ({ ...reRegistrant, eyes })),
      ...['BL', 'BR', 'BN', 'GR', 'WH', 'RD', 'SA', 'NH', 'OT'].map((hair) => ({ ...reRegistrant, hair })),
    ];
    for (const plan of variants.map(planI821)) {
      for (const name of Object.keys(plan.text)) for (const f of resolve(all, name)) expect(f, name).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) for (const f of resolve(all, name)) expect(f, name).toBeInstanceOf(PDFCheckBox);
      for (const name of Object.keys(plan.select)) for (const f of resolve(all, name)) expect(f, name).toBeInstanceOf(PDFDropdown);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
    }
  });

  it('writes the answers into the official form', async () => {
    const form = (await PDFDocument.load(await fillI821(template, reRegistrant))).getForm();
    const all = fieldsBySegment(form.getFields());
    const text = (n: string) => (resolve(all, n)[0] as PDFTextField).getText();
    const checked = (n: string) => (resolve(all, n)[0] as PDFCheckBox).isChecked();
    expect(checked('Part1_Item1_ApplicationType[1]')).toBe(true); // 1.b
    expect(checked('Part1_Item2_GrantedTPSU[0]')).toBe(true);
    expect(checked('Part1_Item3_EADApp[0]')).toBe(true);
    expect(text('Part1_TPScountry[0]')).toBe('Venezuela');
    // The name repeats at the top of Part 11.
    expect(resolve(all, 'Part2_Item1_FamilyName[0]').map((f) => (f as PDFTextField).getText())).toEqual(['Perez', 'Perez']);
    // Item 10 and Item 18 share a name: date of birth first, then the marriage date.
    expect(text('Part2_Item10_DateOfBirth[0]#0')).toBe('02/11/1988');
    expect(text('Part2_Item10_DateOfBirth[0]#1')).toBe('06/20/2015');
    expect(text('P2_Line7_DateOfBirth[0]')).toBe('08/14/2019'); // Item 19
    expect(text('Part2_Item22_Passport[0]')).toBe('123456789');
    expect(checked('Part2_Item17_MaritalStatus[1]')).toBe(true); // Married
    expect(checked('Part2_Item25_ImmigrationProceedings[1]')).toBe(true); // No
    expect(checked('Part3_Item5_Eyecolor[2]')).toBe(true); // Brown
    expect(checked('Part3_Item6_Haircolor[1]')).toBe(true); // Black
    expect(text('Part7_Item1_CountryResidence[0]')).toBe('Venezuela');
    expect(checked('Part7_Item4a_YN[1]')).toBe(true); // 8.a: No
    expect(checked('Part7_Item41_YN[1]')).toBe(true); // 41: No
    expect(checked('Part8_Item1_AppStmt[1]')).toBe(true); // 1.b
    expect(text('Part8_Item3_DayPhone[0]')).toBe('3055550177');
    expect(lastSegment('form1[0].x.Part2_Item7_AlienNumber[0]')).toBe('Part2_Item7_AlienNumber[0]');
    expect(resolve(all, 'Part2_Item7_AlienNumber[0]').map((f) => (f as PDFTextField).getText())).toEqual(['240123456', '240123456']);
  });

  it('writes Yes explanations into Part 11', () => {
    const { text, checkValue } = planI821({ ...reRegistrant, 'p7.15.a': 'yes', 'p7.explain': 'Arrested 2021 in Miami for driving without a license; dismissed.' });
    expect(checkValue).toContainEqual(['Part7_Item13a_YN', 'Y']);
    expect(text['AI_3c_ItemNumber[0]']).toBe('15.a');
    expect(text['AI_3d_AdditionalInfo[0]']).toBe('Arrested 2021 in Miami for driving without a license; dismissed.');
  });
});
