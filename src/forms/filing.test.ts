import { describe, expect, it } from 'vitest';
import { forms } from '.';
import { filingLinks } from './filing';

describe('where to file', () => {
  it('every form links to its official page first, on official sites only', () => {
    for (const f of forms) {
      const { links } = filingLinks(f.id, f.number);
      expect(links[0].url, f.id).toMatch(f.id.startsWith('eoir-') ? /^https:\/\/www\.justice\.gov\/eoir\// : /^https:\/\/www\.uscis\.gov\/[a-z0-9-]+$/);
      for (const l of links) {
        expect(l.url, f.id).toMatch(/^https:\/\/(www|respondentaccess\.eoir)\.(uscis|justice)\.gov\//);
        expect(l.label.es && l.label.en, f.id).toBeTruthy();
      }
    }
  });

  it('forms without their own page use their main form’s page', () => {
    expect(filingLinks('i-130a', 'I-130A').links[0].url).toBe('https://www.uscis.gov/i-130');
    expect(filingLinks('i-765ws', 'I-765WS').links[0].url).toBe('https://www.uscis.gov/i-765');
    expect(filingLinks('i-539a', 'I-539A').links[0].url).toBe('https://www.uscis.gov/i-539');
    expect(filingLinks('eoir-33', 'EOIR-33/IC').links[0].url).toBe('https://www.justice.gov/eoir/eoir-forms');
  });

  it('only forms with a fee link the fee calculator', () => {
    expect(filingLinks('i-485', 'I-485').links.some((l) => l.url.endsWith('/feecalculator'))).toBe(true);
    expect(filingLinks('i-589', 'I-589').links.some((l) => l.url.includes('justice.gov'))).toBe(true);
    expect(filingLinks('g-1145', 'G-1145').links.some((l) => l.url.endsWith('/feecalculator'))).toBe(false);
  });
});
