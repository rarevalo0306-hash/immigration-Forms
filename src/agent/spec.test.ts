import { describe, expect, it } from 'vitest';
import { i765 } from '../forms/i765';
import { visibleScreens } from '../engine/flow';
import { applyAnswers, manualFields, maskNumbers, questionSpec } from './spec';

const at = (id: string, answers = {}) => visibleScreens(i765, answers).findIndex((s) => s.question.id === id);

describe('assistant bridge', () => {
  it('describes a choice question with its option values', () => {
    const screens = visibleScreens(i765, {});
    const spec = questionSpec(screens[0], 0, screens.length, {}, 'es');
    expect(spec).toMatchObject({ kind: 'choice', id: 'reason', number: 1, of: screens.length });
    expect(spec.options?.map((o) => o.value)).toEqual(['initial', 'replacement', 'renewal']);
  });

  it('saves a valid choice and moves on', () => {
    const r = applyAnswers(i765, {}, 0, [{ id: 'reason', value: 'initial' }], 'es');
    expect(r).toMatchObject({ ok: true, position: 1, answers: { reason: 'initial' } });
  });

  it('rejects values that are not options, and ids from other questions', () => {
    const r = applyAnswers(i765, {}, 0, [{ id: 'reason', value: 'primera vez' }, { id: 'name.family', value: 'Lopez' }], 'es');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['name.family', 'reason']);
  });

  it('runs the regular field validation', () => {
    const a = { reason: 'initial' };
    const pos = at('name', a);
    const bad = applyAnswers(i765, a, pos, [{ id: 'name.given', value: 'Rosa' }], 'es');
    expect(bad.ok).toBe(false);
  });

  it('never takes or shows ID numbers', () => {
    const a = { reason: 'initial' };
    const pos = at('ids', a);
    const screen = visibleScreens(i765, a)[pos];
    expect(manualFields(screen).map((f) => f.id)).toEqual(['aNumber', 'uscisAccount']);
    const spec = questionSpec(screen, pos, 10, { ...a, aNumber: 'A123456789' }, 'es');
    expect(JSON.stringify(spec)).not.toContain('123456789');
    expect(spec.fields?.every((f) => f.manual)).toBe(true);
    const r = applyAnswers(i765, a, pos, [{ id: 'aNumber', value: 'A123456789' }], 'es');
    expect(r.ok).toBe(false);
    // Optional ID numbers typed by hand (or left empty) let the form move on.
    expect(applyAnswers(i765, { ...a, aNumber: 'A123456789' }, pos, [], 'es')).toMatchObject({ ok: true, position: pos + 1 });
  });

  it('hides ID-like numbers typed in the chat, but not phones, ZIPs or dates', () => {
    expect(maskNumbers('mi seguro es 123-45-6789')).toBe('mi seguro es [número oculto]');
    expect(maskNumbers('A-Number A123456789')).toBe('A-Number [número oculto]');
    expect(maskNumbers('cuenta 1234 1234 1234')).toBe('cuenta [número oculto]');
    expect(maskNumbers('llámeme al 786-356-8113, zip 33155, nací el 03/14/1990')).toBe('llámeme al 786-356-8113, zip 33155, nací el 03/14/1990');
  });
});
