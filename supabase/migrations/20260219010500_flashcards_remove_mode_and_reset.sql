begin;

truncate table public.user_flashcard_progress;

alter table if exists public.user_flashcard_progress
  drop constraint if exists user_flashcard_progress_mode_check;

alter table if exists public.user_flashcard_progress
  drop constraint if exists user_flashcard_progress_user_id_vocab_id_mode_key;

alter table if exists public.user_flashcard_progress
  drop column if exists mode;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_flashcard_progress_user_id_vocab_id_key'
      and conrelid = 'public.user_flashcard_progress'::regclass
  ) then
    alter table public.user_flashcard_progress
      add constraint user_flashcard_progress_user_id_vocab_id_key unique (user_id, vocab_id);
  end if;
end
$$;

commit;
