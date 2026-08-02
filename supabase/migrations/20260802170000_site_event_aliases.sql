-- Human-readable aliases for custom event names per site

create table public.site_event_aliases (
  site_id uuid not null references public.sites (id) on delete cascade,
  event_name text not null,
  title text not null default '',
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (site_id, event_name),
  constraint site_event_aliases_event_name_not_blank check (char_length(trim(event_name)) > 0),
  constraint site_event_aliases_event_name_len check (char_length(event_name) <= 64),
  constraint site_event_aliases_title_len check (char_length(title) <= 120),
  constraint site_event_aliases_description_len check (char_length(description) <= 500)
);

create index site_event_aliases_site_id_idx on public.site_event_aliases (site_id);

alter table public.site_event_aliases enable row level security;

create policy "Members can select site_event_aliases"
  on public.site_event_aliases for select
  to authenticated
  using (private.is_site_member(site_id));

create policy "Members can insert site_event_aliases"
  on public.site_event_aliases for insert
  to authenticated
  with check (private.is_site_member(site_id));

create policy "Members can update site_event_aliases"
  on public.site_event_aliases for update
  to authenticated
  using (private.is_site_member(site_id))
  with check (private.is_site_member(site_id));

create policy "Members can delete site_event_aliases"
  on public.site_event_aliases for delete
  to authenticated
  using (private.is_site_member(site_id));

grant select, insert, update, delete on public.site_event_aliases to authenticated;
