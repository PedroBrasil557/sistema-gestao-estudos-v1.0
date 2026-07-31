-- Sistema de Gestão de Estudos – Roberta
-- Versão 0.6: importação controlada de cursos e certificações
-- Execute depois das migrações 202607240001 e 202607240002.

create table if not exists public.course_imports (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  import_key text not null check (char_length(import_key) between 8 and 120),
  source_name text not null check (char_length(trim(source_name)) between 2 and 160),
  source_type text not null check (source_type in ('OFFICIAL', 'CSV')),
  duplicate_strategy text not null check (duplicate_strategy in ('SKIP', 'UPDATE')),
  total_rows integer not null default 0 check (total_rows between 0 and 500),
  valid_rows integer not null default 0 check (valid_rows between 0 and 500),
  imported_rows integer not null default 0 check (imported_rows between 0 and 500),
  updated_rows integer not null default 0 check (updated_rows between 0 and 500),
  skipped_rows integer not null default 0 check (skipped_rows between 0 and 500),
  error_rows integer not null default 0 check (error_rows between 0 and 500),
  status text not null default 'PROCESSING' check (status in ('PROCESSING', 'COMPLETED', 'FAILED')),
  report jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create unique index if not exists course_imports_user_active_key_unique
  on public.course_imports(user_id, import_key)
  where status in ('PROCESSING', 'COMPLETED');

create index if not exists course_imports_user_created_idx
  on public.course_imports(user_id, created_at desc);

create index if not exists course_imports_user_status_idx
  on public.course_imports(user_id, status);

alter table public.course_imports enable row level security;

drop policy if exists "course_imports_select_own" on public.course_imports;
create policy "course_imports_select_own" on public.course_imports
  for select using ((select auth.uid()) = user_id);

drop policy if exists "course_imports_insert_own" on public.course_imports;
create policy "course_imports_insert_own" on public.course_imports
  for insert with check ((select auth.uid()) = user_id);

drop policy if exists "course_imports_update_own" on public.course_imports;
create policy "course_imports_update_own" on public.course_imports
  for update using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "course_imports_delete_own" on public.course_imports;
create policy "course_imports_delete_own" on public.course_imports
  for delete using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.course_imports to authenticated;

comment on table public.course_imports is 'Histórico e relatório das importações de cursos da versão 0.6.';
comment on column public.course_imports.import_key is 'Identificador idempotente calculado a partir da origem e dos registros.';
comment on column public.course_imports.report is 'Relatório completo, incluindo o resultado de cada linha.';
