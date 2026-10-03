import { PDFCheckBox, type PDFDropdown, type PDFField, type PDFFont, type PDFForm, type PDFTextField } from 'pdf-lib';

/**
 * The PDF's standard font covers Latin-1 only, and USCIS reads its forms in English: drop accents
 * (García → Garcia) and anything else the font can't draw.
 */
export function toFormText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/[^\x20-\x7e\n]/g, '');
}

/** Sets a text field, cut to its length limit. `fontSize` replaces auto-size, which can grow huge. */
export function setFieldText(field: PDFTextField, raw: string, fontSize?: number) {
  let value = toFormText(raw);
  if (!field.isMultiline()) value = value.replace(/\n/g, ' ');
  const max = field.getMaxLength();
  if (max !== undefined && value.length > max) value = value.slice(0, max);
  if (fontSize && !field.isCombed()) {
    try {
      field.setFontSize(fontSize);
    } catch {
      // Some fields have no font in their default appearance; give them one.
      field.acroField.setDefaultAppearance(`/Helv ${fontSize} Tf 0 g`);
    }
  }
  field.setText(value);
}

/** Selects a dropdown option, ignoring the padding some USCIS lists put around their values (" CA"). */
export function selectOption(field: PDFDropdown, value: string) {
  const option = field.getOptions().find((o) => o.trim() === value.trim());
  if (option === undefined) throw new Error(`No "${value}" option in ${field.getName()}`);
  field.select(option);
}

/** The last segment of a field's full name; some names hold escaped dots ("Line12\\.c_Checkbox[0]"). */
export function lastSegment(name: string) {
  return name.split(/(?<!\\)\./).pop()!;
}

/** Finds every field by the last segment of its name. */
export function fieldIndex(form: PDFForm) {
  const bySegment = new Map<string, PDFField>();
  for (const f of form.getFields()) bySegment.set(lastSegment(f.getName()), f);
  return bySegment;
}

/** The checkboxes `base[0]`, `base[1]`… with the export value each one sets. */
export function optionBoxes(index: Map<string, PDFField>, base: string): { box: PDFCheckBox; value: string }[] {
  const out: { box: PDFCheckBox; value: string }[] = [];
  for (let i = 0; ; i++) {
    const f = index.get(`${base}[${i}]`);
    if (!f) return out;
    if (!(f instanceof PDFCheckBox)) throw new Error(`Not a checkbox: ${base}[${i}]`);
    const on = f.acroField.getWidgets()[0].getOnValue();
    // Some forms pad export values (" APT "); compare them trimmed.
    out.push({ box: f, value: on ? on.decodeText().trim() : '' });
  }
}

/** Every field by the last segment of its name; a segment can name several fields (forms that repeat a name across pages). */
export function fieldsBySegment(fields: PDFField[]) {
  const out = new Map<string, PDFField[]>();
  for (const f of fields) {
    const s = lastSegment(f.getName());
    out.set(s, [...(out.get(s) ?? []), f]);
  }
  return out;
}

/** Breaks text into the lines a box of `width` points shows at `size`. */
export function wrap(s: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  for (const paragraph of s.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= width) line = next;
      else {
        if (line) lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}
