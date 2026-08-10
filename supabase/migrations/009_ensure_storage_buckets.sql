-- Garante buckets privados de mídia e pranchas.
-- A 005 já foi registrada em alguns ambientes, mas os buckets podem ter
-- sido removidos ou nunca materializados no Storage API.

insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', false, 104857600)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

insert into storage.buckets (id, name, public, file_size_limit)
values ('boards', 'boards', false, 10485760)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

-- Reaplica policies de storage de forma idempotente (caso tenham sido
-- removidas junto com os buckets ou nunca aplicadas).
drop policy if exists "Users upload own media" on storage.objects;
drop policy if exists "Users read own media" on storage.objects;
drop policy if exists "Users delete own media" on storage.objects;
drop policy if exists "Users upload own board photos" on storage.objects;
drop policy if exists "Users read own board photos" on storage.objects;
drop policy if exists "Users delete own board photos" on storage.objects;

create policy "Users upload own media"
  on storage.objects for insert
  with check (
    bucket_id = 'media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users read own media"
  on storage.objects for select
  using (
    bucket_id = 'media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users delete own media"
  on storage.objects for delete
  using (
    bucket_id = 'media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users upload own board photos"
  on storage.objects for insert
  with check (
    bucket_id = 'boards'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users read own board photos"
  on storage.objects for select
  using (
    bucket_id = 'boards'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users delete own board photos"
  on storage.objects for delete
  using (
    bucket_id = 'boards'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
