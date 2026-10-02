import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { fieldIndex, optionBoxes } from './common';
import { fillI407, planI407 } from './i407Pdf';

const template = readFileSync(new URL('../../public/forms/i-407.pdf', import.meta.url));

/** María Elena, who moved back to Guadalajara for good and mails in her I-407 from Mexico. */
export const mariaElena: Answers = {
  understands: 'yes',
  aNumber: 'A098765432',
  cardName: 'MARIA ELENA TORRES RUIZ',
  'name.family': 'Torres Ruiz',
  'name.given': 'María',
  'name.middle': 'Elena',
  dob: '03/22/1968',
  birthCountry: 'Mexico',
  citizenship: 'Mexico',
  lastDeparture: '06/15/2024',
  submission: 'B',
  'mailing.street': 'Av. Chapultepec 1450',
  'mailing.unit': 'Depto 3',
  'mailing.city': 'Guadalajara',
  'mailing.province': 'Jalisco',
  'mailing.postal': '44190',
  'mailing.country': 'Mexico',
  email: 'mariaelena.torres@example.com',
  cardReturned: 'no',
  cardReason: 'L',
  'otherDocs.has': 'yes',
  otherDocs: 'Reentry permit (Form I-327) issued 01/10/2023',
  filer: 'self',
};

describe('I-407 PDF', () => {
  it('plans only fields that exist, with the right kind', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    const variants: Answers[] = [
      mariaElena,
      { ...mariaElena, cardReturned: 'yes', 'otherDocs.has': 'no', filer: 'guardian', 'guardian.name': 'Jose Torres', 'mailing.unit': 'Suite 5', 'mailing.state': 'CA', 'mailing.zip': '90001', uscisAccount: '1234-5678-9012' },
      { ...mariaElena, 'mailing.unit': 'Floor 2', 'mailing.careOf': 'Ana Ruiz' },
      ...['S', 'M', 'O'].map((cardReason) => ({ ...mariaElena, cardReason })),
      ...['A', 'C', 'D'].map((submission) => ({ ...mariaElena, submission })),
    ];
    for (const plan of variants.map(planI407)) {
      for (const name of [...Object.keys(plan.text), ...Object.keys(plan.long)]) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) expect(index.get(name), name).toBeInstanceOf(PDFCheckBox);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
      for (const name of Object.keys(plan.select)) expect(index.get(name), name).toBeInstanceOf(PDFDropdown);
    }
    expect(planI407(variants[1]).text['P1_Line19_YourName[0]']).toBe('Jose Torres');
    expect(planI407(variants[1]).check).not.toContain('Pt1Line13_Checkbox[0]');
    expect(planI407(variants[1]).checkValue).toContainEqual(['Part1_Item9_Unit', 'STE']);
  });

  it('writes the answers into the official form', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI407(template, mariaElena))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText();
    const checked = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    expect(text('P1_Line1_AlienNumber[0]')).toBe('098765432');
    expect(text('P1_Line1_AlienNumber[3]')).toBe('098765432');
    expect(text('P1_Line4_GivenName[0]')).toBe('Maria');
    expect(text('P1_Line8_DateOfLastDeparture[0]')).toBe('06/15/2024');
    expect(text('Part21_Item9_Number[0]')).toBe('3');
    expect(checked('Part1_Item9_Unit[0]')).toBe(true);
    expect(checked('P1_Line11_YesNo[0]')).toBe(true); // No
    expect(checked('P1_Line11_YesNo[1]')).toBe(false);
    expect(checked('P1_Line12[0]')).toBe(true); // Lost
    expect(checked('Pt1Line13_Checkbox[0]')).toBe(true);
    expect(text('P1_Line13_Date[0]') ?? '').toBe('');
    // Item 16 (by mail) is the first box of the group.
    expect(checked('Pt1Submit_Checkbox[0]')).toBe(true);
    expect(checked('Pt1Submit_Checkbox[3]')).toBe(false);
    expect(text('P1_Line14_OtherDocuments[0]')).toContain('Reentry permit');
    expect(text('P1_Line19_YourName[0]')).toBe('Maria Elena Torres Ruiz');
    expect(text('P1_Line20_Signature[0]') ?? '').toBe('');
  });
});
