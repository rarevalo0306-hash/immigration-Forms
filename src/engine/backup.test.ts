import { beforeEach, describe, expect, it } from 'vitest';
import { backupFileName, makeBackup, parseBackup } from './backup';
import { clearAll, exportAll, exportChecked, importAll, load, loadChecked, loadLang, save, saveChecked, saveLang } from '../storage';
import { useMemoryStorage } from '../test/memoryStorage';

describe('backup files', () => {
  beforeEach(() => {
    useMemoryStorage();
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

  it('carries the ticked checklist documents', () => {
    saveChecked('i-485', ['photos', 'fee']);
    saveChecked('pkg-matrimonio', ['marriageCert']);
    const text = JSON.stringify(makeBackup({}, new Date(), exportChecked(['i-485', 'pkg-matrimonio', 'i-765'])));
    clearAll();
    expect(loadChecked('i-485')).toEqual([]);
    const parsed = parseBackup(text, ['i-485'], ['i-485', 'pkg-matrimonio']);
    expect(parsed.ok && parsed.checklists).toEqual({ 'i-485': ['photos', 'fee'], 'pkg-matrimonio': ['marriageCert'] });
    // Older backups have no checklists.
    const old = parseBackup(JSON.stringify({ app: 'camino', version: 1, exported: '', forms: {} }), ['i-485']);
    expect(old.ok && old.checklists).toEqual({});
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
    expect(parsed).toEqual({ ok: true, forms: { 'i-485': { answers: { 'name.family': 'Ruiz' }, position: 2 } }, checklists: {}, skipped: ['x-1', 'i-765', 'i-90'] });
  });

  it('names the file with the date', () => {
    expect(backupFileName(new Date('2026-10-03T12:00:00Z'))).toBe('camino-respaldo-2026-10-03.json');
    expect(backupFileName(new Date('2026-10-03T12:00:00Z'), 'Ana López Núñez')).toBe('camino-respaldo-ana-lopez-nunez-2026-10-03.json');
  });
});
