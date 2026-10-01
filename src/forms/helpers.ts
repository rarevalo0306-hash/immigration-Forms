import type { Answers, Field, Option, Question } from './types';
import type { T } from '../i18n';

export const yesNo: Option[] = [
  { value: 'yes', label: { es: 'Sí', en: 'Yes' } },
  { value: 'no', label: { es: 'No', en: 'No' } },
];

export const is =
  (id: string, ...values: string[]) =>
  (a: Answers) =>
    values.includes(String(a[id] ?? ''));

export const all =
  (...tests: ((a: Answers) => boolean)[]) =>
  (a: Answers) =>
    tests.every((t) => t(a));

export const num = (a: Answers, id: string) => Number(a[id] ?? 0) || 0;

export const nameFields = (prefix: string, ref: string, required = true): Field[] => [
  { id: `${prefix}.family`, type: 'text', required, label: { es: 'Apellido(s)', en: 'Family name (last name)' }, formRef: `${ref} · Family Name (Last Name)` },
  { id: `${prefix}.given`, type: 'text', required, label: { es: 'Nombre(s)', en: 'Given name (first name)' }, formRef: `${ref} · Given Name (First Name)` },
  { id: `${prefix}.middle`, type: 'text', label: { es: 'Segundo nombre', en: 'Middle name' }, formRef: `${ref} · Middle Name (if applicable)` },
];

export const date = (id: string, es: string, en: string, formRef: string, required = true, type: Field['type'] = 'pastDate'): Field => ({
  id,
  type,
  required,
  label: { es, en },
  formRef,
  placeholder: 'MM/DD/AAAA',
});

/** "Is there another one?" chains for the form's tables, one row per screen. */
export function rows(opts: {
  max: number;
  id: string;
  /** Whether the table applies at all (row 1 is shown when this holds). */
  first: (a: Answers) => boolean;
  question: (i: number) => T;
  more: T;
  moreWhy?: T;
  formRef: string;
  fields: (i: number) => Field[];
  why?: (i: number) => T | undefined;
  overflow: T;
}): Question[] {
  const out: Question[] = [];
  for (let i = 1; i <= opts.max; i++) {
    // Row i shows when the table applies and every earlier "another one?" was answered Yes.
    const shown = all(opts.first, (a) => [...Array(i - 1)].every((_, k) => a[`${opts.id}.more${k + 1}`] === 'yes'));
    out.push({ id: `${opts.id}${i}`, kind: 'fields', formRef: opts.formRef, question: opts.question(i), why: opts.why?.(i), showIf: shown, fields: opts.fields(i) });
    out.push({
      id: `${opts.id}.more${i}`,
      kind: 'choice',
      formRef: opts.formRef,
      question: opts.more,
      why: opts.moreWhy,
      showIf: shown,
      options: yesNo,
      ...(i === opts.max ? { notice: { tone: 'info' as const, title: { es: 'Espacio adicional', en: 'Extra space' }, body: opts.overflow } } : {}),
    });
  }
  return out;
}

