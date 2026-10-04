import type { T } from '../i18n';
import type { Field, FieldType } from '../forms/types';

const DATE = /^(\d{2})\/(\d{2})\/(\d{4})$/;

export function parseUsDate(s: string): Date | null {
  const m = DATE.exec(s.trim());
  if (!m) return null;
  const [mm, dd, yyyy] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(yyyy, mm - 1, dd);
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return null;
  return d;
}

const digits = (s: string) => s.replace(/\D/g, '');

/** Normalizes what a person typed into the shape the form expects. */
export function normalize(type: FieldType, raw: string): string {
  const s = raw.trim();
  switch (type) {
    case 'aNumber': {
      const d = digits(s);
      return d ? `A${d.padStart(9, '0')}` : '';
    }
    case 'ssn': {
      const d = digits(s);
      return d.length === 9 ? `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}` : s;
    }
    case 'phone': {
      const d = digits(s);
      return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : s;
    }
    case 'state':
      return s.toUpperCase();
    case 'receipt':
    case 'i94':
      return s.replace(/[\s-]/g, '').toUpperCase();
    case 'uscisAccount':
      return digits(s);
    case 'sevis': {
      const d = digits(s);
      return d ? `N${d.padStart(10, '0')}` : '';
    }
    case 'category':
      return s.replace(/\s/g, '');
    default:
      return s;
  }
}

const msg = {
  date: { es: 'Escriba la fecha como MM/DD/AAAA, por ejemplo 03/14/1990.', en: 'Write the date as MM/DD/YYYY, for example 03/14/1990.' },
  past: { es: 'Esta fecha debe ser en el pasado.', en: 'This date must be in the past.' },
  future: { es: 'Esta fecha debe ser en el futuro.', en: 'This date must be in the future.' },
  aNumber: { es: 'El A-Number tiene de 7 a 9 números, por ejemplo A123456789.', en: 'An A-Number has 7 to 9 digits, for example A123456789.' },
  ssn: { es: 'El número de Seguro Social tiene 9 números, por ejemplo 123-45-6789.', en: 'A Social Security number has 9 digits, for example 123-45-6789.' },
  zip: { es: 'El código postal tiene 5 números, por ejemplo 90210.', en: 'A ZIP code has 5 digits, for example 90210.' },
  phone: { es: 'Escriba 10 números, con código de área: 213 555 0123.', en: 'Enter 10 digits, with area code: 213 555 0123.' },
  email: { es: 'Revise el correo; debe verse como nombre@ejemplo.com.', en: 'Check the email; it should look like name@example.com.' },
  state: { es: 'Use la abreviatura de 2 letras del estado, por ejemplo CA o TX.', en: 'Use the 2-letter state abbreviation, for example CA or TX.' },
  receipt: { es: 'El número de recibo tiene 3 letras y 10 números, por ejemplo IOE0123456789.', en: 'A receipt number has 3 letters and 10 digits, for example IOE0123456789.' },
  i94: { es: 'El número I-94 tiene 11 caracteres, letras o números.', en: 'An I-94 number has 11 characters, letters or digits.' },
  uscisAccount: { es: 'El número de cuenta de USCIS tiene 12 números.', en: 'A USCIS online account number has 12 digits.' },
  sevis: { es: 'El número SEVIS es una N seguida de 10 números, por ejemplo N0012345678.', en: 'A SEVIS number is an N followed by 10 digits, for example N0012345678.' },
  number: { es: 'Escriba solo números, sin puntos ni comas.', en: 'Enter digits only, without periods or commas.' },
  unit: { es: 'El número de apartamento, suite o piso cabe en 6 caracteres, por ejemplo Apt 4B.', en: 'The apartment, suite or floor number fits 6 characters, for example Apt 4B.' },
  category: { es: 'Escriba la categoría con paréntesis, por ejemplo (c)(10) o (a)(17).', en: 'Write the category with parentheses, for example (c)(10) or (a)(17).' },
} satisfies Record<string, T>;

const STATES = new Set(
  'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY AS GU MP PR VI'.split(' '),
);

/**
 * Splits an eligibility category such as "(c)(3)(C)" into the parts the form prints in separate
 * parenthesized boxes: ["c", "3", "C"]. Returns null when it isn't shaped like a category.
 */
export function parseCategory(raw: string): [string, string, string] | null {
  const m = /^\(([a-z])\)\((\d{1,3})\)(?:\(([a-z0-9]{1,4})\))?$/i.exec(raw.replace(/\s/g, ''));
  return m ? [m[1].toLowerCase(), m[2], m[3] ?? ''] : null;
}

/** Splits an apartment line such as "Apt 4B" or "Suite 200" into the form's unit checkbox and number. */
export function parseUnit(raw: string): { kind: 'APT' | 'STE' | 'FLR'; number: string } | null {
  const s = raw.trim();
  if (!s) return null;
  const m = /^(apt\.?|apartment|apto\.?|departamento|depto\.?|ste\.?|suite|flr\.?|floor|fl\.?|piso|#)?\s*(.*)$/i.exec(s)!;
  const word = (m[1] ?? '').toLowerCase().replace('.', '');
  const kind = ['ste', 'suite'].includes(word) ? 'STE' : ['flr', 'floor', 'fl', 'piso'].includes(word) ? 'FLR' : 'APT';
  return { kind, number: m[2].replace(/^#\s*/, '').trim() };
}

/** Returns an error message, or null when the value is acceptable. Empty values are checked by `required` only. */
export function validateField(field: Field, value: string, today = new Date()): T | null {
  const v = value.trim();
  if (!v) return field.required ? { es: 'Esta respuesta es necesaria.', en: 'This answer is required.' } : null;
  if (field.maxLength && v.length > field.maxLength) {
    return {
      es: `En el formulario caben ${field.maxLength} caracteres; ahora hay ${v.length}. Abrevie (por ejemplo St, Ave, Blvd).`,
      en: `The form fits ${field.maxLength} characters; this has ${v.length}. Abbreviate (for example St, Ave, Blvd).`,
    };
  }
  switch (field.type) {
    case 'date':
    case 'pastDate':
    case 'futureDate': {
      const d = parseUsDate(v);
      if (!d) return msg.date;
      if (field.type === 'pastDate' && d > today) return msg.past;
      if (field.type === 'futureDate' && d < today) return msg.future;
      return null;
    }
    case 'aNumber': {
      const n = digits(v).length;
      return /^[Aa]?[\d\s-]+$/.test(v) && n >= 7 && n <= 9 ? null : msg.aNumber;
    }
    case 'ssn':
      return /^[\d\s-]+$/.test(v) && digits(v).length === 9 ? null : msg.ssn;
    case 'zip':
      return /^\d{5}(-?\d{4})?$/.test(v) ? null : msg.zip;
    case 'phone':
      return /^[\d\s()+.-]+$/.test(v) && digits(v).replace(/^1(?=\d{10}$)/, '').length === 10 ? null : msg.phone;
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : msg.email;
    case 'state':
      return STATES.has(v.toUpperCase()) ? null : msg.state;
    case 'receipt':
      return /^[A-Za-z]{3}\d{10}$/.test(v.replace(/[\s-]/g, '')) ? null : msg.receipt;
    case 'i94':
      return /^[A-Za-z0-9]{11}$/.test(v.replace(/[\s-]/g, '')) ? null : msg.i94;
    case 'uscisAccount':
      return /^[\d\s-]+$/.test(v) && digits(v).length === 12 ? null : msg.uscisAccount;
    case 'sevis':
      return /^[Nn]?[\d\s-]+$/.test(v) && digits(v).length >= 1 && digits(v).length <= 10 ? null : msg.sevis;
    case 'category':
      return parseCategory(v) ? null : msg.category;
    case 'select':
      return field.options?.some((o) => o.value === v) ? null : { es: 'Elija una opción de la lista.', en: 'Choose an option from the list.' };
    case 'number':
      return /^\d+$/.test(v) ? null : msg.number;
    case 'unit':
      return (parseUnit(v)?.number.length ?? 0) <= 6 ? null : msg.unit;
    default:
      return null;
  }
}
