import { describe, expect, it } from 'vitest';
import { visibleScreens } from './flow';
import { i539 } from '../forms/i539';

const ids = (a: Record<string, string | string[]>) => visibleScreens(i539, a).map((s) => s.question.id);

describe('I-539 flow', () => {
  it('has unique answer ids', () => {
    const seen = new Set<string>();
    for (const s of i539.sections)
      for (const q of s.questions) {
        const own = q.kind === 'fields' ? q.fields.map((f) => f.id) : q.kind === 'yesNoList' ? q.items.map((i) => i.id) : [q.id];
        for (const id of own) {
          expect(seen.has(id), id).toBe(false);
          seen.add(id);
        }
      }
  });

  it('warns to file before the stay expires', () => {
    const screen = visibleScreens(i539, { statusDS: 'no' }).find((s) => s.question.id === 'statusExpires');
    expect(screen?.question.notice?.tone).toBe('legal');
  });

  it('follows the answers', () => {
    expect(ids({ mailingSame: 'no' })).toContain('home');
    expect(ids({ mailingSame: 'yes' })).not.toContain('home');
    expect(ids({ statusDS: 'yes' })).not.toContain('statusExpires');
    expect(ids({ appType: 'change' })).toContain('changeTo');
    expect(ids({ appType: 'extension' })).not.toContain('changeTo');
    expect(ids({ appType: 'reinstatement' })).toContain('reinstatementNote');
    expect(ids({ appType: 'reinstatement' })).toContain('school');
    expect(ids({ appType: 'change', newStatus: 'F1 - STUDENT - ACADEMIC' })).toContain('school');
    expect(ids({ appType: 'change', newStatus: 'B2 - TEMPORARY VISITOR FOR PLEASURE', currentStatus: 'F1 - STUDENT - ACADEMIC' })).not.toContain('school');
    expect(ids({ appType: 'extension', currentStatus: 'J1 - EXCHANGE VISITOR - OTHERS' })).toContain('school');
    expect(ids({ appType: 'extension', currentStatus: 'B2 - TEMPORARY VISITOR FOR PLEASURE' })).not.toContain('school');
    expect(ids({ coApplicants: 'family' })).toContain('people');
    expect(ids({ coApplicants: 'alone' })).not.toContain('people');
    expect(ids({ relGranted: 'yes' })).toContain('relCase');
    expect(ids({ relGranted: 'no', relPetition: 'N' })).not.toContain('relCase');
    expect(ids({ relPetition: 'B' })).toContain('relPending');
    expect(ids({ relPetition: 'A' })).not.toContain('relPending');
    expect(ids({ passportChanged: 'yes' })).toContain('newPassport');
    expect(ids({})).not.toContain('backgroundExplain');
    expect(ids({ 'p4.4': 'yes' })).toContain('backgroundExplain');
    expect(ids({ 'p4.13': 'yes' })).toContain('backgroundExplain');
    expect(ids({ employed: 'yes' })).toContain('employedExplain');
    expect(ids({ employed: 'no' })).toContain('supportExplain');
    expect(ids({ employed: 'no' })).not.toContain('employedExplain');
    expect(ids({ exchangeVisitor: 'yes' })).toContain('exchangeExplain');
    expect(ids({ exchangeVisitor: 'no' })).not.toContain('exchangeExplain');
  });
});
