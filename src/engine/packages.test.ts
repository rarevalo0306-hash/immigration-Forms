import { describe, expect, it } from 'vitest';
import { forms, formById } from '../forms';
import { packages, packageById, stepsOf } from '../forms/packages';
import { formStatus, isDone, nextStep, progressOf, type StepStatus } from './packages';
import { visibleScreens } from './flow';
import { buildProfile, prefillFor } from './profile';

describe('packages', () => {
  it('list real forms, each once per package', () => {
    for (const p of packages) {
      const ids = stepsOf(p).map((s) => s.formId);
      expect(new Set(ids).size, p.id).toBe(ids.length);
      for (const id of ids) expect(formById(id), `${p.id} ${id}`).toBeTruthy();
      expect(stepsOf(p).some((s) => !s.optional), p.id).toBe(true);
    }
    expect(new Set(packages.map((p) => p.id)).size).toBe(packages.length);
  });

  it('presets answer real questions with real options, shown from the start', () => {
    for (const p of packages)
      for (const step of stepsOf(p))
        for (const [id, value] of Object.entries(step.preset ?? {})) {
          const form = formById(step.formId)!;
          const q = form.sections.flatMap((s) => s.questions).find((q) => q.id === id);
          expect(q?.kind, `${p.id} ${step.formId} ${id}`).toBe('choice');
          if (q?.kind === 'choice') expect(q.options.map((o) => o.value), `${p.id} ${step.formId} ${id}`).toContain(value);
          // The preset question is still asked, so the person sees and can change it.
          expect(visibleScreens(form, step.preset!).some((s) => s.question.id === id), `${step.formId} ${id}`).toBe(true);
        }
  });

  it('a form is done once its review page is reached', () => {
    const g = formById('g-1145')!;
    expect(formStatus(null)).toBe('new');
    expect(formStatus({ answers: {} })).toBe('new');
    expect(formStatus({ answers: { 'name.family': 'Ruiz' } })).toBe('started');
    expect(formStatus({ answers: { 'name.family': 'Ruiz' }, done: true })).toBe('done');
    const answers = { 'name.family': 'Ruiz' };
    expect(isDone(g, answers, visibleScreens(g, answers).length)).toBe(true);
    expect(isDone(g, answers, 0)).toBe(false);
  });

  it('points to the next required form, skipping optional and finished ones', () => {
    const pkg = packageById('matrimonio')!;
    const status: Record<string, StepStatus> = { 'i-130': 'done', 'i-130a': 'done' };
    const of = (id: string) => status[id] ?? 'new';
    expect(nextStep(pkg, 'i-130a', of)?.formId).toBe('i-485');
    expect(nextStep(pkg, 'i-864', of)?.formId).toBe('i-485');
    expect(nextStep(pkg, 'i-765', of)?.formId).toBe('i-485');
    expect(progressOf(pkg, of)).toEqual({ done: 2, total: 4 });
    const all = (id: string): StepStatus => (['i-130', 'i-130a', 'i-485', 'i-864'].includes(id) ? 'done' : 'new');
    expect(nextStep(pkg, 'i-864', all)).toBeUndefined();
  });

  it('in the marriage package, the I-130 starts the other forms with both people', () => {
    const profile = buildProfile(forms, [
      {
        formId: 'i-130',
        updated: 1,
        answers: { relationship: 'spouse', 'pet.name.family': 'Hernández', 'pet.name.given': 'José', 'ben.name.family': 'López', 'ben.name.given': 'Ana', 'ben.dob': '02/02/1992' },
      },
    ]);
    const start = (id: string) => prefillFor(formById(id)!, profile).answers;
    expect(start('i-130a')['name.family']).toBe('López');
    expect(start('i-485')['name.family']).toBe('López');
    expect(start('i-765')['name.given']).toBe('Ana');
    expect(start('i-864')['name.family']).toBe('Hernández');
    expect(start('i-864')['principal.family']).toBe('López');
  });
});
