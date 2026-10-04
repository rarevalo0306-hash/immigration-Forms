import { describe, expect, it } from 'vitest';
import { visibleScreens } from './flow';
import { n565 } from '../forms/n565';

const ids = (a: Record<string, string | string[]>) => visibleScreens(n565, a).map((s) => s.question.id);

describe('N-565 flow', () => {
  it('has unique answer ids', () => {
    const seen = new Set<string>();
    for (const s of n565.sections)
      for (const q of s.questions) {
        const own = q.kind === 'fields' ? q.fields.map((f) => f.id) : q.kind === 'yesNoList' ? q.items.map((i) => i.id) : [q.id];
        for (const id of own) {
          expect(seen.has(id), id).toBe(false);
          seen.add(id);
        }
      }
  });

  it('puts a legal notice on the lost-citizenship question', () => {
    const q = n565.sections.flatMap((s) => s.questions).find((q) => q.id === 'lostCitizenship');
    expect(q?.notice?.tone).toBe('legal');
  });

  it('follows the answers', () => {
    expect(ids({})).toContain('docType');
    expect(ids({})).not.toContain('reasons');
    expect(ids({ docType: 'NN' })).toContain('reasons');
    expect(ids({ docType: 'SCN' })).not.toContain('reasons');
    expect(ids({ docType: 'SCN' })).toContain('foreignCountry');
    expect(ids({ docType: 'SCN' })).toContain('officialAddress');
    expect(ids({ docType: 'NN' })).not.toContain('foreignCountry');
    expect(ids({ docType: 'NN', reasons: ['lost'] })).toContain('lostDetails');
    expect(ids({ docType: 'NN', reasons: ['mutilated'] })).not.toContain('lostDetails');
    expect(ids({ docType: 'SCN', reasons: ['lost'] })).not.toContain('lostDetails');
    expect(ids({ docType: 'NC', reasons: ['other'] })).toContain('otherReason');
    expect(ids({ docType: 'NC', reasons: ['error'] })).toEqual(expect.arrayContaining(['errorItems', 'errorDetails']));
    expect(ids({ docType: 'NC', reasons: ['name'] })).toContain('nameChangeBy');
    expect(ids({ docType: 'NC', reasons: ['name'] })).not.toContain('nameChangeDate');
    expect(ids({ docType: 'NC', reasons: ['name'], nameChangeBy: 'B' })).toContain('nameChangeDate');
    expect(ids({ docType: 'NC', reasons: ['dob'] })).toEqual(expect.arrayContaining(['dobChangeBy', 'dobChange']));
    expect(ids({ docType: 'NC', reasons: ['sex'] })).toContain('sex');
    expect(ids({ docType: 'NC', reasons: ['lost'] })).not.toContain('sex');
    expect(ids({ certNameSame: 'no' })).toContain('certName');
    expect(ids({ certNameSame: 'yes' })).not.toContain('certName');
    expect(ids({ 'otherName.more0': 'yes', 'otherName.more1': 'yes' })).toContain('otherName2');
    expect(ids({ 'otherName.more0': 'no' })).not.toContain('otherName1');
    expect(ids({ lostCitizenship: 'yes' })).toContain('lostCitizenshipExplain');
    expect(ids({ lostCitizenship: 'no' })).not.toContain('lostCitizenshipExplain');
    expect(ids({})).toContain('contactInfo');
    expect(ids({ readsEnglish: 'B' })).toContain('interp.who');
    expect(ids({ readsEnglish: 'B' })).not.toContain('interp.address');
    expect(ids({ preparer: 'yes' })).toContain('prep.who');
    expect(ids({ preparer: 'yes' })).not.toContain('prep.statement');
    expect(ids({ readsEnglish: 'B', preparer: 'yes', 'prep.same': 'yes' })).not.toContain('prep.who');
  });
});
