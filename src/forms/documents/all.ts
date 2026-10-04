import type { DocItem } from './types';

/** Every checklist at once, for tests and scripts. The app loads them one form at a time (index.ts). */
const modules = import.meta.glob<{ formId?: string; docs?: DocItem[] }>(['./*.ts', '!./*.test.ts', '!./index.ts', '!./all.ts', '!./types.ts', '!./common.ts'], { eager: true });

const byForm = new Map<string, DocItem[]>();
for (const m of Object.values(modules)) if (m.formId && m.docs) byForm.set(m.formId, m.docs);

export const documentsFor = (formId: string): DocItem[] => byForm.get(formId) ?? [];
export const formsWithDocuments = () => [...byForm.keys()];
