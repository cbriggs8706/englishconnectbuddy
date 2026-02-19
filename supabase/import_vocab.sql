-- Import vocab from spreadsheet format:
-- id, course, lesson, type, eng, spa, por, spaTransliteration, porTransliteration, ipa, partOfSpeech, definition, image, engAudio
--
-- Steps:
-- 1) Create a CSV from your spreadsheet with these exact headers.
-- 2) In Supabase Table Editor, create/load into: public.vocab_import_staging
--    or use SQL below and paste rows as VALUES.
-- 3) Set target_course below (for example EC1 or EC2).
-- 4) Run the INSERT..SELECT block.

begin;

create table if not exists public.vocab_import_staging (
  id integer,
  course text,
  lesson integer,
  type text,
  eng text,
  spa text,
  por text,
  "spaTransliteration" text,
  "porTransliteration" text,
  ipa text,
  "partOfSpeech" text,
  definition text,
  image text,
  "engAudio" text
);
alter table public.vocab_import_staging add column if not exists course text;

-- Optional: clear staging before loading fresh sheet
-- truncate table public.vocab_import_staging;

-- Optional paste example rows directly (remove when using CSV upload):
-- insert into public.vocab_import_staging
-- (id, course, lesson, type, eng, spa, por, "spaTransliteration", "porTransliteration", ipa, "partOfSpeech", definition, image, "engAudio")
-- values
-- (1, 'EC1', 1, 'word', 'I', 'yo', 'eu', 'ái', 'ái', '[aɪ]', 'pronoun', 'the speaker', '/english/i.webp', '/english/i.mp3');

-- Choose default course used when the CSV row has an empty course value.
with config as (
  select 'EC1'::text as target_course
)
insert into public.vocabulary (
  lesson_id,
  source_row_id,
  item_type,
  english_text,
  english_sentence,
  spanish_text,
  portuguese_text,
  spanish_transliteration,
  portuguese_transliteration,
  ipa,
  part_of_speech,
  definition,
  image_url,
  audio_url,
  difficulty_level
)
select
  l.id as lesson_id,
  s.id as source_row_id,
  coalesce(nullif(trim(s.type), ''), 'word') as item_type,
  trim(s.eng) as english_text,
  null::text as english_sentence,
  trim(s.spa) as spanish_text,
  trim(s.por) as portuguese_text,
  nullif(trim(s."spaTransliteration"), '') as spanish_transliteration,
  nullif(trim(s."porTransliteration"), '') as portuguese_transliteration,
  nullif(trim(s.ipa), '') as ipa,
  nullif(trim(s."partOfSpeech"), '') as part_of_speech,
  nullif(trim(s.definition), '') as definition,
  nullif(trim(s.image), '') as image_url,
  nullif(trim(s."engAudio"), '') as audio_url,
  1 as difficulty_level
from public.vocab_import_staging s
join config c on true
join public.lessons l
  on l.course = coalesce(nullif(trim(s.course), ''), c.target_course)
 and l.sequence_number = s.lesson
where nullif(trim(s.eng), '') is not null
  and nullif(trim(s.spa), '') is not null
  and nullif(trim(s.por), '') is not null;

commit;

-- Validation query:
-- select l.course, l.sequence_number, count(v.*)
-- from public.vocabulary v
-- join public.lessons l on l.id = v.lesson_id
-- group by l.course, l.sequence_number
-- order by l.course, l.sequence_number;
