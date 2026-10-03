import { describe, expect, it } from 'vitest';
import { forms } from '..';
import { documentsFor } from '.';

// Answers that make many `when` checks true, to exercise them.
const busy: Record<string, string | string[]> = new Proxy({}, { get: () => 'yes' });

describe('document checklists', () => {
  it('every form has one', () => {
    const missing = forms.filter((f) => !documentsFor(f.id).length).map((f) => f.id);
    expect(missing).toEqual([]);
  });

  for (const f of forms) {
    it(`${f.id}: unique ids, both languages, conditions that run`, () => {
      const docs = documentsFor(f.id);
      const ids = docs.map((d) => d.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const d of docs) {
        expect(d.label.es.trim() && d.label.en.trim(), d.id).toBeTruthy();
        if (d.detail) expect(d.detail.es.trim() && d.detail.en.trim(), d.id).toBeTruthy();
        if (d.when) {
          expect(typeof d.when({}), d.id).toBe('boolean');
          expect(typeof d.when(busy), d.id).toBe('boolean');
        }
      }
    });
  }
});
