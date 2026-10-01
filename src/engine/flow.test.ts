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
