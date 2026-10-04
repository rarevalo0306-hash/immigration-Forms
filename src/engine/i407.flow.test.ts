import { describe, expect, it } from 'vitest';
import { visibleScreens } from './flow';
import { i407 } from '../forms/i407';

const ids = (a: Record<string, string | string[]>) => visibleScreens(i407, a).map((s) => s.question.id);

describe('I-407 flow', () => {
  it('has unique answer ids', () => {
    const seen = new Set<string>();
    for (const s of i407.sections)
      for (const q of s.questions) {
        const own = q.kind === 'fields' ? q.fields.map((f) => f.id) : q.kind === 'yesNoList' ? q.items.map((i) => i.id) : [q.id];
        for (const id of own) {
          expect(seen.has(id), id).toBe(false);
          seen.add(id);
        }
      }
  });

  it('starts with the legal notice', () => {
    const first = visibleScreens(i407, {})[0].question;
    expect(first.id).toBe('understands');
    expect(first.notice?.tone).toBe('legal');
  });

  it('follows the answers', () => {
    expect(ids({ understands: 'unsure' })).toContain('unsureNext');
    expect(ids({ understands: 'yes' })).not.toContain('unsureNext');
    expect(ids({ cardReturned: 'no' })).toContain('cardReason');
    expect(ids({ cardReturned: 'yes' })).not.toContain('cardReason');
    expect(ids({ 'otherDocs.has': 'yes' })).toContain('otherDocsList');
    expect(ids({ 'otherDocs.has': 'no' })).not.toContain('otherDocsList');
    expect(ids({ filer: 'guardian' })).toContain('guardianName');
    expect(ids({ filer: 'self' })).not.toContain('guardianName');
    expect(ids({})).toContain('submission');
  });
});
