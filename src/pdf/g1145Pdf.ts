import { PDFDocument, PDFTextField } from 'pdf-lib';
import type { Answers } from '../forms/types';
import { fieldIndex, setFieldText } from './common';

// Fields of USCIS Form G-1145, edition 09/26/14 (public/forms/g-1145.pdf), named by the last
// segment of their full name.

const str = (a: Answers, id: string) => String(a[id] ?? '').trim();

export function planG1145(a: Answers): Record<string, string> {
  const text: Record<string, string> = {};
  const put = (field: string, value: string) => {
    if (value) text[field] = value;
  };
  put('LastName[0]', str(a, 'name.family'));
  put('FirstName[0]', str(a, 'name.given'));
  put('MiddleName[0]', str(a, 'name.middle'));
  put('Email[0]', str(a, 'email'));
  put('MobilePhoneNumber[0]', str(a, 'mobile').replace(/\D/g, ''));
  return text;
}

/** Fills the official G-1145 PDF with the answers and returns the new file's bytes. */
export async function fillG1145(template: ArrayBuffer | Uint8Array, a: Answers): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template);
  const index = fieldIndex(doc.getForm());
  for (const [name, raw] of Object.entries(planG1145(a))) {
    const field = index.get(name);
    if (!(field instanceof PDFTextField)) throw new Error(`Not a text field: ${name}`);
    setFieldText(field, raw, 10);
  }
  doc.setTitle('Form G-1145, e-Notification of Application/Petition Acceptance');
  return doc.save();
}
