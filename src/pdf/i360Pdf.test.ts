import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { fieldIndex, optionBoxes } from './common';
import { fillI360, planI360 } from './i360Pdf';

const template = readFileSync(new URL('../../public/forms/i-360.pdf', import.meta.url));

/** Guadalupe, abused by her permanent-resident husband, self-petitioning under VAWA with a safe address. */
export const guadalupe: Answers = {
  classification: 'I',
  'name.family': 'Ramírez',
  'name.given': 'Guadalupe',
  'name.middle': 'Inés',
  'mailing.street': '845 W Olive Ave',
  'mailing.unit': 'Apt 12',
  'mailing.city': 'Fresno',
  'mailing.state': 'CA',
  'mailing.zip': '93728',
  'mailing.country': 'United States',
  safeAddress: 'yes',
  'safe.careOf': 'Centro Legal del Valle',
  'safe.street': '2100 Tulare St',
  'safe.unit': 'Ste 300',
  'safe.city': 'Fresno',
  'safe.state': 'CA',
  'safe.zip': '93721',
  'safe.country': 'United States',
  dob: '03/14/1990',
  birthCountry: 'Mexico',
  ssn: '',
  aNumber: 'A098765432',
  marital: 'M',
  inUS: 'yes',
  'arrival.date': '06/02/2015',
  'i94.number': '69384712A23',
  'passport.number': 'G12345678',
  'passport.country': 'Mexico',
  'passport.expires': '05/01/2024',
  'status.current': 'B-2 visitor (expired)',
  'status.expires': '12/01/2015',
  'abuser.family': 'Castillo',
  'abuser.given': 'Javier',
  'abuser.dob': '11/20/1986',
  'abuser.birthCountry': 'Mexico',
  'abuser.status': 'D',
  'abuser.aNumber': '201234567',
  'vawa.timesMarried': '1',
  'abuser.timesMarried': '2',
  'vawa.marriageDate': '08/15/2016',
  'vawa.marriagePlace': 'Fresno, California',
  'lived.from': '08/15/2016',
  'lived.to': '02/10/2026',
  'lived.other': 'We also lived together from 01/2016 to 07/2016 at 312 E Belmont Ave, Fresno, CA, before the wedding.',
  'together.street': '1520 N Maple Ave',
  'together.city': 'Fresno',
  'together.state': 'CA',
  'together.zip': '93703',
  'together.country': 'United States',
  'together.from': '03/01/2020',
  'together.to': '02/10/2026',
  ead: 'yes',
  childrenFiled: 'no',
  'relative.more0': 'yes',
  'relative1.family': 'Castillo',
  'relative1.given': 'Javier',
  'relative1.dob': '11/20/1986',
  'relative1.birthCountry': 'Mexico',
  'relative1.relationship': 'S',
  'relative1.aNumber': '201234567',
  'relative.more1': 'yes',
  'relative2.family': 'Castillo Ramirez',
  'relative2.given': 'Sofía',
  'relative2.dob': '04/09/2018',
  'relative2.birthCountry': 'United States',
  'relative.more2': 'no',
  processingPath: 'withI485',
  'foreign.city': 'Morelia',
  'foreign.province': 'Michoacan',
  'foreign.country': 'Mexico',
  sex: 'female',
  otherFilings: 'yes',
  'otherFilings.count': '2',
  removal: 'no',
  workedWithout: 'yes',
  'processing.explain': 'I worked cleaning houses in Fresno, CA from 2016 to 2025 without employment authorization.',
  readsEnglish: 'B',
  fluentLanguage: 'Spanish',
  preparer: 'yes',
  'preparer.name': 'Centro Legal del Valle',
  phone: '559 555 0147',
  email: 'lupe.safe@example.com',
};

/** Ernesto, widower of a naturalized citizen, applying from abroad. */
export const ernesto: Answers = {
  classification: 'B',
  'name.family': 'Morales',
  'name.given': 'Ernesto',
  'mailing.street': 'Calle 5 de Mayo 210',
  'mailing.city': 'Guadalajara',
  'mailing.province': 'Jalisco',
  'mailing.postal': '44100',
  'mailing.country': 'Mexico',
  uscisAccount: '123456789012',
  dob: '07/07/1975',
  birthCountry: 'Mexico',
  aNumber: '',
  marital: 'W',
  inUS: 'no',
  'deceased.family': 'Morales',
  'deceased.given': 'Carmen',
  'deceased.dob': '01/02/1978',
  'deceased.birthCountry': 'Mexico',
  'deceased.death': '03/03/2026',
  'deceased.status': 'C',
  'deceased.aNumber': '055443322',
  timesMarried: '1',
  'deceased.timesMarried': '1',
  'marriage.date': '10/10/2010',
  'marriage.place': 'Guadalajara, Mexico',
  remarried: 'no',
  separated: 'no',
  'relative.more0': 'no',
  processingPath: 'consulate',
  'consulate.city': 'Ciudad Juarez',
  'consulate.country': 'Mexico',
  sex: 'male',
  otherFilings: 'no',
  removal: 'no',
  workedWithout: 'no',
  readsEnglish: 'A',
  preparer: 'no',
  phone: '523312345678',
};

/** Kevin, a Special Immigrant Juvenile with an order against one parent. */
export const kevin: Answers = {
  classification: 'C',
  'name.family': 'Hernández',
  'name.given': 'Kevin',
  'mailing.street': '77 Elm St',
  'mailing.city': 'Houston',
  'mailing.state': 'TX',
  'mailing.zip': '77002',
  'mailing.country': 'United States',
  safeAddress: 'no',
  dob: '05/05/2009',
  birthCountry: 'Honduras',
  marital: 'S',
  inUS: 'yes',
  'otherName.more0': 'yes',
  'otherName1.family': 'Lopez',
  'otherName1.given': 'Kevin',
  'otherName.more1': 'yes',
  'otherName2.family': 'Hernandez Lopez',
  'otherName2.given': 'Kevin',
  dependent: 'yes',
  'placement.name': 'Maria Lopez (legal guardian)',
  jurisdiction: 'yes',
  residingPlacement: 'yes',
  reunification: 'O',
  grounds: ['A', 'C'],
  'reunification.parent': 'Jose Hernandez',
  bestInterest: 'yes',
  hhs: 'yes',
  hhsAltered: 'no',
  'relative.more0': 'no',
  processingPath: 'later',
  sex: 'male',
  otherFilings: 'no',
  removal: 'yes',
  'processing.explain': 'I am in removal proceedings before the Houston Immigration Court; my next hearing is 01/15/2027.',
  readsEnglish: 'A',
  preparer: 'no',
  phone: '713 555 0199',
};

/** Thu, filing for her Amerasian half-brother Minh; his father served in the Army. */
export const minh: Answers = {
  classification: 'A',
  filer: 'other',
  'petitioner.family': 'Nguyen',
  'petitioner.given': 'Thu',
  'petitioner.ssn': '123-45-6789',
  'petitioner.aNumber': 'A012345678',
  'petitioner.itin': '',
  'petitioner.street': '1450 Story Rd',
  'petitioner.unit': 'Apt 3',
  'petitioner.city': 'San Jose',
  'petitioner.state': 'CA',
  'petitioner.zip': '95122',
  'petitioner.country': 'United States',
  'name.family': 'Tran',
  'name.given': 'Minh',
  'name.middle': 'Van',
  'mailing.street': '12 Le Loi',
  'mailing.city': 'Ho Chi Minh City',
  'mailing.country': 'Vietnam',
  dob: '04/30/1972',
  birthCountry: 'Vietnam',
  marital: 'M',
  inUS: 'no',
  'mother.family': 'Tran',
  'mother.given': 'Lan',
  'mother.alive': 'yes',
  'mother.street': '12 Le Loi',
  'mother.city': 'Ho Chi Minh City',
  'mother.country': 'Vietnam',
  'father.family': 'Miller',
  'father.given': 'Robert',
  'father.dob': '02/11/1948',
  'father.birthCountry': 'United States',
  'father.alive': 'no',
  'father.death': '09/09/2001',
  'father.service': 'military',
  'father.branch': 'A',
  'father.serviceNumber': 'RA12345678',
  'relative.more0': 'no',
  processingPath: 'consulate',
  'consulate.city': 'Ho Chi Minh City',
  'consulate.country': 'Vietnam',
  sex: 'male',
  otherFilings: 'no',
  removal: 'no',
  workedWithout: 'no',
  readsEnglish: 'B',
  fluentLanguage: 'Vietnamese',
  preparer: 'yes',
  'preparer.name': 'Anh Pham',
  phone: '408 555 0101',
  email: 'thu@example.com',
  'interp.family': 'Pham',
  'interp.given': 'Anh',
  'interp.business': 'Viet Community Services',
  'interp.street': '400 Tully Rd',
  'interp.unit': 'Ste 210',
  'interp.city': 'San Jose',
  'interp.state': 'CA',
  'interp.zip': '95111',
  'interp.country': 'United States',
  'interp.phone': '408 555 0199',
  'interp.mobile': '408 555 0198',
  'interp.email': 'anh@example.org',
  'interp.language': 'Vietnamese',
  'prep.same': 'yes',
  'prep.statement': 'notAttorney',
};

/** Rev. Samuel, a minister filing for himself, with an employer affiliated with its denomination. */
export const samuel: Answers = {
  classification: 'D',
  'rw.kind': 'A',
  'name.family': 'Okafor',
  'name.given': 'Samuel',
  'mailing.street': '88 Church St',
  'mailing.city': 'Atlanta',
  'mailing.state': 'GA',
  'mailing.zip': '30303',
  'mailing.country': 'United States',
  uscisAccount: '000111222333',
  dob: '01/15/1985',
  birthCountry: 'Nigeria',
  aNumber: '',
  marital: 'S',
  inUS: 'yes',
  'rw.title': 'Associate Pastor',
  'rw.duties': Array.from({ length: 12 }, (_, i) => `Duty ${i + 1}: preaching, counseling and visiting members.`).join(' '),
  'rw.qualifications': 'Ordained minister since 2015, Master of Divinity.',
  'rw.compensation': '$42,000 per year plus housing.',
  'rw.site.company': 'Grace Fellowship Church',
  'rw.site.street': '88 Church St',
  'rw.site.unit': 'Flr 2',
  'rw.site.city': 'Atlanta',
  'rw.site.state': 'GA',
  'rw.site.zip': '30303',
  'rw.site.country': 'United States',
  'rw.members': '850',
  'rw.employees': '12',
  'rw.rWorkers': '1',
  'rw.petitions': '2',
  'rw.selfPetitions': '0',
  'rw.priorR': 'yes',
  'rw.stayFrom': '03/01/2021',
  'rw.stayTo': '02/28/2026',
  'rw.staffPosition': 'Youth Pastor',
  'rw.staffSummary': 'Leads youth ministry and Sunday school.',
  'rw.orgRelationship': 'Both belong to the same denomination.',
  'rw.q7': 'yes',
  'rw.q8': 'yes',
  'rw.q9': 'yes',
  'rw.q10': 'yes',
  'rw.q11': 'no',
  'rw.q12': 'yes',
  'rw.q13': 'yes',
  'rw.attestExplain': 'The position averages 32 hours per week during summer months.',
  'rw.taxBasis': 'C',
  'rw.affiliatedDocs': ['1', '2', '4'],
  'rw.signer.family': 'Brown',
  'rw.signer.given': 'Lisa',
  'rw.signer.title': 'Senior Pastor',
  'rw.employer.name': 'Grace Fellowship Church',
  'rw.employer.street': '88 Church St',
  'rw.employer.unit': 'Ste 1',
  'rw.employer.city': 'Atlanta',
  'rw.employer.state': 'GA',
  'rw.employer.zip': '30303',
  'rw.employer.phone': '404 555 0110',
  'rw.employer.fax': '404 555 0111',
  'rw.employer.email': 'office@grace.example',
  'rw.denomination': 'Evangelical Fellowship',
  'rw.rd.family': 'Stone',
  'rw.rd.given': 'Mark',
  'rw.rd.title': 'Regional Bishop',
  'rw.att.name': 'Evangelical Fellowship Southeast',
  'rw.att.street': '500 Peachtree St',
  'rw.att.unit': 'Flr 4',
  'rw.att.city': 'Atlanta',
  'rw.att.state': 'GA',
  'rw.att.zip': '30308',
  'rw.att.phone': '404 555 0120',
  'rw.att.irs': '58-1234567',
  'relative.more0': 'no',
  processingPath: 'withI485',
  sex: 'male',
  otherFilings: 'yes',
  'otherFilings.count': '1',
  removal: 'no',
  workedWithout: 'no',
  readsEnglish: 'A',
  preparer: 'yes',
  'preparer.name': 'Laura Kim',
  phone: '404 555 0177',
  'prep.family': 'Kim',
  'prep.given': 'Laura',
  'prep.business': 'Kim Immigration Law',
  'prep.street': '1 Peachtree Ctr',
  'prep.unit': 'Flr 30',
  'prep.city': 'Atlanta',
  'prep.state': 'GA',
  'prep.zip': '30303',
  'prep.country': 'United States',
  'prep.phone': '404 555 0300',
  'prep.mobile': '404 555 0301',
  'prep.email': 'laura@kimlaw.example',
  'prep.statement': 'attorneyExtends',
};

describe('I-360 PDF', () => {
  it('plans only fields that exist, with the right kind', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    const children: Answers = {};
    for (let i = 2; i <= 9; i++) {
      children[`relative${i}.family`] = `Child ${i}`;
      children[`relative${i}.dob`] = '01/01/2015';
      children[`relative${i}.aNumber`] = '123123123';
      children[`relative.more${i - 1}`] = 'yes';
    }
    const variants: Answers[] = [
      guadalupe,
      ernesto,
      kevin,
      { ...guadalupe, ...children, classification: 'J', 'abuser.status': 'C', 'relative1.relationship': 'C', 'safe.unit': 'Flr 2', 'mailing.unit': 'Ste 4' },
      { ...guadalupe, classification: 'K', 'abuser.status': 'E', 'abuser.statusOther': 'Citizen, unknown how', ead: 'no', removal: 'yes', readsEnglish: 'A' },
      ...['A', 'B'].map((s) => ({ ...guadalupe, 'abuser.status': s })),
      { ...ernesto, 'deceased.status': 'D', 'deceased.statusOther': 'Citizen by birth in Puerto Rico', remarried: 'yes', 'remarried.date': '05/05/2026', separated: 'yes', 'separated.explain': 'Separated by court order in 2024.' },
      ...['A', 'B'].map((s) => ({ ...ernesto, 'deceased.status': s, marital: 'D' })),
      { ...kevin, jurisdiction: 'no', jurisdictionEnded: 'C', 'jurisdiction.explain': 'Court closed the case', dependent: 'no', 'dependent.explain': 'Order pending', reunification: 'B', grounds: ['A', 'B', 'C', 'D'], 'grounds.other': 'Abuse by caretaker', hhsAltered: 'yes', 'otherName.more0': 'no' },
      ...['A', 'B'].map((r) => ({ ...kevin, jurisdiction: 'no', jurisdictionEnded: r, hhs: 'no' })),
      { ...kevin, sex: 'female', marital: 'M' },
      minh,
      samuel,
      // Amerasian for yourself, every alive answer and every kind of father.
      { ...minh, filer: 'self', 'mother.alive': 'no', 'mother.death': '01/01/2000', 'father.alive': 'yes', 'father.street': '1 Main St', 'father.unit': 'Ste 5', 'father.city': 'Austin', 'father.state': 'TX', 'father.zip': '78701', 'father.country': 'United States', 'father.phone': '512 555 0100', 'father.workPhone': '512 555 0101', 'father.service': 'neither', 'father.explain': 'He was a contractor.' },
      { ...minh, 'mother.alive': 'unknown', 'father.alive': 'unknown', 'father.service': 'civilian', 'father.explain': 'Embassy clerk.', 'mother.unit': 'Flr 1' },
      ...['F', 'N', 'M', 'C'].map((b) => ({ ...minh, 'father.branch': b })),
      // Religious workers: every position, every tax basis, every No.
      ...['B', 'C'].map((k) => ({ ...samuel, 'rw.kind': k, 'rw.taxBasis': 'A', 'rw.priorR': 'no' })),
      { ...samuel, 'rw.taxBasis': 'B', 'rw.q7': 'no', 'rw.q8': 'no', 'rw.q9': 'no', 'rw.q10': 'no', 'rw.q12': 'no', 'rw.q13': 'no', 'rw.affiliatedDocs': ['1', '2', '3', '4'] },
      // The classifications with only Part 2, for yourself and, where allowed, for someone else.
      ...['E', 'F', 'G', 'H', 'L', 'M', 'N'].map((c) => ({ ...ernesto, classification: c })),
      ...['C', 'E', 'F'].map((c) => ({ ...minh, classification: c })),
      // Interpreter and preparer: different people, every statement, every unit box.
      ...['notAttorney', 'attorneyExtends', 'attorneyNotExtends'].map((st, i) => ({
        ...minh,
        'prep.same': 'no',
        ...Object.fromEntries(Object.entries(samuel).filter(([k]) => k.startsWith('prep.'))),
        'prep.statement': st,
        'prep.unit': ['Apt 1', 'Ste 2', 'Flr 3'][i],
        'interp.unit': ['Apt 1', 'Ste 2', 'Flr 3'][i],
      })),
      { ...ernesto, readsEnglish: 'B', fluentLanguage: 'Spanish', preparer: 'yes', 'preparer.name': 'Laura Kim', ...Object.fromEntries(Object.entries(minh).filter(([k]) => k.startsWith('interp.'))), 'prep.same': 'yes', 'prep.statement': 'attorneyNotExtends' },
    ];
    for (const plan of variants.map(planI360)) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) expect(index.get(name), name).toBeInstanceOf(PDFCheckBox);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
      for (const name of Object.keys(plan.select)) expect(index.get(name), name).toBeInstanceOf(PDFDropdown);
      for (const n of plan.notes) expect(n.item.length, n.item).toBeLessThanOrEqual(6);
    }
    expect(planI360(variants[3]).text['Pt5Line10_FamilyName[0]']).toBe('Child 9');
    expect(planI360(variants[3]).check).toContain('Pt5Line10_Relationship[0]');
    expect(planI360(variants[3]).text['Pt9Line8a_DateOfMarriage[0]']).toBe('N/A');
    expect(planI360(variants[7]).notes.map((n) => n.item)).toEqual(['10']);
    expect(planI360(variants[10]).notes.map((n) => n.item)).toEqual(['5', '2.A', '3.B']);
    // Self-petitioners skip Part 1, Items 1-6; a widow(er) fills them.
    expect(planI360(guadalupe).text['Pt1Line1_FamilyName[0]']).toBeUndefined();
    expect(planI360(ernesto).text['Pt1Line1_FamilyName[0]']).toBe('Morales');
    // Someone filing for another person fills Part 1 with their own details and signs Part 12.
    expect(planI360(minh).text['Pt1Line1_FamilyName[0]']).toBe('Nguyen');
    expect(planI360(minh).text['Pt12Line3_AuthorizedSignatoryFamilyName[0]']).toBe('Nguyen');
    expect(planI360(minh).text['Pt11Line3_DaytimePhoneNumber1[0]']).toBeUndefined();
    expect(planI360({ ...minh, filer: 'self' }).text['Pt1Line1_FamilyName[0]']).toBe('Tran');
    expect(planI360({ ...minh, classification: 'C' }).text['Pt1Line1_FamilyName[0]']).toBe('Nguyen');
    expect(planI360({ ...minh, classification: 'C', filer: 'self' }).text['Pt1Line1_FamilyName[0]']).toBeUndefined();
    // Every Part 2-only classification checks its box and nothing else of Parts 6-10.
    for (const c of ['E', 'F', 'G', 'H', 'L', 'M', 'N']) {
      const plan = planI360({ ...ernesto, classification: c });
      expect(plan.checkValue.filter(([b]) => b === 'Pt2Line1'), c).toEqual([['Pt2Line1', c]]);
      expect(Object.keys(plan.text).filter((k) => /^Pt(6|7|8|9|10)Line/.test(k)), c).toEqual([]);
      expect(plan.text['Pt1Line1_FamilyName[0]'], c).toBe('Morales');
    }
    expect(planI360(variants[variants.length - 1]).text['Pt13Line1_PreparerFamilyName[0]']).toBe('Pham');
    expect(planI360(samuel).notes.map((n) => n.item)).toEqual(['6.C', '7-13']);
    expect(planI360({ ...samuel, 'rw.otherStays': 'Wife: 2021-2026.' }).notes.map((n) => n.item)).toEqual(['2', '6.C', '7-13']);
    // SIJ doesn't answer Part 4, Item 6.
    expect(planI360({ ...kevin, workedWithout: 'yes' }).checkValue.some(([b]) => b === 'Pt4Line6')).toBe(false);
  });

  it('writes the answers into the official form', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI360(template, guadalupe))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    const checked = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    const value = (base: string, v: string) => optionBoxes(f, base).find((o) => o.value === v)!.box.isChecked();
    expect(value('Pt2Line1', 'I')).toBe(true);
    expect(value('Pt2Line1', 'J')).toBe(false);
    expect(text('Pt1Line1_FamilyName[0]')).toBe('');
    expect(text('Pt1Line7_InCareofName[0]')).toBe('Centro Legal del Valle');
    expect(value('Pt1Line7_Unit', 'STE')).toBe(true);
    expect(text('Pt3Line1_FamilyName[0]')).toBe('Ramirez');
    expect(text('Pt3Line6_AlienNumber[0]')).toBe('098765432');
    expect(value('Pt3Line2_Unit', 'APT')).toBe(true);
    expect((f.get('Pt3Line2_State[0]') as PDFDropdown).getSelected()).toEqual(['CA']);
    expect(value('Pt3Line7_MaritalStatus', 'M')).toBe(true);
    expect(text('Pt3Line9_I94[0]')).toBe('69384712A23');
    expect(text('Pt4Line2b_CityOrTown[0]')).toBe('Morelia');
    expect(value('Pt4Line3_Sex', 'F')).toBe(true);
    expect(value('Pt4Line7', 'Y')).toBe(true);
    expect(value('Pt4Line6', 'Y')).toBe(true);
    expect(value('Pt5Line2_Relationship', 'S')).toBe(true);
    expect(checked('Pt5Line3_Relationship[0]')).toBe(true);
    expect(text('Pt5Line3_GivenName[0]')).toBe('Sofia');
    expect(value('Pt10Line5_Checkbox', 'D')).toBe(true);
    expect(text('Pt10Line5d1_AlienNumber[0]')).toBe('201234567');
    // Part 10, Item 8 is named after Part 9.
    expect(text('Pt9Line8b_PlaceOfMarriage[0]')).toBe('Fresno, California');
    expect(text('Pt10Line10_StreetNumberName[0]')).toBe('1520 N Maple Ave');
    expect(value('Pt10Line12', 'Y')).toBe(true);
    expect(value('Pt11Line1_Checkbox', 'B')).toBe(true);
    expect(text('Pt11Line1b_Language[0]')).toBe('Spanish');
    expect(checked('Pt11Line2_Checkbox[0]')).toBe(true);
    expect(text('Pt11Line3_DaytimePhoneNumber1[0]')).toBe('5595550147');
    expect(text('Pt11Line6_Signature[0]')).toBe('');
    // Part 15 (named Pt14), with the header name in Pt1Line1_*[1].
    expect(text('Pt1Line1_FamilyName[1]')).toBe('Ramirez');
    expect(text('Pt14Line3b_PartNumber[0]')).toBe('4');
    expect(text('Pt14Line3c_ItemNumber[0]')).toBe('6');
    expect(text('Pt14Line3d_AdditionalInfo[0]')).toContain('cleaning houses');
    expect(text('Pt14Line4b_PartNumber[0]')).toBe('10');
    expect(text('Pt14Line4d_AdditionalInfo[0]')).toContain('Belmont');
  });

  it('fills the SIJ part, with its misnamed items', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI360(template, kevin))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    const value = (base: string, v: string) => optionBoxes(f, base).find((o) => o.value === v)!.box.isChecked();
    expect(value('Pt2Line1', 'C')).toBe(true);
    expect(text('Pt8Line1b_FamilyName[0]')).toBe('Hernandez Lopez');
    // Item 3.A is "Pt8Line4a"; Item 4.A's one/both is "Pt8Line3a".
    expect(value('Pt8Line4a', 'Y')).toBe(true);
    expect(value('Pt8Line3a', 'O')).toBe(true);
    expect(value('Pt8Line3A_Checkbox', 'A')).toBe(true);
    expect(value('Pt8Line3A_Checkbox', 'C')).toBe(true);
    expect(value('Pt8Line3A_Checkbox', 'B')).toBe(false);
    expect(text('Pt8Line4b_NameOfParent[0]')).toBe('Jose Hernandez');
    expect(value('Pt8Line6b', 'N')).toBe(true);
    expect(value('Pt4Line7', 'N')).toBe(true);
    expect(optionBoxes(f, 'Pt4Line6').some((o) => o.box.isChecked())).toBe(false);
    expect(text('Pt14Line3d_AdditionalInfo[0]')).toContain('Houston Immigration Court');
  });

  it('continues a long note in the next Part 15 entries', async () => {
    const long = Array.from({ length: 120 }, (_, i) => `Sentence ${i + 1} about the period we lived together.`).join(' ');
    const f = fieldIndex((await PDFDocument.load(await fillI360(template, { ...guadalupe, workedWithout: 'no', 'lived.other': long }))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    expect(text('Pt14Line3c_ItemNumber[0]')).toBe('9');
    expect(text('Pt14Line4c_ItemNumber[0]')).toBe('9');
    expect(text('Pt14Line6d_AdditionalInfo[0]')).toContain('Continued on a separate sheet.');
  });

  it('fills an Amerasian petition filed for another person, and the interpreter and preparer', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI360(template, minh))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    const checked = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    const value = (base: string, v: string) => optionBoxes(f, base).find((o) => o.value === v)!.box.isChecked();
    expect(value('Pt2Line1', 'A')).toBe(true);
    expect(text('Pt1Line1_GivenName[0]')).toBe('Thu');
    expect(text('Pt1Line3_SSN[0]')).toBe('123456789');
    expect(value('Pt1Line6_Unit', 'APT')).toBe(true);
    expect(text('Pt3Line1_GivenName[0]')).toBe('Minh');
    expect(text('Pt6Line1_GivenName[0]')).toBe('Lan');
    expect(value('Pt6Line2a', 'Y')).toBe(true);
    expect(text('Pt6Line2b_CityOrTown[0]')).toBe('Ho Chi Minh City');
    expect(text('Pt6Line3_FamilyName[0]')).toBe('Miller');
    expect(value('Pt6Line6a', 'N')).toBe(true);
    expect(text('Pt6Line6c_DateofDeath[0]')).toBe('09/09/2001');
    expect(value('Pt6Line7a', 'A')).toBe(true);
    expect(value('Pt6Line7a', 'O')).toBe(false);
    expect(text('Pt6Line7b_BranchServiceNumber[0]')).toBe('RA12345678');
    // Part 12, not Part 11.
    expect(value('Pt12Line1_Checkbox', 'B')).toBe(true);
    expect(text('Pt12Line1b_Language[0]')).toBe('Vietnamese');
    expect(checked('Pt12Line2_Checkbox[0]')).toBe(true);
    expect(text('Pt12Line3_AuthorizedSignatoryGivenName[0]')).toBe('Thu');
    expect(text('Pt12Line5_DaytimePhoneNumber[0]')).toBe('4085550101');
    expect(text('Pt12Line4_AuthorizedSignatoryTitle[0]')).toBe('');
    expect(optionBoxes(f, 'Pt11Line1_Checkbox').some((o) => o.box.isChecked())).toBe(false);
    expect(text('Pt11Line3_DaytimePhoneNumber1[0]')).toBe('');
    // Part 13, the interpreter.
    expect(text('Pt13Line1_InterpreterFamilyName[0]')).toBe('Pham');
    expect(text('Pt13Line2_InterpreterBusinessorOrg[0]')).toBe('Viet Community Services');
    expect(value('Pt13Line3_Unit', 'STE')).toBe(true);
    expect(text('Pt13Line3_AptSteFlrNumber[0]')).toBe('210');
    expect((f.get('Pt13Line3_State[0]') as PDFDropdown).getSelected()).toEqual(['CA']);
    expect(text('Pt12Line4_InterpreterDaytimeTelephone[0]')).toBe('4085550199');
    expect(text('Pt12Line5_InterpreterMobileTelephone[0]')).toBe('4085550198');
    expect(text('Pt12Line5_Email[0]')).toBe('anh@example.org');
    expect(text('Pt12_NameofLanguage[0]')).toBe('Vietnamese');
    // Part 14, the same person as preparer.
    expect(text('Pt13Line1_PreparerFamilyName[0]')).toBe('Pham');
    expect(text('Pt13Line2_BusinessName[0]')).toBe('Viet Community Services');
    expect(value('Pt14Line3_Unit', 'STE')).toBe(true);
    expect(text('Pt13ine5_PreparerFaxNumber[0]')).toBe('4085550198');
    expect(value('Pt13Line7_Checkbox', 'A')).toBe(true);
    expect(optionBoxes(f, 'Pt13Line7b_extends').some((o) => o.box.isChecked())).toBe(false);
    expect(text('Pt12Line6_Signature[0]')).toBe('');
    expect(text('Pt13Line8_DateofSignature[0]')).toBe('');
  });

  it('fills the religious worker part, with its misnamed items', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI360(template, samuel))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    const checked = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    const value = (base: string, v: string) => optionBoxes(f, base).find((o) => o.value === v)!.box.isChecked();
    expect(value('Pt2Line1', 'D')).toBe(true);
    expect(checked('Pt2Line1d1_yes[0]')).toBe(true);
    expect(text('Pt1Line1_FamilyName[0]')).toBe('Okafor');
    expect(text('Pt1Line2_OnlineAcctNumber[0]')).toBe('000111222333');
    expect(text('Pt9Line1a_NumberofMembers[0]')).toBe('850');
    expect(value('Pt9Line2', 'Y')).toBe(true);
    expect(text('Pt9Line3_FamilyName[0]')).toBe('Okafor');
    expect(text('Pt9Line3_DateTo[0]')).toBe('02/28/2026');
    expect(value('Pt9Line6b', 'A')).toBe(true);
    // Item 6.C is "Pt9Line6b_DetailedDescription"; too long for its line, it goes to Part 15.
    expect(text('Pt9Line6b_DetailedDescription[0]')).toBe('See Part 15.');
    expect(text('Pt9Line6c_Description[0]')).toBe('Ordained minister since 2015, Master of Divinity.');
    expect(value('Pt9Line6f_Unit', 'FLR')).toBe(true);
    expect(value('Pt9Line7', 'Y')).toBe(true);
    expect(value('Pt9Line11', 'N')).toBe(true);
    expect(value('Pt9Line7_Checkbox', 'C')).toBe(true);
    expect(checked('Pt9Line7_CheckboxC2[0]')).toBe(true);
    expect(checked('Pt9Line7_CheckboxC3[0]')).toBe(false);
    expect(text('Pt9Line15_FamilyName[0]')).toBe('Brown');
    expect(text('Pt9Line15_EmployerOrOrgName[0]')).toBe('Grace Fellowship Church');
    expect(text('Pt9_StreetNumberName[0]')).toBe('88 Church St');
    expect(value('Pt9Line17_Unit', 'STE')).toBe(true);
    expect((f.get('Pt9Line17_State[0]') as PDFDropdown).getSelected()).toEqual(['GA']);
    expect(text('Pt9_PreparerFaxNumber[0]')).toBe('4045550111');
    expect(text('Pt9_PetitioningOrgName[0]')).toBe('Grace Fellowship Church');
    expect(text('Pt9_ReligiousDenominationName[0]')).toBe('Evangelical Fellowship');
    expect(text('Pt9_RDTitle[0]')).toBe('Regional Bishop');
    expect(value('Pt9Lne25_Unit', 'FLR')).toBe(true);
    expect(text('Pt9Line29_AROWRDIRSTaxNumber[0]')).toBe('58-1234567');
    expect(text('Pt9_Signature[0]')).toBe('');
    expect(text('Pt14Line3c_ItemNumber[0]')).toBe('6.C');
    expect(text('Pt14Line3d_AdditionalInfo[0]')).toContain('Duty 1');
    // Part 11, and the preparer, an attorney whose representation extends beyond the form.
    expect(value('Pt11Line1_Checkbox', 'A')).toBe(true);
    expect(text('Pt13Line1_InterpreterFamilyName[0]')).toBe('');
    expect(text('Pt13Line1_PreparerGivenName[0]')).toBe('Laura');
    expect(value('Pt14Line3_Unit', 'FLR')).toBe(true);
    expect(text('Pt14Line3_AptSteFlrNumber[0]')).toBe('30');
    expect(value('Pt13Line7_Checkbox', 'B')).toBe(true);
    expect(value('Pt13Line7b_extends', 'Y')).toBe(true);
    expect(value('Pt13Line7b_extends', 'N')).toBe(false);
  });

  it('marks the last Part 15 entry when later notes do not fit', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI360(template, { ...samuel, 'rw.otherStays': 'Wife: 2021-2026.', 'rw.compensation': 'x '.repeat(80), 'rw.qualifications': 'y '.repeat(80) }))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    expect(text('Pt14Line6d_AdditionalInfo[0]')).toContain('Continued on a separate sheet.');
  });
});
