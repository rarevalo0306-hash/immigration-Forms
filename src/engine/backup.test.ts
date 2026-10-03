import { beforeEach, describe, expect, it } from 'vitest';
import { backupFileName, makeBackup, parseBackup } from './backup';
import { clearAll, exportAll, importAll, load, loadLang, save, saveLang } from '../storage';

// A tiny in-memory localStorage for the storage functions.
class MemoryStorage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}

describe('backup files', () => {
  beforeEach(() => {
    const store = new MemoryStorage();
    // Object.keys(localStorage) lists the saved keys, as in a browser.
    const proxy = new Proxy(store, {
      ownKeys: (t) => [...(t as unknown as { m: Map<string, string> }).m.keys()],
      getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
    });
    (globalThis as unknown as { localStorage: Storage }).localStorage = proxy as unknown as Storage;
  });

  it('round-trips every form with its position and save time', () => {
    save('i-485', { answers: { 'name.family': 'Ruiz', race: ['white'] }, position: 3 });
    save('i-765', { answers: { category: '(c)(9)' }, position: 1 });
    save('n-400', { answers: {}, position: 0 });
    const backup = makeBackup(exportAll(['i-485', 'i-765', 'n-400']), new Date('2026-10-03T12:00:00Z'));
    expect(Object.keys(backup.forms)).toEqual(['i-485', 'i-765']);
    const text = JSON.stringify(backup);

    clearAll();
    expect(load('i-485')).toBeNull();
    const parsed = parseBackup(text, ['i-485', 'i-765', 'n-400']);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    importAll(parsed.forms);
    expect(load('i-485')).toEqual(backup.forms['i-485']);
    expect(load('i-765')?.answers.category).toBe('(c)(9)');
  });

  it('clearing keeps the language choice', () => {
    saveLang('en');
    save('i-90', { answers: { aNumber: '123456789' }, position: 2 });
    clearAll();
    expect(load('i-90')).toBeNull();
    expect(loadLang()).toBe('en');
  });

  it('rejects files that are not Camino backups', () => {
    expect(parseBackup('not json', ['i-485']).ok).toBe(false);
    expect(parseBackup('{"forms":{}}', ['i-485']).ok).toBe(false);
    expect(parseBackup(JSON.stringify({ app: 'camino', version: 2, forms: {} }), ['i-485']).ok).toBe(false);
  });

  it('skips unknown forms and malformed answers', () => {
    const text = JSON.stringify({
      app: 'camino',
      version: 1,
      exported: '',
      forms: {
        'i-485': { answers: { 'name.family': 'Ruiz' }, position: 2 },
        'x-1': { answers: {}, position: 0 },
        'i-765': { answers: { category: 5 }, position: 0 },
        'i-90': { answers: {}, position: -1 },
      },
    });
    const parsed = parseBackup(text, ['i-485', 'i-765', 'i-90']);
    expect(parsed).toEqual({ ok: true, forms: { 'i-485': { answers: { 'name.family': 'Ruiz' }, position: 2 } }, skipped: ['x-1', 'i-765', 'i-90'] });
  });

  it('names the file with the date', () => {
    expect(backupFileName(new Date('2026-10-03T12:00:00Z'))).toBe('camino-respaldo-2026-10-03.json');
  });
});
