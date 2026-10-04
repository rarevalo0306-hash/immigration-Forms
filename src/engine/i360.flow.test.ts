import { describe, expect, it } from 'vitest';
import { visibleScreens } from './flow';
import { i360 } from '../forms/i360';

const ids = (a: Record<string, string | string[]>) => visibleScreens(i360, a).map((s) => s.question.id);

describe('I-360 flow', () => {
  it('has unique answer ids', () => {
    const seen = new Set<string>();
    for (const s of i360.sections)
      for (const q of s.questions) {
        const own = q.kind === 'fields' ? q.fields.map((f) => f.id) : q.kind === 'yesNoList' ? q.items.map((i) => i.id) : [q.id];
        for (const id of own) {
          expect(seen.has(id), id).toBe(false);
          seen.add(id);
        }
      }
  });

  it('asks the classification first', () => {
    expect(ids({})[0]).toBe('classification');
  });

  it('shows only the parts the classification needs', () => {
    const widow = ids({ classification: 'B' });
    expect(widow).toContain('deceased');
    expect(widow).toContain('account');
    expect(widow).not.toContain('abuser');
    expect(widow).not.toContain('dependent');
    expect(widow).not.toContain('safeAddress');

    const vawa = ids({ classification: 'I' });
    expect(vawa).toContain('abuser');
    expect(vawa).toContain('vawaMarriage');
    expect(vawa).toContain('childrenFiled');
    expect(vawa).toContain('safeAddress');
    expect(vawa).not.toContain('deceased');
    expect(vawa).not.toContain('account');
    expect(ids({ classification: 'J' })).not.toContain('vawaMarriage');
    expect(ids({ classification: 'K' })).not.toContain('childrenFiled');

    const sij = ids({ classification: 'C' });
    expect(sij).toContain('dependent');
    expect(sij).toContain('safeAddress');
    expect(sij).not.toContain('workedWithout');
    expect(sij).not.toContain('abuser');
    expect(sij).not.toContain('deceased');
  });

  it('follows the answers', () => {
    expect(ids({ classification: 'I', safeAddress: 'yes' })).toContain('safe');
    expect(ids({ classification: 'I' })).not.toContain('safe');
    expect(ids({ inUS: 'yes' })).toContain('arrival');
    expect(ids({ inUS: 'no' })).not.toContain('arrival');
    expect(ids({ 'mailing.country': 'United States' })).toContain('foreign');
    expect(ids({ 'mailing.country': 'Mexico' })).not.toContain('foreign');
    expect(ids({ processingPath: 'consulate' })).toContain('consulate');
    expect(ids({ processingPath: 'withI485' })).not.toContain('consulate');
    expect(ids({ otherFilings: 'yes' })).toContain('otherFilingsCount');
    expect(ids({ removal: 'yes' })).toContain('processingExplain');
    expect(ids({ classification: 'C', workedWithout: 'yes' })).not.toContain('processingExplain');
    expect(ids({ classification: 'B', workedWithout: 'yes' })).toContain('processingExplain');
    expect(ids({ classification: 'B', 'deceased.status': 'C' })).toContain('deceasedNaturalized');
    expect(ids({ classification: 'B', 'deceased.status': 'D' })).toContain('deceasedOther');
    expect(ids({ classification: 'B', remarried: 'yes' })).toContain('remarriedWhen');
    expect(ids({ classification: 'B', separated: 'yes' })).toContain('separatedExplain');
    expect(ids({ classification: 'I', 'abuser.status': 'D' })).toContain('abuserANumber');
    expect(ids({ classification: 'I', 'abuser.status': 'E' })).toContain('abuserOther');
    expect(ids({ classification: 'C', 'otherName.more0': 'yes' })).toContain('otherName1');
    expect(ids({ classification: 'C', dependent: 'no' })).toContain('dependentExplain');
    expect(ids({ classification: 'C', jurisdiction: 'yes' })).toContain('residingPlacement');
    expect(ids({ classification: 'C', jurisdiction: 'no' })).toContain('jurisdictionEnded');
    expect(ids({ classification: 'C', jurisdiction: 'no', jurisdictionEnded: 'C' })).toContain('jurisdictionExplain');
    expect(ids({ classification: 'C', reunification: 'O' })).toContain('groundsDetails');
    expect(ids({ classification: 'C', reunification: 'B', grounds: ['A'] })).not.toContain('groundsDetails');
    expect(ids({ classification: 'C', hhs: 'yes' })).toContain('hhsAltered');
    expect(ids({ 'relative.more0': 'yes', 'relative.more1': 'yes' })).toContain('relative2');
    expect(ids({ 'relative.more0': 'no' })).not.toContain('relative1');
    expect(ids({ readsEnglish: 'B' })).toContain('interpreterLanguage');
  });

  it('asks the new classifications only their own questions', () => {
    const amerasian = ids({ classification: 'A' });
    expect(amerasian).toContain('filer');
    expect(amerasian).toContain('mother');
    expect(amerasian).toContain('father.service');
    expect(amerasian).toContain('account');
    expect(amerasian).not.toContain('rwJob');
    expect(amerasian).not.toContain('deceased');
    expect(amerasian).not.toContain('petitionerName');
    expect(ids({ classification: 'A', 'mother.alive': 'yes' })).toContain('motherAddress');
    expect(ids({ classification: 'A', 'mother.alive': 'no' })).toContain('motherDeath');
    expect(ids({ classification: 'A', 'father.alive': 'no' })).not.toContain('fatherPhones');
    expect(ids({ classification: 'A', 'father.alive': 'yes' })).toEqual(expect.arrayContaining(['fatherAddress', 'fatherPhones']));
    expect(ids({ classification: 'A', 'father.service': 'military' })).toContain('fatherMilitary');
    expect(ids({ classification: 'A', 'father.service': 'neither' })).toContain('fatherExplain');
    expect(ids({ classification: 'A', 'father.service': 'civilian' })).toContain('fatherExplain');

    const rw = ids({ classification: 'D' });
    expect(rw).toEqual(expect.arrayContaining(['rw.kind', 'rwJob', 'rwSite', 'rwEmployer', 'rw.priorR', 'rwStaff', 'rw.attest', 'rwSigner', 'rwEmployerAddress', 'account']));
    expect(rw).not.toContain('filer');
    expect(rw).not.toContain('mother');
    expect(rw).not.toContain('rwDenomination');
    expect(ids({ classification: 'D', 'rw.priorR': 'yes' })).toContain('rwPriorStay');
    expect(ids({ classification: 'D', 'rw.q11': 'no' })).toContain('rwAttestExplain');
    expect(ids({ classification: 'D', 'rw.q7': 'yes' })).toContain('rw.taxBasis');
    expect(ids({ classification: 'D', 'rw.q7': 'yes', 'rw.taxBasis': 'C' })).toEqual(expect.arrayContaining(['rw.affiliatedDocs', 'rwDenomination', 'rwAttesting']));

    const own: [string, string][] = [['E', 'panama.basis'], ['F', 'physician.meets'], ['G', 'g4.role'], ['H', 'armed.service'], ['L', 'translator.country'], ['M', 'iraqi.com'], ['N', 'afghan.basis']];
    const all = own.map(([, q]) => q);
    for (const [c, q] of own) {
      const shown = ids({ classification: c });
      expect(shown, c).toContain(q);
      expect(shown.filter((id) => all.includes(id)), c).toEqual([q]);
      expect(shown, c).toContain('account');
      expect(shown, c).not.toContain('deceased');
      expect(shown, c).not.toContain('abuser');
      expect(shown, c).not.toContain('rwJob');
      expect(shown, c).not.toContain('mother');
      expect(shown.includes('filer'), c).toBe(c === 'E' || c === 'F');
    }
  });

  it('asks about the petitioner when filing for another person', () => {
    for (const c of ['A', 'C', 'E', 'F']) {
      const shown = ids({ classification: c, filer: 'other' });
      expect(shown, c).toEqual(expect.arrayContaining(['petitionerName', 'petitionerIds', 'petitionerAddress']));
      expect(shown, c).not.toContain('account');
      expect(ids({ classification: c, filer: 'self' }), c).not.toContain('petitionerName');
    }
    expect(ids({ classification: 'B', filer: 'other' })).not.toContain('petitionerName');
    expect(ids({ classification: 'C', filer: 'self' })).not.toContain('account');
  });

  it('asks for the interpreter and the preparer last', () => {
    const shown = ids({ readsEnglish: 'B', preparer: 'yes' });
    expect(shown.slice(-8)).toEqual(['interp.who', 'interp.address', 'interp.contact', 'prep.same', 'prep.who', 'prep.address', 'prep.contact', 'prep.statement']);
    expect(ids({ readsEnglish: 'B', preparer: 'yes', 'prep.same': 'yes' })).not.toContain('prep.who');
    expect(ids({ readsEnglish: 'A', preparer: 'yes' })).toContain('prep.who');
    expect(ids({ readsEnglish: 'A', preparer: 'no' })).not.toContain('interp.who');
  });
});
