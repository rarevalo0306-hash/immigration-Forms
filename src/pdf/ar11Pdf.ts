import { PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { parseUnit } from '../engine/validation';
import { fieldIndex, optionBoxes, selectOption, setFieldText } from './common';

// Fields of USCIS Form AR-11, edition 11/02/22 (public/forms/ar-11.pdf), named by the last segment
// of their full name. The present address is "S2B", the previous one "S2A" and the mailing address
// "S2C"; the present address's unit boxes are "S2B__Unit" (with two underscores).

export interface AR11Plan {
  text: Record<string, string>;
  checkValue: [string, string][];
  select: Record<string, string>;
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');

export function planAR11(a: Answers): AR11Plan {
  const text: Record<string, string> = {};
  const checkValue: [string, string][] = [];
  const select: Record<string, string> = {};
  const put = (field: string, value: string) => {
    if (value) text[field] = value;
  };
  const address = (prefix: string, p: string, unitBase = `${p}_Unit`) => {
    put(`${p}_StreetNumberName[0]`, str(a, `${prefix}.street`));
    const unit = parseUnit(str(a, `${prefix}.unit`));
    if (unit) {
      checkValue.push([unitBase, unit.kind]);
      put(`${p}_AptSteFlrNumber[0]`, unit.number);
    }
    put(`${p}_CityOrTown[0]`, str(a, `${prefix}.city`));
    const st = str(a, `${prefix}.state`).toUpperCase();
    if (st) select[`${p}_State[0]`] = st;
    put(`${p}_ZipCode[0]`, str(a, `${prefix}.zip`));
  };

  put('S1_FamilyName[0]', str(a, 'name.family'));
  put('S1_GivenName[0]', str(a, 'name.given'));
  put('S1_MiddleName[0]', str(a, 'name.middle'));
  put('S1_DateOfBirth[0]', str(a, 'dob'));
  const aNumber = digits(str(a, 'aNumber'));
  if (aNumber) put('AlienNumber[0]', aNumber.padStart(9, '0'));
  address('present', 'S2B', 'S2B__Unit');
  if (a.previousHas === 'yes') address('previous', 'S2A');
  if (a.mailingDifferent === 'yes') address('mailing', 'S2C');
  // The signature and its date stay empty: the card must be signed and dated by hand.

  return { text, checkValue, select };
}

/** Fills the official AR-11 PDF with the answers and returns the new file's bytes. */
export async function fillAR11(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const index = fieldIndex(doc.getForm());
  const plan = planAR11(a);
  const get = (name: string) => {
    const f = index.get(name);
    if (!f) throw new Error(`No such field: ${name}`);
    return f;
  };

  for (const [name, raw] of Object.entries(plan.text)) {
    const field = get(name);
    if (!(field instanceof PDFTextField)) throw new Error(`Not a text field: ${name}`);
    setFieldText(field, raw, 9);
  }
  for (const [base, value] of plan.checkValue) {
    const match = optionBoxes(index, base).find((o) => o.value === value);
    if (!match) throw new Error(`No "${value}" box in ${base}`);
    match.box.check();
  }
  for (const [name, value] of Object.entries(plan.select)) {
    const field = get(name);
    if (!(field instanceof PDFDropdown)) throw new Error(`Not a dropdown: ${name}`);
    selectOption(field, value);
  }

  doc.setTitle("Form AR-11, Alien's Change of Address Card");
  return doc.save();
}
