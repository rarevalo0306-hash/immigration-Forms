import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { EOIR_COURTS } from '../forms/eoir33Courts';
import { fieldIndex } from './common';
import { fillEOIR33, planEOIR33 } from './eoir33Pdf';

const template = readFileSync(new URL('../../public/forms/eoir-33.pdf', import.meta.url));

/** Yesenia, whose case is in the Houston court, moved from Pasadena to Houston. */
export const yesenia: Answers = {
  'name.family': 'Ramírez López',
  'name.given': 'Yesenia',
  'name.middle': 'Guadalupe',
  aNumber: 'A212345678',
  court: 'Houston - S. Gessner Road',
  'present.street': '6200 Hillcroft Ave',
  'present.unit': 'Apt 1104',
  'present.city': 'Houston',
  'present.state': 'TX',
  'present.zip': '77081',
  'present.country': 'United States',
  phone: '(832) 555-0147',
  email: 'yesenia.ramirez@example.com',
  previousHas: 'yes',
  'previous.street': '1415 Shaver St',
  'previous.unit': 'Apt 3',
  'previous.city': 'Pasadena',
  'previous.state': 'TX',
  'previous.zip': '77506',
  'previous.country': 'United States',
  'previous.phone': '(713) 555-0190',
  serviceBy: 'self',
  serviceMethod: 'electronic',
};

describe('EOIR-33/IC PDF', () => {
  it('plans only fields that exist, with the right kind', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    const dropdown = index.get('Immigration Court Name') as PDFDropdown;
    const variants: Answers[] = [
      yesenia,
      ...Object.keys(EOIR_COURTS).map((court) => ({ ...yesenia, court })),
      { ...yesenia, court: 'other', 'courtOther.line1': '100 Main St', 'courtOther.line3': 'Somewhere, TX 77000', serviceMethod: 'mail', oplaAddress: '126 Northpoint Dr, Houston, TX 77060' },
      { ...yesenia, serviceBy: 'other', serviceName: 'Laura Méndez', serviceMethod: 'inPerson', oplaAddress: '126 Northpoint Dr, Houston, TX 77060' },
      { ...yesenia, previousHas: 'no', 'previous.phone': '', 'present.country': 'Mexico', 'present.state': '', 'present.zip': '', 'present.province': 'Nuevo León', 'present.postal': '64000' },
    ];
    for (const plan of variants.map(planEOIR33)) {
      for (const name of Object.keys(plan.text)) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
      for (const [name, value] of Object.entries(plan.select)) {
        expect(index.get(name), name).toBeInstanceOf(PDFDropdown);
        expect(dropdown.getOptions(), value).toContain(value);
      }
    }
  });

  it('knows every court in the form’s dropdown', async () => {
    const dropdown = fieldIndex((await PDFDocument.load(template)).getForm()).get('Immigration Court Name') as PDFDropdown;
    expect(dropdown.getOptions().filter((o) => o !== 'Select Immigration Court').sort()).toEqual(Object.keys(EOIR_COURTS).sort());
  });

  it('writes the answers into the official form', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillEOIR33(template, yesenia))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText();
    expect(text('Name')).toBe('Ramirez Lopez, Yesenia, Guadalupe');
    expect(text('A-Number')).toBe('A212345678');
    // The current address is the right-hand column; the former one the left.
    expect(text('number street address - current')).toBe('6200 Hillcroft Ave, Apt 1104');
    expect(text('city state zip country - current')).toBe('Houston, TX 77081');
    expect(text('number street apartment - former')).toBe('1415 Shaver St, Apt 3');
    expect(text('phone number - former')).toBe('(713) 555-0190');
    expect(text('name - proof of service')).toBe('Yesenia Guadalupe Ramirez Lopez');
    expect(text('office of principal legal advisor 1')).toContain('eService');
    expect((f.get('Immigration Court Name') as PDFDropdown).getSelected()).toEqual(['Houston - S. Gessner Road']);
    // The dropdown's script doesn't run: the court's address is written by the filler.
    expect(text('Address1')).toBe('8701 S. Gessner Road');
    expect(text('Address3')).toBe('Houston, TX 77074');
    expect(text('PUT YOUR ADDRESS HERE 2')).toBe('6200 Hillcroft Ave, Apt 1104');
    expect(text('date')).toBeUndefined();
    expect(text('date - proof of service')).toBeUndefined();
  });

  it('writes a court that is not on the list, and a foreign address', async () => {
    const f = fieldIndex(
      (
        await PDFDocument.load(
          await fillEOIR33(template, { ...yesenia, court: 'other', 'courtOther.line1': '100 Main St', 'courtOther.line3': 'Somewhere, TX 77000', 'present.country': 'Mexico', 'present.state': '', 'present.zip': '', 'present.city': 'Monterrey', 'present.province': 'Nuevo León', 'present.postal': '64000', serviceMethod: 'mail', oplaAddress: '126 Northpoint Dr, Houston, TX 77060' }),
        )
      ).getForm(),
    );
    const text = (n: string) => (f.get(n) as PDFTextField).getText();
    expect(text('Address1')).toBe('100 Main St');
    expect(text('Address2')).toBe('Somewhere, TX 77000');
    expect(text('city state zip country - current')).toBe('Monterrey, Nuevo Leon 64000, Mexico');
    expect(text('office of principal legal advisor 1')).toBe('Mail service: 126 Northpoint Dr, Houston, TX 77060');
  });
});
