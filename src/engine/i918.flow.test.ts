import { describe, expect, it } from 'vitest';
import { visibleScreens } from './flow';
import { i918 } from '../forms/i918';

describe('I-918 flow', () => {
  const ids = (a: Record<string, string | string[]>) => visibleScreens(i918, a).map((s) => s.question.id);

  it('has unique answer ids', () => {
    const seen = new Set<string>();
    for (const s of i918.sections)
      for (const q of s.questions) {
        const own = q.kind === 'fields' ? q.fields.map((f) => f.id) : q.kind === 'yesNoList' ? q.items.map((i) => i.id) : [q.id];
        for (const id of own) {
          expect(seen.has(id), id).toBe(false);
          seen.add(id);
        }
      }
  });

  it('follows the answers', () => {
    expect(ids({})).not.toContain('mailing');
    expect(ids({ mailingSame: 'no' })).toContain('mailing');
    expect(ids({ 'otherName.more0': 'yes' })).toContain('otherName1');
    expect(ids({})).not.toContain('proceedingsTypes');
    expect(ids({ proceedings: 'yes' })).toContain('proceedingsExplain');
    expect(ids({ proceedings: 'yes', proceedingsTypes: ['b'] })).toContain('proceedingsDate.b');
    expect(ids({ proceedings: 'yes', proceedingsTypes: ['b'] })).not.toContain('proceedingsDate.c');
    expect(ids({ 'entry.more0': 'yes', 'entry.more1': 'yes', 'entry.more2': 'yes', 'entry.more3': 'yes' })).toContain('otherEntries');
    expect(ids({ 'entry.more0': 'yes' })).not.toContain('otherEntries');
    expect(ids({ outsideUS: 'yes', notify: 'Consulate' })).toContain('notifyOffice');
    expect(ids({ outsideUS: 'yes', notify: 'address' })).toContain('foreignAddress');
    expect(ids({ outsideUS: 'no', notify: 'address' })).not.toContain('foreignAddress');
    expect(ids({ 'p3.1a': 'yes' })).not.toContain('arrest1');
    expect(ids({ 'p3.1b': 'yes' })).toContain('arrest1');
    expect(ids({ 'p3.1b': 'yes', 'arrest.more1': 'yes' })).toContain('arrest2');
    expect(ids({})).not.toContain('processingExplain');
    expect(ids({ 'p3.23': 'yes' })).toContain('processingExplain');
    expect(ids({ 'familyMember.more0': 'yes', 'familyMember.more1': 'yes' })).toContain('familyMember2');
    expect(ids({ readsEnglish: 'B' })).toContain('interpreterLanguage');
    expect(ids({ preparer: 'yes' })).toContain('preparerName');
  });
});
