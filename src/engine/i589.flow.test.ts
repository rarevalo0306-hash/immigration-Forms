import { describe, expect, it } from 'vitest';
import { visibleScreens } from './flow';
import { i589 } from '../forms/i589';

const ids = (a: Record<string, string | string[]>) => visibleScreens(i589, a).map((s) => s.question.id);

describe('I-589 flow', () => {
  it('has unique answer ids', () => {
    const seen = new Set<string>();
    for (const s of i589.sections)
      for (const q of s.questions) {
        const own = q.kind === 'fields' ? q.fields.map((f) => f.id) : q.kind === 'yesNoList' ? q.items.map((i) => i.id) : [q.id];
        for (const id of own) {
          expect(seen.has(id), id).toBe(false);
          seen.add(id);
        }
      }
  });

  it('asks for up to six children, the last two for Supplement A', () => {
    const more = (n: number) => Object.fromEntries([...Array(n)].map((_, k) => [`child.more${k + 1}`, 'yes']));
    expect(ids({ hasChildren: 'yes', ...more(3) })).toContain('child4');
    expect(ids({ hasChildren: 'yes', ...more(3) })).not.toContain('child5');
    expect(ids({ hasChildren: 'yes', ...more(4), 'child5.inUS': 'yes' })).toEqual(expect.arrayContaining(['child5', 'child5Entry', 'child.more5']));
    expect(ids({ hasChildren: 'yes', ...more(5) })).toEqual(expect.arrayContaining(['child6', 'child.more6']));
    expect(ids({ hasChildren: 'yes', ...more(6) })).not.toContain('child7');
    const last = i589.sections.flatMap((s) => s.questions).find((q) => q.id === 'child.more6');
    expect(last?.notice?.title.en).toBe('More than six children');
  });

  it('asks for the preparer in Part E only when someone prepared it', () => {
    expect(ids({ preparer: 'no' })).not.toContain('prep.who');
    expect(ids({ preparer: 'yes' })).toEqual(expect.arrayContaining(['prep.who', 'prep.address', 'prep.contact']));
    // Part E has no statement boxes, so that question isn't asked.
    expect(ids({ preparer: 'yes' })).not.toContain('prep.statement');
    expect(ids({ preparer: 'yes', readsEnglish: 'B' })).not.toContain('interp.who');
    expect(i589.sections[i589.sections.length - 1].part).toBe('Part E');
  });
});
