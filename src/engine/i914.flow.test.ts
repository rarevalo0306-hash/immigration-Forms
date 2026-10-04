import { describe, expect, it } from 'vitest';
import { visibleScreens } from './flow';
import { i914 } from '../forms/i914';

describe('I-914 flow', () => {
  const ids = (a: Record<string, string | string[]>) => visibleScreens(i914, a).map((s) => s.question.id);

  it('has unique answer ids', () => {
    const seen = new Set<string>();
    for (const s of i914.sections)
      for (const q of s.questions) {
        const own = q.kind === 'fields' ? q.fields.map((f) => f.id) : q.kind === 'yesNoList' ? q.items.map((i) => i.id) : [q.id];
        for (const id of own) {
          expect(seen.has(id), id).toBe(false);
          seen.add(id);
        }
      }
  });

  it('follows the answers', () => {
    expect(ids({})).not.toContain('receipt');
    expect(ids({ filingType: 'B' })).toContain('receipt');
    expect(ids({})).not.toContain('mailing');
    expect(ids({ mailingSame: 'no' })).toContain('mailing');
    expect(ids({ 'otherName.more0': 'yes', 'otherName.more1': 'yes' })).toContain('otherName2');
    expect(ids({ reported: 'yes' })).toContain('report');
    expect(ids({ reported: 'yes' })).not.toContain('notReported');
    expect(ids({ reported: 'no' })).toContain('notReported');
    expect(ids({ complied: 'no', minor: 'no' })).toContain('compliedWhy');
    expect(ids({ complied: 'no', minor: 'yes' })).not.toContain('compliedWhy');
    expect(ids({ firstEntry: 'no' })).toEqual(expect.arrayContaining(['recentEntry', 'otherEntries', 'arrival']));
    expect(ids({ firstEntry: 'yes' })).not.toContain('recentEntry');
    expect(ids({ firstEntry: 'yes' })).not.toContain('arrival');
    expect(ids({ firstEntry: 'yes', traffickingEntry: 'no' })).toContain('arrival');
    expect(ids({ 'p4.1a': 'yes' })).not.toContain('arrest1');
    expect(ids({ 'p4.1b': 'yes' })).toContain('arrest1');
    expect(ids({ 'p4.1b': 'yes', 'arrest.more1': 'yes' })).toContain('arrest2');
    expect(ids({})).not.toContain('processingExplain');
    expect(ids({ 'p4.16': 'yes' })).toContain('processingExplain');
    expect(ids({ hasSpouse: 'yes' })).toContain('spouse');
    expect(ids({ 'child.more0': 'yes', 'child.more1': 'yes', 'child.more2': 'yes' })).toContain('child3');
    expect(ids({ readsEnglish: 'B' })).toContain('interpreterLanguage');
    expect(ids({ preparer: 'yes' })).toContain('preparerName');
  });
});
