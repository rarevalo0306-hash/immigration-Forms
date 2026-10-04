import type { Cards, Exemption, StudySettings } from './engine';
import { DEFAULT_SETTINGS } from './engine';
import { placeByCode } from './states';

/** A finished interview practice. */
export interface Attempt {
  version: StudySettings['version'];
  at: number;
  right: number;
  wrong: number;
  passed: boolean;
}

/** What the study section keeps per case (storage key `…study:v1`). */
export interface StudyState {
  /** Whether the person went through the first setup. */
  ready: boolean;
  settings: StudySettings;
  cards: Cards;
  attempts: Attempt[];
}

export const EMPTY_STUDY: StudyState = { ready: false, settings: DEFAULT_SETTINGS, cards: {}, attempts: [] };

/** Keep the last few practices; enough to show progress. */
export const MAX_ATTEMPTS = 10;

const obj = (x: unknown): Record<string, unknown> => (x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : {});
const str = (x: unknown, max = 80) => (typeof x === 'string' ? x.slice(0, max) : undefined);
const num = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : undefined);

/** Reads saved or imported study state, dropping anything malformed. */
export function parseStudy(raw: unknown): StudyState {
  const r = obj(raw);
  const s = obj(r.settings);
  const names = obj(s.names);
  const exemption: Exemption = s.exemption === '50-20' || s.exemption === '65-20' ? s.exemption : 'none';
  const settings: StudySettings = {
    version: s.version === '2008' ? '2008' : '2025',
    exemption,
    state: typeof s.state === 'string' && placeByCode(s.state) ? s.state : '',
    names: Object.fromEntries((['senator', 'representative', 'governor'] as const).flatMap((k) => (str(names[k]) ? [[k, str(names[k])]] : []))),
  };
  const cards: Cards = {};
  for (const [id, c] of Object.entries(obj(r.cards))) {
    const box = num(obj(c).box);
    const due = num(obj(c).due);
    if (/^(2025|2008):\d{1,3}$/.test(id) && box !== undefined && due !== undefined && box >= 0 && box <= 5) cards[id] = { box: Math.round(box), due };
  }
  const attempts: Attempt[] = (Array.isArray(r.attempts) ? r.attempts : [])
    .map(obj)
    .filter((a) => (a.version === '2025' || a.version === '2008') && num(a.at) !== undefined && num(a.right) !== undefined && num(a.wrong) !== undefined)
    .map((a) => ({ version: a.version as Attempt['version'], at: a.at as number, right: a.right as number, wrong: a.wrong as number, passed: a.passed === true }))
    .slice(-MAX_ATTEMPTS);
  return { ready: r.ready === true, settings, cards, attempts };
}

export const isEmptyStudy = (s: StudyState) => !s.ready && !Object.keys(s.cards).length && !s.attempts.length;
