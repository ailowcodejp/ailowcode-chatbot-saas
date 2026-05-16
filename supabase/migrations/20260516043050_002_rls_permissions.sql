-- ============================================================================
-- 002_rls_permissions: RLS policies and explicit API grants
-- ============================================================================

-- Stripe Sync Engine owns the `stripe` schema. Application clients must not
-- query it directly; public.billing_* is the user-facing billing surface.
revoke all on schema stripe from public;
revoke all on schema stripe from anon;
revoke all on schema stripe from authenticated;
revoke all on all tables in schema stripe from public;
revoke all on all tables in schema stripe from anon;
revoke all on all tables in schema stripe from authenticated;
alter default privileges in schema stripe revoke all on tables from public;
alter default privileges in schema stripe revoke all on tables from anon;
alter default privileges in schema stripe revoke all on tables from authenticated;

-- Start from a minimal privilege posture for exposed schemas.
revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;
revoke all on all sequences in schema public from anon;
revoke all on all sequences in schema public from authenticated;
revoke execute on all functions in schema public from anon;
revoke execute on all functions in schema public from authenticated;
revoke execute on all functions in schema private from public;
revoke execute on all functions in schema private from anon;
revoke execute on all functions in schema private from authenticated;

alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on tables from authenticated;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke all on sequences from authenticated;
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon;
alter default privileges in schema public revoke execute on functions from authenticated;

grant usage on schema public to anon;
grant usage on schema public to authenticated;
grant usage on schema public to service_role;
grant usage on schema stripe to service_role;

grant usage on type public.subscription_plan to authenticated;
grant usage on type public.billing_subscription_status to authenticated;
grant usage on type public.billing_webhook_event_status to service_role;
grant usage on type public.credit_transaction_type to authenticated;
grant usage on type public.message_role to authenticated;

grant usage on type public.subscription_plan to service_role;
grant usage on type public.billing_subscription_status to service_role;
grant usage on type public.credit_transaction_type to service_role;
grant usage on type public.message_role to service_role;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.credit_balances enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.billing_customers enable row level security;
alter table public.billing_subscriptions enable row level security;
alter table public.billing_webhook_events enable row level security;

create policy profiles_select_own_active
  on public.profiles
  for select
  to authenticated
  using (
    id = (select auth.uid())
    and deleted_at is null
  );

create policy profiles_update_own_active
  on public.profiles
  for update
  to authenticated
  using (
    id = (select auth.uid())
    and deleted_at is null
  )
  with check (
    id = (select auth.uid())
    and deleted_at is null
  );

create policy credit_balances_select_own
  on public.credit_balances
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy credit_transactions_select_own
  on public.credit_transactions
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy chat_sessions_select_own_active
  on public.chat_sessions
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    and deleted_at is null
  );

create policy chat_sessions_insert_own
  on public.chat_sessions
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and deleted_at is null
  );

create policy chat_sessions_update_own_active
  on public.chat_sessions
  for update
  to authenticated
  using (
    user_id = (select auth.uid())
    and deleted_at is null
  )
  with check (
    user_id = (select auth.uid())
    and deleted_at is null
  );

create policy chat_messages_select_own_active_session
  on public.chat_messages
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.chat_sessions
      where chat_sessions.id = chat_messages.session_id
        and chat_sessions.user_id = (select auth.uid())
        and chat_sessions.deleted_at is null
    )
  );

create policy chat_messages_insert_own_active_session
  on public.chat_messages
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.chat_sessions
      where chat_sessions.id = chat_messages.session_id
        and chat_sessions.user_id = (select auth.uid())
        and chat_sessions.deleted_at is null
    )
  );

create policy billing_customers_select_own
  on public.billing_customers
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy billing_subscriptions_select_own
  on public.billing_subscriptions
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- No policy is intentionally defined for billing_webhook_events. Only service
-- role code should inspect or mutate raw webhook payloads and processing errors.

-- ---------------------------------------------------------------------------
-- Explicit client privileges
-- ---------------------------------------------------------------------------

grant select on public.profiles to authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;

grant select on public.credit_balances to authenticated;
grant select on public.credit_transactions to authenticated;

grant select on public.chat_sessions to authenticated;
grant insert (user_id, title, metadata) on public.chat_sessions to authenticated;
grant update (title, metadata) on public.chat_sessions to authenticated;

grant select on public.chat_messages to authenticated;
grant insert (
  session_id,
  user_id,
  role,
  content,
  model,
  token_count,
  llm_gateway_request_id,
  metadata
) on public.chat_messages to authenticated;

grant select on public.billing_customers to authenticated;
grant select on public.billing_subscriptions to authenticated;
