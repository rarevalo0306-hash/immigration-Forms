import Stripe from 'stripe';
import { db, json, paymentsConfigured } from './_lib.js';

/**
 * Stripe tells us here when a payment or a subscription changes (/api/stripe-webhook).
 * Only verified events count (STRIPE_WEBHOOK_SECRET); each one is recorded once, so Stripe's
 * retries are harmless. In Stripe → Developers → Webhooks, send: checkout.session.completed,
 * checkout.session.async_payment_succeeded, customer.subscription.created / updated / deleted.
 */

let stripe: Stripe | null = null;
const stripeClient = () => (stripe ??= new Stripe(process.env.STRIPE_SECRET_KEY!));

async function recordPurchase(session: Stripe.Checkout.Session) {
  if (session.mode !== 'payment' || session.payment_status !== 'paid') return;
  const userId = session.metadata?.user_id;
  const product = session.metadata?.product;
  if (!userId || !product?.startsWith('form:')) return;
  const { error } = await db()
    .from('purchases')
    .upsert(
      { user_id: userId, product, source: 'stripe', reference: session.id, amount_cents: session.amount_total },
      { onConflict: 'reference', ignoreDuplicates: true },
    );
  if (error) throw new Error(error.message);
}

async function recordSubscription(sub: Stripe.Subscription) {
  const userId = sub.metadata?.user_id;
  if (!userId || sub.metadata?.product !== 'study') return;
  // Newer API versions keep the period on each item; older ones on the subscription.
  const end = sub.items?.data?.[0]?.current_period_end ?? (sub as unknown as { current_period_end?: number }).current_period_end;
  const { error } = await db()
    .from('subscriptions')
    .upsert({
      reference: sub.id,
      user_id: userId,
      product: 'study',
      source: 'stripe',
      status: sub.status,
      current_period_end: end ? new Date(end * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    });
  if (error) throw new Error(error.message);
}

export async function POST(request: Request) {
  if (!paymentsConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) return json({ error: 'disabled' }, 503);
  const signature = request.headers.get('stripe-signature');
  if (!signature) return json({ error: 'unsigned' }, 400);
  const raw = await request.text();
  let event: Stripe.Event;
  try {
    event = await stripeClient().webhooks.constructEventAsync(raw, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return json({ error: 'bad_signature' }, 400);
  }
  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        await recordPurchase(event.data.object);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await recordSubscription(event.data.object);
        break;
    }
  } catch {
    // A 500 makes Stripe try again later.
    return json({ error: 'not_recorded' }, 500);
  }
  return json({ received: true }, 200);
}
