-- Camino accounts: who someone is and what they bought. Form answers are never stored here;
-- they stay on the person's device. Only the server (service role) writes purchases.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  lang text not null default 'es' check (lang in ('es', 'en')),
  stripe_customer_id text unique,
  created_at timestamptz not null default now()
);

-- One row per form unlocked for good ("form:i-765").
create table public.purchases (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  product text not null check (product ~ '^form:[a-z0-9-]+$'),
  source text not null check (source in ('stripe', 'apple')),
  -- The Stripe Checkout Session or App Store transaction, so a webhook retry adds nothing twice.
  reference text not null unique,
  amount_cents integer,
  created_at timestamptz not null default now()
);
create index purchases_user on public.purchases (user_id);

-- Subscriptions ("study"), kept in step with Stripe (or the App Store) by the webhook.
create table public.subscriptions (
  reference text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  product text not null check (product in ('study')),
  source text not null check (source in ('stripe', 'apple')),
  status text not null,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);
create index subscriptions_user on public.subscriptions (user_id);

alter table public.profiles enable row level security;
alter table public.purchases enable row level security;
alter table public.subscriptions enable row level security;

create policy "own profile: read" on public.profiles for select to authenticated using ((select auth.uid()) = id);
-- People may change their name and language, nothing else (stripe_customer_id is the server's).
create policy "own profile: update" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
revoke update on public.profiles from authenticated;
grant update (display_name, lang) on public.profiles to authenticated;

create policy "own purchases: read" on public.purchases for select to authenticated using ((select auth.uid()) = user_id);
create policy "own subscriptions: read" on public.subscriptions for select to authenticated using ((select auth.uid()) = user_id);

-- Every new account gets its profile.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- The trigger runs it; nobody should call it through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
