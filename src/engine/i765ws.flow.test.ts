import { describe, expect, it } from 'vitest';
import { i765ws } from '../forms/i765ws';
import { visibleScreens } from './flow';

const ids = (a: Record<string, string | string[]>) => visibleScreens(i765ws, a).map((s) => s.question.id);

describe('I-765WS flow', () => {
  it('has unique answer ids', () => {
    const seen = new Set<string>();
    for (const s of i765ws.sections)
      for (const q of s.questions) {
        const own = q.kind === 'fields' ? q.fields.map((f) => f.id) : q.kind === 'yesNoList' ? q.items.map((i) => i.id) : [q.id];
        for (const id of own) {
          expect(seen.has(id), id).toBe(false);
          seen.add(id);
        }
      }
  });

  it('follows the answers', () => {
    expect(ids({})).not.toContain('incomeSources');
    expect(ids({ incomePeriod: 'month' })).toContain('incomeSources');
    expect(ids({ incomePeriod: 'year' })).toContain('incomeSources');
    expect(ids({})).not.toContain('otherExpenseWhat');
    expect(ids({ 'expense.other': '40' })).toContain('otherExpenseWhat');
    expect(ids({})).toEqual(expect.arrayContaining(['name', 'incomePeriod', 'monthlyExpenses', 'assetValues', 'showBreakdown', 'needStatement']));
  });
});
