import { describe, expect, it } from 'vitest';
import { visibleScreens } from './flow';
import { i212 } from '../forms/i212';

const ids = (a: Record<string, string | string[]>) => visibleScreens(i212, a).map((s) => s.question.id);

describe('I-212 flow', () => {
  it('has unique answer ids', () => {
    const seen = new Set<string>();
    for (const s of i212.sections)
      for (const q of s.questions) {
        const own = q.kind === 'fields' ? q.fields.map((f) => f.id) : q.kind === 'yesNoList' ? q.items.map((i) => i.id) : [q.id];
        for (const id of own) {
          expect(seen.has(id), id).toBe(false);
          seen.add(id);
        }
      }
  });

  it('starts with the legal notice', () => {
    const first = visibleScreens(i212, {})[0].question;
    expect(first.id).toBe('name');
    expect(first.notice?.tone).toBe('legal');
  });

  it('follows the answers', () => {
    expect(ids({ mailingSame: 'no' })).toContain('home');
    expect(ids({ mailingSame: 'yes' })).not.toContain('home');
    expect(ids({ processing: 'visa' })).toContain('consular');
    expect(ids({ processing: 'visa' })).not.toContain('adjustment');
    expect(ids({ processing: 'adjust' })).toContain('adjustment');
    expect(ids({ i601: 'no', prevI601: 'yes' })).toContain('prevI601Details');
    expect(ids({ i601: 'yes', prevI601: 'yes' })).not.toContain('prevI601');
    expect(ids({ arriving: 'yes' })).toContain('arrivingDetails');
    expect(ids({ arriving: 'no' })).not.toContain('arriving.count');
    expect(ids({ deportable: 'yes' })).toContain('deportableDetails');
    expect(ids({})).not.toContain('felony');
    expect(ids({ deportable: 'yes', felony: 'yes' })).toContain('felonyExplain');
    expect(ids({ unlawfulPresence: 'yes' })).toContain('presence');
    expect(ids({ reentry: 'yes' })).toContain('reentryDetails');
    expect(ids({ deportable: 'yes', 'deportable.count': 'once' })).not.toContain('removal1');
    expect(ids({ deportable: 'yes', 'deportable.count': 'more' })).toContain('removal1');
    expect(ids({ reentry: 'yes', 'removal.more1': 'yes' })).toContain('removal2');
    expect(ids({ seeking: 'O' })).toContain('seekingOther');
    expect(ids({ 'family.more0': 'yes', 'family.more1': 'yes' })).toContain('family2');
    expect(ids({ 'family.more0': 'no' })).not.toContain('family1');
    expect(ids({})).toContain('reason');
  });
});
