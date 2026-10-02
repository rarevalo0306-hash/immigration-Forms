import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { REASONS } from '../forms/i131a';
import { fieldIndex, optionBoxes } from './common';
import { fillI131A, planI131A } from './i131aPdf';

const template = readFileSync(new URL('../../public/forms/i-131a.pdf', import.meta.url));

/** Guadalupe, a permanent resident whose green card was stolen while visiting family in Guadalajara. */
export const guadalupe: Answers = {
  'name.family': 'Martínez',
  'name.given': 'Guadalupe',
  'name.middle': 'Inés',
  nameChanged: 'no',
  'mailing.careOf': 'Ana Martinez',
  'mailing.street': 'Av. Juarez 245',
  'mailing.unit': 'Depto 3',
  'mailing.city': 'Guadalajara',
  'mailing.province': 'Jalisco',
  'mailing.postal': '44100',
  'mailing.country': 'Mexico',
  mailingSame: 'no',
  'home.street': '2210 W Cermak Rd',
  'home.unit': 'Fl 2',
  'home.city': 'Chicago',
  'home.state': 'IL',
  'home.zip': '60608',
  aNumber: 'A098765432',
  ssn: '321-54-9876',
  dob: '06/21/1979',
  sex: 'female',
  birthCountry: 'Mexico',
  citizenship: 'Mexico',
  reason: 'PR lost',
  departed: '07/15/2026',
  returnDate: '11/20/2026',
  cardExpires: '03/02/2031',
  proceedings: 'no',
  abandoned: 'no',
  carrierBefore: 'no',
  readsEnglish: 'B',
  fluentLanguage: 'Spanish',
  preparer: 'no',
  phone: '+52 33 1234 5678',
  mobile: '(312) 555-0147',
  email: 'lupe.martinez@example.com',
};

/** A parolee whose EAD was lost, with every follow-up answered Yes. */
const parolee: Answers = {
  ...guadalupe,
  reason: 'EAD Lost',
  travelDocExpires: '09/30/2027',
  'i131.receipt': 'IOE-0912345678',
  proceedings: 'yes',
  'proceedings.details': 'Placed in removal proceedings in Chicago in 2012; case administratively closed in 2015.',
  revoked: 'yes',
  'revoked.date': '01/10/2020',
  'revoked.reason': 'Issued in error',
  'revoked.details': 'The I-512 issued in 2019 was revoked and a new one was approved in 2020.',
  mailingSame: 'yes',
  readsEnglish: 'A',
  preparer: 'yes',
  'preparer.name': 'Carlos Rivera',
  phone: '312 555 0100',
};

describe('I-131A PDF', () => {
  it('plans only fields that exist, with the right kind', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    const variants: Answers[] = [
      guadalupe,
      parolee,
      ...REASONS.map((r) => ({ ...guadalupe, reason: r.value })),
      { ...guadalupe, sex: 'male', nameChanged: 'yes', 'mailing.unit': 'Ste 5', 'home.unit': 'Apt 9', mailingSame: 'yes' },
      { ...guadalupe, 'mailing.unit': 'Floor 3', 'home.unit': 'Suite 1', 'mailing.state': 'tx', 'mailing.zip': '78501' },
      { ...guadalupe, abandoned: 'yes', 'abandoned.details': 'Signed I-407 at O Hare in 2019 under pressure.', carrierBefore: 'yes', 'carrier.date': '05/01/2021', 'carrier.disposition': 'Used for travel', 'carrier.details': 'Card lost in 2021.' },
      { ...guadalupe, reason: 'Other', 'reason.other': 'My card was taken by the police at a checkpoint and never returned to me.', otherIsLpr: 'yes', reentryExpires: '02/01/2027' },
      { ...parolee, reason: 'Other', 'reason.other': 'Short', otherIsLpr: 'no', revoked: 'no', proceedings: 'no' },
    ];
    for (const plan of variants.map(planI131A)) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) expect(index.get(name), name).toBeInstanceOf(PDFCheckBox);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
      for (const name of Object.keys(plan.select)) expect(index.get(name), name).toBeInstanceOf(PDFDropdown);
      expect(plan.notes.length).toBeLessThanOrEqual(5);
    }
    const g = planI131A(guadalupe);
    expect(g.text['P4_Line3_DaytimeTelephoneNumber[0]']).toBe('See Pt. 7');
    expect(g.text['P4_Line4_MobileTelephoneNumber[0]']).toBe('3125550147');
    expect(g.notes).toEqual([{ page: '3', part: '4', item: '3', text: 'Item 3, daytime telephone: +52 33 1234 5678' }]);
    expect(g.checkValue).toContainEqual(['Pt1_Line3c_Unit', 'APT']);
    expect(g.checkValue).toContainEqual(['Pt1_Line5b_Unit', 'FLR']);
    // Items 5, 6 and 10 are only for I-512/I-766 holders.
    expect(g.text['P3_Line2_DateExpirationI512I512LI766[0]']).toBeUndefined();
    const p = planI131A(parolee);
    expect(p.text['P3_Line3_ExpirationofPermanentCard[0]']).toBeUndefined();
    expect(p.text['P2_Line6_I131ReceiptNumber[0]']).toBe('IOE0912345678');
    expect(p.checkValue).toContainEqual(['P4_Line1_Checkbox', 'C']);
    expect(p.notes.map((n) => n.item)).toEqual(['7', '10.a']);
    const other = planI131A(variants[14]);
    expect(other.text['P2_Line1i_Other[0]']).toBe('See Part 7. Additional Information.');
    expect(other.notes[0].item).toBe('1.i');
    expect(planI131A(variants[15]).text['P2_Line1i_Other[0]']).toBe('Short');
    // Every note an LPR can need fits in Part 7's five boxes.
    const many = planI131A({ ...variants[14], proceedings: 'yes', 'proceedings.details': 'x', abandoned: 'yes', 'abandoned.details': 'y', carrierBefore: 'yes', 'carrier.details': 'z', mobile: '+57 300 123 4567' });
    expect(many.notes).toHaveLength(5);
  });

  it('writes the answers into the official form', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI131A(template, parolee))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    const checked = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    expect(text('Pt1_Line1a_FamilyName[0]')).toBe('Martinez');
    expect(text('Pt1_Line1a_FamilyName[1]')).toBe('Martinez');
    expect(text('Pt1_Line6_AlienNumber[1]')).toBe('098765432');
    expect(text('Pt1_Line3g_Province[0]')).toBe('Jalisco');
    expect(text('Pt1_Line3c_AptSteFlrNumber[0]')).toBe('3');
    expect(checked('Pt1_Line3c_Unit[1]')).toBe(true); // APT
    expect(checked('Pt1_Line4_Checkboxes[1]')).toBe(true); // Yes
    expect(checked('Pt1_Line10_Checkboxes[0]')).toBe(true); // Female
    expect(checked('P2_Line1_checkbox[6]')).toBe(true); // 1.g EAD lost
    expect(checked('P2_Line1_checkbox[0]')).toBe(false);
    // Item 5 and Item 6 carry other items' names.
    expect(text('P3_Line2_DateExpirationI512I512LI766[0]')).toBe('09/30/2027');
    expect(text('P3_Line2_DateIntendedTravel[0]')).toBe('11/20/2026');
    expect(text('P2_Line6_I131ReceiptNumber[0]')).toBe('IOE0912345678');
    expect(checked('P3_Line7_Checkboxes[1]')).toBe(true);
    expect(checked('P3_Line10_Checkboxes[1]')).toBe(true);
    expect(text('P3_Line10b_ReasonRevocation[0]')).toBe('Issued in error');
    expect(checked('P4_Line1_Checkbox[2]')).toBe(true); // 1.a
    expect(checked('P4_Line1_Checkbox[0]')).toBe(true); // Item 2
    expect(text('P4_Line2_Consented[0]')).toBe('Carlos Rivera');
    expect(text('P4_Line3_DaytimeTelephoneNumber[0]')).toBe('3125550100');
    expect(text('Pt7_Line3c_ItemNumber[0]')).toBe('7');
    expect(text('Pt7_Line3d_AdditionalInfo[0]')).toContain('removal proceedings');
    expect(text('Pt7_Line4c_ItemNumber[0]')).toBe('10.a');
    expect(text('P4_Line6a_SignatureofApplicant[0]')).toBe('');
  });
});
