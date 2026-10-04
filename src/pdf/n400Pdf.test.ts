import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { part9Explain } from '../forms/n400';
import { fieldIndex, fillN400, optionBoxes, planN400 } from './n400Pdf';

const template = readFileSync(new URL('../../public/forms/n-400.pdf', import.meta.url));

/** An applicant who answers every question, with Yes on every Part 9 item. */
export const everything: Answers = {
  eligibility: 'B',
  aNumber: 'A012345678',
  'name.family': 'Pérez López',
  'name.given': 'José',
  'name.middle': 'Luis',
  hasOtherNames: 'yes',
  'otherName1.family': 'Perez',
  'otherName1.given': 'Jose',
  hasOtherNames2: 'yes',
  'otherName2.family': 'Lopez',
  'otherName2.given': 'Pepe',
  nameChange: 'yes',
  'newName.family': 'Perez',
  'newName.given': 'Joseph',
  dob: '03/14/1980',
  lprDate: '05/01/2020',
  birthCountry: 'Mexico',
  citizenship: 'Mexico',
  uscisAccount: '123412341234',
  sex: 'male',
  parentCitizen: 'no',
  disability: 'no',
  ssaCard: 'yes',
  ssn: '123-45-6789',
  ssaConsent: 'yes',
  ethnicity: 'hispanic',
  race: ['white', 'indian'],
  heightFeet: '5',
  heightInches: '7',
  weight: '165',
  eyes: 'BRO',
  hair: 'BLK',
  'home.street': '1234 Main St',
  'home.unit': 'Apt 4B',
  'home.city': 'Los Angeles',
  'home.state': 'CA',
  'home.zip': '90011',
  'home.from': '06/01/2021',
  'prevHome.more0': 'yes',
  'prevHome1.street': '55 Oak Ave',
  'prevHome1.city': 'Houston',
  'prevHome1.state': 'TX',
  'prevHome1.zip': '77002',
  'prevHome1.country': 'United States',
  'prevHome1.from': '05/01/2020',
  'prevHome1.to': '05/31/2021',
  'prevHome.more1': 'no',
  mailingSame: 'no',
  'mailing.street': 'PO Box 12',
  'mailing.city': 'Los Angeles',
  'mailing.state': 'CA',
  'mailing.zip': '90012',
  marital: 'married',
  spouseMilitary: 'no',
  timesMarried: '1',
  'spouse.family': 'Smith',
  'spouse.given': 'Ana',
  'spouse.dob': '01/02/1982',
  'spouse.married': '02/14/2019',
  'spouse.timesMarried': '1',
  spouseSameAddress: 'yes',
  spouseCitizenHow: 'other',
  'spouse.citizenDate': '07/04/2010',
  childrenCount: '1',
  'child1.name': 'Maria Perez',
  'child1.dob': '09/09/2015',
  'child1.residence': 'resides with me',
  'child1.relationship': 'biological son or daughter',
  'child1.support': 'yes',
  'job1.name': 'Acme Corp',
  'job1.city': 'Los Angeles',
  'job1.state': 'CA',
  'job1.country': 'United States',
  'job1.from': '01/01/2021',
  'job1.occupation': 'Cook',
  'job.more1': 'yes',
  'job2.name': 'unemployed',
  'job2.from': '05/01/2020',
  'job2.to': '12/31/2020',
  'job2.occupation': 'unemployed',
  'job.more2': 'no',
  'trip.more0': 'yes',
  'trip1.left': '12/20/2023',
  'trip1.returned': '01/05/2024',
  'trip1.countries': 'Mexico',
  'trip.more1': 'no',
  ...Object.fromEntries(
    ['1', '2', '3', '4', '5.a', '5.b', '6.a', '6.b', '6.c', '7.a', '7.b', '7.c', '7.d', '7.e', '7.f', '7.g', '8.a', '8.b', '9', '10.a', '10.b', '10.c', '11', '12', '13', '14', '15.a', '15.b', '16',
      '17.a', '17.b', '17.c', '17.d', '17.e', '17.f', '17.g', '17.h', '18', '19', '20', '21', '22.a', '22.b', '23', '24', '25', '26.a', '26.b', '26.c', '27', '28', '29', '30.a', '30.b',
      '31', '32', '33', '34', '35', '36', '37'].map((i) => [`p9.${i}`, 'yes']),
  ),
  'crime1.what': 'DUI',
  'crime1.date': '03/03/2019',
  'crime1.place': 'Los Angeles, CA, USA',
  'crime1.result': 'convicted',
  'crime1.sentence': '3 years probation',
  'ss.date': '04/01/1998',
  'ss.number': '1234567890',
  nobilityTitles: 'Count',
  'explain.1.text': 'I checked the wrong box on an I-9 form in 2015.',
  'explain.2.text': 'I voted by mistake in 2016.',
  'explain.3.text': 'I owe $200 and have a payment plan.',
  'explain.4.text': 'Explanation four.',
  'explain.5.a.text': 'Explanation five does not fit Part 14.',
  feeReduction: 'yes',
  'household.income': '45000',
  'household.size': '3',
  'household.earners': '2',
  headOfHousehold: 'no',
  headName: 'Ana Smith',
  phone: '(213) 555-0123',
  mobile: '213 555 0199',
  email: 'jose@example.com',
};

/** An interpreter and a different preparer helped. */
const helped: Answers = {
  readsEnglish: 'B',
  preparer: 'yes',
  'interp.family': 'Gómez',
  'interp.given': 'Lucía',
  'interp.business': 'Ayuda Legal',
  'interp.street': '10 Elm St',
  'interp.unit': 'Ste 5',
  'interp.city': 'Los Angeles',
  'interp.state': 'CA',
  'interp.zip': '90011',
  'interp.country': 'United States',
  'interp.phone': '1 (213) 555-0100',
  'interp.mobile': '213 555 0101',
  'interp.email': 'lucia@example.com',
  'interp.language': 'Spanish',
  'prep.same': 'no',
  'prep.family': 'Ruiz',
  'prep.given': 'Mario',
  'prep.business': 'Ruiz Forms',
  'prep.phone': '213 555 0200',
  'prep.mobile': '213 555 0201',
  'prep.email': 'mario@example.com',
  'prep.statement': 'notAttorney',
};

async function filled(a: Answers) {
  return (await PDFDocument.load(await fillN400(template, a))).getForm();
}

describe('N-400 PDF', () => {
  it('plans only fields that exist, with the right kind', async () => {
    const form = (await PDFDocument.load(template)).getForm();
    const index = fieldIndex(form);
    const plans = [
      planN400(everything),
      planN400({ ...everything, sex: 'female', marital: 'separated', mailingSame: 'yes', 'home.unit': 'Suite 9', ethnicity: 'notHispanic' }),
      planN400({ ...everything, ...helped }),
      planN400({ ...everything, ...helped, 'prep.same': 'yes', 'prep.statement': 'attorneyExtends' }),
      planN400({ ...everything, ...helped, readsEnglish: 'A', 'prep.statement': 'attorneyNotExtends' }),
    ];
    for (const plan of plans) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) expect(index.get(name), name).toBeInstanceOf(PDFCheckBox);
      for (const name of Object.keys(plan.select)) expect(index.get(name), name).toBeInstanceOf(PDFDropdown);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
    }
  });

  it('has a Yes and a No box for every Part 9 question', async () => {
    const form = (await PDFDocument.load(template)).getForm();
    const index = fieldIndex(form);
    const plan = planN400(everything);
    const part9 = plan.checkValue.filter(([b]) => /^P(9|11|12)_|^Pt9_/.test(b) && !b.includes('Line5a'));
    expect(part9.length).toBeGreaterThanOrEqual(60);
    for (const [base] of part9) expect(optionBoxes(index, base).map((o) => o.value).sort(), base).toEqual(['N', 'Y']);
  });

  it('writes the answers into the official form', async () => {
    const form = await filled(everything);
    const seg = fieldIndex(form);
    const text = (n: string) => (seg.get(n) as PDFTextField).getText();
    const on = (n: string) => (seg.get(n) as PDFCheckBox).isChecked();

    expect(on('Part1_Eligibility[1]')).toBe(true); // B: spouse of U.S. citizen
    expect(text('Line1_AlienNumber[0]')).toBe('012345678');
    expect(text('Line1_AlienNumber[12]')).toBe('012345678');
    expect(text('P2_Line1_FamilyName[0]')).toBe('Perez Lopez');
    expect(text('P2_Line1_FamilyName[1]')).toBe('Perez Lopez');
    expect(text('Line2_FamilyName2[0]')).toBe('Lopez');
    expect(on('P2_Line34_NameChange[1]')).toBe(true);
    expect(on('P2_Line7_Gender[0]')).toBe(true); // M
    expect(text('Line12b_SSN[0]')).toBe('123456789');
    expect(on('P7_Line1_Ethnicity[1]')).toBe(true); // Hispanic
    expect(on('P7_Line2_Race[0]') && on('P7_Line2_Race[4]') && !on('P7_Line2_Race[1]')).toBe(true);
    expect((seg.get('P7_Line3_HeightFeet[0]') as PDFDropdown).getSelected()).toEqual(['5']);
    expect([text('P7_Line4_Pounds1[0]'), text('P7_Line4_Pounds2[0]'), text('P7_Line4_Pounds3[0]')].join('')).toBe('165');
    expect(on('P7_Line5_Eye[0]')).toBe(true); // BRO
    expect(on('P4_Line1_Unit[2]')).toBe(true); // APT
    expect(text('P4_Line1_Number[0]')).toBe('4B');
    expect(text('P4_Line1_DatesofResidence[1]')).toBe('06/01/2021');
    expect(text('P4_Line3_From1[1]')).toBe('05/31/2021'); // row 1 "To"
    expect(on('Pt3_Line2a_Checkbox[0]')).toBe(true); // mailing ≠ physical
    expect(text('P5_Line1b_StreetName[0]')).toBe('PO Box 12');
    expect(on('P10_Line1_MaritalStatus[3]')).toBe(true); // M
    expect(on('P10_Line5a_When[1]')).toBe(true); // Other
    expect(text('P7_EmployerName1[0]')).toBe('Maria Perez');
    expect(on('P9_Line5a[0]')).toBe(true); // child 1 supported
    expect(text('P5_EmployerName2[0]')).toBe('unemployed');
    expect(text('P7_To2[0]')).toBe('12/31/2020');
    expect(text('P9_Line1_Countries1[0]')).toBe('Mexico');
    expect(on('P9_Line1[1]') && on('P12_Line17f[0]') && on('P12_Line18[0]')).toBe(true); // Yes boxes
    expect(text('P12_Line29_Outcome1[1]')).toBe('Los Angeles, CA, USA');
    expect(text('P9_Line22c_SSNumber[0]')).toBe('1234567890');
    expect(on('P10_Line1_Citizen[1]')).toBe(true); // fee reduction
    expect(text('P10_Line5b_NameOfHousehold[0]')).toBe('Ana Smith');
    expect(text('P12_Line3_Telephone[0]')).toBe('2135550123');
    expect(text('P12_SignatureApplicant[0]')).toBeUndefined();

    // Part 14: the first four explanations, in form order.
    expect([text('P11_Line3A[0]'), text('P11_Line3B[0]'), text('P11_Line3C[0]')]).toEqual(['6', '9', '1']);
    expect(text('P11_Line3D[0]')).toMatch(/I-9/);
    expect(text('P11_Line6C[0]')).toBe('4');
  });

  it('fills the interpreter’s and preparer’s parts', async () => {
    const seg = fieldIndex(await filled({ ...everything, ...helped }));
    const text = (n: string) => (seg.get(n) as PDFTextField).getText();
    expect(text('P14_Line1_nterpreterFamilyName[0]')).toBe('Gomez');
    expect(text('P14_Line1_nterpreterGivenName[0]')).toBe('Lucia');
    expect(text('P14_Line4_Telephone[0]')).toBe('2135550100');
    expect(text('P14_NameOfLanguage[0]')).toBe('Spanish');
    expect(text('P15_Line1_PreparerFamilyName[0]')).toBe('Ruiz');
    expect(text('P15_Line6_Email[0]')).toBe('mario@example.com');
    expect(text('P14_DateofSignature[0]')).toBeUndefined();

    const same = fieldIndex(await filled({ ...everything, ...helped, 'prep.same': 'yes' }));
    expect((same.get('P15_Line1_PreparerFamilyName[0]') as PDFTextField).getText()).toBe('Gomez');

    const alone = fieldIndex(await filled(everything));
    expect((alone.get('P14_Line1_nterpreterFamilyName[0]') as PDFTextField).getText()).toBeUndefined();
    expect((alone.get('P15_Line1_PreparerFamilyName[0]') as PDFTextField).getText()).toBeUndefined();
  });

  it('answers No to Selective Service for women', async () => {
    const form = await filled({ ...everything, sex: 'female', 'p9.22.a': undefined as unknown as string });
    const seg = fieldIndex(form);
    expect((seg.get('P9_Line22a[0]') as PDFCheckBox).isChecked()).toBe(true); // N
  });

  it('lists every item that needs explaining once', () => {
    expect(new Set(part9Explain.map((e) => e.item)).size).toBe(part9Explain.length);
  });
});
