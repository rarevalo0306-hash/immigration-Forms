import { describe, expect, it } from 'vitest';
import { visibleScreens } from './flow';
import { n336 } from '../forms/n336';

const ids = (a: Record<string, string | string[]>) => visibleScreens(n336, a).map((s) => s.question.id);

describe('N-336 flow', () => {
  it('has unique answer ids', () => {
    const seen = new Set<string>();
    for (const s of n336.sections)
      for (const q of s.questions) {
        const own = q.kind === 'fields' ? q.fields.map((f) => f.id) : q.kind === 'yesNoList' ? q.items.map((i) => i.id) : [q.id];
        for (const id of own) {
          expect(seen.has(id), id).toBe(false);
          seen.add(id);
        }
      }
  });

  it('starts with the deadline notice', () => {
    const first = visibleScreens(n336, {})[0].question;
    expect(first.id).toBe('name');
    expect(first.notice?.tone).toBe('legal');
    expect(first.notice?.body.en).toContain('30 days');
    expect(first.notice?.body.en).toContain('33 days');
  });

  it('follows the answers', () => {
    expect(ids({})).not.toContain('otherName1');
    expect(ids({ hasOtherNames: 'yes' })).toContain('otherName1');
    expect(ids({ hasOtherNames: 'yes' })).not.toContain('otherName2');
    expect(ids({ hasOtherNames: 'yes', hasOtherNames2: 'yes' })).toContain('otherName2');
    expect(ids({ mailingSame: 'yes' })).not.toContain('mailing');
    expect(ids({ mailingSame: 'no' })).toContain('mailing');
    expect(ids({ brief: 'attached' })).toContain('briefListQ');
    expect(ids({ brief: 'hearing' })).not.toContain('briefListQ');
    expect(ids({ readsEnglish: 'B' })).toContain('interpreterLanguage');
    expect(ids({ readsEnglish: 'A' })).not.toContain('interpreterLanguage');
    expect(ids({ preparer: 'yes' })).toContain('preparerName');
    expect(ids({})).toContain('reasonsQ');
  });
});
