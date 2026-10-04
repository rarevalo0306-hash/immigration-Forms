import { describe, expect, it } from 'vitest';
import { forms } from '.';
import { catalog } from './catalog';
import { loadForm } from './load';
import { documentsFor } from './documents/all';

describe('form catalog', () => {
  it('lists every form, in the same order, with the same details', () => {
    expect(catalog.map((m) => m.id)).toEqual(forms.map((f) => f.id));
    for (const f of forms) {
      const m = catalog.find((x) => x.id === f.id)!;
      expect({ number: m.number, title: m.title, summary: m.summary, minutes: m.minutes, edition: m.edition }, f.id).toEqual({
        number: f.number,
        title: f.title,
        summary: f.summary,
        minutes: f.minutes,
        edition: f.edition,
      });
      expect(m.fee, f.id).toBe(documentsFor(f.id).some((d) => d.id === 'fee'));
    }
  });

  it('loads each form on demand', async () => {
    for (const f of forms) expect((await loadForm(f.id)).id).toBe(f.id);
  });
});
