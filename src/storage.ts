import type { Lang } from './i18n';
import type { Answers } from './forms/types';

export interface Saved {
  answers: Answers;
  /** Index into the visible screens; -1 = welcome, screens.length = review. */
  position: number;
  lang: Lang;
}

const key = (formId: string) => `camino:${formId}:v1`;

export function load(formId: string): Saved | null {
  try {
    const raw = localStorage.getItem(key(formId));
    if (!raw) return null;
    const s = JSON.parse(raw) as Saved;
    return s && typeof s.answers === 'object' ? s : null;
  } catch {
    return null;
  }
}

export function save(formId: string, s: Saved) {
  try {
    localStorage.setItem(key(formId), JSON.stringify(s));
  } catch {
    // Storage can be unavailable (private mode); the app still works for this visit.
  }
}

export function clear(formId: string) {
  try {
    localStorage.removeItem(key(formId));
  } catch {
    // ignore
  }
}
