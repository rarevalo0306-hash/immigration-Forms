import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { fieldIndex, fieldsBySegment, optionBoxes } from './common';
import { fillI212, planI212 } from './i212Pdf';

const template = readFileSync(new URL('../../public/forms/i-212.pdf', import.meta.url));

/**
 * Jorge, removed once by an immigration judge's order, now in Mexico with his U.S. citizen wife
 * and son, applying for an immigrant visa at the consulate in Ciudad Juarez.
 */
export const jorge: Answers = {
  'name.family': 'Ramírez',
  'name.given': 'Jorge',
  'name.middle': 'Luis',
  aNumber: 'A098765432',
  'otherName.more0': 'yes',
  'otherName1.family': 'Ramírez Soto',
  'otherName1.given': 'Jorge',
  'otherName.more1': 'no',
  'mailing.careOf': 'Ana Ramirez',
  'mailing.street': '1420 W Elm St',
  'mailing.unit': 'Apt 3',
  'mailing.city': 'El Paso',
  'mailing.state': 'TX',
  'mailing.zip': '79902',
  'mailing.country': 'United States',
  mailingSame: 'no',
  'home.street': 'Calle Hidalgo 45',
  'home.city': 'Ciudad Juarez',
  'home.province': 'Chihuahua',
  'home.postal': '32000',
  'home.country': 'Mexico',
  sex: 'male',
  dob: '03/15/1986',
  birthCity: 'Zacatecas',
  birthProvince: 'Zacatecas',
  birthCountry: 'Mexico',
  citizenship: 'Mexico',
  processing: 'visa',
  'consular.case': 'CDJ2025123456',
  'consulate.city': 'Ciudad Juarez',
  'consulate.country': 'Mexico',
  i601: 'yes',
  arriving: 'no',
  deportable: 'yes',
  'deportable.count': 'once',
  'deportable.date': '06/20/2019',
  'deportable.city': 'El Paso',
  'deportable.state': 'TX',
  felony: 'no',
  unlawfulPresence: 'no',
  reentry: 'no',
  seeking: 'P',
  'family.more0': 'yes',
  'family1.family': 'Ramírez',
  'family1.given': 'Ana',
  'family1.middle': 'Sofía',
  'family1.relationship': 'Wife',
  'family1.status': 'CIT',
  'family.more1': 'yes',
  'family2.family': 'Ramírez',
  'family2.given': 'Mateo',
  'family2.relationship': 'Son',
  'family2.status': 'CIT',
  'family.more2': 'no',
  factors: ['family', 'children', 'petition', 'noCrimes'],
  'reason.statement':
    'I lived in Texas from 2004 to 2019 and worked as a roofer. In 2019 an immigration judge ordered me removed after my asylum case was denied, and I was removed through El Paso. My wife Ana is a U.S. citizen and she filed an I-130 for me, which was approved. Our son Mateo has asthma and needs his father. Since my removal I have worked in Ciudad Juarez and I have no criminal record anywhere. I ask for permission to reapply so I can return to my family as a lawful permanent resident.',
  ethnicity: 'hispanic',
  race: ['WH'],
  heightFeet: '5',
  heightInches: '8',
  weight: '172',
  eyes: 'BN',
  hair: 'BL',
  phone: '915 555 0142',
  mobile: '656 123 4567',
  email: 'jorge.ramirez@example.com',
};

describe('I-212 PDF', () => {
  it('plans only fields that exist, with the right kind', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    const variants: Answers[] = [
      jorge,
      { ...jorge, mailingSame: 'yes', 'mailing.unit': 'Ste 200', processing: 'adjust', 'adjust.receipt': 'MSC-25-123-4567', 'adjust.office': 'Lockbox', 'adjust.date': '01/10/2025', i601: 'no', prevI601: 'yes', 'prevI601.receipt': 'IOE0912345678', 'prevI601.office': 'Phoenix', 'prevI601.date': '02/02/2022' },
      { ...jorge, 'home.unit': 'Flr 2', sex: 'female', processing: 'other', arriving: 'yes', 'arriving.count': 'once', 'arriving.date': '05/05/2015', 'arriving.city': 'Hidalgo', 'arriving.state': 'TX', felony: 'yes', 'felony.explain': 'Drug sale, 2014, Dallas County, 3 years' },
      {
        ...jorge,
        arriving: 'yes',
        'arriving.count': 'more',
        'deportable.count': 'more',
        felony: 'yes',
        'felony.explain': 'Burglary 2010',
        unlawfulPresence: 'yes',
        'presence.from': '01/01/2005',
        'presence.to': '06/20/2010',
        'presence.departed': '06/20/2010',
        'presence.departure.city': 'Nogales',
        'presence.departure.state': 'AZ',
        'presence.reentry.city': 'Sasabe',
        'presence.reentry.state': 'AZ',
        'presence.reentryDate': '08/01/2010',
        'presence.other': '2001 to 2003',
        reentry: 'yes',
        'reentry.removedDate': '06/20/2010',
        'reentry.city': 'Sasabe',
        'reentry.state': 'AZ',
        'reentry.date': '08/01/2010',
        'removal1.date': '06/20/2010',
        'removal1.place': 'Nogales, AZ',
        'removal1.how': 'expedited',
        'removal.more1': 'yes',
        'removal2.date': '06/20/2019',
        'removal2.place': 'El Paso, TX',
        'removal2.how': 'reinstated',
        'removal.more2': 'no',
        seeking: 'O',
        'seeking.other': 'H-2A worker',
        'family1.status': 'LPR',
        'family.more2': 'yes',
        'family3.given': 'Rosa',
        'family3.family': 'Soto',
        'family3.status': 'LPR',
      },
      ...['V', 'S'].map((seeking) => ({ ...jorge, seeking, 'otherName.more1': 'yes', 'otherName2.family': 'Soto', ethnicity: 'notHispanic', race: ['WH', 'AS', 'BL', 'AI', 'HW'] })),
      ...['BN', 'BL', 'HA', 'GN', 'BU', 'GR', 'MA', 'PN', 'UN'].map((eyes, i) => ({ ...jorge, eyes, hair: ['BL', 'BR', 'BN', 'GR', 'WH', 'RD', 'SA', 'NH', 'OT'][i] })),
    ];
    for (const plan of variants.map(planI212)) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const name of plan.check) expect(index.get(name), name).toBeInstanceOf(PDFCheckBox);
      for (const name of Object.keys(plan.select)) expect(index.get(name), name).toBeInstanceOf(PDFDropdown);
      for (const [base, value] of plan.checkValue) expect(optionBoxes(index, base).map((o) => o.value), `${base}=${value}`).toContain(value);
    }
    const rich = planI212(variants[3]);
    expect(rich.notes.map((n) => n.item)).toEqual(['1d, 5d', '9', '15', '3']);
    expect(rich.notes[2].text).toContain('2. 06/20/2019 - El Paso, TX - Removed under a reinstated prior order');
    expect(rich.notes[3].text).toContain('Rosa Soto (lawful permanent resident)');
    expect(planI212(jorge).statement).toMatch(/^Favorable factors: My U.S. family suffers hardship without me;/);
  });

  it('writes the answers into the official form', async () => {
    const fields = fieldsBySegment((await PDFDocument.load(await fillI212(template, jorge))).getForm().getFields());
    const texts = (n: string) => fields.get(n)!.map((f) => (f as PDFTextField).getText() ?? '');
    const text = (n: string) => texts(n)[0];
    const checked = (n: string) => (fields.get(n)![0] as PDFCheckBox).isChecked();
    // Part 9's header shares Part 1's field names; both copies are filled.
    expect(texts('p1Line2FamilyName[0]')).toEqual(['Ramirez', 'Ramirez']);
    expect(texts('p1Line1AlienNumber[0]')).toEqual(['098765432', '098765432']);
    expect(text('p1Line3FamilyName[0]')).toBe('Ramirez Soto');
    expect(text('p1Line5StreetNumName[0]')).toBe('1420 W Elm St');
    expect(checked('p1Line5Unit[0]')).toBe(true);
    expect(text('p1Line7Province[0]')).toBe('Chihuahua');
    expect(checked('p1Line6YesNo[1]')).toBe(true);
    // Quirky names: Part 1, Item 11 is "p2Line14DateOfBirth"; Male is the second Gender box.
    expect(text('p2Line14DateOfBirth[0]')).toBe('03/15/1986');
    expect(checked('p1Line13Gender[1]')).toBe(true);
    expect(checked('p1Line13Gender[0]')).toBe(false);
    expect(text('p1Line19aDOSNumber[0]')).toBe('CDJ2025123456');
    expect(checked('p1Line22YesNo[0]')).toBe(true);
    expect(checked('p2Line1YesNo[1]')).toBe(true);
    expect(checked('p2Line5YesNo[0]')).toBe(true);
    expect(checked('p2Line5CheckBox[0]')).toBe(true);
    expect(text('p2Line6Date[0]')).toBe('06/20/2019');
    expect((fields.get('p2Line7State[0]')![0] as PDFDropdown).getSelected()[0].trim()).toBe('TX');
    expect(checked('p3Line1CheckBox[0]')).toBe(true);
    expect(text('p3Line3GivenName[0]')).toBe('Ana');
    expect(checked('p3Line4CheckBox[1]')).toBe(true);
    // The statement doesn't fit Item 2's single line: it moves to Part 9, first box.
    expect(text('p3Line2Explain[0]')).toBe('See Part 9. Additional Information.');
    expect(text('p10Line3ItemNumber[0]')).toBe('3');
    expect(text('p10Line3AdditionalInfo[0]')).toContain('Mateo Ramirez');
    expect(text('p10Line4ItemNumber[0]')).toBe('2');
    expect(text('p10Line4AdditionalInfo[0]')).toContain('Favorable factors');
    expect(checked('p4Line2Race[1]')).toBe(true);
    expect(text('p4Line4HeightInches1[0]')).toBe('1');
    expect(text('p4Line4HeightInches3[0]')).toBe('2');
    expect(checked('p4Line5Eyecolor[2]')).toBe(true);
    expect(text('p7Line3DayPhone[0]')).toBe('9155550142');
    expect(text('p7Line6Signature[0]')).toBe('');
  });

  it('keeps a short statement in Item 2 and continues long ones on added pages', async () => {
    const short = fieldIndex((await PDFDocument.load(await fillI212(template, { ...jorge, factors: [], 'reason.statement': 'To live with my wife and son.' }))).getForm());
    expect((short.get('p3Line2Explain[0]') as PDFTextField).getText()).toBe('To live with my wife and son.');

    const long = await PDFDocument.load(await fillI212(template, { ...jorge, 'reason.statement': Array(200).fill('My family needs me at home every day.').join(' ') }));
    expect(long.getPageCount()).toBeGreaterThan(10);
    const f = fieldIndex(long.getForm());
    expect((f.get('p10Line5AdditionalInfo[0]') as PDFTextField).getText()).toMatch(/^\(continued\)/);
  });
});
