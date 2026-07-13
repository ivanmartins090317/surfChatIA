-- Papel do usuário (admin lê feedback; promoção manual via SQL)
alter table public.profiles
  add column if not exists role text not null default 'user'
  check (role in ('user', 'admin'));

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and new.role is distinct from old.role and auth.uid() is not null then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
  before update on public.profiles
  for each row execute procedure public.protect_profile_role();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

-- Avaliações e comentários sobre a plataforma (separado do perfil de surf)
create table if not exists public.product_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating >= 1 and rating <= 5),
  comment text check (comment is null or char_length(comment) <= 2000),
  page_path text,
  created_at timestamptz not null default now()
);

create index if not exists product_feedback_created_at_idx
  on public.product_feedback (created_at desc);

create index if not exists product_feedback_user_id_idx
  on public.product_feedback (user_id);

alter table public.product_feedback enable row level security;

create policy "Users can submit own feedback"
  on public.product_feedback for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Admins can read all feedback"
  on public.product_feedback for select
  to authenticated
  using (public.is_admin());
