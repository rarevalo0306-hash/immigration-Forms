import { describe, expect, it } from 'vitest';
import { i765 } from '../forms/i765';
import { pruneHidden, validateQuestion, visibleScreens } from './flow';

const ids = (a: Record<string, string>) => visibleScreens(i765, a).map((s) => s.question.id);

describe('I-765 flow', () => {
  it('has unique question and field ids', () => {
    const seen = new Set<string>();
    for (const s of i765.sections)
      for (const q of s.questions) {
        const all = q.kind === 'fields' ? [q.id, ...q.fields.map((f) => f.id)] : [q.id];
        for (const id of new Set(all)) {
          expect(seen.has(id), id).toBe(false);
          seen.add(id);
        }
      }
  });

  it('asks follow-ups only when they apply', () => {
    expect(ids({})).not.toContain('otherName');
    expect(ids({ hasOtherNames: 'yes' })).toContain('otherName');
    expect(ids({ sameAddress: 'no' })).toContain('physical');
    expect(ids({ readsEnglish: 'interpreter' })).toContain('interpreterLanguage');
  });

  it('asks category-specific questions', () => {
    expect(ids({ category: '(c)(8)' })).toContain('arrested');
    expect(ids({ category: '(c)(3)(C)' })).toContain('stem');
    expect(ids({ category: '(c)(26)' })).toContain('h1b');
    expect(ids({ category: '(c)(3)(B)' })).toContain('sevis');
    expect(ids({ category: 'other', 'category.other': '(c)(36)' })).toContain('i140');
    expect(ids({ category: 'other', 'category.other': '(c)(35)' })).toContain('arrested');
    expect(ids({ category: '(c)(9)' })).not.toContain('arrested');
  });

  it('drops answers to questions that become hidden, including chained ones', () => {
    // Switching away from "other" hides the typed category, which in turn hid the (c)(35) follow-ups.
    const pruned = pruneHidden(i765, { category: '(c)(9)', 'category.other': '(c)(35)', 'i140.receipt': 'IOE0123456789', reason: 'initial' });
    expect(pruned).toEqual({ category: '(c)(9)', reason: 'initial' });
  });

  it('requires a choice and required fields', () => {
    const reason = i765.sections[0].questions[0];
    expect(validateQuestion(reason, {})).toHaveProperty('reason');
    const name = i765.sections[1].questions[0];
    expect(Object.keys(validateQuestion(name, { 'name.family': 'García' }))).toEqual(['name.given']);
  });
});

describe('N-400 flow', async () => {
  const { n400 } = await import('../forms/n400');
  const ids = (a: Record<string, string>) => visibleScreens(n400, a).map((s) => s.question.id);

  it('has unique answer ids', () => {
    const seen = new Set<string>();
    for (const s of n400.sections)
      for (const q of s.questions) {
        const own = q.kind === 'fields' ? q.fields.map((f) => f.id) : q.kind === 'yesNoList' ? q.items.map((i) => i.id) : [q.id];
        for (const id of own) {
          expect(seen.has(id), id).toBe(false);
          seen.add(id);
        }
      }
  });

  it('chains table rows on "another one?"', () => {
    expect(ids({})).not.toContain('prevHome1');
    expect(ids({ 'prevHome.more0': 'yes' })).toContain('prevHome1');
    expect(ids({ 'prevHome.more0': 'yes' })).not.toContain('prevHome2');
    expect(ids({ 'prevHome.more0': 'yes', 'prevHome.more1': 'yes' })).toContain('prevHome2');
    expect(ids({ 'prevHome.more0': 'yes', 'prevHome.more1': 'no', 'prevHome.more2': 'yes' })).not.toContain('prevHome3');
    expect(ids({})).toContain('job1');
    expect(ids({ 'trip.more0': 'yes', 'trip.more1': 'yes', 'trip.more2': 'yes' })).toContain('trip3');
  });

  it('asks spouse details only for spouse-based filing', () => {
    expect(ids({ marital: 'married', eligibility: 'A' })).not.toContain('spouse');
    expect(ids({ marital: 'married', eligibility: 'B' })).toContain('spouse');
    expect(ids({ marital: 'married', eligibility: 'D' })).toContain('spouseEmployerQ');
  });

  it('asks for explanations of concerning answers', () => {
    expect(ids({ 'p9.17.c': 'yes' })).toContain('explain.17.c');
    expect(ids({ 'p9.31': 'no' })).toContain('explain.31');
    expect(ids({ 'p9.31': 'yes' })).not.toContain('explain.31');
    expect(ids({ 'p9.15.b': 'yes' })).toContain('crime1');
    expect(ids({ sex: 'female' })).not.toContain('p9i');
  });
});

describe('I-130 flow', async () => {
  const { i130 } = await import('../forms/i130');
  const ids = (a: Record<string, string>) => visibleScreens(i130, a).map((s) => s.question.id);

  it('has unique answer ids', () => {
    const seen = new Set<string>();
    for (const s of i130.sections)
      for (const q of s.questions) {
        const own = q.kind === 'fields' ? q.fields.map((f) => f.id) : q.kind === 'yesNoList' ? q.items.map((i) => i.id) : [q.id];
        for (const id of own) {
          expect(seen.has(id), id).toBe(false);
          seen.add(id);
        }
      }
  });

  it('follows the relationship and status', () => {
    expect(ids({ relationship: 'sibling' })).toContain('siblingAdopted');
    expect(ids({ relationship: 'child' })).toContain('childRelationship');
    expect(ids({ relationship: 'spouse' })).toContain('lastTogether');
    expect(ids({ relationship: 'child' })).not.toContain('lastTogether');
    expect(ids({ 'pet.status': 'lpr' })).toContain('pet.lpr');
    expect(ids({ 'pet.status': 'citizen', 'pet.citizenHow': 'birth' })).not.toContain('pet.hasCertificate');
    expect(ids({ 'ben.everInUS': 'yes', 'ben.inUSNow': 'yes' })).toContain('ben.entry');
    expect(ids({ 'pet.marital': 'single' })).not.toContain('pet.spouse1');
  });
});

describe('I-485 flow', async () => {
  const { i485 } = await import('../forms/i485');
  const ids = (a: Record<string, string>) => visibleScreens(i485, a).map((s) => s.question.id);

  it('has unique answer ids', () => {
    const seen = new Set<string>();
    for (const s of i485.sections)
      for (const q of s.questions) {
        const own = q.kind === 'fields' ? q.fields.map((f) => f.id) : q.kind === 'yesNoList' ? q.items.map((i) => i.id) : [q.id];
        for (const id of own) {
          expect(seen.has(id), id).toBe(false);
          seen.add(id);
        }
      }
  });

  it('follows entry, category and public charge', () => {
    expect(ids({ arrivalHow: 'ewi' })).not.toContain('i94');
    expect(ids({ arrivalHow: 'admitted' })).toContain('arrivalAs');
    expect(ids({ category: 'asylee' })).toContain('asylumDateQ');
    expect(ids({ category: 'ir-spouse' })).not.toContain('asylumDateQ');
    expect(ids({ 'publicCharge.exemption': '23' })).toContain('pc.income');
    expect(ids({ 'publicCharge.exemption': '3' })).not.toContain('pc.income');
    expect(ids({ 'publicCharge.exemption': '23', 'pc.benefits': 'yes', 'pc.benefit.more1': 'yes' })).toContain('pc.benefit2');
    expect(ids({ 'p9.22': 'yes' })).toContain('explain.22');
    expect(ids({ 'p9.20': 'yes' })).not.toContain('explain.20');
    expect(ids({ marital: 'divorced', timesMarried: '1' })).toContain('priorSpouse');
    expect(ids({ marital: 'married', timesMarried: '1' })).not.toContain('priorSpouse');
  });
});

describe('I-864 flow', async () => {
  const { i864 } = await import('../forms/i864');
  const ids = (a: Record<string, string>) => visibleScreens(i864, a).map((s) => s.question.id);

  it('has unique answer ids', () => {
    const seen = new Set<string>();
    for (const s of i864.sections)
      for (const q of s.questions) {
        const own = q.kind === 'fields' ? q.fields.map((f) => f.id) : q.kind === 'yesNoList' ? q.items.map((i) => i.id) : [q.id];
        for (const id of own) {
          expect(seen.has(id), id).toBe(false);
          seen.add(id);
        }
      }
  });

  it('follows the basis, family, income and assets answers', () => {
    expect(ids({ basis: 'petitioner' })).toContain('activeDuty');
    expect(ids({ basis: 'firstJoint' })).not.toContain('activeDuty');
    expect(ids({ basis: 'substitute' })).toContain('substituteRelationship');
    expect(ids({ familyTiming: 'none' })).not.toContain('member1');
    expect(ids({ familyTiming: 'same', 'member.more1': 'yes' })).toContain('member2');
    expect(ids({ employment: 'retired' })).toContain('retired');
    expect(ids({ employment: 'retired' })).not.toContain('employed');
    expect(ids({ 'hhIncome.more0': 'yes', i864aStatus: 'intending' })).toContain('i864aIntendingName');
    expect(ids({ filedTaxes: 'no' })).toContain('notRequired');
    expect(ids({ useAssets: 'yes', sponsorsPrincipal: 'no' })).not.toContain('principalAssets');
    expect(ids({ readsEnglish: 'B' })).toContain('interpreterLanguage');
  });
});

describe('I-864A flow', async () => {
  const { i864a } = await import('../forms/i864a');
  const ids = (a: Record<string, string>) => visibleScreens(i864a, a).map((s) => s.question.id);

  it('has unique answer ids', () => {
    const seen = new Set<string>();
    for (const s of i864a.sections)
      for (const q of s.questions) {
        const own = q.kind === 'fields' ? q.fields.map((f) => f.id) : q.kind === 'yesNoList' ? q.items.map((i) => i.id) : [q.id];
        for (const id of own) {
          expect(seen.has(id), id).toBe(false);
          seen.add(id);
        }
      }
  });

  it('follows the relationship, assets, immigrants and statements', () => {
    expect(ids({ relationship: 'A' })).not.toContain('relative');
    expect(ids({ relationship: 'C', relative: '5' })).toContain('relativeOther');
    expect(ids({ useAssets: 'no' })).not.toContain('assets');
    expect(ids({})).toContain('imm1');
    expect(ids({ 'imm.more1': 'yes' })).toContain('imm2');
    expect(ids({ 'sponsor.readsEnglish': 'B' })).toContain('sponsor.readsEnglish.languageQ');
    expect(ids({ readsEnglish: 'A' })).not.toContain('readsEnglish.languageQ');
  });
});

describe('I-131 flow', async () => {
  const { i131 } = await import('../forms/i131');
  const ids = (a: Record<string, string>) => visibleScreens(i131, a).map((s) => s.question.id);

  it('has unique answer ids', () => {
    const seen = new Set<string>();
    for (const s of i131.sections)
      for (const q of s.questions) {
        const own = q.kind === 'fields' ? q.fields.map((f) => f.id) : q.kind === 'yesNoList' ? q.items.map((i) => i.id) : [q.id];
        for (const id of own) {
          expect(seen.has(id), id).toBe(false);
          seen.add(id);
        }
      }
  });

  it('asks only the parts of the chosen document', () => {
    const ap = ids({ appType: '5', apBasis: '9' });
    expect(ap).toContain('apReceipt');
    expect(ap).toContain('tripDetails');
    expect(ap).toContain('entry');
    expect(ap).not.toContain('deliverTo');
    expect(ap).not.toContain('timeOutside');
    expect(ids({ appType: '5', apBasis: '5' })).toContain('apI485');
    expect(ids({ appType: '5', apBasis: '8' })).not.toContain('apReceipt');
    expect(ids({ appType: '5', apBasis: '17' })).toContain('apExplain');
    const reentry = ids({ appType: '1', deliverTo: 'B', notice: 'B' });
    expect(reentry).toContain('timeOutside');
    expect(reentry).toContain('noticeAddress');
    expect(reentry).not.toContain('tripDetails');
    expect(reentry).not.toContain('entry');
    expect(ids({ appType: '2' })).toContain('rtd.questions');
    expect(ids({ appType: '2', 'rtd.3a': 'yes' })).toContain('rtdExplain');
    expect(ids({ appType: '3', 'rtd.beforeDeparture': 'no', 'rtd.outside': 'yes' })).toContain('rtdLocation');
    expect(ids({ appType: '4' })).toContain('tps');
    expect(ids({ replacement: 'yes', replacementReason: '2' })).not.toContain('corrections');
    expect(ids({ replacement: 'yes', replacementReason: '4' })).toContain('corrections');
  });
});

describe('I-90 flow', async () => {
  const { i90 } = await import('../forms/i90');
  const ids = (a: Record<string, string>) => visibleScreens(i90, a).map((s) => s.question.id);

  it('has unique answer ids', () => {
    const seen = new Set<string>();
    for (const s of i90.sections)
      for (const q of s.questions) {
        const own = q.kind === 'fields' ? q.fields.map((f) => f.id) : q.kind === 'yesNoList' ? q.items.map((i) => i.id) : [q.id];
        for (const id of own) {
          expect(seen.has(id), id).toBe(false);
          seen.add(id);
        }
      }
  });

  it('asks the reasons that match the status', () => {
    expect(ids({ status: '1a' })).toContain('reasonA');
    expect(ids({ status: '1a' })).not.toContain('reasonB');
    expect(ids({ status: '1c' })).toContain('reasonB');
    expect(ids({ status: '1b', reasonA: '2h1' })).toContain('poe');
    expect(ids({ nameChanged: 'Y' })).toContain('cardName');
    expect(ids({ nameChanged: 'NA' })).not.toContain('cardName');
    expect(ids({ abandoned: 'yes' })).toContain('explainHistory');
    expect(ids({ enteredWithVisa: 'no' })).not.toContain('arrival');
    expect(ids({ accommodation: 'yes' })).toContain('accommodationDetails');
  });
});

describe('I-751 flow', async () => {
  const { i751 } = await import('../forms/i751');
  const ids = (a: Record<string, string | string[]>) => visibleScreens(i751, a).map((s) => s.question.id);

  it('has unique answer ids', () => {
    const seen = new Set<string>();
    for (const s of i751.sections)
      for (const q of s.questions) {
        const own = q.kind === 'fields' ? q.fields.map((f) => f.id) : q.kind === 'yesNoList' ? q.items.map((i) => i.id) : [q.id];
        for (const id of own) {
          expect(seen.has(id), id).toBe(false);
          seen.add(id);
        }
      }
  });

  it('asks the spouse’s statement only on a joint petition', () => {
    expect(ids({ basis: 'A' })).toContain('spouse.readsEnglish');
    expect(ids({ basis: 'A' })).not.toContain('waivers');
    expect(ids({ basis: 'waiver' })).toContain('waivers');
    expect(ids({ basis: 'waiver' })).not.toContain('spouse.readsEnglish');
    expect(ids({ q20: 'yes' })).toContain('explainArrests');
    expect(ids({ q22: 'yes' })).toContain('listAddresses');
    expect(ids({ 'spouse.livesWithYou': 'no' })).toContain('spouse.address');
    expect(ids({ 'child.more0': 'yes', 'child.more1': 'yes' })).toContain('child2');
    expect(ids({ 'acc.children': 'yes' })).toContain('accDetails');
  });
});

describe('I-129F flow', async () => {
  const { i129f } = await import('../forms/i129f');
  const ids = (a: Record<string, string>) => visibleScreens(i129f, a).map((s) => s.question.id);

  it('has unique answer ids', () => {
    const seen = new Set<string>();
    for (const s of i129f.sections)
      for (const q of s.questions) {
        const own = q.kind === 'fields' ? q.fields.map((f) => f.id) : q.kind === 'yesNoList' ? q.items.map((i) => i.id) : [q.id];
        for (const id of own) {
          expect(seen.has(id), id).toBe(false);
          seen.add(id);
        }
      }
  });

  it('follows the answers', () => {
    expect(ids({ classification: 'B' })).toContain('filedI130');
    expect(ids({ classification: 'A' })).not.toContain('filedI130');
    expect(ids({ 'pet.mailingSame': 'no' })).toContain('pet.home1');
    expect(ids({ 'pet.mailingSame': 'yes' })).not.toContain('pet.home1');
    expect(ids({ 'pet.citizenVia': 'A' })).not.toContain('pet.certificate');
    expect(ids({ 'pet.citizenVia': 'B', 'pet.certificate': 'yes' })).toContain('pet.certificateDetails');
    expect(ids({ 'ben.everInUS': 'yes', 'ben.inUSNow': 'yes' })).toContain('ben.entry');
    expect(ids({ 'ben.kids': 'yes', 'ben.kid.withBen': 'no' })).toContain('ben.kidAddress');
    expect(ids({ met: 'A' })).not.toContain('metDescribe');
    expect(ids({ 'crime.2b': 'yes' })).toContain('crime.battered');
    expect(ids({ 'crime.4a': 'yes' })).not.toContain('crime.battered');
    expect(ids({ 'crime.4a': 'yes' })).toContain('crimeDescribe');
  });
});

describe('I-821D flow', async () => {
  const { i821d } = await import('../forms/i821d');
  const ids = (a: Record<string, string>) => visibleScreens(i821d, a).map((s) => s.question.id);

  it('has unique answer ids', () => {
    const seen = new Set<string>();
    for (const s of i821d.sections)
      for (const q of s.questions) {
        const own = q.kind === 'fields' ? q.fields.map((f) => f.id) : q.kind === 'yesNoList' ? q.items.map((i) => i.id) : [q.id];
        for (const id of own) {
          expect(seen.has(id), id).toBe(false);
          seen.add(id);
        }
      }
  });

  it('asks Part 3 only on an initial request', () => {
    expect(ids({ requestType: 'renewal' })).toContain('renewalExpires');
    expect(ids({ requestType: 'renewal' })).not.toContain('education');
    expect(ids({ requestType: 'initial' })).toContain('education');
    expect(ids({ requestType: 'initial' })).toContain('initialNotice');
    expect(ids({ requestType: 'initial', military: 'yes' })).toContain('militaryDetails');
    expect(ids({ removal: 'yes' })).toContain('removalStatus');
    expect(ids({ presentSame: 'no' })).toContain('present');
    expect(ids({ 'address.more0': 'yes', 'address.more1': 'yes' })).toContain('address2');
    expect(ids({ 'p4.4': 'yes' })).toContain('p4Explain');
  });
});

describe('I-821 flow', async () => {
  const { i821 } = await import('../forms/i821');
  const ids = (a: Record<string, string>) => visibleScreens(i821, a).map((s) => s.question.id);

  it('has unique answer ids', () => {
    const seen = new Set<string>();
    for (const s of i821.sections)
      for (const q of s.questions) {
        const own = q.kind === 'fields' ? q.fields.map((f) => f.id) : q.kind === 'yesNoList' ? q.items.map((i) => i.id) : [q.id];
        for (const id of own) {
          expect(seen.has(id), id).toBe(false);
          seen.add(id);
        }
      }
  });

  it('follows the answers', () => {
    expect(ids({ appType: '1b' })).toContain('grantedBy');
    expect(ids({ appType: '1a' })).toContain('priorApplications');
    expect(ids({ mailingSame: 'no' })).toContain('home');
    expect(ids({ proceedings: 'yes' })).toContain('proceedingDetails');
    expect(ids({ otherCountries: 'yes' })).toContain('otherCountryDetails');
    expect(ids({ offered: 'yes' })).toContain('offeredDetails');
    expect(ids({ 'p7.36': 'yes' })).toContain('p7Explain');
    expect(ids({})).not.toContain('p7Explain');
  });
});
