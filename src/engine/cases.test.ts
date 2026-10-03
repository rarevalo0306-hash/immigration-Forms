import { beforeEach, describe, expect, it } from 'vitest';
import { forms } from '../forms';
import { activeCase, clearAll, createCase, deleteCase, FIRST_CASE, listCases, load, loadAll, loadLang, renameCase, save, saveLang, setActiveCase } from '../storage';
import { buildProfile, prefillFor } from './profile';
import { useMemoryStorage } from '../test/memoryStorage';

describe('cases on one device', () => {
  let m: Map<string, string>;
  beforeEach(() => {
    m = useMemoryStorage();
  });

  it('starts with one unnamed case that uses the original keys', () => {
    expect(listCases()).toEqual([{ id: FIRST_CASE, name: '' }]);
    save('i-485', { answers: { 'name.family': 'Ruiz' }, position: 1 });
    expect(m.has('camino:i-485:v1')).toBe(true);
  });

  it('keeps each case’s answers apart', () => {
    save('i-485', { answers: { 'name.family': 'Ruiz' }, position: 1 });
    const ana = createCase('  Ana  ');
    expect(activeCase()).toEqual({ id: ana, name: 'Ana' });
    expect(load('i-485')).toBeNull();
    save('i-485', { answers: { 'name.family': 'López' }, position: 2 });
    expect(m.has(`camino:${ana}:i-485:v1`)).toBe(true);
    setActiveCase(FIRST_CASE);
    expect(load('i-485')?.answers['name.family']).toBe('Ruiz');
    setActiveCase(ana);
    expect(load('i-485')?.answers['name.family']).toBe('López');
  });

  it('reuses data only from the active case', () => {
    save('i-485', { answers: { 'name.family': 'Ruiz', 'name.given': 'Carla' }, position: 1 });
    createCase('Ana');
    const prefill = prefillFor(forms.find((f) => f.id === 'i-765')!, buildProfile(forms, loadAll(forms.map((f) => f.id), 'i-765')));
    expect(prefill.answers).toEqual({});
  });

  it('renames and deletes a case with all its answers', () => {
    const ana = createCase('Ana');
    save('i-90', { answers: { aNumber: '123456789' }, position: 0 });
    renameCase(ana, 'Ana López');
    expect(listCases().map((c) => c.name)).toEqual(['', 'Ana López']);
    deleteCase(ana);
    expect(listCases().map((c) => c.id)).toEqual([FIRST_CASE]);
    expect(activeCase().id).toBe(FIRST_CASE);
    expect([...m.keys()].some((k) => k.includes(ana))).toBe(false);
  });

  it('deleting the first case leaves the other cases alone', () => {
    save('i-485', { answers: { 'name.family': 'Ruiz' }, position: 1 });
    const ana = createCase('Ana');
    save('i-485', { answers: { 'name.family': 'López' }, position: 2 });
    deleteCase(FIRST_CASE);
    expect(m.has('camino:i-485:v1')).toBe(false);
    expect(activeCase().id).toBe(ana);
    expect(load('i-485')?.answers['name.family']).toBe('López');
  });

  it('deleting the only case leaves an empty first case', () => {
    save('i-485', { answers: { 'name.family': 'Ruiz' }, position: 1 });
    deleteCase(FIRST_CASE);
    expect(listCases()).toEqual([{ id: FIRST_CASE, name: '' }]);
    expect(load('i-485')).toBeNull();
  });

  it('erasing everything removes every case but keeps the language', () => {
    saveLang('en');
    save('i-485', { answers: { 'name.family': 'Ruiz' }, position: 1 });
    createCase('Ana');
    save('i-90', { answers: { aNumber: '123456789' }, position: 0 });
    clearAll();
    expect([...m.keys()]).toEqual(['camino:lang']);
    expect(loadLang()).toBe('en');
    expect(listCases()).toEqual([{ id: FIRST_CASE, name: '' }]);
  });
});
