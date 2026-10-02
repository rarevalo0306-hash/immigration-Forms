import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument } from 'pdf-lib';
import { lastSegment } from './common';

// The fillers check Apt./Ste./Flr. boxes by export value. That only works when each box exports
// the value printed next to it, so every unit group must read APT, STE, FLR from left to right.
// The exceptions are filled by position (I-129F) or not filled at all (I-765 Parts 5-6).
const BY_POSITION: Record<string, RegExp> = {
  'i-129f.pdf': /^Pt[12]Line(8|9|11|12|14|17|18|21)_Unit$/,
  'i-765.pdf': /^Pt[56]Line3b_Unit$/,
};

// The I-589 asks for an "Apt. Number" as text and the G-1145 has no address: neither has unit boxes.
const NO_UNITS = new Set(['i-589.pdf', 'g-1145.pdf']);

const dir = new URL('../../public/forms/', import.meta.url);

describe('Apt./Ste./Flr. boxes', () => {
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.pdf'))) {
    it(`${file} exports the value printed next to each box`, async () => {
      const form = (await PDFDocument.load(readFileSync(new URL(file, dir)))).getForm();
      const groups = new Map<string, { value: string; x: number }[]>();
      for (const f of form.getFields()) {
        const m = /^(.*Unit)\[\d\]$/.exec(lastSegment(f.getName()));
        if (!m || !(f instanceof PDFCheckBox)) continue;
        const w = f.acroField.getWidgets()[0];
        groups.set(m[1], [...(groups.get(m[1]) ?? []), { value: w.getOnValue()?.decodeText().trim() ?? '', x: w.getRectangle().x }]);
      }
      expect(groups.size > 0).toBe(!NO_UNITS.has(file));
      for (const [base, boxes] of groups) {
        if (BY_POSITION[file]?.test(base)) continue;
        expect(boxes.sort((p, q) => p.x - q.x).map((b) => b.value), `${file} ${base}`).toEqual(['APT', 'STE', 'FLR']);
      }
    });
  }
});
