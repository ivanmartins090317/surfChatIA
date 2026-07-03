-- Storage policies for private buckets media & boards
-- Apply after creating buckets in Supabase Storage

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
