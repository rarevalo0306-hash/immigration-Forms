import type { Answers } from '../forms/types';
import { isEmptyStudy, parseStudy, type StudyState } from '../study/state';

/**
 * A backup is one JSON file with every form's saved answers, so a person can move to another
 * device or keep a copy before clearing the browser. It never leaves the device unless the person
 * moves the file themselves.
 */

export interface SavedForm {
  answers: Answers;
  position: number;
  updated?: number;
  done?: boolean;
}

export interface Backup {
  app: 'camino';
  version: 1;
  exported: string;
  forms: Record<string, SavedForm>;
  /** Ticked documents per checklist (a form id, or `pkg-<id>` for a package). Older backups lack it. */
  checklists?: Record<string, string[]>;
  /** The citizenship study section's settings and progress (study/state.ts). Older backups lack it. */
  study?: unknown;
}

export function makeBackup(forms: Record<string, SavedForm>, now = new Date(), checklists: Record<string, string[]> = {}, study?: StudyState): Backup {
  return {
    app: 'camino',
    version: 1,
    exported: now.toISOString(),
    forms,
    ...(Object.keys(checklists).length ? { checklists } : {}),
    ...(study && !isEmptyStudy(study) ? { study } : {}),
  };
}

const isAnswers = (a: unknown): a is Answers =>
  !!a &&
  typeof a === 'object' &&
  !Array.isArray(a) &&
  Object.values(a).every((v) => typeof v === 'string' || (Array.isArray(v) && v.every((x) => typeof x === 'string')));

export type ParseResult =
  | { ok: true; forms: Record<string, SavedForm>; checklists: Record<string, string[]>; study?: StudyState; skipped: string[] }
  | { ok: false };

/** Reads a backup file, keeping only forms this version of Camino knows and well-formed answers. */
export function parseBackup(text: string, knownFormIds: string[], knownListIds: string[] = knownFormIds): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false };
  }
  const b = data as Partial<Backup>;
  if (!b || b.app !== 'camino' || b.version !== 1 || !b.forms || typeof b.forms !== 'object') return { ok: false };
  const known = new Set(knownFormIds);
  const forms: Record<string, SavedForm> = {};
  const skipped: string[] = [];
  for (const [id, s] of Object.entries(b.forms)) {
    const ok = known.has(id) && s && isAnswers(s.answers) && Number.isInteger(s.position) && s.position >= 0;
    if (!ok) {
      skipped.push(id);
      continue;
    }
    forms[id] = { answers: s.answers, position: s.position, ...(typeof s.updated === 'number' ? { updated: s.updated } : {}), ...(s.done === true ? { done: true } : {}) };
  }
  const lists = new Set(knownListIds);
  const checklists: Record<string, string[]> = {};
  if (b.checklists && typeof b.checklists === 'object')
    for (const [id, ticks] of Object.entries(b.checklists))
      if (lists.has(id) && Array.isArray(ticks) && ticks.every((x) => typeof x === 'string')) checklists[id] = ticks;
  const study = b.study === undefined ? undefined : parseStudy(b.study);
  return { ok: true, forms, checklists, ...(study && !isEmptyStudy(study) ? { study } : {}), skipped };
}

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);

/** `camino-respaldo-ana-lopez-2026-10-03.json`; the case name is left out when it has none. */
export const backupFileName = (now = new Date(), caseName = '') =>
  ['camino-respaldo', slug(caseName), now.toISOString().slice(0, 10)].filter(Boolean).join('-') + '.json';
