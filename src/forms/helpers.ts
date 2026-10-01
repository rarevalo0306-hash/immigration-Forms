import type { Answers, Field, Option, Question } from './types';
import type { T } from '../i18n';

export const yesNo: Option[] = [
  { value: 'yes', label: { es: 'Sí', en: 'Yes' } },
  { value: 'no', label: { es: 'No', en: 'No' } },
];

export const is =
  (id: string, ...values: string[]) =>
  (a: Answers) =>
    values.includes(String(a[id] ?? ''));

export const all =
  (...tests: ((a: Answers) => boolean)[]) =>
  (a: Answers) =>
    tests.every((t) => t(a));

export const num = (a: Answers, id: string) => Number(a[id] ?? 0) || 0;

export const nameFields = (prefix: string, ref: string, required = true): Field[] => [
  { id: `${prefix}.family`, type: 'text', required, label: { es: 'Apellido(s)', en: 'Family name (last name)' }, formRef: `${ref} · Family Name (Last Name)` },
  { id: `${prefix}.given`, type: 'text', required, label: { es: 'Nombre(s)', en: 'Given name (first name)' }, formRef: `${ref} · Given Name (First Name)` },
  { id: `${prefix}.middle`, type: 'text', label: { es: 'Segundo nombre', en: 'Middle name' }, formRef: `${ref} · Middle Name (if applicable)` },
];

export const date = (id: string, es: string, en: string, formRef: string, required = true, type: Field['type'] = 'pastDate'): Field => ({
  id,
  type,
  required,
  label: { es, en },
  formRef,
  placeholder: 'MM/DD/AAAA',
});

/** "Is there another one?" chains for the form's tables, one row per screen. */
export function rows(opts: {
  max: number;
  id: string;
  /** Whether the table applies at all (row 1 is shown when this holds). */
  first: (a: Answers) => boolean;
  question: (i: number) => T;
  more: T;
  moreWhy?: T;
  formRef: string;
  fields: (i: number) => Field[];
  why?: (i: number) => T | undefined;
  overflow: T;
}): Question[] {
  const out: Question[] = [];
  for (let i = 1; i <= opts.max; i++) {
    // Row i shows when the table applies and every earlier "another one?" was answered Yes.
    const shown = all(opts.first, (a) => [...Array(i - 1)].every((_, k) => a[`${opts.id}.more${k + 1}`] === 'yes'));
    out.push({ id: `${opts.id}${i}`, kind: 'fields', formRef: opts.formRef, question: opts.question(i), why: opts.why?.(i), showIf: shown, fields: opts.fields(i) });
    out.push({
      id: `${opts.id}.more${i}`,
      kind: 'choice',
      formRef: opts.formRef,
      question: opts.more,
      why: opts.moreWhy,
      showIf: shown,
      options: yesNo,
      ...(i === opts.max ? { notice: { tone: 'info' as const, title: { es: 'Espacio adicional', en: 'Extra space' }, body: opts.overflow } } : {}),
    });
  }
  return out;
}


/**
 * An address that may be in the U.S. or abroad. Only street, city and country are required,
 * because U.S. addresses need state and ZIP while foreign ones use province and postal code.
 */
export const anyAddress = (prefix: string, ref: string, opts: { careOf?: boolean; streetRequired?: boolean } = {}): Field[] => [
  ...(opts.careOf
    ? [{ id: `${prefix}.careOf`, type: 'text', label: { es: 'A cargo de (si recibe correo en casa de otra persona)', en: 'In care of' }, formRef: `${ref} · In Care Of Name`, maxLength: 34 } as Field]
    : []),
  { id: `${prefix}.street`, type: 'text', required: opts.streetRequired ?? true, label: { es: 'Número y calle', en: 'Street number and name' }, formRef: `${ref} · Street Number and Name`, maxLength: 34, placeholder: '1234 Main St' },
  { id: `${prefix}.unit`, type: 'unit', label: { es: 'Apartamento, suite o piso', en: 'Apartment, suite or floor' }, formRef: `${ref} · Apt. / Ste. / Flr.`, placeholder: 'Apt 4B' },
  { id: `${prefix}.city`, type: 'text', required: true, label: { es: 'Ciudad', en: 'City or town' }, formRef: `${ref} · City or Town`, maxLength: 20 },
  { id: `${prefix}.state`, type: 'state', label: { es: 'Estado (si es en EE.UU.)', en: 'State (if in the U.S.)' }, formRef: `${ref} · State`, placeholder: 'CA' },
  { id: `${prefix}.zip`, type: 'zip', label: { es: 'Código postal ZIP (si es en EE.UU.)', en: 'ZIP code (if in the U.S.)' }, formRef: `${ref} · ZIP Code` },
  { id: `${prefix}.province`, type: 'text', label: { es: 'Provincia (fuera de EE.UU.)', en: 'Province (outside the U.S.)' }, formRef: `${ref} · Province`, maxLength: 20 },
  { id: `${prefix}.postal`, type: 'text', label: { es: 'Código postal (fuera de EE.UU.)', en: 'Postal code (outside the U.S.)' }, formRef: `${ref} · Postal Code`, maxLength: 9 },
  { id: `${prefix}.country`, type: 'text', required: true, label: { es: 'País', en: 'Country' }, formRef: `${ref} · Country`, placeholder: 'United States' },
];

export const sexOptions: Option[] = [
  { value: 'female', label: { es: 'Femenino', en: 'Female' } },
  { value: 'male', label: { es: 'Masculino', en: 'Male' } },
];

export const sexField = (id: string, ref: string): Field => ({ id, type: 'select', required: true, label: { es: 'Sexo', en: 'Sex' }, formRef: `${ref} · Sex`, options: sexOptions });


/**
 * Ethnicity, race, height, weight, eye and hair color, as USCIS asks them on the I-485 and I-131.
 * The option values are the I-485's export values; other fillers translate them.
 */
const bt = (es: string, en: string): T => ({ es, en });

export const biographic = (part: string): Question[] => [
    {
      id: 'ethnicity',
      kind: 'choice',
      formRef: `${part} · Item 1 · Ethnicity`,
      question: bt('¿Es usted hispano/a o latino/a?', 'Are you Hispanic or Latino?'),
      options: [
        { value: 'hispanic', label: bt('Hispano/a o latino/a', 'Hispanic or Latino') },
        { value: 'notHispanic', label: bt('No hispano/a ni latino/a', 'Not Hispanic or Latino') },
      ],
    },
    {
      id: 'race',
      kind: 'choice',
      multiple: true,
      formRef: `${part} · Item 2 · Race`,
      question: bt('¿Cuál es su raza?', 'What is your race?'),
      why: bt('Elija todas las que apliquen.', 'Choose all that apply.'),
      options: [
        { value: 'WH', label: bt('Blanco/a', 'White') },
        { value: 'AS', label: bt('Asiático/a', 'Asian') },
        { value: 'BL', label: bt('Negro/a o afroamericano/a', 'Black or African American') },
        { value: 'AI', label: bt('Indígena americano/a o nativo/a de Alaska', 'American Indian or Alaska Native') },
        { value: 'HW', label: bt('Nativo/a de Hawái u otras islas del Pacífico', 'Native Hawaiian or Other Pacific Islander') },
      ],
    },
    {
      id: 'body',
      kind: 'fields',
      formRef: `${part} · Items 3–6`,
      question: bt('Su estatura, peso y color de ojos y cabello', 'Your height, weight, and eye and hair color'),
      why: bt('1.60 m son 5 pies 3 pulgadas; 70 kg son 154 libras.', 'In feet, inches and pounds.'),
      fields: [
        { id: 'heightFeet', type: 'select', required: true, label: { es: 'Estatura: pies', en: 'Height: feet' }, formRef: `${part} · Item 3 · Feet`, options: ['2', '3', '4', '5', '6', '7', '8'].map((v) => ({ value: v, label: { es: v, en: v } })) },
        { id: 'heightInches', type: 'select', required: true, label: { es: 'Estatura: pulgadas', en: 'Height: inches' }, formRef: `${part} · Item 3 · Inches`, options: [...Array(12)].map((_, i) => ({ value: String(i), label: { es: String(i), en: String(i) } })) },
        { id: 'weight', type: 'number', required: true, label: { es: 'Peso en libras', en: 'Weight in pounds' }, formRef: `${part} · Item 4`, maxLength: 3 },
        {
          id: 'eyes',
          type: 'select',
          required: true,
          label: { es: 'Color de ojos', en: 'Eye color' },
          formRef: `${part} · Item 5`,
          options: [
            { value: 'BN', label: bt('Café', 'Brown') },
            { value: 'BL', label: bt('Negro', 'Black') },
            { value: 'HA', label: bt('Avellana (hazel)', 'Hazel') },
            { value: 'GN', label: bt('Verde', 'Green') },
            { value: 'BU', label: bt('Azul', 'Blue') },
            { value: 'GR', label: bt('Gris', 'Gray') },
            { value: 'MA', label: bt('Granate', 'Maroon') },
            { value: 'PN', label: bt('Rosado', 'Pink') },
            { value: 'UN', label: bt('Desconocido u otro', 'Unknown / Other') },
          ],
        },
        {
          id: 'hair',
          type: 'select',
          required: true,
          label: { es: 'Color de cabello', en: 'Hair color' },
          formRef: `${part} · Item 6`,
          options: [
            { value: 'BL', label: bt('Negro', 'Black') },
            { value: 'BR', label: bt('Café', 'Brown') },
            { value: 'BN', label: bt('Rubio', 'Blond') },
            { value: 'GR', label: bt('Gris', 'Gray') },
            { value: 'WH', label: bt('Blanco', 'White') },
            { value: 'RD', label: bt('Rojo', 'Red') },
            { value: 'SA', label: bt('Rubio rojizo (sandy)', 'Sandy') },
            { value: 'NH', label: bt('Calvo/a (sin cabello)', 'Bald (no hair)') },
            { value: 'OT', label: bt('Desconocido u otro', 'Unknown / Other') },
          ],
        },
      ],
    },];
