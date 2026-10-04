import { describe, expect, it } from 'vitest';
import { forms, formById } from '../forms';
import { isOwnWords, looksSpanish, spanishAnswers } from './language';
import { visibleScreens } from './flow';

describe('Spanish answers', () => {
  it('spots explanations written in Spanish', () => {
    expect(looksSpanish('Me arrestaron en 2015 por manejar sin licencia y pagué la multa.')).toBe(true);
    expect(looksSpanish('Salí de mi país porque la policía me amenazó cuando trabajaba en la tienda.')).toBe(true);
    expect(looksSpanish('¿Cómo?')).toBe(true);
    expect(looksSpanish('hermano')).toBe(true);
    expect(looksSpanish('casada')).toBe(true);
  });

  it('stays quiet on English, names and places', () => {
    expect(looksSpanish('I was arrested in 2015 for driving without a license and paid the fine.')).toBe(false);
    expect(looksSpanish('I left El Salvador because the gang threatened my family in San Miguel.')).toBe(false);
    expect(looksSpanish('brother')).toBe(false);
    expect(looksSpanish('María de la Cruz')).toBe(false);
    expect(looksSpanish('Calle 5 de Mayo')).toBe(false);
    expect(looksSpanish('Los Angeles')).toBe(false);
    expect(looksSpanish('')).toBe(false);
  });

  it('checks only the fields for the person’s own words', () => {
    const own = forms.flatMap((f) => f.sections.flatMap((s) => s.questions.flatMap((q) => (q.kind === 'fields' ? q.fields : [])))).filter(isOwnWords);
    expect(own.length).toBeGreaterThan(60);
    expect(own.every((f) => !f.id.endsWith('.family') && !f.id.endsWith('.city'))).toBe(true);
  });

  it('lists the screens to fix', () => {
    // The first form that asks for the person's own words with no answers yet.
    const found = forms
      .map((form) => ({ form, screens: visibleScreens(form, {}) }))
      .map(({ form, screens }) => ({ form, at: screens.flatMap((s, i) => (s.question.kind === 'fields' ? s.question.fields.filter(isOwnWords).map((f) => ({ f, i })) : []))[0] }))
      .find((x) => x.at)!;
    const { form, at } = found;
    expect(spanishAnswers(visibleScreens(form, {}), { [at.f.id]: 'I was born in Mexico and moved here in 2010.' })).toEqual([]);
    const answers = { [at.f.id]: 'Me amenazaron porque mi esposo era policía en el pueblo.' };
    expect(spanishAnswers(visibleScreens(form, answers), answers)).toEqual([{ fieldId: at.f.id, screenIndex: at.i }]);
    expect(formById(form.id)).toBe(form);
  });
});
