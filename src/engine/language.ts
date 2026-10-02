import type { Answers, Field } from '../forms/types';
import type { Screen } from './flow';

/**
 * USCIS forms are filled in English. People write explanations in their own words, so we warn
 * (never block) when free text looks Spanish. The check is a rough word count, tuned to stay quiet
 * on names and places ("María de la Cruz", "Calle 5 de Mayo") by only looking at fields meant for
 * the person's own words.
 */

const ES = new Set(
  ('que de la el en y los las por con para mi mis una uno un del al se su sus es fue era estaba estoy ' +
    'porque cuando pero muy como donde también tenía tengo hay ha he no sí ya me le lo nos ellos ella él ' +
    'yo usted mientras después antes desde hasta sin sobre entre este esta esto ese esa año años días ' +
    'trabajo trabajaba vivía vivo casa familia hijos padre madre esposo esposa país policía').split(' '),
);
const EN = new Set(
  ('the and of to in was is my i that for with on at by from as it he she they we his her their ' +
    'were had have has been be this an or not when because after before while who which there').split(' '),
);
/** One- or two-word answers that are plainly Spanish (relationship, status, occupation…). */
const ES_SHORT = new Set(
  ('hermano hermana esposo esposa hijo hija padre madre abuelo abuela tío tía primo prima sobrino sobrina ' +
    'suegro suegra cuñado cuñada soltero soltera casado casada divorciado divorciada viudo viuda ' +
    'estudiante ninguno ninguna desempleado desempleada obrero obrera cocinero cocinera ' +
    'limpieza construcción mesero mesera chofer agricultor turista visitante').split(' '),
);

export function looksSpanish(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  if (/[¿¡]/.test(t)) return true;
  const words = t.match(/[a-záéíóúüñ]+/g) ?? [];
  if (!words.length) return false;
  const es = words.filter((w) => ES.has(w)).length;
  const en = words.filter((w) => EN.has(w)).length;
  if (words.length <= 3) return words.some((w) => ES_SHORT.has(w)) && en === 0;
  // Short phrases need more Spanish words, so names like "María de la Cruz" pass.
  return es >= (words.length <= 6 ? 3 : 2) && es > en * 1.5;
}

/** Fields where the person writes in their own words, which must be in English. */
export const isOwnWords = (f: Field) =>
  f.type === 'longText' || (f.type === 'text' && /ingl[eé]s/i.test(f.label.es));

/** Visible own-words answers that look Spanish, with the screen to edit each one. */
export function spanishAnswers(screens: Screen[], answers: Answers): { fieldId: string; screenIndex: number }[] {
  const out: { fieldId: string; screenIndex: number }[] = [];
  screens.forEach((s, screenIndex) => {
    if (s.question.kind !== 'fields') return;
    for (const f of s.question.fields) {
      const v = answers[f.id];
      if (isOwnWords(f) && typeof v === 'string' && looksSpanish(v)) out.push({ fieldId: f.id, screenIndex });
    }
  });
  return out;
}
