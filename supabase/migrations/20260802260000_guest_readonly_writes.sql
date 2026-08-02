-- Guests / site viewers are read-only. Writes require instance staff or
-- site_members.role in ('owner', 'admin').

create or replace function private.can_manage_site(p_site_id uuid)
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
        and sm.role in ('owner', 'admin')
    );
$$;

revoke all on function private.can_manage_site(uuid) from public;
grant execute on function private.can_manage_site(uuid) to authenticated;

-- funnels
drop policy if exists "Members can insert funnels" on public.funnels;
drop policy if exists "Members can update funnels" on public.funnels;
drop policy if exists "Members can delete funnels" on public.funnels;

create policy "Managers can insert funnels"
  on public.funnels for insert
  to authenticated
  with check (private.can_manage_site(site_id));

create policy "Managers can update funnels"
  on public.funnels for update
  to authenticated
  using (private.can_manage_site(site_id))
  with check (private.can_manage_site(site_id));

create policy "Managers can delete funnels"
  on public.funnels for delete
  to authenticated
  using (private.can_manage_site(site_id));

-- funnel_steps
drop policy if exists "Members can insert funnel_steps" on public.funnel_steps;
drop policy if exists "Members can update funnel_steps" on public.funnel_steps;
drop policy if exists "Members can delete funnel_steps" on public.funnel_steps;

create policy "Managers can insert funnel_steps"
  on public.funnel_steps for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.funnels f
      where f.id = funnel_id
        and private.can_manage_site(f.site_id)
    )
  );

create policy "Managers can update funnel_steps"
  on public.funnel_steps for update
  to authenticated
  using (
    exists (
      select 1
      from public.funnels f
      where f.id = funnel_id
        and private.can_manage_site(f.site_id)
    )
  )
  with check (
    exists (
      select 1
      from public.funnels f
      where f.id = funnel_id
        and private.can_manage_site(f.site_id)
    )
  );

create policy "Managers can delete funnel_steps"
  on public.funnel_steps for delete
  to authenticated
  using (
    exists (
      select 1
      from public.funnels f
      where f.id = funnel_id
        and private.can_manage_site(f.site_id)
    )
  );

-- site_features
drop policy if exists "Members can insert site_features" on public.site_features;
drop policy if exists "Members can update site_features" on public.site_features;
drop policy if exists "Members can delete site_features" on public.site_features;

create policy "Managers can insert site_features"
  on public.site_features for insert
  to authenticated
  with check (private.can_manage_site(site_id));

create policy "Managers can update site_features"
  on public.site_features for update
  to authenticated
  using (private.can_manage_site(site_id))
  with check (private.can_manage_site(site_id));

create policy "Managers can delete site_features"
  on public.site_features for delete
  to authenticated
  using (private.can_manage_site(site_id));

-- site_feature_paths
drop policy if exists "Members can insert site_feature_paths" on public.site_feature_paths;
drop policy if exists "Members can update site_feature_paths" on public.site_feature_paths;
drop policy if exists "Members can delete site_feature_paths" on public.site_feature_paths;

create policy "Managers can insert site_feature_paths"
  on public.site_feature_paths for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.site_features f
      where f.id = feature_id
        and private.can_manage_site(f.site_id)
    )
  );

create policy "Managers can update site_feature_paths"
  on public.site_feature_paths for update
  to authenticated
  using (
    exists (
      select 1
      from public.site_features f
      where f.id = feature_id
        and private.can_manage_site(f.site_id)
    )
  )
  with check (
    exists (
      select 1
      from public.site_features f
      where f.id = feature_id
        and private.can_manage_site(f.site_id)
    )
  );

create policy "Managers can delete site_feature_paths"
  on public.site_feature_paths for delete
  to authenticated
  using (
    exists (
      select 1
      from public.site_features f
      where f.id = feature_id
        and private.can_manage_site(f.site_id)
    )
  );

-- site_graphs
drop policy if exists "Members can insert site_graphs" on public.site_graphs;
drop policy if exists "Members can update site_graphs" on public.site_graphs;
drop policy if exists "Members can delete site_graphs" on public.site_graphs;

create policy "Managers can insert site_graphs"
  on public.site_graphs for insert
  to authenticated
  with check (private.can_manage_site(site_id));

create policy "Managers can update site_graphs"
  on public.site_graphs for update
  to authenticated
  using (private.can_manage_site(site_id))
  with check (private.can_manage_site(site_id));

create policy "Managers can delete site_graphs"
  on public.site_graphs for delete
  to authenticated
  using (private.can_manage_site(site_id));

-- site_event_aliases
drop policy if exists "Members can insert site_event_aliases" on public.site_event_aliases;
drop policy if exists "Members can update site_event_aliases" on public.site_event_aliases;
drop policy if exists "Members can delete site_event_aliases" on public.site_event_aliases;

create policy "Managers can insert site_event_aliases"
  on public.site_event_aliases for insert
  to authenticated
  with check (private.can_manage_site(site_id));

create policy "Managers can update site_event_aliases"
  on public.site_event_aliases for update
  to authenticated
  using (private.can_manage_site(site_id))
  with check (private.can_manage_site(site_id));

create policy "Managers can delete site_event_aliases"
  on public.site_event_aliases for delete
  to authenticated
  using (private.can_manage_site(site_id));

-- site_reports
drop policy if exists "Members can insert site_reports" on public.site_reports;
drop policy if exists "Members can delete site_reports" on public.site_reports;

create policy "Managers can insert site_reports"
  on public.site_reports for insert
  to authenticated
  with check (private.can_manage_site(site_id) and created_by = auth.uid());

create policy "Managers can delete site_reports"
  on public.site_reports for delete
  to authenticated
  using (private.can_manage_site(site_id));

-- report storage objects
drop policy if exists "Members can insert report objects" on storage.objects;
drop policy if exists "Members can update report objects" on storage.objects;
drop policy if exists "Members can delete report objects" on storage.objects;

create policy "Managers can insert report objects"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'ustats'
    and (storage.foldername(name))[1] = 'reports'
    and private.can_manage_site(((storage.foldername(name))[2])::uuid)
  );

create policy "Managers can update report objects"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'ustats'
    and (storage.foldername(name))[1] = 'reports'
    and private.can_manage_site(((storage.foldername(name))[2])::uuid)
  )
  with check (
    bucket_id = 'ustats'
    and (storage.foldername(name))[1] = 'reports'
    and private.can_manage_site(((storage.foldername(name))[2])::uuid)
  );

create policy "Managers can delete report objects"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'ustats'
    and (storage.foldername(name))[1] = 'reports'
    and private.can_manage_site(((storage.foldername(name))[2])::uuid)
  );

-- error_groups status updates
drop policy if exists "Members can update error_groups" on public.error_groups;

create policy "Managers can update error_groups"
  on public.error_groups for update
  to authenticated
  using (private.can_manage_site(site_id))
  with check (private.can_manage_site(site_id));

-- Immediate retention purge: staff or site owner/admin only
create or replace function public.purge_site_expired_analytics(p_site_id uuid)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not private.can_manage_site(p_site_id) then
    raise exception 'Not authorized';
  end if;

  return private.purge_expired_analytics(p_site_id);
end;
$$;
