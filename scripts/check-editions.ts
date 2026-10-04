/**
 * Compares each form's edition in Camino with the one on its uscis.gov page.
 * Run: npm run check-editions. Writes edition-report.md and prints `changed=<n>` and
 * `unreadable=<n>` lines (also to $GITHUB_OUTPUT when set). Exits 1 if most pages can't be read.
 */
import { appendFileSync, writeFileSync } from 'node:fs';
import { forms } from '../src/forms';
import { checkEdition, editionReport, formPageUrl } from '../src/forms/editions';
import { onUscis } from '../src/forms/filing';

async function fetchPage(url: string): Promise<string | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, { headers: { accept: 'text/html' } });
      if (r.ok) return await r.text();
    } catch {
      // retry
    }
    await new Promise((res) => setTimeout(res, 2000 * (attempt + 1)));
  }
  return null;
}

const pages = new Map<string, Promise<string | null>>();
const checks = [];
// Forms from other agencies (EOIR) show no edition date on their page; they aren't checked here.
const uscisForms = forms.filter((f) => onUscis(f.id));
for (const f of uscisForms) {
  const url = formPageUrl(f.id);
  if (!pages.has(url)) pages.set(url, fetchPage(url));
  checks.push(checkEdition(f, await pages.get(url)!));
}
const { changed, unreadable, markdown } = editionReport(checks);
writeFileSync('edition-report.md', markdown + '\n');
const out = `changed=${changed.length}\nunreadable=${unreadable.length}\n`;
process.stdout.write(markdown + '\n\n' + out);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, out);
if (unreadable.length > uscisForms.length / 2) {
  console.error('Most uscis.gov pages could not be read; the check did not run.');
  process.exit(1);
}
