// Rewrites the list in src/forms/catalog.ts from the form definitions (run: npm run gen-catalog).
// catalog.test.ts fails when the two drift apart.
import { readFileSync, writeFileSync } from 'node:fs';
import { forms } from '../src/forms';
import { documentsFor } from '../src/forms/documents/all';

const file = new URL('../src/forms/catalog.ts', import.meta.url);
const src = readFileSync(file, 'utf8');
const start = 'export const catalog: FormMeta[] = [\n';
const end = '];\n\nexport const metaById';
const t = (x: { es: string; en: string }) => `{ es: ${JSON.stringify(x.es)}, en: ${JSON.stringify(x.en)} }`;
const entries = forms
  .map(
    (f) => `  {
    id: '${f.id}',
    number: '${f.number}',
    title: ${t(f.title)},
    summary: ${t(f.summary)},
    minutes: ${f.minutes},
    edition: '${f.edition}',
    fee: ${documentsFor(f.id).some((d) => d.id === 'fee')},
  },
`,
  )
  .join('');
const a = src.indexOf(start);
const b = src.indexOf(end);
if (a < 0 || b < 0) throw new Error('catalog.ts markers not found');
writeFileSync(file, src.slice(0, a + start.length) + entries + src.slice(b));
console.log(`catalog.ts: ${forms.length} forms`);
