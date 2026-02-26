create or replace function public.prevent_profile_admin_flag_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_admin is distinct from old.is_admin
     and not public.is_admin(auth.uid()) then
    raise exception 'Only admins can change admin access';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_profile_admin_flag_change on public.profiles;
create trigger prevent_profile_admin_flag_change
before update on public.profiles
for each row execute function public.prevent_profile_admin_flag_change();
