import { describe, expect, it } from 'vitest';
import { visibleScreens } from './flow';
import { i131a } from '../forms/i131a';

const ids = (a: Record<string, string | string[]>) => visibleScreens(i131a, a).map((s) => s.question.id);

describe('I-131A flow', () => {
  it('has unique answer ids', () => {
    const seen = new Set<string>();
    for (const s of i131a.sections)
      for (const q of s.questions) {
        const own = q.kind === 'fields' ? q.fields.map((f) => f.id) : q.kind === 'yesNoList' ? q.items.map((i) => i.id) : [q.id];
        for (const id of own) {
          expect(seen.has(id), id).toBe(false);
          seen.add(id);
        }
      }
  });

  it('follows the answers', () => {
    expect(ids({ mailingSame: 'no' })).toContain('home');
    expect(ids({ mailingSame: 'yes' })).not.toContain('home');
    expect(ids({ reason: 'PR lost' })).toContain('lprDocs');
    expect(ids({ reason: 'PR lost' })).toContain('abandoned');
    expect(ids({ reason: 'PR lost' })).not.toContain('paroleDocs');
    expect(ids({ reason: 'PR lost' })).not.toContain('revoked');
    expect(ids({ reason: 'AP Lost' })).toContain('paroleDocs');
    expect(ids({ reason: 'EAD Damage' })).toContain('revoked');
    expect(ids({ reason: 'EAD Damage' })).not.toContain('carrierBefore');
    expect(ids({ reason: 'Other' })).toContain('reasonOther');
    expect(ids({ reason: 'Other' })).toContain('otherIsLpr');
    expect(ids({ reason: 'Expired' })).not.toContain('reasonOther');
    expect(ids({ reason: 'Other', otherIsLpr: 'yes' })).toContain('lprDocs');
    expect(ids({ reason: 'Other', otherIsLpr: 'no' })).toContain('paroleDocs');
    expect(ids({ proceedings: 'yes' })).toContain('proceedingsExplain');
    expect(ids({ proceedings: 'no' })).not.toContain('proceedingsExplain');
    expect(ids({ reason: 'NR', abandoned: 'yes' })).toContain('abandonedExplain');
    expect(ids({ reason: 'NR', carrierBefore: 'yes' })).toContain('carrierDetails');
    expect(ids({ reason: 'AP Damage', carrierBefore: 'yes' })).not.toContain('carrierDetails');
    expect(ids({ reason: 'AP Damage', revoked: 'yes' })).toContain('revokedDetails');
    expect(ids({ readsEnglish: 'B' })).toContain('interpreterLanguage');
    expect(ids({ preparer: 'yes' })).toContain('preparerName');
  });

  it('warns before the proceedings question', () => {
    const q = i131a.sections.flatMap((s) => s.questions).find((x) => x.id === 'proceedings');
    expect(q?.notice?.tone).toBe('legal');
  });
});
