-- Enable UUID generation helper
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  real_name text,
  last_name text,
  nickname text,
  selected_course text not null default 'EC1',
  native_language text check (native_language in ('en', 'es', 'pt', 'sw', 'chk')),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists real_name text;
alter table public.profiles add column if not exists last_name text;
alter table public.profiles add column if not exists nickname text;
alter table public.profiles add column if not exists selected_course text;
update public.profiles set selected_course = 'EC1' where selected_course is null or trim(selected_course) = '';
alter table public.profiles alter column selected_course set default 'EC1';
alter table public.profiles alter column selected_course set not null;

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course text not null default 'EC1',
  level integer not null default 1,
  unit integer not null default 1,
  lesson_number integer not null default 1,
  sequence_number integer not null default 1,
  sort_order integer not null default 1,
  title_en text not null,
  title_es text not null,
  title_pt text not null,
  description_en text,
  description_es text,
  description_pt text,
  created_at timestamptz not null default now()
);

alter table public.lessons add column if not exists course text;
alter table public.lessons add column if not exists level integer not null default 1;
alter table public.lessons add column if not exists unit integer not null default 1;
alter table public.lessons add column if not exists lesson_number integer not null default 1;
alter table public.lessons add column if not exists sequence_number integer not null default 1;
update public.lessons
set course = coalesce(nullif(trim(course), ''), 'EC' || level::text);
alter table public.lessons alter column course set default 'EC1';
alter table public.lessons alter column course set not null;

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

drop index if exists lessons_level_unit_lesson_number_idx;
drop index if exists lessons_level_sequence_number_idx;
create unique index if not exists lessons_course_unit_lesson_number_idx
on public.lessons(course, unit, lesson_number);
create unique index if not exists lessons_course_sequence_number_idx
on public.lessons(course, sequence_number);

create table if not exists public.vocabulary (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  source_row_id integer,
  item_type text not null default 'word',
  english_text text not null,
  english_sentence text,
  spanish_text text not null,
  portuguese_text text not null,
  spanish_transliteration text,
  portuguese_transliteration text,
  ipa text,
  part_of_speech text,
  definition text,
  image_url text,
  audio_url text,
  difficulty_level integer not null default 1,
  created_at timestamptz not null default now()
);

alter table public.vocabulary add column if not exists source_row_id integer;
alter table public.vocabulary add column if not exists item_type text not null default 'word';
alter table public.vocabulary add column if not exists spanish_transliteration text;
alter table public.vocabulary add column if not exists portuguese_transliteration text;
alter table public.vocabulary add column if not exists ipa text;
alter table public.vocabulary add column if not exists part_of_speech text;
alter table public.vocabulary add column if not exists definition text;

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
  pattern_slot smallint,
  kind text,
  template_en text,
  template_es text,
  template_pt text,
  swap_groups jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists phrases_course_lesson_idx on public.phrases (course, lesson);
create unique index if not exists phrases_course_lesson_eng_spa_por_unique_idx
on public.phrases (course, lesson, eng, spa, por);
create unique index if not exists phrases_course_lesson_pattern_kind_unique_idx
on public.phrases (course, lesson, pattern_slot, kind);
create index if not exists phrases_conversation_lookup_idx
on public.phrases (course, lesson, pattern_slot, kind, updated_at desc);
alter table public.phrases drop constraint if exists phrases_pattern_slot_ck;
alter table public.phrases add constraint phrases_pattern_slot_ck
check (pattern_slot is null or pattern_slot in (1, 2));
alter table public.phrases drop constraint if exists phrases_kind_ck;
alter table public.phrases add constraint phrases_kind_ck
check (kind is null or kind in ('question', 'answer'));
alter table public.phrases drop constraint if exists phrases_swap_groups_is_array_ck;
alter table public.phrases add constraint phrases_swap_groups_is_array_ck
check (jsonb_typeof(swap_groups) = 'array');

create table if not exists public.sentence_scrambles (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  english_sentence text not null,
  spanish_hint text,
  portuguese_hint text,
  created_at timestamptz not null default now()
);

create table if not exists public.lesson_patterns (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade unique,
  english_image_url text,
  spanish_image_url text,
  portuguese_image_url text,
  en_pattern_1_question_image_url text,
  en_pattern_1_answer_image_url text,
  en_pattern_2_question_image_url text,
  en_pattern_2_answer_image_url text,
  es_pattern_1_question_image_url text,
  es_pattern_1_answer_image_url text,
  es_pattern_2_question_image_url text,
  es_pattern_2_answer_image_url text,
  pt_pattern_1_question_image_url text,
  pt_pattern_1_answer_image_url text,
  pt_pattern_2_question_image_url text,
  pt_pattern_2_answer_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lesson_patterns add column if not exists en_pattern_1_question_image_url text;
alter table public.lesson_patterns add column if not exists en_pattern_1_answer_image_url text;
alter table public.lesson_patterns add column if not exists en_pattern_2_question_image_url text;
alter table public.lesson_patterns add column if not exists en_pattern_2_answer_image_url text;
alter table public.lesson_patterns add column if not exists es_pattern_1_question_image_url text;
alter table public.lesson_patterns add column if not exists es_pattern_1_answer_image_url text;
alter table public.lesson_patterns add column if not exists es_pattern_2_question_image_url text;
alter table public.lesson_patterns add column if not exists es_pattern_2_answer_image_url text;
alter table public.lesson_patterns add column if not exists pt_pattern_1_question_image_url text;
alter table public.lesson_patterns add column if not exists pt_pattern_1_answer_image_url text;
alter table public.lesson_patterns add column if not exists pt_pattern_2_question_image_url text;
alter table public.lesson_patterns add column if not exists pt_pattern_2_answer_image_url text;

create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vocab_id uuid not null references public.vocabulary(id) on delete cascade,
  confidence integer not null default 0,
  mastered boolean not null default false,
  last_seen_at timestamptz not null default now(),
  unique (user_id, vocab_id)
);

create table if not exists public.game_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_type text not null,
  score integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_flashcard_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vocab_id uuid not null references public.vocabulary(id) on delete cascade,
  streak_count integer not null default 0,
  review_count integer not null default 0,
  mastered boolean not null default false,
  due_at timestamptz not null default now(),
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, vocab_id)
);

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

create table if not exists public.priority_section_polls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  section_key text not null,
  rank_order integer not null check (rank_order >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, section_key)
);

create index if not exists priority_section_polls_user_id_idx on public.priority_section_polls (user_id);
create index if not exists priority_section_polls_rank_order_idx on public.priority_section_polls (rank_order);

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.prevent_profile_admin_flag_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_admin is distinct from old.is_admin
     and not public.is_admin(auth.uid()) then
    raise exception 'Only admins can change admin access';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_profile_admin_flag_change on public.profiles;
create trigger prevent_profile_admin_flag_change
before update on public.profiles
for each row execute function public.prevent_profile_admin_flag_change();

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = uid), false);
$$;

alter table public.profiles enable row level security;
alter table public.lessons enable row level security;
alter table public.vocabulary enable row level security;
alter table public.words enable row level security;
alter table public.phrases enable row level security;
alter table public.sentence_scrambles enable row level security;
alter table public.lesson_patterns enable row level security;
alter table public.user_progress enable row level security;
alter table public.game_scores enable row level security;
alter table public.user_flashcard_progress enable row level security;
alter table public.lesson_confidence_polls enable row level security;
alter table public.priority_section_polls enable row level security;

-- Read access for everyone (open content)
drop policy if exists "lessons readable by all" on public.lessons;
create policy "lessons readable by all"
on public.lessons for select
using (true);

drop policy if exists "vocabulary readable by all" on public.vocabulary;
create policy "vocabulary readable by all"
on public.vocabulary for select
using (true);

drop policy if exists "words readable by all" on public.words;
create policy "words readable by all"
on public.words for select
using (true);

drop policy if exists "phrases readable by all" on public.phrases;
create policy "phrases readable by all"
on public.phrases for select
using (true);

drop policy if exists "scrambles readable by all" on public.sentence_scrambles;
create policy "scrambles readable by all"
on public.sentence_scrambles for select
using (true);

drop policy if exists "lesson patterns readable by all" on public.lesson_patterns;
create policy "lesson patterns readable by all"
on public.lesson_patterns for select
using (true);

-- Profile ownership
 drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "profiles admin read" on public.profiles;
create policy "profiles admin read"
on public.profiles for select
using (public.is_admin(auth.uid()));

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Progress ownership
 drop policy if exists "progress own read" on public.user_progress;
create policy "progress own read"
on public.user_progress for select
using (auth.uid() = user_id);

drop policy if exists "progress own upsert" on public.user_progress;
create policy "progress own upsert"
on public.user_progress for insert
with check (auth.uid() = user_id);

drop policy if exists "progress own update" on public.user_progress;
create policy "progress own update"
on public.user_progress for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Scores ownership
 drop policy if exists "scores own read" on public.game_scores;
create policy "scores own read"
on public.game_scores for select
using (auth.uid() = user_id);

drop policy if exists "scores own insert" on public.game_scores;
create policy "scores own insert"
on public.game_scores for insert
with check (auth.uid() = user_id);

drop policy if exists "flashcards own read" on public.user_flashcard_progress;
create policy "flashcards own read"
on public.user_flashcard_progress for select
using (auth.uid() = user_id);

drop policy if exists "flashcards admin read" on public.user_flashcard_progress;
create policy "flashcards admin read"
on public.user_flashcard_progress for select
using (public.is_admin(auth.uid()));

drop policy if exists "flashcards own insert" on public.user_flashcard_progress;
create policy "flashcards own insert"
on public.user_flashcard_progress for insert
with check (auth.uid() = user_id);

drop policy if exists "flashcards own update" on public.user_flashcard_progress;
create policy "flashcards own update"
on public.user_flashcard_progress for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

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

drop policy if exists "priority poll own read" on public.priority_section_polls;
create policy "priority poll own read"
on public.priority_section_polls for select
using (auth.uid() = user_id);

drop policy if exists "priority poll own insert" on public.priority_section_polls;
create policy "priority poll own insert"
on public.priority_section_polls for insert
with check (auth.uid() = user_id);

drop policy if exists "priority poll own update" on public.priority_section_polls;
create policy "priority poll own update"
on public.priority_section_polls for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "priority poll admin read" on public.priority_section_polls;
create policy "priority poll admin read"
on public.priority_section_polls for select
using (public.is_admin(auth.uid()));

-- Admin write access
 drop policy if exists "lessons admin write" on public.lessons;
create policy "lessons admin write"
on public.lessons for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "vocabulary admin write" on public.vocabulary;
create policy "vocabulary admin write"
on public.vocabulary for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "words admin write" on public.words;
create policy "words admin write"
on public.words for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "phrases admin write" on public.phrases;
create policy "phrases admin write"
on public.phrases for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "scrambles admin write" on public.sentence_scrambles;
create policy "scrambles admin write"
on public.sentence_scrambles for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "lesson patterns admin write" on public.lesson_patterns;
create policy "lesson patterns admin write"
on public.lesson_patterns for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Storage bucket for vocab media
insert into storage.buckets (id, name, public)
values ('vocab', 'vocab', true)
on conflict (id) do nothing;

drop policy if exists "vocab public read" on storage.objects;
create policy "vocab public read"
on storage.objects for select
using (bucket_id = 'vocab');

drop policy if exists "vocab admin insert" on storage.objects;
create policy "vocab admin insert"
on storage.objects for insert
with check (bucket_id = 'vocab' and public.is_admin(auth.uid()));

drop policy if exists "vocab admin update" on storage.objects;
create policy "vocab admin update"
on storage.objects for update
using (bucket_id = 'vocab' and public.is_admin(auth.uid()))
with check (bucket_id = 'vocab' and public.is_admin(auth.uid()));

drop policy if exists "vocab admin delete" on storage.objects;
create policy "vocab admin delete"
on storage.objects for delete
using (bucket_id = 'vocab' and public.is_admin(auth.uid()));

-- Storage bucket for lesson patterns
insert into storage.buckets (id, name, public)
values ('patterns', 'patterns', true)
on conflict (id) do nothing;

drop policy if exists "patterns public read" on storage.objects;
create policy "patterns public read"
on storage.objects for select
using (bucket_id = 'patterns');

drop policy if exists "patterns admin insert" on storage.objects;
create policy "patterns admin insert"
on storage.objects for insert
with check (bucket_id = 'patterns' and public.is_admin(auth.uid()));

drop policy if exists "patterns admin update" on storage.objects;
create policy "patterns admin update"
on storage.objects for update
using (bucket_id = 'patterns' and public.is_admin(auth.uid()))
with check (bucket_id = 'patterns' and public.is_admin(auth.uid()));

drop policy if exists "patterns admin delete" on storage.objects;
create policy "patterns admin delete"
on storage.objects for delete
using (bucket_id = 'patterns' and public.is_admin(auth.uid()));

-- promote first admin manually (replace with your user id)
-- update public.profiles set is_admin = true where id = 'YOUR-USER-UUID';

-- Volunteer scheduling
create table if not exists public.volunteer_slots (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  seats_available integer not null default 1 check (seats_available > 0),
  details text,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists volunteer_slots_starts_at_idx on public.volunteer_slots (starts_at);
create index if not exists volunteer_slots_active_starts_at_idx on public.volunteer_slots (is_active, starts_at);

create table if not exists public.volunteer_signups (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.volunteer_slots(id) on delete cascade,
  volunteer_name text not null,
  created_at timestamptz not null default now()
);

create index if not exists volunteer_signups_slot_id_idx on public.volunteer_signups (slot_id);
create unique index if not exists volunteer_signups_slot_name_unique_idx
on public.volunteer_signups (slot_id, lower(trim(volunteer_name)));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_volunteer_slots_updated_at on public.volunteer_slots;
create trigger set_volunteer_slots_updated_at
before update on public.volunteer_slots
for each row execute function public.set_updated_at();

alter table public.volunteer_slots enable row level security;
alter table public.volunteer_signups enable row level security;

drop policy if exists "volunteer slots readable by all" on public.volunteer_slots;
create policy "volunteer slots readable by all"
on public.volunteer_slots for select
using (true);

drop policy if exists "volunteer slots admin write" on public.volunteer_slots;
create policy "volunteer slots admin write"
on public.volunteer_slots for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "volunteer signups readable by all" on public.volunteer_signups;
create policy "volunteer signups readable by all"
on public.volunteer_signups for select
using (true);

drop policy if exists "volunteer signups open insert" on public.volunteer_signups;
create policy "volunteer signups open insert"
on public.volunteer_signups for insert
with check (
  length(trim(volunteer_name)) > 0
  and exists (
    select 1
    from public.volunteer_slots s
    where s.id = slot_id
      and s.is_active = true
  )
);

drop policy if exists "volunteer signups admin write" on public.volunteer_signups;
create policy "volunteer signups admin write"
on public.volunteer_signups for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Live quiz
create table if not exists public.quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  host_user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  lesson_ids uuid[] not null default '{}'::uuid[],
  join_code text not null unique,
  status text not null default 'waiting' check (status in ('waiting', 'active', 'finished')),
  question_duration_seconds integer not null default 20 check (question_duration_seconds >= 5),
  current_question_index integer not null default -1,
  question_started_at timestamptz,
  question_ends_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.quiz_sessions add column if not exists lesson_ids uuid[] not null default '{}'::uuid[];
update public.quiz_sessions
set lesson_ids = array[lesson_id]
where coalesce(array_length(lesson_ids, 1), 0) = 0;

create index if not exists quiz_sessions_join_code_idx on public.quiz_sessions (join_code);
create index if not exists quiz_sessions_status_idx on public.quiz_sessions (status);
create unique index if not exists quiz_sessions_host_one_open_idx
on public.quiz_sessions (host_user_id)
where status in ('waiting', 'active');

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.quiz_sessions(id) on delete cascade,
  question_order integer not null,
  prompt_vocab_id uuid not null references public.vocabulary(id) on delete cascade,
  correct_vocab_id uuid not null references public.vocabulary(id) on delete cascade,
  option_vocab_ids uuid[] not null,
  prompt_image_url text,
  created_at timestamptz not null default now(),
  unique (session_id, question_order)
);

create index if not exists quiz_questions_session_idx on public.quiz_questions (session_id, question_order);

create table if not exists public.quiz_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.quiz_sessions(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  guest_token text,
  nickname text not null,
  real_name text,
  is_guest boolean not null default false,
  is_removed boolean not null default false,
  score integer not null default 0,
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (session_id, user_id),
  unique (session_id, guest_token)
);

create index if not exists quiz_participants_session_idx on public.quiz_participants (session_id);

create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.quiz_sessions(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  participant_id uuid not null references public.quiz_participants(id) on delete cascade,
  selected_vocab_id uuid not null references public.vocabulary(id) on delete cascade,
  is_correct boolean not null default false,
  points integer not null default 0,
  answered_at timestamptz not null default now(),
  unique (session_id, question_id, participant_id)
);

create index if not exists quiz_answers_session_question_idx on public.quiz_answers (session_id, question_id);

create or replace function public.make_quiz_join_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text := '';
  i integer := 0;
begin
  while i < 6 loop
    code := code || substr(chars, (random() * (length(chars) - 1) + 1)::int, 1);
    i := i + 1;
  end loop;
  return code;
end;
$$;

create or replace function public.quiz_start_session_multi(
  p_lesson_ids uuid[],
  p_question_count integer default 10,
  p_question_duration_seconds integer default 20
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session_id uuid;
  v_join_code text;
  v_prompt record;
  v_distractor record;
  v_option_ids uuid[];
  v_lesson_ids uuid[];
  v_primary_lesson uuid;
  v_available_count integer := 0;
  v_question_count integer;
  v_duration integer := greatest(5, least(coalesce(p_question_duration_seconds, 20), 60));
  v_order integer := 0;
  v_prompt_en_key text;
  v_prompt_es_key text;
  v_prompt_pt_key text;
  v_selected_en_keys text[];
  v_selected_es_keys text[];
  v_selected_pt_keys text[];
begin
  v_lesson_ids := array(
    select distinct lesson_id
    from unnest(coalesce(p_lesson_ids, '{}'::uuid[])) as lesson_id
    where lesson_id is not null
  );
  v_primary_lesson := v_lesson_ids[1];

  if v_primary_lesson is null then
    raise exception 'At least one lesson is required';
  end if;

  if auth.uid() is null or not public.is_admin(auth.uid()) then
    raise exception 'Only teachers can host quizzes';
  end if;

  select id
  into v_session_id
  from public.quiz_sessions
  where host_user_id = auth.uid()
    and status in ('waiting', 'active')
  order by created_at desc
  limit 1;

  if v_session_id is not null then
    return v_session_id;
  end if;

  select count(*)
  into v_available_count
  from public.vocabulary
  where lesson_id = any(v_lesson_ids);

  if v_available_count = 0 then
    raise exception 'No vocabulary exists for the selected lessons';
  end if;

  v_question_count := greatest(1, least(coalesce(p_question_count, v_available_count), v_available_count));

  loop
    v_join_code := public.make_quiz_join_code();
    exit when not exists (
      select 1 from public.quiz_sessions where join_code = v_join_code and created_at > now() - interval '12 hours'
    );
  end loop;

  insert into public.quiz_sessions (
    host_user_id,
    lesson_id,
    lesson_ids,
    join_code,
    question_duration_seconds
  )
  values (
    auth.uid(),
    v_primary_lesson,
    v_lesson_ids,
    v_join_code,
    v_duration
  )
  returning id into v_session_id;

  for v_prompt in
    select id, image_url, english_text, spanish_text, portuguese_text
    from public.vocabulary
    where lesson_id = any(v_lesson_ids)
    order by random()
    limit v_question_count
  loop
    v_prompt_en_key := lower(trim(coalesce(v_prompt.english_text, '')));
    v_prompt_es_key := lower(trim(coalesce(v_prompt.spanish_text, '')));
    v_prompt_pt_key := lower(trim(coalesce(v_prompt.portuguese_text, '')));

    v_option_ids := array[v_prompt.id];
    v_selected_en_keys := array[v_prompt_en_key];
    v_selected_es_keys := array[v_prompt_es_key];
    v_selected_pt_keys := array[v_prompt_pt_key];

    for v_distractor in
      select
        id,
        lower(trim(coalesce(english_text, ''))) as en_key,
        lower(trim(coalesce(spanish_text, ''))) as es_key,
        lower(trim(coalesce(portuguese_text, ''))) as pt_key
      from public.vocabulary
      where lesson_id = any(v_lesson_ids)
        and id <> v_prompt.id
      order by random()
    loop
      if v_distractor.en_key = any(v_selected_en_keys)
         or v_distractor.es_key = any(v_selected_es_keys)
         or v_distractor.pt_key = any(v_selected_pt_keys) then
        continue;
      end if;

      v_option_ids := array_append(v_option_ids, v_distractor.id);
      v_selected_en_keys := array_append(v_selected_en_keys, v_distractor.en_key);
      v_selected_es_keys := array_append(v_selected_es_keys, v_distractor.es_key);
      v_selected_pt_keys := array_append(v_selected_pt_keys, v_distractor.pt_key);

      exit when array_length(v_option_ids, 1) >= 4;
    end loop;

    if array_length(v_option_ids, 1) < 4 then
      for v_distractor in
        select
          id,
          lower(trim(coalesce(english_text, ''))) as en_key,
          lower(trim(coalesce(spanish_text, ''))) as es_key,
          lower(trim(coalesce(portuguese_text, ''))) as pt_key
        from public.vocabulary
        where id <> all(v_option_ids)
        order by random()
      loop
        if v_distractor.en_key = any(v_selected_en_keys)
           or v_distractor.es_key = any(v_selected_es_keys)
           or v_distractor.pt_key = any(v_selected_pt_keys) then
          continue;
        end if;

        v_option_ids := array_append(v_option_ids, v_distractor.id);
        v_selected_en_keys := array_append(v_selected_en_keys, v_distractor.en_key);
        v_selected_es_keys := array_append(v_selected_es_keys, v_distractor.es_key);
        v_selected_pt_keys := array_append(v_selected_pt_keys, v_distractor.pt_key);

        exit when array_length(v_option_ids, 1) >= 4;
      end loop;
    end if;

    select array_agg(option_id order by random())
    into v_option_ids
    from unnest(v_option_ids) as option_id;

    insert into public.quiz_questions (
      session_id,
      question_order,
      prompt_vocab_id,
      correct_vocab_id,
      option_vocab_ids,
      prompt_image_url
    )
    values (
      v_session_id,
      v_order,
      v_prompt.id,
      v_prompt.id,
      coalesce(v_option_ids, array[v_prompt.id]),
      v_prompt.image_url
    );

    v_order := v_order + 1;
  end loop;

  if v_order = 0 then
    raise exception 'No vocabulary exists for the selected lessons';
  end if;

  return v_session_id;
end;
$$;

create or replace function public.quiz_start_session(
  p_lesson_id uuid,
  p_question_count integer default 10,
  p_question_duration_seconds integer default 20
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.quiz_start_session_multi(
    array[p_lesson_id],
    p_question_count,
    p_question_duration_seconds
  );
end;
$$;

create or replace function public.quiz_join_session(
  p_join_code text,
  p_nickname text,
  p_guest_token text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.quiz_sessions%rowtype;
  v_participant public.quiz_participants%rowtype;
  v_user_id uuid := auth.uid();
  v_nickname text := trim(coalesce(p_nickname, ''));
  v_join_code text := upper(regexp_replace(trim(coalesce(p_join_code, '')), '[^A-Za-z0-9]', '', 'g'));
  v_guest_token text := nullif(trim(coalesce(p_guest_token, '')), '');
begin
  if v_nickname = '' then
    raise exception 'Nickname is required';
  end if;

  if v_join_code = '' then
    raise exception 'Join code is required';
  end if;

  select *
  into v_session
  from public.quiz_sessions
  where upper(join_code) = v_join_code
  order by created_at desc
  limit 1;

  if v_session.id is null then
    raise exception 'Quiz not found for that join code';
  end if;

  if v_session.status = 'finished' then
    raise exception 'Quiz has already ended';
  end if;

  if v_user_id is not null then
    insert into public.quiz_participants (
      session_id,
      user_id,
      nickname,
      real_name,
      is_guest,
      is_removed,
      last_seen_at
    )
    values (
      v_session.id,
      v_user_id,
      v_nickname,
      (
        select p.real_name
        from public.profiles p
        where p.id = v_user_id
        limit 1
      ),
      false,
      false,
      now()
    )
    on conflict (session_id, user_id)
    do update set
      nickname = excluded.nickname,
      real_name = excluded.real_name,
      is_removed = false,
      last_seen_at = now()
    returning * into v_participant;
  else
    if v_guest_token is null then
      raise exception 'Guest token is required for anonymous players';
    end if;

    insert into public.quiz_participants (
      session_id,
      guest_token,
      nickname,
      is_guest,
      is_removed,
      last_seen_at
    )
    values (
      v_session.id,
      v_guest_token,
      v_nickname,
      true,
      false,
      now()
    )
    on conflict (session_id, guest_token)
    do update set
      nickname = excluded.nickname,
      is_removed = false,
      last_seen_at = now()
    returning * into v_participant;
  end if;

  if v_participant.id is null then
    raise exception 'Unable to join quiz';
  end if;

  return jsonb_build_object(
    'session_id', v_session.id,
    'participant_id', v_participant.id,
    'join_code', v_session.join_code
  );
end;
$$;

create or replace function public.quiz_submit_answer(
  p_session_id uuid,
  p_question_id uuid,
  p_participant_id uuid,
  p_selected_vocab_id uuid,
  p_guest_token text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.quiz_sessions%rowtype;
  v_question public.quiz_questions%rowtype;
  v_participant public.quiz_participants%rowtype;
  v_existing_points integer := 0;
  v_points integer := 0;
  v_correct boolean := false;
  v_remaining numeric := 0;
  v_active_participant_count integer := 0;
  v_answered_count integer := 0;
  v_guest_token text := nullif(trim(coalesce(p_guest_token, '')), '');
begin
  select * into v_session from public.quiz_sessions where id = p_session_id;
  if v_session.id is null then
    raise exception 'Quiz not found';
  end if;

  if v_session.status <> 'active' then
    raise exception 'Quiz is not active';
  end if;

  if v_session.question_ends_at is null or now() > v_session.question_ends_at then
    raise exception 'Question is closed';
  end if;

  select * into v_question
  from public.quiz_questions
  where id = p_question_id and session_id = p_session_id;

  if v_question.id is null then
    raise exception 'Question not found';
  end if;

  select * into v_participant
  from public.quiz_participants
  where id = p_participant_id
    and session_id = p_session_id;

  if v_participant.id is null then
    raise exception 'Participant not found';
  end if;

  if v_participant.is_removed then
    raise exception 'You have been removed by the teacher';
  end if;

  if v_participant.user_id is not null and v_participant.user_id <> auth.uid() then
    raise exception 'Not authorized for this participant';
  end if;

  if v_participant.user_id is null and (v_guest_token is null or v_guest_token <> v_participant.guest_token) then
    raise exception 'Guest token mismatch';
  end if;

  v_correct := (p_selected_vocab_id = v_question.correct_vocab_id);
  v_remaining := extract(epoch from (v_session.question_ends_at - now()));
  if v_correct then
    v_points := 1000 + floor(greatest(v_remaining, 0) * 20)::int;
  else
    v_points := 0;
  end if;

  select points into v_existing_points
  from public.quiz_answers
  where session_id = p_session_id
    and question_id = p_question_id
    and participant_id = p_participant_id;

  v_existing_points := coalesce(v_existing_points, 0);

  insert into public.quiz_answers (
    session_id,
    question_id,
    participant_id,
    selected_vocab_id,
    is_correct,
    points,
    answered_at
  )
  values (
    p_session_id,
    p_question_id,
    p_participant_id,
    p_selected_vocab_id,
    v_correct,
    v_points,
    now()
  )
  on conflict (session_id, question_id, participant_id)
  do update set
    selected_vocab_id = excluded.selected_vocab_id,
    is_correct = excluded.is_correct,
    points = excluded.points,
    answered_at = now();

  update public.quiz_participants
  set
    score = greatest(0, score - v_existing_points + v_points),
    last_seen_at = now()
  where id = p_participant_id;

  select count(*)
  into v_active_participant_count
  from public.quiz_participants
  where session_id = p_session_id
    and is_removed = false;

  if v_active_participant_count > 0 and v_question.question_order = v_session.current_question_index then
    select count(distinct qa.participant_id)
    into v_answered_count
    from public.quiz_answers qa
    join public.quiz_participants qp
      on qp.id = qa.participant_id
     and qp.session_id = qa.session_id
    where qa.session_id = p_session_id
      and qa.question_id = p_question_id
      and qp.is_removed = false;

    if v_answered_count >= v_active_participant_count then
      update public.quiz_sessions
      set question_ends_at = now()
      where id = p_session_id
        and status = 'active'
        and current_question_index = v_question.question_order;
    end if;
  end if;

  return jsonb_build_object(
    'is_correct', v_correct,
    'points', v_points
  );
end;
$$;

create or replace function public.quiz_advance_session(
  p_session_id uuid,
  p_action text default 'next'
)
returns public.quiz_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.quiz_sessions%rowtype;
  v_question_count integer := 0;
  v_next_index integer := 0;
begin
  select * into v_session from public.quiz_sessions where id = p_session_id;
  if v_session.id is null then
    raise exception 'Quiz not found';
  end if;

  if auth.uid() is null or (v_session.host_user_id <> auth.uid() and not public.is_admin(auth.uid())) then
    raise exception 'Only the host teacher can control this quiz';
  end if;

  select count(*) into v_question_count
  from public.quiz_questions
  where session_id = p_session_id;

  if lower(coalesce(p_action, 'next')) = 'end' then
    update public.quiz_sessions
    set
      status = 'finished',
      finished_at = now(),
      question_ends_at = now()
    where id = p_session_id
    returning * into v_session;
    return v_session;
  end if;

  if v_session.status = 'waiting' then
    v_next_index := 0;
  else
    v_next_index := v_session.current_question_index + 1;
  end if;

  if v_next_index >= v_question_count then
    update public.quiz_sessions
    set
      status = 'finished',
      finished_at = now(),
      question_ends_at = now()
    where id = p_session_id
    returning * into v_session;
    return v_session;
  end if;

  update public.quiz_sessions
  set
    status = 'active',
    started_at = coalesce(started_at, now()),
    current_question_index = v_next_index,
    question_started_at = now(),
    question_ends_at = now() + make_interval(secs => question_duration_seconds)
  where id = p_session_id
  returning * into v_session;

  return v_session;
end;
$$;

create or replace function public.quiz_set_question_duration(
  p_session_id uuid,
  p_question_duration_seconds integer
)
returns public.quiz_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.quiz_sessions%rowtype;
  v_duration integer := greatest(5, least(coalesce(p_question_duration_seconds, 20), 120));
begin
  select * into v_session from public.quiz_sessions where id = p_session_id;
  if v_session.id is null then
    raise exception 'Quiz not found';
  end if;

  if auth.uid() is null or (v_session.host_user_id <> auth.uid() and not public.is_admin(auth.uid())) then
    raise exception 'Only the host teacher can change duration';
  end if;

  update public.quiz_sessions
  set
    question_duration_seconds = v_duration,
    question_ends_at = case
      when status = 'active' and question_started_at is not null
        then question_started_at + make_interval(secs => v_duration)
      else question_ends_at
    end
  where id = p_session_id
  returning * into v_session;

  return v_session;
end;
$$;

create or replace function public.quiz_close_current_question(
  p_session_id uuid
)
returns public.quiz_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.quiz_sessions%rowtype;
begin
  select * into v_session from public.quiz_sessions where id = p_session_id;
  if v_session.id is null then
    raise exception 'Quiz not found';
  end if;

  if auth.uid() is null or (v_session.host_user_id <> auth.uid() and not public.is_admin(auth.uid())) then
    raise exception 'Only the host teacher can close the question';
  end if;

  if v_session.status <> 'active' then
    return v_session;
  end if;

  update public.quiz_sessions
  set question_ends_at = now()
  where id = p_session_id
    and status = 'active'
    and question_ends_at is not null
    and question_ends_at > now()
  returning * into v_session;

  if v_session.id is null then
    select * into v_session from public.quiz_sessions where id = p_session_id;
  end if;

  return v_session;
end;
$$;

create or replace function public.quiz_remove_participant(
  p_session_id uuid,
  p_participant_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.quiz_sessions%rowtype;
begin
  select * into v_session from public.quiz_sessions where id = p_session_id;
  if v_session.id is null then
    raise exception 'Quiz not found';
  end if;

  if auth.uid() is null or (v_session.host_user_id <> auth.uid() and not public.is_admin(auth.uid())) then
    raise exception 'Only the host teacher can remove players';
  end if;

  update public.quiz_participants
  set is_removed = true
  where id = p_participant_id and session_id = p_session_id;
end;
$$;

alter table public.quiz_sessions enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_participants enable row level security;
alter table public.quiz_answers enable row level security;

drop policy if exists "quiz sessions read all" on public.quiz_sessions;
create policy "quiz sessions read all"
on public.quiz_sessions for select
using (true);

drop policy if exists "quiz sessions host write" on public.quiz_sessions;
create policy "quiz sessions host write"
on public.quiz_sessions for all
using (auth.uid() is not null and (host_user_id = auth.uid() or public.is_admin(auth.uid())))
with check (auth.uid() is not null and (host_user_id = auth.uid() or public.is_admin(auth.uid())));

drop policy if exists "quiz questions read all" on public.quiz_questions;
create policy "quiz questions read all"
on public.quiz_questions for select
using (true);

drop policy if exists "quiz participants read all" on public.quiz_participants;
create policy "quiz participants read all"
on public.quiz_participants for select
using (true);

drop policy if exists "quiz answers read all" on public.quiz_answers;
create policy "quiz answers read all"
on public.quiz_answers for select
using (true);

grant execute on function public.quiz_start_session(uuid, integer, integer) to authenticated;
grant execute on function public.quiz_start_session_multi(uuid[], integer, integer) to authenticated;
grant execute on function public.quiz_join_session(text, text, text) to anon, authenticated;
grant execute on function public.quiz_submit_answer(uuid, uuid, uuid, uuid, text) to anon, authenticated;
grant execute on function public.quiz_advance_session(uuid, text) to authenticated;
grant execute on function public.quiz_set_question_duration(uuid, integer) to authenticated;
grant execute on function public.quiz_close_current_question(uuid) to authenticated;
grant execute on function public.quiz_remove_participant(uuid, uuid) to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'quiz_sessions'
  ) then
    alter publication supabase_realtime add table public.quiz_sessions;
  end if;

  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'quiz_participants'
  ) then
    alter publication supabase_realtime add table public.quiz_participants;
  end if;

  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'quiz_answers'
  ) then
    alter publication supabase_realtime add table public.quiz_answers;
  end if;

  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'volunteer_slots'
  ) then
    alter publication supabase_realtime add table public.volunteer_slots;
  end if;

  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'volunteer_signups'
  ) then
    alter publication supabase_realtime add table public.volunteer_signups;
  end if;
end
$$;
