import { describe, expect, it } from 'vitest';
import { visibleScreens } from './flow';
import { i539a } from '../forms/i539a';

const ids = (a: Record<string, string | string[]>) => visibleScreens(i539a, a).map((s) => s.question.id);

describe('I-539A flow', () => {
  it('has unique answer ids', () => {
    const seen = new Set<string>();
    for (const s of i539a.sections)
      for (const q of s.questions) {
        const own = q.kind === 'fields' ? q.fields.map((f) => f.id) : q.kind === 'yesNoList' ? q.items.map((i) => i.id) : [q.id];
        for (const id of own) {
          expect(seen.has(id), id).toBe(false);
          seen.add(id);
        }
      }
  });

  it('keeps the co-applicant apart from the principal', () => {
    const ids = i539a.sections.flatMap((s) => s.questions.flatMap((q) => (q.kind === 'fields' ? q.fields.map((f) => f.id) : q.kind === 'yesNoList' ? q.items.map((i) => i.id) : [q.id])));
    // Only the principal's name reuses the I-539's ids; the rest of the person is `co.*`.
    expect(ids).toEqual(expect.arrayContaining(['name.family', 'co.name.family', 'co.dob', 'co.aNumber', 'co.phone']));
    for (const id of ['aNumber', 'dob', 'ssn', 'phone', 'email', 'currentStatus', 'employed', 'p4.6']) expect(ids).not.toContain(id);
  });

  it('follows the answers', () => {
    expect(ids({ 'co.statusDS': 'no' })).toContain('co.statusExpires');
    expect(ids({ 'co.statusDS': 'yes' })).not.toContain('co.statusExpires');
    expect(ids({ 'co.passportChanged': 'yes' })).toContain('co.newPassport');
    expect(ids({ 'co.passportChanged': 'no' })).not.toContain('co.newPassport');
    expect(ids({})).not.toContain('co.backgroundExplain');
    expect(ids({ 'co.p3.1': 'yes' })).toContain('co.backgroundExplain');
    expect(ids({ 'co.p3.16': 'yes' })).toContain('co.backgroundExplain');
    expect(ids({ 'co.employed': 'yes' })).toContain('co.employedExplain');
    expect(ids({ 'co.employed': 'no' })).toContain('co.supportExplain');
    expect(ids({ 'co.employed': 'no' })).not.toContain('co.employedExplain');
    expect(ids({ 'co.exchangeVisitor': 'yes' })).toContain('co.exchangeExplain');
    expect(ids({ 'co.exchangeVisitor': 'no' })).not.toContain('co.exchangeExplain');
    // Parts 5 and 6 have no address and no attorney statement.
    expect(ids({ readsEnglish: 'B' })).toEqual(expect.arrayContaining(['interp.who', 'interp.contact']));
    expect(ids({ readsEnglish: 'B', preparer: 'yes' })).not.toContain('interp.address');
    expect(ids({ readsEnglish: 'A', preparer: 'yes' })).toEqual(expect.arrayContaining(['prep.who', 'prep.contact']));
    expect(ids({ preparer: 'yes' })).not.toContain('prep.statement');
    expect(ids({ readsEnglish: 'B', preparer: 'yes', 'prep.same': 'yes' })).not.toContain('prep.who');
    expect(ids({ readsEnglish: 'A', preparer: 'no' })).not.toContain('interp.who');
  });

  it('warns before the sensitive questions', () => {
    expect(visibleScreens(i539a, {}).find((s) => s.question.id === 'co.background')?.question.notice?.tone).toBe('legal');
  });
});
