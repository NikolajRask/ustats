-- Instance-level roles: admin / co_admin / guest
-- Guests get site access via site_members (viewer); staff bypass membership for reads.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'guest'
    check (role in ('admin', 'co_admin', 'guest')),
  created_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);

alter table public.profiles enable row level security;

-- Expand site_members roles for guest viewers
alter table public.site_members
  drop constraint if exists site_members_role_check;

alter table public.site_members
  add constraint site_members_role_check
  check (role in ('owner', 'admin', 'viewer'));

-- Role helpers
create or replace function private.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid();
$$;

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'co_admin')
  );
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

-- Staff see all sites; guests need membership
create or replace function private.is_site_member(p_site_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    private.is_staff()
    or exists (
      select 1
      from public.site_members sm
      where sm.site_id = p_site_id
        and sm.user_id = auth.uid()
    );
$$;

revoke all on function private.current_role() from public;
revoke all on function private.is_staff() from public;
revoke all on function private.is_admin() from public;
revoke all on function private.is_site_member(uuid) from public;

grant execute on function private.current_role() to authenticated;
grant execute on function private.is_staff() to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.is_site_member(uuid) to authenticated;

-- Auto-create profile: first user → admin, everyone else → guest
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  if not exists (select 1 from public.profiles limit 1) then
    v_role := 'admin';
  else
    v_role := 'guest';
  end if;

  insert into public.profiles (id, role)
  values (new.id, v_role)
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function private.handle_new_user();

-- Backfill existing auth users (oldest → admin, rest → guest)
insert into public.profiles (id, role, created_at)
select
  u.id,
  case
    when u.id = (
      select id from auth.users order by created_at asc, id asc limit 1
    ) then 'admin'
    else 'guest'
  end,
  u.created_at
from auth.users u
on conflict (id) do nothing;

-- Profiles RLS
create policy "Users can select own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or private.is_staff());

-- No client insert/update/delete on profiles (service role / triggers only)
grant select on public.profiles to authenticated;

-- Sites RLS: staff manage; guests read assigned only
drop policy if exists "Members can select sites" on public.sites;
create policy "Members can select sites"
  on public.sites for select
  to authenticated
  using (
    private.is_staff()
    or created_by = auth.uid()
    or private.is_site_member(id)
  );

drop policy if exists "Authenticated users can insert sites" on public.sites;
create policy "Staff can insert sites"
  on public.sites for insert
  to authenticated
  with check (
    private.is_staff()
    and created_by = auth.uid()
  );

drop policy if exists "Members can update sites" on public.sites;
create policy "Staff can update sites"
  on public.sites for update
  to authenticated
  using (private.is_staff())
  with check (private.is_staff());

drop policy if exists "Owners can delete sites" on public.sites;
create policy "Staff can delete sites"
  on public.sites for delete
  to authenticated
  using (private.is_staff());

-- site_members: staff can manage guest memberships; owners keep create-self path
drop policy if exists "Owners can insert site_members" on public.site_members;
create policy "Staff or owners can insert site_members"
  on public.site_members for insert
  to authenticated
  with check (
    private.is_staff()
    or (
      user_id = auth.uid()
      and exists (
        select 1
        from public.sites s
        where s.id = site_id
          and s.created_by = auth.uid()
      )
    )
    or exists (
      select 1
      from public.site_members sm
      where sm.site_id = site_members.site_id
        and sm.user_id = auth.uid()
        and sm.role = 'owner'
    )
  );

drop policy if exists "Owners can delete site_members" on public.site_members;
create policy "Staff or owners can delete site_members"
  on public.site_members for delete
  to authenticated
  using (
    private.is_staff()
    or exists (
      select 1
      from public.site_members sm
      where sm.site_id = site_members.site_id
        and sm.user_id = auth.uid()
        and sm.role = 'owner'
    )
  );

drop policy if exists "Members can select site_members" on public.site_members;
create policy "Members can select site_members"
  on public.site_members for select
  to authenticated
  using (
    private.is_staff()
    or user_id = auth.uid()
    or private.is_site_member(site_id)
  );
