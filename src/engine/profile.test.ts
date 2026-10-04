import { describe, expect, it } from 'vitest';
import { forms } from '../forms';
import { buildProfile, prefillFor, rolesOf, type SavedForm } from './profile';

const form = (id: string) => forms.find((f) => f.id === id)!;
const start = (target: string, saved: SavedForm[]) => prefillFor(form(target), buildProfile(forms, saved));

const maria = {
  'name.family': 'Hernández López',
  'name.given': 'María',
  'name.middle': 'Guadalupe',
  aNumber: '123456789',
  dob: '03/14/1990',
  sex: 'female',
  birthCountry: 'Mexico',
  'mailing.street': '1450 Oak Ave',
  'mailing.city': 'Houston',
  'mailing.state': 'TX',
  'mailing.zip': '77002',
};

describe('reusing data across forms', () => {
  it('every form finds the name of each person it asks about', () => {
    const profile = buildProfile(forms, [
      { formId: 'i-485', answers: maria, updated: 1 },
      { formId: 'i-864', answers: { 'name.family': 'Ramírez', 'name.given': 'Luis' }, updated: 1 },
    ]);
    for (const f of forms) {
      const values = Object.values(prefillFor(f, profile).answers);
      const roles = rolesOf(f.id);
      if (roles.immigrant !== undefined) expect(values, f.id).toContain('Hernández López');
      if (roles.sponsor !== undefined) expect(values, f.id).toContain('Ramírez');
    }
  });

  it('the immigrant on the I-485 is the principal immigrant on the I-864, not the sponsor', () => {
    const p = start('i-864', [{ formId: 'i-485', answers: maria, updated: 1 }]);
    expect(p.answers['principal.family']).toBe('Hernández López');
    expect(p.answers['principal.given']).toBe('María');
    expect(p.answers['principal.dob']).toBe('03/14/1990');
    expect(p.answers['principal.aNumber']).toBe('123456789');
    expect(p.answers['name.family']).toBeUndefined();
    expect(p.sources).toEqual(['I-485']);
  });

  it('the I-130 beneficiary fills the I-485, and the petitioner fills the I-864 sponsor', () => {
    const saved: SavedForm[] = [
      {
        formId: 'i-130',
        updated: 1,
        answers: {
          'pet.name.family': 'Hernández',
          'pet.name.given': 'José',
          'pet.dob': '07/01/1985',
          'pet.mailing.street': '1450 Oak Ave',
          'ben.name.family': 'López',
          'ben.name.given': 'Ana',
          'ben.dob': '02/02/1992',
        },
      },
    ];
    const i485 = start('i-485', saved);
    expect(i485.answers['name.family']).toBe('López');
    expect(i485.answers['name.given']).toBe('Ana');
    expect(i485.answers.dob).toBe('02/02/1992');
    const i864 = start('i-864', saved);
    expect(i864.answers['name.family']).toBe('Hernández');
    expect(i864.answers['principal.family']).toBe('López');
    expect(i864.answers['mailing.street']).toBe('1450 Oak Ave');
    // The I-129F names people without "name.": pet.family.
    expect(start('i-129f', saved).answers['pet.family']).toBe('Hernández');
  });

  it('keeps the most recent answer when two forms disagree', () => {
    const p = start('i-765', [
      { formId: 'i-485', answers: { ...maria, 'mailing.street': 'Old St' }, updated: 1 },
      { formId: 'i-90', answers: { ...maria, 'mailing.street': 'New St' }, updated: 2 },
    ]);
    expect(p.answers['mailing.street']).toBe('New St');
  });

  it('only fills values the target accepts', () => {
    const p = start('i-765', [{ formId: 'i-485', answers: { ...maria, sex: 'unknown' }, updated: 1 }]);
    expect(p.answers.sex).toBeUndefined();
    expect(p.answers['name.family']).toBe('Hernández López');
  });

  it('an address given once as "I live where I get mail" fills both addresses', () => {
    const p = start('i-485', [{ formId: 'i-765', answers: { ...maria, sameAddress: 'yes' }, updated: 1 }]);
    expect(p.answers['home.street']).toBe('1450 Oak Ave');
    expect(p.answers['mailing.street']).toBe('1450 Oak Ave');
    // Whether they're the same is still asked on the new form.
    expect(p.answers.mailingSame).toBeUndefined();
    const safe = start('i-485', [{ formId: 'i-914', answers: { ...maria, mailingSame: 'yes' }, updated: 1 }]);
    expect(safe.answers['home.street']).toBeUndefined();
  });

  it('the I-765 physical address is the home address elsewhere', () => {
    const p = start('i-485', [{ formId: 'i-765', answers: { 'physical.street': '9 Elm St', sameAddress: 'no' }, updated: 1 }]);
    expect(p.answers['home.street']).toBe('9 Elm St');
  });

  it('the N-600 child is nobody else', () => {
    expect(start('i-485', [{ formId: 'n-600', answers: maria, updated: 1 }]).answers).toEqual({});
    expect(start('n-600', [{ formId: 'i-485', answers: maria, updated: 1 }]).answers).toEqual({});
  });

  it('the interpreter and preparer from one form start the next', () => {
    const helpers = { 'interp.family': 'Gómez', 'interp.given': 'Rosa', 'interp.language': 'Spanish', 'interp.phone': '7135550100', 'prep.statement': 'notAttorney' };
    const p = start('i-485', [{ formId: 'i-130', answers: { ...maria, ...helpers }, updated: 1 }]);
    expect(p.answers['interp.family']).toBe('Gómez');
    expect(p.answers['interp.language']).toBe('Spanish');
    // The I-485's preparer part has no statement boxes, so it doesn't take that answer.
    expect(p.answers['prep.statement']).toBeUndefined();
    expect(start('i-130', [{ formId: 'i-485', answers: helpers, updated: 1 }]).answers['interp.given']).toBe('Rosa');
  });

  it('a supplement starts with its main form’s answers', () => {
    const supa = start('i-485supa', [{ formId: 'i-485', answers: maria, updated: 1 }]);
    expect(supa.answers['name.family']).toBe('Hernández López');
    expect(supa.answers['mailing.city']).toBe('Houston');
    const court = start('eoir-33', [{ formId: 'ar-11', answers: { 'present.street': '9 Elm St', 'present.city': 'Dallas' }, updated: 1 }]);
    expect(court.answers['present.street']).toBe('9 Elm St');
  });
});

