import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { fieldIndex, optionBoxes } from './common';
import { fillAR11, planAR11 } from './ar11Pdf';

const template = readFileSync(new URL('../../public/forms/ar-11.pdf', import.meta.url));

/** Andrés from the I-821 example, after moving from Miami to Doral. */
export const mover: Answers = {
  'name.family': 'Pérez',
  'name.given': 'Andrés',
  dob: '02/11/1988',
  aNumber: 'A240123456',
  'present.street': '8800 NW 36th St',
  'present.unit': 'Apt 210',
  'present.city': 'Doral',
  'present.state': 'FL',
  'present.zip': '33178',
  previousHas: 'yes',
  'previous.street': '200 NW 7th St',
  'previous.unit': 'Apt 12',
  'previous.city': 'Miami',
  'previous.state': 'FL',
  'previous.zip': '33136',
  mailingDifferent: 'no',
};

describe('AR-11 PDF', () => {
  it('plans only fields that exist, with the right kind', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    const variants: Answers[] = [
      mover,
      { ...mover, 'present.unit': 'Ste 5', 'previous.unit': 'Flr 2', mailingDifferent: 'yes', 'mailing.street': 'PO Box 123', 'mailing.unit': 'Apt 1', 'mailing.city': 'Doral', 'mailing.state': 'FL', 'mailing.zip': '33172' },
      { ...mover, previousHas: 'no', 'present.unit': 'Flr 3' },
    ];
    for (const plan of variants.map(planAR11)) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const name of Object.keys(plan.select)) expect(index.get(name), name).toBeInstanceOf(PDFDropdown);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
    }
  });

  it('writes the answers into the official form', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillAR11(template, mover))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText();
    expect(text('S1_FamilyName[0]')).toBe('Perez');
    expect(text('AlienNumber[0]')).toBe('240123456');
    expect(text('S2B_StreetNumberName[0]')).toBe('8800 NW 36th St');
    expect((f.get('S2B__Unit[0]') as PDFCheckBox).isChecked()).toBe(true); // APT
    expect(text('S2B_AptSteFlrNumber[0]')).toBe('210');
    expect(text('S2A_CityOrTown[0]')).toBe('Miami');
    expect(text('S2C_StreetNumberName[0]')).toBeUndefined();
    expect(text('S3_DateofSignature[0]')).toBeUndefined();
  });
});
