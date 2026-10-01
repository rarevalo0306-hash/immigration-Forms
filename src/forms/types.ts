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
  | 'category';

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
}

export type Question = FieldsQuestion | ChoiceQuestion;

export interface Section {
  id: string;
  title: T;
  /** The official part of the form this section belongs to. */
  part: string;
  questions: Question[];
}

export interface FormDefinition {
  id: string;
  number: string;
  title: T;
  intro: T;
  sections: Section[];
}
