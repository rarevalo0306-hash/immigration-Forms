import { describe, expect, it } from 'vitest';
import { visibleScreens } from './flow';
import { i134 } from '../forms/i134';

const ids = (a: Record<string, string | string[]>) => visibleScreens(i134, a).map((s) => s.question.id);

describe('I-134 flow', () => {
  it('has unique answer ids', () => {
    const seen = new Set<string>();
    for (const s of i134.sections)
      for (const q of s.questions) {
        const own = q.kind === 'fields' ? q.fields.map((f) => f.id) : q.kind === 'yesNoList' ? q.items.map((i) => i.id) : [q.id];
        for (const id of own) {
          expect(seen.has(id), id).toBe(false);
          seen.add(id);
        }
      }
  });

  it('follows the answers', () => {
    expect(ids({ basis: 'other' })).toContain('ben.name');
    expect(ids({ basis: 'other' })).toContain('relationshipQ');
    expect(ids({ basis: 'self' })).not.toContain('ben.name');
    expect(ids({ basis: 'self' })).not.toContain('contributions');
    expect(ids({ basis: 'self' })).not.toContain('relationshipQ');
    expect(ids({ basis: 'other', contributions: 'yes' })).toContain('contributionsDescribe');
    expect(ids({ basis: 'other', contributions: 'no' })).not.toContain('contributionsDescribe');
    expect(ids({ mailingSame: 'no' })).toContain('home');
    expect(ids({ mailingSame: 'yes' })).not.toContain('home');
    expect(ids({ status: 'other' })).toContain('statusOther');
    expect(ids({ employment: 'employed' })).toContain('employed');
    expect(ids({ employment: 'self' })).toContain('selfEmployed');
    expect(ids({ employment: 'other' })).toContain('employmentOther');
    expect(ids({ employment: 'retired' })).not.toContain('employed');
    expect(ids({ 'dependent.more0': 'yes', 'dependent.more1': 'yes' })).toContain('dependent2');
    expect(ids({ 'dependent.more0': 'yes' })).not.toContain('dependent2');
    expect(ids({ basis: 'other', 'ben.mailingSame': 'no' })).toContain('ben.home');
    expect(ids({ basis: 'other', 'ben.marital': 'other' })).toContain('benMaritalOther');
    expect(ids({ basis: 'other', 'stay.end': 'date' })).toContain('stayTo');
    expect(ids({ basis: 'other', 'stay.end': 'none' })).not.toContain('stayTo');
    expect(ids({ readsEnglish: 'B' })).toContain('interpreterLanguage');
    expect(ids({ preparer: 'yes' })).toContain('preparerName');
  });
});
