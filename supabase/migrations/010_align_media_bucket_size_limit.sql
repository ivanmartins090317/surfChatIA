-- Alinha o limite do bucket media ao Global file size do Supabase Free (50 MB).
-- O limite global do plano Free não pode ultrapassar 50 MB; o bucket não pode
-- ficar acima disso, senão a UI aceita arquivos que o Storage rejeita depois.

update storage.buckets
set file_size_limit = 52428800
where id = 'media';
