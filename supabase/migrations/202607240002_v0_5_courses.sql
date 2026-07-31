-- Sistema de Gestão de Estudos – Roberta
-- Versão 0.5: módulo completo de cursos e certificações
-- Execute depois da migração 202607240001_v0_4_settings_and_lists.sql.

create table if not exists public.courses (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 160),
  normalized_name text not null,
  kind text not null default 'COURSE' check (kind in ('COURSE', 'CERTIFICATION')),
  platform_id uuid not null references public.platforms(id) on delete restrict,
  area_id uuid not null references public.areas(id) on delete restrict,
  workload_hours numeric(6,2) not null default 0 check (workload_hours >= 0 and workload_hours <= 9999.99),
  status text not null default 'PLANNED' check (status in ('PLANNED', 'NOT_STARTED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'CANCELLED')),
  priority text not null default 'MEDIUM' check (priority in ('HIGH', 'MEDIUM', 'LOW')),
  start_date date,
  target_completion_date date,
  completion_date date,
  emits_certificate boolean not null default false,
  url text,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint courses_target_after_start check (
    target_completion_date is null or start_date is null or target_completion_date >= start_date
  ),
  constraint courses_completion_after_start check (
    completion_date is null or start_date is null or completion_date >= start_date
  ),
  constraint courses_url_length check (url is null or char_length(url) <= 2048),
  constraint courses_notes_length check (notes is null or char_length(notes) <= 5000)
);

create unique index if not exists courses_user_kind_active_name_unique
  on public.courses(user_id, kind, normalized_name)
  where archived_at is null;

create index if not exists courses_user_status_idx on public.courses(user_id, status) where archived_at is null;
create index if not exists courses_user_area_idx on public.courses(user_id, area_id) where archived_at is null;
create index if not exists courses_user_platform_idx on public.courses(user_id, platform_id) where archived_at is null;
create index if not exists courses_user_priority_idx on public.courses(user_id, priority) where archived_at is null;
create index if not exists courses_user_target_idx on public.courses(user_id, target_completion_date) where archived_at is null;
create index if not exists courses_user_archived_idx on public.courses(user_id, archived_at);

create or replace function public.set_course_normalized_name()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.name = trim(regexp_replace(new.name, '\s+', ' ', 'g'));
  new.normalized_name = public.normalize_label(new.name);
  return new;
end;
$$;

drop trigger if exists courses_set_updated_at on public.courses;
create trigger courses_set_updated_at before update on public.courses
for each row execute function public.set_updated_at();

drop trigger if exists courses_set_normalized_name on public.courses;
create trigger courses_set_normalized_name before insert or update of name on public.courses
for each row execute function public.set_course_normalized_name();

-- Mantém a conclusão coerente quando o status é alterado.
create or replace function public.sync_course_completion_date()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'COMPLETED' and new.completion_date is null then
    new.completion_date = current_date;
  elsif tg_op = 'UPDATE' and new.status <> 'COMPLETED' and old.status = 'COMPLETED' and new.completion_date = old.completion_date then
    new.completion_date = null;
  end if;
  return new;
end;
$$;

drop trigger if exists courses_sync_completion_date on public.courses;
create trigger courses_sync_completion_date before insert or update of status on public.courses
for each row execute function public.sync_course_completion_date();

-- Vincula o curso atual das configurações sem apagar o histórico da conta.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'user_settings_current_course_id_fkey'
      and conrelid = 'public.user_settings'::regclass
  ) then
    alter table public.user_settings
      add constraint user_settings_current_course_id_fkey
      foreign key (current_course_id) references public.courses(id) on delete set null;
  end if;
end $$;

alter table public.courses enable row level security;

drop policy if exists "courses_select_own" on public.courses;
create policy "courses_select_own" on public.courses
  for select using ((select auth.uid()) = user_id);

drop policy if exists "courses_insert_own" on public.courses;
create policy "courses_insert_own" on public.courses
  for insert with check ((select auth.uid()) = user_id);

drop policy if exists "courses_update_own" on public.courses;
create policy "courses_update_own" on public.courses
  for update using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "courses_delete_own" on public.courses;
create policy "courses_delete_own" on public.courses
  for delete using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.courses to authenticated;

comment on table public.courses is 'Cursos e certificações particulares de cada usuário — versão 0.5.';
comment on column public.courses.archived_at is 'Exclusão lógica. Registros arquivados permanecem no histórico.';
