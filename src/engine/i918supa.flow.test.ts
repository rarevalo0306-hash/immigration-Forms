import { describe, expect, it } from 'vitest';
import { visibleScreens } from './flow';
import { i918supa } from '../forms/i918supa';

describe('I-918 Supplement A flow', () => {
  const ids = (a: Record<string, string | string[]>) => visibleScreens(i918supa, a).map((s) => s.question.id);

  it('has unique answer ids', () => {
    const seen = new Set<string>();
    for (const s of i918supa.sections)
      for (const q of s.questions) {
        const own = q.kind === 'fields' ? q.fields.map((f) => f.id) : q.kind === 'yesNoList' ? q.items.map((i) => i.id) : [q.id];
        for (const id of own) {
          expect(seen.has(id), id).toBe(false);
          seen.add(id);
        }
      }
  });

  it('follows the answers', () => {
    expect(ids({})).not.toContain('famMailing');
    expect(ids({ 'fam.mailingSame': 'no' })).toContain('famMailing');
    expect(ids({ 'fam.otherName.more0': 'yes' })).toContain('fam.otherName1');
    // In the U.S.: last entry, work permit and Part 8; abroad: earlier entry and where to notify.
    expect(ids({ 'fam.inUS': 'yes' })).toEqual(expect.arrayContaining(['famLastEntry', 'fam.ead', 'fam.readsEnglish', 'famContact']));
    expect(ids({ 'fam.inUS': 'yes' })).not.toContain('fam.notify');
    expect(ids({ 'fam.inUS': 'no' })).toEqual(expect.arrayContaining(['fam.beenInUS', 'fam.notify']));
    expect(ids({ 'fam.inUS': 'no' })).not.toContain('fam.ead');
    expect(ids({ 'fam.inUS': 'no' })).not.toContain('fam.readsEnglish');
    expect(ids({ 'fam.inUS': 'no' })).not.toContain('famPrevEntry');
    expect(ids({ 'fam.inUS': 'no', 'fam.beenInUS': 'yes' })).toContain('famPrevEntry');
    expect(ids({ 'fam.inUS': 'no', 'fam.notify': 'Consulate' })).toContain('famNotifyOffice');
    expect(ids({ 'fam.inUS': 'no', 'fam.notify': 'address' })).toContain('famForeignAddress');
    expect(ids({ 'fam.inUS': 'yes', 'fam.notify': 'address' })).not.toContain('famForeignAddress');
    expect(ids({ 'fam.priorSpouse.more0': 'yes', 'fam.priorSpouse.more1': 'yes' })).toContain('fam.priorSpouse2');
    expect(ids({ relationship: 'Unmarried' })).not.toContain('fam.priorSpouse.more0');
    expect(ids({ 'fam.proceedings': 'yes', 'fam.proceedingsTypes': ['b'] })).toContain('famProceedingsDate.b');
    expect(ids({ 'fam.proceedings': 'yes', 'fam.proceedingsTypes': ['b'] })).not.toContain('famProceedingsDate.c');
    expect(ids({ 'fam.p5.1a': 'yes' })).not.toContain('fam.arrest1');
    expect(ids({ 'fam.p5.1b': 'yes' })).toContain('fam.arrest1');
    expect(ids({})).not.toContain('famProcessingExplain');
    expect(ids({ 'fam.p5.23': 'yes' })).toContain('famProcessingExplain');
    expect(ids({ 'fam.relative.more0': 'yes', 'fam.relative.more1': 'yes' })).toContain('fam.relative2');
    expect(ids({ readsEnglish: 'B' })).toEqual(expect.arrayContaining(['interpreterLanguage', 'interp.who']));
    expect(ids({ preparer: 'yes' })).toEqual(expect.arrayContaining(['preparerName', 'prep.who', 'prep.statement']));
    expect(ids({})).not.toContain('interp.who');
    // The family member's own interpreter or preparer counts only when they are in the U.S.
    expect(ids({ 'fam.inUS': 'yes', 'fam.readsEnglish': 'B' })).toEqual(expect.arrayContaining(['famInterpreterLanguage', 'interp.who']));
    expect(ids({ 'fam.inUS': 'no', 'fam.readsEnglish': 'B' })).not.toContain('interp.who');
    expect(ids({ 'fam.inUS': 'yes', 'fam.preparer': 'yes' })).toEqual(expect.arrayContaining(['famPreparerName', 'prep.who']));
  });
});
