import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { fieldIndex, optionBoxes } from './common';
import { fillI589, planI589 } from './i589Pdf';

const template = readFileSync(new URL('../../public/forms/i-589.pdf', import.meta.url));

/** Marta, a journalist from Honduras, with her husband and one son in the U.S. */
export const marta: Answers = {
  'name.family': 'Reyes',
  'name.given': 'Marta',
  'name.middle': 'Elena',
  otherNames: 'Marta Reyes de Paz',
  aNumber: 'A212345678',
  'residence.street': '410 W Oak St',
  'residence.apt': '3',
  'residence.city': 'Houston',
  'residence.state': 'TX',
  'residence.zip': '77002',
  'residence.phone': '(713) 555-0142',
  mailingSame: 'yes',
  sex: 'female',
  dob: '05/20/1990',
  birthPlace: 'Tegucigalpa, Honduras',
  nationality: 'Honduran',
  nationalityBirth: 'Honduran',
  group: 'Mestizo',
  religion: 'Catholic',
  marital: 'M',
  court: 'A',
  lastLeft: '01/03/2026',
  i94: '12345678901',
  'entry1.date': '01/20/2026',
  'entry1.place': 'Houston, TX',
  'entry1.status': 'B2',
  'entry1.expires': '07/19/2026',
  'entry.more1': 'no',
  'passport.country': 'Honduras',
  'passport.number': 'H1234567',
  'passport.expires': '02/01/2030',
  nativeLanguage: 'Spanish',
  fluentEnglish: 'no',
  'spouse.family': 'Paz',
  'spouse.given': 'Jorge',
  'spouse.dob': '11/02/1988',
  'spouse.birthPlace': 'La Ceiba, Honduras',
  'spouse.nationality': 'Honduran',
  'spouse.group': 'Mestizo',
  'spouse.sex': 'male',
  'spouse.marriageDate': '06/14/2014',
  'spouse.marriagePlace': 'Tegucigalpa, Honduras',
  'spouse.inUS': 'yes',
  'spouse.entryPlace': 'Houston, TX',
  'spouse.entryDate': '01/20/2026',
  'spouse.status': 'B2',
  'spouse.court': 'no',
  'spouse.include': 'yes',
  hasChildren: 'yes',
  'children.total': '1',
  'child1.family': 'Paz',
  'child1.given': 'Lucas',
  'child1.dob': '03/09/2016',
  'child1.birthPlace': 'Tegucigalpa, Honduras',
  'child1.nationality': 'Honduran',
  'child1.group': 'Mestizo',
  'child1.sex': 'male',
  'child1.marital': 'Single',
  'child1.inUS': 'yes',
  'child1.entryPlace': 'Houston, TX',
  'child1.entryDate': '01/20/2026',
  'child1.status': 'B2',
  'child1.court': 'no',
  'child1.include': 'yes',
  'child.more1': 'no',
  'lastAddress1.street': 'Col. Kennedy 12',
  'lastAddress1.city': 'Tegucigalpa',
  'lastAddress1.province': 'Francisco Morazan',
  'lastAddress1.country': 'Honduras',
  'lastAddress1.from': '06/2014',
  'lastAddress1.to': '01/2026',
  fearSameCountry: 'yes',
  'home1.street': '410 W Oak St',
  'home1.city': 'Houston',
  'home1.province': 'Texas',
  'home1.country': 'United States',
  'home1.from': '01/2026',
  'home1.to': 'Present',
  'home.more1': 'yes',
  'home2.street': 'Col. Kennedy 12',
  'home2.city': 'Tegucigalpa',
  'home2.province': 'Francisco Morazan',
  'home2.country': 'Honduras',
  'home2.from': '06/2014',
  'home2.to': '01/2026',
  'home.more2': 'no',
  'school.more0': 'yes',
  'school1.name': 'UNAH',
  'school1.type': 'University',
  'school1.location': 'Tegucigalpa, Honduras',
  'school1.from': '01/2008',
  'school1.to': '12/2012',
  'school.more1': 'no',
  'job.more0': 'yes',
  'job1.employer': 'Diario La Voz, Tegucigalpa',
  'job1.occupation': 'Journalist',
  'job1.from': '02/2013',
  'job1.to': '12/2025',
  'job.more1': 'no',
  'mother.name': 'Ana Reyes',
  'mother.birthPlace': 'Choluteca, Honduras',
  'mother.deceased': 'no',
  'mother.location': 'Tegucigalpa, Honduras',
  'father.name': 'Luis Reyes',
  'father.birthPlace': 'Choluteca, Honduras',
  'father.deceased': 'yes',
  'sibling.more0': 'no',
  basis: ['politics', 'social'],
  b1a: 'yes',
  'b1a.explain': 'In November 2025 two armed men threatened me outside the newspaper after I published an article on local corruption.',
  b1b: 'yes',
  'b1b.explain': 'I fear the same group will kill me because of my reporting.',
  b2: 'no',
  b3a: 'yes',
  'b3a.explain': 'I was a member of the journalists association since 2013.',
  b3b: 'no',
  b4: 'no',
  c1: 'no',
  c2a: 'yes',
  c2b: 'no',
  'c2.explain': 'We flew through Mexico City for two hours. We did not apply for status there.',
  c3: 'no',
  c4: 'no',
  c5: 'no',
  c6: 'no',
  familyHelped: 'yes',
  'helper1.name': 'Jorge Paz',
  'helper1.relationship': 'Spouse',
  preparer: 'no',
  counselList: 'yes',
};

/** Six children: four in Part A.II and two on Supplement A. */
export const children: Answers = {};
for (let i = 1; i <= 6; i++) {
  Object.assign(children, {
    [`child${i}.family`]: 'Paz',
    [`child${i}.given`]: `Child ${i}`,
    [`child${i}.sex`]: i % 2 ? 'male' : 'female',
    [`child${i}.aNumber`]: `20000000${i}`,
    [`child${i}.inUS`]: i === 4 || i === 6 ? 'no' : 'yes',
    [`child${i}.location`]: 'Honduras',
    [`child${i}.entryDate`]: '01/20/2026',
    [`child${i}.status`]: 'B2',
    [`child${i}.court`]: i === 2 ? 'yes' : 'no',
    [`child${i}.include`]: i === 3 ? 'no' : 'yes',
    [`child${i}.marital`]: 'Single',
    [`child${i}.ssn`]: `12345678${i}`,
    [`child${i}.passport`]: `P${i}`,
    [`child.more${i}`]: 'yes',
  });
}

/** A preparer in the U.S. (Part E). */
export const preparer: Answers = {
  preparer: 'yes',
  'prep.family': 'Lee',
  'prep.given': 'Ana',
  'prep.business': 'Lee Immigration Law',
  'prep.street': '100 Main St',
  'prep.unit': 'Ste 210',
  'prep.city': 'Houston',
  'prep.state': 'TX',
  'prep.zip': '77002',
  'prep.country': 'United States',
  'prep.phone': '1 713 555 0100',
  'prep.mobile': '713 555 0101',
  'prep.email': 'ana@example.com',
  'prep.statement': 'attorneyExtends',
};

describe('I-589 PDF', () => {
  it('plans only fields that exist, with the right kind', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    const full: Answers = { ...marta, ...children, 'children.total': '4' };
    for (let i = 1; i <= 5; i++) Object.assign(full, { [`home${i}.city`]: `City ${i}`, [`home${i}.to`]: '01/2020', [`home.more${i}`]: 'yes' });
    for (let i = 1; i <= 4; i++) Object.assign(full, { [`school${i}.name`]: `School ${i}`, [`school${i}.to`]: '2010', [`school.more${i}`]: 'yes', [`sibling${i}.name`]: `Sib ${i}`, [`sibling${i}.deceased`]: i === 2 ? 'yes' : 'no', [`sibling${i}.location`]: 'Honduras', [`sibling.more${i}`]: 'yes' });
    for (let i = 1; i <= 3; i++) Object.assign(full, { [`job${i}.employer`]: `Job ${i}`, [`job${i}.to`]: '2020', [`job.more${i}`]: 'yes', [`entry${i}.date`]: '01/01/2020', [`entry.more${i}`]: 'yes' });
    const yeses: Answers = { 'sibling.more0': 'yes', basis: ['race', 'religion', 'nationality', 'politics', 'social', 'torture'], fearSameCountry: 'no', 'lastAddress2.city': 'San Pedro Sula', mailingSame: 'no', 'mailing.street': 'PO Box 1', 'mailing.phone': '7135550000' };
    for (const id of ['b1a', 'b1b', 'b2', 'b3a', 'b3b', 'b4', 'c1', 'c2a', 'c2b', 'c3', 'c4', 'c5', 'c6']) yeses[id] = 'yes';
    const variants: Answers[] = [
      marta,
      { ...full, ...yeses },
      { ...marta, marital: 'S', hasChildren: 'no', court: 'B', fluentEnglish: 'yes', familyHelped: 'no', preparer: 'yes', counselList: 'no' },
      { ...marta, 'spouse.inUS': 'no', 'spouse.location': 'Honduras', 'spouse.sex': 'female', sex: 'male', marital: 'M', court: 'C' },
      ...['D', 'W'].map((marital) => ({ ...marta, marital })),
      { ...marta, ...preparer },
      { ...marta, ...preparer, 'prep.statement': 'notAttorney', 'prep.unit': 'Apt 4', 'prep.state': '', 'prep.zip': '', 'prep.province': 'Cortes', 'prep.postal': '21101', 'prep.country': 'Honduras' },
      { ...marta, ...preparer, 'prep.statement': 'attorneyNotExtends', readsEnglish: 'B', 'prep.same': 'yes' },
    ];
    for (const plan of variants.map(planI589)) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const n of plan.narratives) expect(index.get(n.field), n.field).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) expect(index.get(name), name).toBeInstanceOf(PDFCheckBox);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
    }
    const p = planI589(variants[1]);
    expect(p.text['TextField13[24]']).toBe(undefined); // row 5 street was not given
    expect(p.text['TextField13[25]']).toBe('City 5');
    expect(p.text['ChildAlien4[0]']).toBe('200000004');
    expect(p.text['PtAIILine13_Specify4[0]']).toBe('Honduras');
    expect(p.check).toContain('PtAIILine20_Yes2[0]');
    expect(p.check).toContain('CheckBoxAIII5\\.s2[0]');
    expect(p.check).toContain('CheckBox31[0]');
    // Children 5 and 6 go on Supplement A, by position.
    expect(p.text['TextField12[2]']).toBe('Child 5');
    expect(p.text['TextField12[6]']).toBe('200000005');
    expect(p.checkValue).toContainEqual(['CheckBox12_Sex', 'M']);
    expect(p.checkValue).toContainEqual(['CheckBox57', 'Y']);
    expect(p.check).toContain('SuppA_CheckBox21[0]');
    expect(p.text['TextField12[12]']).toBe('Child 6');
    expect(p.text['SuppLALine13_Specify2[0]']).toBe('Honduras');
    expect(p.checkValue).toContainEqual(['SuppAL12_CheckBox', 'F']);
    expect(p.text['ApplicantName[0]']).toBe('Marta Elena Reyes');
    expect(planI589(marta).text['ApplicantName[0]']).toBeUndefined();
    // A seventh child has no room: the chain stops at six.
    expect(planI589({ ...full, 'child7.given': 'Child 7' }).text['TextField12[12]']).toBe('Child 6');
  });

  it('writes the answers into the official form', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI589(template, marta))).getForm());
    const text = (n: string) => ((f.get(n) as PDFTextField).getText() ?? '').replace(/\s+/g, ' ');
    const checked = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    expect(text('PtAILine1_ANumber[0]')).toBe('212345678');
    expect(text('PtAILine4_LastName[0]')).toBe('Reyes');
    expect(text('PtAILine8_AreaCode[0]')).toBe('713');
    expect(text('PtAILine8_TelephoneNumber[0]')).toBe('555-0142');
    expect(text('TextField1[2]')).toBe('Houston');
    expect(text('TextField1[4]')).toBe('Tegucigalpa, Honduras');
    expect(checked('Marital[1]')).toBe(true);
    expect(checked('CheckBox3[0]')).toBe(true); // never in court
    expect(checked('CheckBox4[1]')).toBe(true); // not fluent
    expect(text('PtAIILine6_FirstName[0]')).toBe('Jorge');
    expect(checked('PtAIILine24_Yes[0]')).toBe(true);
    expect(checked('ChildrenCheckbox[0]')).toBe(true); // "I have children"
    expect(text('ChildFirst1[0]')).toBe('Lucas');
    expect(checked('CheckBox12_Sex[0]')).toBe(true);
    expect(text('PtAIILine15_ExpirationDate[0]')).toBe('01/20/2026');
    expect(text('TextField13[0]')).toBe('Col. Kennedy 12');
    expect(text('DateTimeField21[0]')).toBe('06/2014');
    expect(text('DateTimeField20[0]')).toBe('01/2026');
    expect(text('TextField13[9]')).toBe('Col. Kennedy 12');
    expect(text('DateTimeField26[0]')).toBe('Present');
    expect(text('TextField13[28]')).toBe('UNAH');
    expect(text('TextField13[40]')).toBe('Diario La Voz, Tegucigalpa');
    expect(checked('CheckBoxAIII5\\.f[0]')).toBe(true);
    expect(text('TextField35[1]')).toBe('');
    expect(checked('CheckBoxpolitics[0]')).toBe(true);
    expect(checked('CheckBox31[0]')).toBe(false);
    expect(checked('ckboxyn1a[0]')).toBe(true);
    expect(text('TextField14[0]')).toContain('two armed men');
    expect(checked('ckboxyn3b[1]')).toBe(true);
    expect(text('PCL2B_TextField[0]')).toContain('Mexico City');
    expect(text('TextField20[0]')).toBe('Marta Elena Reyes');
    expect(checked('PtD_ckboxynd1[0]')).toBe(true); // Yes, family helped
    expect(text('TextField32[0]')).toBe('');
    expect(text('TextField22[0]')).toBe('');
  });

  it('fills children 5 and 6 on Supplement A', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI589(template, { ...marta, ...children, 'children.total': '6' }))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    const checked = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    expect(text('ChildFirst4[0]')).toBe('Child 4');
    expect(text('PtAILine1_ANumber[1]')).toBe('212345678');
    expect(text('ApplicantName[0]')).toBe('Marta Elena Reyes');
    expect(text('TextField12[0]')).toBe('Paz');
    expect(text('TextField12[2]')).toBe('Child 5');
    expect(text('TextField12[8]')).toBe('Single');
    expect(text('TextField12[9]')).toBe('123456785');
    // Child 5's sex boxes share child 1's name: [0]/[1] are child 1's (exporting 1/2), [2]/[3] child 5's.
    expect(checked('CheckBox12_Sex[0]')).toBe(true);
    expect(checked('CheckBox12_Sex[2]')).toBe(true);
    expect(checked('CheckBox12_Sex[3]')).toBe(false);
    expect(checked('CheckBox57[0]')).toBe(true);
    expect(text('ChildExp5[0]')).toBe('01/20/2026');
    expect(text('ChildCurrent5[0]')).toBe('B2');
    expect(checked('SuppA_CheckBox20[1]')).toBe(true);
    expect(checked('SuppA_CheckBox21[0]')).toBe(true);
    expect(text('TextField12[12]')).toBe('Child 6');
    expect(text('TextField12[16]')).toBe('200000006');
    expect(checked('SuppAL12_CheckBox[1]')).toBe(true);
    expect(checked('SuppAL13_CheckBox[1]')).toBe(true);
    expect(text('SuppLALine13_Specify2[0]')).toBe('Honduras');
    expect(text('ChildCurrent6[0]')).toBe('');
    expect(text('TextField28[0]')).toBe(''); // the signature
  });

  it('fills the preparer in Part E', async () => {
    const read = async (a: Answers) => {
      const f = fieldIndex((await PDFDocument.load(await fillI589(template, a))).getForm());
      return (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    };
    let text = await read({ ...marta, ...preparer });
    expect(text('PtE_PreparerName[0]')).toBe('Ana Lee');
    expect(text('TextField25[1]')).toBe('713');
    expect(text('TextField25[0]')).toBe('555-0100');
    expect(text('PtE_StreetNumAndName[0]')).toBe('100 Main St');
    expect(text('PtE_AptNumber[0]')).toBe('Ste210');
    expect(text('PtE_City[0]')).toBe('Houston');
    expect(text('PtE_State[0]')).toBe('TX');
    expect(text('PtE_ZipCode[0]')).toBe('77002');
    expect(text('PtE_PreparerSignature[0]')).toBe('');
    expect(text('AttorneyStateBarNumber[0]')).toBe('');
    text = await read({ ...marta, ...preparer, 'prep.unit': 'Apt 4', 'prep.state': '', 'prep.zip': '', 'prep.province': 'Cortes', 'prep.postal': '21101', 'prep.country': 'Honduras', 'prep.phone': '504 2555 0100' });
    expect(text('PtE_AptNumber[0]')).toBe('4');
    expect(text('PtE_City[0]')).toBe('Houston, Cortes, Honduras');
    expect(text('PtE_ZipCode[0]')).toBe('21101');
    expect(text('TextField25[0]')).toBe('');
    text = await read(marta);
    expect(text('PtE_PreparerName[0]')).toBe('');
  });

  it('moves explanations that do not fit to Supplement B', async () => {
    const long = Array(80).fill('On that night the men came back to my house and broke the door.').join(' ');
    const f = fieldIndex((await PDFDocument.load(await fillI589(template, { ...marta, 'b1a.explain': long }))).getForm());
    const text = (n: string) => ((f.get(n) as PDFTextField).getText() ?? '').replace(/\s+/g, ' ');
    expect(text('TextField14[0]')).toBe('See Supplement B, Part B, Question 1.A.');
    expect(text('TextField15[0]')).toContain('same group');
    expect(text('TextField31[0]')).toBe('B');
    expect(text('TextField31[1]')).toBe('1.A');
    expect(text('TextField32[0]')).toContain('Part B, Question 1.A: On that night');
    expect(text('PtAILine1_ANumber[2]')).toBe('212345678');
  });
});
