-- Per-site analytics retention. null = keep forever (default).
-- Nightly pg_cron job deletes expired events / error events in batches.

alter table public.sites
  add column if not exists data_retention_days integer;

do $$
begin
  alter table public.sites
    drop constraint if exists sites_data_retention_days_check;

  alter table public.sites
    add constraint sites_data_retention_days_check
    check (
      data_retention_days is null
      or (data_retention_days >= 1 and data_retention_days <= 730)
    );
end $$;

comment on column public.sites.data_retention_days is
  'Delete analytics older than this many days. null keeps data forever.';

create or replace function private.purge_expired_analytics(
  p_site_id uuid default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch_size constant int := 5000;
  v_deleted bigint := 0;
  v_n bigint;
begin
  -- Pageviews / custom events
  loop
    with doomed as (
      select e.id
      from public.events e
      inner join public.sites s on s.id = e.site_id
      where s.data_retention_days is not null
        and (p_site_id is null or e.site_id = p_site_id)
        and e.created_at < (now() - make_interval(days => s.data_retention_days))
      order by e.id
      limit v_batch_size
    )
    delete from public.events e
    using doomed
    where e.id = doomed.id;

    get diagnostics v_n = row_count;
    v_deleted := v_deleted + v_n;
    exit when v_n = 0;
  end loop;

  -- Error occurrences
  loop
    with doomed as (
      select ee.id
      from public.error_events ee
      inner join public.sites s on s.id = ee.site_id
      where s.data_retention_days is not null
        and (p_site_id is null or ee.site_id = p_site_id)
        and ee.created_at < (now() - make_interval(days => s.data_retention_days))
      order by ee.id
      limit v_batch_size
    )
    delete from public.error_events ee
    using doomed
    where ee.id = doomed.id;

    get diagnostics v_n = row_count;
    v_deleted := v_deleted + v_n;
    exit when v_n = 0;
  end loop;

  -- Drop issue groups with no remaining occurrences (retention sites only)
  delete from public.error_groups eg
  using public.sites s
  where eg.site_id = s.id
    and s.data_retention_days is not null
    and (p_site_id is null or eg.site_id = p_site_id)
    and not exists (
      select 1
      from public.error_events ee
      where ee.group_id = eg.id
    );

  -- Refresh counts for groups that still have events after a partial purge
  update public.error_groups eg
  set
    event_count = sub.cnt,
    first_seen = sub.first_seen,
    last_seen = sub.last_seen
  from (
    select
      ee.group_id,
      count(*)::bigint as cnt,
      min(ee.created_at) as first_seen,
      max(ee.created_at) as last_seen
    from public.error_events ee
    inner join public.sites s on s.id = ee.site_id
    where s.data_retention_days is not null
      and (p_site_id is null or ee.site_id = p_site_id)
    group by ee.group_id
  ) sub
  where eg.id = sub.group_id
    and (
      eg.event_count is distinct from sub.cnt
      or eg.first_seen is distinct from sub.first_seen
      or eg.last_seen is distinct from sub.last_seen
    );

  return v_deleted;
end;
$$;

revoke all on function private.purge_expired_analytics(uuid) from public;
grant execute on function private.purge_expired_analytics(uuid) to postgres, service_role;

-- Members can trigger an immediate purge after changing retention
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

  if not exists (
    select 1
    from public.site_members sm
    where sm.site_id = p_site_id
      and sm.user_id = auth.uid()
  ) and not exists (
    select 1
    from public.sites s
    where s.id = p_site_id
      and s.created_by = auth.uid()
  ) then
    raise exception 'Not authorized';
  end if;

  return private.purge_expired_analytics(p_site_id);
end;
$$;

revoke all on function public.purge_site_expired_analytics(uuid) from public;
grant execute on function public.purge_site_expired_analytics(uuid) to authenticated, service_role;

create extension if not exists pg_cron;

-- Nightly purge at 03:20 UTC (idempotent job name)
do $$
begin
  perform cron.unschedule('ustats-purge-expired-analytics');
exception
  when others then
    null;
end $$;

select cron.schedule(
  'ustats-purge-expired-analytics',
  '20 3 * * *',
  $$select private.purge_expired_analytics();$$
);
