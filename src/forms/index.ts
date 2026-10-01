import type { FormDefinition } from './types';
import { i765 } from './i765';
import { n400 } from './n400';
import { i130 } from './i130';
import { i130a } from './i130a';
import { i485 } from './i485';

export const forms: FormDefinition[] = [i765, i130, i130a, i485, n400];

export function formById(id: string): FormDefinition | null {
  return forms.find((f) => f.id === id) ?? null;
}
