import type { Answers, Field, Section } from './types';
import { all, anyAddress, is, nameFields, yesNo } from './helpers';
import type { T } from '../i18n';

/**
 * The interpreter's and preparer's parts that most USCIS forms end with: name, business, address,
 * phone and email, the interpreter's language and the preparer's statement. They sign by hand.
 *
 * Every form asks the same thing with the same answer ids (`interp.*`, `prep.*`), so the details
 * of someone who helped on one form start the next one (see engine/profile.ts). Each form decides
 * when the section applies, usually from its own applicant's-statement answers
 * (`readsEnglish === 'B'`, `preparer === 'yes'`).
 */

const t = (es: string, en: string): T => ({ es, en });

export interface HelperPerson {
  family: string;
  given: string;
  business: string;
  street: string;
  unit: string;
  city: string;
  state: string;
  zip: string;
  province: string;
  postal: string;
  country: string;
  phone: string;
  mobile: string;
  email: string;
}

export interface Assistance {
  interpreter?: HelperPerson & { language: string };
  /** `statement`: 'notAttorney' (box 7.a style) or 'attorneyExtends' / 'attorneyNotExtends'. */
  preparer?: HelperPerson & { statement: string };
}

const contact = (prefix: string, ref: string): Field[] => [
  { id: `${prefix}.phone`, type: 'phone', required: true, label: t('Teléfono de día', 'Daytime telephone'), formRef: `${ref} · Daytime Telephone Number` },
  { id: `${prefix}.mobile`, type: 'phone', label: t('Celular', 'Mobile telephone'), formRef: `${ref} · Mobile Telephone Number` },
  { id: `${prefix}.email`, type: 'email', label: t('Correo electrónico', 'Email address'), formRef: `${ref} · Email Address` },
];

/**
 * The questions for the interpreter's and preparer's parts.
 * `interpreterPart` / `preparerPart` are the form's own part names (e.g. 'Part 7'); leave one out
 * when the form has no such part.
 */
export function assistanceSection(opts: {
  usedInterpreter: (a: Answers) => boolean;
  usedPreparer: (a: Answers) => boolean;
  interpreterPart?: string;
  preparerPart?: string;
}): Section {
  const { usedInterpreter, usedPreparer, interpreterPart: ip, preparerPart: pp } = opts;
  const both = all(usedInterpreter, usedPreparer);
  const needsPreparer = all(usedPreparer, (a) => !(ip && both(a) && a['prep.same'] === 'yes'));
  const questions: Section['questions'] = [];
  if (ip)
    questions.push(
      {
        id: 'interp.who',
        kind: 'fields',
        formRef: `${ip} · Interpreter's Full Name`,
        showIf: usedInterpreter,
        question: t('¿Quién le interpretó el formulario?', 'Who interpreted the form for you?'),
        why: t(
          'El formulario pide los datos de la persona que le leyó las preguntas en su idioma. Esa persona firma a mano su parte.',
          'The form asks for the details of the person who read you the questions in your language. That person signs their part by hand.',
        ),
        fields: [
          ...nameFields('interp', `${ip} · Interpreter's Full Name`),
          { id: 'interp.business', type: 'text', label: t('Empresa u organización (si tiene)', 'Business or organization (if any)'), formRef: `${ip} · Interpreter's Business or Organization Name` },
        ],
      },
      {
        id: 'interp.address',
        kind: 'fields',
        formRef: `${ip} · Interpreter's Mailing Address`,
        showIf: usedInterpreter,
        question: t('¿Cuál es la dirección del intérprete?', 'What is the interpreter’s mailing address?'),
        fields: anyAddress('interp', `${ip} · Interpreter's Mailing Address`),
      },
      {
        id: 'interp.contact',
        kind: 'fields',
        formRef: `${ip} · Interpreter's Contact Information`,
        showIf: usedInterpreter,
        question: t('¿Cómo se contacta al intérprete?', 'How can the interpreter be reached?'),
        fields: [
          ...contact('interp', `${ip} · Interpreter's Contact Information`),
          { id: 'interp.language', type: 'text', required: true, label: t('Idioma que interpretó (en inglés)', 'Language interpreted'), formRef: `${ip} · Interpreter's Certification · Language`, placeholder: 'Spanish' },
        ],
      },
    );
  if (pp) {
    if (ip)
      questions.push({
        id: 'prep.same',
        kind: 'choice',
        formRef: `${pp} · Preparer's Full Name`,
        showIf: both,
        question: t('¿La misma persona le interpretó y le preparó el formulario?', 'Did the same person interpret and prepare the form?'),
        options: yesNo,
      });
    questions.push(
      {
        id: 'prep.who',
        kind: 'fields',
        formRef: `${pp} · Preparer's Full Name`,
        showIf: needsPreparer,
        question: t('¿Quién le preparó el formulario?', 'Who prepared the form for you?'),
        why: t('Es la persona que llenó o escribió las respuestas por usted. Firma a mano su parte.', 'This is the person who filled in or wrote the answers for you. They sign their part by hand.'),
        fields: [
          ...nameFields('prep', `${pp} · Preparer's Full Name`),
          { id: 'prep.business', type: 'text', label: t('Empresa u organización (si tiene)', 'Business or organization (if any)'), formRef: `${pp} · Preparer's Business or Organization Name` },
        ],
      },
      {
        id: 'prep.address',
        kind: 'fields',
        formRef: `${pp} · Preparer's Mailing Address`,
        showIf: needsPreparer,
        question: t('¿Cuál es la dirección de quien preparó el formulario?', 'What is the preparer’s mailing address?'),
        fields: anyAddress('prep', `${pp} · Preparer's Mailing Address`),
      },
      {
        id: 'prep.contact',
        kind: 'fields',
        formRef: `${pp} · Preparer's Contact Information`,
        showIf: needsPreparer,
        question: t('¿Cómo se contacta a quien preparó el formulario?', 'How can the preparer be reached?'),
        fields: contact('prep', `${pp} · Preparer's Contact Information`),
      },
      {
        id: 'prep.statement',
        kind: 'choice',
        formRef: `${pp} · Preparer's Statement`,
        showIf: usedPreparer,
        question: t('¿Quien preparó el formulario es abogado/a o representante acreditado/a?', 'Is the preparer an attorney or accredited representative?'),
        why: t(
          'Si es abogado/a o representante acreditado/a, normalmente también presenta el Formulario G-28.',
          'If they are an attorney or accredited representative, they usually also file Form G-28.',
        ),
        options: [
          { value: 'notAttorney', label: t('No, no es abogado/a ni representante acreditado/a', 'No, not an attorney or accredited representative') },
          { value: 'attorneyExtends', label: t('Sí, y lo/la representa más allá de llenar el formulario', 'Yes, and they represent me beyond preparing the form') },
          { value: 'attorneyNotExtends', label: t('Sí, pero solo preparó el formulario', 'Yes, but they only prepared the form') },
        ],
      },
    );
  }
  return {
    id: 'assistance',
    part: [ip, pp].filter(Boolean).join(' · '),
    title: t('Quién le ayudó', 'Who helped you'),
    questions,
  };
}

const PERSON_KEYS = ['family', 'given', 'business', 'street', 'unit', 'city', 'state', 'zip', 'province', 'postal', 'country', 'phone', 'mobile', 'email'] as const;

const person = (a: Answers, prefix: string): HelperPerson =>
  Object.fromEntries(PERSON_KEYS.map((k) => [k, String(a[`${prefix}.${k}`] ?? '').trim()])) as unknown as HelperPerson;

/**
 * What the PDF fillers write in the interpreter's and preparer's parts. When the same person did
 * both, the preparer's details are the interpreter's.
 */
export function assistance(a: Answers, used: { interpreter: boolean; preparer: boolean }): Assistance {
  const out: Assistance = {};
  if (used.interpreter) out.interpreter = { ...person(a, 'interp'), language: String(a['interp.language'] ?? '').trim() };
  if (used.preparer) {
    const base = used.interpreter && a['prep.same'] === 'yes' ? person(a, 'interp') : person(a, 'prep');
    out.preparer = { ...base, statement: String(a['prep.statement'] ?? '') };
  }
  return out;
}

/** The usual gates: the applicant's statement answers most forms already ask. */
export const usedInterpreter = is('readsEnglish', 'B');
export const usedPreparer = is('preparer', 'yes');
