import { describe, expect, it } from 'vitest';
import { forms } from '.';
import { checkEdition, editionReport, formPageUrl, parseEdition } from './editions';

const page = (edition: string) =>
  `<html><body><h2>Forms and Document Downloads</h2><p><strong>Edition Date</strong> ${edition} . You can find the edition date at the bottom of the page.</p></body></html>`;

describe('USCIS edition check', () => {
  it('reads the edition date from a form page', () => {
    expect(parseEdition(page('09/18/26'))).toBe('09/18/26');
    expect(parseEdition('<p>(edition date: 09/18/26)</p><p>Edition Date 08/21/25</p>')).toBe('09/18/26');
    expect(parseEdition('<p>Page Not Found</p>')).toBeNull();
  });

  it('every form has an edition in the same MM/DD/YY format', () => {
    for (const f of forms) expect(f.edition, f.id).toMatch(/^\d{2}\/\d{2}\/\d{2}$/);
  });

  it('forms without their own page are checked on their main form’s page', () => {
    expect(formPageUrl('i-130a')).toBe('https://www.uscis.gov/i-130');
    expect(formPageUrl('i-485')).toBe('https://www.uscis.gov/i-485');
  });

  it('reports new editions and pages it couldn’t read', () => {
    const i485 = forms.find((f) => f.id === 'i-485')!;
    const i765 = forms.find((f) => f.id === 'i-765')!;
    const n400 = forms.find((f) => f.id === 'n-400')!;
    const report = editionReport([checkEdition(i485, page('01/01/27')), checkEdition(i765, page(i765.edition)), checkEdition(n400, null)]);
    expect(report.changed.map((c) => c.formId)).toEqual(['i-485']);
    expect(report.unreadable.map((c) => c.formId)).toEqual(['n-400']);
    expect(report.markdown).toContain(`| I-485 | ${i485.edition} | **01/01/27** |`);
    expect(report.markdown).toContain('No se pudieron revisar');
    expect(editionReport([checkEdition(i765, page(i765.edition))]).markdown).toContain('No hay ediciones nuevas.');
  });
});
