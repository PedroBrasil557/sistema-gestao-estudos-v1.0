-- Sistema de Gestão de Estudos – Roberta
-- Versão 1.1.0: redesign, organização por tipo, cores e planejamento aprimorado.
-- Execute uma única vez depois das migrações da v1.0.

alter table public.courses
  add column if not exists course_group text not null default 'PROFESSIONAL',
  add column if not exists color text not null default '#2F6BFF',
  add column if not exists icon text not null default 'book-open',
  add column if not exists weekly_goal_minutes integer not null default 0,
  add column if not exists current_level text,
  add column if not exists target_level text,
  add column if not exists objective text,
  add column if not exists complementary_resources jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'courses_course_group_check'
      and conrelid = 'public.courses'::regclass
  ) then
    alter table public.courses
      add constraint courses_course_group_check
      check (course_group in ('LANGUAGE', 'PROFESSIONAL'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'courses_color_check'
      and conrelid = 'public.courses'::regclass
  ) then
    alter table public.courses
      add constraint courses_color_check
      check (color ~ '^#[0-9A-Fa-f]{6}$');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'courses_weekly_goal_minutes_check'
      and conrelid = 'public.courses'::regclass
  ) then
    alter table public.courses
      add constraint courses_weekly_goal_minutes_check
      check (weekly_goal_minutes between 0 and 10080);
  end if;
end $$;

alter table public.study_sessions
  add column if not exists scheduled_time time,
  add column if not exists language_skill text,
  add column if not exists resource text,
  add column if not exists recurrence_rule text,
  add column if not exists reminder_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'study_sessions_language_skill_check'
      and conrelid = 'public.study_sessions'::regclass
  ) then
    alter table public.study_sessions
      add constraint study_sessions_language_skill_check
      check (
        language_skill is null or language_skill in (
          'READING', 'WRITING', 'SPEAKING', 'LISTENING',
          'PRONUNCIATION', 'GRAMMAR', 'VOCABULARY', 'REVIEW'
        )
      );
  end if;
end $$;

alter table public.notes
  add column if not exists color text,
  add column if not exists is_draft boolean not null default false,
  add column if not exists checklist_data jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'notes_color_check'
      and conrelid = 'public.notes'::regclass
  ) then
    alter table public.notes
      add constraint notes_color_check
      check (color is null or color ~ '^#[0-9A-Fa-f]{6}$');
  end if;
end $$;

alter table public.note_categories
  add column if not exists color text not null default '#7C3AED';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'note_categories_color_check'
      and conrelid = 'public.note_categories'::regclass
  ) then
    alter table public.note_categories
      add constraint note_categories_color_check
      check (color ~ '^#[0-9A-Fa-f]{6}$');
  end if;
end $$;

alter table public.user_settings
  add column if not exists sidebar_color text not null default '#061735',
  add column if not exists button_color text not null default '#4454F4',
  add column if not exists card_tone text not null default 'soft';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'user_settings_sidebar_color_check'
      and conrelid = 'public.user_settings'::regclass
  ) then
    alter table public.user_settings
      add constraint user_settings_sidebar_color_check
      check (sidebar_color ~ '^#[0-9A-Fa-f]{6}$');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'user_settings_button_color_check'
      and conrelid = 'public.user_settings'::regclass
  ) then
    alter table public.user_settings
      add constraint user_settings_button_color_check
      check (button_color ~ '^#[0-9A-Fa-f]{6}$');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'user_settings_card_tone_check'
      and conrelid = 'public.user_settings'::regclass
  ) then
    alter table public.user_settings
      add constraint user_settings_card_tone_check
      check (card_tone in ('soft', 'neutral', 'vivid'));
  end if;
end $$;

-- Classificação inicial dos idiomas já cadastrados.
update public.courses c
set course_group = 'LANGUAGE'
from public.areas a
where c.area_id = a.id
  and (
    public.normalize_label(a.name) in ('ingles', 'idiomas')
    or public.normalize_label(c.name) ~ '(ingles|alemao|frances|espanhol|italiano|portugues|mandarim|japones)'
  );

-- Cores iniciais semelhantes às imagens de referência.
update public.courses set color = '#2F6BFF', icon = 'languages' where public.normalize_label(name) like '%ingles%';
update public.courses set color = '#7C3AED', icon = 'languages' where public.normalize_label(name) like '%alemao%';
update public.courses set color = '#EC4899', icon = 'languages' where public.normalize_label(name) like '%frances%';
update public.courses set color = '#F97316', icon = 'languages' where public.normalize_label(name) like '%espanhol%';
update public.courses set color = '#16A34A', icon = 'sheet' where public.normalize_label(name) like '%excel%';
update public.courses set color = '#2F6BFF', icon = 'file-text' where public.normalize_label(name) like '%word%';
update public.courses set color = '#EAB308', icon = 'bar-chart' where public.normalize_label(name) like '%power bi%';
update public.courses set color = '#0D9488', icon = 'wallet' where public.normalize_label(name) ~ '(financ|contab|cust|orcament)';
update public.courses set color = '#7C3AED', icon = 'database' where public.normalize_label(name) ~ '(sql|banco de dados)';

update public.note_categories set color = '#2F6BFF' where public.normalize_label(name) = 'resumo';
update public.note_categories set color = '#EC4899' where public.normalize_label(name) = 'duvida';
update public.note_categories set color = '#0D9488' where public.normalize_label(name) = 'formula';
update public.note_categories set color = '#16A34A' where public.normalize_label(name) = 'conceito';
update public.note_categories set color = '#F97316' where public.normalize_label(name) = 'exercicio';
update public.note_categories set color = '#EAB308' where public.normalize_label(name) = 'ideia';
update public.note_categories set color = '#7C3AED' where public.normalize_label(name) = 'revisao';

create index if not exists courses_user_group_idx on public.courses(user_id, course_group) where archived_at is null;
create index if not exists study_sessions_user_scheduled_idx on public.study_sessions(user_id, study_date, scheduled_time) where deleted_at is null;
create index if not exists notes_user_draft_idx on public.notes(user_id, is_draft) where deleted_at is null;

comment on column public.courses.course_group is 'Organiza os cursos em Idiomas ou Profissionalizantes no redesign v1.1.0.';
comment on column public.courses.color is 'Cor visual personalizável do curso.';
comment on column public.study_sessions.scheduled_time is 'Horário opcional para estudos planejados.';
comment on column public.study_sessions.language_skill is 'Habilidade praticada em cursos de idioma.';
comment on column public.notes.checklist_data is 'Itens de checklist da anotação em JSON.';
