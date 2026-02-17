-- EnglishConnect lessons reseed (EC1 + EC2)
-- Replaces all Level 1 and Level 2 lessons with exact EC numbering and localized titles.

begin;

delete from public.lessons
where level in (1, 2);

with seed(level, seq, title_en, title_es, title_pt) as (
  values
    (1, 1, 'Intro', 'Introducción', 'Introdução'),
    (1, 2, 'Greetings & Introductions', 'Saludos e Introducciones', 'Saudações e Apresentações'),
    (1, 3, 'Personal Introduction', 'Presentación Personal', 'Apresentação Pessoal'),
    (1, 4, 'Hobbies & Interests', 'Pasatiempos e Intereses', 'Hobbies e Interesses'),
    (1, 5, 'Hobbies & Interests', 'Pasatiempos e Intereses', 'Hobbies e Interesses'),
    (1, 6, 'Family', 'Familia', 'Família'),
    (1, 7, 'Family', 'Familia', 'Família'),
    (1, 8, 'Everyday Common Items', 'Artículos Comunes de Uso Diario', 'Itens Comuns do Dia a Dia'),
    (1, 9, 'Clothing & Colors', 'Ropa y Colores', 'Roupas e Cores'),
    (1, 10, 'Daily Routines', 'Rutinas Diarias', 'Rotinas Diárias'),
    (1, 11, 'Current Activities', 'Actividades Actuales', 'Atividades Atuais'),
    (1, 12, 'Time & Calendar', 'Hora y Calendario', 'Hora e Calendário'),
    (1, 13, 'Weather', 'Clima', 'Clima'),
    (1, 14, 'Jobs & Careers', 'Empleos y Carreras', 'Empregos e Carreiras'),
    (1, 15, 'Jobs & Careers', 'Empleos y Carreras', 'Empregos e Carreiras'),
    (1, 16, 'Food', 'Comida', 'Comida'),
    (1, 17, 'Food', 'Comida', 'Comida'),
    (1, 18, 'Food', 'Comida', 'Comida'),
    (1, 19, 'Money', 'Dinero', 'Dinheiro'),
    (1, 20, 'Home', 'Hogar', 'Lar'),
    (1, 21, 'Home', 'Hogar', 'Lar'),
    (1, 22, 'Community', 'Comunidad', 'Comunidade'),
    (1, 23, 'Health', 'Salud', 'Saúde'),
    (1, 24, 'Health', 'Salud', 'Saúde'),
    (1, 25, 'Review', 'Repaso', 'Revisão'),
    (2, 1, 'Intro', 'Introducción', 'Introdução'),
    (2, 2, 'Introductions', 'Presentaciones', 'Apresentações'),
    (2, 3, 'Interests', 'Intereses', 'Interesses'),
    (2, 4, 'Family & Friends', 'Familia y Amigos', 'Família e Amigos'),
    (2, 5, 'Family & Friends', 'Familia y Amigos', 'Família e Amigos'),
    (2, 6, 'Feelings & Emotions', 'Sentimientos y Emociones', 'Sentimentos e Emoções'),
    (2, 7, 'Needs', 'Necesidades', 'Necessidades'),
    (2, 8, 'At Home', 'En Casa', 'Em Casa'),
    (2, 9, 'At Home', 'En Casa', 'Em Casa'),
    (2, 10, 'Daily Routines', 'Rutinas Diarias', 'Rotinas Diárias'),
    (2, 11, 'Daily & Weekly Routines', 'Rutinas Diarias y Semanales', 'Rotinas Diárias e Semanais'),
    (2, 12, 'Past Experiences', 'Experiencias Pasadas', 'Experiências Passadas'),
    (2, 13, 'Past Experiences', 'Experiencias Pasadas', 'Experiências Passadas'),
    (2, 14, 'Shopping for Food', 'Compras de Comida', 'Compras de Alimentos'),
    (2, 15, 'Comparison Shopping', 'Comparar Precios', 'Comparação de Preços'),
    (2, 16, 'In the Community', 'En la Comunidad', 'Na Comunidade'),
    (2, 17, 'In the Community', 'En la Comunidad', 'Na Comunidade'),
    (2, 18, 'Holidays', 'Días Festivos', 'Feriados'),
    (2, 19, 'Going on Vacation', 'Ir de Vacaciones', 'Viajar de Férias'),
    (2, 20, 'Health & Sickness', 'Salud y Enfermedad', 'Saúde e Doença'),
    (2, 21, 'Health & Sickness', 'Salud y Enfermedad', 'Saúde e Doença'),
    (2, 22, 'Special Occassions', 'Ocasiones Especiales', 'Ocasiões Especiais'),
    (2, 23, 'Special Occassions', 'Ocasiones Especiales', 'Ocasiões Especiais'),
    (2, 24, 'Goals & Dreams', 'Metas y Sueños', 'Metas e Sonhos'),
    (2, 25, 'Review', 'Repaso', 'Revisão')
), mapped as (
  select
    level,
    seq,
    title_en,
    title_es,
    title_pt,
    case
      when seq between 1 and 5 then 1
      when seq between 6 and 9 then 2
      when seq between 10 and 13 then 3
      when seq between 14 and 17 then 4
      when seq between 18 and 21 then 5
      else 6
    end as unit,
    case
      when seq between 1 and 5 then seq
      when seq between 6 and 9 then seq - 5
      when seq between 10 and 13 then seq - 9
      when seq between 14 and 17 then seq - 13
      when seq between 18 and 21 then seq - 17
      else seq - 21
    end as lesson_number
  from seed
)
insert into public.lessons (
  level,
  unit,
  lesson_number,
  sequence_number,
  sort_order,
  title_en,
  title_es,
  title_pt,
  description_en,
  description_es,
  description_pt
)
select
  level,
  unit,
  lesson_number,
  seq,
  level * 100 + seq,
  title_en,
  title_es,
  title_pt,
  null,
  null,
  null
from mapped
order by level, seq;

commit;
