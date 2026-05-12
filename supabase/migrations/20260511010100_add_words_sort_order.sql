begin;

alter table if exists public.words
add column if not exists sort_order integer;

with ranked_words as (
  select
    id,
    row_number() over (
      partition by course, lesson
      order by created_at asc, id asc
    ) as next_sort_order
  from public.words
)
update public.words
set sort_order = ranked_words.next_sort_order
from ranked_words
where public.words.id = ranked_words.id
  and public.words.sort_order is null;

create index if not exists words_course_lesson_sort_order_idx
on public.words (course, lesson, sort_order);

commit;
