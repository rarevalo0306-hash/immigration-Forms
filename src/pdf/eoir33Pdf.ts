import { PDFDocument, PDFDropdown, PDFTextField, StandardFonts } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { EOIR_COURTS } from '../forms/eoir33Courts';
import { fieldIndex, selectOption, setFieldText, toFormText } from './common';

// Fields of Form EOIR-33/IC, Rev. Feb. 2026 (public/forms/eoir-33.pdf). Unlike USCIS forms, the
// names are plain words, not XFA paths, and they match their printed places. Mapped by position:
// - Each address is two single text fields: "number street apartment - former" /
//   "number street address - current" (Number; Street; Apartment) and "city state zip country -
//   former/current". The former column is on the left, the current one on the right. There are no
//   Apt./Ste./Flr. boxes and no state dropdown.
// - "date" is the declaration's signature date and "date - proof of service" the service date: both
//   are left for hand, with the signatures ("Signature1", "Signature2") and "No Service Needed".
// - Page 2's "Immigration Court Name" dropdown runs a script that writes the court's address into
//   "Address1".."Address3"; pdf-lib doesn't run it, so the filler writes those lines itself from
//   src/forms/eoir33Courts.ts. "PUT YOUR ADDRESS HERE 1".."4" is the return address on the fold.

export interface EOIR33Plan {
  text: Record<string, string>;
  select: Record<string, string>;
}

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();
const digits = (s: string) => s.replace(/\D/g, '');
const join = (parts: string[], sep = ', ') => parts.filter(Boolean).join(sep);

const isUS = (country: string) => !country || /^(u\.?s\.?a?\.?|united states( of america)?|estados unidos|ee\.? ?uu\.?)$/i.test(country);

/** "1234 Main St, Apt 4B" and "Doral, FL 33178" (plus ", Country" outside the U.S.). */
function addressLines(a: Answers, p: string): [string, string] {
  const street = join([str(a, `${p}.street`), str(a, `${p}.unit`)]);
  const country = str(a, `${p}.country`);
  const us = isUS(country);
  const region = us ? join([str(a, `${p}.state`).toUpperCase(), str(a, `${p}.zip`)], ' ') : join([str(a, `${p}.province`), str(a, `${p}.postal`)], ' ');
  return [street, join([str(a, `${p}.city`), region, us ? '' : country])];
}

export function planEOIR33(a: Answers): EOIR33Plan {
  const text: Record<string, string> = {};
  const select: Record<string, string> = {};
  const put = (field: string, value: string) => {
    if (value) text[field] = value;
  };

  const family = str(a, 'name.family');
  const given = str(a, 'name.given');
  const fullName = join([given, str(a, 'name.middle'), family, str(a, 'name.suffix')], ' ');
  // "Name – Last, First, Middle, Suffix".
  put('Name', join([family, given, str(a, 'name.middle'), str(a, 'name.suffix')]));
  const aNumber = digits(str(a, 'aNumber'));
  if (aNumber) put('A-Number', `A${aNumber.padStart(9, '0')}`);

  const [curStreet, curCity] = addressLines(a, 'present');
  put('number street address - current', curStreet);
  put('city state zip country - current', curCity);
  put('phone number - current', str(a, 'phone'));
  put('email address - current', str(a, 'email'));
  if (a.previousHas === 'yes') {
    const [oldStreet, oldCity] = addressLines(a, 'previous');
    put('number street apartment - former', oldStreet);
    put('city state zip country - former', oldCity);
  }
  put('phone number - former', str(a, 'previous.phone'));
  put('email address - former', str(a, 'previous.email'));

  // Proof of Service: who serves ICE's OPLA, and how. Its date and signature stay for hand.
  put('name - proof of service', a.serviceBy === 'other' ? str(a, 'serviceName') : fullName);
  if (a.serviceMethod === 'electronic') put('office of principal legal advisor 1', 'Electronic service through the DHS ICE eService Portal');
  else if (a.serviceMethod === 'mail' || a.serviceMethod === 'inPerson')
    put('office of principal legal advisor 1', join([a.serviceMethod === 'mail' ? 'Mail service' : 'In-person service', str(a, 'oplaAddress')], ': '));

  // Page 2: the court's address (where the folded form is mailed) and the return address.
  const court = str(a, 'court');
  const lines = EOIR_COURTS[court] ?? (court === 'other' ? [str(a, 'courtOther.line1'), str(a, 'courtOther.line2'), str(a, 'courtOther.line3')] : undefined);
  if (EOIR_COURTS[court]) select['Immigration Court Name'] = court;
  if (lines) {
    // Fill all three so no "____" placeholder is left when a court has no suite line.
    const [l1, l2, l3] = lines.filter(Boolean).concat(['', '', '']);
    text['Address1'] = l1;
    text['Address2'] = l2;
    text['Address3'] = l3;
  }
  const returnLines = [fullName, curStreet, curCity].filter(Boolean);
  returnLines.forEach((line, i) => put(`PUT YOUR ADDRESS HERE ${i + 1}`, line));

  return { text, select };
}

/** Fills the official EOIR-33/IC PDF with the answers and returns the new file's bytes. */
export async function fillEOIR33(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const index = fieldIndex(form);
  const plan = planEOIR33(a);
  // Only for measuring: the fields have no length limits, so long values shrink to fit their box.
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const get = (name: string) => {
    const f = index.get(name);
    if (!f) throw new Error(`No such field: ${name}`);
    return f;
  };

  // Select first: the court's own lines then replace the dropdown's placeholder ones.
  for (const [name, value] of Object.entries(plan.select)) {
    const field = get(name);
    if (!(field instanceof PDFDropdown)) throw new Error(`Not a dropdown: ${name}`);
    selectOption(field, value);
  }
  for (const [name, raw] of Object.entries(plan.text)) {
    const field = get(name);
    if (!(field instanceof PDFTextField)) throw new Error(`Not a text field: ${name}`);
    if (field.isReadOnly()) field.disableReadOnly();
    const base = name.startsWith('Address') ? 11 : 9;
    const width = field.acroField.getWidgets()[0].getRectangle().width - 4;
    const fit = Math.floor((width / Math.max(helvetica.widthOfTextAtSize(toFormText(raw), 1), 1)) * 2) / 2;
    if (raw) setFieldText(field, raw, Math.max(6, Math.min(base, fit)));
    else field.setText(' ');
  }

  doc.setTitle('Form EOIR-33/IC, Change of Address/Contact Information Form, Immigration Court');
  return doc.save();
}
