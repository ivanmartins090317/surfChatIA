-- Fotos da session (frames JPEG) persistidas para análise de vídeo sem o MP4 original.
-- Políticas RLS de media_items e storage.objects no bucket media já cobrem o prefixo {userId}/.

alter table public.media_items
  add column if not exists frame_paths text[] not null default '{}';
