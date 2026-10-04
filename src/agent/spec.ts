import type { Lang } from '../i18n';
import type { Answers, FieldType, FormDefinition } from '../forms/types';
import { normalizeQuestion, pruneHidden, validateQuestion, visibleItems, visibleScreens, type Screen } from '../engine/flow';

/**
 * The bridge between a form and the AI assistant (api/agent.ts): what the assistant is told about
 * the current question, and how its answers are checked and saved. All of this runs on the device;
 * the assistant only proposes values, and the same validation as the regular screens decides.
 */

/** ID numbers the person types by hand. They are never sent to the assistant. */
export const MANUAL_TYPES: ReadonlySet<FieldType> = new Set(['ssn', 'aNumber', 'uscisAccount']);

/** How each field type must be written, for the assistant. */
const FORMATS: Partial<Record<FieldType, string>> = {
  date: 'MM/DD/YYYY',
  pastDate: 'MM/DD/YYYY, in the past',
  futureDate: 'MM/DD/YYYY, in the future',
  zip: '5 digits (or ZIP+4)',
  phone: 'US phone, 10 digits',
  email: 'email address',
  state: '2-letter US state code, e.g. FL',
  unit: 'like "Apt 4" or "Ste 200"',
  receipt: '3 letters + 10 digits, e.g. IOE0123456789',
  i94: '11 characters',
  sevis: 'N + 10 digits',
  category: 'EAD category like (c)(9)',
  number: 'digits only',
  longText: 'free text, in English',
  text: 'text, in English letters',
};

export interface FieldSpec {
  id: string;
  label: string;
  /** Where it goes on the official form. */
  formRef: string;
  format?: string;
  required: boolean;
  options?: { value: string; label: string }[];
  /** The person types this one in a box on screen; the assistant must not ask for it in the chat. */
  manual?: true;
  /** What is already filled in (not for manual fields). */
  current?: string;
}

export interface QuestionSpec {
  /** Position, for the assistant to say "pregunta 4 de 30". */
  number: number;
  of: number;
  section: string;
  question: string;
  why?: string;
  kind: 'fields' | 'choice' | 'yesNoList';
  /** For kind "choice": the answer id is the question id; give one option value (or several when multiple). */
  id: string;
  multiple?: boolean;
  options?: { value: string; label: string }[];
  /** For kind "fields": each field is its own answer id. For "yesNoList": each item, answered "yes" or "no". */
  fields?: FieldSpec[];
  notice?: string;
  current?: string | string[];
}

export function questionSpec(screen: Screen, index: number, total: number, answers: Answers, lang: Lang): QuestionSpec {
  const q = screen.question;
  const base = {
    number: index + 1,
    of: total,
    section: screen.section.title[lang],
    question: q.question[lang],
    ...(q.why ? { why: q.why[lang] } : {}),
    ...(q.notice ? { notice: `${q.notice.title[lang]}: ${q.notice.body[lang]}` } : {}),
    id: q.id,
  };
  if (q.kind === 'choice') {
    return {
      ...base,
      kind: 'choice',
      ...(q.multiple ? { multiple: true } : {}),
      options: q.options.map((o) => ({ value: o.value, label: o.label[lang] })),
      ...(answers[q.id] !== undefined ? { current: answers[q.id] } : {}),
    };
  }
  if (q.kind === 'yesNoList') {
    return {
      ...base,
      kind: 'yesNoList',
      fields: visibleItems(q, answers).map((item) => ({
        id: item.id,
        label: item.label[lang],
        formRef: item.formRef,
        required: true,
        options: [
          { value: 'yes', label: lang === 'es' ? 'Sí' : 'Yes' },
          { value: 'no', label: 'No' },
        ],
        ...(typeof answers[item.id] === 'string' ? { current: answers[item.id] as string } : {}),
      })),
    };
  }
  return {
    ...base,
    kind: 'fields',
    fields: q.fields.map((f) => {
      const manual = MANUAL_TYPES.has(f.type);
      const v = answers[f.id];
      return {
        id: f.id,
        label: f.label[lang],
        formRef: f.formRef,
        required: !!f.required,
        ...(FORMATS[f.type] ? { format: FORMATS[f.type] } : {}),
        ...(f.options ? { options: f.options.map((o) => ({ value: o.value, label: o.label[lang] })) } : {}),
        ...(manual ? { manual: true as const } : typeof v === 'string' && v ? { current: v } : {}),
      };
    }),
  };
}

/** The fields of a screen the person types by hand. */
export function manualFields(screen: Screen) {
  const q = screen.question;
  return q.kind === 'fields' ? q.fields.filter((f) => MANUAL_TYPES.has(f.type)) : [];
}

export type ApplyResult =
  | { ok: true; answers: Answers; position: number }
  | { ok: false; errors: Record<string, string> };

/**
 * Applies the assistant's answers to the current question. Only the current question's ids are
 * taken, never a manual field; then the regular validation runs. On success the form moves on.
 */
export function applyAnswers(
  form: FormDefinition,
  answers: Answers,
  position: number,
  proposed: { id: string; value: string | string[] }[],
  lang: Lang,
): ApplyResult {
  const screens = visibleScreens(form, answers);
  const screen = screens[position];
  if (!screen) return { ok: false, errors: { _: 'There is no question to answer: the form is at its review page.' } };
  const q = screen.question;
  const allowed = new Map<string, 'one' | 'many'>();
  if (q.kind === 'choice') allowed.set(q.id, q.multiple ? 'many' : 'one');
  else if (q.kind === 'yesNoList') visibleItems(q, answers).forEach((i) => allowed.set(i.id, 'one'));
  else q.fields.filter((f) => !MANUAL_TYPES.has(f.type)).forEach((f) => allowed.set(f.id, 'one'));

  const next: Answers = { ...answers };
  const errors: Record<string, string> = {};
  for (const { id, value } of proposed) {
    const shape = allowed.get(id);
    if (!shape) {
      errors[id] = q.kind === 'fields' && q.fields.some((f) => f.id === id)
        ? 'The person types this one in the box on screen. Do not fill it.'
        : 'Not part of the current question.';
      continue;
    }
    if (shape === 'many') next[id] = (Array.isArray(value) ? value : [value]).map(String);
    else next[id] = Array.isArray(value) ? String(value[0] ?? '') : String(value);
    if (q.kind === 'choice' && !q.options.some((o) => (Array.isArray(next[id]) ? (next[id] as string[]) : [next[id] as string]).includes(o.value)))
      errors[id] = 'Use one of the option values.';
    if (q.kind === 'yesNoList' && next[id] !== 'yes' && next[id] !== 'no') errors[id] = 'Answer "yes" or "no".';
  }
  for (const [id, e] of Object.entries(validateQuestion(q, next))) errors[id] ??= e[lang];
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, answers: pruneHidden(form, normalizeQuestion(q, next)), position: position + 1 };
}

/**
 * Hides ID-like numbers before a message leaves the device, in case the person types one in the
 * chat anyway: Social Security and A-Numbers (8 or 9 digits, an optional A in front) and 12-digit
 * USCIS account numbers. Phone numbers (10 digits), ZIP codes and dates go through.
 */
export function maskNumbers(text: string): string {
  return text.replace(/\b([Aa][- ]?)?\d[\d -]{5,16}\d\b/g, (m, a: string | undefined) => {
    const n = m.replace(/\D/g, '').length;
    return n === 8 || n === 9 || n === 12 || (a && n >= 7 && n <= 9) ? '[número oculto]' : m;
  });
}
