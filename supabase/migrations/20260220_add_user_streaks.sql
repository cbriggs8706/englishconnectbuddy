begin;

create table if not exists public.user_streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  last_qualified_day date,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_daily_streak_activity (
  user_id uuid not null references auth.users(id) on delete cascade,
  local_day date not null,
  time_zone text,
  did_login boolean not null default false,
  flashcard_reviews integer not null default 0 check (flashcard_reviews >= 0),
  matching_rounds integer not null default 0 check (matching_rounds >= 0),
  quiz_answers integer not null default 0 check (quiz_answers >= 0),
  new_cards_seen integer not null default 0 check (new_cards_seen >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, local_day)
);

create table if not exists public.user_vocab_first_seen (
  user_id uuid not null references auth.users(id) on delete cascade,
  vocab_id uuid not null references public.vocabulary(id) on delete cascade,
  first_seen_day date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, vocab_id)
);

create table if not exists public.user_new_card_mastery (
  user_id uuid not null references auth.users(id) on delete cascade,
  local_day date not null,
  vocab_id uuid not null references public.vocabulary(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, local_day, vocab_id)
);

create table if not exists public.user_streak_misses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  missed_day date not null,
  used_free_miss boolean not null default false,
  reversed boolean not null default false,
  reversed_on_day date,
  created_at timestamptz not null default now(),
  unique (user_id, missed_day)
);

create index if not exists user_streaks_last_qualified_day_idx
on public.user_streaks (last_qualified_day);

create index if not exists user_daily_streak_activity_day_idx
on public.user_daily_streak_activity (user_id, local_day desc);

create index if not exists user_streak_misses_day_idx
on public.user_streak_misses (user_id, missed_day desc);

create index if not exists user_streak_misses_free_miss_idx
on public.user_streak_misses (user_id, used_free_miss, missed_day);

create index if not exists user_new_card_mastery_day_idx
on public.user_new_card_mastery (user_id, local_day);

create or replace function public.set_user_streak_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_streaks_updated_at on public.user_streaks;
create trigger set_user_streaks_updated_at
before update on public.user_streaks
for each row execute function public.set_user_streak_updated_at();

drop trigger if exists set_user_daily_streak_activity_updated_at on public.user_daily_streak_activity;
create trigger set_user_daily_streak_activity_updated_at
before update on public.user_daily_streak_activity
for each row execute function public.set_user_streak_updated_at();

alter table public.user_streaks enable row level security;
alter table public.user_daily_streak_activity enable row level security;
alter table public.user_vocab_first_seen enable row level security;
alter table public.user_new_card_mastery enable row level security;
alter table public.user_streak_misses enable row level security;

drop policy if exists "user streaks own read" on public.user_streaks;
create policy "user streaks own read"
on public.user_streaks for select
using (auth.uid() = user_id);

drop policy if exists "user streaks own insert" on public.user_streaks;
create policy "user streaks own insert"
on public.user_streaks for insert
with check (auth.uid() = user_id);

drop policy if exists "user streaks own update" on public.user_streaks;
create policy "user streaks own update"
on public.user_streaks for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "daily streak own read" on public.user_daily_streak_activity;
create policy "daily streak own read"
on public.user_daily_streak_activity for select
using (auth.uid() = user_id);

drop policy if exists "daily streak own insert" on public.user_daily_streak_activity;
create policy "daily streak own insert"
on public.user_daily_streak_activity for insert
with check (auth.uid() = user_id);

drop policy if exists "daily streak own update" on public.user_daily_streak_activity;
create policy "daily streak own update"
on public.user_daily_streak_activity for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "vocab first seen own read" on public.user_vocab_first_seen;
create policy "vocab first seen own read"
on public.user_vocab_first_seen for select
using (auth.uid() = user_id);

drop policy if exists "vocab first seen own insert" on public.user_vocab_first_seen;
create policy "vocab first seen own insert"
on public.user_vocab_first_seen for insert
with check (auth.uid() = user_id);

drop policy if exists "new card mastery own read" on public.user_new_card_mastery;
create policy "new card mastery own read"
on public.user_new_card_mastery for select
using (auth.uid() = user_id);

drop policy if exists "new card mastery own insert" on public.user_new_card_mastery;
create policy "new card mastery own insert"
on public.user_new_card_mastery for insert
with check (auth.uid() = user_id);

drop policy if exists "streak misses own read" on public.user_streak_misses;
create policy "streak misses own read"
on public.user_streak_misses for select
using (auth.uid() = user_id);

drop policy if exists "streak misses own insert" on public.user_streak_misses;
create policy "streak misses own insert"
on public.user_streak_misses for insert
with check (auth.uid() = user_id);

drop policy if exists "streak misses own update" on public.user_streak_misses;
create policy "streak misses own update"
on public.user_streak_misses for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.upsert_streak_login(
  p_local_day date,
  p_time_zone text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_day date := coalesce(p_local_day, timezone('UTC', now())::date);
begin
  if v_user_id is null then
    return;
  end if;

  insert into public.user_daily_streak_activity (
    user_id,
    local_day,
    time_zone,
    did_login
  )
  values (
    v_user_id,
    v_day,
    nullif(trim(coalesce(p_time_zone, '')), ''),
    true
  )
  on conflict (user_id, local_day)
  do update set
    did_login = true,
    time_zone = coalesce(excluded.time_zone, public.user_daily_streak_activity.time_zone);

  insert into public.user_streaks (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;
end;
$$;

create or replace function public.record_streak_activity(
  p_activity_type text,
  p_local_day date,
  p_time_zone text default null,
  p_vocab_id uuid default null,
  p_became_mastered boolean default false
)
returns public.user_streaks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_day date := coalesce(p_local_day, timezone('UTC', now())::date);
  v_activity_type text := lower(trim(coalesce(p_activity_type, '')));
  v_first_seen_day date;
  v_prev_qualified_day date;
  v_gap_day date;
  v_has_kept_day boolean;
  v_current_streak integer := 0;
  v_mastered_new_today integer := 0;
  v_today_has_activity boolean := false;
  v_streak_row public.user_streaks;
begin
  if v_user_id is null then
    raise exception 'Must be signed in';
  end if;

  if v_activity_type not in ('flashcards', 'matching', 'quiz') then
    raise exception 'Unsupported streak activity type: %', v_activity_type;
  end if;

  insert into public.user_daily_streak_activity (
    user_id,
    local_day,
    time_zone,
    did_login
  )
  values (
    v_user_id,
    v_day,
    nullif(trim(coalesce(p_time_zone, '')), ''),
    true
  )
  on conflict (user_id, local_day)
  do update set
    did_login = true,
    time_zone = coalesce(excluded.time_zone, public.user_daily_streak_activity.time_zone);

  if v_activity_type = 'flashcards' then
    update public.user_daily_streak_activity
    set flashcard_reviews = flashcard_reviews + 1
    where user_id = v_user_id and local_day = v_day;
  elsif v_activity_type = 'matching' then
    update public.user_daily_streak_activity
    set matching_rounds = matching_rounds + 1
    where user_id = v_user_id and local_day = v_day;
  else
    update public.user_daily_streak_activity
    set quiz_answers = quiz_answers + 1
    where user_id = v_user_id and local_day = v_day;
  end if;

  if v_activity_type = 'flashcards' and p_vocab_id is not null then
    insert into public.user_vocab_first_seen (user_id, vocab_id, first_seen_day)
    values (v_user_id, p_vocab_id, v_day)
    on conflict (user_id, vocab_id) do nothing;

    if found then
      update public.user_daily_streak_activity
      set new_cards_seen = new_cards_seen + 1
      where user_id = v_user_id and local_day = v_day;
      v_first_seen_day := v_day;
    else
      select first_seen_day
      into v_first_seen_day
      from public.user_vocab_first_seen
      where user_id = v_user_id and vocab_id = p_vocab_id;
    end if;

    if p_became_mastered and v_first_seen_day = v_day then
      insert into public.user_new_card_mastery (user_id, local_day, vocab_id)
      values (v_user_id, v_day, p_vocab_id)
      on conflict (user_id, local_day, vocab_id) do nothing;
    end if;
  end if;

  insert into public.user_streaks (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  select local_day
  into v_prev_qualified_day
  from public.user_daily_streak_activity
  where user_id = v_user_id
    and local_day < v_day
    and did_login = true
    and (flashcard_reviews + matching_rounds + quiz_answers) > 0
  order by local_day desc
  limit 1;

  if v_prev_qualified_day is not null and v_prev_qualified_day < (v_day - 1) then
    for v_gap_day in
      select generate_series(v_prev_qualified_day + 1, v_day - 1, interval '1 day')::date
    loop
      insert into public.user_streak_misses (user_id, missed_day)
      values (v_user_id, v_gap_day)
      on conflict (user_id, missed_day) do nothing;

      if found then
        if not exists (
          select 1
          from public.user_streak_misses
          where user_id = v_user_id
            and used_free_miss = true
            and missed_day between (v_gap_day - 29) and v_gap_day
        ) then
          update public.user_streak_misses
          set used_free_miss = true
          where user_id = v_user_id and missed_day = v_gap_day;
        end if;
      end if;
    end loop;
  end if;

  select count(*)
  into v_mastered_new_today
  from public.user_new_card_mastery
  where user_id = v_user_id
    and local_day = v_day;

  if v_mastered_new_today >= 20 then
    update public.user_streak_misses
    set reversed = true,
        reversed_on_day = v_day
    where user_id = v_user_id
      and missed_day = (v_day - 1)
      and used_free_miss = false
      and reversed = false;
  end if;

  select did_login and (flashcard_reviews + matching_rounds + quiz_answers) > 0
  into v_today_has_activity
  from public.user_daily_streak_activity
  where user_id = v_user_id and local_day = v_day;

  if coalesce(v_today_has_activity, false) then
    v_current_streak := 0;
    v_gap_day := v_day;

    loop
      select (
        exists (
          select 1
          from public.user_daily_streak_activity
          where user_id = v_user_id
            and local_day = v_gap_day
            and did_login = true
            and (flashcard_reviews + matching_rounds + quiz_answers) > 0
        )
        or exists (
          select 1
          from public.user_streak_misses
          where user_id = v_user_id
            and missed_day = v_gap_day
            and (used_free_miss = true or reversed = true)
        )
      )
      into v_has_kept_day;

      exit when not coalesce(v_has_kept_day, false);

      v_current_streak := v_current_streak + 1;
      v_gap_day := v_gap_day - 1;
    end loop;
  end if;

  update public.user_streaks
  set current_streak = v_current_streak,
      longest_streak = greatest(longest_streak, v_current_streak),
      last_qualified_day = case when v_today_has_activity then v_day else last_qualified_day end
  where user_id = v_user_id
  returning * into v_streak_row;

  return v_streak_row;
end;
$$;

commit;
