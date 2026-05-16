-- ============================================================================
-- 003_app_rpcs: credit and chat helper RPCs
-- ============================================================================

create or replace function private.adjust_credit(
  p_user_id uuid,
  p_amount integer,
  p_transaction_type public.credit_transaction_type,
  p_idempotency_key text,
  p_description text,
  p_related_entity_type text,
  p_related_entity_id text,
  p_metadata jsonb
)
returns public.credit_transactions
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_balance_after integer;
  v_transaction public.credit_transactions%rowtype;
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  if p_amount = 0 then
    raise exception 'p_amount must not be zero';
  end if;

  if p_idempotency_key is not null then
    select *
    into v_transaction
    from public.credit_transactions
    where user_id = p_user_id
      and idempotency_key = p_idempotency_key;

    if found then
      return v_transaction;
    end if;
  end if;

  insert into public.credit_balances (
    user_id,
    balance,
    total_granted,
    total_consumed
  )
  values (p_user_id, 0, 0, 0)
  on conflict (user_id) do nothing;

  if p_amount > 0 then
    update public.credit_balances
    set balance = balance + p_amount,
        total_granted = total_granted + p_amount
    where user_id = p_user_id
    returning balance
    into v_balance_after;
  else
    update public.credit_balances
    set balance = balance + p_amount,
        total_consumed = total_consumed + abs(p_amount)
    where user_id = p_user_id
      and balance + p_amount >= 0
    returning balance
    into v_balance_after;

    if not found then
      raise exception 'insufficient_credits'
        using errcode = 'P0001';
    end if;
  end if;

  insert into public.credit_transactions (
    user_id,
    amount,
    balance_after,
    transaction_type,
    idempotency_key,
    description,
    related_entity_type,
    related_entity_id,
    metadata
  )
  values (
    p_user_id,
    p_amount,
    v_balance_after,
    p_transaction_type,
    p_idempotency_key,
    p_description,
    p_related_entity_type,
    p_related_entity_id,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning *
  into v_transaction;

  return v_transaction;
end;
$$;

create or replace function public.get_credit_balance()
returns integer
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select coalesce(
    (
      select balance
      from public.credit_balances
      where user_id = (select auth.uid())
    ),
    0
  );
$$;

create or replace function public.consume_credit(
  p_amount integer default 1,
  p_idempotency_key text default null,
  p_description text default 'AI chat message',
  p_related_entity_type text default null,
  p_related_entity_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_transaction public.credit_transactions%rowtype;
begin
  if v_user_id is null then
    raise exception 'not_authenticated'
      using errcode = 'P0001';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'p_amount must be greater than zero';
  end if;

  v_transaction := private.adjust_credit(
    v_user_id,
    -p_amount,
    'chat_usage',
    p_idempotency_key,
    p_description,
    p_related_entity_type,
    p_related_entity_id,
    p_metadata
  );

  return jsonb_build_object(
    'ok', true,
    'transaction_id', v_transaction.id,
    'balance', v_transaction.balance_after
  );
end;
$$;

create or replace function public.refund_credit(
  p_user_id uuid,
  p_amount integer,
  p_idempotency_key text,
  p_description text default 'Credit refund',
  p_related_entity_type text default null,
  p_related_entity_id text default null,
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
  if p_amount is null or p_amount <= 0 then
    raise exception 'p_amount must be greater than zero';
  end if;

  v_transaction := private.adjust_credit(
    p_user_id,
    p_amount,
    'refund',
    p_idempotency_key,
    p_description,
    p_related_entity_type,
    p_related_entity_id,
    p_metadata
  );

  return jsonb_build_object(
    'ok', true,
    'transaction_id', v_transaction.id,
    'balance', v_transaction.balance_after
  );
end;
$$;

create or replace function public.soft_delete_chat_session(
  p_session_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_deleted_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'not_authenticated'
      using errcode = 'P0001';
  end if;

  update public.chat_sessions
  set deleted_at = now()
  where id = p_session_id
    and user_id = v_user_id
    and deleted_at is null
  returning deleted_at
  into v_deleted_at;

  if not found then
    raise exception 'chat_session_not_found'
      using errcode = 'P0001';
  end if;

  return jsonb_build_object(
    'ok', true,
    'id', p_session_id,
    'deleted_at', v_deleted_at
  );
end;
$$;

revoke execute on function private.adjust_credit(
  uuid,
  integer,
  public.credit_transaction_type,
  text,
  text,
  text,
  text,
  jsonb
) from public, anon, authenticated;

revoke execute on function public.get_credit_balance() from public, anon;
grant execute on function public.get_credit_balance() to authenticated;

revoke execute on function public.consume_credit(
  integer,
  text,
  text,
  text,
  text,
  jsonb
) from public, anon;
grant execute on function public.consume_credit(
  integer,
  text,
  text,
  text,
  text,
  jsonb
) to authenticated;

revoke execute on function public.refund_credit(
  uuid,
  integer,
  text,
  text,
  text,
  text,
  jsonb
) from public, anon, authenticated;
grant execute on function public.refund_credit(
  uuid,
  integer,
  text,
  text,
  text,
  text,
  jsonb
) to service_role;

revoke execute on function public.soft_delete_chat_session(uuid) from public, anon;
grant execute on function public.soft_delete_chat_session(uuid) to authenticated;
