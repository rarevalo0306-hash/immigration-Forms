import type { FormDefinition } from './types';
import { i765 } from './i765';
import { n400 } from './n400';
import { i130 } from './i130';
import { i130a } from './i130a';

export const forms: FormDefinition[] = [i765, i130, i130a, n400];

export function formById(id: string): FormDefinition | null {
  return forms.find((f) => f.id === id) ?? null;
}
