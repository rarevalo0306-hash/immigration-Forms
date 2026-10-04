import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { fieldIndex, optionBoxes } from './common';
import { fillI485supa, planI485supa } from './i485supaPdf';

const template = readFileSync(new URL('../../public/forms/i-485supa.pdf', import.meta.url));

/**
 * José Luis entered without inspection in 1999 and has worked without a permit. His sister, a U.S.
 * citizen, filed an I-130 for him in March 2001, and he was in the U.S. on December 21, 2000.
 */
export const joseLuis: Answers = {
  'supa.timing': 'together',
  'name.family': 'Hernández Cruz',
  'name.given': 'José',
  'name.middle': 'Luis',
  'mailing.street': '4521 S Kedzie Ave',
  'mailing.unit': 'Apt 2F',
  'mailing.city': 'Chicago',
  'mailing.state': 'IL',
  'mailing.zip': '60632',
  aNumber: 'A087654321',
  dob: '07/14/1976',
  birthCountry: 'Mexico',
  citizenship: 'Mexico',
  basis245i: 'B',
  'qualifying.receipt': 'EAC-01-123-45678',
  'supa.category': 'Sibling of U.S. citizen (F4)',
  bars: ['A', 'C', 'D'],
  phone: '(773) 555-0142',
  mobile: '773 555 0199',
  email: 'joseluis.hernandez@example.com',
  readsEnglish: 'A',
  preparer: 'no',
};

/** His wife Guadalupe, a derivative of the same petition, with an interpreter who also prepared it. */
export const guadalupe: Answers = {
  ...joseLuis,
  'name.family': 'Ramírez de Hernández',
  'name.given': 'Guadalupe',
  'name.middle': '',
  aNumber: '',
  dob: '12/02/1979',
  basis245i: 'D',
  'qualPrincipal.family': 'Hernández Cruz',
  'qualPrincipal.given': 'José',
  'qualPrincipal.middle': 'Luis',
  'qualPrincipal.aNumber': 'A087654321',
  'mailing.careOf': 'Jose L Hernandez',
  bars: ['A', 'C'],
  readsEnglish: 'B',
  preparer: 'yes',
  'interp.family': 'Morales',
  'interp.given': 'Carmen',
  'interp.business': 'Centro Legal Pilsen',
  'interp.phone': '312 555 0100',
  'interp.mobile': '312 555 0101',
  'interp.email': 'carmen@example.org',
  'interp.language': 'Spanish',
  'prep.same': 'yes',
};

describe('I-485 Supplement A PDF', () => {
  it('plans only fields that exist, with the right kind', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    const variants: Answers[] = [
      joseLuis,
      guadalupe,
      { ...guadalupe, 'prep.same': 'no', 'prep.family': 'Lee', 'prep.given': 'Ana', 'prep.business': 'Lee Law', 'prep.phone': '312 555 0200', 'prep.mobile': '312 555 0201', 'prep.email': 'ana@example.com' },
      { ...joseLuis, readsEnglish: 'A', preparer: 'yes', 'prep.family': 'Lee', 'prep.given': 'Ana', 'prep.phone': '312 555 0200' },
      { ...joseLuis, 'mailing.unit': 'Suite 5', uscisAccount: '1234-5678-9012', bars: ['B', 'E', 'F', 'G', 'H', 'I', 'J'] },
      { ...joseLuis, 'mailing.unit': 'Floor 3', 'mailing.careOf': 'Maria Cruz' },
      ...['A', 'C', 'E'].map((basis245i) => ({ ...guadalupe, basis245i })),
    ];
    for (const plan of variants.map(planI485supa)) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) expect(index.get(name), name).toBeInstanceOf(PDFCheckBox);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
      for (const name of Object.keys(plan.select)) expect(index.get(name), name).toBeInstanceOf(PDFDropdown);
    }
    // The applicant is the principal beneficiary under 1.a and 1.b.
    expect(planI485supa(joseLuis).text['Part2_Line3_GivenName[0]']).toBe('José');
    expect(planI485supa(joseLuis).text['Part2_Line4_AlienNumber[0]']).toBe('087654321');
    expect(planI485supa(guadalupe).text['Part2_Line3_FamilyName[0]']).toBe('Hernández Cruz');
    // The same person interpreted and prepared it.
    expect(planI485supa(guadalupe).text['Part6_Line1_PreparerFamilyName[0]']).toBe('Morales');
    expect(planI485supa(variants[2]).text['Part6_Line1_PreparerFamilyName[0]']).toBe('Lee');
    expect(planI485supa(variants[3]).text['Part5_Line1_InterpreterFamilyName[0]']).toBeUndefined();
    expect(planI485supa(variants[4]).checkValue).toContainEqual(['Part1_Line2_CB', 'STE']);
    expect(planI485supa(joseLuis).text['Part2_Line2_ReceiptNumber[0]']).toBe('EAC0112345678');
  });

  it('writes the answers into the official form', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI485supa(template, guadalupe))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    const checked = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    expect(text('Part1_Line1_FamilyName[0]')).toBe('Ramirez de Hernandez');
    expect(text('Part1_Line2_InCareofName[0]')).toBe('Jose L Hernandez');
    // The unit boxes are listed FLR, APT, STE; "Apt" is the second one.
    expect(checked('Part1_Line2_CB[1]')).toBe(true);
    expect(checked('Part1_Line2_CB[0]')).toBe(false);
    expect(text('Part1_Line2_AptSteFlrNumber[0]')).toBe('2F');
    expect((f.get('Part1_Line2_State[0]') as PDFDropdown).getSelected()[0]?.trim()).toBe('IL');
    expect(text('Part1_Line3_AlienNumber[0]')).toBe('');
    // 1.d is the fourth box of the group, after Part 3's boxes in the field order.
    expect(checked('Part2_Line1_Checkbox[3]')).toBe(true);
    expect(checked('Part2_Line1_Checkbox[1]')).toBe(false);
    expect(text('Part2_Line4_AlienNumber[0]')).toBe('087654321');
    expect(text('Part2_Line5_Category[0]')).toBe('Sibling of U.S. citizen (F4)');
    expect(checked('Part3_Line1_Checkbox[0]')).toBe(true);
    expect(checked('Part3_Line1_Checkbox[2]')).toBe(true);
    expect(checked('Part3_Line1_Checkbox[3]')).toBe(false);
    expect(text('Part4_Line1_DayPhone[0]')).toBe('7735550142');
    expect(text('Part4_Line4_Signature[0]')).toBe('');
    expect(text('Part5_Line1_InterpreterGivenName[0]')).toBe('Carmen');
    expect(text('Part5_NameofLanguage[0]')).toBe('Spanish');
    expect(text('Part6_Line2_BusinessName[0]')).toBe('Centro Legal Pilsen');
    expect(text('Part6_Line3_DayPhone[0]')).toBe('3125550100');
    expect(text('Part6_Line6_DateofSignature[0]')).toBe('');
  });
});
