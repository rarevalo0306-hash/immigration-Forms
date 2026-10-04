import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { CO_ITEMS } from '../forms/i539a';
import { I539_CURRENT_STATUSES } from '../forms/i539Status';
import { fieldIndex, optionBoxes } from './common';
import { fillI539A, PART3, planI539A } from './i539aPdf';

const template = readFileSync(new URL('../../public/forms/i-539a.pdf', import.meta.url));

const allNo = Object.fromEntries(CO_ITEMS.map((i) => [i.id, 'no']));
const allYes = Object.fromEntries(CO_ITEMS.map((i) => [i.id, 'yes']));

/** Mateo, 9, an H-4 child, included in his mother Daniela's I-539 to extend their H-4 stay in San Jose. */
export const mateo: Answers = {
  'name.family': 'Hernández',
  'name.given': 'Daniela',
  'name.middle': 'Sofía',
  'co.relationship': 'child',
  'co.name.family': 'Torres Hernández',
  'co.name.given': 'Mateo',
  'co.name.middle': 'Andrés',
  'co.dob': '02/11/2017',
  'co.birthCountry': 'Colombia',
  'co.citizenship': 'Colombia',
  'co.lastEntry.date': '08/15/2024',
  'co.i94.number': '987654321B2',
  'co.passport.number': 'AV1234567',
  'co.passport.country': 'Colombia',
  'co.passport.expires': '03/01/2029',
  'co.currentStatus': 'H4 - SPS OR CHLD OF H1,H2,H3 OR H2R',
  'co.statusDS': 'no',
  'co.i94.expires': '11/30/2026',
  'co.passportChanged': 'no',
  ...allNo,
  'co.employed': 'no',
  'co.support.explain': 'I am 9 years old. My mother, Daniela Hernandez, supports me with her H-1B salary as a software engineer ($142,000 per year). Her pay stubs and employment letter are attached to her Form I-539.',
  'co.exchangeVisitor': 'no',
  'co.phone': '408 555 0199',
  'co.email': 'daniela.hernandez@example.com',
  readsEnglish: 'B',
  preparer: 'yes',
  'prep.same': 'no',
  'interp.family': 'Ríos',
  'interp.given': 'Carmen',
  'interp.business': 'Ayuda Comunitaria de San José',
  'interp.phone': '408 555 0123',
  'interp.email': 'carmen@example.org',
  'interp.language': 'Spanish',
  'prep.family': 'Hernández',
  'prep.given': 'Daniela',
  'prep.phone': '408 555 0199',
  'prep.mobile': '408 555 0198',
  'prep.email': 'daniela.hernandez@example.com',
};

describe('I-539A PDF', () => {
  it('maps Part 3 in printed order', () => {
    expect(PART3).toHaveLength(18);
    expect(CO_ITEMS).toHaveLength(16);
    expect(planI539A({ 'co.p3.13': 'yes' }).checkValue).toEqual([['P3_Line12_SoldProvWeap', 'Y']]);
    expect(planI539A({ 'co.p3.9': 'no' }).checkValue).toEqual([['P3_Line9_LimDenRelBel', 'N']]);
  });

  it('plans only fields that exist, with the right kind', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    const variants: Answers[] = [
      mateo,
      { ...mateo, ...allYes, 'co.background.explain': 'Explained', 'co.statusDS': 'yes', 'co.employed': 'yes', 'co.employed.explain': 'Worked', 'co.exchangeVisitor': 'yes', 'co.exchange.explain': 'J-2 2019', 'co.aNumber': 'A123456789', 'co.ssn': '123-45-6789', 'co.uscisAccount': '123456789012' },
      { ...mateo, 'co.passportChanged': 'yes', 'co.newPassport.number': 'AV7', 'co.newPassport.country': 'Colombia', 'co.newPassport.expires': '01/01/2035', 'co.passport.travelDoc': 'TD1' },
      { ...mateo, readsEnglish: 'A', preparer: 'no' },
      { ...mateo, 'prep.same': 'yes', 'interp.mobile': '408 555 0100' },
      ...I539_CURRENT_STATUSES.map((s) => ({ ...mateo, 'co.currentStatus': s })),
    ];
    for (const plan of variants.map(planI539A)) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
      for (const [name, value] of Object.entries(plan.select)) {
        const field = index.get(name);
        expect(field, name).toBeInstanceOf(PDFDropdown);
        expect((field as PDFDropdown).getOptions().map((o) => o.trim()), `${name}=${value}`).toContain(value);
      }
    }
    const all = planI539A(variants[1]);
    expect(all.notes.map((n) => n.item)).toEqual(['1-16', '17', '18']);
    expect(all.text['SupA_Line1p_DateExpires[0]']).toBe('D/S');
    expect(planI539A({ ...mateo, 'co.p3.4': 'yes', 'co.p3.15': 'yes', 'co.background.explain': 'x' }).notes[0]).toMatchObject({ page: '2', part: '3', item: '4,15', text: 'Items 4, 15: x' });
    // The same person interpreted and prepared: Part 6 repeats the interpreter.
    expect(planI539A(variants[4]).text['P15_Line1_PreparerFamilyName[0]']).toBe('Ríos');
    expect(planI539A(variants[3]).text['P14_Line1_nterpreterFamilyName[0]']).toBeUndefined();
  });

  it('writes the answers into the official form', async () => {
    const answers: Answers = { ...mateo, 'co.p3.2': 'yes', 'co.background.explain': 'My grandfather, a U.S. citizen, filed Form I-130 for my mother in 2023 (receipt IOE0912345670). I am a derivative.' };
    const f = fieldIndex((await PDFDocument.load(await fillI539A(template, answers))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    const checked = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    // Part 1 is the principal; Part 2 and the top of Part 7 are the co-applicant.
    expect(text('P1Line1a_FamilyName[0]')).toBe('Hernandez');
    expect(text('P2_Line1a_FamilyName[0]')).toBe('Torres Hernandez');
    expect(text('P2_Line1b_GivenName[1]')).toBe('Mateo');
    expect(text('SupA_Line2_DateOfBirth[0]')).toBe('02/11/2017');
    expect(text('SupA_Line1j_ArrivalDeparture[0]')).toBe('987654321B2');
    expect((f.get('Pt1Line15a_NewStatus[0]') as PDFDropdown).getSelected()[0].trim()).toBe('H4 - SPS OR CHLD OF H1,H2,H3 OR H2R');
    expect(text('SupA_Line1p_DateExpires[0]')).toBe('11/30/2026');
    // Yes is the left box ([1]), No the right one ([0]).
    expect(checked('P3_Line2_PetFiled[1]')).toBe(true);
    expect(checked('P3_Line1_ImmVisa[0]')).toBe(true);
    expect(checked('P3_Line12_SoldProvWeap[0]')).toBe(true);
    expect(checked('P3_Line17_AdmitGrantExt[0]')).toBe(true);
    expect(checked('P3_Line18_J1J2Visitor[1]')).toBe(false);
    expect(text('P11_Line3A[0]')).toBe('2');
    expect(text('P11_Line3C[0]')).toBe('2');
    expect(text('P7_Line3D[0]')).toContain('Item 2: My grandfather');
    expect(text('P11_Line4C[0]')).toBe('17');
    expect(text('P7_Line4D[0]')).toContain('How I am supporting myself');
    expect(text('P12_Line3_Telephone[0]')).toBe('4085550199');
    // Interpreter and preparer.
    expect(text('P14_Line1_nterpreterFamilyName[0]')).toBe('Rios');
    expect(text('P14_Line2_NameofBusinessorOrgName[0]')).toBe('Ayuda Comunitaria ');
    expect(text('P7_Line6_Language[0]')).toBe('Spanish');
    expect(text('P15_Line1_PreparerGivenName[0]')).toBe('Daniela');
    expect(text('P15_Line5_Mobile[0]')).toBe('4085550198');
    // Signatures stay blank.
    expect(text('P12_SignatureApplicant[0]')).toBe('');
    expect(text('P12_SignatureApplicant[2]')).toBe('');
    expect(text('USCISOnlineAcctNumber[0]')).toBe('');
  });

  it('continues a long explanation in the next Part 7 boxes', async () => {
    const long = Array(50).fill('I worked part time at a restaurant on weekends.').join(' ');
    const f = fieldIndex((await PDFDocument.load(await fillI539A(template, { ...mateo, 'co.employed': 'yes', 'co.employed.explain': long, 'co.p3.15': 'yes', 'co.background.explain': long }))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    expect([3, 4, 5, 6].map((n) => text(`P11_Line${n}C[0]`))).toEqual(['15', '15', '15', '17']);
    expect(text('P7_Line6D[0]')).toMatch(/\(Continued on attached sheet\.\)$/);
  });
});
