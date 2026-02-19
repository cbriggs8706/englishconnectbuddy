begin;

-- Profiles: persist each learner's currently selected course.
alter table public.profiles add column if not exists selected_course text;
update public.profiles
set selected_course = 'EC1'
where selected_course is null or trim(selected_course) = '';
alter table public.profiles alter column selected_course set default 'EC1';
alter table public.profiles alter column selected_course set not null;

-- Lessons: add canonical course key (EC1, EC2, ...).
alter table public.lessons add column if not exists course text;
update public.lessons
set course = coalesce(nullif(trim(course), ''), 'EC' || level::text);
alter table public.lessons alter column course set default 'EC1';
alter table public.lessons alter column course set not null;

-- Recompute sequence_number per course for legacy rows that only had level grouping.
with ordered as (
  select
    id,
    row_number() over (
      partition by course
      order by unit asc, lesson_number asc, created_at asc
    ) as seq
  from public.lessons
)
update public.lessons l
set sequence_number = ordered.seq
from ordered
where l.id = ordered.id;

-- Replace level-based uniqueness with course-based uniqueness.
drop index if exists lessons_level_unit_lesson_number_idx;
drop index if exists lessons_level_sequence_number_idx;
create unique index if not exists lessons_course_unit_lesson_number_idx
on public.lessons(course, unit, lesson_number);
create unique index if not exists lessons_course_sequence_number_idx
on public.lessons(course, sequence_number);

-- New users: initialize profile.selected_course from signup metadata when provided.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, selected_course)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'course'), ''), 'EC1')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Vocab staging: allow CSV imports to include course.
do $$
begin
  if to_regclass('public.vocab_import_staging') is not null then
    alter table public.vocab_import_staging add column if not exists course text;
  end if;
end;
$$;

commit;
