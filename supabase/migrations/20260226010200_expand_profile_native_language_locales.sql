alter table public.profiles
  drop constraint if exists profiles_native_language_check;

alter table public.profiles
  add constraint profiles_native_language_check
  check (native_language in ('en', 'es', 'pt', 'sw', 'chk'));
