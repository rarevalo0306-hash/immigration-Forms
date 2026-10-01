import { describe, expect, it } from 'vitest';
import type { Field, FieldType } from '../forms/types';
import { normalize, parseCategory, parseUnit, parseUsDate, validateField } from './validation';

const field = (type: FieldType, required = false): Field => ({ id: 'x', type, required, label: { es: '', en: '' }, formRef: '' });
const ok = (type: FieldType, v: string) => validateField(field(type), v, new Date(2026, 9, 1)) === null;

describe('parseUsDate', () => {
  it('reads month first', () => expect(parseUsDate('03/14/1990')?.getDate()).toBe(14));
  it('rejects impossible dates', () => {
    expect(parseUsDate('14/03/1990')).toBeNull();
    expect(parseUsDate('02/30/2020')).toBeNull();
  });
});

describe('validateField', () => {
  it('requires required fields only', () => {
    expect(validateField(field('text', true), '  ')).not.toBeNull();
    expect(validateField(field('aNumber'), '')).toBeNull();
  });
  it('checks dates against today', () => {
    expect(ok('pastDate', '03/14/1990')).toBe(true);
    expect(ok('pastDate', '03/14/2030')).toBe(false);
    expect(ok('futureDate', '03/14/2030')).toBe(true);
  });
  it('accepts A-Numbers of 7 to 9 digits', () => {
    expect(ok('aNumber', 'A123456789')).toBe(true);
    expect(ok('aNumber', '1234567')).toBe(true);
    expect(ok('aNumber', '123456')).toBe(false);
    expect(ok('aNumber', 'B1234567')).toBe(false);
  });
  it('checks SSN, ZIP, phone, state, receipt, I-94', () => {
    expect(ok('ssn', '123-45-6789')).toBe(true);
    expect(ok('ssn', '12345678')).toBe(false);
    expect(ok('zip', '90210')).toBe(true);
    expect(ok('zip', '9021')).toBe(false);
    expect(ok('phone', '(213) 555-0123')).toBe(true);
    expect(ok('phone', '+1 213 555 0123')).toBe(true);
    expect(ok('phone', '555-0123')).toBe(false);
    expect(ok('state', 'tx')).toBe(true);
    expect(ok('state', 'Texas')).toBe(false);
    expect(ok('receipt', 'IOE 0123456789')).toBe(true);
    expect(ok('receipt', 'IOE012345')).toBe(false);
    expect(ok('i94', '12345678A01')).toBe(true);
    expect(ok('uscisAccount', '1234 1234 1234')).toBe(true);
    expect(ok('uscisAccount', '12345')).toBe(false);
    expect(ok('sevis', 'N0012345678')).toBe(true);
    expect(ok('sevis', 'X0012345678')).toBe(false);
    expect(ok('category', '(c)(10)')).toBe(true);
    expect(ok('category', 'c10')).toBe(false);
    expect(ok('unit', 'Apt 4B')).toBe(true);
    expect(ok('unit', 'Apartment 1234567')).toBe(false);
  });
  it('enforces the PDF field length', () => {
    const f = { ...field('text'), maxLength: 5 };
    expect(validateField(f, '12345')).toBeNull();
    expect(validateField(f, '123456')?.es).toMatch(/caben 5/);
  });
});

describe('parseCategory', () => {
  it('splits a category into the form boxes', () => {
    expect(parseCategory('(c)(3)(C)')).toEqual(['c', '3', 'C']);
    expect(parseCategory('(A)(12)')).toEqual(['a', '12', '']);
    expect(parseCategory('(c)(17)(iii)')).toEqual(['c', '17', 'iii']);
    expect(parseCategory('c8')).toBeNull();
  });
});

describe('parseUnit', () => {
  it('reads the unit type and number', () => {
    expect(parseUnit('Apt 4B')).toEqual({ kind: 'APT', number: '4B' });
    expect(parseUnit('Suite 200')).toEqual({ kind: 'STE', number: '200' });
    expect(parseUnit('Flr. 3')).toEqual({ kind: 'FLR', number: '3' });
    expect(parseUnit('#12')).toEqual({ kind: 'APT', number: '12' });
    expect(parseUnit('')).toBeNull();
  });
});

describe('normalize', () => {
  it('pads A-Numbers to 9 digits', () => expect(normalize('aNumber', 'a 1234567')).toBe('A001234567'));
  it('formats SSN and phone', () => {
    expect(normalize('ssn', '123456789')).toBe('123-45-6789');
    expect(normalize('phone', '2135550123')).toBe('(213) 555-0123');
  });
  it('uppercases states and receipts', () => {
    expect(normalize('state', 'ca')).toBe('CA');
    expect(normalize('receipt', 'ioe-0123456789')).toBe('IOE0123456789');
  });
});
