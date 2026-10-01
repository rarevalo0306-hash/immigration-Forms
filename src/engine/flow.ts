import type { Answers, FormDefinition, Question, Section } from '../forms/types';
import { normalize, validateField } from './validation';
import type { T } from '../i18n';

export interface Screen {
  section: Section;
  sectionIndex: number;
  question: Question;
}

/** Every question the person should see, given what they have answered so far. */
export function visibleScreens(form: FormDefinition, answers: Answers): Screen[] {
  const out: Screen[] = [];
  form.sections.forEach((section, sectionIndex) => {
    for (const question of section.questions) {
      if (!question.showIf || question.showIf(answers)) out.push({ section, sectionIndex, question });
    }
  });
  return out;
}

export type Errors = Record<string, T>;

export function validateQuestion(q: Question, answers: Answers): Errors {
  const errors: Errors = {};
  if (q.kind === 'choice') {
    if (!answers[q.id]) errors[q.id] = { es: 'Elija una opción.', en: 'Choose an option.' };
    return errors;
  }
  for (const f of q.fields) {
    const e = validateField(f, String(answers[f.id] ?? ''));
    if (e) errors[f.id] = e;
  }
  return errors;
}

/** Applies each field's normalization (A-Number padding, phone format…) to a question's answers. */
export function normalizeQuestion(q: Question, answers: Answers): Answers {
  if (q.kind !== 'fields') return answers;
  const next = { ...answers };
  for (const f of q.fields) {
    const v = next[f.id];
    if (typeof v === 'string') next[f.id] = normalize(f.type, v);
  }
  return next;
}

/** Drops answers to questions that are no longer shown, so a changed "Yes" doesn't leave stale details behind. */
export function pruneHidden(form: FormDefinition, answers: Answers): Answers {
  // Hiding one question can hide others that depended on it, so repeat until nothing changes.
  let current = answers;
  for (;;) {
    const keep = new Set<string>();
    for (const { question } of visibleScreens(form, current)) {
      keep.add(question.id);
      if (question.kind === 'fields') question.fields.forEach((f) => keep.add(f.id));
    }
    const next = Object.fromEntries(Object.entries(current).filter(([k]) => keep.has(k)));
    if (Object.keys(next).length === Object.keys(current).length) return next;
    current = next;
  }
}
