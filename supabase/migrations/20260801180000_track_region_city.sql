-- Track region and city on analytics events (from edge geo headers)

alter table public.events
  add column if not exists region text,
  add column if not exists city text;

alter table public.error_events
  add column if not exists region text,
  add column if not exists city text;

create index if not exists events_site_country_idx
  on public.events (site_id, country);

create index if not exists events_site_region_idx
  on public.events (site_id, region);

create index if not exists events_site_city_idx
  on public.events (site_id, city);
