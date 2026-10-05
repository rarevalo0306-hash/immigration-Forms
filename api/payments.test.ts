import { afterEach, describe, expect, it } from 'vitest';
import { productById } from './_lib.js';
import { POST as checkout } from './checkout';
import { POST as webhook } from './stripe-webhook';
import { POST as account } from './account';

const env = { ...process.env };
afterEach(() => {
  process.env = { ...env };
});

const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request('https://caminoformularios.com/api/x', { method: 'POST', headers: { origin: 'https://caminoformularios.com', ...headers }, body: JSON.stringify(body) });

describe('products', () => {
  it('prices a form and the study plan, and nothing else', () => {
    expect(productById('form:i-765')).toMatchObject({ kind: 'form', formId: 'i-765', cents: 1999 });
    expect(productById('study')).toMatchObject({ kind: 'study', cents: 999 });
    expect(productById('form:x-1')).toBeNull();
    expect(productById('form:i-912')).toBeNull();
    expect(productById('anything')).toBeNull();
  });
});

describe('payment endpoints when not set up', () => {
  it('are off without their keys', async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.STRIPE_SECRET_KEY;
    expect((await checkout(post({ product: 'study' }))).status).toBe(503);
    expect((await webhook(post({}))).status).toBe(503);
    expect((await account(post({ action: 'delete' }))).status).toBe(503);
  });

  it('refuses unsigned webhooks', async () => {
    process.env.SUPABASE_URL = 'https://x.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'k';
    process.env.STRIPE_SECRET_KEY = 'sk_test_x';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_x';
    expect((await webhook(post({ type: 'checkout.session.completed' }))).status).toBe(400);
    expect((await webhook(post({ type: 'checkout.session.completed' }, { 'stripe-signature': 't=1,v1=bad' }))).status).toBe(400);
  });

  it('asks to sign in first', async () => {
    process.env.SUPABASE_URL = 'https://x.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'k';
    process.env.STRIPE_SECRET_KEY = 'sk_test_x';
    expect((await checkout(post({ product: 'study' }))).status).toBe(401);
  });
});
