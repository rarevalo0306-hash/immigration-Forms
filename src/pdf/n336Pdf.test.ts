import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { fieldIndex, optionBoxes } from './common';
import { PART8, fillN336, planN336, reasonsStatement } from './n336Pdf';

const template = readFileSync(new URL('../../public/forms/n-336.pdf', import.meta.url));

/** Jorge, whose N-400 was denied over unpaid taxes he had already settled. */
export const jorge: Answers = {
  'name.family': 'Ramírez',
  'name.given': 'Jorge',
  'name.middle': 'Luis',
  hasOtherNames: 'yes',
  'otherName1.family': 'Ramírez Ortega',
  'otherName1.given': 'Jorge',
  hasOtherNames2: 'no',
  aNumber: 'A098765432',
  dob: '07/23/1979',
  uscisAccount: '123456789012',
  'home.street': '4521 E Olympic Blvd',
  'home.unit': 'Apt 12',
  'home.city': 'Los Angeles',
  'home.county': 'Los Angeles',
  'home.state': 'CA',
  'home.zip': '90022',
  mailingSame: 'yes',
  workPhone: '323 555 0144',
  'n400.receipt': 'IOE-0912345678',
  'n400.denialDate': '09/15/2026',
  'n400.office': 'Los Angeles Field Office',
  'n400.military': 'no',
  ethnicity: 'hispanic',
  race: ['white', 'indian'],
  heightFeet: '5',
  heightInches: '7',
  weight: '172',
  eyes: 'BRO',
  hair: 'BLK',
  'n400.denialReason': 'Failure to establish good moral character because of unpaid federal taxes for 2021 and 2022.',
  'hearing.reasons': 'I filed both returns late but I signed an installment agreement with the IRS in March 2025 and paid the full balance in August 2026. The officer did not see the payment because it posted after my interview. I attach the IRS account transcripts showing a zero balance.',
  brief: 'attached',
  'brief.list': 'IRS account transcripts for 2021 and 2022\nInstallment agreement letter',
  readsEnglish: 'B',
  fluentLanguage: 'Spanish',
  preparer: 'no',
  phone: '213 555 0123',
  mobile: '213 555 0199',
  email: 'jorge.ramirez@example.com',
};

const long = (n: number) => [...Array(n)].map((_, i) => `Paragraph ${i + 1}. ${'The officer did not consider the evidence I brought to the interview. '.repeat(4)}`).join('\n');

describe('N-336 PDF', () => {
  it('builds the Part 4 statement', () => {
    const s = reasonsStatement(jorge);
    expect(s).toContain('Reason USCIS gave for denying my Form N-400: Failure');
    expect(s).toContain('Why I believe the decision is wrong: I filed');
    expect(s).toContain('in support of this request: IRS account transcripts for 2021 and 2022; Installment agreement letter.');
    expect(reasonsStatement({ ...jorge, brief: 'hearing' })).toContain('at the time of my hearing');
    expect(reasonsStatement({ ...jorge, brief: 'none' })).not.toContain('brief');
  });

  it('plans only fields that exist, with the right kind', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    const variants: Answers[] = [
      jorge,
      {
        ...jorge,
        hasOtherNames2: 'yes',
        'otherName2.family': 'Ortega',
        'otherName2.given': 'Jorge',
        mailingSame: 'no',
        'mailing.careOf': 'Ana Ramirez',
        'mailing.street': 'PO Box 120',
        'mailing.unit': 'Ste 5',
        'mailing.city': 'Pasadena',
        'mailing.county': 'Los Angeles',
        'mailing.state': 'CA',
        'mailing.zip': '91101',
        'home.unit': 'Flr 2',
        eveningPhone: '323 555 0100',
        'n400.military': 'yes',
        ethnicity: 'notHispanic',
        race: ['indian', 'asian', 'black', 'pacific', 'white'],
        readsEnglish: 'A',
        preparer: 'yes',
        'preparer.name': 'Ana Ruiz',
      },
      ...['BRO', 'BLK', 'HAZ', 'GRN', 'BLU', 'GRY', 'MAR', 'PNK', 'XXX'].map((eyes) => ({ ...jorge, eyes })),
      ...['BLK', 'BRO', 'BLN', 'GRY', 'WHI', 'RED', 'SDY', 'BAL', 'XXX'].map((hair) => ({ ...jorge, hair })),
      ...['2', '8'].map((heightFeet) => ({ ...jorge, heightFeet, heightInches: '11' })),
      { ...jorge, heightInches: '0', 'home.state': 'TX', mailingSame: 'no', 'mailing.state': 'NY', 'mailing.street': '1 Main St' },
    ];
    for (const plan of variants.map(planN336)) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) expect(index.get(name), name).toBeInstanceOf(PDFCheckBox);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
      for (const [name, value] of Object.entries(plan.select)) {
        const dd = index.get(name);
        expect(dd, name).toBeInstanceOf(PDFDropdown);
        expect((dd as PDFDropdown).getOptions().map((o) => o.trim()), `${name}=${value}`).toContain(value);
      }
    }
    for (const f of PART8) for (const n of Object.values(f)) expect(index.get(n), n).toBeInstanceOf(PDFTextField);
    expect(planN336(variants[1]).checkValue).toContainEqual(['Pt1Line6_Unit', 'STE']);
    expect(planN336(variants[1]).text['Pt1Line6_InCareofName[0]']).toBe('Ana Ramirez');
    expect(planN336(jorge).text['Pt1Line6_StreetNumberName[0]']).toBe('4521 E Olympic Blvd');
    expect(planN336(variants[1]).check).toContain('Line5_Race4[0]');
  });

  it('writes the answers into the official form', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillN336(template, jorge))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    const checked = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    expect(text('Pt1Line1_FamilyName[0]')).toBe('Ramirez');
    expect(text('Pt1Line1_FamilyName[1]')).toBe('Ramirez');
    expect(text('AlienNumber[0]')).toBe('098765432');
    expect(text('AlienNumber[6]')).toBe('098765432');
    expect(text('Pt1Line2_FamilyName[0]')).toBe('Ramirez Ortega');
    expect(text('Pt2Pt2Line8_USCISOnlineAcctNumber[0]')).toBe('123456789012');
    expect(text('USCISOnlineAcctNumber[0]')).toBe('');
    expect(text('Pt1Line5_AptSteFlrNumber[0]')).toBe('12');
    expect(checked('Pt1Line5_Unit[2]')).toBe(true);
    expect((f.get('Pt1Line5_State[0]') as PDFDropdown).getSelected()[0].trim()).toBe('CA');
    expect(text('P4_Line1_Telephone[0]')).toBe('3235550144');
    // Part 2: the receipt and office boxes are named "ExplainEligibility", the date "DateOfBirth".
    expect(text('Pt2Line1_ExplainEligibility[0]')).toBe('IOE0912345678');
    expect(text('Line6_DateOfBirth[1]')).toBe('09/15/2026');
    expect(text('Pt2Line1_ExplainEligibility[1]')).toBe('Los Angeles Field Office');
    expect(checked('Pt2Line4_No[0]')).toBe(true);
    expect(checked('Pt2Line4_Yes[0]')).toBe(false);
    expect(checked('P3Line22[0]')).toBe(true);
    expect(checked('Line5_Race1[0]')).toBe(true);
    expect(checked('Line5_Race5[0]')).toBe(true);
    expect(checked('Line5_Race2[0]')).toBe(false);
    expect(text('P3_Line19_Pounds1[0]')).toBe('1');
    expect(checked('Pt3Line5_EyeColor[1]')).toBe(true);
    expect(checked('Pt3Line6_HairColor[1]')).toBe(true);
    // Part 4's reasons box is named "Email".
    expect(text('Pt3Line6_Email[0]')).toContain('installment agreement');
    expect(text('Pt7Line3d_AdditionalInfo[0]')).toBe('');
    expect(checked('Pt10Line1b_Checkbox[0]')).toBe(true);
    expect(text('Pt10Line1b_language[0]')).toBe('Spanish');
    expect(text('Pt5Line5_Email[0]')).toBe('jorge.ramirez@example.com');
    expect(text('P5Line6_SignatureApplicant[0]')).toBe('');
  });

  it('continues a long statement in Part 8', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillN336(template, { ...jorge, 'hearing.reasons': long(22) }))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    expect(text('Pt3Line6_Email[0]')).toContain('(Continued in Part 8. Additional Information.)');
    expect(text('Pt7Line3a_PageNumber[0]')).toBe('3');
    expect(text('Pt7Line3b_PartNumber[0]')).toBe('4');
    expect(text('Pt7Line3d_AdditionalInfo[0]')).toContain('Paragraph');
    const joined = [text('Pt3Line6_Email[0]'), ...PART8.map((p) => text(p.info))].join('\n');
    expect(joined).toContain('Paragraph 22.');
    expect(joined).toContain('Installment agreement letter.');
  });
});
