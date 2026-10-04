import { describe, expect, it } from 'vitest';
import { civics2025 } from './civics2025';

const qs = civics2025.questions;

/** Every string in a question, for the stray-character checks. */
function strings(): string[] {
  const out: string[] = [];
  for (const q of qs) {
    out.push(q.question.en, q.question.es, q.section.en, q.section.es, q.part.en, q.part.es);
    out.push(...q.answers.en, ...q.answers.es);
  }
  return out;
}

describe('2025 civics test', () => {
  it('has the edition, rules and Camino Spanish', () => {
    expect(civics2025.version).toBe('2025');
    expect(civics2025.source.edition).toBe('M-1778 (09/25)');
    expect(civics2025.spanish).toBe('camino');
    expect(civics2025.rules).toEqual({ asked: 20, pass: 12, fail: 9 });
    expect(civics2025.senior).toEqual({ asked: 10, pass: 6, fail: 5 });
  });

  it('has 128 questions numbered 1..128 in order', () => {
    expect(qs).toHaveLength(128);
    expect(qs.map((q) => q.n)).toEqual(Array.from({ length: 128 }, (_, i) => i + 1));
  });

  it('stars exactly the 20 questions of the 65/20 list', () => {
    expect(qs.filter((q) => q.star).map((q) => q.n)).toEqual([
      2, 7, 12, 20, 30, 36, 38, 39, 44, 52, 61, 66, 74, 78, 86, 94, 113, 115, 121, 126,
    ]);
  });

  it('has a question and at least one answer in both languages, with matching answer counts', () => {
    for (const q of qs) {
      expect(q.question.en.trim(), `#${q.n}`).not.toBe('');
      expect(q.question.es.trim(), `#${q.n}`).not.toBe('');
      expect(q.answers.en.length, `#${q.n}`).toBeGreaterThan(0);
      expect(q.answers.es.length, `#${q.n}`).toBe(q.answers.en.length);
      for (const a of [...q.answers.en, ...q.answers.es]) expect(a.trim(), `#${q.n}`).not.toBe('');
    }
  });

  it('marks the answers that vary', () => {
    const varies = Object.fromEntries(qs.filter((q) => q.varies).map((q) => [q.n, q.varies]));
    expect(varies).toEqual({
      23: 'senator',
      29: 'representative',
      30: 'speaker',
      38: 'president',
      39: 'vicePresident',
      57: 'chiefJustice',
      61: 'governor',
      62: 'stateCapital',
    });
  });

  it('says how many answers a question asks for', () => {
    const count = Object.fromEntries(qs.filter((q) => q.count).map((q) => [q.n, q.count]));
    expect(count).toEqual({ 10: 2, 48: 2, 65: 3, 67: 2, 69: 2, 81: 5, 126: 3 });
    for (const q of qs) if (q.count) expect(q.answers.en.length).toBeGreaterThanOrEqual(q.count);
  });

  it('uses the official parts and sections', () => {
    expect([...new Set(qs.map((q) => q.part.en))]).toEqual(['American Government', 'American History', 'Symbols and Holidays']);
    expect([...new Set(qs.map((q) => q.section.en))]).toEqual([
      'A: Principles of American Government',
      'B: System of Government',
      'C: Rights and Responsibilities',
      'A: Colonial Period and Independence',
      'B: 1800s',
      'C: Recent American History and Other Important Historical Information',
      'A: Symbols',
      'B: Holidays',
    ]);
  });

  it('has no stray bullets, asterisks or doubled spaces', () => {
    for (const s of strings()) {
      expect(s, s).not.toMatch(/[•▪*]/);
      expect(s, s).not.toMatch(/ {2}/);
      expect(s, s).toBe(s.trim());
    }
  });
});
