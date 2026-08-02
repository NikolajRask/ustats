-- Compact error tracking (Sentry-like issue groups + occurrences)

create table public.error_groups (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  fingerprint text not null,
  type text not null default 'Error',
  message text not null,
  culprit text,
  level text not null default 'error'
    check (level in ('error', 'warning', 'info')),
  status text not null default 'unresolved'
    check (status in ('unresolved', 'resolved', 'ignored')),
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  event_count bigint not null default 1
    check (event_count >= 0),
  constraint error_groups_fingerprint_not_blank check (char_length(trim(fingerprint)) > 0),
  constraint error_groups_message_not_blank check (char_length(trim(message)) > 0),
  constraint error_groups_site_fingerprint_unique unique (site_id, fingerprint)
);

create table public.error_events (
  id bigint generated always as identity primary key,
  site_id uuid not null references public.sites (id) on delete cascade,
  group_id uuid not null references public.error_groups (id) on delete cascade,
  type text not null default 'Error',
  message text not null,
  level text not null default 'error'
    check (level in ('error', 'warning', 'info')),
  stack text,
  url text,
  path text,
  country text,
  device text,
  browser text,
  os text,
  visitor_hash text,
  release text,
  environment text,
  extra jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index error_groups_site_last_seen_idx
  on public.error_groups (site_id, last_seen desc);

create index error_groups_site_status_last_seen_idx
  on public.error_groups (site_id, status, last_seen desc);

create index error_events_site_created_idx
  on public.error_events (site_id, created_at desc);

create index error_events_group_created_idx
  on public.error_events (group_id, created_at desc);

-- Atomic group upsert used by the ingest API (service role)
create or replace function public.record_error_group(
  p_site_id uuid,
  p_fingerprint text,
  p_type text,
  p_message text,
  p_culprit text,
  p_level text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.error_groups (
    site_id,
    fingerprint,
    type,
    message,
    culprit,
    level,
    status,
    first_seen,
    last_seen,
    event_count
  )
  values (
    p_site_id,
    p_fingerprint,
    coalesce(nullif(trim(p_type), ''), 'Error'),
    p_message,
    nullif(trim(coalesce(p_culprit, '')), ''),
    coalesce(nullif(trim(p_level), ''), 'error'),
    'unresolved',
    now(),
    now(),
    1
  )
  on conflict (site_id, fingerprint) do update set
    last_seen = now(),
    event_count = public.error_groups.event_count + 1,
    message = excluded.message,
    culprit = coalesce(excluded.culprit, public.error_groups.culprit),
    type = excluded.type,
    level = excluded.level,
    status = case
      when public.error_groups.status = 'ignored' then 'ignored'
      else 'unresolved'
    end
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.record_error_group(
  uuid, text, text, text, text, text
) from public;
revoke execute on function public.record_error_group(
  uuid, text, text, text, text, text
) from anon, authenticated;
grant execute on function public.record_error_group(
  uuid, text, text, text, text, text
) to service_role;

alter table public.error_groups enable row level security;
alter table public.error_events enable row level security;

create policy "Members can select error_groups"
  on public.error_groups for select
  to authenticated
  using (private.is_site_member(site_id));

create policy "Members can update error_groups"
  on public.error_groups for update
  to authenticated
  using (private.is_site_member(site_id))
  with check (private.is_site_member(site_id));

create policy "Members can select error_events"
  on public.error_events for select
  to authenticated
  using (private.is_site_member(site_id));

grant select, update on public.error_groups to authenticated;
grant select on public.error_events to authenticated;
grant select, insert, update, delete on public.error_groups to service_role;
grant select, insert, update, delete on public.error_events to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
