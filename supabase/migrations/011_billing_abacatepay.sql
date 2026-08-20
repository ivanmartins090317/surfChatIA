-- Trilha H: assinaturas AbacatePay, idempotência de webhooks e RPCs de billing.

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null default 'abacatepay'
    check (provider in ('abacatepay')),
  external_id text not null,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'cancelled', 'past_due')),
  plan text not null
    check (plan in ('surfista', 'pro')),
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, external_id)
);

create index if not exists subscriptions_user_id_idx
  on public.subscriptions (user_id);

create unique index if not exists subscriptions_one_active_per_user_idx
  on public.subscriptions (user_id)
  where status in ('pending', 'active');

alter table public.subscriptions enable row level security;

create policy "Users can view own subscriptions"
  on public.subscriptions for select
  to authenticated
  using (auth.uid() = user_id);

comment on table public.subscriptions is
  'Assinaturas pagas. Escrita via service_role / RPC security definer.';

create table if not exists public.billing_webhook_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

comment on table public.billing_webhook_events is
  'Idempotência de webhooks AbacatePay — event_id único por notificação.';

create table if not exists public.billing_checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  offer_key text not null
    check (offer_key in ('surfista', 'pro', 'pack_s', 'pack_m')),
  external_ref text not null unique,
  gateway_checkout_id text,
  gateway_subscription_id text,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists billing_checkout_sessions_user_id_idx
  on public.billing_checkout_sessions (user_id);

alter table public.billing_checkout_sessions enable row level security;

create policy "Users can view own checkout sessions"
  on public.billing_checkout_sessions for select
  to authenticated
  using (auth.uid() = user_id);

-- Novos motivos no ledger para distinguir compras e assinaturas
alter table public.usage_ledger
  drop constraint if exists usage_ledger_reason_check;

alter table public.usage_ledger
  add constraint usage_ledger_reason_check
  check (reason in (
    'analysis',
    'refund',
    'plan_renewal',
    'pack_purchase',
    'reserve_release',
    'subscription_activated',
    'subscription_renewed'
  ));

-- analysis_type opcional para entradas de billing (sem análise vinculada)
alter table public.usage_ledger
  alter column analysis_type drop not null;

create or replace function public.add_month_period(p_from timestamptz)
returns timestamptz
language sql
immutable
as $$
  select p_from + interval '1 month';
$$;

create or replace function public.apply_pack_purchase(
  p_user_id uuid,
  p_credits integer,
  p_event_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted integer;
begin
  insert into public.billing_webhook_events (event_id, event_type)
  values (p_event_id, 'pack_purchase')
  on conflict (event_id) do nothing;

  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    return jsonb_build_object('duplicate', true);
  end if;

  update public.profiles
  set credits_balance = credits_balance + p_credits
  where id = p_user_id;

  if not found then
    raise exception 'profile_not_found';
  end if;

  insert into public.usage_ledger (
    user_id,
    analysis_id,
    analysis_type,
    credits_delta,
    reason
  )
  values (
    p_user_id,
    null,
    null,
    p_credits,
    'pack_purchase'
  );

  return jsonb_build_object('duplicate', false, 'success', true);
end;
$$;

create or replace function public.apply_subscription_activation(
  p_user_id uuid,
  p_plan text,
  p_external_id text,
  p_period_start timestamptz,
  p_period_end timestamptz,
  p_event_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted integer;
begin
  if p_plan not in ('surfista', 'pro') then
    raise exception 'invalid_plan';
  end if;

  insert into public.billing_webhook_events (event_id, event_type)
  values (p_event_id, 'subscription_activation')
  on conflict (event_id) do nothing;

  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    return jsonb_build_object('duplicate', true);
  end if;

  update public.subscriptions
  set status = 'cancelled', updated_at = now()
  where user_id = p_user_id
    and status in ('pending', 'active')
    and external_id <> p_external_id;

  insert into public.subscriptions (
    user_id,
    external_id,
    status,
    plan,
    current_period_start,
    current_period_end
  )
  values (
    p_user_id,
    p_external_id,
    'active',
    p_plan,
    p_period_start,
    p_period_end
  )
  on conflict (provider, external_id) do update
  set
    status = 'active',
    plan = excluded.plan,
    current_period_start = excluded.current_period_start,
    current_period_end = excluded.current_period_end,
    cancelled_at = null,
    updated_at = now();

  update public.profiles
  set
    plan = p_plan,
    credits_period_used = 0,
    billing_period_start = p_period_start
  where id = p_user_id;

  insert into public.usage_ledger (
    user_id,
    analysis_id,
    analysis_type,
    credits_delta,
    reason
  )
  values (
    p_user_id,
    null,
    null,
    0,
    'subscription_activated'
  );

  return jsonb_build_object('duplicate', false, 'success', true);
end;
$$;

create or replace function public.apply_subscription_renewal(
  p_user_id uuid,
  p_external_id text,
  p_period_start timestamptz,
  p_period_end timestamptz,
  p_event_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted integer;
begin
  insert into public.billing_webhook_events (event_id, event_type)
  values (p_event_id, 'subscription_renewal')
  on conflict (event_id) do nothing;

  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    return jsonb_build_object('duplicate', true);
  end if;

  update public.subscriptions
  set
    status = 'active',
    current_period_start = p_period_start,
    current_period_end = p_period_end,
    cancelled_at = null,
    updated_at = now()
  where user_id = p_user_id
    and external_id = p_external_id;

  update public.profiles
  set
    credits_period_used = 0,
    billing_period_start = p_period_start
  where id = p_user_id;

  insert into public.usage_ledger (
    user_id,
    analysis_id,
    analysis_type,
    credits_delta,
    reason
  )
  values (
    p_user_id,
    null,
    null,
    0,
    'subscription_renewed'
  );

  return jsonb_build_object('duplicate', false, 'success', true);
end;
$$;

create or replace function public.apply_subscription_cancellation(
  p_user_id uuid,
  p_external_id text,
  p_cancelled_at timestamptz,
  p_event_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted integer;
begin
  insert into public.billing_webhook_events (event_id, event_type)
  values (p_event_id, 'subscription_cancellation')
  on conflict (event_id) do nothing;

  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    return jsonb_build_object('duplicate', true);
  end if;

  update public.subscriptions
  set
    status = 'cancelled',
    cancelled_at = coalesce(p_cancelled_at, now()),
    updated_at = now()
  where user_id = p_user_id
    and external_id = p_external_id;

  return jsonb_build_object('duplicate', false, 'success', true);
end;
$$;

create or replace function public.maybe_downgrade_expired_subscription(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub public.subscriptions%rowtype;
begin
  select * into v_sub
  from public.subscriptions
  where user_id = p_user_id
    and status = 'cancelled'
    and current_period_end <= now()
  order by current_period_end desc
  limit 1;

  if not found then
    return;
  end if;

  update public.profiles
  set
    plan = 'free',
    credits_period_used = 0,
    billing_period_start = now()
  where id = p_user_id
    and plan in ('surfista', 'pro');
end;
$$;

revoke all on function public.apply_pack_purchase(uuid, integer, text) from public;
revoke all on function public.apply_subscription_activation(uuid, text, text, timestamptz, timestamptz, text) from public;
revoke all on function public.apply_subscription_renewal(uuid, text, timestamptz, timestamptz, text) from public;
revoke all on function public.apply_subscription_cancellation(uuid, text, timestamptz, text) from public;
revoke all on function public.maybe_downgrade_expired_subscription(uuid) from public;

grant execute on function public.apply_pack_purchase(uuid, integer, text) to service_role;
grant execute on function public.apply_subscription_activation(uuid, text, text, timestamptz, timestamptz, text) to service_role;
grant execute on function public.apply_subscription_renewal(uuid, text, timestamptz, timestamptz, text) to service_role;
grant execute on function public.apply_subscription_cancellation(uuid, text, timestamptz, text) to service_role;
grant execute on function public.maybe_downgrade_expired_subscription(uuid) to service_role;
