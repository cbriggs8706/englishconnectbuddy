begin;

create table if not exists public.lesson_confidence_polls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  confidence integer not null check (confidence between 0 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

alter table public.lesson_confidence_polls add column if not exists updated_at timestamptz not null default now();
create index if not exists lesson_confidence_polls_user_id_idx on public.lesson_confidence_polls (user_id);
create index if not exists lesson_confidence_polls_lesson_id_idx on public.lesson_confidence_polls (lesson_id);

alter table public.lesson_confidence_polls enable row level security;

drop policy if exists "lesson confidence own read" on public.lesson_confidence_polls;
create policy "lesson confidence own read"
on public.lesson_confidence_polls for select
using (auth.uid() = user_id);

drop policy if exists "lesson confidence own insert" on public.lesson_confidence_polls;
create policy "lesson confidence own insert"
on public.lesson_confidence_polls for insert
with check (auth.uid() = user_id);

drop policy if exists "lesson confidence own update" on public.lesson_confidence_polls;
create policy "lesson confidence own update"
on public.lesson_confidence_polls for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "lesson confidence admin read" on public.lesson_confidence_polls;
create policy "lesson confidence admin read"
on public.lesson_confidence_polls for select
using (public.is_admin(auth.uid()));

drop policy if exists "profiles admin read" on public.profiles;
create policy "profiles admin read"
on public.profiles for select
using (public.is_admin(auth.uid()));

drop policy if exists "flashcards admin read" on public.user_flashcard_progress;
create policy "flashcards admin read"
on public.user_flashcard_progress for select
using (public.is_admin(auth.uid()));

commit;
