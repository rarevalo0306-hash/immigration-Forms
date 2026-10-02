import type { Lang } from './i18n';
import type { Answers } from './forms/types';

export interface Saved {
  answers: Answers;
  /** Index into the visible screens; screens.length = review. */
  position: number;
  /** When it was last saved (ms since 1970). Older saves don't have it. */
  updated?: number;
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
    localStorage.setItem(key(formId), JSON.stringify({ ...s, updated: Date.now() }));
  } catch {
    // Storage can be unavailable (private mode); the app still works for this visit.
  }
}

/** Every form with saved answers on this device, except `skip`. */
export function loadAll(formIds: string[], skip?: string): { formId: string; answers: Answers; updated: number }[] {
  const out = [];
  for (const formId of formIds) {
    if (formId === skip) continue;
    const s = load(formId);
    if (s && Object.keys(s.answers).length) out.push({ formId, answers: s.answers, updated: s.updated ?? 0 });
  }
  return out;
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
