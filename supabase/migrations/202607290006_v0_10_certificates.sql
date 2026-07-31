-- Sistema de Gestão de Estudos – Roberta
-- Versão 0.10: certificados e armazenamento privado
-- Execute depois da migração v0.9.

create table if not exists public.certificates (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete restrict,
  is_available boolean not null default false,
  credential_code text,
  validation_url text,
  file_key text,
  file_name text,
  mime_type text,
  size bigint,
  completion_date date,
  issue_date date,
  expiration_date date,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint certificates_code_length check (credential_code is null or char_length(credential_code) <= 300),
  constraint certificates_validation_url_length check (validation_url is null or char_length(validation_url) <= 1000),
  constraint certificates_file_name_length check (file_name is null or char_length(file_name) <= 255),
  constraint certificates_file_key_length check (file_key is null or char_length(file_key) <= 1200),
  constraint certificates_notes_length check (notes is null or char_length(notes) <= 5000),
  constraint certificates_size_positive check (size is null or (size >= 0 and size <= 10485760)),
  constraint certificates_issue_after_completion check (issue_date is null or completion_date is null or issue_date >= completion_date),
  constraint certificates_expiration_after_issue check (expiration_date is null or issue_date is null or expiration_date >= issue_date)
);

create index if not exists certificates_user_available_idx on public.certificates(user_id, is_available) where deleted_at is null;
create index if not exists certificates_course_idx on public.certificates(course_id) where deleted_at is null;
create index if not exists certificates_user_issue_idx on public.certificates(user_id, issue_date desc) where deleted_at is null;
create index if not exists certificates_user_expiration_idx on public.certificates(user_id, expiration_date) where deleted_at is null;
create index if not exists certificates_deleted_idx on public.certificates(user_id, deleted_at);

create or replace function public.validate_certificate_course()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.courses
    where id = new.course_id and user_id = new.user_id
  ) then
    raise exception 'O curso selecionado não pertence ao usuário.' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists certificates_set_updated_at on public.certificates;
create trigger certificates_set_updated_at
before update on public.certificates
for each row execute function public.set_updated_at();

drop trigger if exists certificates_validate_course on public.certificates;
create trigger certificates_validate_course
before insert or update of user_id, course_id on public.certificates
for each row execute function public.validate_certificate_course();

alter table public.certificates enable row level security;

drop policy if exists "certificates_select_own" on public.certificates;
create policy "certificates_select_own" on public.certificates
  for select using ((select auth.uid()) = user_id);

drop policy if exists "certificates_insert_own" on public.certificates;
create policy "certificates_insert_own" on public.certificates
  for insert with check ((select auth.uid()) = user_id);

drop policy if exists "certificates_update_own" on public.certificates;
create policy "certificates_update_own" on public.certificates
  for update using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "certificates_delete_own" on public.certificates;
create policy "certificates_delete_own" on public.certificates
  for delete using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.certificates to authenticated;

-- Bucket privado. O caminho dos arquivos será: <userId>/<certificateId>/<arquivo>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'certificates',
  'certificates',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "certificate_files_select_own" on storage.objects;
create policy "certificate_files_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'certificates' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "certificate_files_insert_own" on storage.objects;
create policy "certificate_files_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'certificates' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "certificate_files_update_own" on storage.objects;
create policy "certificate_files_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'certificates' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'certificates' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "certificate_files_delete_own" on storage.objects;
create policy "certificate_files_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'certificates' and (storage.foldername(name))[1] = (select auth.uid())::text);

comment on table public.certificates is 'Certificados, credenciais e arquivos privados vinculados aos cursos — versão 0.10.';
comment on column public.certificates.file_key is 'Caminho privado no bucket certificates do Supabase Storage.';
