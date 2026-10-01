import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { AP_BASES, REFUGEE_ITEMS } from '../forms/i131';
import { boxesOf, fieldsBySegment, fillI131, planI131 } from './i131Pdf';

const template = readFileSync(new URL('../../public/forms/i-131.pdf', import.meta.url));

/** Carla from the I-485 example, asking for advance parole to visit her mother. */
export const traveler: Answers = {
  appType: '5',
  apBasis: '5',
  'ap.i485Receipt': 'IOE0912345678',
  refugeeStatus: 'no',
  'name.family': 'Ruiz Vega',
  'name.given': 'Carla',
  'otherName.more0': 'yes',
  'otherName1.family': 'Vega',
  'otherName1.given': 'Carla',
  'otherName.more1': 'no',
  'mailing.street': '1234 Main St',
  'mailing.unit': 'Apt 4B',
  'mailing.city': 'Los Angeles',
  'mailing.state': 'CA',
  'mailing.zip': '90011',
  'mailing.country': 'United States',
  mailingSame: 'yes',
  aNumber: 'A123456789',
  birthCountry: 'Mexico',
  citizenship: 'Mexico',
  sex: 'female',
  dob: '05/05/1990',
  coa: 'b2',
  i94: '12345678901',
  'i94.until': '11/04/2019',
  ethnicity: 'hispanic',
  race: ['WH', 'AI'] as unknown as string,
  heightFeet: '5',
  heightInches: '4',
  weight: '135',
  eyes: 'BN',
  hair: 'BL',
  proceedings: 'no',
  prevReentry: 'no',
  prevAP: 'no',
  replacement: 'no',
  'trip.departure': '12/15/2026',
  'trip.purpose': 'Visit my mother, who is ill, in Monterrey.',
  'trip.countries': 'Mexico',
  'trip.days': '14',
  'trip.trips': 'O',
  phone: '213 555 0177',
  email: 'carla@example.com',
};

const allYes = Object.fromEntries(REFUGEE_ITEMS.map((i) => [i.id, 'yes']));

describe('I-131 PDF', () => {
  it('plans only fields that exist, with the right kind', async () => {
    const index = fieldsBySegment((await PDFDocument.load(template)).getForm().getFields());
    const variants: Answers[] = [
      traveler,
      ...AP_BASES.map((b) => ({ ...traveler, apBasis: b.value, 'ap.receipt': 'IOE0123456789', 'ap.coa': 'PAR', 'ap.explain': 'x' })),
      { ...traveler, appType: '1', deliverTo: 'B', 'pickup.city': 'Lima', 'pickup.country': 'Peru', notice: 'B', 'noticeAddress.street': '1 A St', 'noticeAddress.unit': 'Ste 3', 'noticeAddress.city': 'Miami', 'noticeAddress.state': 'FL', 'noticeAddress.phone': '3055550000', 'noticeAddress.email': 'a@b.co', timeOutside: 'morethan', mailingSame: 'no', 'home.street': '9 Elm', 'home.unit': 'Flr 2', 'home.state': 'TX', sex: 'male', prevReentry: 'yes', 'prevReentry.date': '01/01/2020', 'prevReentry.disposition': 'lost', prevAP: 'yes', 'prevAP.date': '01/01/2021', 'prevAP.disposition': 'x', replacement: 'yes', replacementReason: '4', corrections: ['Name', 'ANumber', 'CountryofBirthCitizenship', 'Terms', 'DOB', 'Gender', 'Validity', 'Photo'] as unknown as string, 'replacement.receipt': 'IOE1', 'replacement.explain': 'x', ethnicity: 'notHispanic', race: ['WH', 'AS', 'BL', 'AI', 'HW'] as unknown as string },
      ...['Lessthan6', '6months', '1to2', '2to3', '3to4'].map((timeOutside) => ({ ...traveler, appType: '1', timeOutside, deliverTo: 'A' })),
      { ...traveler, appType: '2', 'rtd.country': 'Venezuela', ...allYes, 'rtd.explain': 'x', 'rtd.beforeDeparture': 'no', 'rtd.outside': 'yes', 'rtd.location': 'Bogota, Colombia', deliverTo: 'B', notice: 'A' },
      { ...traveler, appType: '3', ...Object.fromEntries(REFUGEE_ITEMS.map((i) => [i.id, 'no'])), 'rtd.beforeDeparture': 'yes', 'trip.trips': 'M' },
      { ...traveler, appType: '4', 'tps.receipt': 'IOE0123456789', refugeeStatus: 'yes' },
      ...Object.keys({ BN: 1, BL: 1, HA: 1, GN: 1, BU: 1, GR: 1, MA: 1, PN: 1, UN: 1 }).map((eyes) => ({ ...traveler, eyes })),
      ...['BL', 'BR', 'BN', 'GR', 'WH', 'RD', 'SA', 'NH', 'OT'].map((hair) => ({ ...traveler, hair })),
    ];
    for (const plan of variants.map(planI131)) {
      for (const name of Object.keys(plan.text)) for (const f of index.get(name) ?? [undefined]) expect(f, name).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) for (const f of index.get(name) ?? [undefined]) expect(f, name).toBeInstanceOf(PDFCheckBox);
      for (const name of Object.keys(plan.select)) for (const f of index.get(name) ?? [undefined]) expect(f, name).toBeInstanceOf(PDFDropdown);
      for (const [base, value] of plan.checkValue) expect(boxesOf(index, base).filter((o) => o.value === value).length, `${base}=${value}`).toBe(1);
    }
  });

  it('writes the answers into the official form', async () => {
    const doc = await PDFDocument.load(await fillI131(template, traveler));
    const f = fieldsBySegment(doc.getForm().getFields());
    const texts = (n: string) => f.get(n)!.map((x) => (x as PDFTextField).getText());
    const text = (n: string) => texts(n)[0];
    const checked = (n: string) => (f.get(n)![0] as PDFCheckBox).isChecked();
    const appTypes = boxesOf(f, 'CB_AppType').filter((o) => o.box.isChecked()).map((o) => o.value);
    expect(appTypes).toEqual(['5']);
    expect(text('P1_Line5A[0]')).toBe('IOE0912345678');
    expect(checked('P1_Line13_YesNo[1]')).toBe(true);
    expect(texts('Part2_Line1_FamilyName[0]')).toEqual(['Ruiz Vega', 'Ruiz Vega']);
    expect(texts('Part2_Line5_AlienNumber[0]')).toEqual(['123456789', '123456789']);
    expect(text('Part2_Line2_FamilyName1[0]')).toBe('Vega');
    expect(checked('Part2_Line3_Unit[1]')).toBe(true); // APT
    expect(checked('Part2_Line8_Gender[0]')).toBe(true); // F
    expect(text('Part2_Line12_ClassofAdmission[0]')).toBe('B2');
    expect(checked('P3_Line1_Ethnicity[1]')).toBe(true);
    expect(checked('P3_Line2_Race_White[0]')).toBe(true);
    expect(checked('P3_Line2_Race_American[0]')).toBe(true);
    expect((f.get('P3_Line3_HeightFeet[0]')![0] as PDFDropdown).getSelected()).toEqual(['5']);
    expect([1, 2, 3].map((i) => text(`P3_Line4_Pound${i}[0]`)).join('')).toBe('135');
    expect(checked('P3_Line5_EyeColor[0]')).toBe(true); // BRN
    expect(checked('P3_Line6_HairColor[8]')).toBe(true); // BLK
    expect(checked('P4_Line1_YesNo[1]')).toBe(true);
    expect(text('P7_Line2_Purpose[0]')).toBe('Visit my mother, who is ill, in Monterrey.');
    expect(checked('P7_Line4_CB[0]')).toBe(true);
    expect(text('P7_Line5_ExpectedLengthTrip[0]')).toBe('14');
    expect(text('Part10_Line1_DayPhone[0]')).toBe('2135550177');
  });

  it('writes refugee explanations into Part 13', () => {
    const { text } = planI131({ ...traveler, appType: '2', 'rtd.3b': 'yes', 'rtd.explain': 'I renewed my passport to visit my father.' });
    expect(text['Part13_Line3_PartNumber[0]']).toBe('6');
    expect(text['Part13_Line3_AdditionalInfo[0]']).toBe('I renewed my passport to visit my father.');
    expect(text['P7_Line2_Purpose[0]']).toBeUndefined();
  });
});
