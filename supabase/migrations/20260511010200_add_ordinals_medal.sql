alter table public.profiles
  add column if not exists ordinals_perfect_streak integer not null default 0;

alter table public.profiles
  add column if not exists has_ordinals_medal boolean not null default false;

alter table public.profiles
  add column if not exists ordinals_medal_awarded_at timestamptz;

create or replace function public.record_ordinals_round(
  p_was_perfect boolean
)
returns public.profiles
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_next_streak integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  insert into public.profiles (id, selected_course)
  values (v_user_id, 'EC1')
  on conflict (id) do nothing;

  select *
  into v_profile
  from public.profiles
  where id = v_user_id
  for update;

  if p_was_perfect then
    v_next_streak := coalesce(v_profile.ordinals_perfect_streak, 0) + 1;
  else
    v_next_streak := 0;
  end if;

  update public.profiles
  set ordinals_perfect_streak = v_next_streak,
      has_ordinals_medal = has_ordinals_medal or v_next_streak >= 5,
      ordinals_medal_awarded_at = case
        when ordinals_medal_awarded_at is not null then ordinals_medal_awarded_at
        when has_ordinals_medal or v_next_streak < 5 then ordinals_medal_awarded_at
        else now()
      end
  where id = v_user_id
  returning * into v_profile;

  return v_profile;
end;
$$;

grant execute on function public.record_ordinals_round(boolean) to authenticated;
