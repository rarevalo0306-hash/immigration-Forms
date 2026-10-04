import { describe, expect, it } from 'vitest';
import { i131 } from '../forms/i131';
import { visibleScreens } from './flow';

const ids = (a: Record<string, string>) => visibleScreens(i131, a).map((s) => s.question.id);

describe('I-131 flow: parole, parole in place and re-parole', () => {
  it('asks a requestor for the beneficiary abroad and the arrival details', () => {
    const p = ids({ appType: 'parole', paroleBasis: '23', 'parole.forOther': 'yes', benMailingSame: 'no' });
    for (const id of ['paroleBasis', 'parole.forOther', 'benName', 'benDetails', 'benMailing', 'benHome', 'paroleReason', 'paroleArrival']) expect(p).toContain(id);
    for (const id of ['entry', 'reparoleEntry', 'benEntry', 'replacement', 'tripDetails', 'deliverTo', 'reparoleUntil', 'reparole.ead', 'pipBasis']) expect(p).not.toContain(id);
    expect(ids({ appType: 'parole', paroleBasis: '23', 'parole.forOther': 'no' })).not.toContain('benName');
  });

  it('asks only the detail of the chosen program', () => {
    expect(ids({ appType: 'parole', paroleBasis: '18' })).toContain('paroleI130');
    expect(ids({ appType: 'parole', paroleBasis: '19' })).toContain('immvi.role');
    expect(ids({ appType: 'parole', paroleBasis: '20' })).toContain('referral');
    expect(ids({ appType: 'parole', paroleBasis: '21' })).toContain('frtf');
    expect(ids({ appType: 'parole', paroleBasis: '22' })).toContain('paroleProgram');
    expect(ids({ appType: 'pip', pipBasis: '25' })).toContain('frtf');
    expect(ids({ appType: 'pip', pipBasis: '26' })).toContain('paroleProgram');
    expect(ids({ appType: 'reparole', reparoleBasis: '32' })).toContain('immvi.role');
    expect(ids({ appType: 'reparole', reparoleBasis: '35' })).toContain('mpip.role');
    expect(ids({ appType: 'reparole', reparoleBasis: '34' })).not.toContain('frtf');
    const plain = ids({ appType: 'parole', paroleBasis: '23' });
    for (const id of ['paroleI130', 'immvi.role', 'mpip.role', 'referral', 'frtf', 'paroleProgram']) expect(plain).not.toContain(id);
  });

  it('military parole in place is only for oneself', () => {
    const m = ids({ appType: 'pip', pipBasis: '24', 'parole.forOther': 'yes', 'mpip.role': '1' });
    expect(m).toContain('mpip.role');
    expect(m).not.toContain('parole.forOther');
    expect(m).not.toContain('benName');
    expect(m).toContain('entry');
    expect(m).not.toContain('paroleArrival');
    const other = ids({ appType: 'pip', pipBasis: '27', 'parole.forOther': 'yes' });
    expect(other).toContain('benEntry');
    expect(other).not.toContain('entry');
  });

  it('re-parole asks the I-94 date, the parole entry and the work permit', () => {
    const r = ids({ appType: 'reparole', reparoleBasis: '30' });
    for (const id of ['reparoleBasis', 'reparoleUntil', 'reparoleEntry', 'paroleReason', 'reparole.ead']) expect(r).toContain(id);
    for (const id of ['entry', 'paroleArrival', 'replacement']) expect(r).not.toContain(id);
    expect(ids({ appType: 'reparole', reparoleBasis: '30', 'parole.forOther': 'yes' })).not.toContain('reparoleEntry');
  });

  it('asks the interpreter and preparer only when they helped', () => {
    expect(ids({ appType: '5' })).not.toContain('interp.who');
    const both = ids({ appType: '5', readsEnglish: 'B', preparer: 'yes' });
    for (const id of ['interp.who', 'interp.contact', 'prep.same', 'prep.who', 'prep.contact']) expect(both).toContain(id);
    for (const id of ['interp.address', 'prep.address', 'prep.statement']) expect(both).not.toContain(id);
    expect(ids({ appType: '5', readsEnglish: 'B', preparer: 'yes', 'prep.same': 'yes' })).not.toContain('prep.who');
  });
});
