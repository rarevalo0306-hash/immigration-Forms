import type { DocItem } from './types';

/** Every form's checklist, from the files next to this one (`export const formId`, `export const docs`). */
const modules = import.meta.glob<{ formId?: string; docs?: DocItem[] }>(['./*.ts', '!./*.test.ts', '!./index.ts', '!./types.ts', '!./common.ts'], { eager: true });

const byForm = new Map<string, DocItem[]>();
for (const m of Object.values(modules)) if (m.formId && m.docs) byForm.set(m.formId, m.docs);

export const documentsFor = (formId: string): DocItem[] => byForm.get(formId) ?? [];
export const formsWithDocuments = () => [...byForm.keys()];
export type { DocItem };
