import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { fieldIndex, optionBoxes } from './common';
import { fillI130, planI130 } from './i130Pdf';

const template = readFileSync(new URL('../../public/forms/i-130.pdf', import.meta.url));

/** A U.S. citizen petitioning for her husband, who is in the U.S. */
export const spouseCase: Answers = {
  relationship: 'spouse',
  lprByAdoption: 'no',
  'pet.name.family': 'García',
  'pet.name.given': 'Ana',
  'pet.aNumber': 'A012345678',
  'pet.ssn': '123-45-6789',
  'pet.otherName.family': 'López',
  'pet.otherName.given': 'Ana',
  'pet.birthCity': 'Guadalajara',
  'pet.birthCountry': 'Mexico',
  'pet.dob': '02/02/1985',
  'pet.sex': 'female',
  'pet.mailing.street': 'PO Box 77',
  'pet.mailing.city': 'Los Angeles',
  'pet.mailing.state': 'CA',
  'pet.mailing.zip': '90012',
  'pet.mailing.country': 'United States',
  'pet.mailingSame': 'no',
  'pet.home1.street': '1234 Main St',
  'pet.home1.unit': 'Apt 4B',
  'pet.home1.city': 'Los Angeles',
  'pet.home1.state': 'CA',
  'pet.home1.zip': '90011',
  'pet.home1.country': 'United States',
  'pet.home1.from': '06/01/2021',
  'pet.home.more': 'yes',
  'pet.homePrev.street': 'Av. Juarez 10',
  'pet.homePrev.city': 'Guadalajara',
  'pet.homePrev.province': 'Jalisco',
  'pet.homePrev.postal': '44100',
  'pet.homePrev.country': 'Mexico',
  'pet.homePrev.from': '01/01/2015',
  'pet.homePrev.to': '05/31/2021',
  'pet.marital': 'married',
  'pet.timesMarried': '1',
  'pet.marriedOn': '02/14/2020',
  'pet.marriedCity': 'Las Vegas',
  'pet.marriedState': 'NV',
  'pet.marriedCountry': 'United States',
  'pet.spouse1.family': 'Ruiz',
  'pet.spouse1.given': 'Carlos',
  'pet.spouse.more1': 'no',
  'pet.parent1.family': 'Garcia',
  'pet.parent1.given': 'Jose',
  'pet.parent1.sex': 'male',
  'pet.parent1.birthCountry': 'Mexico',
  'pet.parent1.city': 'Guadalajara',
  'pet.parent1.country': 'Mexico',
  'pet.parent2.family': 'Lopez',
  'pet.parent2.given': 'Maria',
  'pet.parent2.sex': 'female',
  'pet.status': 'citizen',
  'pet.citizenHow': 'naturalization',
  'pet.hasCertificate': 'yes',
  'pet.cert.number': '12345678',
  'pet.cert.place': 'Los Angeles, CA',
  'pet.cert.date': '07/04/2019',
  'pet.job1.name': 'Acme Corp',
  'pet.job1.city': 'Los Angeles',
  'pet.job1.state': 'CA',
  'pet.job1.country': 'United States',
  'pet.job1.occupation': 'Nurse',
  'pet.job1.from': '01/01/2022',
  'pet.job.more1': 'yes',
  'pet.job2.name': 'Unemployed',
  'pet.job2.from': '06/01/2021',
  'pet.job2.to': '12/31/2021',
  'pet.job.more2': 'no',
  'pet.ethnicity': 'hispanic',
  'pet.race': ['white'],
  'pet.heightFeet': '5',
  'pet.heightInches': '4',
  'pet.weight': '130',
  'pet.eyes': 'BRN',
  'pet.hair': 'BLK',
  'ben.name.family': 'Ruiz',
  'ben.name.given': 'Carlos',
  'ben.birthCity': 'Monterrey',
  'ben.birthCountry': 'Mexico',
  'ben.dob': '03/03/1983',
  'ben.sex': 'male',
  'ben.priorPetition': 'no',
  'ben.home.street': '1234 Main St',
  'ben.home.unit': 'Apt 4B',
  'ben.home.city': 'Los Angeles',
  'ben.home.state': 'CA',
  'ben.home.zip': '90011',
  'ben.home.country': 'United States',
  'ben.usAddress.differs': 'no',
  'ben.abroad.differs': 'yes',
  'ben.abroad.street': 'Calle 5 #20',
  'ben.abroad.city': 'Monterrey',
  'ben.abroad.province': 'Nuevo Leon',
  'ben.abroad.country': 'Mexico',
  'ben.phone': '+52 8155550000',
  'ben.marital': 'married',
  'ben.timesMarried': '1',
  'ben.marriedOn': '02/14/2020',
  'ben.marriedCity': 'Las Vegas',
  'ben.marriedState': 'NV',
  'ben.spouse1.family': 'Garcia',
  'ben.spouse1.given': 'Ana',
  'ben.spouse.more1': 'no',
  'ben.person.more0': 'yes',
  'ben.person1.family': 'Garcia',
  'ben.person1.given': 'Ana',
  'ben.person1.relationship': 'Spouse',
  'ben.person1.dob': '02/02/1985',
  'ben.person1.birthCountry': 'Mexico',
  'ben.person.more1': 'yes',
  'ben.person2.family': 'Ruiz',
  'ben.person2.given': 'Sofia',
  'ben.person2.relationship': 'Daughter',
  'ben.person2.dob': '09/09/2021',
  'ben.person2.birthCountry': 'United States',
  'ben.person.more2': 'no',
  'ben.everInUS': 'yes',
  'ben.inUSNow': 'yes',
  'ben.entry.class': 'B2 - TEMPORARY VISITOR FOR PLEASURE',
  'ben.entry.i94': '12345678A01',
  'ben.entry.date': '01/10/2019',
  'ben.entry.expires': '07/09/2019',
  'ben.passport.number': 'G1234567',
  'ben.passport.country': 'Mexico',
  'ben.passport.expires': '01/01/2030',
  'ben.job.name': 'Unemployed',
  'ben.proceedings': 'yes',
  'ben.proceedings.type': ['removal'],
  'ben.proceedings.city': 'San Diego',
  'ben.proceedings.state': 'CA',
  'ben.proceedings.date': '05/05/2018',
  'together.street': '1234 Main St',
  'together.unit': 'Apt 4B',
  'together.city': 'Los Angeles',
  'together.state': 'CA',
  'together.zip': '90011',
  'together.country': 'United States',
  'together.from': '02/14/2020',
  processingPlace: 'aos',
  'aos.city': 'Los Angeles',
  'aos.state': 'CA',
  prevPetition: 'no',
  'otherRelative.more0': 'yes',
  'otherRelative1.family': 'Ruiz',
  'otherRelative1.given': 'Pedro',
  'otherRelative1.relationship': 'Stepson',
  'otherRelative.more1': 'no',
  phone: '(213) 555-0123',
  email: 'ana@example.com',
  readsEnglish: 'interpreter',
  fluentLanguage: 'Spanish',
};

/** Someone interpreted and someone else prepared the form. */
const helped: Answers = {
  ...spouseCase,
  readsEnglish: 'interpreter',
  preparer: 'yes',
  'preparer.name': 'Luis Ortega',
  'interp.family': 'Ríos',
  'interp.given': 'Ana',
  'interp.business': 'Ayuda Legal',
  'interp.street': '10 Elm St',
  'interp.unit': 'Apt 3',
  'interp.city': 'Dallas',
  'interp.state': 'TX',
  'interp.zip': '75201',
  'interp.country': 'United States',
  'interp.phone': '214 555 0100',
  'interp.mobile': '214 555 0101',
  'interp.email': 'ana@example.com',
  'interp.language': 'Spanish',
  'prep.family': 'Ortega',
  'prep.given': 'Luis',
  'prep.business': 'Ortega Law',
  'prep.street': '22 Calle Sol',
  'prep.unit': 'Flr 2',
  'prep.city': 'Tijuana',
  'prep.province': 'Baja California',
  'prep.postal': '22000',
  'prep.country': 'Mexico',
  'prep.phone': '664 555 0102',
  'prep.mobile': '664 555 0103',
  'prep.email': 'luis@example.com',
  'prep.statement': 'attorneyNotExtends',
};

/** Every preparer's statement, with the same person or someone else preparing. */
const helpVariants: Answers[] = ['notAttorney', 'attorneyExtends', 'attorneyNotExtends'].flatMap((statement) => [
  { ...helped, 'prep.statement': statement, 'interp.unit': 'Ste 1', 'prep.unit': 'Apt 2', 'prep.state': 'CA', 'prep.zip': '92101' },
  { ...helped, 'prep.statement': statement, 'prep.same': 'yes' },
]);

async function filled(a: Answers) {
  return fieldIndex((await PDFDocument.load(await fillI130(template, a))).getForm());
}

describe('I-130 PDF', () => {
  it('plans only fields that exist, with the right kind', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    const variants: Answers[] = [
      spouseCase,
      { ...spouseCase, relationship: 'child', childRelationship: 'stepchild', 'pet.status': 'lpr', 'pet.lpr.class': 'IR1', 'pet.lpr.date': '01/01/2015', 'pet.lpr.city': 'Houston', 'pet.lpr.state': 'TX', 'pet.lprByMarriage': 'yes', 'pet.mailingSame': 'yes', 'pet.spouse.more1': 'yes', 'pet.spouse2.family': 'X', 'ben.spouse.more1': 'yes', 'ben.spouse2.family': 'Y', 'ben.marital': 'separated', 'pet.marital': 'annulled', processingPlace: 'consular', 'consulate.city': 'Ciudad Juarez', 'consulate.country': 'Mexico', prevPetition: 'yes', 'prev.family': 'Z', 'prev.state': 'TX', 'ben.priorPetition': 'unknown', 'ben.usAddress.differs': 'yes', 'ben.usAddress.street': '1 A St', 'ben.usAddress.state': 'TX', readsEnglish: 'yes', 'pet.race': ['white', 'asian', 'black', 'indian', 'pacific'], 'ben.proceedings.type': ['removal', 'exclusion', 'rescission', 'judicial'] },
      { ...spouseCase, relationship: 'sibling', siblingAdopted: 'yes', 'pet.citizenHow': 'parents', 'otherRelative.more1': 'yes', 'otherRelative2.family': 'W', 'ben.marital': 'widowed', 'pet.ethnicity': 'notHispanic', 'pet.eyes': 'OTH', 'pet.hair': 'BLD' },
      ...helpVariants,
    ];
    for (const plan of variants.map(planI130)) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) expect(index.get(name), name).toBeInstanceOf(PDFCheckBox);
      for (const name of Object.keys(plan.select)) expect(index.get(name), name).toBeInstanceOf(PDFDropdown);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
    }
  });

  it('writes the answers into the official form', async () => {
    const f = await filled(spouseCase);
    const text = (n: string) => (f.get(n) as PDFTextField).getText();
    const on = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    const sel = (n: string) => (f.get(n) as PDFDropdown).getSelected()[0]?.trim();

    expect(on('Pt1Line1_Spouse[0]')).toBe(true);
    expect(on('Pt1Line4_No[0]')).toBe(true);
    expect(text('Pt2Line4a_FamilyName[0]')).toBe('Garcia');
    expect(text('Pt2Line4a_FamilyName[1]')).toBe('Garcia'); // Part 9 header
    expect(text('Pt2Line1_AlienNumber[0]')).toBe('012345678');
    expect(text('Pt2Line11_SSN[0]')).toBe('123456789');
    expect(on('Pt2Line9_Female[0]')).toBe(true);
    expect(sel('Pt2Line10_State[0]')).toBe('CA');
    expect(on('Pt2Line11_No[0]')).toBe(true);
    // History: current physical address first, then the previous one abroad.
    expect(text('Pt2Line12_StreetNumberName[0]')).toBe('1234 Main St');
    expect(on('Pt2Line12_Unit[0]')).toBe(true); // APT
    expect(text('Pt2Line13b_DateTo[0]')).toBe('PRESENT');
    expect(text('Pt2Line14_Province[0]')).toBe('Jalisco');
    expect(text('Pt2Line15b_DateTo[0]')).toBe('05/31/2021');
    expect(on('Pt2Line17_Married[0]')).toBe(true);
    expect(sel('Pt2Line19b_State[0]')).toBe('NV');
    expect(text('PtLine20a_FamilyName[0]')).toBe('Ruiz');
    expect(on('Pt2Line26_Male[0]') && on('Pt2Line32_Female[0]')).toBe(true);
    expect(on('Pt2Line36_USCitizen[0]') && on('Pt2Line23b_checkbox[0]') && on('Pt2Line36_Yes[0]')).toBe(true);
    expect(text('Pt2Line37a_CertificateNumber[0]')).toBe('12345678');
    expect(text('Pt2Line40_EmployerOrCompName[0]')).toBe('Acme Corp');
    expect(text('Pt2Line43b_DateTo[0]')).toBe('PRESENT');
    expect(text('Pt2Line47b_DateTo[0]')).toBe('12/31/2021');
    expect(on('Pt3Line1_Ethnicity[1]')).toBe(true); // H
    expect(on('Pt3Line2_Race_White[0]')).toBe(true);
    expect(on('Pt3Line5_EyeColor[1]')).toBe(true); // BRN
    expect(text('Pt4Line4a_FamilyName[0]')).toBe('Ruiz');
    expect(on('Pt4Line9_Male[0]') && on('Pt4Line10_No[0]')).toBe(true);
    expect(text('Pt4Line13_Province[0]')).toBe('Nuevo Leon');
    expect(text('Pt4Line14_DaytimePhoneNumber[0]')).toBe('+52 8155550000');
    expect(on('Pt4Line18_MaritalStatus[4]')).toBe(true); // M
    expect(text('Pt4Line31_Relationship[0]')).toBe('Spouse');
    expect(text('Pt4Line35_Relationship[0]')).toBe('Daughter');
    expect(on('Pt4Line20_Yes[0]') && !on('Pt4Line20_No[0]')).toBe(true);
    expect(sel('Pt4Line21a_ClassOfAdmission[0]')).toBe('B2 - TEMPORARY VISITOR FOR PLEASURE');
    expect(on('Pt4Line28_Yes[0]') && on('Pt4Line54_Removal[0]')).toBe(true);
    expect(text('Pt4Line57_StreetNumberName[0]')).toBe('1234 Main St');
    expect(text('Pt4Line60a_CityOrTown[0]')).toBe('Los Angeles');
    expect(on('Part4Line1_No[0]')).toBe(true);
    expect(text('Pt4Line7_Relationship[0]')).toBe('Stepson');
    expect(on('Pt6Line1Checkbox[1]')).toBe(true); // B: interpreter
    expect(text('Pt6Line1b_Language[0]')).toBe('Spanish');
    expect(text('Pt6Line3_DaytimePhoneNumber[0]')).toBe('2135550123');
    expect(text('P5_Line6a_SignatureofApplicant[0]')).toBeUndefined();
  });

  it('writes the interpreter and the preparer', async () => {
    const f = await filled(helped);
    const text = (n: string) => (f.get(n) as PDFTextField).getText();
    const on = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    expect(on('Pt6Line2_Checkbox[0]')).toBe(true);
    expect(text('Pt6Line2_RepresentativeName[0]')).toBe('Luis Ortega');
    expect(text('Pt7Line1a_InterpreterFamilyName[0]')).toBe('Rios');
    expect(on('Pt7Line3_Unit[0]')).toBe(true); // Apt
    expect(text('Pt7Line3_AptSteFlrNumber[0]')).toBe('3');
    expect(text('Pt4Line53_DaytimePhoneNumber[0]')).toBe('2145550101'); // interpreter's mobile
    expect(text('Pt7_NameofLanguage[0]')).toBe('Spanish');
    expect(text('Pt7Line7a_Signature[0]')).toBeUndefined();
    expect(text('Pt8Line1a_PreparerFamilyName[0]')).toBe('Ortega');
    expect(on('Pt8Line3_Unit[2]')).toBe(true); // Flr
    expect(text('Pt8Line3_Province[0]')).toBe('Baja California');
    expect(text('Pt8Line5_PreparerFaxNumber[0]')).toBe('6645550103'); // printed "Mobile"
    expect(on('Pt8Line7_Checkbox[1]') && on('Pt8Line7b_Checkbox[1]')).toBe(true); // attorney, does not extend
    expect(text('Pt8Line8a_Signature[0]')).toBeUndefined();
    const same = planI130({ ...helped, 'prep.same': 'yes', 'prep.statement': 'notAttorney' });
    expect(same.text['Pt8Line1a_PreparerFamilyName[0]']).toBe('Ríos');
    expect(same.checkValue).toContainEqual(['Pt8Line7_Checkbox', 'A']);
    expect(planI130(spouseCase).text['Pt7Line1a_InterpreterFamilyName[0]']).toBeUndefined();
  });

  it('skips the current-address row when the mailing address is home', async () => {
    const f = await filled({ ...spouseCase, 'pet.mailingSame': 'yes' });
    expect((f.get('Pt2Line12_Province[0]') as PDFTextField).getText()).toBe('Jalisco');
    expect((f.get('Pt2Line14_StreetNumberName[0]') as PDFTextField).getText()).toBeUndefined();
  });
});
