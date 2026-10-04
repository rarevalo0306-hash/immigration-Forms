import { describe, expect, it } from 'vitest';
import { visibleScreens } from './flow';
import { i485supa } from '../forms/i485supa';
import { i485 } from '../forms/i485';

const ids = (a: Record<string, string | string[]>) => visibleScreens(i485supa, a).map((s) => s.question.id);

const answerIds = (form: typeof i485) =>
  form.sections.flatMap((s) => s.questions.flatMap((q) => (q.kind === 'fields' ? q.fields.map((f) => f.id) : q.kind === 'yesNoList' ? q.items.map((i) => i.id) : [q.id])));

describe('I-485 Supplement A flow', () => {
  it('has unique answer ids', () => {
    const seen = new Set<string>();
    for (const id of answerIds(i485supa)) {
      expect(seen.has(id), id).toBe(false);
      seen.add(id);
    }
  });

  it('uses the I-485 answer ids for the applicant', () => {
    const own = new Set(answerIds(i485supa));
    const main = new Set(answerIds(i485));
    for (const id of ['name.family', 'name.given', 'name.middle', 'aNumber', 'uscisAccount', 'dob', 'birthCountry', 'citizenship', 'mailing.street', 'mailing.city', 'mailing.state', 'mailing.zip', 'phone', 'mobile', 'email']) {
      expect(own.has(id), id).toBe(true);
      expect(main.has(id), id).toBe(true);
    }
  });

  it('starts with a legal notice and warns before the bars', () => {
    const screens = visibleScreens(i485supa, {});
    expect(screens[0].question.notice?.tone).toBe('legal');
    expect(screens.find((s) => s.question.id === 'basis245i')?.question.notice?.tone).toBe('legal');
    expect(screens.find((s) => s.question.id === 'bars')?.question.notice?.tone).toBe('legal');
  });

  it('follows the answers', () => {
    for (const basis245i of ['A', 'B']) expect(ids({ basis245i })).not.toContain('qualPrincipal');
    for (const basis245i of ['C', 'D', 'E']) expect(ids({ basis245i })).toContain('qualPrincipal');
    expect(ids({ readsEnglish: 'A', preparer: 'no' })).not.toContain('interp.who');
    expect(ids({ readsEnglish: 'B' })).toContain('interp.contact');
    expect(ids({ readsEnglish: 'B', preparer: 'yes' })).toContain('prep.same');
    expect(ids({ readsEnglish: 'B', preparer: 'yes', 'prep.same': 'yes' })).not.toContain('prep.who');
    expect(ids({ readsEnglish: 'A', preparer: 'yes' })).toContain('prep.contact');
    // Parts 5 and 6 have no address and no statement boxes.
    const all = ids({ readsEnglish: 'B', preparer: 'yes', 'prep.same': 'no' });
    for (const id of ['interp.address', 'prep.address', 'prep.statement']) expect(all).not.toContain(id);
  });
});
