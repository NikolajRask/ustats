-- Add treemap chart type to site_graphs

alter table public.site_graphs
  drop constraint if exists site_graphs_chart_type_check;

alter table public.site_graphs
  add constraint site_graphs_chart_type_check
  check (
    chart_type in (
      'timeseries',
      'line',
      'bar',
      'column',
      'donut',
      'pie',
      'treemap'
    )
  );

alter table public.site_graphs
  drop constraint if exists site_graphs_timeseries_dimension;

alter table public.site_graphs
  add constraint site_graphs_timeseries_dimension check (
    (
      chart_type in ('timeseries', 'line')
      and dimension is null
    )
    or (
      chart_type in ('bar', 'column', 'donut', 'pie', 'treemap')
      and dimension is not null
    )
  );
