import { describe, expect, it } from 'vitest';
import { visibleScreens } from './flow';
import { i865 } from '../forms/i865';

const ids = (a: Record<string, string | string[]>) => visibleScreens(i865, a).map((s) => s.question.id);

describe('I-865 flow', () => {
  it('has unique answer ids', () => {
    const seen = new Set<string>();
    for (const s of i865.sections)
      for (const q of s.questions) {
        const own = q.kind === 'fields' ? q.fields.map((f) => f.id) : q.kind === 'yesNoList' ? q.items.map((i) => i.id) : [q.id];
        for (const id of own) {
          expect(seen.has(id), id).toBe(false);
          seen.add(id);
        }
      }
  });

  it('follows the answers', () => {
    expect(ids({ mailingSame: 'no' })).toContain('mailing');
    expect(ids({ mailingSame: 'no' })).toContain('mailingDateQ');
    expect(ids({ mailingSame: 'yes' })).not.toContain('mailing');
    expect(ids({ mailingSame: 'yes' })).not.toContain('mailingDateQ');
    expect(ids({ oldAddress: 'yes' })).toContain('previous');
    expect(ids({ oldAddress: 'no' })).not.toContain('previous');
    expect(ids({})).not.toContain('member1');
    expect(ids({ 'member.more0': 'yes' })).toContain('member1');
    expect(ids({ 'member.more0': 'yes' })).not.toContain('member2');
    expect(ids({ 'member.more0': 'yes', 'member.more1': 'yes' })).toContain('member2');
    expect(ids({ readsEnglish: 'B' })).toContain('interpreterLanguage');
    expect(ids({ readsEnglish: 'A' })).not.toContain('interpreterLanguage');
    expect(ids({ preparer: 'yes' })).toContain('preparerName');
    expect(ids({ preparer: 'no' })).not.toContain('preparerName');
  });
});
