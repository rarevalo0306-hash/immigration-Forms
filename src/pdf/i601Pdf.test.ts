import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { GROUND_GROUPS, GROUNDS_A, GROUNDS_C } from '../forms/i601';
import { fieldIndex, optionBoxes } from './common';
import { fillI601, inadmissibilityStatement, planI601 } from './i601Pdf';

const template = readFileSync(new URL('../../public/forms/i-601.pdf', import.meta.url));

/** Carmen, who overstayed a visitor visa and is adjusting through her U.S. citizen husband. */
export const carmen: Answers = {
  benefit: 'A',
  process: 'adjust',
  groundsA: ['12', '15'],
  'ground.fraud.explain': 'In 2012 I told the CBP officer at the Houston airport I was only visiting, although I planned to stay.',
  'ground.presence.explain': 'I was unlawfully present from 06/2012 to 03/2016 and left to Mexico on 03/15/2016.',
  'name.family': 'Gutiérrez',
  'name.given': 'Carmen',
  'name.middle': 'Elena',
  aNumber: 'A098765432',
  'otherName.more0': 'yes',
  'otherName1.family': 'Ortega',
  'otherName1.given': 'Carmen',
  'otherName.more1': 'no',
  'mailing.street': '2210 W Pico Blvd',
  'mailing.unit': 'Apt 5',
  'mailing.city': 'Los Angeles',
  'mailing.state': 'CA',
  'mailing.zip': '90006',
  'mailing.country': 'United States',
  mailingSame: 'yes',
  ssn: '612-34-5678',
  sex: 'female',
  dob: '02/11/1989',
  birthCity: 'Guadalajara',
  birthProvince: 'Jalisco',
  birthCountry: 'Mexico',
  citizenship: 'Mexico',
  i485Filed: 'yes',
  'i485.receipt': 'IOE-0923456789',
  i821Filed: 'no',
  i212Filed: 'no',
  i212WithThis: 'no',
  everInUS: 'yes',
  'lastEntry.date': '08/20/2017',
  'lastEntry.status': 'B-2 visitor',
  'lastEntry.place': 'Los Angeles, CA',
  'lastEntry.city': 'Los Angeles, CA',
  'prevEntry.more0': 'yes',
  'prevEntry1.from': '06/01/2012',
  'prevEntry1.to': '03/15/2016',
  'prevEntry1.status': 'B-2 visitor',
  'prevEntry1.place': 'Houston, TX',
  'prevEntry1.city': 'Houston, TX',
  'prevEntry.more1': 'no',
  ethnicity: 'hispanic',
  race: ['WH'],
  heightFeet: '5',
  heightInches: '3',
  weight: '135',
  eyes: 'BN',
  hair: 'BL',
  vawa: 'no',
  'qualifying.more0': 'yes',
  'qualifying1.family': 'Morales',
  'qualifying1.given': 'Daniel',
  'qualifying1.street': '2210 W Pico Blvd',
  'qualifying1.unit': 'Apt 5',
  'qualifying1.city': 'Los Angeles',
  'qualifying1.state': 'CA',
  'qualifying1.zip': '90006',
  'qualifying1.country': 'United States',
  'qualifying1.phone': '213 555 0188',
  'qualifying1.relationship': 'spouse',
  'qualifying1.status': 'citizen',
  'qualifying1.dob': '07/04/1986',
  'qualifying.more1': 'no',
  'hardship.statement': 'My husband Daniel has kidney disease and needs me to drive him to dialysis.',
  'otherRelative.more0': 'no',
  'discretion.statement': 'I have worked and paid taxes since 2017 and volunteer at my church.',
  phone: '213 555 0177',
  email: 'carmen.gutierrez@example.com',
};

const everything = (base: Answers): Answers => ({
  ...base,
  ...Object.fromEntries(GROUND_GROUPS.map((g) => [`ground.${g.key}.explain`, `Explanation for ${g.key}`])),
  'ground.other.specify': 'Public charge',
  'ground.other.explain': 'Other explanation',
});

/** An interpreter in the U.S. and a different preparer abroad. */
export const helpers: Answers = {
  readsEnglish: 'B',
  fluentLanguage: 'Spanish',
  preparer: 'yes',
  'preparer.name': 'Ana Lee',
  'interp.family': 'Gómez',
  'interp.given': 'Rosa',
  'interp.business': 'Ayuda Hispana',
  'interp.street': '100 Main St',
  'interp.unit': 'Ste 210',
  'interp.city': 'Houston',
  'interp.state': 'TX',
  'interp.zip': '77002',
  'interp.country': 'United States',
  'interp.phone': '713 555 0100',
  'interp.mobile': '713 555 0101',
  'interp.email': 'rosa@example.com',
  'interp.language': 'Spanish',
  'prep.same': 'no',
  'prep.family': 'Lee',
  'prep.given': 'Ana',
  'prep.business': 'Lee Immigration Law',
  'prep.street': 'Calle Real 5',
  'prep.unit': 'Flr 3',
  'prep.city': 'Tegucigalpa',
  'prep.province': 'Francisco Morazan',
  'prep.postal': '11101',
  'prep.country': 'Honduras',
  'prep.phone': '504 2555 0100',
  'prep.mobile': '504 9555 0101',
  'prep.email': 'ana@example.com',
  'prep.statement': 'attorneyExtends',
};

describe('I-601 PDF', () => {
  it('labels each explanation with its items', () => {
    expect(inadmissibilityStatement(carmen)).toContain('Item 12 (Fraud');
    expect(inadmissibilityStatement(carmen)).toContain('Item 15 (Unlawful presence)');
    expect(inadmissibilityStatement({ ...carmen, groundsA: ['4', '6'], 'ground.crime.explain': 'Theft, 2010' })).toBe('Items 4, 6 (Criminal grounds): Theft, 2010');
    // Answers left from another benefit are ignored.
    expect(inadmissibilityStatement({ ...carmen, benefit: 'C' })).toBe('');
  });

  it('plans only fields that exist, with the right kind', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    const variants: Answers[] = [
      carmen,
      everything({ ...carmen, groundsA: GROUNDS_A.map((g) => g.item) }),
      everything({
        ...carmen,
        benefit: 'C',
        groundsC: GROUNDS_C.map((g) => g.item),
        i821Filed: 'yes',
        'i821.receipt': 'EAC2190012345',
        i212Filed: 'yes',
        'i212.receipt': 'NBC1234567890',
        'i212.location': 'Immigration Court, Los Angeles',
        'i212.date': '01/10/2020',
        i212WithThis: 'yes',
        'otherName.more1': 'yes',
        'otherName2.family': 'Ruiz',
        mailingSame: 'no',
        'home.street': '1 Main St',
        'home.unit': 'Ste 2',
        'home.city': 'Fresno',
        'home.state': 'CA',
        'home.zip': '93701',
        'mailing.unit': 'Flr 3',
        'prevEntry.more1': 'yes',
        'otherEntries.explain': 'El Paso, TX, 2005-2006',
        sex: 'male',
        ethnicity: 'notHispanic',
        race: ['WH', 'AS', 'BL', 'AI', 'HW'],
        'qualifying.more1': 'yes',
        'qualifying2.family': 'Gutierrez',
        'qualifying2.relationship': 'parent',
        'qualifying2.status': 'lpr',
        'qualifying1.unit': 'Flr 1',
        'qualifying1.aNumber': '123456789',
        'otherRelative.more0': 'yes',
        'otherRelative1.family': 'Gutierrez',
        'otherRelative1.unit': 'Ste 9',
        'otherRelative1.state': 'TX',
        'otherRelative1.aNumber': '222333444',
        'otherRelative.more1': 'yes',
        'otherRelative2.family': 'Ortega',
      }),
      { ...carmen, benefit: 'B', 'groundsB.specify': 'INA 212(a)(6)(C)(i)', 'groundsB.explain': 'Used a false passport in 2015' },
      { ...carmen, process: 'visa', 'consulate.caseNumber': 'CDJ2025123456', 'consulate.city': 'Ciudad Juarez', 'consulate.country': 'Mexico', vawa: 'yes', everInUS: 'no', i485Filed: 'no', mailingSame: 'no', 'home.street': 'Calle 5', 'home.province': 'Jalisco', 'home.postal': '44100', 'home.country': 'Mexico' },
      ...['BL', 'HA', 'GN', 'BU', 'GR', 'MA', 'PN', 'UN'].map((eyes, i) => ({
        ...carmen,
        eyes,
        hair: ['BR', 'BN', 'GR', 'WH', 'RD', 'SA', 'NH', 'OT'][i],
        'qualifying1.relationship': ['spouse', 'parent', 'child', 'fiance'][i % 4],
        'qualifying1.status': i % 2 ? 'lpr' : 'citizen',
        mailingSame: 'no',
        'home.unit': ['Apt 1', 'Ste 1', 'Flr 1'][i % 3],
        'otherRelative.more0': 'yes',
        'otherRelative1.unit': ['Apt 1', 'Ste 1', 'Flr 1'][i % 3],
        'qualifying1.unit': ['Apt 1', 'Ste 1', 'Flr 1'][(i + 1) % 3],
      })),
      { ...carmen, ...helpers },
      { ...carmen, ...helpers, 'prep.same': 'yes', 'prep.statement': 'notAttorney' },
      { ...carmen, ...helpers, 'prep.statement': 'attorneyNotExtends' },
    ];
    for (const plan of variants.map(planI601)) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) expect(index.get(name), name).toBeInstanceOf(PDFCheckBox);
      for (const name of Object.keys(plan.select)) expect(index.get(name), name).toBeInstanceOf(PDFDropdown);
      for (const s of plan.statements) expect(index.get(s.field), s.field).toBeInstanceOf(PDFTextField);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
    }
    expect(planI601(variants[1]).check.filter((c) => c.startsWith('p4Line'))).toHaveLength(18);
    expect(planI601(variants[2]).check.filter((c) => c.startsWith('p4Line'))).toHaveLength(20);
    expect(planI601(variants[2]).notes.map((n) => n.item)).toEqual(['4', '2', '1-8', '1-8']);
    expect(planI601(variants[3]).check).toContain('p4Line19CB[0]');
    expect(planI601(variants[3]).text['p5Line1aFamilyName[0]']).toBeUndefined();
  });

  it('writes the answers into the official form', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI601(template, { ...carmen, eyes: 'GR', race: ['WH', 'HW'] }))).getForm());
    const text = (n: string) => ((f.get(n) as PDFTextField).getText() ?? '').replace(/\s+/g, ' ');
    const checked = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    expect(text('p1Line1ANum[0]')).toBe('098765432');
    expect(text('p1Line1ANum[1]')).toBe('098765432');
    expect(text('p1Line3aFamilyName[0]')).toBe('Gutierrez');
    expect(text('p1Line3aFamilyName[1]')).toBe('Gutierrez');
    expect(text('p1Line4aFamilyName[0]')).toBe('Ortega');
    expect(text('p1Line5AptSteFlrNumber[0]')).toBe('5');
    expect(checked('p1Line5Unit[2]')).toBe(true); // Apt.
    expect(checked('p1Line6YesNo[0]')).toBe(true); // Yes
    expect(checked('p1Line9Gender[1]')).toBe(true); // Female
    expect(checked('p1Line16aYesNo[1]')).toBe(true); // Item 16.a: Yes is the second box
    expect(text('p1Line16bReceiptNumber[0]')).toBe('IOE0923456789');
    expect(checked('p1Line19YesNo[0]')).toBe(true); // Item 19: No is the first box
    expect(text('p1Line1dCityOrTown[0]')).toBe('Los Angeles, CA'); // Part 2, Item 1.d
    expect(text('p2Line2bDepartureDate[0]')).toBe('03/15/2016');
    expect(checked('p3Line1Ethnicity[1]')).toBe(true); // Hispanic
    expect(checked('p3Line2Race[2]')).toBe(true); // White
    expect(checked('p3Line2Race[0]')).toBe(true); // Native Hawaiian
    expect(checked('p3Line2Race[4]')).toBe(false);
    expect(checked('p3Line5EyeColor[1]')).toBe(true); // the box printed as Gray
    expect(text('p3Line4Weight1[0]')).toBe('1');
    expect(checked('p4Line12CB[0]')).toBe(true);
    expect(checked('p4Line15CB[0]')).toBe(true);
    expect(checked('p4Line13CB[0]')).toBe(false);
    expect(text('p4Line40Explanation[0]')).toContain('Houston airport');
    expect(text('p5Line1bGivenName[0]')).toBe('Daniel');
    expect(text('p5Line5Relationship[0]')).toBe('Spouse');
    expect(text('p5Line6ImmigrationStatus[0]')).toBe('U.S. Citizen');
    expect(text('p5Line9ApplicantStatement[0]')).toContain('dialysis');
    expect(text('p6Line9ApplicantStatement[0]')).toContain('church');
    expect(text('p7Line1DayPhone[0]')).toBe('2135550177');
    expect(text('Pt7Line6a_SignatureofApplicant[0]')).toBe('');
    expect(text('p10Line3dAdditionalInfo[0]')).toBe('');
  });

  it('fills the interpreter and preparer parts', async () => {
    const read = async (a: Answers) => {
      const f = fieldIndex((await PDFDocument.load(await fillI601(template, a))).getForm());
      return (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    };
    let text = await read({ ...carmen, ...helpers });
    expect(text('p8Line1aFamilyName[0]')).toBe('Gomez');
    expect(text('p8Line3DayPhone[0]')).toBe('7135550100');
    expect(text('P8Language[0]')).toBe('Spanish');
    expect(text('p9Line1aFamilyName[0]')).toBe('Lee');
    expect(text('p9Line2BusinessName[0]')).toBe('Lee Immigration Law');
    expect(text('p9Line6aSignature[0]')).toBe('');
    // The preparer's 11-digit foreign numbers don't fit the 10-digit boxes: they go to Part 10.
    expect(text('p9Line3DayPhone[0]')).toBe('');
    expect(planI601({ ...carmen, ...helpers }).notes).toContainEqual({ page: '8', part: '9', item: '3-4', text: "Preparer's telephone: daytime 504 2555 0100; mobile 504 9555 0101" });
    text = await read({ ...carmen, ...helpers, 'prep.same': 'yes' });
    expect(text('p9Line1bGivenName[0]')).toBe('Rosa');
    expect(text('p9Line4MobilePhone[0]')).toBe('7135550101');
    text = await read(carmen);
    expect(text('p8Line1aFamilyName[0]')).toBe('');
  });

  it('moves long statements to Part 10 and adds sheets when it is full', async () => {
    const long = Array(120).fill('My husband needs me to drive him to dialysis three times a week.').join(' ');
    const answers = { ...carmen, 'hardship.statement': long, 'discretion.statement': `I volunteer at church. ${long}` };
    const doc = await PDFDocument.load(await fillI601(template, answers));
    const f = fieldIndex(doc.getForm());
    const text = (n: string) => ((f.get(n) as PDFTextField).getText() ?? '').replace(/\s+/g, ' ');
    expect(text('p5Line9ApplicantStatement[0]')).toBe('See Part 10. Additional Information, Page 6, Part 5, Item 9.');
    expect(text('p10Line3bPartNumber[0]')).toBe('5');
    expect(text('p10Line3cItemNumber[0]')).toBe('9');
    expect(text('p10Line3dAdditionalInfo[0]')).toContain('dialysis');
    expect(text('p10Line4dAdditionalInfo[0]')).toMatch(/^\(continued\)/);
    expect(text('p10Line5dAdditionalInfo[0]')).toContain('(continued on the attached sheet)');
    expect(text('p10Line6bPartNumber[0]')).toBe('6');
    expect(text('p10Line6dAdditionalInfo[0]')).toMatch(/^I volunteer at church/);
    expect(text('p10Line6dAdditionalInfo[0]')).toContain('(continued on the attached sheet)');
    expect(doc.getPageCount()).toBeGreaterThan(11);

    const short = await PDFDocument.load(await fillI601(template, carmen));
    expect(short.getPageCount()).toBe(11);
  });
});
