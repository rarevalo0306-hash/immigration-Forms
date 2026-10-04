import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { P9_ITEMS } from '../forms/i485Part9';
import { fieldIndex, optionBoxes } from './common';
import { fillI485, planI485 } from './i485Pdf';

const template = readFileSync(new URL('../../public/forms/i-485.pdf', import.meta.url));

/** The wife of a U.S. citizen who entered on a B-2 visa, adjusting status. */
export const spouseOfCitizen: Answers = {
  'name.family': 'Ruiz Vega',
  'name.given': 'Carla',
  hasOtherNames: 'yes',
  'otherName1.family': 'Vega',
  'otherName1.given': 'Carla',
  hasOtherNames2: 'no',
  dob: '05/05/1990',
  sex: 'female',
  birthCity: 'Monterrey',
  birthCountry: 'Mexico',
  citizenship: 'Mexico',
  otherDob: 'no',
  aNumber: '',
  arrivalHow: 'admitted',
  'arrivalAs.text': 'B-2 visitor',
  'arrival.city': 'Houston',
  'arrival.state': 'TX',
  'arrival.date': '01/10/2024',
  'passport.number': 'G7654321',
  'passport.country': 'Mexico',
  'passport.expires': '01/01/2031',
  'visa.number': 'K1234567',
  'visa.issued': '06/01/2023',
  'i94.family': 'RUIZ VEGA',
  'i94.given': 'CARLA',
  'i94.number': '98765432A10',
  'i94.expires': '07/09/2024',
  'i94.status': 'B2',
  'status.current': 'B-2 visitor',
  'status.expires': '07/09/2024',
  firstTime: 'yes',
  crewmanVisa: 'no',
  crewmanArrival: 'no',
  'home.street': '1234 Main St',
  'home.unit': 'Apt 4B',
  'home.city': 'Los Angeles',
  'home.state': 'CA',
  'home.zip': '90011',
  'home.from': '01/15/2024',
  mailingSame: 'yes',
  fiveYears: 'no',
  'prior.street': 'Calle 5 #20',
  'prior.city': 'Monterrey',
  'prior.province': 'Nuevo Leon',
  'prior.country': 'Mexico',
  'prior.from': '01/01/2015',
  'prior.to': '01/09/2024',
  ssaIssued: 'no',
  ssaWants: 'yes',
  ssaConsent: 'yes',
  category: 'ir-spouse',
  'petition.receipt': 'IOE0123456789',
  applicantType: 'principal',
  eoir: 'no',
  section245i: 'no',
  cspa: 'no',
  affidavitExemption: '5',
  prevImmigrantVisa: 'no',
  prevLprInUS: 'no',
  rescinded: 'no',
  'job.type': 'Unemployed',
  'job.occupation': 'unemployed',
  'job.support': 'Supported by my husband',
  'abroadJob.has': 'yes',
  'abroadJob.name': 'Banco del Norte',
  'abroadJob.occupation': 'Teller',
  'abroadJob.city': 'Monterrey',
  'abroadJob.country': 'Mexico',
  'abroadJob.from': '01/01/2016',
  'abroadJob.to': '12/31/2023',
  'parent1.family': 'Vega',
  'parent1.given': 'Luis',
  'parent1.country': 'Mexico',
  'parent2.family': 'Lopez',
  'parent2.given': 'Rosa',
  'parent2.birth.family': 'Lopez',
  'parent2.country': 'Mexico',
  marital: 'married',
  timesMarried: '1',
  spouseMilitary: 'no',
  'spouse.family': 'Smith',
  'spouse.given': 'John',
  'spouse.dob': '03/03/1988',
  'spouse.birthCountry': 'United States',
  'spouse.married': '02/14/2024',
  'spouse.marriedCity': 'Las Vegas',
  'spouse.marriedState': 'NV',
  'spouse.marriedCountry': 'United States',
  'spouse.home.street': '1234 Main St',
  'spouse.home.unit': 'Apt 4B',
  'spouse.home.city': 'Los Angeles',
  'spouse.home.state': 'CA',
  'spouse.home.zip': '90011',
  'spouse.home.country': 'United States',
  spouseApplying: 'no',
  childrenCount: '1',
  'child1.family': 'Smith',
  'child1.given': 'Emma',
  'child1.dob': '11/11/2024',
  'child1.country': 'United States',
  'child1.relationship': 'biological child',
  'child1.applying': 'no',
  ethnicity: 'hispanic',
  race: ['WH'],
  heightFeet: '5',
  heightInches: '5',
  weight: '140',
  eyes: 'BN',
  hair: 'BL',
  ...Object.fromEntries(P9_ITEMS.map((it) => [`p9.${it.item}`, 'no'])),
  'p9.13': 'yes',
  'explain.13.text': 'I stayed past my authorized stay on my B-2 visa while waiting to file this application.',
  'publicCharge.exemption': '23',
  'pc.household': 'Household of 3',
  'pc.income': 'C',
  'pc.assets': 'B',
  'pc.liabilities': 'A',
  'pc.education': '7',
  'pc.skills': 'Bank teller certification\nBilingual Spanish/English',
  'pc.benefits': 'no',
  phone: '213 555 0177',
  email: 'carla@example.com',
};

/** Someone interpreted and someone else prepared the form. */
const helped: Answers = {
  ...spouseOfCitizen,
  readsEnglish: 'B',
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

describe('I-485 PDF', () => {
  it('plans only fields that exist, with the right kind', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    const variants: Answers[] = [
      spouseOfCitizen,
      { ...spouseOfCitizen, aNumber: 'A012345678', otherA1: '1234567', otherDob: 'yes', otherDob1: '05/06/1990', arrivalHow: 'ewi', mailingSame: 'no', 'mailing.street': 'PO Box 1', 'mailing.state': 'CA', 'mailing.unit': 'Ste 2', category: 'asylee', 'category.asylumDate': '01/01/2020', applicantType: 'derivative', 'principal.family': 'X', 'principal.aNumber': 'A1234567', affidavitExemption: '4', prevImmigrantVisa: 'yes', 'prevVisa.city': 'Ciudad Juarez', marital: 'divorced', 'prior.family': 'Old', 'prior.how': '2', 'publicCharge.exemption': '3', 'p9.1': 'yes', 'org1.name': 'Club', 'p9.83': 'yes', 'draft.status': 'LPR', ssaIssued: 'yes', ssn: '123456789', 'child2.family': 'B', race: ['WH', 'AS', 'BL', 'AI', 'HW'], eyes: 'UN', hair: 'OT', ethnicity: 'notHispanic' },
      { ...spouseOfCitizen, category: 'dv', 'category.dvRank': '2025AF123', arrivalHow: 'paroled', marital: 'single', 'pc.benefits': 'yes', 'pc.benefit1.name': 'SSI', 'pc.education': 'C', 'pc.grade': '8', ...Object.fromEntries(P9_ITEMS.map((it) => [`p9.${it.item}`, 'yes'])) },
      ...['refugee', 'cuban', 'other', 'f2a-spouse', 'vawa-parent'].map((c) => ({ ...spouseOfCitizen, category: c, 'category.other': 'EB-2' })),
      ...['0', '1', '2', '3'].map((x) => ({ ...spouseOfCitizen, affidavitExemption: x, 'prior.family': 'P', 'prior.how': String(Number(x) + 1), marital: ['widowed', 'annulled', 'separated', 'married'][Number(x)] })),
      ...helpVariants,
    ];
    for (const plan of variants.map(planI485)) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const name of Object.keys(plan.select)) expect(index.get(name), name).toBeInstanceOf(PDFDropdown);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
    }
  });

  it('has a Yes and a No box for every Part 9 question', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    for (const it of P9_ITEMS) expect(optionBoxes(index, it.field).map((o) => o.value).sort(), `${it.item} ${it.field}`).toEqual(['N', 'Y']);
  });

  it('writes the answers into the official form', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI485(template, spouseOfCitizen))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText();
    const on = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    const sel = (n: string) => (f.get(n) as PDFDropdown).getSelected()[0]?.trim();

    expect(text('Pt1Line1_FamilyName[0]')).toBe('Ruiz Vega');
    expect(text('Pt1Line1_FamilyName[1]')).toBe('Ruiz Vega'); // Part 14 header
    expect(on('Pt1Line4_YN[1]')).toBe(true); // No A-Number
    expect(on('Pt1Line6_CB_Sex[0]')).toBe(true); // F
    expect(on('Pt2Line11_CB[0]')).toBe(true); // admitted
    expect(text('Pt1Line11_Admitted[0]')).toBe('B-2 visitor');
    expect(sel('Pt1Line10_State[0]')).toBe('TX');
    expect(text('P1Line12_I94[0]')).toBe('98765432A10');
    expect(on('Pt1Line18US_Unit[2]')).toBe(true); // APT
    expect(on('Pt1Line18_YN[0]')).toBe(true); // mailing = physical
    expect(text('Pt1Line18_PriorProvince[0]')).toBe('Nuevo Leon');
    expect(on('Pt1Line19_YN[0]') && on('Pt1Line19_SSA_YN[0]') && on('Pt1Line19_Consent_YN[0]')).toBe(true); // No card yet, wants one, consents
    expect(on('Pt2Line3a_CB[0]')).toBe(true); // spouse of a U.S. citizen
    expect(on('Pt2Line2_CB[0]')).toBe(true); // principal
    expect(on('Pt3Line1_CB[5]')).toBe(true); // files an I-864
    expect(text('Pt4Line7_EmployerName[0]')).toBe('Unemployed');
    expect(text('Part4Line7_StreetName[1]')).toBe('Supported by my husband');
    expect(text('Pt4Line8_EmployerName[0]')).toBe('Banco del Norte');
    expect(text('Pt5Line6_FamilyName[0]')).toBe('Lopez');
    expect(on('Pt6Line1_MaritalStatus[3]')).toBe(true); // married
    expect(on('Pt5Line2_YNNA[0]')).toBe(true); // spouse not military
    expect(text('Pt5Line8_DateofBirth[2]')).toBe('02/14/2024'); // date of marriage
    expect(text('Pt7Line2_Relationship[0]')).toBe('biological child');
    expect(on('Pt7Line1_Ethnicity[0]') && on('Pt7Line2_Race[1]')).toBe(true); // H, WH
    expect(on('Pt7Line5_Eyecolor[2]') && on('Pt7Line6_Haircolor[1]')).toBe(true); // brown eyes, black hair
    expect(on('Pt8Line13_YesNo[1]')).toBe(true); // Item 13: Yes
    expect(on('Pt9Line76_YesNo[0]')).toBe(true); // Item 74: No
    expect(on('Pt9Line56_CB[23]')).toBe(true); // not exempt
    expect(on('Pt9Line53_CB[2]') && on('Pt9Line61_CB[7]')).toBe(true); // income C, bachelor's
    expect(text('TextField2[0]')).toBe('Bilingual Spanish/English');
    expect(text('Pt3Line3_DaytimePhoneNumber1[0]')).toBe('2135550177');
    expect(text('Pt9Line3c_ItemNumber[0]')).toBe('13');
    expect(text('P14_Line2_AdditionalInfo[0]')).toMatch(/B-2 visa/);
    expect(text('Pt3Line7a_Signature[0]')).toBeUndefined();
  });

  it('writes the interpreter and the preparer', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI485(template, helped))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText();
    expect(text('Pt11Line1a_FamilyName[0]')).toBe('Rios');
    expect(text('Pt11Line2_OrgName[0]')).toBe('Ayuda Legal');
    expect(text('P3_Line5_MobileTelePhoneNumber[0]')).toBe('2145550101');
    expect(text('Part11_NameofLanguage[0]')).toBe('Spanish');
    expect(text('P12_SignatureApplicant[0]')).toBeUndefined(); // the interpreter's signature
    expect(text('Pt12Line1a_PreparerGivenName[0]')).toBe('Luis');
    expect(text('Pt12Line4_PreparerMobileNumber[0]')).toBe('6645550103');
    expect(text('Pt12Line5_PreparerEmail[0]')).toBe('luis@example.com');
    expect(text('P12Line6_SignaturePreparer[0]')).toBeUndefined();
    expect(planI485({ ...helped, 'prep.same': 'yes' }).text['Pt12Line1_PreparerFamilyName[0]']).toBe('Ríos');
    expect(planI485(spouseOfCitizen).text['Pt11Line1a_FamilyName[0]']).toBeUndefined();
  });
});
