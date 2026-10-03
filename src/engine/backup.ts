import type { Answers } from '../forms/types';

/**
 * A backup is one JSON file with every form's saved answers, so a person can move to another
 * device or keep a copy before clearing the browser. It never leaves the device unless the person
 * moves the file themselves.
 */

export interface SavedForm {
  answers: Answers;
  position: number;
  updated?: number;
}

export interface Backup {
  app: 'camino';
  version: 1;
  exported: string;
  forms: Record<string, SavedForm>;
}

export function makeBackup(forms: Record<string, SavedForm>, now = new Date()): Backup {
  return { app: 'camino', version: 1, exported: now.toISOString(), forms };
}

const isAnswers = (a: unknown): a is Answers =>
  !!a &&
  typeof a === 'object' &&
  !Array.isArray(a) &&
  Object.values(a).every((v) => typeof v === 'string' || (Array.isArray(v) && v.every((x) => typeof x === 'string')));

export type ParseResult = { ok: true; forms: Record<string, SavedForm>; skipped: string[] } | { ok: false };

/** Reads a backup file, keeping only forms this version of Camino knows and well-formed answers. */
export function parseBackup(text: string, knownFormIds: string[]): ParseResult {
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
    forms[id] = { answers: s.answers, position: s.position, ...(typeof s.updated === 'number' ? { updated: s.updated } : {}) };
  }
  return { ok: true, forms, skipped };
}

export const backupFileName = (now = new Date()) => `camino-respaldo-${now.toISOString().slice(0, 10)}.json`;
