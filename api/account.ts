import Stripe from 'stripe';
import { SITE, allowedOrigin, cors, db, json, accountsConfigured, userFrom } from './_lib';

/**
 * The signed-in person's account (/api/account):
 *   POST { action: "portal" } → a Stripe page to change or cancel the study subscription
 *   POST { action: "delete" } → cancels any subscription and deletes the account and its purchases
 *     (Apple requires that accounts can be deleted from inside the app).
 */

let stripe: Stripe | null = null;
const stripeClient = () => (process.env.STRIPE_SECRET_KEY ? (stripe ??= new Stripe(process.env.STRIPE_SECRET_KEY)) : null);

export function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: cors(request.headers.get('origin')) });
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const headers = cors(origin);
  if (!accountsConfigured()) return json({ error: 'disabled' }, 503, headers);
  const user = await userFrom(request);
  if (!user) return json({ error: 'sign_in' }, 401, headers);
  let action: unknown;
  try {
    action = ((await request.json()) as { action?: unknown }).action;
  } catch {
    return json({ error: 'bad_request' }, 400, headers);
  }
  const { data: profile } = await db().from('profiles').select('stripe_customer_id').eq('id', user.id).maybeSingle();
  const customer = (profile?.stripe_customer_id as string | null) ?? null;
  const s = stripeClient();

  if (action === 'portal') {
    if (!s || !customer) return json({ error: 'no_billing' }, 404, headers);
    const base = allowedOrigin(origin) && origin.startsWith('http') ? origin : SITE;
    const portal = await s.billingPortal.sessions.create({ customer, return_url: `${base}/#datos` });
    return json({ url: portal.url }, 200, headers);
  }

  if (action === 'delete') {
    if (s && customer) {
      const subs = await s.subscriptions.list({ customer, status: 'all', limit: 20 });
      for (const sub of subs.data) if (sub.status !== 'canceled') await s.subscriptions.cancel(sub.id);
    }
    // Purchases, subscriptions and the profile go with the user (on delete cascade).
    const { error } = await db().auth.admin.deleteUser(user.id);
    if (error) return json({ error: 'not_deleted' }, 500, headers);
    return json({ deleted: true }, 200, headers);
  }

  return json({ error: 'bad_request' }, 400, headers);
}
