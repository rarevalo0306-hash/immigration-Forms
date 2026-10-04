import { describe, expect, it } from 'vitest';
import { civics2008 } from './civics2008';
import type { Varies } from './types';

const qs = civics2008.questions;

/** All strings in a question, for the stray-character checks. */
function strings(q: (typeof qs)[number]): string[] {
  return [
    q.part.en,
    q.part.es,
    q.section.en,
    q.section.es,
    q.question.en,
    q.question.es,
    ...q.answers.en,
    ...q.answers.es,
  ];
}

describe('civics2008', () => {
  it('is the 2008 test with USCIS Spanish and the official rules', () => {
    expect(civics2008.version).toBe('2008');
    expect(civics2008.spanish).toBe('uscis');
    expect(civics2008.source.edition).toBe('(rev. 08/21)');
    expect(civics2008.rules).toEqual({ asked: 10, pass: 6, fail: 5 });
    expect(civics2008.senior).toEqual({ asked: 10, pass: 6, fail: 5 });
  });

  it('has 100 questions numbered 1..100 in order', () => {
    expect(qs).toHaveLength(100);
    expect(qs.map((q) => q.n)).toEqual(Array.from({ length: 100 }, (_, i) => i + 1));
  });

  it('stars exactly the 20 questions for 65/20', () => {
    expect(qs.filter((q) => q.star).map((q) => q.n)).toEqual([
      6, 11, 13, 17, 20, 27, 28, 44, 45, 49, 54, 56, 70, 75, 78, 85, 94, 95, 97, 99,
    ]);
  });

  it('has non-empty question and answers in both languages', () => {
    for (const q of qs) {
      expect(q.question.en.trim(), `#${q.n}`).not.toBe('');
      expect(q.question.es.trim(), `#${q.n}`).not.toBe('');
      expect(q.answers.en.length, `#${q.n}`).toBeGreaterThan(0);
      expect(q.answers.es.length, `#${q.n}`).toBeGreaterThan(0);
      for (const a of [...q.answers.en, ...q.answers.es]) expect(a.trim(), `#${q.n}`).not.toBe('');
    }
  });

  it('has as many Spanish answers as English ones (USCIS docx has no exceptions)', () => {
    const exceptions: number[] = [];
    for (const q of qs) {
      if (exceptions.includes(q.n)) continue;
      expect(q.answers.es.length, `#${q.n}`).toBe(q.answers.en.length);
    }
  });

  it('marks the answers that vary', () => {
    const varies: Record<number, Varies> = {};
    for (const q of qs) if (q.varies) varies[q.n] = q.varies;
    expect(varies).toEqual({
      20: 'senator',
      23: 'representative',
      28: 'president',
      29: 'vicePresident',
      40: 'chiefJustice',
      43: 'governor',
      44: 'stateCapital',
      46: 'presidentParty',
      47: 'speaker',
    });
  });

  it('sets count on the questions that ask for more than one', () => {
    const counts: Record<number, number> = {};
    for (const q of qs) if (q.count !== undefined) counts[q.n] = q.count;
    expect(counts).toEqual({ 9: 2, 36: 2, 51: 2, 55: 2, 64: 3, 100: 2 });
  });

  it('uses the official parts and sections', () => {
    expect([...new Set(qs.map((q) => q.part.en))]).toEqual([
      'American Government',
      'American History',
      'Integrated Civics',
    ]);
    expect(qs[0].section).toEqual({
      en: 'A: Principles of American Democracy',
      es: 'A: Principios de la Democracia Estadounidense',
    });
    expect(qs[99].section).toEqual({ en: 'C: Holidays', es: 'C: Días feriados' });
  });

  it('has no stray bullets, asterisks, doubled or edge spaces', () => {
    for (const q of qs) {
      for (const s of strings(q)) {
        expect(s, `#${q.n}`).not.toMatch(/[•▪*]/);
        expect(s, `#${q.n}`).not.toMatch(/\s\s/);
        expect(s, `#${q.n}`).toBe(s.trim());
        // eslint-disable-next-line no-control-regex
        expect(s, `#${q.n}`).not.toMatch(/[\u0000-\u001f]/);
      }
    }
  });

  it('keeps a few answers verbatim', () => {
    expect(qs[0].answers).toEqual({ en: ['the Constitution'], es: ['la Constitución'] });
    expect(qs[2].question.en).toBe(
      'The idea of self-government is in the first three words of the Constitution. What are these words?',
    );
    expect(qs[2].answers.es).toEqual(['Nosotros, el pueblo']);
    expect(qs[27].answers.en).toEqual([
      'Visit uscis.gov/citizenship/testupdates for the name of the President of the United States.',
    ]);
  });
});
