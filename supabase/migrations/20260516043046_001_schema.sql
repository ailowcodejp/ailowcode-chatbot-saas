-- ============================================================================
-- 001_schema: AILowcode Chatbot SaaS core schema
-- ============================================================================
--
-- Billing uses Stripe Sync Engine. This migration only prepares the local
-- `stripe` schema and keeps application-facing billing state in public.billing_*.
--

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

create schema if not exists stripe;
comment on schema stripe is
  'Managed by Supabase Stripe Sync Engine. Do not expose directly to clients.';

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.subscription_plan as enum (
  'free',
  'pro_monthly',
  'pro_yearly'
);

create type public.billing_subscription_status as enum (
  'incomplete',
  'incomplete_expired',
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'paused'
);

create type public.billing_webhook_event_status as enum (
  'received',
  'processing',
  'processed',
  'failed',
  'skipped'
);

create type public.credit_transaction_type as enum (
  'signup_bonus',
  'monthly_grant',
  'chat_usage',
  'refund',
  'manual_adjustment',
  'expiration'
);

create type public.message_role as enum (
  'system',
  'user',
  'assistant'
);

-- ---------------------------------------------------------------------------
-- User profile and credit state
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.credit_balances (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 0,
  total_granted integer not null default 0,
  total_consumed integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credit_balances_balance_non_negative check (balance >= 0),
  constraint credit_balances_total_granted_non_negative check (total_granted >= 0),
  constraint credit_balances_total_consumed_non_negative check (total_consumed >= 0)
);

create table public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  balance_after integer not null,
  transaction_type public.credit_transaction_type not null,
  idempotency_key text,
  description text,
  related_entity_type text,
  related_entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint credit_transactions_non_zero_amount check (amount <> 0),
  constraint credit_transactions_balance_after_non_negative check (balance_after >= 0),
  constraint credit_transactions_amount_matches_type check (
    (
      transaction_type in ('signup_bonus', 'monthly_grant', 'refund')
      and amount > 0
    )
    or (
      transaction_type in ('chat_usage', 'expiration')
      and amount < 0
    )
    or transaction_type = 'manual_adjustment'
  )
);

create unique index credit_transactions_user_id_idempotency_key_idx
  on public.credit_transactions (user_id, idempotency_key)
  where idempotency_key is not null;

create index credit_transactions_user_id_created_at_idx
  on public.credit_transactions (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Chat history
-- ---------------------------------------------------------------------------

create table public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New Chat',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint chat_sessions_title_length check (
    char_length(title) between 1 and 120
  ),
  constraint chat_sessions_id_user_id_unique unique (id, user_id)
);

create index chat_sessions_user_id_active_updated_at_idx
  on public.chat_sessions (user_id, updated_at desc)
  where deleted_at is null;

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.message_role not null,
  content text not null,
  model text,
  token_count integer,
  llm_gateway_request_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint chat_messages_session_owner_fk
    foreign key (session_id, user_id)
    references public.chat_sessions (id, user_id)
    on delete cascade,
  constraint chat_messages_content_not_empty check (char_length(content) > 0),
  constraint chat_messages_token_count_non_negative check (
    token_count is null
    or token_count >= 0
  )
);

create index chat_messages_session_id_created_at_idx
  on public.chat_messages (session_id, created_at);

create index chat_messages_user_id_created_at_idx
  on public.chat_messages (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Billing state mirrored from Stripe webhooks / Stripe Sync Engine
-- ---------------------------------------------------------------------------

create table public.billing_customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text not null unique,
  email text,
  name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text not null references public.billing_customers(stripe_customer_id)
    on update cascade
    on delete cascade,
  stripe_subscription_id text not null unique,
  stripe_price_id text,
  plan public.subscription_plan not null default 'free',
  status public.billing_subscription_status not null,
  cancel_at_period_end boolean not null default false,
  current_period_start timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  trial_start timestamptz,
  trial_end timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_subscriptions_period_order check (
    current_period_start is null
    or current_period_end is null
    or current_period_end >= current_period_start
  )
);

create index billing_subscriptions_user_id_idx
  on public.billing_subscriptions (user_id);

create index billing_subscriptions_customer_id_idx
  on public.billing_subscriptions (stripe_customer_id);

create index billing_subscriptions_status_period_end_idx
  on public.billing_subscriptions (status, current_period_end);

create table public.billing_webhook_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status public.billing_webhook_event_status not null default 'received',
  attempts integer not null default 1,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_webhook_events_attempts_positive check (attempts > 0)
);

create index billing_webhook_events_status_created_at_idx
  on public.billing_webhook_events (status, created_at);

create index billing_webhook_events_event_type_created_at_idx
  on public.billing_webhook_events (event_type, created_at desc);

-- ---------------------------------------------------------------------------
-- Trigger helpers
-- ---------------------------------------------------------------------------

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_email text := coalesce(new.email, '');
  v_display_name text;
begin
  v_display_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(split_part(v_email, '@', 1), ''),
    'User'
  );

  insert into public.profiles (id, email, display_name)
  values (new.id, v_email, v_display_name)
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  insert into public.credit_balances (
    user_id,
    balance,
    total_granted,
    total_consumed
  )
  values (new.id, 10, 10, 0)
  on conflict (user_id) do nothing;

  insert into public.credit_transactions (
    user_id,
    amount,
    balance_after,
    transaction_type,
    idempotency_key,
    description
  )
  values (
    new.id,
    10,
    10,
    'signup_bonus',
    'signup:' || new.id::text,
    'Signup bonus credits'
  )
  on conflict (user_id, idempotency_key)
    where idempotency_key is not null
  do nothing;

  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function private.set_updated_at();

create trigger credit_balances_set_updated_at
  before update on public.credit_balances
  for each row
  execute function private.set_updated_at();

create trigger chat_sessions_set_updated_at
  before update on public.chat_sessions
  for each row
  execute function private.set_updated_at();

create trigger billing_customers_set_updated_at
  before update on public.billing_customers
  for each row
  execute function private.set_updated_at();

create trigger billing_subscriptions_set_updated_at
  before update on public.billing_subscriptions
  for each row
  execute function private.set_updated_at();

create trigger billing_webhook_events_set_updated_at
  before update on public.billing_webhook_events
  for each row
  execute function private.set_updated_at();

create trigger auth_users_handle_new_user
  after insert on auth.users
  for each row
  execute function private.handle_new_user();
