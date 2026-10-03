import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { fieldIndex, optionBoxes } from './common';
import { fillN600, planN600 } from './n600Pdf';

const template = readFileSync(new URL('../../public/forms/n-600.pdf', import.meta.url));

/** Mateo, 12, who became a citizen when his mother Elena naturalized; she files for him. */
export const mateo: Answers = {
  filer: 'parent',
  relationship: 'A',
  'name.family': 'Castillo',
  'name.given': 'Mateo',
  aNumber: 'A215550123',
  cardNameDifferent: 'no',
  'otherName.more0': 'no',
  dob: '05/02/2014',
  birthCountry: 'Guatemala',
  priorCitizenship: 'Guatemala',
  sex: 'male',
  heightFeet: '4',
  heightInches: '9',
  'mailing.street': '77 Lake St',
  'mailing.unit': 'Apt 3',
  'mailing.city': 'Chicago',
  'mailing.state': 'IL',
  'mailing.zip': '60601',
  'mailing.country': 'United States',
  mailingSame: 'yes',
  marital: 'S',
  armedForces: 'no',
  'entry.port': 'Chicago, IL',
  'entry.date': '08/15/2019',
  'entryName.family': 'Castillo',
  'entryName.given': 'Mateo',
  entryDoc: 'passport',
  'entryDoc.number': 'G1234567',
  'entryDoc.country': 'Guatemala',
  wasLPR: 'yes',
  'lpr.date': '08/15/2019',
  'lpr.office': 'Chicago, IL',
  lostLPR: 'no',
  prevN600: 'no',
  prevPassport: 'no',
  custody: 'yes',
  adopted: 'no',
  parentsMarriedAtBirth: 'yes',
  'parent1.family': 'Lopez',
  'parent1.given': 'Elena',
  'parent1.dob': '03/10/1988',
  'parent1.role': 'mother',
  'parent1.birthCountry': 'Guatemala',
  'parent1.address.street': '77 Lake St',
  'parent1.address.city': 'Chicago',
  'parent1.address.state': 'IL',
  'parent1.address.zip': '60601',
  'parent1.address.country': 'United States',
  'parent1.citizenBy': 'naturalization',
  'parent1.natPlace': 'USCIS Chicago Field Office',
  'parent1.natCity': 'Chicago',
  'parent1.natState': 'IL',
  'parent1.natCertificate': '12345678',
  'parent1.natANumber': '209876543',
  'parent1.natDate': '06/01/2024',
  'parent1.lost': 'no',
  'parent1.timesMarried': '1',
  'parent1.marital': 'M',
  'parent1.spouseIsParent': 'yes',
  'parent2.known': 'yes',
  'parent2.family': 'Castillo',
  'parent2.given': 'Jose',
  'parent2.dob': '01/20/1986',
  'parent2.role': 'father',
  'parent2.birthCountry': 'Guatemala',
  'parent2.citizenship': 'Guatemala',
  'parent2.address.street': '77 Lake St',
  'parent2.address.city': 'Chicago',
  'parent2.address.state': 'IL',
  'parent2.address.country': 'United States',
  'parent2.isCitizen': 'no',
  'parent2.timesMarried': '1',
  'parent2.marital': 'M',
  'parent2.spouseIsParent': 'yes',
  atBirth: 'no',
  readsEnglish: 'B',
  fluentLanguage: 'Spanish',
  preparer: 'no',
  phone: '312 555 0100',
};

describe('N-600 PDF', () => {
  it('plans only fields that exist, with the right kind', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    const spouse = (p: string): Answers => ({
      [`${p}.marital`]: 'M',
      [`${p}.spouseIsParent`]: 'no',
      [`${p}.spouse.family`]: 'Ruiz',
      [`${p}.spouse.address.street`]: '1 Main',
      [`${p}.spouse.address.unit`]: 'Ste 4',
      [`${p}.spouse.address.state`]: 'TX',
      [`${p}.spouse.marriageCity`]: 'Austin',
      [`${p}.spouse.marriageState`]: 'TX',
      [`${p}.spouse.status`]: 'O',
      [`${p}.spouse.statusOther`]: 'Parolee',
    });
    const presence: Answers = {};
    for (let i = 1; i <= 8; i++) Object.assign(presence, { [`presence${i}.from`]: '01/01/2000', [`presence${i}.to`]: '01/01/2001', [`presence.more${i}`]: 'yes' });
    const variants: Answers[] = [
      mateo,
      { ...mateo, ...spouse('parent1'), ...spouse('parent2'), 'parent2.isCitizen': 'yes', 'parent2.citizenBy': 'naturalization', 'parent2.natState': 'CA', 'parent2.lost': 'yes', 'parent2.lost.explain': 'x', 'parent1.lost': 'yes', 'parent1.lost.explain': 'y', filer: 'guardian', 'guardian.family': 'Diaz', 'guardian.address.street': '2 Elm', 'guardian.address.unit': 'Flr 2', 'guardian.address.state': 'IL' },
      { ...mateo, ...presence, atBirth: 'yes', presenceParent: 'father', parentMilitary: 'yes', 'military.name': 'Jose', 'military1.from': '01/01/2005', 'military2.to': '01/01/2008', discharge: 'OE', 'discharge.other': 'Medical', filer: 'child', relationship: 'E', 'relationship.other': 'Step', 'parent1.citizenBy': 'acquisition', 'parent1.certificate': 'C1', 'parent1.aNumber': '1', 'parent2.isCitizen': 'yes', 'parent2.citizenBy': 'abroad', 'parent2.aNumber': '2' },
      { ...mateo, adopted: 'yes', 'adoption.city': 'Guatemala City', 'adoption.country': 'Guatemala', adoptionFinal: 'yes', adoptionRecognized: 'no', 'readoption.state': 'IL', 'readoption.city': 'Chicago', entryDoc: 'travelDoc', marital: 'O', maritalOther: 'Minor', 'parent1.marital': 'O', 'parent1.maritalOther': 'x', 'parent2.marital': 'E', cardNameDifferent: 'yes', 'cardName.family': 'Castilo', 'otherName.more0': 'yes', 'otherName1.family': 'A', 'otherName.more1': 'yes', 'otherName2.family': 'B', mailingSame: 'no', 'home.street': '9 Oak', 'home.unit': 'Flr 1', 'home.state': 'IL', 'parent1.citizenBy': 'birth', 'parent2.citizenBy': 'acquisition', 'parent2.isCitizen': 'yes', 'parent2.certificate': 'C2' },
      { ...mateo, adopted: 'yes', adoptionFinal: 'no', dob: '01/01/1950', absent: 'yes', 'absence1.left': '01/01/1960', 'absence1.state': 'NY', 'absence.more1': 'yes', 'absence2.left': '01/01/1970', 'absence2.state': 'FL', lostLPR: 'yes', 'lostLPR.explain': 'x', prevN600: 'yes', prevPassport: 'yes', armedForces: 'yes' },
      ...['M', 'D', 'W', 'E', 'A'].map((marital) => ({ ...mateo, marital, 'parent1.marital': marital, 'parent2.marital': marital, discharge: 'H' })),
      ...['O', 'D'].map((discharge) => ({ ...mateo, atBirth: 'yes', parentMilitary: 'yes', discharge, presenceParent: 'mother', parentsMarriedAtBirth: 'no', parentsMarriedAfter: 'yes', 'parent1.spouse.status': 'US' })),
    ];
    for (const plan of variants.map(planN600)) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) expect(index.get(name), name).toBeInstanceOf(PDFCheckBox);
      for (const name of Object.keys(plan.select)) expect(index.get(name), name).toBeInstanceOf(PDFDropdown);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
    }
    const p = planN600(variants[2]);
    expect(p.text['P5_Line9F_DateofBirth[16]']).toBe('01/01/2001'); // Period H, To
    expect(p.text['P5_Line9F_DateofBirth[18]']).toBe('01/01/2005'); // Part 7, 3.A From
    expect(p.text['P5_Line9F_DateofBirth[19]']).toBe('01/01/2008'); // Part 7, 3.B To
    expect(p.check).toContain('P6_UScitizen[1]');
    expect(planN600(variants[1]).text['P11_Line4B[0]']).toBe('4');
  });

  it('writes the answers into the official form', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillN600(template, mateo))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    const checked = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    expect(text('Line1_AlienNumber[0]')).toBe('215550123');
    expect(text('Line1_AlienNumber[16]')).toBe('215550123');
    expect(checked('Pt1Line1_citzparent[0]')).toBe(true);
    expect(checked('Part1_Eligibility[2]')).toBe(true); // A: biological
    expect(text('Pt1Line1_FamilyName[0]')).toBe('Castillo');
    expect((f.get('P3_Line3_HeightFeet[0]') as PDFDropdown).getSelected()).toEqual(['4']);
    expect(text('P2_Line10_Number[0]')).toBe('3');
    expect(checked('P2_Line12_MaritalStatus[1]')).toBe(true); // S
    expect(checked('Pt2Line14B_PassportChbx[0]')).toBe(true);
    expect(checked('P2_Line15C_LPR[1]')).toBe(true); // Yes
    expect(checked('P2_Line23[1]')).toBe(true); // Item 23: Yes
    expect(text('P4_Line1_GivenName[0]')).toBe('Elena');
    expect(checked('Pt3Line3_Mother[0]')).toBe(true);
    expect(checked('P4_Line6_fcitizen[3]')).toBe(true); // naturalization
    expect(text('Pt4Line6_AlienNumber2[1]')).toBe('209876543');
    expect(checked('Pt3Line9_Yes[0]')).toBe(true);
    expect(text('P5_Line1_GivenName[0]')).toBe('Jose');
    expect(checked('Pt4Line7_No[0]')).toBe(true);
    expect(checked('P5_Line6_fcitizen[0]')).toBe(false);
    expect(checked('P4_Line11[1]')).toBe(true); // Yes
    expect(checked('P8_Line1[1]')).toBe(true);
    expect(text('P8_Line1B_Language[0]')).toBe('Spanish');
    expect(text('P8_Line3[0]')).toBe('3125550100');
    expect(text('P8_Line6_Date[0]')).toBe('');
  });
});
