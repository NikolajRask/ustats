-- Instance settings (singleton) + staff-only database size RPC.

create table public.instance_settings (
  id boolean primary key default true check (id),
  supabase_plan text not null default 'free'
    check (supabase_plan in ('free', 'pro')),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

insert into public.instance_settings (id, supabase_plan)
values (true, 'free');

alter table public.instance_settings enable row level security;

create policy "Staff can select instance_settings"
  on public.instance_settings for select
  to authenticated
  using (private.is_staff());

create policy "Staff can update instance_settings"
  on public.instance_settings for update
  to authenticated
  using (private.is_staff())
  with check (private.is_staff());

grant select, update on public.instance_settings to authenticated;

create or replace function public.get_database_usage()
returns bigint
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not private.is_staff() then
    raise exception 'Not authorized';
  end if;

  return pg_database_size(current_database());
end;
$$;

revoke all on function public.get_database_usage() from public;
grant execute on function public.get_database_usage() to authenticated;
