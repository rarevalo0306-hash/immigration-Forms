import type { Answers, Field, FormDefinition, Option } from '../forms/types';

/**
 * Reusing a person's data across forms.
 *
 * Forms name the same person differently: on the I-485 the immigrant is `name.*`, on the I-130
 * the same person is `ben.name.*` and the petitioner is `pet.name.*`, on the I-864 `name.*` is the
 * sponsor. So each form lists which prefix holds which person (its roles), and data moves between
 * forms by role, never by raw answer id.
 */

export type Role = 'immigrant' | 'sponsor';

/** The facts about a person that mean the same thing on every form. */
export const PERSON_FIELDS = [
  'name.family', 'name.given', 'name.middle',
  'aNumber', 'ssn', 'uscisAccount',
  'dob', 'sex', 'birthCity', 'birthCountry', 'citizenship',
  'phone', 'mobile', 'email',
  'mailing.careOf', 'mailing.street', 'mailing.unit', 'mailing.number', 'mailing.city', 'mailing.state', 'mailing.zip',
  'mailing.province', 'mailing.postal', 'mailing.country',
  'home.street', 'home.unit', 'home.number', 'home.city', 'home.state', 'home.zip', 'home.province', 'home.postal', 'home.country',
  'ethnicity', 'race', 'heightFeet', 'heightInches', 'weight', 'eyes', 'hair',
] as const;

/** Which prefix holds which person on each form. Forms not listed are filled by the immigrant. */
const ROLES: Record<string, Partial<Record<Role, string>>> = {
  'i-130': { sponsor: 'pet', immigrant: 'ben' },
  'i-129f': { sponsor: 'pet', immigrant: 'ben' },
  'i-864': { sponsor: '', immigrant: 'principal' },
  'i-864ez': { sponsor: '', immigrant: 'principal' },
  'i-865': { sponsor: '' },
  'i-134': { sponsor: '', immigrant: 'ben' },
  'i-864a': { sponsor: 'sponsor' },
  // The N-600 is about a child, often filed by a parent: nobody's data moves in or out.
  'n-600': {},
};

/** Forms that call the home address something else. */
const HOME_ALIAS: Record<string, string> = { 'i-765': 'physical', 'i-821d': 'present', 'ar-11': 'present', 'eoir-33': 'present' };

/**
 * Forms where "same address?" means mailing and home are one place. (On the I-914 and I-918 it
 * asks whether mail there is safe, so it says nothing about the other address.)
 */
const SAME_MEANS_SAME = (formId: string) => formId !== 'i-914' && formId !== 'i-918';
const SAME_ID: Record<string, string> = { 'i-765': 'sameAddress', 'i-821d': 'presentSame' };

export const rolesOf = (formId: string): Partial<Record<Role, string>> => ROLES[formId] ?? { immigrant: '' };

/** What a form accepts for one answer id. */
type Target =
  | { kind: 'field'; field: Field }
  | { kind: 'choice'; options: Option[]; multiple: boolean };

function targets(form: FormDefinition): Map<string, Target> {
  const out = new Map<string, Target>();
  for (const s of form.sections)
    for (const q of s.questions) {
      if (q.kind === 'fields') for (const f of q.fields) out.set(f.id, { kind: 'field', field: f });
      else if (q.kind === 'choice') out.set(q.id, { kind: 'choice', options: q.options, multiple: !!q.multiple });
      else for (const i of q.items) out.set(i.id, { kind: 'choice', multiple: false, options: [{ value: 'yes', label: { es: '', en: '' } }, { value: 'no', label: { es: '', en: '' } }] });
    }
  return out;
}

/** The answer id a person fact has on a form, e.g. `ben.name.family` or `pet.family`. */
function idFor(ids: Map<string, Target>, formId: string, prefix: string, fact: string): string | undefined {
  if (fact.startsWith('home.') && HOME_ALIAS[formId]) fact = `${HOME_ALIAS[formId]}.${fact.slice(5)}`;
  if (!prefix) return ids.has(fact) ? fact : undefined;
  const candidates = [`${prefix}.${fact}`];
  if (fact.startsWith('name.')) candidates.push(`${prefix}.${fact.slice(5)}`);
  return candidates.find((c) => ids.has(c));
}

const DATE_TYPES = new Set(['date', 'pastDate', 'futureDate']);

/** Whether a value from another form fits this target as is (same options, same kind of field). */
function fits(t: Target, value: string | string[], sourceType?: string): boolean {
  if (t.kind === 'choice') {
    const allowed = new Set(t.options.map((o) => o.value));
    if (t.multiple) return Array.isArray(value) && value.length > 0 && value.every((v) => allowed.has(v));
    return typeof value === 'string' && allowed.has(value);
  }
  if (typeof value !== 'string' || !value.trim()) return false;
  const f = t.field;
  if (f.type === 'select') return !!f.options?.some((o) => o.value === value);
  if (f.maxLength && value.length > f.maxLength) return false;
  if (sourceType && sourceType !== f.type && !(DATE_TYPES.has(sourceType) && DATE_TYPES.has(f.type))) return false;
  return true;
}

export interface SavedForm {
  formId: string;
  answers: Answers;
  /** When it was last saved (ms); 0 when unknown. */
  updated: number;
}

interface Fact {
  value: string | string[];
  type?: string;
  from: string;
  updated: number;
}

/**
 * The interpreter's and preparer's details (forms/assistance.ts) use the same ids on every form, so
 * someone who helped on one form starts the next. They only show when the person says they had help.
 */
const HELPER_KEYS = ['family', 'given', 'business', 'street', 'unit', 'city', 'state', 'zip', 'province', 'postal', 'country', 'phone', 'mobile', 'email'];
export const HELPER_FIELDS = [
  ...HELPER_KEYS.map((k) => `interp.${k}`),
  'interp.language',
  ...HELPER_KEYS.map((k) => `prep.${k}`),
  'prep.statement',
];

export type Profile = Partial<Record<Role | 'helpers', Record<string, Fact>>>;

/** Everything known about each person, from the most recently saved form that has it. */
export function buildProfile(forms: FormDefinition[], saved: SavedForm[]): Profile {
  const byId = new Map(forms.map((f) => [f.id, f]));
  const profile: Profile = {};
  for (const s of saved) {
    const form = byId.get(s.formId);
    if (!form) continue;
    const ids = targets(form);
    for (const [role, prefix] of Object.entries(rolesOf(form.id)) as [Role, string][]) {
      for (const fact of PERSON_FIELDS) {
        const id = idFor(ids, form.id, prefix, fact);
        const value = id && s.answers[id];
        if (!id || value === undefined || value === '' || (Array.isArray(value) && !value.length)) continue;
        const t = ids.get(id)!;
        const known = (profile[role] ??= {})[fact];
        if (known && known.updated > s.updated) continue;
        profile[role]![fact] = { value, type: t.kind === 'field' ? t.field.type : undefined, from: form.number, updated: s.updated };
      }
      // "I live where I get my mail": the address given once is both.
      const same = s.answers[prefix ? `${prefix}.mailingSame` : SAME_ID[form.id] ?? 'mailingSame'] === 'yes' && SAME_MEANS_SAME(form.id);
      const facts = profile[role];
      if (same && facts) copyAddress(facts, s, form.number);
    }
    for (const id of HELPER_FIELDS) {
      const value = s.answers[id];
      const t = ids.get(id);
      if (!t || value === undefined || value === '' || Array.isArray(value)) continue;
      const known = (profile.helpers ??= {})[id];
      if (known && known.updated > s.updated) continue;
      profile.helpers[id] = { value, type: t.kind === 'field' ? t.field.type : undefined, from: form.number, updated: s.updated };
    }
  }
  return profile;
}

const ADDRESS_PARTS = PERSON_FIELDS.filter((f) => f.startsWith('mailing.')).map((f) => f.slice(8));

/** Fill the address this form didn't ask for from the one it did, both from the same save. */
function copyAddress(facts: Record<string, Fact>, s: SavedForm, from: string) {
  const fromThis = (group: string) => ADDRESS_PARTS.some((p) => facts[`${group}.${p}`]?.from === from && facts[`${group}.${p}`].updated === s.updated);
  const [src, dst] = fromThis('mailing') && !fromThis('home') ? ['mailing', 'home'] : fromThis('home') && !fromThis('mailing') ? ['home', 'mailing'] : [];
  if (!src || !dst) return;
  for (const p of ADDRESS_PARTS) {
    const known = facts[`${src}.${p}`];
    const existing = facts[`${dst}.${p}`];
    if (!known || known.from !== from || known.updated !== s.updated) continue;
    if (existing && existing.updated > s.updated) continue;
    facts[`${dst}.${p}`] = known;
  }
}

export interface Prefill {
  answers: Answers;
  /** Form numbers the data came from, e.g. ['I-485']. */
  sources: string[];
}

/** Answers to start a form with, from what the person already told Camino on other forms. */
export function prefillFor(form: FormDefinition, profile: Profile): Prefill {
  const ids = targets(form);
  const answers: Answers = {};
  const sources = new Set<string>();
  for (const [role, prefix] of Object.entries(rolesOf(form.id)) as [Role, string][]) {
    const facts = profile[role];
    if (!facts) continue;
    for (const fact of PERSON_FIELDS) {
      const known = facts[fact];
      const id = known && idFor(ids, form.id, prefix, fact);
      if (!known || !id || !fits(ids.get(id)!, known.value, known.type)) continue;
      answers[id] = known.value;
      sources.add(known.from);
    }
  }
  for (const id of HELPER_FIELDS) {
    const known = profile.helpers?.[id];
    const t = ids.get(id);
    if (!known || !t || !fits(t, known.value, known.type)) continue;
    answers[id] = known.value;
    sources.add(known.from);
  }
  return { answers, sources: [...sources].sort() };
}
