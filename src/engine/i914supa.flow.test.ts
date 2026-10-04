import { describe, expect, it } from 'vitest';
import { visibleScreens } from './flow';
import { i914supa } from '../forms/i914supa';

describe('I-914 Supplement A flow', () => {
  const ids = (a: Record<string, string | string[]>) => visibleScreens(i914supa, a).map((s) => s.question.id);

  it('has unique answer ids', () => {
    const seen = new Set<string>();
    for (const s of i914supa.sections)
      for (const q of s.questions) {
        const own = q.kind === 'fields' ? q.fields.map((f) => f.id) : q.kind === 'yesNoList' ? q.items.map((i) => i.id) : [q.id];
        for (const id of own) {
          expect(seen.has(id), id).toBe(false);
          seen.add(id);
        }
      }
  });

  it('follows the answers', () => {
    expect(ids({})).not.toContain('fam.home');
    expect(ids({ 'fam.inUS': 'yes' })).toEqual(expect.arrayContaining(['fam.home', 'fam.lastEntry']));
    expect(ids({ 'fam.inUS': 'yes' })).not.toContain('fam.office');
    expect(ids({ 'fam.inUS': 'no' })).toEqual(expect.arrayContaining(['fam.hasIntended', 'fam.office', 'fam.officePlace', 'fam.abroad']));
    expect(ids({ 'fam.inUS': 'no' })).not.toContain('fam.home');
    expect(ids({ 'fam.inUS': 'no', 'fam.hasIntended': 'yes' })).toContain('fam.home');
    expect(ids({ 'fam.inUS': 'no' })).not.toContain('fam.lastEntry');
    expect(ids({ 'fam.mailingSafe': 'yes' })).toContain('fam.mailing');
    expect(ids({ 'fam.mailingSafe': 'no' })).not.toContain('fam.mailing');
    expect(ids({ 'fam.otherName.more0': 'yes', 'fam.otherName.more1': 'yes' })).toContain('fam.otherName2');
    expect(ids({ 'fam.marital': 'Single' })).not.toContain('fam.prior');
    expect(ids({ 'fam.marital': 'Married' })).toContain('fam.priorMarried');
    expect(ids({ 'fam.marital': 'Married' })).not.toContain('fam.prior');
    expect(ids({ 'fam.marital': 'Married', 'fam.priorMarried': 'yes' })).toContain('fam.prior');
    expect(ids({ 'fam.marital': 'Divorced' })).toContain('fam.prior');
    expect(ids({ 'fam.traveled': 'yes' })).toContain('fam.prevEntry');
    expect(ids({ 'fam.court': 'yes' })).toEqual(expect.arrayContaining(['fam.courtTypes', 'fam.courtDates']));
    expect(ids({ 'fam.court': 'no' })).not.toContain('fam.courtTypes');
    expect(ids({ 'fam.p4.1a': 'yes' })).toContain('fam.arrest1');
    expect(ids({ 'fam.p4.1a': 'yes', 'fam.arrest.more1': 'yes', 'fam.arrest.more2': 'yes', 'fam.arrest.more3': 'yes', 'fam.arrest.more4': 'yes' })).toContain('fam.arrest5');
    expect(ids({})).not.toContain('fam.processingExplain');
    expect(ids({ 'fam.p4.16': 'yes' })).toContain('fam.processingExplain');
    expect(ids({ readsEnglish: 'B' })).toEqual(expect.arrayContaining(['interpreterLanguage', 'interp.who', 'interp.contact']));
    expect(ids({ readsEnglish: 'A' })).not.toContain('interp.who');
    expect(ids({ preparer: 'yes' })).toEqual(expect.arrayContaining(['preparerName', 'prep.who', 'prep.statement']));
    expect(ids({ readsEnglish: 'B', preparer: 'yes', 'prep.same': 'yes' })).not.toContain('prep.who');
  });
});
