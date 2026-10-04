import type { Lang } from './i18n';
import type { Answers } from './forms/types';

export interface Saved {
  answers: Answers;
  /** Index into the visible screens; screens.length = review. */
  position: number;
  /** When it was last saved (ms since 1970). Older saves don't have it. */
  updated?: number;
  /** Whether the person got to the review page, so lists can show "ready" without loading the form. */
  done?: boolean;
  /** How many questions the form had for these answers when saved, for the home screen's progress bar. */
  total?: number;
}

/**
 * Cases: one device can hold several people's forms (a family, or a helper filling in for
 * others). Each case keeps its own answers, and data reuse only looks inside the active case.
 * The first case uses the original keys (`camino:<form>:v1`), so saves from before cases existed
 * keep working; other cases use `camino:<case>:<form>:v1`.
 */
export interface CaseInfo {
  id: string;
  /** Empty for the first case until the person names it. */
  name: string;
}

interface Cases {
  active: string;
  list: CaseInfo[];
}

const CASES_KEY = 'camino:cases';
export const FIRST_CASE = 'main';
const firstCase = (): Cases => ({ active: FIRST_CASE, list: [{ id: FIRST_CASE, name: '' }] });

function readCases(): Cases {
  try {
    const c = JSON.parse(localStorage.getItem(CASES_KEY) ?? 'null') as Cases | null;
    if (c && Array.isArray(c.list) && c.list.length && c.list.some((x) => x.id === c.active)) return c;
  } catch {
    // fall through
  }
  return firstCase();
}

function writeCases(c: Cases) {
  try {
    localStorage.setItem(CASES_KEY, JSON.stringify(c));
  } catch {
    // ignore
  }
}

export const listCases = (): CaseInfo[] => readCases().list;
export const activeCase = (): CaseInfo => {
  const c = readCases();
  return c.list.find((x) => x.id === c.active)!;
};

export function setActiveCase(id: string) {
  const c = readCases();
  if (c.list.some((x) => x.id === id)) writeCases({ ...c, active: id });
}

/** Adds a case and makes it the active one. */
export function createCase(name: string): string {
  const c = readCases();
  const id = `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  writeCases({ active: id, list: [...c.list, { id, name: name.trim() }] });
  return id;
}

export function renameCase(id: string, name: string) {
  const c = readCases();
  writeCases({ ...c, list: c.list.map((x) => (x.id === id ? { ...x, name: name.trim() } : x)) });
}

/** Whether a storage key holds a form of this case. */
const keyOfCase = (k: string, caseId: string) =>
  caseId === FIRST_CASE ? /^camino:[^:]+:v1$/.test(k) : k.startsWith(`camino:${caseId}:`) && k.endsWith(':v1');

/** Erases a case's answers and removes it; the first remaining case becomes active. */
export function deleteCase(id: string) {
  try {
    for (const k of Object.keys(localStorage)) if (keyOfCase(k, id)) localStorage.removeItem(k);
  } catch {
    // ignore
  }
  const c = readCases();
  const list = c.list.filter((x) => x.id !== id);
  if (!list.length) return writeCases(firstCase());
  writeCases({ active: c.active === id ? list[0].id : c.active, list });
}

const key = (formId: string) => {
  const c = readCases().active;
  return c === FIRST_CASE ? `camino:${formId}:v1` : `camino:${c}:${formId}:v1`;
};

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

/**
 * Which checklist documents the person ticked, per form (or `pkg-<id>` for a package), in the
 * active case. Kept apart from the answers so the form flow never drops them.
 */
export function loadChecked(listId: string): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(key(`${listId}.docs`)) ?? '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function saveChecked(listId: string, ids: string[]) {
  try {
    localStorage.setItem(key(`${listId}.docs`), JSON.stringify(ids));
  } catch {
    // ignore
  }
}

/**
 * The citizenship study section's state in the active case: settings, flash-card boxes and past
 * interview practices (see study/engine.ts). Stored as JSON; the study screen validates it.
 */
export function loadStudy(): unknown {
  try {
    return JSON.parse(localStorage.getItem(key('study')) ?? 'null');
  } catch {
    return null;
  }
}

export function saveStudy(state: unknown) {
  try {
    localStorage.setItem(key('study'), JSON.stringify(state));
  } catch {
    // ignore
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

/** Every form's saved answers in the active case, for a backup file. */
export function exportAll(formIds: string[]): Record<string, Saved> {
  const out: Record<string, Saved> = {};
  for (const id of formIds) {
    const s = load(id);
    if (s && Object.keys(s.answers).length) out[id] = s;
  }
  return out;
}

/** Restores forms from a backup into the active case, keeping their own "last saved" time. */
export function importAll(forms: Record<string, Saved>): boolean {
  try {
    for (const [id, s] of Object.entries(forms)) localStorage.setItem(key(id), JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

/** Ticked checklist documents in the active case, for a backup file. */
export function exportChecked(listIds: string[]): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const id of listIds) {
    const ticks = loadChecked(id);
    if (ticks.length) out[id] = ticks;
  }
  return out;
}

/** Erases every case and every form's answers on this device. The language choice stays. */
export function clearAll() {
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith('camino:') && k !== LANG_KEY) localStorage.removeItem(k);
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
