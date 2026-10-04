import { describe, expect, it } from 'vitest';
import { assistance, assistanceSection, usedInterpreter, usedPreparer } from './assistance';
import type { FormDefinition } from './types';
import { visibleScreens } from '../engine/flow';

const form = (s = assistanceSection({ usedInterpreter, usedPreparer, interpreterPart: 'Part 7', preparerPart: 'Part 8' })): FormDefinition =>
  ({ id: 'x', sections: [s] }) as unknown as FormDefinition;
const shown = (a: Record<string, string>) => visibleScreens(form(), a).map((s) => s.question.id);

describe('interpreter and preparer parts', () => {
  it('ask only for the people who helped', () => {
    expect(shown({})).toEqual([]);
    expect(shown({ readsEnglish: 'B' })).toEqual(['interp.who', 'interp.address', 'interp.contact']);
    expect(shown({ preparer: 'yes' })).toEqual(['prep.who', 'prep.address', 'prep.contact', 'prep.statement']);
    expect(shown({ readsEnglish: 'B', preparer: 'yes', 'prep.same': 'yes' })).toEqual(['interp.who', 'interp.address', 'interp.contact', 'prep.same', 'prep.statement']);
  });

  it('copies the interpreter when the same person prepared the form', () => {
    const a = { 'interp.family': 'Gómez', 'interp.given': 'Rosa', 'interp.language': 'Spanish', 'prep.same': 'yes', 'prep.statement': 'notAttorney', 'prep.family': 'Old' };
    const r = assistance(a, { interpreter: true, preparer: true });
    expect(r.interpreter?.language).toBe('Spanish');
    expect(r.preparer?.family).toBe('Gómez');
    expect(r.preparer?.statement).toBe('notAttorney');
    expect(assistance(a, { interpreter: false, preparer: false })).toEqual({});
  });

  it('a form with only a preparer part skips the same-person question', () => {
    const s = assistanceSection({ usedInterpreter, usedPreparer, preparerPart: 'Part 5' });
    expect(visibleScreens(form(s), { readsEnglish: 'B', preparer: 'yes' }).map((x) => x.question.id)).toEqual(['prep.who', 'prep.address', 'prep.contact', 'prep.statement']);
  });

  it('leaves out what the PDF has no boxes for', () => {
    const s = assistanceSection({ usedInterpreter, usedPreparer, interpreterPart: 'Part 7', preparerPart: 'Part 8', address: false, statement: false, omitFields: ['prep.mobile'] });
    const a = { readsEnglish: 'B', preparer: 'yes' };
    expect(visibleScreens(form(s), a).map((x) => x.question.id)).toEqual(['interp.who', 'interp.contact', 'prep.same', 'prep.who', 'prep.contact']);
    const contact = s.questions.find((q) => q.id === 'prep.contact');
    expect(contact?.kind === 'fields' && contact.fields.map((f) => f.id)).toEqual(['prep.phone', 'prep.email']);
  });
});
