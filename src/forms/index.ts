import type { FormDefinition } from './types';
import { i765 } from './i765';
import { i751 } from './i751';
import { i90 } from './i90';
import { n400 } from './n400';
import { i130 } from './i130';
import { i129f } from './i129f';
import { i130a } from './i130a';
import { i131 } from './i131';
import { i485 } from './i485';
import { i864 } from './i864';
import { i864a } from './i864a';
import { i821d } from './i821d';
import { i821 } from './i821';

export const forms: FormDefinition[] = [i765, i821d, i821, i130, i130a, i129f, i485, i131, i864, i864a, i751, i90, n400];

export function formById(id: string): FormDefinition | null {
  return forms.find((f) => f.id === id) ?? null;
}
