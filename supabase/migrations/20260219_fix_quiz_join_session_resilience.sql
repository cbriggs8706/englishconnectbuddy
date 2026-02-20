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
