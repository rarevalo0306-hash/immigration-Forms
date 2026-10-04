import type { Answers, FormDefinition } from '../forms/types';
import { stepsOf, type PackageDefinition, type PackageStep } from '../forms/packages';
import { visibleScreens } from './flow';

export type StepStatus = 'new' | 'started' | 'done';

/** Whether a position is the form's review page, i.e. the person got to the end. */
export const isDone = (form: FormDefinition, answers: Answers, position: number) => position >= visibleScreens(form, answers).length;

/** A form is done once the person reached its review page (saved as `done`, so no form needs loading). */
export function formStatus(saved: { answers: Answers; done?: boolean } | null): StepStatus {
  if (!saved || !Object.keys(saved.answers).length) return 'new';
  return saved.done ? 'done' : 'started';
}

/** The next required form to work on after `currentFormId`, or the first one still pending. */
export function nextStep(pkg: PackageDefinition, currentFormId: string, status: (formId: string) => StepStatus): PackageStep | undefined {
  const steps = stepsOf(pkg);
  const at = steps.findIndex((s) => s.formId === currentFormId);
  const pending = (s: PackageStep) => !s.optional && s.formId !== currentFormId && status(s.formId) !== 'done';
  return steps.slice(at + 1).find(pending) ?? steps.find(pending);
}

/** How many of the package's required forms are done, out of how many. */
export function progressOf(pkg: PackageDefinition, status: (formId: string) => StepStatus) {
  const required = stepsOf(pkg).filter((s) => !s.optional);
  return { done: required.filter((s) => status(s.formId) === 'done').length, total: required.length };
}
