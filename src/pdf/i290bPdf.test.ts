import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { OFFICES } from '../forms/i290b';
import { fieldIndex, optionBoxes } from './common';
import { fillI290B, planI290B } from './i290bPdf';

const template = readFileSync(new URL('../../public/forms/i-290b.pdf', import.meta.url));

/** Carlos, whose I-765 was denied because USCIS said a document was missing, asks to reopen. */
export const carlos: Answers = {
  filer: 'person',
  'name.family': 'Ramírez',
  'name.given': 'Carlos',
  'name.middle': 'Andrés',
  dob: '07/23/1988',
  aNumber: 'A098765432',
  uscisAccount: '000123456789',
  'mailing.careOf': 'Lucía Ramírez',
  'mailing.street': '4521 Alameda St',
  'mailing.unit': 'Apt 12',
  'mailing.city': 'Houston',
  'mailing.state': 'TX',
  'mailing.zip': '77004',
  'mailing.country': 'United States',
  filingType: 'reopen',
  'decision.form': 'i-765',
  'decision.receipt': 'IOE-0912345678',
  'decision.date': '09/15/2026',
  'decision.office': 'Potomac Service Center (YSC)',
  'basis.statement':
    'USCIS denied my application because it said I did not submit a copy of my asylum receipt notice. I did submit it, and I attach the delivery confirmation and a new copy of the receipt notice as evidence.',
  phone: '(713) 555-0198',
  mobile: '713 555 0199',
  email: 'carlos.ramirez@example.com',
};

const long = (n: number) => [...Array(n)].map((_, i) => `Paragraph ${i + 1}. The officer did not consider the evidence of record, including the affidavits and the employment letters submitted with the petition.`).join('\n');

describe('I-290B PDF', () => {
  it('plans only fields that exist, with the right kind', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    const variants: Answers[] = [
      carlos,
      ...['A', 'B', 'C'].map((appealBrief) => ({ ...carlos, filingType: 'appeal', appealBrief, 'decision.form': 'I-360', 'decision.classification': 'eb-4', 'decision.office': 'AAO' })),
      { ...carlos, filingType: 'reconsider', 'mailing.unit': 'Ste 200' },
      { ...carlos, filingType: 'both', 'mailing.unit': 'Floor 3', 'decision.office': 'Other', 'decision.officeOther': 'Mexico City Field Office' },
      { ...carlos, filer: 'business', 'business.name': 'Ramirez Construction LLC', 'mailing.state': '', 'mailing.zip': '', 'mailing.province': 'Jalisco', 'mailing.postal': '44100', 'mailing.country': 'Mexico' },
      ...OFFICES.map((o) => ({ ...carlos, 'decision.office': o })),
    ];
    for (const plan of variants.map(planI290B)) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) expect(index.get(name), name).toBeInstanceOf(PDFCheckBox);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
      for (const [name, value] of Object.entries(plan.select)) {
        const field = index.get(name);
        expect(field, name).toBeInstanceOf(PDFDropdown);
        expect((field as PDFDropdown).getOptions().map((o) => o.trim()), `${name}=${value}`).toContain(value);
      }
    }
    expect(planI290B(variants[6]).text['Pt1_Line3a_InCareOfName[0]']).toBe('Ramirez Construction LLC');
    expect(planI290B(variants[6]).text['Pt1_Line1a_FamilyName[0]']).toBeUndefined();
    expect(planI290B(variants[5]).notes[0]).toMatchObject({ page: '2', part: '2', item: '7' });
    expect(planI290B(carlos).checkValue).toContainEqual(['P2_Line2_checkbox', 'reopen']);
    expect(planI290B(variants[1]).checkValue).not.toContainEqual(['P2_Line2_checkbox', 'reopen']);
  });

  it('writes the answers into the official form', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI290B(template, carlos))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText();
    const checked = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    expect(text('Pt1_Line1a_FamilyName[0]')).toBe('Ramirez');
    expect(text('Pt1_Line1a_FamilyName[1]')).toBe('Ramirez');
    expect(text('Pt1_Line1c_MiddleName[0]')).toBe('Andres');
    expect(text('Pt1_Line6_AlienNumber[0]')).toBe('098765432');
    expect(text('Pt1_Line6_AlienNumber[1]')).toBe('098765432');
    expect(text('Pt1Line6_InCareOfName[0]')).toBe('Lucia Ramirez');
    expect(text('Pt1Line6_AptSteFlrNumber[0]')).toBe('12');
    expect(checked('Pt1Line6_Unit[1]')).toBe(true);
    expect((f.get('Pt1Line6_State[0]') as PDFDropdown).getSelected()).toEqual(['TX']);
    // Item 4 is named Line3, and Items 2.a-2.c export reopen/reconsider/motion.
    expect(text('Pt2_Line3_ReceiptNumber[0]')).toBe('IOE0912345678');
    expect(text('P2_Line2_Formnumberappeal[0]')).toBe('I-765');
    expect(text('P2_Line5_DateAdverseDecision[0]')).toBe('09/15/2026');
    expect(checked('P2_Line2_checkbox[0]')).toBe(true);
    expect(checked('P2_Line2_checkbox[2]')).toBe(false);
    expect((f.get('P3_Line6_USCISOffice[0]') as PDFDropdown).getSelected()[0].trim()).toBe('Potomac Service Center (YSC)');
    expect(text('Pt3_FillableField[0]')).toContain('asylum receipt notice');
    expect(text('P4_Line3_TelephoneNumber[0]')).toBe('7135550198');
    expect(text('P4_Line5_Email[0]')).toBe('carlos.ramirez@example.com');
    expect(text('Pt7_Line3d_AdditionalInfo[0]') ?? '').toBe('');
    expect(text('P4_Line6b_DateofSignature[0]') ?? '').toBe('');
  });

  it('marks Item 1.b, which is the third box, for a brief sent later', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI290B(template, { ...carlos, filingType: 'appeal', appealBrief: 'B' }))).getForm());
    const checked = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    expect(checked('P2_Line1_checkbox[2]')).toBe(true);
    expect(checked('P2_Line1_checkbox[1]')).toBe(false);
    expect(checked('P2_Line1_checkbox[0]')).toBe(false);
    expect(checked('P2_Line2_checkbox[0]')).toBe(false);
  });

  it('continues a long statement in Part 7 and on added pages', async () => {
    const base = await PDFDocument.load(template);
    const medium = await PDFDocument.load(await fillI290B(template, { ...carlos, 'basis.statement': long(12) }));
    const f = fieldIndex(medium.getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    expect(text('Pt3_FillableField[0]')).toContain('Continued in Part 7');
    expect(text('Pt7_Line3d_AdditionalInfo[0]')).toContain('continued from Part 3');
    expect(text('Pt7_Line3a_PageNumber[0]')).toBe('2');
    expect(text('Pt7_Line3b_PartNumber[0]')).toBe('3');
    expect(medium.getPageCount()).toBe(base.getPageCount());

    const huge = await PDFDocument.load(await fillI290B(template, { ...carlos, 'decision.office': 'Other', 'decision.officeOther': 'Mexico City', 'basis.statement': long(60) }));
    const h = fieldIndex(huge.getForm());
    expect((h.get('Pt7_Line3d_AdditionalInfo[0]') as PDFTextField).getText()).toContain('Mexico City');
    expect((h.get('Pt7_Line7d_AdditionalInfo[0]') as PDFTextField).getText()).toContain('attached sheet');
    expect(huge.getPageCount()).toBeGreaterThan(base.getPageCount());
  });
});
