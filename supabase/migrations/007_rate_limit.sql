-- Rate limit persistente (Etapa 2.2) — compartilhado entre instâncias Vercel

create table if not exists public.rate_limit_buckets (
  bucket_key text primary key,
  count integer not null default 1 check (count >= 0),
  reset_at timestamptz not null
);

create index if not exists rate_limit_buckets_reset_at_idx
  on public.rate_limit_buckets (reset_at);

alter table public.rate_limit_buckets enable row level security;

comment on table public.rate_limit_buckets is
  'Contadores de rate limit server-side. Acesso apenas via service_role + RPC check_rate_limit.';

create or replace function public.check_rate_limit(
  p_bucket_key text,
  p_limit integer,
  p_window_seconds integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_window interval := make_interval(secs => p_window_seconds);
  v_count integer;
  v_reset_at timestamptz;
begin
  if p_bucket_key is null or length(trim(p_bucket_key)) = 0 then
    raise exception 'bucket_key inválido';
  end if;

  if p_limit <= 0 or p_window_seconds <= 0 then
    raise exception 'limit e window_seconds devem ser positivos';
  end if;

  insert into public.rate_limit_buckets as rl (bucket_key, count, reset_at)
  values (p_bucket_key, 1, v_now + v_window)
  on conflict (bucket_key) do update
  set
    count = case
      when rl.reset_at <= v_now then 1
      when rl.count >= p_limit then rl.count
      else rl.count + 1
    end,
    reset_at = case
      when rl.reset_at <= v_now then v_now + v_window
      else rl.reset_at
    end
  returning rl.count, rl.reset_at into v_count, v_reset_at;

  if v_count > p_limit then
    return jsonb_build_object(
      'allowed', false,
      'retry_after_ms',
      greatest(0, (extract(epoch from (v_reset_at - v_now)) * 1000)::integer)
    );
  end if;

  return jsonb_build_object('allowed', true);
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer) from public;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;
