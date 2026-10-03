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

/** Every form's saved answers, for a backup file. */
export function exportAll(formIds: string[]): Record<string, Saved> {
  const out: Record<string, Saved> = {};
  for (const id of formIds) {
    const s = load(id);
    if (s && Object.keys(s.answers).length) out[id] = s;
  }
  return out;
}

/** Restores forms from a backup as they were saved, keeping their own "last saved" time. */
export function importAll(forms: Record<string, Saved>): boolean {
  try {
    for (const [id, s] of Object.entries(forms)) localStorage.setItem(key(id), JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

/** Erases every form's answers on this device. The language choice stays. */
export function clearAll() {
  try {
    for (const k of Object.keys(localStorage)) if (/^camino:.+:v1$/.test(k)) localStorage.removeItem(k);
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
