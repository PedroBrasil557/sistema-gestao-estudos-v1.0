-- Sistema de Gestão de Estudos – Roberta
-- Versão 0.7: sessões de estudo e atualização automática das horas dos cursos
-- Execute depois das migrações das versões 0.4, 0.5 e 0.6.

alter table public.courses
  add column if not exists studied_hours numeric(8,2) not null default 0
  check (studied_hours >= 0);

create table if not exists public.study_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete restrict,
  study_type_id uuid not null references public.study_types(id) on delete restrict,
  study_date date not null default current_date,
  topic text not null check (char_length(trim(topic)) between 2 and 240),
  planned_hours numeric(5,2) check (planned_hours is null or (planned_hours >= 0 and planned_hours <= 24)),
  studied_hours numeric(5,2) not null default 0 check (studied_hours >= 0 and studied_hours <= 24),
  status text not null default 'PLANNED' check (status in ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'PAUSED', 'CANCELLED')),
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint study_sessions_notes_length check (notes is null or char_length(notes) <= 5000)
);

create index if not exists study_sessions_user_date_idx
  on public.study_sessions(user_id, study_date desc) where deleted_at is null;
create index if not exists study_sessions_course_date_idx
  on public.study_sessions(course_id, study_date desc) where deleted_at is null;
create index if not exists study_sessions_user_status_idx
  on public.study_sessions(user_id, status) where deleted_at is null;
create index if not exists study_sessions_user_type_idx
  on public.study_sessions(user_id, study_type_id) where deleted_at is null;
create index if not exists study_sessions_user_deleted_idx
  on public.study_sessions(user_id, deleted_at);

create or replace function public.validate_study_session_relations()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.courses
    where id = new.course_id
      and user_id = new.user_id
      and archived_at is null
  ) then
    raise exception 'O curso selecionado não pertence ao usuário ou está arquivado.' using errcode = '23514';
  end if;

  if not exists (
    select 1 from public.study_types
    where id = new.study_type_id
      and user_id = new.user_id
      and archived_at is null
  ) then
    raise exception 'O tipo de estudo selecionado não pertence ao usuário ou está arquivado.' using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.validate_daily_study_hours()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_hours numeric(8,2);
begin
  if new.deleted_at is not null then
    return new;
  end if;

  select coalesce(sum(studied_hours), 0)
    into existing_hours
  from public.study_sessions
  where user_id = new.user_id
    and study_date = new.study_date
    and deleted_at is null
    and id <> new.id;

  if existing_hours + new.studied_hours > 24 then
    raise exception 'A soma das horas estudadas no dia não pode ultrapassar 24 horas.' using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.recalculate_course_studied_hours(target_course_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.courses
  set studied_hours = coalesce((
    select sum(session.studied_hours)
    from public.study_sessions session
    where session.course_id = target_course_id
      and session.deleted_at is null
  ), 0)
  where id = target_course_id;
end;
$$;

create or replace function public.sync_course_studied_hours_from_session()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalculate_course_studied_hours(old.course_id);
    return old;
  end if;

  perform public.recalculate_course_studied_hours(new.course_id);

  if tg_op = 'UPDATE' and old.course_id <> new.course_id then
    perform public.recalculate_course_studied_hours(old.course_id);
  end if;

  return new;
end;
$$;

drop trigger if exists study_sessions_set_updated_at on public.study_sessions;
create trigger study_sessions_set_updated_at
before update on public.study_sessions
for each row execute function public.set_updated_at();

drop trigger if exists study_sessions_validate_relations on public.study_sessions;
create trigger study_sessions_validate_relations
before insert or update of user_id, course_id, study_type_id on public.study_sessions
for each row execute function public.validate_study_session_relations();

drop trigger if exists study_sessions_validate_daily_hours on public.study_sessions;
create trigger study_sessions_validate_daily_hours
before insert or update of user_id, study_date, studied_hours, deleted_at on public.study_sessions
for each row execute function public.validate_daily_study_hours();

drop trigger if exists study_sessions_sync_course_hours on public.study_sessions;
create trigger study_sessions_sync_course_hours
after insert or update or delete on public.study_sessions
for each row execute function public.sync_course_studied_hours_from_session();

-- Corrige os totais caso a migração seja executada em uma base que já possua sessões.
do $$
declare
  course_row record;
begin
  for course_row in select id from public.courses loop
    perform public.recalculate_course_studied_hours(course_row.id);
  end loop;
end $$;

alter table public.study_sessions enable row level security;

drop policy if exists "study_sessions_select_own" on public.study_sessions;
create policy "study_sessions_select_own" on public.study_sessions
  for select using ((select auth.uid()) = user_id);

drop policy if exists "study_sessions_insert_own" on public.study_sessions;
create policy "study_sessions_insert_own" on public.study_sessions
  for insert with check ((select auth.uid()) = user_id);

drop policy if exists "study_sessions_update_own" on public.study_sessions;
create policy "study_sessions_update_own" on public.study_sessions
  for update using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "study_sessions_delete_own" on public.study_sessions;
create policy "study_sessions_delete_own" on public.study_sessions
  for delete using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.study_sessions to authenticated;

-- Impede alteração manual do total calculado, sem bloquear a edição normal dos cursos.
revoke update on public.courses from authenticated;
grant update (
  name,
  normalized_name,
  kind,
  platform_id,
  area_id,
  workload_hours,
  status,
  priority,
  start_date,
  target_completion_date,
  completion_date,
  emits_certificate,
  url,
  notes,
  archived_at
) on public.courses to authenticated;

-- A função de recálculo deve ser acionada apenas pelos gatilhos internos.
revoke execute on function public.recalculate_course_studied_hours(uuid) from public, anon, authenticated;

comment on table public.study_sessions is 'Planejamentos e registros de estudo particulares de cada usuário — versão 0.7.';
comment on column public.study_sessions.deleted_at is 'Exclusão lógica; quando preenchido, as horas deixam de compor os totais do curso.';
comment on column public.courses.studied_hours is 'Total automático das sessões não excluídas vinculadas ao curso.';
