-- ustats schema: sites, membership, events

create extension if not exists "pgcrypto";

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to postgres, service_role, authenticated;

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text not null,
  public_key text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint sites_domain_unique unique (domain)
);

create table public.site_members (
  site_id uuid not null references public.sites (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin')),
  created_at timestamptz not null default now(),
  primary key (site_id, user_id)
);

create table public.events (
  id bigint generated always as identity primary key,
  site_id uuid not null references public.sites (id) on delete cascade,
  name text not null default 'pageview',
  path text,
  url text,
  referrer text,
  referrer_host text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  country text,
  device text,
  browser text,
  os text,
  visitor_hash text not null,
  session_hash text not null,
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index events_site_created_at_idx on public.events (site_id, created_at desc);
create index events_site_name_created_at_idx on public.events (site_id, name, created_at desc);
create index events_site_path_idx on public.events (site_id, path);
create index events_site_referrer_host_idx on public.events (site_id, referrer_host);
create index events_site_visitor_created_at_idx on public.events (site_id, visitor_hash, created_at desc);

create or replace function private.is_site_member(p_site_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.site_members sm
    where sm.site_id = p_site_id
      and sm.user_id = auth.uid()
  );
$$;

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

revoke all on function private.is_site_member(uuid) from public;
revoke all on function private.handle_new_site() from public;
grant execute on function private.is_site_member(uuid) to authenticated;

create trigger on_site_created
  after insert on public.sites
  for each row
  execute function private.handle_new_site();

alter table public.sites enable row level security;
alter table public.site_members enable row level security;
alter table public.events enable row level security;

create policy "Members can select sites"
  on public.sites for select
  to authenticated
  using (
    created_by = auth.uid()
    or private.is_site_member(id)
  );

create policy "Authenticated users can insert sites"
  on public.sites for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "Members can update sites"
  on public.sites for update
  to authenticated
  using (private.is_site_member(id) or created_by = auth.uid())
  with check (private.is_site_member(id) or created_by = auth.uid());

create policy "Owners can delete sites"
  on public.sites for delete
  to authenticated
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.site_members sm
      where sm.site_id = id
        and sm.user_id = auth.uid()
        and sm.role = 'owner'
    )
  );

create policy "Members can select site_members"
  on public.site_members for select
  to authenticated
  using (
    user_id = auth.uid()
    or private.is_site_member(site_id)
  );

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
      select 1 from public.site_members sm
      where sm.site_id = site_members.site_id
        and sm.user_id = auth.uid()
        and sm.role = 'owner'
    )
  );

create policy "Owners can delete site_members"
  on public.site_members for delete
  to authenticated
  using (
    exists (
      select 1 from public.site_members sm
      where sm.site_id = site_members.site_id
        and sm.user_id = auth.uid()
        and sm.role = 'owner'
    )
  );

create policy "Members can select events"
  on public.events for select
  to authenticated
  using (private.is_site_member(site_id));

alter publication supabase_realtime add table public.events;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.sites to authenticated;
grant select, insert, delete on public.site_members to authenticated;
grant select on public.events to authenticated;
grant usage, select on all sequences in schema public to authenticated;
