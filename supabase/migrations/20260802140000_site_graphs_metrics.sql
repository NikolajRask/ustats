-- Multi-metric series for line / area / bar graphs (up to 4)

alter table public.site_graphs
  add column if not exists metrics text[] not null default '{}';

update public.site_graphs
set metrics = array[metric]
where cardinality(metrics) = 0;

alter table public.site_graphs
  drop constraint if exists site_graphs_metrics_len;

alter table public.site_graphs
  add constraint site_graphs_metrics_len
  check (cardinality(metrics) between 1 and 4);

alter table public.site_graphs
  drop constraint if exists site_graphs_metrics_valid;

alter table public.site_graphs
  add constraint site_graphs_metrics_valid
  check (
    metrics <@ array[
      'pageviews',
      'visitors',
      'events',
      'bounceRate',
      'avgSessionTime'
    ]::text[]
  );

alter table public.site_graphs
  drop constraint if exists site_graphs_timeseries_dimension;

alter table public.site_graphs
  add constraint site_graphs_timeseries_dimension check (
    (
      chart_type in ('timeseries', 'line', 'bar')
      and dimension is null
    )
    or (
      -- Legacy bar graphs that used a dimension
      chart_type = 'bar'
      and dimension is not null
    )
    or (
      chart_type in ('column', 'donut', 'pie', 'treemap')
      and dimension is not null
    )
  );
