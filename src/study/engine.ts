import type { T } from '../i18n';
import type { CivicsQuestion, CivicsTest, TestVersion } from './types';
import { currentAnswers } from './current';
import { placeByCode } from './states';

/**
 * The study section's logic, apart from the screens: which questions a person studies, the
 * answers that apply to them, spaced review for the flash cards, the interview practice's stop
 * rules and the dictation check.
 */

/**
 * English exemptions (uscis.gov/citizenship/exceptions-and-accommodations): 50/20 and 55/15 skip
 * the English test and may take the civics test in their language; 65/20 also studies only the 20
 * starred questions.
 */
export type Exemption = 'none' | '50-20' | '65-20';

export interface StudySettings {
  version: TestVersion;
  exemption: Exemption;
  /** Two-letter code from states.ts, or '' when not chosen. */
  state: string;
  /** What the person wrote down for the answers that depend on them. */
  names: { senator?: string; representative?: string; governor?: string };
}

export const DEFAULT_SETTINGS: StudySettings = { version: '2025', exemption: 'none', state: '', names: {} };

/** The test version from the N-400 filing date: the 2025 test applies from Oct. 20, 2025. */
export const versionForFiling = (filedBefore20251020: boolean): TestVersion => (filedBefore20251020 ? '2008' : '2025');

export const pool = (test: CivicsTest, s: StudySettings): CivicsQuestion[] =>
  s.exemption === '65-20' ? test.questions.filter((q) => q.star) : test.questions;

export const rulesFor = (test: CivicsTest, s: StudySettings) => (s.exemption === '65-20' ? test.senior : test.rules);

/** Whether the person may answer the civics questions in Spanish (with an interpreter). */
export const mayUseSpanish = (s: StudySettings) => s.exemption !== 'none';

/** Whether the person takes the English reading and writing test. */
export const takesEnglishTest = (s: StudySettings) => s.exemption === 'none';

export interface ShownAnswers {
  en: string[];
  es: string[];
  /** Where the answer comes from when it isn't the fixed official one. */
  note?: T;
  /** An official page to look the answer up. */
  lookup?: 'senator' | 'representative' | 'governor';
}

/**
 * The answers to show for a question: the official ones, except where they change with elections
 * (the officials USCIS names now) or depend on where the person lives.
 */
export function answersFor(q: CivicsQuestion, s: StudySettings): ShownAnswers {
  const official = { en: q.answers.en, es: q.answers.es };
  if (!q.varies) return official;
  const now = currentAnswers(s.version, q.varies);
  if (now)
    return {
      en: now,
      es: now.map((a) => a.replace('(birth name)', '(nombre de nacimiento)').replace('Republican (Party)', 'Republicano (Partido Republicano)')),
      note: { es: 'Según la página de cambios de USCIS. Conteste con quien tenga el cargo el día de su entrevista.', en: 'From USCIS’s test updates page. Answer with whoever holds the office on the day of your interview.' },
    };
  const place = placeByCode(s.state);
  if (q.varies === 'stateCapital') {
    if (!place) return official;
    if (place.kind === 'dc')
      return { en: ['D.C. is not a state and does not have a capital.'], es: ['D.C. no es un estado y no tiene capital.'] };
    return { en: [place.capital], es: [place.capital], note: { es: `La capital de ${place.name}.`, en: `The capital of ${place.name}.` } };
  }
  if (q.varies === 'senator' && place && place.kind !== 'state')
    return {
      en: [`${place.kind === 'dc' ? 'D.C.' : place.name} has no U.S. senators.`],
      es: [`${place.kind === 'dc' ? 'D.C.' : place.name} no tiene senadores federales.`],
    };
  if (q.varies === 'governor' && place?.kind === 'dc')
    return { en: ['D.C. does not have a governor.'], es: ['D.C. no tiene gobernador.'] };
  if (q.varies === 'senator' || q.varies === 'representative' || q.varies === 'governor') {
    const mine = s.names[q.varies]?.trim();
    if (mine)
      return {
        en: [mine],
        es: [mine],
        note: { es: 'El nombre que usted anotó. Confírmelo antes de la entrevista.', en: 'The name you wrote down. Check it before the interview.' },
        lookup: q.varies,
      };
    return { ...official, lookup: q.varies };
  }
  return official;
}

// ---------------------------------------------------------------------------------------------
// Flash cards: a Leitner schedule. A card the person knew moves up a box and comes back later;
// one they missed goes back to box 1 and comes back in this session.

export interface Card {
  box: number;
  due: number;
}
export type Cards = Record<string, Card>;

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
/** How long until a card in each box comes back. */
export const INTERVALS = [0, 10 * MINUTE, 1 * DAY, 3 * DAY, 7 * DAY, 21 * DAY];
export const MASTERED_BOX = 3;
export const MAX_BOX = INTERVALS.length - 1;

export const cardId = (version: TestVersion, n: number) => `${version}:${n}`;

export function review(cards: Cards, id: string, knew: boolean, now: number): Cards {
  const box = knew ? Math.min((cards[id]?.box ?? 0) + 1, MAX_BOX) : 1;
  return { ...cards, [id]: { box, due: now + INTERVALS[box] } };
}

/**
 * The next card to study: the most overdue card that was already seen (lowest box first), else
 * the first one never seen, else the one due soonest.
 */
export function nextCard(ids: string[], cards: Cards, now: number, skip?: string): string | undefined {
  const candidates = ids.filter((id) => id !== skip);
  const due = candidates.filter((id) => cards[id] && cards[id].due <= now).sort((a, b) => cards[a].box - cards[b].box || cards[a].due - cards[b].due);
  if (due.length) return due[0];
  const fresh = candidates.find((id) => !cards[id]);
  if (fresh) return fresh;
  return [...candidates].sort((a, b) => cards[a].due - cards[b].due)[0] ?? (skip && ids.includes(skip) ? skip : undefined);
}

export function progress(ids: string[], cards: Cards) {
  const seen = ids.filter((id) => cards[id]).length;
  const mastered = ids.filter((id) => (cards[id]?.box ?? 0) >= MASTERED_BOX).length;
  return { total: ids.length, seen, mastered };
}

// ---------------------------------------------------------------------------------------------
// Interview practice: the officer asks questions in random order and stops as soon as the person
// has enough right answers to pass, or too many wrong ones to pass.

export interface Rules {
  asked: number;
  pass: number;
  fail: number;
}

/** A random order of `k` questions (Fisher–Yates with the given random source). */
export function pick<T>(items: T[], k: number, random: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, k);
}

export type Outcome = 'continue' | 'pass' | 'fail';

export function outcome(results: boolean[], r: Rules): Outcome {
  const right = results.filter(Boolean).length;
  const wrong = results.length - right;
  if (right >= r.pass) return 'pass';
  if (wrong >= r.fail || results.length >= r.asked) return 'fail';
  return 'continue';
}

// ---------------------------------------------------------------------------------------------
// Dictation: the writing test passes when the sentence is written so the officer can read it.
// Camino compares words, ignoring capital letters and punctuation, and shows the differences.

const words = (s: string) =>
  s
    .toLowerCase()
    .replace(/\bone hundred\b/g, '100')
    .replace(/\bfifty\b/g, '50')
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9'\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

export function compareDictation(expected: string, written: string): { ok: boolean; missing: string[]; extra: string[] } {
  const want = words(expected);
  const got = words(written);
  const left = [...got];
  const missing: string[] = [];
  for (const w of want) {
    const i = left.indexOf(w);
    if (i >= 0) left.splice(i, 1);
    else missing.push(w);
  }
  return { ok: missing.length === 0 && left.length === 0, missing, extra: left };
}
