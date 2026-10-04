import type { T } from '../i18n';

/**
 * The naturalization civics test, as USCIS publishes it. Each version is the official list of
 * questions with its official English answers; the Spanish is a study aid (USCIS's own translation
 * for the 2008 test, Camino's for the 2025 test, which USCIS has not translated). The officer asks
 * in English unless the person qualifies for an exception (50/20, 55/15, 65/20).
 */

export type TestVersion = '2025' | '2008';

/**
 * Answers that depend on who holds an office or where the person lives. `current.ts` holds the
 * officials USCIS lists on uscis.gov/citizenship/testupdates; the rest depend on the person's state.
 */
export type Varies =
  | 'president'
  | 'vicePresident'
  | 'speaker'
  | 'chiefJustice'
  | 'presidentParty'
  | 'senator'
  | 'representative'
  | 'governor'
  | 'stateCapital';

export interface CivicsQuestion {
  /** The question's number in the official list. */
  n: number;
  /** The official section heading, e.g. { en: 'A: Principles of American Government', es: '…' }. */
  section: T;
  /** The broad part: American Government, American History, Symbols and Holidays (Integrated Civics in 2008). */
  part: T;
  question: T;
  /** Official answers, in the official order. Any one is enough unless the question asks for more. */
  answers: { en: string[]; es: string[] };
  /** How many answers the question asks for ("Name two…" = 2). Omitted when one is enough. */
  count?: number;
  /** One of the 20 questions marked with an asterisk for the 65/20 special consideration. */
  star?: true;
  /** The answer changes with elections or depends on the person's state. */
  varies?: Varies;
}

export interface CivicsTest {
  version: TestVersion;
  /** The list's own edition mark (e.g. 'M-1778 (09/25)') and where it was downloaded. */
  source: { edition: string; url: string };
  /** Who wrote the Spanish: USCIS or Camino. */
  spanish: 'uscis' | 'camino';
  questions: CivicsQuestion[];
  /** How the interview goes: asked, needed to pass, and when the officer stops on failures. */
  rules: { asked: number; pass: number; fail: number };
  /** The 65/20 version: 10 starred questions asked, 6 needed. */
  senior: { asked: number; pass: number; fail: number };
}
