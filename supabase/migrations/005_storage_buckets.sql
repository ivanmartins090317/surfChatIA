-- Storage buckets (private)
insert into storage.buckets (id, name, public)
values ('media', 'media', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('boards', 'boards', false)
on conflict (id) do nothing;
