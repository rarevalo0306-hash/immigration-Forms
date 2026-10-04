import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { COURT_TYPES, ITEM1_RELATIONS, ITEM2_RELATIONS, PROCESSING_ITEMS } from '../forms/i914supa';
import { CLASSES_OF_ADMISSION } from '../forms/classOfAdmission';
import { fieldIndex, optionBoxes } from './common';
import { fillI914SupA, planI914SupA, processingBase, processingPage } from './i914supaPdf';
import { statusOption } from './i914Pdf';

const template = readFileSync(new URL('../../public/forms/i-914supa.pdf', import.meta.url));

/**
 * Yesenia (the I-914's principal) files for her son Mateo, who is still in Guatemala and will
 * interview at the U.S. consulate in Guatemala City.
 */
export const mateo: Answers = {
  'fam.relation': 'child',
  'name.family': 'Xocop',
  'name.given': 'Yesenia',
  'name.middle': 'Maribel',
  dob: '04/11/1996',
  aNumber: 'A212345678',
  i914Status: 'together',
  'fam.name.family': 'Xocop',
  'fam.name.given': 'Mateo',
  'fam.name.middle': 'Andrés',
  'fam.otherName.more0': 'no',
  'fam.inUS': 'no',
  'fam.hasIntended': 'yes',
  'fam.home.street': '8800 Bellaire Blvd',
  'fam.home.unit': 'Apt 214',
  'fam.home.city': 'Houston',
  'fam.home.state': 'TX',
  'fam.home.zip': '77036',
  'fam.mailingSafe': 'yes',
  'fam.mailing.careOf': 'Casa Libre Legal Services',
  'fam.mailing.street': '2100 Travis St',
  'fam.mailing.unit': 'Ste 400',
  'fam.mailing.city': 'Houston',
  'fam.mailing.state': 'TX',
  'fam.mailing.zip': '77002',
  'fam.sex': 'male',
  'fam.marital': 'Single',
  'fam.dob': '09/30/2016',
  'fam.birthCity': 'Quetzaltenango',
  'fam.birthProvince': 'Quetzaltenango',
  'fam.birthCountry': 'Guatemala',
  'fam.citizenship': 'Guatemala',
  'fam.passport': '310245876',
  'fam.passportCountry': 'Guatemala',
  'fam.passportIssued': '02/10/2022',
  'fam.passportExpires': '02/09/2027',
  'fam.office': 'CON',
  'fam.office.city': 'Guatemala City',
  'fam.office.place': 'Guatemala',
  'fam.abroad.street': '4a Calle 12-30, Zona 1',
  'fam.abroad.city': 'Quetzaltenango',
  'fam.abroad.province': 'Quetzaltenango',
  'fam.abroad.postal': '09001',
  'fam.abroad.country': 'Guatemala',
  'fam.traveled': 'no',
  'fam.court': 'no',
  'fam.ead': 'no',
  ...Object.fromEntries(PROCESSING_ITEMS.map((i) => [i.id, 'no'])),
  readsEnglish: 'B',
  fluentLanguage: 'Spanish',
  preparer: 'yes',
  'preparer.name': 'Ana Beltran',
  phone: '832 555 0142',
  mobile: '1 832 555 0143',
  safePhone: '713 555 0190',
  email: 'yesenia.x@example.com',
  'interp.family': 'Gómez',
  'interp.given': 'Rosa',
  'interp.business': 'Servicios Latinos',
  'interp.street': '500 Main St',
  'interp.unit': 'Flr 2',
  'interp.city': 'Houston',
  'interp.state': 'TX',
  'interp.zip': '77002',
  'interp.country': 'United States',
  'interp.phone': '713 555 0101',
  'interp.email': 'rosa@example.com',
  'interp.language': 'Spanish',
  'prep.same': 'no',
  'prep.family': 'Beltran',
  'prep.given': 'Ana',
  'prep.business': 'Casa Libre Legal Services',
  'prep.street': '2100 Travis St',
  'prep.unit': 'Ste 400',
  'prep.city': 'Houston',
  'prep.state': 'TX',
  'prep.zip': '77002',
  'prep.country': 'United States',
  'prep.phone': '713 555 0199',
  'prep.mobile': '713 555 0198',
  'prep.email': 'ana@example.com',
  'prep.statement': 'attorneyNotExtends',
};

/** Carlos, her husband, already in Houston, who was once arrested and has a pending court case. */
const carlos: Answers = {
  ...mateo,
  'fam.relation': 'spouse',
  i914Status: 'pending',
  'fam.name.family': 'Tzul',
  'fam.name.given': 'Carlos',
  'fam.name.middle': '',
  'fam.otherName.more0': 'yes',
  'fam.otherName1.family': 'Tzul',
  'fam.otherName1.given': 'Charly',
  'fam.otherName.more1': 'yes',
  'fam.otherName2.family': 'Sul',
  'fam.otherName2.given': 'Carlos',
  'fam.otherName.more2': 'yes',
  'fam.otherName3.family': 'Tzul Ajanel',
  'fam.otherName3.given': 'Carlos',
  'fam.inUS': 'yes',
  'fam.home.unit': 'Flr 3',
  'fam.mailing.unit': 'Apt 9',
  'fam.aNumber': '987654321',
  'fam.uscisAccount': '123412341234',
  'fam.ssn': '123-45-6789',
  'fam.sex': 'female',
  'fam.marital': 'Married',
  'fam.priorMarried': 'yes',
  'fam.prior.family': 'Ixcot',
  'fam.prior.given': 'Lucia',
  'fam.prior.ended': '06/15/2012',
  'fam.prior.city': 'Totonicapan',
  'fam.prior.province': 'Totonicapan',
  'fam.prior.country': 'Guatemala',
  'fam.prior.how': 'D',
  'fam.prior.others': 'Maria Chan, divorced 01/10/2008 in Totonicapan, Guatemala.',
  'fam.currentStatus': 'EWI - ENTRY WITHOUT INSPECTION',
  'fam.lastEntry.city': 'Laredo',
  'fam.lastEntry.state': 'TX',
  'fam.lastEntry.date': '03/02/2020',
  'fam.i94': '694321-78A01',
  'fam.traveled': 'yes',
  'fam.prevEntry.city': 'El Paso',
  'fam.prevEntry.state': 'TX',
  'fam.prevEntry.date': '06/01/2015',
  'fam.prevEntry.stayExpired': '12/01/2015',
  'fam.prevEntry.status': 'WB - VISITOR FOR BUSINESS - VWPP/VWP',
  'fam.court': 'yes',
  'fam.courtTypes': ['removal', 'rescission'],
  'fam.court.removal': '04/01/2020',
  'fam.court.rescission': '05/01/2020',
  'fam.court.nextHearing': '01/15/2027',
  'fam.ead': 'yes',
  'fam.p4.1b': 'yes',
  'fam.p4.9a': 'yes',
  'fam.p4.18': 'yes',
  'fam.arrest.more1': 'yes',
  'fam.arrest.more2': 'yes',
  'fam.arrest.more3': 'yes',
  'fam.arrest.more4': 'yes',
  'fam.processing.explain': 'He was detained at the border in 2020 and placed in removal proceedings.',
  readsEnglish: 'A',
  preparer: 'no',
};
for (const i of [1, 2, 3, 4, 5]) Object.assign(carlos, { [`fam.arrest${i}.why`]: `Reason ${i}`, [`fam.arrest${i}.date`]: '03/02/2020', [`fam.arrest${i}.where`]: 'Laredo, TX, USA', [`fam.arrest${i}.outcome`]: `Outcome ${i}` });

describe('I-914 Supplement A PDF', () => {
  it('names Part 4 items by position', () => {
    expect(processingBase('fam.p4.1a')).toBe('pELine1aYesNo');
    expect(processingBase('fam.p4.4b3')).toBe('pELine4b3YesNo');
    expect(processingBase('fam.p4.17')).toBe('pELine17YesNo');
    expect(processingBase('fam.p4.18')).toBe('pELine19YesNo');
    expect(processingBase('fam.p4.20')).toBe('pELine21YesNo');
    expect(processingBase('fam.p4.21c')).toBe('pELine22cYesNo');
    expect(processingPage('fam.p4.2d')).toBe('5');
    expect(processingPage('fam.p4.7')).toBe('6');
    expect(processingPage('fam.p4.16')).toBe('7');
    expect(processingPage('fam.p4.17')).toBe('8');
  });

  it('plans only fields that exist, with the right kind', async () => {
    const form = (await PDFDocument.load(template)).getForm();
    const index = fieldIndex(form);
    const allYes = Object.fromEntries(PROCESSING_ITEMS.map((i) => [i.id, 'yes']));
    const variants: Answers[] = [
      mateo,
      carlos,
      { ...carlos, ...allYes },
      ...[...ITEM1_RELATIONS, ...ITEM2_RELATIONS].map((r) => ({ ...mateo, 'fam.relation': r })),
      ...['pending', 'approved'].map((s) => ({ ...mateo, i914Status: s })),
      ...['Married', 'Divorced', 'Widowed', 'Annulled'].map((m) => ({ ...carlos, 'fam.marital': m })),
      ...['W', 'A', 'S'].map((how) => ({ ...carlos, 'fam.prior.how': how })),
      ...['PFI', 'POE'].map((office) => ({ ...mateo, 'fam.office': office })),
      ...['Apt 1', 'Ste 2', 'Flr 3'].map((u) => ({ ...mateo, 'fam.abroad.unit': u, 'interp.unit': u, 'prep.unit': u })),
      { ...carlos, 'fam.courtTypes': COURT_TYPES.map((c) => c.value) },
      { ...mateo, readsEnglish: 'A', preparer: 'no' },
      { ...mateo, 'prep.same': 'yes' },
      ...['notAttorney', 'attorneyExtends'].map((s) => ({ ...mateo, 'prep.statement': s })),
    ];
    for (const plan of variants.map(planI914SupA)) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) expect(index.get(name), name).toBeInstanceOf(PDFCheckBox);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
      for (const [name, value] of Object.entries(plan.select)) {
        const field = index.get(name);
        expect(field, name).toBeInstanceOf(PDFDropdown);
        expect((field as PDFDropdown).getOptions().map((o) => o.trim()), `${name}=${value}`).toContain(value);
      }
    }
    // Every class in the shared list exists in Items 18 and 22.D's dropdowns.
    for (const name of ['Line20_CurrentNon[0]', 'Line22_CurrentNon[0]']) {
      const options = (index.get(name) as PDFDropdown).getOptions().map((o) => o.trim());
      for (const c of CLASSES_OF_ADMISSION) expect(options, c).toContain(statusOption(c));
    }

    const rich = planI914SupA(carlos);
    expect(rich.text['pEOutcome5[0]']).toBe('Outcome 5');
    expect(rich.text['Line16_ExpDate[0]']).toBe('06/15/2012');
    expect(rich.text['Line22_IssuedDate[0]']).toBe('12/01/2015');
    expect(rich.check).toEqual(expect.arrayContaining(['Pt4Line24A_checkboxA[0]', 'Pt4Line24D_checkboxD[0]', 'Pt4Line24E_checkboxE[0]', 'pELine19YesNo[0]', 'Q1_yes[0]', 'Q25[0]']));
    expect(rich.check).not.toContain('Pt4Line24B_checkboxB[0]');
    expect(rich.notes.map((n) => [n.page, n.part, n.item])).toEqual([
      ['2', '3', '2'],
      ['2', '3', '10'],
      ['5', '4', '1.B'],
    ]);
    // Abroad: no last entry, and the consulate and foreign address are filled.
    const abroad = planI914SupA(mateo);
    expect(abroad.text['Line20A_CityTown[0]']).toBeUndefined();
    expect(abroad.text['Pt3Line21D_PostalCode[0]']).toBe('09001');
    expect(abroad.checkValue).toContainEqual(['Pt4Line21A_Checkbox', 'CON']);
    // The same person interpreted and prepared.
    const same = planI914SupA({ ...mateo, 'prep.same': 'yes' });
    expect(same.text['pHLine1FamilyName[0]']).toBe('Gómez');
    expect(same.checkValue).toContainEqual(['pHLine3Unit', 'FLR']);
  });

  it('writes the answers into the official form', async () => {
    const index = fieldIndex((await PDFDocument.load(await fillI914SupA(template, mateo))).getForm());
    const text = (n: string) => (index.get(n) as PDFTextField).getText() ?? '';
    const checked = (n: string) => (index.get(n) as PDFCheckBox).isChecked();
    expect(checked('pAFamilyMember[1]')).toBe(true);
    // "Filing together" is the first box printed but [1] by name.
    expect(checked('P2Line4_I914Status[1]')).toBe(true);
    expect(text('P2Line1_FamilyName[0]')).toBe('Xocop');
    expect(text('P2Line3_ANum[0]')).toBe('212345678');
    expect(text('FamilyName[0]')).toBe('Xocop');
    expect(text('MiddleName[0]')).toBe('Andres');
    expect(text('P1Line3_AptSteFlrNumber[0]')).toBe('214');
    expect(checked('P1Line3_Unit[1]')).toBe(true);
    expect(checked('P4Line4_Unit[0]')).toBe(true);
    expect(text('InCareOf[0]')).toBe('Casa Libre Legal Services');
    expect((index.get('P4Line4_State[0]') as PDFDropdown).getSelected()[0].trim()).toBe('TX');
    expect(checked('P4_Line8_Sex[0]')).toBe(true);
    expect(checked('P4_Line9_MaritalStatus[1]')).toBe(true);
    expect(text('P3_Line2_DateOfBirth[0]')).toBe('09/30/2016');
    // Item 17 is "Line16_ExpDate[1]"; "[0]" is Item 10.B.
    expect(text('Line16_ExpDate[1]')).toBe('02/09/2027');
    expect(text('Line16_ExpDate[0]')).toBe('');
    expect(checked('Q1_no[0]')).toBe(true);
    expect(checked('Pt4Line21A_Checkbox[1]')).toBe(true);
    expect(text('Line21B_CityorTown[0]')).toBe('Guatemala City');
    expect(text('Pt3Line21D_Country[0]')).toBe('Guatemala');
    expect(checked('Q23_no[0]')).toBe(true);
    expect(checked('Q25[1]')).toBe(true);
    expect(checked('pELine3aYesNo[1]')).toBe(true);
    expect(checked('pELine22cYesNo[1]')).toBe(true);
    expect(checked('pFLine1Interpreter[1]')).toBe(true);
    expect(text('pFLine1Language[0]')).toBe('Spanish');
    expect(text('pFLine2PreparerName[0]')).toBe('Ana Beltran');
    expect(text('pFLine3DayPhone[0]')).toBe('8325550142');
    expect(text('pFLine3DayPhone[1]')).toBe('8325550142');
    expect(text('pFLine4MobilePhone[0]')).toBe('8325550143');
    expect(text('pFLine4MobilePhone[1]')).toBe('7135550190');
    expect(text('pFLine6Signature[0]')).toBe('');
    expect(text('pFDerivateSignature[0]')).toBe('');
    // Parts 6 and 7.
    expect(text('pGLine1FamilyName[0]')).toBe('Gomez');
    expect(checked('pGLine3AptSteFlr[2]')).toBe(true);
    expect(text('pGNameofLanguage[0]')).toBe('Spanish');
    expect(text('pHLine1FamilyName[0]')).toBe('Beltran');
    expect(checked('pHLine3Unit[0]')).toBe(true);
    expect(checked('pHLine7PrepStatement[1]')).toBe(true);
    expect(checked('pHLine7Extend[0]')).toBe(true);
    expect(checked('pHLine7Extend[1]')).toBe(false);
    expect(text('pHLine8PrepSignature[0]')).toBe('');
    // Part 8 repeats your name and A-Number.
    expect(text('P3Line1_FamilyName[0]')).toBe('Xocop');
    expect(text('ANum[1]')).toBe('212345678');
  });

  it('fills the family member in the U.S. and Part 8', async () => {
    const index = fieldIndex((await PDFDocument.load(await fillI914SupA(template, carlos))).getForm());
    const text = (n: string) => (index.get(n) as PDFTextField).getText() ?? '';
    const checked = (n: string) => (index.get(n) as PDFCheckBox).isChecked();
    expect(checked('pAFamilyMember[0]')).toBe(true);
    expect(checked('P2Line4_I914Status[0]')).toBe(true);
    expect(text('P4_Line2_FamilyName[0]')).toBe('Sul');
    expect(checked('P1Line3_Unit[2]')).toBe(true);
    expect(text('ANum[0]')).toBe('987654321');
    expect(checked('P4_Line9_MaritalStatus[3]')).toBe(true);
    expect(text('P4_Line1_FamilyName[1]')).toBe('Ixcot');
    expect(text('P2_Line11_StateProvince[1]')).toBe('Totonicapan');
    expect(checked('P4_Line10D_MaririageEnded[1]')).toBe(true);
    expect((index.get('Line20_CurrentNon[0]') as PDFDropdown).getSelected()[0].trim()).toBe('EWI - ENTRY WITHOUT INSPECTION');
    expect(text('Line20C_ArrivalDeparture[0]')).toBe('69432178A01');
    expect((index.get('Line22_CurrentNon[0]') as PDFDropdown).getSelected()[0].trim()).toBe('WB - VISITOR FOR BUSINESS - VWPP');
    expect(text('Pt4Line24_IssuedDateD[0]')).toBe('05/01/2020');
    expect(text('Pt4Line24_IssuedDateE[0]')).toBe('01/15/2027');
    expect(checked('pELine1bYesNo[0]')).toBe(true);
    // Item 18 is "pELine19".
    expect(checked('pELine19YesNo[0]')).toBe(true);
    expect(checked('pELine17YesNo[1]')).toBe(true);
    expect(text('pEWhyCharged5[0]')).toBe('Reason 5');
    expect(checked('pFLine1Interpreter[0]')).toBe(true);
    expect(text('pGLine1FamilyName[0]')).toBe('');
    expect(text('P8_Line3c_ItemNumber[0]')).toBe('2');
    expect(text('P8_Line3d_AdditionalInfo[0]')).toBe('Other name used: Carlos Tzul Ajanel');
    expect(text('P8_Line4c_ItemNumber[0]')).toBe('10');
    expect(text('P8_Line5_ItemNumber[0]')).toBe('1.B');
    expect(text('P8_Line5d_AdditionalInfo[0]')).toMatch(/^Part 4, Items 1\.B, 9\.A, 18: He was detained/);
  });
});
