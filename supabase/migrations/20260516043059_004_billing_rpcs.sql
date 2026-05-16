-- ============================================================================
-- 004_billing_rpcs: Stripe webhook and billing helper RPCs
-- ============================================================================

create or replace function public.upsert_billing_customer(
  p_user_id uuid,
  p_stripe_customer_id text,
  p_email text default null,
  p_name text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_customer public.billing_customers%rowtype;
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  if nullif(p_stripe_customer_id, '') is null then
    raise exception 'p_stripe_customer_id is required';
  end if;

  insert into public.billing_customers (
    user_id,
    stripe_customer_id,
    email,
    name,
    metadata
  )
  values (
    p_user_id,
    p_stripe_customer_id,
    p_email,
    p_name,
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (user_id) do update
    set stripe_customer_id = excluded.stripe_customer_id,
        email = coalesce(excluded.email, public.billing_customers.email),
        name = coalesce(excluded.name, public.billing_customers.name),
        metadata = coalesce(public.billing_customers.metadata, '{}'::jsonb)
          || coalesce(excluded.metadata, '{}'::jsonb)
  returning *
  into v_customer;

  return jsonb_build_object(
    'ok', true,
    'user_id', v_customer.user_id,
    'stripe_customer_id', v_customer.stripe_customer_id
  );
end;
$$;

create or replace function public.get_user_id_by_stripe_customer(
  p_stripe_customer_id text
)
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select user_id
  from public.billing_customers
  where stripe_customer_id = p_stripe_customer_id;
$$;

create or replace function public.record_billing_webhook_event(
  p_stripe_event_id text,
  p_event_type text,
  p_payload jsonb,
  p_status public.billing_webhook_event_status default 'received',
  p_error_message text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_event public.billing_webhook_events%rowtype;
begin
  if nullif(p_stripe_event_id, '') is null then
    raise exception 'p_stripe_event_id is required';
  end if;

  if nullif(p_event_type, '') is null then
    raise exception 'p_event_type is required';
  end if;

  insert into public.billing_webhook_events (
    stripe_event_id,
    event_type,
    payload,
    status,
    attempts,
    processed_at,
    error_message
  )
  values (
    p_stripe_event_id,
    p_event_type,
    coalesce(p_payload, '{}'::jsonb),
    p_status,
    1,
    case
      when p_status in ('processed', 'skipped') then now()
      else null
    end,
    p_error_message
  )
  on conflict (stripe_event_id) do update
    set event_type = excluded.event_type,
        payload = excluded.payload,
        attempts = public.billing_webhook_events.attempts + 1,
        status = case
          when public.billing_webhook_events.status = 'processed'
            then public.billing_webhook_events.status
          else excluded.status
        end,
        processed_at = case
          when public.billing_webhook_events.status = 'processed'
            then public.billing_webhook_events.processed_at
          when excluded.status in ('processed', 'skipped')
            then coalesce(public.billing_webhook_events.processed_at, now())
          else public.billing_webhook_events.processed_at
        end,
        error_message = case
          when public.billing_webhook_events.status = 'processed'
            then public.billing_webhook_events.error_message
          else excluded.error_message
        end
  returning *
  into v_event;

  return jsonb_build_object(
    'ok', true,
    'webhook_event_id', v_event.id,
    'stripe_event_id', v_event.stripe_event_id,
    'status', v_event.status,
    'attempts', v_event.attempts,
    'already_processed', v_event.status = 'processed' and v_event.attempts > 1
  );
end;
$$;

create or replace function public.mark_billing_webhook_event_processed(
  p_stripe_event_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_event public.billing_webhook_events%rowtype;
begin
  update public.billing_webhook_events
  set status = 'processed',
      processed_at = coalesce(processed_at, now()),
      error_message = null
  where stripe_event_id = p_stripe_event_id
  returning *
  into v_event;

  if not found then
    raise exception 'billing_webhook_event_not_found'
      using errcode = 'P0001';
  end if;

  return jsonb_build_object(
    'ok', true,
    'webhook_event_id', v_event.id,
    'stripe_event_id', v_event.stripe_event_id,
    'status', v_event.status
  );
end;
$$;

create or replace function public.upsert_billing_subscription_from_stripe(
  p_user_id uuid,
  p_stripe_customer_id text,
  p_stripe_subscription_id text,
  p_stripe_price_id text,
  p_plan public.subscription_plan,
  p_status public.billing_subscription_status,
  p_current_period_start timestamptz default null,
  p_current_period_end timestamptz default null,
  p_cancel_at_period_end boolean default false,
  p_canceled_at timestamptz default null,
  p_trial_start timestamptz default null,
  p_trial_end timestamptz default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_subscription public.billing_subscriptions%rowtype;
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  if nullif(p_stripe_customer_id, '') is null then
    raise exception 'p_stripe_customer_id is required';
  end if;

  if nullif(p_stripe_subscription_id, '') is null then
    raise exception 'p_stripe_subscription_id is required';
  end if;

  perform public.upsert_billing_customer(
    p_user_id,
    p_stripe_customer_id,
    null,
    null,
    '{}'::jsonb
  );

  insert into public.billing_subscriptions (
    user_id,
    stripe_customer_id,
    stripe_subscription_id,
    stripe_price_id,
    plan,
    status,
    cancel_at_period_end,
    current_period_start,
    current_period_end,
    canceled_at,
    trial_start,
    trial_end,
    metadata
  )
  values (
    p_user_id,
    p_stripe_customer_id,
    p_stripe_subscription_id,
    p_stripe_price_id,
    p_plan,
    p_status,
    coalesce(p_cancel_at_period_end, false),
    p_current_period_start,
    p_current_period_end,
    p_canceled_at,
    p_trial_start,
    p_trial_end,
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (stripe_subscription_id) do update
    set user_id = excluded.user_id,
        stripe_customer_id = excluded.stripe_customer_id,
        stripe_price_id = excluded.stripe_price_id,
        plan = excluded.plan,
        status = excluded.status,
        cancel_at_period_end = excluded.cancel_at_period_end,
        current_period_start = excluded.current_period_start,
        current_period_end = excluded.current_period_end,
        canceled_at = excluded.canceled_at,
        trial_start = excluded.trial_start,
        trial_end = excluded.trial_end,
        metadata = coalesce(public.billing_subscriptions.metadata, '{}'::jsonb)
          || excluded.metadata
  returning *
  into v_subscription;

  return jsonb_build_object(
    'ok', true,
    'subscription_id', v_subscription.id,
    'user_id', v_subscription.user_id,
    'status', v_subscription.status,
    'plan', v_subscription.plan,
    'current_period_end', v_subscription.current_period_end
  );
end;
$$;

create or replace function public.grant_monthly_credits(
  p_user_id uuid,
  p_amount integer default 100,
  p_idempotency_key text default null,
  p_description text default 'Monthly subscription credits',
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_transaction public.credit_transactions%rowtype;
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'p_amount must be greater than zero';
  end if;

  if nullif(p_idempotency_key, '') is null then
    raise exception 'p_idempotency_key is required for monthly grants';
  end if;

  v_transaction := private.adjust_credit(
    p_user_id,
    p_amount,
    'monthly_grant',
    p_idempotency_key,
    p_description,
    'stripe_invoice',
    p_idempotency_key,
    p_metadata
  );

  return jsonb_build_object(
    'ok', true,
    'transaction_id', v_transaction.id,
    'balance', v_transaction.balance_after
  );
end;
$$;

revoke execute on function public.upsert_billing_customer(
  uuid,
  text,
  text,
  text,
  jsonb
) from public, anon, authenticated;
grant execute on function public.upsert_billing_customer(
  uuid,
  text,
  text,
  text,
  jsonb
) to service_role;

revoke execute on function public.get_user_id_by_stripe_customer(text)
  from public, anon, authenticated;
grant execute on function public.get_user_id_by_stripe_customer(text)
  to service_role;

revoke execute on function public.record_billing_webhook_event(
  text,
  text,
  jsonb,
  public.billing_webhook_event_status,
  text
) from public, anon, authenticated;
grant execute on function public.record_billing_webhook_event(
  text,
  text,
  jsonb,
  public.billing_webhook_event_status,
  text
) to service_role;

revoke execute on function public.mark_billing_webhook_event_processed(text)
  from public, anon, authenticated;
grant execute on function public.mark_billing_webhook_event_processed(text)
  to service_role;

revoke execute on function public.upsert_billing_subscription_from_stripe(
  uuid,
  text,
  text,
  text,
  public.subscription_plan,
  public.billing_subscription_status,
  timestamptz,
  timestamptz,
  boolean,
  timestamptz,
  timestamptz,
  timestamptz,
  jsonb
) from public, anon, authenticated;
grant execute on function public.upsert_billing_subscription_from_stripe(
  uuid,
  text,
  text,
  text,
  public.subscription_plan,
  public.billing_subscription_status,
  timestamptz,
  timestamptz,
  boolean,
  timestamptz,
  timestamptz,
  timestamptz,
  jsonb
) to service_role;

revoke execute on function public.grant_monthly_credits(
  uuid,
  integer,
  text,
  text,
  jsonb
) from public, anon, authenticated;
grant execute on function public.grant_monthly_credits(
  uuid,
  integer,
  text,
  text,
  jsonb
) to service_role;
