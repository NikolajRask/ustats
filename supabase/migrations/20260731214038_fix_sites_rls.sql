-- Fix site creation RLS: INSERT ... RETURNING needs SELECT on the new row,
-- and the owner membership trigger must bypass RLS reliably.

create or replace function private.handle_new_site()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.site_members (site_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict do nothing;
  return new;
end;
$$;

revoke all on function private.handle_new_site() from public;

-- Creators can always read their own sites (covers RETURNING before/without membership)
drop policy if exists "Members can select sites" on public.sites;
create policy "Members can select sites"
  on public.sites for select
  to authenticated
  using (
    created_by = auth.uid()
    or private.is_site_member(id)
  );

-- Allow the first owner row: site creator adding themselves
drop policy if exists "Owners can insert site_members" on public.site_members;
create policy "Owners can insert site_members"
  on public.site_members for insert
  to authenticated
  with check (
    (
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

-- Creators can read their membership rows
drop policy if exists "Members can select site_members" on public.site_members;
create policy "Members can select site_members"
  on public.site_members for select
  to authenticated
  using (
    user_id = auth.uid()
    or private.is_site_member(site_id)
  );
