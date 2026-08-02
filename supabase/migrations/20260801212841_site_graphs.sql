-- Custom graphs per site (user-defined charts)

create table public.site_graphs (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  name text not null,
  chart_type text not null check (chart_type in ('timeseries', 'bar', 'donut')),
  metric text not null check (
    metric in (
      'pageviews',
      'visitors',
      'events',
      'bounceRate',
      'avgSessionTime'
    )
  ),
  dimension text check (
    dimension is null
    or dimension in (
      'pages',
      'referrers',
      'countries',
      'devices',
      'browsers',
      'sources',
      'mediums',
      'campaigns',
      'events'
    )
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_graphs_name_not_blank check (char_length(trim(name)) > 0),
  constraint site_graphs_timeseries_dimension check (
    (chart_type = 'timeseries' and dimension is null)
    or (chart_type in ('bar', 'donut') and dimension is not null)
  )
);

create index site_graphs_site_id_idx on public.site_graphs (site_id);

alter table public.site_graphs enable row level security;

create policy "Members can select site_graphs"
  on public.site_graphs for select
  to authenticated
  using (private.is_site_member(site_id));

create policy "Members can insert site_graphs"
  on public.site_graphs for insert
  to authenticated
  with check (private.is_site_member(site_id));

create policy "Members can update site_graphs"
  on public.site_graphs for update
  to authenticated
  using (private.is_site_member(site_id))
  with check (private.is_site_member(site_id));

create policy "Members can delete site_graphs"
  on public.site_graphs for delete
  to authenticated
  using (private.is_site_member(site_id));

grant select, insert, update, delete on public.site_graphs to authenticated;
