import type { T } from '../i18n';

export type Answers = Record<string, string | string[]>;

export type FieldType =
  | 'text'
  | 'date'
  | 'pastDate'
  | 'futureDate'
  | 'aNumber'
  | 'uscisAccount'
  | 'ssn'
  | 'zip'
  | 'phone'
  | 'email'
  | 'state'
  | 'unit'
  | 'receipt'
  | 'i94'
  | 'sevis'
  | 'category'
  | 'number'
  | 'longText'
  | 'select';

export interface Field {
  id: string;
  type: FieldType;
  label: T;
  /** Where this lands on the official form, in the form's own (English) words. */
  formRef: string;
  hint?: T;
  required?: boolean;
  placeholder?: string;
  /** The most characters the official PDF field holds. */
  maxLength?: number;
  /** For `select` fields. */
  options?: Option[];
}

export interface Option {
  value: string;
  label: T;
}

interface QuestionBase {
  id: string;
  question: T;
  why?: T;
  /** Official part and item names this screen fills, shown under the question. */
  formRef: string;
  /** A notice shown on the screen, e.g. legal caution before a sensitive question. */
  notice?: { tone: 'info' | 'legal'; title: T; body: T };
  showIf?: (a: Answers) => boolean;
}

export interface FieldsQuestion extends QuestionBase {
  kind: 'fields';
  fields: Field[];
}

export interface ChoiceQuestion extends QuestionBase {
  kind: 'choice';
  options: Option[];
  /** "Select all that apply": the answer is a list of values. */
  multiple?: boolean;
}

/** Several yes/no questions on one screen, for long runs like the N-400's Part 9. */
export interface YesNoItem {
  id: string;
  label: T;
  formRef: string;
  showIf?: (a: Answers) => boolean;
}

export interface YesNoListQuestion extends QuestionBase {
  kind: 'yesNoList';
  items: YesNoItem[];
}

export type Question = FieldsQuestion | ChoiceQuestion | YesNoListQuestion;

export interface Section {
  id: string;
  title: T;
  /** The official part of the form this section belongs to. */
  part: string;
  questions: Question[];
}

export interface FormPdf {
  /** Path under public/ of the official PDF, prepared with scripts/prepare-uscis-pdf.py. */
  path: string;
  fileName: string;
  /** Lazily loads the filler so pdf-lib only downloads when someone asks for the PDF. */
  load: () => Promise<(template: ArrayBuffer | Uint8Array, answers: Answers) => Promise<Uint8Array>>;
  /** Where the applicant signs by hand, e.g. "Part 11, Item 4". */
  signHere: T;
}

export interface FormDefinition {
  id: string;
  number: string;
  /** Edition date printed at the bottom of the official form. */
  edition: string;
  title: T;
  /** One line for the form picker. */
  summary: T;
  intro: T;
  minutes: number;
  sections: Section[];
  pdf: FormPdf;
  nextSteps: Record<'es' | 'en', string[]>;
}
