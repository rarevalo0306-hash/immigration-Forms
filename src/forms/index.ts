import type { FormDefinition } from './types';
import { i765 } from './i765';
import { i765ws } from './i765ws';
import { i751 } from './i751';
import { i90 } from './i90';
import { ar11 } from './ar11';
import { n400 } from './n400';
import { i130 } from './i130';
import { i129f } from './i129f';
import { i130a } from './i130a';
import { i131 } from './i131';
import { i485 } from './i485';
import { i864 } from './i864';
import { i864a } from './i864a';
import { i864ez } from './i864ez';
import { i821d } from './i821d';
import { i821 } from './i821';
import { i912 } from './i912';
import { i589 } from './i589';
import { g1145 } from './g1145';
import { n600 } from './n600';
import { i601a } from './i601a';

export const forms: FormDefinition[] = [i765, i765ws, i821d, i821, i130, i130a, i129f, i485, i131, i864, i864ez, i864a, i751, i90, ar11, i912, i589, i601a, g1145, n400, n600];

export function formById(id: string): FormDefinition | null {
  return forms.find((f) => f.id === id) ?? null;
}
