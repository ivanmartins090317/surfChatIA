-- Trilha D/H: Mercado Pago como provedor de cobrança (substitui AbacatePay no caminho feliz).

alter table public.subscriptions
  drop constraint if exists subscriptions_provider_check;

alter table public.subscriptions
  add constraint subscriptions_provider_check
  check (provider in ('abacatepay', 'mercadopago'));

alter table public.subscriptions
  alter column provider set default 'mercadopago';

comment on table public.subscriptions is
  'Assinaturas pagas (Mercado Pago). Escrita via service_role / RPC security definer.';

comment on table public.billing_webhook_events is
  'Idempotência de webhooks de billing — event_id único por notificação.';

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
    provider,
    external_id,
    status,
    plan,
    current_period_start,
    current_period_end
  )
  values (
    p_user_id,
    'mercadopago',
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
