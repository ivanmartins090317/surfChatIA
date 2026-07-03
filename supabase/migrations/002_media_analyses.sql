-- Media items & analyses
create table if not exists public.media_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('video', 'image', 'link')),
  storage_path text,
  external_url text,
  wave_type text check (wave_type in ('beach_break', 'point', 'reef', 'river_mouth', 'other')),
  focus text check (focus in ('speed', 'maneuvers', 'consistency')),
  status text not null default 'uploading' check (status in ('uploading', 'processing', 'ready', 'error')),
  created_at timestamptz not null default now()
);

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  media_item_id uuid references public.media_items (id) on delete set null,
  board_id uuid,
  type text not null check (type in ('performance', 'board_match')),
  result_json jsonb,
  status text not null default 'processing' check (status in ('processing', 'done', 'error')),
  reference_board_id uuid,
  board_candidate_photos text[],
  advertised_measurements jsonb,
  created_at timestamptz not null default now()
);

alter table public.media_items enable row level security;
alter table public.analyses enable row level security;

create policy "Users manage own media"
  on public.media_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own analyses"
  on public.analyses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists media_items_user_id_idx on public.media_items (user_id);
create index if not exists analyses_user_id_idx on public.analyses (user_id);
create index if not exists analyses_type_idx on public.analyses (type);

-- Storage buckets (run via Supabase dashboard or API)
-- insert into storage.buckets (id, name, public) values ('media', 'media', false);
-- insert into storage.buckets (id, name, public) values ('boards', 'boards', false);
