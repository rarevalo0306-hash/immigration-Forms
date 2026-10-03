import { describe, expect, it } from 'vitest';
import { visibleScreens } from './flow';
import { i824 } from '../forms/i824';

const ids = (a: Record<string, string | string[]>) => visibleScreens(i824, a).map((s) => s.question.id);

describe('I-824 flow', () => {
  it('has unique answer ids', () => {
    const seen = new Set<string>();
    for (const s of i824.sections)
      for (const q of s.questions) {
        const own = q.kind === 'fields' ? q.fields.map((f) => f.id) : q.kind === 'yesNoList' ? q.items.map((i) => i.id) : [q.id];
        for (const id of own) {
          expect(seen.has(id), id).toBe(false);
          seen.add(id);
        }
      }
  });

  it('follows the answers', () => {
    expect(ids({})).toContain('request');
    expect(ids({ request: '1a' })).not.toContain('consulateInfo');
    expect(ids({ request: '1b' })).toContain('consulateInfo');
    expect(ids({ request: '1c' })).toContain('consulateInfo');
    expect(ids({ request: '1c' })).toContain('dependent1');
    expect(ids({ request: '1c' })).toContain('dependentsAddress');
    expect(ids({ request: '1a' })).not.toContain('dependent1');
    expect(ids({ request: '1c', 'dependent.more1': 'yes' })).toContain('dependent2');
    expect(ids({ request: '1c', 'dependent.more1': 'no' })).not.toContain('dependent2');
    expect(ids({ request: '1c', 'dependent.more1': 'yes', 'dependent.more2': 'yes', 'dependent.more3': 'yes' })).not.toContain('dependentsExtra');
    expect(ids({ request: '1c', 'dependent.more1': 'yes', 'dependent.more2': 'yes', 'dependent.more3': 'yes', 'dependent.more4': 'yes' })).toContain('dependentsExtra');
    expect(ids({ filerRole: 'applicant' })).not.toContain('beneficiaryInfo');
    expect(ids({ filerRole: 'petitioner' })).toContain('beneficiaryInfo');
    expect(ids({ filerRole: 'petitioner', 'beneficiary.mailingSame': 'no' })).toContain('beneficiaryHome');
    expect(ids({ filerRole: 'petitioner', 'beneficiary.mailingSame': 'yes' })).not.toContain('beneficiaryHome');
    expect(ids({ filerStatus: 'other' })).toContain('filerStatusOther');
    expect(ids({ filerStatus: 'usc' })).not.toContain('filerStatusOther');
    expect(ids({ mailingSame: 'no' })).toContain('home');
    expect(ids({ mailingSame: 'yes' })).not.toContain('home');
  });
});
