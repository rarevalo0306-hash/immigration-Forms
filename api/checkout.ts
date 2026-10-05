import Stripe from 'stripe';
import { SITE, allowedOrigin, cors, db, json, paymentsConfigured, productById, userFrom } from './_lib';

/**
 * Starts a Stripe Checkout payment for the signed-in person (/api/checkout):
 * a filled form ("form:i-765", $19.99 once) or the study subscription ("study", $9.99 a month).
 * The purchase is recorded by api/stripe-webhook.ts when Stripe confirms it, never here.
 */

let stripe: Stripe | null = null;
const stripeClient = () => (stripe ??= new Stripe(process.env.STRIPE_SECRET_KEY!));

export function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: cors(request.headers.get('origin')) });
}

/** The Stripe customer for an account, created the first time they pay. */
async function customerFor(userId: string, email: string | undefined): Promise<string> {
  const { data } = await db().from('profiles').select('stripe_customer_id').eq('id', userId).maybeSingle();
  if (data?.stripe_customer_id) return data.stripe_customer_id as string;
  const customer = await stripeClient().customers.create({ email, metadata: { user_id: userId } });
  await db().from('profiles').upsert({ id: userId, stripe_customer_id: customer.id });
  return customer.id;
}

/** Where to come back after paying: a path inside the app (a hash route), nothing else. */
const safeReturn = (v: unknown) => (typeof v === 'string' && /^#[a-z0-9/?=&.-]{0,120}$/i.test(v) ? v : '#');

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const headers = cors(origin);
  if (!paymentsConfigured()) return json({ error: 'disabled' }, 503, headers);
  const user = await userFrom(request);
  if (!user) return json({ error: 'sign_in' }, 401, headers);

  let body: { product?: unknown; returnTo?: unknown; lang?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: 'bad_request' }, 400, headers);
  }
  const product = productById(body.product);
  if (!product) return json({ error: 'bad_product' }, 400, headers);

  // Already theirs: nothing to pay.
  if (product.kind === 'form') {
    const { data } = await db().from('purchases').select('id').eq('user_id', user.id).eq('product', product.id).limit(1);
    if (data?.length) return json({ owned: true }, 200, headers);
  } else {
    const { data } = await db().from('subscriptions').select('status').eq('user_id', user.id).in('status', ['active', 'trialing', 'past_due']).limit(1);
    if (data?.length) return json({ owned: true }, 200, headers);
  }

  // The app inside the iPhone opens the site in the browser to pay, and comes back to the site.
  const base = allowedOrigin(origin) && origin.startsWith('http') ? origin : SITE;
  const back = safeReturn(body.returnTo);
  const done = (state: 'ok' | 'cancelado') => `${base}/#pago?estado=${state}&producto=${encodeURIComponent(product.id)}&volver=${encodeURIComponent(back)}`;
  const metadata = { user_id: user.id, product: product.id };

  const session = await stripeClient().checkout.sessions.create({
    mode: product.kind === 'study' ? 'subscription' : 'payment',
    customer: await customerFor(user.id, user.email),
    client_reference_id: user.id,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: product.cents,
          product_data: { name: product.name },
          ...(product.kind === 'study' ? { recurring: { interval: 'month' as const } } : {}),
        },
      },
    ],
    metadata,
    ...(product.kind === 'study' ? { subscription_data: { metadata } } : { payment_intent_data: { metadata } }),
    locale: body.lang === 'en' ? 'en' : 'es',
    allow_promotion_codes: true,
    success_url: done('ok'),
    cancel_url: done('cancelado'),
  });
  return json({ url: session.url }, 200, headers);
}
