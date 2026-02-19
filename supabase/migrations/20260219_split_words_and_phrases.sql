begin;

create table if not exists public.words (
  id uuid primary key default gen_random_uuid(),
  course text not null,
  lesson integer not null check (lesson >= 1),
  eng text not null,
  spa text not null,
  por text not null,
  spa_transliteration text,
  por_transliteration text,
  ipa text,
  part_of_speech text,
  definition text,
  image text,
  eng_audio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists words_course_lesson_idx on public.words (course, lesson);
create unique index if not exists words_course_lesson_eng_spa_por_unique_idx
on public.words (course, lesson, eng, spa, por);

create table if not exists public.phrases (
  id uuid primary key default gen_random_uuid(),
  course text not null,
  lesson integer not null check (lesson >= 1),
  eng text not null,
  spa text not null,
  por text not null,
  eng_audio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists phrases_course_lesson_idx on public.phrases (course, lesson);
create unique index if not exists phrases_course_lesson_eng_spa_por_unique_idx
on public.phrases (course, lesson, eng, spa, por);

alter table public.words enable row level security;
alter table public.phrases enable row level security;

drop policy if exists "words readable by all" on public.words;
create policy "words readable by all"
on public.words for select
using (true);

drop policy if exists "words admin write" on public.words;
create policy "words admin write"
on public.words for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "phrases readable by all" on public.phrases;
create policy "phrases readable by all"
on public.phrases for select
using (true);

drop policy if exists "phrases admin write" on public.phrases;
create policy "phrases admin write"
on public.phrases for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

commit;
