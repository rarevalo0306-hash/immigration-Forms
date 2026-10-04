import { describe, expect, it } from 'vitest';
import { visibleScreens } from './flow';
import { eoir33 } from '../forms/eoir33';

const ids = (a: Record<string, string | string[]>) => visibleScreens(eoir33, a).map((s) => s.question.id);

describe('EOIR-33/IC flow', () => {
  it('has unique answer ids', () => {
    const seen = new Set<string>();
    for (const s of eoir33.sections)
      for (const q of s.questions) {
        const own = q.kind === 'fields' ? q.fields.map((f) => f.id) : q.kind === 'yesNoList' ? q.items.map((i) => i.id) : [q.id];
        for (const id of own) {
          expect(seen.has(id), id).toBe(false);
          seen.add(id);
        }
      }
  });

  it('starts with the legal notice', () => {
    const first = visibleScreens(eoir33, {})[0].question;
    expect(first.notice?.tone).toBe('legal');
    expect(first.notice?.body.es).toContain('AR-11');
  });

  it('follows the answers', () => {
    expect(ids({ court: 'other' })).toContain('courtOther');
    expect(ids({ court: 'Miami' })).not.toContain('courtOther');
    expect(ids({ previousHas: 'yes' })).toContain('previous');
    expect(ids({ previousHas: 'no' })).not.toContain('previous');
    expect(ids({})).toContain('previousContact');
    expect(ids({ serviceBy: 'other' })).toContain('serviceNameScreen');
    expect(ids({ serviceBy: 'self' })).not.toContain('serviceNameScreen');
    expect(ids({ serviceMethod: 'mail' })).toContain('oplaScreen');
    expect(ids({ serviceMethod: 'inPerson' })).toContain('oplaScreen');
    expect(ids({ serviceMethod: 'electronic' })).not.toContain('oplaScreen');
  });

  it('says the 5-working-day deadline and the copy for DHS', () => {
    expect(eoir33.summary.es).toContain('5 días hábiles');
    expect(eoir33.nextSteps.es.join(' ')).toContain('OPLA');
  });
});
