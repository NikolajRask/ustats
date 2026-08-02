-- Per-series config including custom event filters (IS / IS NOT + AND / OR)

alter table public.site_graphs
  add column if not exists series jsonb not null default '[]'::jsonb;

update public.site_graphs
set series = coalesce(
  (
    select jsonb_agg(
      jsonb_build_object(
        'metric', m,
        'event_filter', null
      )
    )
    from unnest(metrics) as m
  ),
  jsonb_build_array(
    jsonb_build_object(
      'metric', metric,
      'event_filter', null
    )
  )
)
where series = '[]'::jsonb;
