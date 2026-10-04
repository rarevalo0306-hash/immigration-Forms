import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PDFCheckBox, PDFDocument } from 'pdf-lib';
import { lastSegment } from './common';

// The fillers check Apt./Ste./Flr. boxes by export value. That only works when each box exports
// the value printed next to it, so every unit group must read APT, STE, FLR from left to right.
// The exceptions are filled by position (I-129F) or not filled at all (I-765 Parts 5-6, I-865 Parts 4-5).
const BY_POSITION: Record<string, RegExp> = {
  'i-129f.pdf': /^Pt[12]Line(8|9|11|12|14|17|18|21)_Unit$/,
  'i-765.pdf': /^Pt[56]Line3b_Unit$/,
  'i-865.pdf': /^P[45]_Line3b_Unit$/,
  // Not a unit group: the I-539A's "served in a military unit" yes/no question.
  'i-539a.pdf': /^P3_Line10_MilUnit$/,
};

// The I-589 asks for an "Apt. Number" as text, the G-1145 and I-765WS have no address, the EOIR-33
// takes free-text address lines and the I-485 Supplement A has unit boxes without "Unit" in their names.
const NO_UNITS = new Set(['i-589.pdf', 'g-1145.pdf', 'i-765ws.pdf', 'eoir-33.pdf', 'i-485supa.pdf']);

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
