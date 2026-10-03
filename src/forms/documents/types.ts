import type { T } from '../../i18n';
import type { Answers } from '../types';

/**
 * One document to gather and send with a form, from the form's official instructions
 * ("What evidence must you submit?"). `when` shows it only for the answers it applies to.
 */
export interface DocItem {
  /** Unique within the form; items shared across forms keep the same id (see common.ts). */
  id: string;
  label: T;
  /** One short line: what exactly, or where to get it. */
  detail?: T;
  when?: (a: Answers) => boolean;
}
