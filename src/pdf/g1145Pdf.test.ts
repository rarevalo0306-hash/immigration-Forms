import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFDocument, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { fieldIndex } from './common';
import { fillG1145, planG1145 } from './g1145Pdf';

const template = readFileSync(new URL('../../public/forms/g-1145.pdf', import.meta.url));

export const lucia: Answers = { 'name.family': 'Gómez', 'name.given': 'Lucía', email: 'lucia@example.com', mobile: '(305) 555-0177' };

describe('G-1145 PDF', () => {
  it('plans only text fields that exist', async () => {
    const index = fieldIndex((await PDFDocument.load(template)).getForm());
    for (const name of Object.keys(planG1145({ ...lucia, 'name.middle': 'Ana' }))) expect(index.get(name), name).toBeInstanceOf(PDFTextField);
  });

  it('writes the answers into the official form', async () => {
    const f = fieldIndex((await PDFDocument.load(await fillG1145(template, lucia))).getForm());
    const text = (n: string) => (f.get(n) as PDFTextField).getText() ?? '';
    expect(text('LastName[0]')).toBe('Gomez');
    expect(text('FirstName[0]')).toBe('Lucia');
    expect(text('Email[0]')).toBe('lucia@example.com');
    expect(text('MobilePhoneNumber[0]')).toBe('3055550177');
  });
});
