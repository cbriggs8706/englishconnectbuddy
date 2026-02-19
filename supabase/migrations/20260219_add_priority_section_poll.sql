begin;

create table if not exists public.priority_section_polls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  section_key text not null,
  rank_order integer not null check (rank_order >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, section_key)
);

create index if not exists priority_section_polls_user_id_idx on public.priority_section_polls (user_id);
create index if not exists priority_section_polls_rank_order_idx on public.priority_section_polls (rank_order);

alter table public.priority_section_polls enable row level security;

drop policy if exists "priority poll own read" on public.priority_section_polls;
create policy "priority poll own read"
on public.priority_section_polls for select
using (auth.uid() = user_id);

drop policy if exists "priority poll own insert" on public.priority_section_polls;
create policy "priority poll own insert"
on public.priority_section_polls for insert
with check (auth.uid() = user_id);

drop policy if exists "priority poll own update" on public.priority_section_polls;
create policy "priority poll own update"
on public.priority_section_polls for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "priority poll admin read" on public.priority_section_polls;
create policy "priority poll admin read"
on public.priority_section_polls for select
using (public.is_admin(auth.uid()));

commit;
