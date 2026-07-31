-- Sistema de Gestão de Estudos – Roberta
-- Versão 0.9: anotações, revisão e tags
-- Execute depois das migrações v0.4 a v0.7. A v0.8 não exige migração.

create table if not exists public.notes (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete restrict,
  category_id uuid not null references public.note_categories(id) on delete restrict,
  note_date date not null default current_date,
  topic text,
  title text not null check (char_length(trim(title)) between 2 and 180),
  content text not null check (char_length(content) between 1 and 20000),
  is_important boolean not null default false,
  review_at date,
  is_reviewed boolean not null default false,
  reviewed_at timestamptz,
  external_url text,
  tags text[] not null default '{}'::text[],
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notes_topic_length check (topic is null or char_length(topic) <= 240),
  constraint notes_external_url_length check (external_url is null or char_length(external_url) <= 1000),
  constraint notes_tags_limit check (cardinality(tags) <= 20)
);

create index if not exists notes_user_date_idx on public.notes(user_id, note_date desc) where deleted_at is null;
create index if not exists notes_course_idx on public.notes(course_id) where deleted_at is null;
create index if not exists notes_category_idx on public.notes(user_id, category_id) where deleted_at is null;
create index if not exists notes_review_idx on public.notes(user_id, review_at, is_reviewed) where deleted_at is null;
create index if not exists notes_important_idx on public.notes(user_id, is_important) where deleted_at is null;
create index if not exists notes_deleted_idx on public.notes(user_id, deleted_at);

create or replace function public.validate_note_relations()
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

  if not exists (
    select 1 from public.note_categories
    where id = new.category_id and user_id = new.user_id
  ) then
    raise exception 'A categoria selecionada não pertence ao usuário.' using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at
before update on public.notes
for each row execute function public.set_updated_at();

drop trigger if exists notes_validate_relations on public.notes;
create trigger notes_validate_relations
before insert or update of user_id, course_id, category_id on public.notes
for each row execute function public.validate_note_relations();

alter table public.notes enable row level security;

drop policy if exists "notes_select_own" on public.notes;
create policy "notes_select_own" on public.notes
  for select using ((select auth.uid()) = user_id);

drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own" on public.notes
  for insert with check ((select auth.uid()) = user_id);

drop policy if exists "notes_update_own" on public.notes;
create policy "notes_update_own" on public.notes
  for update using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "notes_delete_own" on public.notes;
create policy "notes_delete_own" on public.notes
  for delete using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.notes to authenticated;

comment on table public.notes is 'Anotações, dúvidas, fórmulas, ideias e revisões particulares por usuário — versão 0.9.';
comment on column public.notes.tags is 'Tags opcionais complementares à especificação, usadas na referência visual da aba Anotações.';
comment on column public.notes.reviewed_at is 'Momento da última marcação como revisada, sem apagar a data original da anotação.';
