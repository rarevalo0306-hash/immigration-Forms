import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { metaById } from '../src/forms/catalog.js';
import { FORM_PRICE_CENTS, STUDY_PRICE_CENTS, isFreeForm } from '../src/account/pricing.js';

/**
 * Shared by the server functions in api/ (Vercel doesn't serve files that start with "_").
 *
 * Environment variables (Vercel → Settings → Environment Variables):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY — the accounts database (server only; never in the app)
 *   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET — payments on the website
 */

const ALLOWED_ORIGINS = [
  /^https:\/\/(www\.)?caminoformularios\.com$/,
  /^https:\/\/camino-formularios[a-z0-9-]*\.vercel\.app$/,
  /^capacitor:\/\/localhost$/,
  /^https?:\/\/localhost(:\d+)?$/,
];

export const SITE = 'https://caminoformularios.com';

export const allowedOrigin = (origin: string | null): origin is string => !!origin && ALLOWED_ORIGINS.some((re) => re.test(origin));

export function cors(origin: string | null): Record<string, string> {
  return allowedOrigin(origin)
    ? {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        Vary: 'Origin',
      }
    : { Vary: 'Origin' };
}

export const json = (body: unknown, status: number, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers } });

export const accountsConfigured = () => !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
export const paymentsConfigured = () => accountsConfigured() && !!process.env.STRIPE_SECRET_KEY;

let admin: SupabaseClient | null = null;
/** The accounts database with full rights. Only for code that already checked who is asking. */
export function db(): SupabaseClient {
  admin ??= createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}

/** The signed-in person behind a request ("Authorization: Bearer <access token>"), or null. */
export async function userFrom(request: Request): Promise<User | null> {
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return null;
  const { data, error } = await db().auth.getUser(token);
  return error ? null : data.user;
}

/** What can be bought, and for how much. Prices are in cents (USD). */
export type Product = { kind: 'form'; id: string; formId: string; name: string; cents: number } | { kind: 'study'; id: 'study'; name: string; cents: number };

export function productById(id: unknown): Product | null {
  if (id === 'study') return { kind: 'study', id, name: 'Camino: estudio para la ciudadanía (calificación y práctica de inglés)', cents: STUDY_PRICE_CENTS };
  if (typeof id !== 'string' || !id.startsWith('form:')) return null;
  const meta = metaById(id.slice(5));
  return meta && !isFreeForm(meta.id) ? { kind: 'form', id, formId: meta.id, name: `Camino: Formulario ${meta.number} lleno (PDF)`, cents: FORM_PRICE_CENTS } : null;
}
