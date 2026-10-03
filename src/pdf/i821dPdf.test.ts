import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { SAFETY_ITEMS } from '../forms/i821d';
import { fieldIndex, optionBoxes } from './common';
import { fillI821D, planI821D } from './i821dPdf';

const template = readFileSync(new URL('../../public/forms/i-821d.pdf', import.meta.url));

/** Jessica, renewing the DACA she has had since 2013. */
export const renewal: Answers = {
  requestType: 'renewal',
  'renewal.expires': '03/15/2027',
  detention: 'AMNOT',
  'name.family': 'Hernández',
  'name.given': 'Jessica',
  'mailing.street': '742 Oak Ave',
  'mailing.unit': 'Apt 3',
  'mailing.city': 'Phoenix',
  'mailing.state': 'AZ',
  'mailing.zip': '85004',
  removal: 'no',
  aNumber: 'A201234567',
  ssn: '123-45-6789',
  dob: '08/20/1995',
  sex: 'female',
  birthCity: 'Hermosillo',
  birthCountry: 'Mexico',
  residence: 'United States',
  citizenship: 'Mexico',
  marital: 'S',
  'otherName.has': 'no',
  ethnicity: 'hispanic',
  race: ['WH'] as unknown as string,
  heightFeet: '5',
  heightInches: '2',
  weight: '120',
  eyes: 'GR',
  hair: 'BL',
  continuous: 'yes',
  presentSame: 'yes',
  'present.from': '06/01/2022',
  'address.more0': 'yes',
  'address1.from': '01/01/2019',
  'address1.to': '05/31/2022',
  'address1.street': '15 Pine St',
  'address1.city': 'Tempe',
  'address1.state': 'AZ',
  'address1.zip': '85281',
  'address.more1': 'no',
  'trip.more0': 'no',
  leftWithoutAP: 'no',
  'passport.country': 'Mexico',
  'passport.number': 'G12345678',
  'passport.expires': '05/01/2030',
  ...Object.fromEntries(SAFETY_ITEMS.map((i) => [i.id, 'no'])),
  readsEnglish: 'A',
  phone: '602 555 0142',
  email: 'jessica@example.com',
};

describe('I-821D PDF', () => {
  it('plans only fields that exist, with the right kind', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    const initial: Answers = {
      ...renewal,
      requestType: 'initial',
      initialNotice: 'yes',
      detention: 'AM',
      'mailing.careOf': 'X',
      removal: 'yes',
      'removal.status': 'Other',
      'removal.date': '01/01/2020',
      'removal.location': 'Phoenix, AZ',
      'removal.explain': 'x',
      'otherName.has': 'yes',
      'otherName.family': 'H',
      ethnicity: 'notHispanic',
      race: ['WH', 'AS', 'BL', 'AI', 'HW'] as unknown as string,
      presentSame: 'no',
      'present.street': '1 A',
      'present.unit': 'Ste 2',
      'present.city': 'Mesa',
      'present.state': 'AZ',
      'present.zip': '85201',
      ...Object.fromEntries([1, 2, 3].flatMap((i) => [[`address${i}.street`, `${i} B`], [`address${i}.unit`, 'Flr 1'], [`address${i}.state`, 'TX'], [`address${i}.zip`, '75001'], [`address.more${i}`, 'yes']])),
      'trip.more0': 'yes',
      'trip1.departure': '01/01/2015',
      'trip1.return': '01/20/2015',
      'trip1.reason': 'Funeral',
      'trip.more1': 'yes',
      'trip2.departure': '01/01/2016',
      'trip2.return': '01/10/2016',
      'trip2.reason': 'Visit',
      leftWithoutAP: 'yes',
      borderCard: 'X1',
      before16: 'yes',
      'entry.date': '05/01/2003',
      'entry.place': 'Nogales, AZ',
      status2012: 'No Lawful Status',
      i94Has: 'yes',
      'i94.number': '12345678901',
      'i94.until': '06/01/2003',
      'edu.how': 'Graduated from high school',
      'edu.school': 'Central HS, Phoenix, AZ',
      'edu.date': '05/30/2013',
      military: 'yes',
      'mil.branch': 'Army',
      'mil.start': '01/01/2014',
      'mil.end': '01/01/2018',
      'mil.discharge': 'Honorable',
      ...Object.fromEntries(SAFETY_ITEMS.map((i) => [i.id, 'yes'])),
      'p4.explain': 'x',
      readsEnglish: 'B',
      fluentLanguage: 'Spanish',
      mobile: '6025550000',
    };
    const variants: Answers[] = [
      renewal,
      initial,
      { ...initial, i94Has: 'no', military: 'no', status2012: 'Status Expired' },
      ...['Active', 'Closed', 'Terminated', 'FinalOrder'].map((s) => ({ ...renewal, removal: 'yes', 'removal.status': s })),
      ...['S', 'M', 'D', 'W'].map((marital) => ({ ...renewal, marital, sex: 'male' })),
      ...['BN', 'BL', 'HA', 'GN', 'BU', 'GR', 'MA', 'PN', 'UN'].map((eyes) => ({ ...renewal, eyes })),
      ...['BL', 'BR', 'BN', 'GR', 'WH', 'RD', 'SA', 'NH', 'OT'].map((hair) => ({ ...renewal, hair })),
      ...['Marine Corps', 'Navy', 'Air Force', 'National Guard', 'Coast Guard'].map((b) => ({ ...initial, 'mil.branch': b, 'mil.discharge': 'Not Applicable' })),
    ];
    for (const plan of variants.map(planI821D)) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) expect(index.get(name), name).toBeInstanceOf(PDFCheckBox);
      for (const name of Object.keys(plan.select)) expect(index.get(name), name).toBeInstanceOf(PDFDropdown);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
    }
  });

  it('writes the answers into the official form', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillI821D(template, renewal))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText();
    const checked = (n: string) => (f.get(n) as PDFCheckBox).isChecked();
    expect(checked('Part1_CB[1]')).toBe(true); // not in detention
    expect(checked('P1_Line2_Checkbox[0]')).toBe(true); // renewal
    expect(text('P1_Line2_Date[0]')).toBe('03/15/2027');
    expect(text('P1_Line3a_Name[1]')).toBe('Hernandez');
    expect(checked('P1_Line4c_Unit[2]')).toBe(true); // APT
    expect(checked('P1_Line5_Checkbox[1]')).toBe(true); // No
    expect(text('P1_Line7_ANumber[1]')).toBe('201234567');
    expect(checked('P1_Line14_MaritalStatus[0]')).toBe(true); // Single
    expect(checked('P1_Line20_Checkbox[1]')).toBe(true); // Gray
    expect([0, 1, 2].map((i) => text(`P1_Line19_Weight[${i}]`)).join('')).toBe('120');
    expect(checked('P2_Line1_checkbox[0]')).toBe(true); // Yes
    expect(text('P2_Line2b_Street[0]')).toBe('742 Oak Ave');
    expect(text('P2_Line2a_Date_From[0]')).toBe('06/01/2022');
    expect(text('Pt2_Line3f_ZipCode[0]')).toBe('85281');
    expect(text('P2_Line3a_Date_To[0]')).toBe('05/31/2022');
    expect(checked('P2_Line8_Checkbox[1]')).toBe(true); // No
    expect(text('P2_Line9b_Passport[0]')).toBe('G12345678');
    expect(checked('P4_Line1_Checkbox[1]')).toBe(true); // No
    expect(checked('P4_Line7_Checkbox[0]')).toBe(true); // No
    expect(checked('P5_Line1a_1b_Checkbox[1]')).toBe(true); // 1.a
    expect(text('P5_Line3_DayPhone[0]')).toBe('6025550142');
  });

  it('fills Part 3 and the Part 8 explanations on an initial request', () => {
    const { text, select } = planI821D({ ...renewal, requestType: 'initial', 'entry.place': 'Nogales, AZ', status2012: 'No Lawful Status', 'p4.1': 'yes', 'p4.explain': 'Arrested 2015 in Mesa, AZ; charges dismissed.' });
    expect(text['P3_Line3_Place[0]']).toBe('Nogales, AZ');
    expect(select['P3_Line4_ImmStatus[0]']).toBe('No Lawful Status');
    expect(text['P8_Line3b_Part[0]']).toBe('4');
    expect(text['P8_Line3d_Narrative[0]']).toBe('Arrested 2015 in Mesa, AZ; charges dismissed.');
    expect(planI821D(renewal).text['P3_Line3_Place[0]']).toBeUndefined();
  });
});
