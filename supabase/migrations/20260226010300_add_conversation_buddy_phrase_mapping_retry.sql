begin;

alter table public.phrases
  add column if not exists pattern_slot smallint,
  add column if not exists kind text,
  add column if not exists template_en text,
  add column if not exists template_es text,
  add column if not exists template_pt text,
  add column if not exists swap_groups jsonb not null default '[]'::jsonb;

alter table public.phrases
  drop constraint if exists phrases_pattern_slot_ck;
alter table public.phrases
  add constraint phrases_pattern_slot_ck
  check (pattern_slot is null or pattern_slot in (1, 2));

alter table public.phrases
  drop constraint if exists phrases_kind_ck;
alter table public.phrases
  add constraint phrases_kind_ck
  check (kind is null or kind in ('question', 'answer'));

alter table public.phrases
  drop constraint if exists phrases_swap_groups_is_array_ck;
alter table public.phrases
  add constraint phrases_swap_groups_is_array_ck
  check (jsonb_typeof(swap_groups) = 'array');

update public.phrases
set
  template_en = coalesce(template_en, eng),
  template_es = coalesce(template_es, spa),
  template_pt = coalesce(template_pt, por)
where template_en is null
   or template_es is null
   or template_pt is null;

create unique index if not exists phrases_course_lesson_pattern_kind_unique_idx
on public.phrases (course, lesson, pattern_slot, kind);

create index if not exists phrases_conversation_lookup_idx
on public.phrases (course, lesson, pattern_slot, kind, updated_at desc);

commit;
