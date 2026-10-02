import { describe, expect, it } from 'vitest';
import { visibleScreens } from './flow';
import { i730 } from '../forms/i730';

const ids = (a: Record<string, string | string[]>) => visibleScreens(i730, a).map((s) => s.question.id);

describe('I-730 flow', () => {
  it('has unique answer ids', () => {
    const seen = new Set<string>();
    for (const s of i730.sections)
      for (const q of s.questions) {
        const own = q.kind === 'fields' ? q.fields.map((f) => f.id) : q.kind === 'yesNoList' ? q.items.map((i) => i.id) : [q.id];
        for (const id of own) {
          expect(seen.has(id), id).toBe(false);
          seen.add(id);
        }
      }
  });

  it('follows the answers', () => {
    expect(ids({ relationship: 'U' })).toContain('childType');
    expect(ids({ relationship: 'S' })).not.toContain('childType');
    expect(ids({ relationship: 'S' })).toContain('pet.marriage');
    expect(ids({ relationship: 'S' })).not.toContain('pet.married');
    expect(ids({ relationship: 'U', 'pet.married': 'no' })).not.toContain('pet.marriage');
    expect(ids({ relationship: 'U', 'pet.married': 'yes' })).toContain('pet.spouse');
    expect(ids({ status: 'ASL' })).toContain('asylumGrant');
    expect(ids({ status: 'LAS' })).not.toContain('refugeeAdmission');
    expect(ids({ status: 'REF' })).toContain('refugeeAdmission');
    expect(ids({ status: 'LRE' })).toContain('refugeeApproval');
    expect(ids({ mailingSame: 'no' })).toContain('mailing');
    expect(ids({ mailingSame: 'yes' })).not.toContain('mailing');
    expect(ids({ 'ben.mailingSame': 'no' })).toContain('ben.mailing');
    expect(ids({ 'pet.prior.more0': 'yes', 'pet.prior.more1': 'yes' })).toContain('pet.prior2');
    expect(ids({ 'pet.prior.more0': 'yes' })).not.toContain('pet.prior2');
    expect(ids({ 'ben.location': 'B' })).toContain('ben.consulate');
    expect(ids({ 'ben.location': 'A' })).not.toContain('ben.nativeSame');
    expect(ids({ 'ben.location': 'B', 'ben.nativeSame': 'no' })).toContain('ben.native');
    expect(ids({ 'ben.court': 'B' })).toContain('ben.courtWhere');
    expect(ids({ 'ben.court': 'C' })).not.toContain('ben.courtWhere');
    expect(ids({ 'ben.court': 'A' })).not.toContain('entry.more0');
    expect(ids({ 'ben.court': 'C', 'entry.more0': 'yes' })).toContain('entry1');
    expect(ids({ 'ben.court': 'C', 'entry.more0': 'yes', 'entry.more1': 'yes' })).toContain('entry2');
    expect(ids({ late: 'yes' })).toContain('lateExplain');
    expect(ids({ late: 'no' })).not.toContain('lateExplain');
    expect(ids({ readsEnglish: 'B' })).toContain('interpreterLanguage');
    expect(ids({ preparer: 'yes' })).toContain('preparerName');
  });
});
