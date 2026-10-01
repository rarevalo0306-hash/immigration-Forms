import type { PDFDropdown, PDFTextField } from 'pdf-lib';

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
