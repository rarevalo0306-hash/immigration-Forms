import { describe, expect, it } from 'vitest';
import { visibleScreens } from './flow';
import { i360 } from '../forms/i360';

const ids = (a: Record<string, string | string[]>) => visibleScreens(i360, a).map((s) => s.question.id);

describe('I-360 flow', () => {
  it('has unique answer ids', () => {
    const seen = new Set<string>();
    for (const s of i360.sections)
      for (const q of s.questions) {
        const own = q.kind === 'fields' ? q.fields.map((f) => f.id) : q.kind === 'yesNoList' ? q.items.map((i) => i.id) : [q.id];
        for (const id of own) {
          expect(seen.has(id), id).toBe(false);
          seen.add(id);
        }
      }
  });

  it('asks the classification first', () => {
    expect(ids({})[0]).toBe('classification');
  });

  it('shows only the parts the classification needs', () => {
    const widow = ids({ classification: 'B' });
    expect(widow).toContain('deceased');
    expect(widow).toContain('account');
    expect(widow).not.toContain('abuser');
    expect(widow).not.toContain('dependent');
    expect(widow).not.toContain('safeAddress');

    const vawa = ids({ classification: 'I' });
    expect(vawa).toContain('abuser');
    expect(vawa).toContain('vawaMarriage');
    expect(vawa).toContain('childrenFiled');
    expect(vawa).toContain('safeAddress');
    expect(vawa).not.toContain('deceased');
    expect(vawa).not.toContain('account');
    expect(ids({ classification: 'J' })).not.toContain('vawaMarriage');
    expect(ids({ classification: 'K' })).not.toContain('childrenFiled');

    const sij = ids({ classification: 'C' });
    expect(sij).toContain('dependent');
    expect(sij).toContain('safeAddress');
    expect(sij).not.toContain('workedWithout');
    expect(sij).not.toContain('abuser');
    expect(sij).not.toContain('deceased');
  });

  it('follows the answers', () => {
    expect(ids({ classification: 'I', safeAddress: 'yes' })).toContain('safe');
    expect(ids({ classification: 'I' })).not.toContain('safe');
    expect(ids({ inUS: 'yes' })).toContain('arrival');
    expect(ids({ inUS: 'no' })).not.toContain('arrival');
    expect(ids({ 'mailing.country': 'United States' })).toContain('foreign');
    expect(ids({ 'mailing.country': 'Mexico' })).not.toContain('foreign');
    expect(ids({ processingPath: 'consulate' })).toContain('consulate');
    expect(ids({ processingPath: 'withI485' })).not.toContain('consulate');
    expect(ids({ otherFilings: 'yes' })).toContain('otherFilingsCount');
    expect(ids({ removal: 'yes' })).toContain('processingExplain');
    expect(ids({ classification: 'C', workedWithout: 'yes' })).not.toContain('processingExplain');
    expect(ids({ classification: 'B', workedWithout: 'yes' })).toContain('processingExplain');
    expect(ids({ classification: 'B', 'deceased.status': 'C' })).toContain('deceasedNaturalized');
    expect(ids({ classification: 'B', 'deceased.status': 'D' })).toContain('deceasedOther');
    expect(ids({ classification: 'B', remarried: 'yes' })).toContain('remarriedWhen');
    expect(ids({ classification: 'B', separated: 'yes' })).toContain('separatedExplain');
    expect(ids({ classification: 'I', 'abuser.status': 'D' })).toContain('abuserANumber');
    expect(ids({ classification: 'I', 'abuser.status': 'E' })).toContain('abuserOther');
    expect(ids({ classification: 'C', 'otherName.more0': 'yes' })).toContain('otherName1');
    expect(ids({ classification: 'C', dependent: 'no' })).toContain('dependentExplain');
    expect(ids({ classification: 'C', jurisdiction: 'yes' })).toContain('residingPlacement');
    expect(ids({ classification: 'C', jurisdiction: 'no' })).toContain('jurisdictionEnded');
    expect(ids({ classification: 'C', jurisdiction: 'no', jurisdictionEnded: 'C' })).toContain('jurisdictionExplain');
    expect(ids({ classification: 'C', reunification: 'O' })).toContain('groundsDetails');
    expect(ids({ classification: 'C', reunification: 'B', grounds: ['A'] })).not.toContain('groundsDetails');
    expect(ids({ classification: 'C', hhs: 'yes' })).toContain('hhsAltered');
    expect(ids({ 'relative.more0': 'yes', 'relative.more1': 'yes' })).toContain('relative2');
    expect(ids({ 'relative.more0': 'no' })).not.toContain('relative1');
    expect(ids({ readsEnglish: 'B' })).toContain('interpreterLanguage');
  });
});
