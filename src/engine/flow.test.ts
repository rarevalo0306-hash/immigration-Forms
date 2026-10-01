import { describe, expect, it } from 'vitest';
import { i765 } from '../forms/i765';
import { pruneHidden, validateQuestion, visibleScreens } from './flow';

const ids = (a: Record<string, string>) => visibleScreens(i765, a).map((s) => s.question.id);

describe('I-765 flow', () => {
  it('has unique question and field ids', () => {
    const seen = new Set<string>();
    for (const s of i765.sections)
      for (const q of s.questions) {
        const all = q.kind === 'fields' ? [q.id, ...q.fields.map((f) => f.id)] : [q.id];
        for (const id of new Set(all)) {
          expect(seen.has(id), id).toBe(false);
          seen.add(id);
        }
      }
  });

  it('asks follow-ups only when they apply', () => {
    expect(ids({})).not.toContain('otherName');
    expect(ids({ hasOtherNames: 'yes' })).toContain('otherName');
    expect(ids({ sameAddress: 'no' })).toContain('physical');
    expect(ids({ readsEnglish: 'interpreter' })).toContain('interpreterLanguage');
  });

  it('asks category-specific questions', () => {
    expect(ids({ category: '(c)(8)' })).toContain('arrested');
    expect(ids({ category: '(c)(3)(C)' })).toContain('stem');
    expect(ids({ category: '(c)(26)' })).toContain('h1b');
    expect(ids({ category: '(c)(3)(B)' })).toContain('sevis');
    expect(ids({ category: 'other', 'category.other': '(c)(36)' })).toContain('i140');
    expect(ids({ category: 'other', 'category.other': '(c)(35)' })).toContain('arrested');
    expect(ids({ category: '(c)(9)' })).not.toContain('arrested');
  });

  it('drops answers to questions that become hidden, including chained ones', () => {
    // Switching away from "other" hides the typed category, which in turn hid the (c)(35) follow-ups.
    const pruned = pruneHidden(i765, { category: '(c)(9)', 'category.other': '(c)(35)', 'i140.receipt': 'IOE0123456789', reason: 'initial' });
    expect(pruned).toEqual({ category: '(c)(9)', reason: 'initial' });
  });

  it('requires a choice and required fields', () => {
    const reason = i765.sections[0].questions[0];
    expect(validateQuestion(reason, {})).toHaveProperty('reason');
    const name = i765.sections[1].questions[0];
    expect(Object.keys(validateQuestion(name, { 'name.family': 'García' }))).toEqual(['name.given']);
  });
});
