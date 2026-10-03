import { describe, expect, it } from 'vitest';
import { visibleScreens } from './flow';
import { i290b } from '../forms/i290b';

const ids = (a: Record<string, string | string[]>) => visibleScreens(i290b, a).map((s) => s.question.id);

describe('I-290B flow', () => {
  it('has unique answer ids', () => {
    const seen = new Set<string>();
    for (const s of i290b.sections)
      for (const q of s.questions) {
        const own = q.kind === 'fields' ? q.fields.map((f) => f.id) : q.kind === 'yesNoList' ? q.items.map((i) => i.id) : [q.id];
        for (const id of own) {
          expect(seen.has(id), id).toBe(false);
          seen.add(id);
        }
      }
  });

  it('starts with the legal notice about the deadline', () => {
    const first = visibleScreens(i290b, {})[0].question;
    expect(first.id).toBe('filer');
    expect(first.notice?.tone).toBe('legal');
    expect(first.notice?.body.en).toContain('33 days');
  });

  it('follows the answers', () => {
    expect(ids({ filer: 'person' })).toContain('name');
    expect(ids({ filer: 'person' })).not.toContain('business');
    expect(ids({ filer: 'business' })).toContain('business');
    expect(ids({ filer: 'business' })).not.toContain('name');
    expect(ids({ filingType: 'appeal' })).toContain('appealBrief');
    expect(ids({ filingType: 'reopen' })).not.toContain('appealBrief');
    expect(ids({ filingType: 'both' })).not.toContain('appealBrief');
    expect(ids({ 'decision.office': 'Other' })).toContain('officeOther');
    expect(ids({ 'decision.office': 'AAO' })).not.toContain('officeOther');
    expect(ids({})).toContain('basisStatement');
    expect(ids({})).toContain('contactInfo');
  });
});
