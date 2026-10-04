import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { AP_BASES, PAROLE_BASES, PIP_BASES, REFUGEE_ITEMS, REPAROLE_BASES } from '../forms/i131';
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

/** A U.S. citizen asking humanitarian parole for her brother in Honduras. */
export const requestor: Answers = {
  ...traveler,
  appType: 'parole',
  paroleBasis: '23',
  'parole.forOther': 'yes',
  'ben.family': 'Ruiz Vega',
  'ben.given': 'Mario',
  'benOther.more0': 'yes',
  'benOther1.family': 'Ruiz',
  'benOther1.given': 'Mario',
  'benOther.more1': 'no',
  'ben.dob': '02/03/1985',
  'ben.birthCountry': 'Honduras',
  'ben.citizenship': 'Honduras',
  'ben.phone': '+504 9999-1234',
  'ben.email': 'mario@example.com',
  'ben.aNumber': 'A0987654',
  'benMailing.street': 'Colonia Kennedy 12',
  'benMailing.unit': 'Ste 7',
  'benMailing.city': 'Tegucigalpa',
  'benMailing.province': 'Francisco Morazan',
  'benMailing.postal': '11101',
  'benMailing.country': 'Honduras',
  benMailingSame: 'no',
  'benHome.street': 'Barrio Abajo 3',
  'benHome.unit': 'Flr 2',
  'benHome.city': 'Tegucigalpa',
  'benHome.country': 'Honduras',
  'parole.explain': 'My brother needs surgery that is not available in Honduras; a U.S. hospital accepted him.',
  'parole.stay': '6 months',
  'parole.arrival': '01/15/2027',
  'parole.postCity': 'Tegucigalpa',
  'parole.postCountry': 'Honduras',
  readsEnglish: 'B',
  'interp.family': 'Gómez',
  'interp.given': 'Rosa',
  'interp.business': 'Ayuda Legal LA',
  'interp.phone': '(213) 555-0100',
  'interp.mobile': '1 213 555 0101',
  'interp.email': 'rosa@example.org',
  'interp.language': 'Spanish',
  preparer: 'yes',
  'prep.same': 'no',
  'prep.family': 'Lee',
  'prep.given': 'Ana',
  'prep.business': 'Clinica Comunitaria',
  'prep.phone': '213 555 0200',
  'prep.mobile': '213 555 0201',
  'prep.email': 'ana@example.org',
  'prep.statement': 'notAttorney',
};

/** Every parole box with its extra detail filled and every role, so all export values get planned. */
const paroleVariants: Answers[] = [
  ...PAROLE_BASES.flatMap((b) => ['1', '2', '3'].map((role) => ({ ...requestor, paroleBasis: b.value, 'immvi.role': role, 'parole.i130Receipt': 'IOE0123456789', 'referral.agency': 'Department of State', 'referral.email': 'x@state.gov', 'frtf.number': 'FRTF1234567', 'parole.program': 'XTUV' }))),
  ...PIP_BASES.flatMap((b) => ['1', '2'].map((role) => ({ ...requestor, appType: 'pip', pipBasis: b.value, 'mpip.role': role, 'frtf.number': 'FRTF1', 'parole.program': 'QRS', 'ben.coa': 'ewi', 'ben.i94': '12345678901' }))),
  ...REPAROLE_BASES.flatMap((b) => ['1', '2', '3'].map((role) => ({ ...requestor, appType: 'reparole', reparoleBasis: b.value, 'immvi.role': role, 'mpip.role': role, 'parole.program': 'UHP', 'reparole.until': '03/01/2027', 'reparole.ead': 'yes', 'ben.coa': 'par', 'ben.i94': '12345678901' }))),
  { ...requestor, appType: 'reparole', reparoleBasis: '30', 'parole.forOther': 'no', 'reparole.until': '03/01/2027', 'reparole.coa': 'uhp', 'reparole.i94': '1234567890A', uspid: 'USP123', 'reparole.ead': 'no' },
  { ...requestor, appType: 'pip', pipBasis: '24', 'mpip.role': '1', 'parole.forOther': 'yes', coa: '', i94: '12345678901', 'i94.until': '01/01/2020' },
  { ...requestor, 'parole.explain': 'x '.repeat(400) },
];

/** The interpreter's and preparer's parts: each statement, the same person, and the unit boxes. */
const helperVariants: Answers[] = [
  ...['notAttorney', 'attorneyExtends', 'attorneyNotExtends'].map((st) => ({ ...traveler, readsEnglish: 'B', preparer: 'yes', 'prep.same': 'yes', 'prep.statement': st, 'interp.family': 'Gómez', 'interp.given': 'Rosa', 'interp.business': 'X', 'interp.phone': '2135550100', 'interp.mobile': '2135550101', 'interp.email': 'r@x.org', 'interp.language': 'Spanish' })),
  { ...requestor, readsEnglish: 'A' },
  { ...requestor, preparer: 'no' },
];

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
      ...paroleVariants,
      ...helperVariants,
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

  it('plans every parole box by its export value and role box by its printed number', () => {
    const boxes = (a: Answers) => planI131(a).checkValue.filter(([b]) => b === 'CB_AppType').map(([, v]) => v);
    for (const b of [...PAROLE_BASES, ...REPAROLE_BASES]) expect(boxes({ ...requestor, appType: PAROLE_BASES.includes(b) ? 'parole' : 'reparole', paroleBasis: b.value, reparoleBasis: b.value }), b.item).toEqual([b.value]);
    for (const b of PIP_BASES) expect(boxes({ ...requestor, appType: 'pip', pipBasis: b.value }), b.item).toEqual([b.value]);
    expect(planI131({ ...requestor, paroleBasis: '19', 'immvi.role': '3' }).check).toContain('P1_Line6B_3[0]');
    expect(planI131({ ...requestor, appType: 'pip', pipBasis: '24', 'mpip.role': '2' }).check).toContain('P1_Line8A_2[0]');
    expect(planI131({ ...requestor, appType: 'reparole', reparoleBasis: '32', 'immvi.role': '2' }).check).toContain('P1_Line10E_2[0]');
    expect(planI131({ ...requestor, appType: 'reparole', reparoleBasis: '35', 'mpip.role': '1' }).check).toContain('P1_Line10H_1[0]');
    // A parole request skips the replacement questions (Part 4, Items 4-6).
    expect(planI131({ ...requestor, replacement: 'yes', replacementReason: '2' }).checkValue.some(([b]) => /^P4_Line[45]/.test(b))).toBe(false);
  });

  it('writes a requestor’s parole request for someone abroad, with the interpreter and preparer', async () => {
    const doc = await PDFDocument.load(await fillI131(template, requestor));
    const f = fieldsBySegment(doc.getForm().getFields());
    const text = (n: string) => (f.get(n)![0] as PDFTextField).getText();
    const checked = (n: string) => (f.get(n)![0] as PDFCheckBox).isChecked();
    expect(boxesOf(f, 'CB_AppType').filter((o) => o.box.isChecked()).map((o) => o.value)).toEqual(['23']);
    expect(text('P2_Line16_GivenName[0]')).toBe('Mario');
    expect(text('Part2_Line17_FamilyName1[0]')).toBe('Ruiz');
    expect(text('P2_Line21_DaytimeTelephoneNumber[0]')).toBe('+50499991234');
    expect(text('P2_Line23_AlienNumber[0]')).toBe('000987654');
    expect(checked('P2_Line24_Unit[0]')).toBe(true); // STE
    expect(text('P2_Line24_Province[0]')).toBe('Francisco Morazan');
    expect(checked('P2_Line25_Unit[2]')).toBe(true); // FLR
    expect(text('P8_Line1_Explain[0]')).toContain('surgery');
    expect(text('P8_Line2_ExpectedLengthTripinUS[0]')).toBe('6 months');
    expect(text('P8_Line3b_CityOrTown[0]')).toBe('Tegucigalpa');
    expect(text('Part2_Line12_ClassofAdmission[0]')).toBeUndefined();
    expect(text('Part11_Line1_InterpreterFamilyName[0]')).toBe('Gomez'); // accents become plain letters
    expect(text('Part11_Line3_DayPhone[0]')).toBe('2135550100');
    expect(text('Part11_Line4_MobilePhone[0]')).toBe('2135550101');
    expect(text('P11_Language[0]')).toBe('Spanish');
    expect(text('Part12_Line1_FamilyName[0]')).toBe('Lee');
    expect(text('Part12_Line2_NameofBusinessorOrgName[0]')).toBe('Clinica Comunitaria');
    expect(text('Part12_Line5_Email[0]')).toBe('ana@example.org');
    expect(text('Part11_Line6_InterpreterSig[0]')).toBeUndefined();
    expect(text('Part12_Line6_DateofSignature[0]')).toBeUndefined();
  });

  it('copies the interpreter into Part 12 when the same person prepared the form', () => {
    const { text } = planI131({ ...requestor, 'prep.same': 'yes' });
    expect(text['Part12_Line1_FamilyName[0]']).toBe('Gómez');
    expect(text['Part12_Line5_Email[0]']).toBe('rosa@example.org');
    const none = planI131({ ...requestor, readsEnglish: 'A', preparer: 'no' }).text;
    expect(Object.keys(none).filter((k) => /^(Part1[12]|P11)_/.test(k))).toEqual([]);
  });

  it('writes a re-parole for oneself with the I-94 date, USPID and work permit', async () => {
    const a = { ...requestor, appType: 'reparole', reparoleBasis: '35', 'mpip.role': '2', 'parole.forOther': 'no', 'reparole.until': '03/01/2027', 'reparole.coa': 'par', 'reparole.i94': '1234567890A', uspid: 'USP123', 'reparole.ead': 'yes' };
    const doc = await PDFDocument.load(await fillI131(template, a));
    const f = fieldsBySegment(doc.getForm().getFields());
    const text = (n: string) => (f.get(n)![0] as PDFTextField).getText();
    const checked = (n: string) => (f.get(n)![0] as PDFCheckBox).isChecked();
    expect(boxesOf(f, 'CB_AppType').filter((o) => o.box.isChecked()).map((o) => o.value)).toEqual(['35']);
    expect(checked('P1_Line10H_2[0]')).toBe(true);
    expect(text('P1_Line12_DateOfAdmission[0]')).toBe('03/01/2027');
    expect(text('Part2_Line12_ClassofAdmission[0]')).toBe('PAR');
    expect(text('Part2_Line13_I94RecordNo[0]')).toBe('1234567890A');
    expect(text('Part2_Line14_I94ExpDate[0]')).toBe('03/01/2027');
    expect(text('Par2_Line15_eMedicalParoleeID[0]')).toBe('USP123');
    expect(text('P2_Line16_GivenName[0]')).toBeUndefined();
    expect(text('P8_Line3b_CityOrTown[0]')).toBeUndefined();
    expect(checked('P9_Line1_EAD[0]')).toBe(true);
  });

  it('moves a long parole explanation to Part 13, split across its boxes', () => {
    expect(planI131({ ...requestor, 'parole.explain': 'y'.repeat(500) }).text['P8_Line1_Explain[0]']).toBe('y'.repeat(500));
    const long = Array(150).fill('reason').join(' ');
    const { text } = planI131({ ...requestor, 'parole.explain': long });
    expect(text['P8_Line1_Explain[0]']).toBe('See Part 13, Additional Information.');
    expect(text['Part13_Line3_PartNumber[0]']).toBe('8');
    expect(text['Part13_Line4_ItemNumber[0]']).toBe('1');
    const parts = [3, 4, 5].map((i) => text[`Part13_Line${i}_AdditionalInfo[0]`]);
    expect(parts.every((p) => p.length <= 420)).toBe(true);
    expect(parts.join(' ')).toBe(long);
  });

  it('fills the referral, FRTF and program fields of the chosen item', () => {
    expect(planI131({ ...requestor, paroleBasis: '20', 'referral.agency': 'DOS', 'referral.email': 'a@state.gov' }).text).toMatchObject({ 'P1_Line6C1[0]': 'DOS', 'P1_Line6C2[0]': 'a@state.gov' });
    expect(planI131({ ...requestor, paroleBasis: '18', 'parole.i130Receipt': 'ioe-0123456789' }).text['P1_Line6A[0]']).toBe('IOE0123456789');
    expect(planI131({ ...requestor, paroleBasis: '21', 'frtf.number': 'R1' }).text['P1_Line6D[0]']).toBe('R1');
    expect(planI131({ ...requestor, appType: 'pip', pipBasis: '25', 'frtf.number': 'R2' }).text['P1_Line8B[0]']).toBe('R2');
    expect(planI131({ ...requestor, appType: 'pip', pipBasis: '26', 'parole.program': 'Q' }).text['P1_Line8C[0]']).toBe('Q');
    expect(planI131({ ...requestor, appType: 'reparole', reparoleBasis: '36', 'parole.program': 'U' }).text['P1_Line10I[0]']).toBe('U');
    expect(planI131({ ...requestor, paroleBasis: '22', 'parole.program': 'XTUV' }).text['P1_Line6E[0]']).toBe('XTUV');
  });
});
