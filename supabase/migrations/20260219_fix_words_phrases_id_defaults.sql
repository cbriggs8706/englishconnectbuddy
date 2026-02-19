begin;

create extension if not exists "pgcrypto";

alter table if exists public.words
  alter column id type uuid
  using (
    case
      when id is null then gen_random_uuid()
      when id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then id::uuid
      else gen_random_uuid()
    end
  );

alter table if exists public.words
  alter column id set default gen_random_uuid(),
  alter column id set not null;

alter table if exists public.phrases
  alter column id type uuid
  using (
    case
      when id is null then gen_random_uuid()
      when id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then id::uuid
      else gen_random_uuid()
    end
  );

alter table if exists public.phrases
  alter column id set default gen_random_uuid(),
  alter column id set not null;

create unique index if not exists words_course_lesson_eng_spa_por_unique_idx
on public.words (course, lesson, eng, spa, por);

create unique index if not exists phrases_course_lesson_eng_spa_por_unique_idx
on public.phrases (course, lesson, eng, spa, por);

commit;
