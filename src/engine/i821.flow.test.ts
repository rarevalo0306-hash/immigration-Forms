import { describe, expect, it } from 'vitest';
import { visibleScreens } from './flow';
import { i821 } from '../forms/i821';

const ids = (a: Record<string, string | string[]>) => visibleScreens(i821, a).map((s) => s.question.id);

describe('I-821 flow: late initial filing and helpers', () => {
  it('has unique question ids', () => {
    const seen = new Set<string>();
    for (const s of i821.sections)
      for (const q of s.questions) {
        expect(seen.has(q.id), q.id).toBe(false);
        seen.add(q.id);
      }
  });

  it('asks Parts 4-6 only of late initial filers', () => {
    const late = { appType: '1a', lateInitial: 'yes', marital: 'M' };
    expect(ids({ appType: '1b' })).not.toContain('lateInitial');
    expect(ids({ appType: '1a' })).toContain('lateInitial');
    for (const a of [{ ...late, appType: '1b' }, { ...late, lateInitial: 'no' }]) {
      expect(ids(a)).not.toContain('spouseInfo');
      expect(ids(a)).not.toContain('formerSpouse.more0');
      expect(ids(a)).not.toContain('child.more0');
    }
    expect(ids(late)).toEqual(expect.arrayContaining(['spouseInfo', 'spouseAddress', 'spouseMarriage', 'spouse.tps', 'formerSpouse.more0', 'child.more0']));
    expect(ids(late)).not.toContain('spouseTps');
    expect(ids({ ...late, 'spouse.tps': 'yes' })).toContain('spouseTps');
    expect(ids({ ...late, marital: 'D' })).not.toContain('spouseInfo');
    expect(ids({ ...late, marital: 'S' })).not.toContain('formerSpouse.more0');
    expect(ids({ ...late, 'formerSpouse.more0': 'yes' })).toContain('formerSpouse1');
    expect(ids({ ...late, 'formerSpouse.more0': 'yes' })).not.toContain('formerSpouse2');
    expect(ids({ ...late, 'formerSpouse.more0': 'yes', 'formerSpouse.more1': 'yes' })).toContain('formerSpouse2');
    expect(ids({ ...late, 'child.more0': 'yes', 'child.more1': 'yes' })).toEqual(expect.arrayContaining(['child1', 'child2']));
  });

  it('asks about the interpreter and the preparer when they helped', () => {
    expect(ids({})).not.toContain('interp.who');
    expect(ids({})).not.toContain('prep.who');
    expect(ids({ readsEnglish: '1b' })).toContain('interp.who');
    expect(ids({ preparer: 'yes' })).toContain('preparerName');
    expect(ids({ preparer: 'yes' })).toContain('prep.who');
    expect(ids({ readsEnglish: '1b', preparer: 'yes' })).toContain('prep.same');
    expect(ids({ readsEnglish: '1b', preparer: 'yes', 'prep.same': 'yes' })).not.toContain('prep.who');
    expect(ids({ readsEnglish: '1b', preparer: 'yes', 'prep.same': 'yes' })).toContain('prep.statement');
  });
});
