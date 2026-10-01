import type { Lang } from './i18n';
import type { Answers } from './forms/types';

export interface Saved {
  answers: Answers;
  /** Index into the visible screens; screens.length = review. */
  position: number;
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

const LANG_KEY = 'camino:lang';

export function loadLang(): Lang | null {
  try {
    const v = localStorage.getItem(LANG_KEY);
    return v === 'es' || v === 'en' ? v : null;
  } catch {
    return null;
  }
}

export function saveLang(lang: Lang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // ignore
  }
}
