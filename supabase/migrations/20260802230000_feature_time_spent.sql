-- Add estimated time-on-feature (dwell between pageviews) to get_site_feature_stats

create or replace function public.get_site_feature_stats(
  p_site_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not private.is_site_member(p_site_id)
     and not exists (
       select 1
       from public.sites s
       where s.id = p_site_id
         and s.created_by = auth.uid()
     ) then
    raise exception 'Not authorized';
  end if;

  with
  feature_paths as (
    select
      f.id as feature_id,
      f.name as feature_name,
      f.created_at as feature_created_at,
      private.normalize_path(fp.path) as path,
      fp.match_type
    from public.site_features f
    join public.site_feature_paths fp on fp.feature_id = f.id
    where f.site_id = p_site_id
  ),
  pageviews as (
    select
      e.id,
      e.visitor_hash,
      e.session_hash,
      e.created_at,
      private.normalize_path(e.path) as path,
      ((e.created_at at time zone 'utc')::date) as day
    from public.events e
    where e.site_id = p_site_id
      and e.created_at >= p_from
      and e.created_at <= p_to
      and e.name = 'pageview'
  ),
  matched as (
    select
      p.id,
      p.visitor_hash,
      p.session_hash,
      p.created_at,
      p.path,
      p.day,
      (
        select fp.feature_id
        from feature_paths fp
        where
          case fp.match_type
            when 'exact' then p.path = fp.path
            when 'prefix' then p.path = fp.path or p.path like fp.path || '/%'
            when 'ends_with' then p.path = fp.path or p.path like '%' || fp.path
            when 'contains' then position(fp.path in p.path) > 0
            else false
          end
        order by
          case fp.match_type
            when 'exact' then 0
            when 'ends_with' then 1
            when 'prefix' then 2
            else 3
          end,
          length(fp.path) desc,
          fp.feature_created_at asc
        limit 1
      ) as feature_id
    from pageviews p
  ),
  with_next as (
    select
      m.*,
      lead(m.created_at) over (
        partition by m.session_hash
        order by m.created_at, m.id
      ) as next_at
    from matched m
  ),
  dwell as (
    select
      day,
      feature_id,
      visitor_hash,
      case
        when next_at is null then 0
        else least(
          extract(epoch from (next_at - created_at))::int,
          1800
        )
      end as seconds
    from with_next
  ),
  feature_time as (
    select
      f.id as feature_id,
      f.name as feature_name,
      coalesce(sum(d.seconds), 0)::int as seconds
    from public.site_features f
    left join dwell d on d.feature_id = f.id
    where f.site_id = p_site_id
    group by f.id, f.name
  ),
  feature_counts as (
    select
      f.id as feature_id,
      f.name as feature_name,
      coalesce(count(m.visitor_hash), 0)::int as count,
      coalesce(count(distinct m.visitor_hash), 0)::int as visitors
    from public.site_features f
    left join matched m on m.feature_id = f.id
    where f.site_id = p_site_id
    group by f.id, f.name, f.created_at
  ),
  feature_summary as (
    select
      c.feature_id,
      c.feature_name,
      c.count,
      c.visitors,
      coalesce(t.seconds, 0)::int as seconds
    from feature_counts c
    left join feature_time t on t.feature_id = c.feature_id
  ),
  unmatched as (
    select
      count(*)::int as count,
      count(distinct visitor_hash)::int as visitors
    from matched
    where feature_id is null
  ),
  unmatched_time as (
    select coalesce(sum(seconds), 0)::int as seconds
    from dwell
    where feature_id is null
  ),
  overview as (
    select
      (select count(*)::int from pageviews) as pageviews,
      (select count(distinct visitor_hash)::int from pageviews) as visitors,
      (select count(*)::int from matched where feature_id is not null) as matched_pageviews,
      (select count(distinct visitor_hash)::int from matched where feature_id is not null) as matched_visitors,
      (select count from unmatched) as unmatched_pageviews,
      (select visitors from unmatched) as unmatched_visitors,
      (select count(*)::int from public.site_features where site_id = p_site_id) as feature_count,
      (select coalesce(sum(seconds), 0)::int from feature_time) as matched_seconds,
      (select seconds from unmatched_time) as unmatched_seconds
  ),
  days as (
    select generate_series(
      (p_from at time zone 'utc')::date,
      (p_to at time zone 'utc')::date,
      interval '1 day'
    )::date as day
  ),
  timeseries as (
    select
      day::text as day,
      coalesce(f.name, 'Other') as feature_name,
      count(*)::int as count,
      count(distinct m.visitor_hash)::int as visitors
    from matched m
    left join public.site_features f on f.id = m.feature_id
    group by day, coalesce(f.name, 'Other')
  ),
  time_timeseries as (
    select
      d.day::text as day,
      f.id as feature_id,
      f.name as feature_name,
      coalesce(sum(dw.seconds), 0)::int as seconds
    from days d
    cross join public.site_features f
    left join dwell dw
      on dw.day = d.day
      and dw.feature_id = f.id
    where f.site_id = p_site_id
    group by d.day, f.id, f.name
  )
  select jsonb_build_object(
    'pageviews', (select pageviews from overview),
    'visitors', (select visitors from overview),
    'matchedPageviews', (select matched_pageviews from overview),
    'matchedVisitors', (select matched_visitors from overview),
    'unmatchedPageviews', (select unmatched_pageviews from overview),
    'unmatchedVisitors', (select unmatched_visitors from overview),
    'matchedSeconds', (select matched_seconds from overview),
    'unmatchedSeconds', (select unmatched_seconds from overview),
    'featureCount', (select feature_count from overview),
    'features', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', feature_id,
            'key', feature_name,
            'count', count,
            'visitors', visitors,
            'seconds', seconds
          )
          order by count desc, feature_name asc
        )
        from feature_summary
      ),
      '[]'::jsonb
    ),
    'breakdown', coalesce(
      (
        select jsonb_agg(row_obj order by (row_obj->>'count')::int desc, row_obj->>'key')
        from (
          select jsonb_build_object(
            'key', feature_name,
            'count', count,
            'visitors', visitors
          ) as row_obj
          from feature_summary
          where count > 0
          union all
          select jsonb_build_object(
            'key', 'Other',
            'count', count,
            'visitors', visitors
          )
          from unmatched
          where count > 0
        ) rows
      ),
      '[]'::jsonb
    ),
    'timeseries', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'day', day,
            'feature', feature_name,
            'count', count,
            'visitors', visitors
          )
          order by day asc, count desc
        )
        from timeseries
      ),
      '[]'::jsonb
    ),
    'timeTimeseries', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'day', day,
            'featureId', feature_id,
            'feature', feature_name,
            'seconds', seconds
          )
          order by day asc, feature_name asc
        )
        from time_timeseries
      ),
      '[]'::jsonb
    ),
    'days', coalesce(
      (
        select jsonb_agg(day::text order by day asc)
        from days
      ),
      '[]'::jsonb
    )
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function public.get_site_feature_stats(uuid, timestamptz, timestamptz) to authenticated, service_role;
revoke execute on function public.get_site_feature_stats(uuid, timestamptz, timestamptz) from anon, public;
