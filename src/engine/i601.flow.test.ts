import { describe, expect, it } from 'vitest';
import { visibleScreens } from './flow';
import { i601 } from '../forms/i601';

describe('I-601 flow', () => {
  const ids = (a: Record<string, string | string[]>) => visibleScreens(i601, a).map((s) => s.question.id);

  it('has unique answer ids', () => {
    const seen = new Set<string>();
    for (const s of i601.sections)
      for (const q of s.questions) {
        const own = q.kind === 'fields' ? q.fields.map((f) => f.id) : q.kind === 'yesNoList' ? q.items.map((i) => i.id) : [q.id];
        for (const id of own) {
          expect(seen.has(id), id).toBe(false);
          seen.add(id);
        }
      }
  });

  it('follows the answers', () => {
    expect(ids({})).not.toContain('groundsA');
    expect(ids({ benefit: 'A' })).toContain('groundsA');
    expect(ids({ benefit: 'A' })).not.toContain('groundsC');
    expect(ids({ benefit: 'B' })).toContain('groundsB');
    expect(ids({ benefit: 'C' })).toContain('groundsC');
    expect(ids({ benefit: 'A', process: 'visa' })).toContain('consulate');
    expect(ids({ benefit: 'A', process: 'adjust' })).not.toContain('consulate');

    // Follow-ups only for the grounds selected, in the section that matches the benefit.
    expect(ids({ benefit: 'A', groundsA: ['4'] })).toContain('ground.crime');
    expect(ids({ benefit: 'A', groundsA: ['4'] })).not.toContain('ground.health');
    expect(ids({ benefit: 'A', groundsA: ['15'] })).toContain('ground.presence');
    expect(ids({ benefit: 'A', groundsA: ['18'] })).toContain('ground.other');
    expect(ids({ benefit: 'C', groundsC: ['39'] })).toContain('ground.other');
    expect(ids({ benefit: 'C', groundsC: ['22'] })).toContain('ground.health');
    expect(ids({ benefit: 'C', groundsC: ['30'] })).toContain('ground.fraud');
    expect(ids({ benefit: 'C', groundsA: ['4'] })).not.toContain('ground.crime');
    expect(ids({ benefit: 'A', groundsA: [] })).not.toContain('ground.misc');

    expect(ids({ i485Filed: 'yes' })).toContain('i485');
    expect(ids({ i212Filed: 'yes' })).toContain('i212Info');
    expect(ids({ mailingSame: 'no' })).toContain('home');
    expect(ids({ everInUS: 'no' })).not.toContain('lastEntry');
    expect(ids({ everInUS: 'yes', 'prevEntry.more0': 'yes', 'prevEntry.more1': 'yes' })).toContain('otherEntriesExplain');
    expect(ids({ 'otherName.more0': 'yes', 'otherName.more1': 'yes' })).toContain('otherName2');

    // Part 5 is skipped for SIJ / T adjustment.
    expect(ids({ benefit: 'B' })).not.toContain('hardship');
    expect(ids({ benefit: 'A' })).toContain('hardship');
    expect(ids({ benefit: 'A' })).toContain('vawa');
    expect(ids({ benefit: 'C' })).not.toContain('vawa');
    expect(ids({ benefit: 'A', 'qualifying.more0': 'yes', 'qualifying.more1': 'yes' })).toContain('qualifying2');
    expect(ids({ benefit: 'B', 'qualifying.more0': 'yes' })).not.toContain('qualifying1');
    expect(ids({ 'otherRelative.more0': 'yes' })).toContain('otherRelative1');
    expect(ids({})).toContain('discretionStatement');
  });
});
