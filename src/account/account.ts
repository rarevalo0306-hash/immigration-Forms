import { useEffect, useState } from 'react';
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import { apiUrl } from '../api';
import { isNativeApp } from '../native';

/**
 * Accounts and what each person has bought. The account lives in Supabase (Auth + the tables in
 * supabase/migrations); the forms' answers never go there, they stay on the device.
 *
 * Off unless the site is built with VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY; payments
 * also need VITE_PAYMENTS=on. While off, everything is free and works as before.
 */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: {
          // The code flow puts "?code=" in the query string, which leaves the app's #routes alone.
          flowType: 'pkce',
          persistSession: true,
          detectSessionInUrl: true,
        },
      })
    : null;

export const accountsOn = () => !!supabase;
export const paymentsOn = () => !!supabase && import.meta.env.VITE_PAYMENTS === 'on';

/** Google sign-in needs a web page to come back to, so the phone app offers the email code only. */
export const googleAvailable = () => accountsOn() && !isNativeApp() && import.meta.env.VITE_GOOGLE_SIGNIN !== 'off';

export interface Entitlements {
  /** Forms unlocked for good, by form id ("i-765"). */
  forms: Set<string>;
  /** The study subscription is active. */
  study: boolean;
}

const NONE: Entitlements = { forms: new Set(), study: false };

interface AccountState {
  ready: boolean;
  session: Session | null;
  entitlements: Entitlements;
}

let state: AccountState = { ready: !supabase, session: null, entitlements: NONE };
const listeners = new Set<(s: AccountState) => void>();
const set = (next: Partial<AccountState>) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l(state));
};

/** Reads what the signed-in person owns (row-level security only returns their own rows). */
export async function refreshEntitlements(): Promise<Entitlements> {
  if (!supabase || !state.session) {
    set({ entitlements: NONE });
    return NONE;
  }
  const [p, s] = await Promise.all([
    supabase.from('purchases').select('product'),
    supabase.from('subscriptions').select('status, current_period_end'),
  ]);
  const forms = new Set((p.data ?? []).map((r: { product: string }) => r.product.replace(/^form:/, '')));
  const now = Date.now();
  const study = (s.data ?? []).some(
    (r: { status: string; current_period_end: string | null }) =>
      ['active', 'trialing', 'past_due'].includes(r.status) && (!r.current_period_end || Date.parse(r.current_period_end) > now - 3 * 86_400_000),
  );
  const entitlements = { forms, study };
  set({ entitlements });
  return entitlements;
}

if (supabase) {
  void supabase.auth.getSession().then(({ data }) => {
    set({ ready: true, session: data.session });
    // Drop "?code=…" left by the Google sign-in, keeping the #route.
    if (window.location.search.includes('code=')) history.replaceState(null, '', window.location.pathname + window.location.hash);
    void refreshEntitlements();
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    const changed = session?.user.id !== state.session?.user.id;
    set({ session, ready: true });
    if (changed) void refreshEntitlements();
  });
}

/** The account state, kept up to date in any component. */
export function useAccount(): AccountState {
  const [s, setS] = useState(state);
  useEffect(() => {
    listeners.add(setS);
    setS(state);
    return () => {
      listeners.delete(setS);
    };
  }, []);
  return s;
}

export const owns = (e: Entitlements, formId: string) => e.forms.has(formId);

/** Sends a 6-digit code to the email; the account is created the first time. */
export async function sendCode(email: string) {
  if (!supabase) throw new Error('accounts off');
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) throw error;
}

export async function verifyCode(email: string, token: string) {
  if (!supabase) throw new Error('accounts off');
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw error;
}

export async function signInWithGoogle(returnTo: string) {
  if (!supabase) throw new Error('accounts off');
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}${window.location.pathname}${returnTo}` },
  });
  if (error) throw error;
}

export async function signOut() {
  await supabase?.auth.signOut();
  set({ entitlements: NONE });
}

async function call(name: string, body: unknown): Promise<Record<string, unknown>> {
  const token = state.session?.access_token;
  const res = await fetch(apiUrl(name), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error(String(data.error ?? res.status));
  return data;
}

/** Sends the person to Stripe to pay; they come back to #pago. Resolves "owned" if they already have it. */
export async function startCheckout(product: string, returnTo: string, lang: string): Promise<'redirected' | 'owned'> {
  const r = await call('checkout', { product, returnTo, lang });
  if (r.owned) {
    await refreshEntitlements();
    return 'owned';
  }
  window.location.assign(String(r.url));
  return 'redirected';
}

export async function openBillingPortal() {
  const r = await call('account', { action: 'portal' });
  window.location.assign(String(r.url));
}

export async function deleteAccount() {
  await call('account', { action: 'delete' });
  await supabase?.auth.signOut();
  set({ session: null, entitlements: NONE });
}
