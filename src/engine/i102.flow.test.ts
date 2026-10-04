import { describe, expect, it } from 'vitest';
import { visibleScreens } from './flow';
import { i102 } from '../forms/i102';

const ids = (a: Record<string, string | string[]>) => visibleScreens(i102, a).map((s) => s.question.id);

describe('I-102 flow', () => {
  it('has unique answer ids', () => {
    const seen = new Set<string>();
    for (const s of i102.sections)
      for (const q of s.questions) {
        const own = q.kind === 'fields' ? q.fields.map((f) => f.id) : q.kind === 'yesNoList' ? q.items.map((i) => i.id) : [q.id];
        for (const id of own) {
          expect(seen.has(id), id).toBe(false);
          seen.add(id);
        }
      }
  });

  it('starts by pointing to i94.cbp.dhs.gov', () => {
    const first = visibleScreens(i102, {})[0].question;
    expect(first.id).toBe('reason');
    expect(first.notice?.body.en).toContain('i94.cbp.dhs.gov');
    expect(i102.intro.es).toContain('i94.cbp.dhs.gov');
  });

  it('follows the answers', () => {
    expect(ids({ reason: 'f' })).toContain('reasonExplain');
    expect(ids({ reason: 'a' })).not.toContain('reasonExplain');
    expect(ids({ mailingSame: 'no' })).toContain('home');
    expect(ids({ mailingSame: 'yes' })).not.toContain('home');
    expect(ids({ 'otherName.more0': 'yes' })).toContain('otherName1');
    expect(ids({ 'otherName.more0': 'yes', 'otherName.more1': 'yes' })).toContain('otherName2');
    expect(ids({ 'otherName.more0': 'no' })).not.toContain('otherName1');
    expect(ids({ i94SameName: 'no' })).toContain('i94Name');
    expect(ids({ i94SameName: 'yes' })).not.toContain('i94Name');
    expect(ids({ otherFiling: 'yes' })).toContain('otherFilingForm');
    expect(ids({ otherFiling: 'no' })).not.toContain('otherFilingForm');
    expect(ids({ removal: 'yes' })).toContain('removalDetails');
    expect(ids({})).not.toContain('removalDetails');
    expect(visibleScreens(i102, {}).find((s) => s.question.id === 'removal')?.question.notice?.tone).toBe('legal');
  });
});
