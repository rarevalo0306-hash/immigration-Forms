import type { FormDefinition } from './types';

/**
 * Loads one form's definition on demand, so the first screen doesn't download all of them. Each
 * form lives in `./<id without dashes>.ts` and exports it under that name (i-485 → i485).
 */
const modules = import.meta.glob<Record<string, FormDefinition>>(['./*.ts', '!./*.test.ts', '!./index.ts', '!./load.ts', '!./catalog.ts']);

const cache = new Map<string, Promise<FormDefinition>>();

export function loadForm(id: string): Promise<FormDefinition> {
  const name = id.replace(/-/g, '');
  const load = modules[`./${name}.ts`];
  if (!load) return Promise.reject(new Error(`Unknown form ${id}`));
  if (!cache.has(id)) cache.set(id, load().then((m) => m[name]));
  return cache.get(id)!;
}

export const loadForms = (ids: string[]) => Promise.all(ids.map(loadForm));
