-- Trilha A: créditos + ledger (cota comercial). Sem backfill para contas existentes.

alter table public.profiles
  add column if not exists plan text not null default 'free'
    check (plan in ('free', 'surfista', 'pro', 'coach')),
  add column if not exists credits_balance integer not null default 0
    check (credits_balance >= 0),
  add column if not exists credits_period_used integer not null default 0
    check (credits_period_used >= 0),
  add column if not exists credits_reserved integer not null default 0
    check (credits_reserved >= 0),
  add column if not exists billing_period_start timestamptz,
  add column if not exists free_quota_granted boolean not null default false;

comment on column public.profiles.free_quota_granted is
  'true apenas para novos signups após esta migration — sem backfill.';

comment on column public.profiles.credits_reserved is
  'Hold temporário durante análise em andamento (não é débito comercial).';

-- Novos cadastros: cota free (2) via free_quota_granted
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    display_name,
    plan,
    free_quota_granted,
    billing_period_start
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'free',
    true,
    now()
  );
  return new;
end;
$$;

-- Impede o cliente de alterar campos de billing/créditos
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and auth.uid() is not null then
    if new.role is distinct from old.role then
      new.role := old.role;
    end if;
    new.plan := old.plan;
    new.credits_balance := old.credits_balance;
    new.credits_period_used := old.credits_period_used;
    new.credits_reserved := old.credits_reserved;
    new.billing_period_start := old.billing_period_start;
    new.free_quota_granted := old.free_quota_granted;
  end if;
  return new;
end;
$$;

create table if not exists public.usage_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  analysis_id uuid,
  analysis_type text not null
    check (analysis_type in ('performance', 'board_spec', 'board_match')),
  credits_delta integer not null,
  reason text not null
    check (reason in (
      'analysis',
      'refund',
      'plan_renewal',
      'pack_purchase',
      'reserve_release'
    )),
  created_at timestamptz not null default now()
);

create index if not exists usage_ledger_user_id_created_at_idx
  on public.usage_ledger (user_id, created_at desc);

alter table public.usage_ledger enable row level security;

create policy "Users can view own usage ledger"
  on public.usage_ledger for select
  to authenticated
  using (auth.uid() = user_id);

comment on table public.usage_ledger is
  'Histórico de créditos. Escrita apenas via RPC security definer (service_role).';

-- Cota do plano free só conta se free_quota_granted
create or replace function public.profile_plan_quota(p_plan text, p_free_quota_granted boolean)
returns integer
language sql
immutable
as $$
  select case
    when p_plan = 'free' and p_free_quota_granted then 2
    when p_plan = 'surfista' then 8
    when p_plan = 'pro' then 30
    when p_plan = 'coach' then 100
    else 0
  end;
$$;

create or replace function public.profile_credits_remaining(
  p_plan text,
  p_free_quota_granted boolean,
  p_credits_period_used integer,
  p_credits_balance integer,
  p_credits_reserved integer
)
returns integer
language sql
immutable
as $$
  select greatest(
    0,
    public.profile_plan_quota(p_plan, p_free_quota_granted)
      - p_credits_period_used
      + p_credits_balance
      - p_credits_reserved
  );
$$;

create or replace function public.reserve_analysis_credit(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.profiles%rowtype;
  v_remaining integer;
begin
  if p_user_id is null then
    raise exception 'user_id inválido';
  end if;

  select * into v_row
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('allowed', false, 'remaining', 0);
  end if;

  v_remaining := public.profile_credits_remaining(
    v_row.plan,
    v_row.free_quota_granted,
    v_row.credits_period_used,
    v_row.credits_balance,
    v_row.credits_reserved
  );

  if v_remaining < 1 then
    return jsonb_build_object('allowed', false, 'remaining', 0);
  end if;

  update public.profiles
  set credits_reserved = credits_reserved + 1
  where id = p_user_id;

  return jsonb_build_object('allowed', true, 'remaining', v_remaining - 1);
end;
$$;

create or replace function public.release_analysis_credit(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reserved integer;
begin
  update public.profiles
  set credits_reserved = greatest(0, credits_reserved - 1)
  where id = p_user_id
  returning credits_reserved into v_reserved;

  if not found then
    return jsonb_build_object('released', false);
  end if;

  return jsonb_build_object('released', true, 'credits_reserved', v_reserved);
end;
$$;

create or replace function public.commit_analysis_credit(
  p_user_id uuid,
  p_analysis_type text,
  p_analysis_id uuid,
  p_reason text default 'analysis'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.profiles%rowtype;
  v_remaining integer;
begin
  if p_analysis_type not in ('performance', 'board_spec', 'board_match') then
    raise exception 'analysis_type inválido';
  end if;

  select * into v_row
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'remaining', 0);
  end if;

  if v_row.credits_reserved < 1 then
    -- Sem hold: ainda assim só debita se houver saldo (defesa em profundidade)
    v_remaining := public.profile_credits_remaining(
      v_row.plan,
      v_row.free_quota_granted,
      v_row.credits_period_used,
      v_row.credits_balance,
      0
    );
    if v_remaining < 1 then
      return jsonb_build_object('success', false, 'remaining', 0);
    end if;

    update public.profiles
    set credits_period_used = credits_period_used + 1
    where id = p_user_id;
  else
    update public.profiles
    set
      credits_reserved = credits_reserved - 1,
      credits_period_used = credits_period_used + 1
    where id = p_user_id;
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
    p_analysis_id,
    p_analysis_type,
    -1,
    coalesce(p_reason, 'analysis')
  );

  select * into v_row from public.profiles where id = p_user_id;

  return jsonb_build_object(
    'success', true,
    'remaining',
    public.profile_credits_remaining(
      v_row.plan,
      v_row.free_quota_granted,
      v_row.credits_period_used,
      v_row.credits_balance,
      v_row.credits_reserved
    )
  );
end;
$$;

revoke all on function public.reserve_analysis_credit(uuid) from public;
revoke all on function public.release_analysis_credit(uuid) from public;
revoke all on function public.commit_analysis_credit(uuid, text, uuid, text) from public;

grant execute on function public.reserve_analysis_credit(uuid) to service_role;
grant execute on function public.release_analysis_credit(uuid) to service_role;
grant execute on function public.commit_analysis_credit(uuid, text, uuid, text) to service_role;
