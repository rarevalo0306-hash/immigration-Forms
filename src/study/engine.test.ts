import { describe, expect, it } from 'vitest';
import type { CivicsQuestion, CivicsTest } from './types';
import { DEFAULT_SETTINGS, INTERVALS, answersFor, choicesFor, choosable, compareDictation, nextCard, outcome, pick, pool, progress, review, rulesFor, versionForFiling, type StudySettings } from './engine';
import { PLACES } from './states';
import { civics2025 } from './civics2025';
import { READING_SENTENCES, READING_VOCAB, WRITING_SENTENCES, WRITING_VOCAB, tokens, vocabWords } from './english';

const q = (n: number, extra: Partial<CivicsQuestion> = {}): CivicsQuestion => ({
  n,
  section: { es: 'A', en: 'A' },
  part: { es: 'P', en: 'P' },
  question: { es: `¿${n}?`, en: `${n}?` },
  answers: { en: ['Answers will vary.'], es: ['Las respuestas varían.'] },
  ...extra,
});

const test: CivicsTest = {
  version: '2025',
  source: { edition: 'x', url: 'x' },
  spanish: 'camino',
  questions: [q(1, { star: true }), q(2), q(3, { star: true, varies: 'president' }), q(4, { varies: 'stateCapital' }), q(5, { varies: 'senator' }), q(6, { varies: 'governor' })],
  rules: { asked: 20, pass: 12, fail: 9 },
  senior: { asked: 10, pass: 6, fail: 5 },
};
const s = (over: Partial<StudySettings> = {}): StudySettings => ({ ...DEFAULT_SETTINGS, ...over });

describe('which questions and answers', () => {
  it('the test follows the N-400 filing date', () => {
    expect(versionForFiling(true)).toBe('2008');
    expect(versionForFiling(false)).toBe('2025');
  });

  it('65/20 studies only the starred questions, with its own rules', () => {
    expect(pool(test, s()).length).toBe(6);
    expect(pool(test, s({ exemption: '65-20' })).map((x) => x.n)).toEqual([1, 3]);
    expect(rulesFor(test, s({ exemption: '65-20' }))).toEqual(test.senior);
    expect(rulesFor(test, s({ exemption: '50-20' }))).toEqual(test.rules);
  });

  it('officials come from USCIS’s updates page', () => {
    const a = answersFor(test.questions[2], s());
    expect(a.en[0]).toBe('Donald J. Trump');
    expect(a.note).toBeTruthy();
  });

  it('answers that depend on the state use the chosen state', () => {
    expect(answersFor(test.questions[3], s({ state: 'TX' })).en).toEqual(['Austin']);
    expect(answersFor(test.questions[3], s({ state: 'DC' })).en[0]).toMatch(/not a state/);
    expect(answersFor(test.questions[3], s()).en).toEqual(['Answers will vary.']);
    expect(answersFor(test.questions[4], s({ state: 'PR' })).en[0]).toBe('Puerto Rico has no U.S. senators.');
    expect(answersFor(test.questions[5], s({ state: 'DC' })).en[0]).toMatch(/does not have a governor/);
  });

  it('names the person wrote down are shown with the lookup link', () => {
    const a = answersFor(test.questions[4], s({ state: 'CA', names: { senator: 'Jane Doe' } }));
    expect(a.en).toEqual(['Jane Doe']);
    expect(a.lookup).toBe('senator');
    expect(answersFor(test.questions[5], s({ state: 'CA' })).lookup).toBe('governor');
  });

  it('every place has a capital except D.C.', () => {
    expect(PLACES).toHaveLength(56);
    for (const p of PLACES) expect(!!p.capital, p.code).toBe(p.kind !== 'dc');
  });
});

describe('flash cards', () => {
  const ids = ['a', 'b', 'c'];
  it('a known card moves up and comes back later; a missed one comes back soon', () => {
    let cards = review({}, 'a', true, 0);
    expect(cards.a).toEqual({ box: 1, due: INTERVALS[1] });
    cards = review(cards, 'a', true, 0);
    expect(cards.a.box).toBe(2);
    cards = review(cards, 'a', false, 0);
    expect(cards.a.box).toBe(1);
  });

  it('studies overdue cards first, then new ones', () => {
    const cards = { a: { box: 2, due: 50 }, b: { box: 1, due: 10 } };
    expect(nextCard(ids, cards, 100)).toBe('b');
    expect(nextCard(ids, cards, 5)).toBe('c');
    expect(nextCard(ids, { ...cards, c: { box: 3, due: 500 } }, 5)).toBe('b');
    expect(nextCard(['a'], {}, 0, 'a')).toBe('a');
    expect(progress(ids, { a: { box: 3, due: 0 }, b: { box: 1, due: 0 } })).toEqual({ total: 3, seen: 2, mastered: 1 });
  });
});

describe('interview practice', () => {
  const r = { asked: 20, pass: 12, fail: 9 };
  it('stops at 12 right or 9 wrong, like the officer', () => {
    expect(outcome(Array(11).fill(true), r)).toBe('continue');
    expect(outcome(Array(12).fill(true), r)).toBe('pass');
    expect(outcome([...Array(8).fill(false), ...Array(11).fill(true)], r)).toBe('continue');
    expect(outcome(Array(9).fill(false), r)).toBe('fail');
    expect(outcome([true, true, true, true, true, false, false, false, false, false], { asked: 10, pass: 6, fail: 5 })).toBe('fail');
  });

  it('asks distinct questions in random order', () => {
    let seed = 1;
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const asked = pick([...Array(128).keys()], 20, rand);
    expect(new Set(asked).size).toBe(20);
  });
});

describe('English test', () => {
  it('dictation ignores capitals and punctuation, and names what is missing', () => {
    expect(compareDictation('The flag is red, white, and blue.', 'the flag is red white and blue').ok).toBe(true);
    expect(compareDictation('Congress has 100 Senators.', 'Congres has 100 senators')).toEqual({ ok: false, missing: ['congress'], extra: ['congres'] });
    expect(compareDictation('Congress has 100 Senators.', 'Congress has one hundred Senators.').ok).toBe(true);
    expect(compareDictation('The United States has 50 states.', 'The United States has fifty states').ok).toBe(true);
  });

  it('practice sentences use only USCIS’s vocabulary words', () => {
    const reading = vocabWords(READING_VOCAB);
    const writing = vocabWords(WRITING_VOCAB);
    for (const x of READING_SENTENCES) for (const w of tokens(x.en)) expect(reading.has(w), `${x.en}: ${w}`).toBe(true);
    for (const x of WRITING_SENTENCES) for (const w of tokens(x.en)) expect(writing.has(w), `${x.en}: ${w}`).toBe(true);
  });
});


describe('multiple choice', () => {
  const s = { version: '2025' as const, exemption: 'none' as const, state: 'FL', names: {} };
  it('gives four different options with exactly one right', () => {
    for (const q of civics2025.questions.filter((x) => choosable(x, s))) {
      const c = choicesFor(q, civics2025.questions, s);
      expect(c.filter((x) => x.right)).toHaveLength(1);
      expect(c.length).toBeGreaterThanOrEqual(3);
      expect(new Set(c.map((x) => x.en.toLowerCase())).size).toBe(c.length);
      // A wrong option is never one of the question's own answers.
      for (const w of c.filter((x) => !x.right)) expect(q.answers.en.map((a) => a.toLowerCase())).not.toContain(w.en.toLowerCase());
    }
  });
});
