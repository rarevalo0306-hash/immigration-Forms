import type { DocItem } from './types';

/**
 * Each form's checklist, loaded when it's shown. A checklist lives in `./<id without dashes>.ts`
 * (`export const formId`, `export const docs`); all.ts loads every one at once for tests.
 */
const modules = import.meta.glob<{ formId?: string; docs?: DocItem[] }>(['./*.ts', '!./*.test.ts', '!./index.ts', '!./all.ts', '!./types.ts', '!./common.ts']);

export async function loadDocuments(formId: string): Promise<DocItem[]> {
  const load = modules[`./${formId.replace(/-/g, '')}.ts`];
  return load ? ((await load()).docs ?? []) : [];
}

export type { DocItem };
