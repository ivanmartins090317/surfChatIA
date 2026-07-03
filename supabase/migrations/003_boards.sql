-- Boards (magic board)
create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  is_magic boolean not null default false,
  name text,
  length_in numeric(4, 2),
  width_in numeric(4, 2),
  thickness_in numeric(4, 2),
  volume_l numeric(5, 2),
  sensation_json jsonb,
  spec_json jsonb,
  ai_summary text,
  photo_paths text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'processing', 'ready', 'error')),
  created_at timestamptz not null default now()
);

alter table public.analyses
  add constraint analyses_reference_board_id_fkey
  foreign key (reference_board_id) references public.boards (id) on delete set null;

alter table public.analyses
  add constraint analyses_board_id_fkey
  foreign key (board_id) references public.boards (id) on delete set null;

alter table public.boards enable row level security;

create policy "Users manage own boards"
  on public.boards for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists boards_user_id_idx on public.boards (user_id);
create index if not exists boards_is_magic_idx on public.boards (is_magic) where is_magic = true;
