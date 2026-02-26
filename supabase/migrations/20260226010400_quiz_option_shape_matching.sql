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
  v_prompt_is_phrase boolean := false;
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
    select id, image_url, item_type, english_text, spanish_text, portuguese_text
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
    v_prompt_is_phrase := (
      coalesce(lower(trim(v_prompt.item_type)), '') = 'phrase'
      or trim(coalesce(v_prompt.english_text, '')) ~ '\s'
    );

    for v_distractor in
      select
        id,
        lower(trim(coalesce(english_text, ''))) as en_key,
        lower(trim(coalesce(spanish_text, ''))) as es_key,
        lower(trim(coalesce(portuguese_text, ''))) as pt_key
      from public.vocabulary
      where lesson_id = any(v_lesson_ids)
        and id <> v_prompt.id
        and (
          coalesce(lower(trim(item_type)), '') = 'phrase'
          or trim(coalesce(english_text, '')) ~ '\s'
        ) = v_prompt_is_phrase
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
          and (
            coalesce(lower(trim(item_type)), '') = 'phrase'
            or trim(coalesce(english_text, '')) ~ '\s'
          ) = v_prompt_is_phrase
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
