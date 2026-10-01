import type { FormDefinition } from './types';
import { i765 } from './i765';
import { n400 } from './n400';

export const forms: FormDefinition[] = [i765, n400];

export function formById(id: string): FormDefinition | null {
  return forms.find((f) => f.id === id) ?? null;
}
