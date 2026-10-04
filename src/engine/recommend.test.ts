import { describe, expect, it } from 'vitest';
import { catalog } from '../forms/catalog';
import { packageById } from '../forms/packages';
import { plain, recommend } from './recommend';

const best = (q: string) => {
  const t = recommend(q, catalog).best?.target;
  return t ? (t.kind === 'study' ? 'study' : `${t.kind}:${t.id}`) : undefined;
};

describe('recommending a form from plain words', () => {
  it('normalizes accents and capitals', () => {
    expect(plain('Me CASÉ con un ciudadano!')).toBe('me case con un ciudadano');
  });

  it('understands everyday situations', () => {
    expect(best('Me quiero casar con mi novia que es ciudadana y quedarme aquí')).toBe('package:matrimonio');
    expect(best('me casé con un ciudadano americano')).toBe('package:matrimonio');
    expect(best('mi esposo es ciudadano y yo vivo en mi país')).toBe('package:consulado');
    expect(best('mi novia es ciudadana y vive en otro país')).toBe('package:prometido');
    expect(best('se me perdió la green card')).toBe('form:i-90');
    expect(best('renovar mi mica')).toBe('form:i-90');
    expect(best('quitar las condiciones de mi residencia de 2 años')).toBe('form:i-751');
    expect(best('quiero hacerme ciudadano')).toBe('package:ciudadania');
    expect(best('necesito permiso de trabajo')).toBe('form:i-765');
    expect(best('tengo miedo de regresar a mi país')).toBe('package:asilo');
    expect(best('renovar DACA')).toBe('package:daca');
    expect(best('me mudé de casa')).toBe('package:mudanza');
    expect(best('quiero viajar a México y regresar')).toBe('form:i-131');
    expect(best('quiero pedir a mi mamá')).toBe('form:i-130');
    expect(best('mi esposo me maltrata y es ciudadano')).toBe('form:i-360');
    expect(best('fui víctima de un delito')).toBe('form:i-918');
    expect(best('estudiar para el examen')).toBe('study');
    expect(best('no puedo pagar la tarifa')).toBe('form:i-912');
  });

  it('finds a typed form number', () => {
    expect(best('I-765')).toBe('form:i-765');
    expect(best('n400')).toBe('form:n-400');
    expect(best('eoir 33')).toBe('form:eoir-33');
  });

  it('falls back to words in titles, and stays quiet on nothing', () => {
    expect(recommend('naturalización', catalog).best).toBeTruthy();
    expect(recommend('', catalog).best).toBeUndefined();
    expect(recommend('zzzz qqqq', catalog).best).toBeUndefined();
  });

  it('only recommends packages and forms that exist', () => {
    const queries = ['me casé con un ciudadano', 'asilo', 'daca', 'tps', 'me mudé', 'ciudadanía', 'mi novia vive fuera es ciudadana', 'esposo ciudadano consulado'];
    for (const q of queries) {
      const r = recommend(q, catalog);
      for (const x of [r.best, ...r.more]) {
        if (!x || x.target.kind === 'study') continue;
        if (x.target.kind === 'package') expect(packageById(x.target.id), q).toBeTruthy();
        else expect(catalog.some((f) => f.id === (x.target as { id: string }).id), q).toBe(true);
      }
    }
  });
});
