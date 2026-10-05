/**
 * What Camino charges for, shared by the app and the server (api/_lib.ts).
 * Filling in and reviewing a form is always free; the filled PDF costs FORM_PRICE once per form.
 */

export const FORM_PRICE_CENTS = 1999;
export const STUDY_PRICE_CENTS = 999;

/**
 * Forms whose PDF stays free: a change of address (USCIS and the immigration court), the e-notice
 * cover sheet, and the fee waiver, which is for people who can't pay.
 */
export const FREE_FORMS: ReadonlySet<string> = new Set(['ar-11', 'eoir-33', 'g-1145', 'i-912']);

export const isFreeForm = (formId: string) => FREE_FORMS.has(formId);

export const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;
