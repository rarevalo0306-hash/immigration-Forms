import type { FormDefinition } from './types';
import { pageFor } from './filing';

/**
 * Checking Camino's form editions against uscis.gov. Each form page shows "Edition Date MM/DD/YY";
 * when it no longer matches the edition Camino fills, the PDF and its field map need updating.
 * Used by scripts/check-editions.ts, which the weekly "Ediciones USCIS" workflow runs.
 */

/** The edition shown on a uscis.gov form page, or null if the page doesn't show one. */
export function parseEdition(html: string): string | null {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ');
  return text.match(/Edition Date:?\s*(\d{2}\/\d{2}\/\d{2})\b/i)?.[1] ?? null;
}

export interface EditionCheck {
  formId: string;
  number: string;
  ours: string;
  /** What uscis.gov shows; null when the page couldn't be read. */
  theirs: string | null;
  url: string;
}

export const formPageUrl = (formId: string) => `https://www.uscis.gov/${pageFor(formId)}`;

export function checkEdition(form: FormDefinition, html: string | null): EditionCheck {
  return { formId: form.id, number: form.number, ours: form.edition, theirs: html === null ? null : parseEdition(html), url: formPageUrl(form.id) };
}

/** The issue body: what changed, what couldn't be read, and how to update a form. */
export function editionReport(checks: EditionCheck[]): { changed: EditionCheck[]; unreadable: EditionCheck[]; markdown: string } {
  const changed = checks.filter((c) => c.theirs && c.theirs !== c.ours);
  const unreadable = checks.filter((c) => !c.theirs);
  const lines = [
    `Revisión de ediciones de USCIS: ${checks.length} formularios.`,
    '',
    changed.length
      ? '## Ediciones nuevas\n\n| Formulario | Camino llena | uscis.gov muestra | Página |\n| --- | --- | --- | --- |\n' +
        changed.map((c) => `| ${c.number} | ${c.ours} | **${c.theirs}** | ${c.url} |`).join('\n')
      : 'No hay ediciones nuevas.',
  ];
  if (unreadable.length)
    lines.push('', '## No se pudieron revisar', '', unreadable.map((c) => `- ${c.number}: ${c.url}`).join('\n'));
  if (changed.length)
    lines.push(
      '',
      '## Cómo actualizar un formulario',
      '',
      '1. Lea en la página si USCIS todavía acepta la edición anterior y hasta cuándo.',
      '2. Descargue el PDF nuevo y quítele el cifrado: `python3 scripts/prepare-uscis-pdf.py <nuevo.pdf> public/forms/<id>.pdf`.',
      '3. Revise el mapa de campos (`src/pdf/<form>Pdf.ts`): los nombres y posiciones pueden cambiar entre ediciones.',
      '4. Actualice la edición y las preguntas que cambiaron en `src/forms/<form>.ts`, y la lista de documentos si cambiaron las instrucciones.',
      '5. Corra `npm test` y revise a ojo un PDF lleno.',
    );
  return { changed, unreadable, markdown: lines.join('\n') };
}
