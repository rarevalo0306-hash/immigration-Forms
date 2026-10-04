import { describe, expect, it } from 'vitest';
import { categories } from './categories';
import { catalog } from './catalog';

describe('categories', () => {
  it('puts every form in exactly one group', () => {
    const ids = categories.flatMap((c) => c.formIds);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual(catalog.map((f) => f.id).sort());
  });
});
