import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { FAM_PROCESSING_ITEMS } from '../forms/i918supa';
import { fieldIndex, optionBoxes } from './common';
import { fillI918SupA, planI918SupA, processingBase, processingPage } from './i918supaPdf';

const template = readFileSync(new URL('../../public/forms/i-918supa.pdf', import.meta.url));

/** Marisol (the I-918 principal in Houston) filing for her daughter Sofía, who lives with her. */
export const sofia: Answers = {
  relationship: 'Child',
  'name.family': 'Ramírez',
  'name.given': 'Marisol',
  'name.middle': 'Guadalupe',
  dob: '07/19/1988',
  aNumber: 'A098765432',
  i918Status: 'Pending',
  'fam.name.family': 'Ramírez',
  'fam.name.given': 'Sofía',
  'fam.name.middle': 'Isabel',
  'fam.otherName.more0': 'no',
  'fam.home.street': '4521 Telephone Rd',
  'fam.home.unit': 'Apt 12',
  'fam.home.city': 'Houston',
  'fam.home.state': 'TX',
  'fam.home.zip': '77087',
  'fam.mailingSame': 'no',
  'fam.mailing.careOf': 'Casa de Esperanza',
  'fam.mailing.street': 'PO Box 2210',
  'fam.mailing.city': 'Houston',
  'fam.mailing.state': 'TX',
  'fam.mailing.zip': '77252',
  'fam.mailing.country': 'United States',
  'fam.dob': '03/22/2010',
  'fam.birthCountry': 'Honduras',
  'fam.citizenship': 'Honduras',
  'fam.sex': 'female',
  'fam.marital': 'Single',
  'fam.passport': 'H7654321',
  'fam.passportCountry': 'Honduras',
  'fam.passportIssued': '01/15/2015',
  'fam.passportExpires': '01/14/2020',
  'fam.inUS': 'yes',
  'fam.lastEntry.date': '05/03/2015',
  'fam.lastEntry.city': 'Hidalgo',
  'fam.lastEntry.state': 'TX',
  'fam.currentStatus': 'No status',
  'fam.priorSpouse.more0': 'no',
  'fam.proceedings': 'no',
  'fam.ead': 'yes',
  ...Object.fromEntries(FAM_PROCESSING_ITEMS.map((i) => [i.id, 'no'])),
  'fam.relative.more0': 'no',
  readsEnglish: 'B',
  fluentLanguage: 'Spanish',
  preparer: 'yes',
  'preparer.name': 'Laura Mendez',
  phone: '713 555 0198',
  mobile: '713 555 0144',
  email: 'marisol.r@example.com',
  'fam.readsEnglish': 'A',
  'fam.preparer': 'no',
  'fam.phone': '713 555 0198',
  'fam.email': 'sofia.r@example.com',
};

/** An interpreter in Houston and a different preparer, a lawyer. */
const helpers: Answers = {
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
  'prep.family': 'Mendez',
  'prep.given': 'Laura',
  'prep.business': 'Mendez Immigration Law',
  'prep.street': '2000 Smith St',
  'prep.unit': 'Flr 3',
  'prep.city': 'Houston',
  'prep.state': 'TX',
  'prep.zip': '77002',
  'prep.country': 'United States',
  'prep.phone': '713 555 0200',
  'prep.mobile': '713 555 0201',
  'prep.email': 'laura@example.com',
  'prep.statement': 'attorneyExtends',
};

/** Her husband, still in Honduras, with a prior marriage. */
const abroad: Answers = {
  ...sofia,
  relationship: 'Spouse',
  i918Status: 'Approved',
  'fam.name.given': 'Carlos',
  'fam.sex': 'male',
  'fam.marital': 'Married',
  'fam.inUS': 'no',
  'fam.beenInUS': 'yes',
  'fam.prevEntry.date': '06/01/2012',
  'fam.prevEntry.city': 'Laredo',
  'fam.prevEntry.state': 'TX',
  'fam.prevEntry.stayExpired': '12/01/2012',
  'fam.prevEntry.status': 'B-2 tourist',
  'fam.notify': 'Consulate',
  'fam.office.city': 'Tegucigalpa',
  'fam.office.country': 'Honduras',
  'fam.priorSpouse.more0': 'yes',
  'fam.priorSpouse1.family': 'Lopez',
  'fam.priorSpouse1.given': 'Ana',
  'fam.priorSpouse1.ended': '02/02/2008',
  'fam.priorSpouse1.where': 'Tegucigalpa, Honduras',
  'fam.priorSpouse1.how': 'Divorce',
  'fam.priorSpouse.more1': 'yes',
  'fam.priorSpouse2.family': 'Diaz',
  'fam.priorSpouse2.given': 'Rosa',
  'fam.priorSpouse2.ended': '03/03/2010',
  'fam.priorSpouse2.where': 'San Pedro Sula, Honduras',
  'fam.priorSpouse2.how': 'Death of spouse',
};

describe('I-918 Supplement A PDF', () => {
  it('names each Part 5 item one number up from Item 4 on', () => {
    expect(processingBase('fam.p5.1a')).toBe('Part5_Line1a_chbxyesno');
    expect(processingBase('fam.p5.4a')).toBe('Part5_Line5a_chbxyesno');
    expect(processingBase('fam.p5.9')).toBe('Part5_Line10_chbxyesno');
    expect(processingBase('fam.p5.29c')).toBe('Part5_Line30c_chbxyesno');
    expect(processingPage('fam.p5.1i')).toBe('4');
    expect(processingPage('fam.p5.8')).toBe('5');
    expect(processingPage('fam.p5.17')).toBe('6');
    expect(processingPage('fam.p5.18')).toBe('7');
  });

  it('plans only fields that exist, with the right kind', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    const allYes = Object.fromEntries(FAM_PROCESSING_ITEMS.map((i) => [i.id, 'yes']));
    const relatives: Answers = { 'fam.relative.more0': 'yes' };
    for (let i = 1; i <= 3; i++) {
      relatives[`fam.relative${i}.family`] = `Family ${i}`;
      relatives[`fam.relative${i}.given`] = `Given ${i}`;
      relatives[`fam.relative${i}.middle`] = `M${i}`;
      relatives[`fam.relative${i}.dob`] = '01/01/2015';
      relatives[`fam.relative${i}.birthCountry`] = 'Mexico';
      relatives[`fam.relative${i}.relationship`] = 'Son';
      relatives[`fam.relative.more${i}`] = 'yes';
    }
    const arrests: Answers = {};
    for (const i of [1, 2]) {
      arrests[`fam.arrest${i}.why`] = 'Shoplifting';
      arrests[`fam.arrest${i}.date`] = '01/01/2012';
      arrests[`fam.arrest${i}.city`] = 'Austin';
      arrests[`fam.arrest${i}.state`] = 'TX';
      arrests[`fam.arrest${i}.country`] = 'United States';
      arrests[`fam.arrest${i}.outcome`] = 'Dismissed';
    }
    const variants: Answers[] = [
      sofia,
      abroad,
      { ...sofia, ...helpers },
      { ...sofia, ...helpers, 'prep.same': 'yes', 'prep.statement': 'notAttorney', 'interp.unit': 'Apt 4' },
      { ...sofia, ...helpers, 'prep.statement': 'attorneyNotExtends', 'interp.unit': 'Flr 2', 'prep.unit': 'Ste 9', 'prep.country': 'Honduras', 'prep.province': 'FM', 'prep.postal': '11101' },
      { ...sofia, ...allYes, ...relatives, ...arrests, 'fam.arrest.more1': 'yes', 'fam.processing.explain': 'Arrested in 2012.', 'fam.otherName.more0': 'yes', 'fam.otherName1.family': 'Ortega', 'fam.otherName1.given': 'Sofia', 'fam.otherName.more1': 'yes', 'fam.otherName2.family': 'Ruiz', 'fam.otherName2.given': 'Sofia' },
      { ...sofia, 'fam.proceedings': 'yes', 'fam.proceedingsTypes': ['b', 'c', 'd', 'e', 'f'], 'fam.proceedings.b': 'Current', 'fam.proceedings.c': '01/01/2001', 'fam.proceedings.d': '01/01/2002', 'fam.proceedings.e': '01/01/2003', 'fam.proceedings.f': '01/01/2004', 'fam.proceedings.explain': 'Houston immigration court' },
      ...['Pre-Flight', 'Port of Entry'].map((notify) => ({ ...abroad, 'fam.notify': notify, 'fam.office.state': 'TX' })),
      { ...abroad, 'fam.notify': 'address', 'fam.foreign.street': 'Colonia Kennedy 5', 'fam.foreign.unit': 'Ste 3', 'fam.foreign.city': 'Tegucigalpa', 'fam.foreign.province': 'FM', 'fam.foreign.postal': '11101', 'fam.foreign.country': 'Honduras', 'fam.mailing.unit': 'Flr 2', 'fam.home.unit': 'Ste 1' },
      { ...abroad, 'fam.notify': 'address', 'fam.foreign.unit': 'Apt 7', 'fam.mailing.unit': 'Apt 5', 'fam.home.unit': 'Flr 4', relationship: 'Parent', 'fam.marital': 'Widowed' },
      { ...abroad, 'fam.notify': 'address', 'fam.foreign.unit': 'Flr 1', 'fam.mailing.unit': 'Ste 5', relationship: 'Unmarried', 'fam.marital': 'Divorced', 'fam.beenInUS': 'no' },
      { ...sofia, readsEnglish: 'A', preparer: 'no', 'fam.readsEnglish': 'B', 'fam.fluentLanguage': 'Spanish', 'fam.preparer': 'yes', 'fam.preparer.name': 'Laura Mendez', 'fam.ead': 'no', 'fam.ssn': '123-45-6789', 'fam.uscisAccount': '123412341234', 'fam.i94': '12345678901', 'fam.travelDoc': 'TD1', 'fam.aNumber': '123456789', uscisAccount: '000011112222', 'fam.mobile': '713 555 0111' },
    ];
    for (const plan of variants.map(planI918SupA)) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) expect(index.get(name), name).toBeInstanceOf(PDFCheckBox);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
      for (const name of Object.keys(plan.select)) expect(index.get(name), name).toBeInstanceOf(PDFDropdown);
    }
    const rich = planI918SupA(variants[5]);
    expect(rich.text['Part6_Line9a_FamilyName[0]']).toBe('Family 3');
    expect(rich.text['P3_3f_Outcome[0]']).toBe('Dismissed');
    expect(rich.checkValue).toContainEqual(['Part5_Line30c_chbxyesno', 'Yes']);
    expect(rich.notes.map((n) => n.item)).toEqual(['2', '1.a']);
    expect(rich.notes[1].page).toBe('4');
    expect(planI918SupA(variants[6]).notes[0]).toMatchObject({ page: '3', part: '4', item: '7' });
    // The work permit is No for a family member abroad; Part 8 stays blank.
    const away = planI918SupA(abroad);
    expect(away.checkValue).toContainEqual(['UsenamePart4_Line9_chbxyesno', 'No']);
    expect(away.checkValue.find(([b]) => b === 'Part8_Line1_ReadCheckbox')).toBeUndefined();
    expect(away.text['Part4_Line1a_DateOfLastEntry[0]']).toBeUndefined();
    // A family member's own interpreter or preparer brings in Parts 9 and 10.
    expect(planI918SupA({ ...variants[11], ...helpers }).text['P7_Line1a_PreparersFamilyName[0]']).toBe('Mendez');
  });

  it('writes the answers into the official form', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI918SupA(template, sofia))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    const checked = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    expect(checked('Part1_Line1_checkbox[1]')).toBe(true);
    expect(text('Pt1Line1a_FamilyName[0]')).toBe('Ramirez');
    expect(text('Pt1Line1b_GivenName[1]')).toBe('Marisol');
    expect(text('Part2_Line3_AlienNumber[1]')).toBe('098765432');
    expect(checked('Part2_Line5_checkbox[0]')).toBe(true);
    expect(text('Pt3Line1b_GivenName[0]')).toBe('Sofia');
    expect(text('Pt3Line3b_AptSteFlrNumber[0]')).toBe('12');
    expect(checked('Pt3Line3b_Unit[2]')).toBe(true);
    expect((f.get('Pt3Line3d_State[0]') as PDFDropdown).getSelected()).toEqual(['TX']);
    expect(text('P1_Line4a_InCareofName[0]')).toBe('Casa de Esperanza');
    // Items 9 and 10 carry Part 1 names.
    expect(text('P1_Line3h_Country[0]')).toBe('Honduras');
    expect(text('P1_LinePart3_Line18_ExpDateforPassport10_DateOfBirth[0]')).toBe('01/14/2020');
    expect(checked('Part3_Line11_checkbox[2]')).toBe(true);
    expect(checked('P3_Line12_checkbox[0]')).toBe(true);
    expect(text('Part4_Line1d_CurrentImmigration[0]')).toBe('No status');
    // Item 7.a's No is the first box.
    expect(checked('Pt2Line7a_chbxyesno[0]')).toBe(true);
    expect(checked('UsenamePart4_Line9_chbxyesno[0]')).toBe(true);
    expect(checked('Part5_Line1a_chbxyesno[1]')).toBe(true);
    expect(checked('Part5_Line30c_chbxyesno[1]')).toBe(true);
    expect(checked('Part7_Line1_ReadCheckbox[1]')).toBe(true);
    expect(text('Part7_Line1b_Language[0]')).toBe('Spanish');
    expect(text('Part7_Line2_Attorney[0]')).toBe('Laura Mendez');
    expect(text('Part7_Line3_DaytimePhoneNumber[0]')).toBe('7135550198');
    expect(checked('Part8_Line1_ReadCheckbox[0]')).toBe(true);
    expect(text('Part8_Line5_EmailAddress[0]')).toBe('sofia.r@example.com');
    expect(text('Part7_Lnine7a_Signature[0]')).toBe('');
    expect(text('P8_Line3d_AdditionalInfo[0]')).toBe('');
  });

  it('fills the family member abroad, prior spouses, interpreter and preparer', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI918SupA(template, { ...abroad, ...helpers }))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    const checked = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    expect(checked('Part1_Line1_checkbox[0]')).toBe(true);
    expect(checked('Part2_Line5_checkbox[1]')).toBe(true);
    expect(text('Part4_Line2e_StatusOfEntry[0]')).toBe('B-2 tourist');
    expect(checked('Pt4Line3a_Checkboxes[0]')).toBe(true);
    expect(text('Pt4Line3b_CityOrTown[0]')).toBe('Tegucigalpa');
    expect(text('Pt4Line1a_FamilyName[0]')).toBe('Lopez');
    expect(text('Part4_Line6d_DateMarriageEnded[0]')).toBe('02/02/2008');
    expect(text('Part4_Line4f_HowMarriageEnded[0]')).toBe('Divorce');
    expect(text('Pt4Line6a_FamilyName[0]')).toBe('Diaz');
    expect(text('Part4_Line7d_DateMarriageEnded[0]')).toBe('03/03/2010');
    expect(checked('UsenamePart4_Line9_chbxyesno[1]')).toBe(true);
    expect(text('Part9_Line1a_InterpretersFamilyName[0]')).toBe('Gomez');
    expect(text('Pt1LinPart9_Line1b_InterpretersGivenNamee1b_GivenName[0]')).toBe('Rosa');
    expect(checked('Pt9Line3_Unit[0]')).toBe(true);
    expect(text('Pt9Line3_AptSteFlrNumber[0]')).toBe('210');
    expect(text('P6_Line4_InterpretersDaytimeTelephoneNumber3[1]')).toBe('7135550101');
    expect(text('Part9_Language[0]')).toBe('Spanish');
    expect(text('P7_Line2_PreparersBusinessName[0]')).toBe('Mendez Immigration Law');
    expect(checked('Pt10Line3_Unit[1]')).toBe(true);
    expect(text('P7_Line5_PreparersFaxNumber3[0]')).toBe('7135550201');
    expect(checked('Part10_Line7_Attorney[1]')).toBe(true);
    expect(checked('Part10_Line7b_Extend[1]')).toBe(true);
    expect(text('Part8_Line3_DaytimePhoneNumber3[0]')).toBe('');
  });

  it('runs a long Part 5 explanation on into the next Part 11 blocks', async () => {
    const long = Array.from({ length: 60 }, (_, i) => `Sentence ${i + 1} about the arrest in Austin and the dismissed charge.`).join(' ');
    const a: Answers = { ...sofia, 'fam.p5.1b': 'yes', 'fam.arrest1.why': 'Theft', 'fam.arrest.more1': 'no', 'fam.processing.explain': long };
    const f = fieldIndex((await PDFDocument.load(await fillI918SupA(template, a))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    expect(text('P8_Line3a_PageNumber[0]')).toBe('4');
    expect(text('P8_Line3b_PartNumber[0]')).toBe('5');
    expect(text('P8_Line3c_ItemNumber[0]')).toBe('1.b');
    expect(text('P8_Line3d_AdditionalInfo[0]')).toMatch(/^Part 5, Item 1\.b: Sentence 1/);
    expect(text('P8_Line4d_AdditionalInfo[0]')).not.toBe('');
  });
});
