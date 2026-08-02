-- Aggregate site analytics in Postgres instead of shipping raw events to the app.

create or replace function public.get_site_stats(
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
  pageviews as (
    select
      e.path,
      e.referrer_host,
      e.country,
      e.region,
      e.city,
      e.device,
      e.browser,
      e.utm_source,
      e.utm_medium,
      e.utm_campaign,
      e.visitor_hash,
      e.session_hash,
      e.created_at,
      ((e.created_at at time zone 'utc')::date) as day
    from public.events e
    where e.site_id = p_site_id
      and e.created_at >= p_from
      and e.created_at <= p_to
      and e.name = 'pageview'
  ),
  custom as (
    select
      e.name,
      e.visitor_hash,
      e.created_at,
      ((e.created_at at time zone 'utc')::date) as day
    from public.events e
    where e.site_id = p_site_id
      and e.created_at >= p_from
      and e.created_at <= p_to
      and e.name <> 'pageview'
  ),
  sessions as (
    select
      session_hash,
      count(*)::int as pageview_count,
      min(created_at) as first_at,
      max(created_at) as last_at,
      ((min(created_at) at time zone 'utc')::date) as day
    from pageviews
    group by session_hash
  ),
  overview as (
    select
      (select count(*)::int from pageviews) as pageviews,
      (select count(distinct visitor_hash)::int from pageviews) as visitors,
      (select count(*)::int from custom) as events,
      (select count(distinct visitor_hash)::int from custom) as event_visitors,
      case
        when (select count(*) from sessions) = 0 then null
        else round(
          (
            (select count(*) from sessions where pageview_count = 1)::numeric
            / (select count(*) from sessions)::numeric
          ) * 100
        )::int
      end as bounce_rate,
      case
        when (select count(*) from sessions) = 0 then null
        else round(
          (
            select avg(extract(epoch from (last_at - first_at)))
            from sessions
          )
        )::int
      end as avg_session_seconds
  ),
  day_series as (
    select generate_series(
      (p_from at time zone 'utc')::date,
      (p_to at time zone 'utc')::date,
      '1 day'::interval
    )::date as day
  ),
  day_pageviews as (
    select
      day,
      count(*)::int as pageviews,
      count(distinct visitor_hash)::int as visitors
    from pageviews
    group by day
  ),
  day_custom as (
    select
      day,
      count(*)::int as events
    from custom
    group by day
  ),
  day_sessions as (
    select
      day,
      count(*)::int as total,
      count(*) filter (where pageview_count = 1)::int as bounces,
      coalesce(sum(extract(epoch from (last_at - first_at))), 0) as duration_sum
    from sessions
    group by day
  ),
  timeseries as (
    select
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'day', to_char(ds.day, 'YYYY-MM-DD'),
            'pageviews', coalesce(dp.pageviews, 0),
            'visitors', coalesce(dp.visitors, 0),
            'events', coalesce(dc.events, 0),
            'bounceRate',
              case
                when dsess.total is null or dsess.total = 0 then null
                else round((dsess.bounces::numeric / dsess.total::numeric) * 100)::int
              end,
            'avgSessionSeconds',
              case
                when dsess.total is null or dsess.total = 0 then null
                else round(dsess.duration_sum / dsess.total)::int
              end
          )
          order by ds.day
        ),
        '[]'::jsonb
      ) as data
    from day_series ds
    left join day_pageviews dp on dp.day = ds.day
    left join day_custom dc on dc.day = ds.day
    left join day_sessions dsess on dsess.day = ds.day
  ),
  event_day as (
    select
      day,
      count(*)::int as pageviews,
      count(distinct visitor_hash)::int as visitors
    from custom
    group by day
  ),
  event_timeseries as (
    select
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'day', to_char(ds.day, 'YYYY-MM-DD'),
            'pageviews', coalesce(ed.pageviews, 0),
            'visitors', coalesce(ed.visitors, 0),
            'events', coalesce(ed.pageviews, 0),
            'bounceRate', null,
            'avgSessionSeconds', null
          )
          order by ds.day
        ),
        '[]'::jsonb
      ) as data
    from day_series ds
    left join event_day ed on ed.day = ds.day
  ),
  custom_event_counts as (
    select
      coalesce(
        jsonb_object_agg(day_key, names),
        '{}'::jsonb
      ) as data
    from (
      select
        to_char(day, 'YYYY-MM-DD') as day_key,
        jsonb_object_agg(name, cnt) as names
      from (
        select day, name, count(*)::int as cnt
        from custom
        group by day, name
      ) per_name
      group by day
    ) per_day
  ),
  custom_event_visitors as (
    select
      coalesce(
        jsonb_object_agg(day_key, names),
        '{}'::jsonb
      ) as data
    from (
      select
        to_char(day, 'YYYY-MM-DD') as day_key,
        jsonb_object_agg(name, visitors) as names
      from (
        select day, name, count(distinct visitor_hash)::int as visitors
        from custom
        group by day, name
      ) per_name
      group by day
    ) per_day
  ),
  breakdown_pages as (
    select coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'key', key,
            'count', cnt,
            'visitors', visitors
          )
          order by cnt desc, visitors desc, key
        )
        from (
          select
            coalesce(nullif(trim(path), ''), '(none)') as key,
            count(*)::int as cnt,
            count(distinct visitor_hash)::int as visitors
          from pageviews
          group by 1
          order by cnt desc, visitors desc, key
          limit 10
        ) t
      ),
      '[]'::jsonb
    ) as data
  ),
  breakdown_referrers as (
    select coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'key', key,
            'count', cnt,
            'visitors', visitors
          )
          order by cnt desc, visitors desc, key
        )
        from (
          select
            trim(referrer_host) as key,
            count(*)::int as cnt,
            count(distinct visitor_hash)::int as visitors
          from pageviews
          where referrer_host is not null
            and nullif(trim(referrer_host), '') is not null
          group by 1
          order by cnt desc, visitors desc, key
          limit 10
        ) t
      ),
      '[]'::jsonb
    ) as data
  ),
  breakdown_countries as (
    select coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'key', key,
            'count', cnt,
            'visitors', visitors
          )
          order by cnt desc, visitors desc, key
        )
        from (
          select
            coalesce(nullif(trim(country), ''), '(none)') as key,
            count(*)::int as cnt,
            count(distinct visitor_hash)::int as visitors
          from pageviews
          group by 1
          order by cnt desc, visitors desc, key
          limit 25
        ) t
      ),
      '[]'::jsonb
    ) as data
  ),
  breakdown_devices as (
    select coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'key', key,
            'count', cnt,
            'visitors', visitors
          )
          order by cnt desc, visitors desc, key
        )
        from (
          select
            coalesce(nullif(trim(device), ''), '(none)') as key,
            count(*)::int as cnt,
            count(distinct visitor_hash)::int as visitors
          from pageviews
          group by 1
          order by cnt desc, visitors desc, key
          limit 10
        ) t
      ),
      '[]'::jsonb
    ) as data
  ),
  breakdown_browsers as (
    select coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'key', key,
            'count', cnt,
            'visitors', visitors
          )
          order by cnt desc, visitors desc, key
        )
        from (
          select
            coalesce(nullif(trim(browser), ''), '(none)') as key,
            count(*)::int as cnt,
            count(distinct visitor_hash)::int as visitors
          from pageviews
          group by 1
          order by cnt desc, visitors desc, key
          limit 10
        ) t
      ),
      '[]'::jsonb
    ) as data
  ),
  breakdown_sources as (
    select coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'key', key,
            'count', cnt,
            'visitors', visitors
          )
          order by cnt desc, visitors desc, key
        )
        from (
          select
            trim(utm_source) as key,
            count(*)::int as cnt,
            count(distinct visitor_hash)::int as visitors
          from pageviews
          where utm_source is not null
            and nullif(trim(utm_source), '') is not null
          group by 1
          order by cnt desc, visitors desc, key
          limit 10
        ) t
      ),
      '[]'::jsonb
    ) as data
  ),
  breakdown_mediums as (
    select coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'key', key,
            'count', cnt,
            'visitors', visitors
          )
          order by cnt desc, visitors desc, key
        )
        from (
          select
            trim(utm_medium) as key,
            count(*)::int as cnt,
            count(distinct visitor_hash)::int as visitors
          from pageviews
          where utm_medium is not null
            and nullif(trim(utm_medium), '') is not null
          group by 1
          order by cnt desc, visitors desc, key
          limit 10
        ) t
      ),
      '[]'::jsonb
    ) as data
  ),
  breakdown_campaigns as (
    select coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'key', key,
            'count', cnt,
            'visitors', visitors
          )
          order by cnt desc, visitors desc, key
        )
        from (
          select
            trim(utm_campaign) as key,
            count(*)::int as cnt,
            count(distinct visitor_hash)::int as visitors
          from pageviews
          where utm_campaign is not null
            and nullif(trim(utm_campaign), '') is not null
          group by 1
          order by cnt desc, visitors desc, key
          limit 10
        ) t
      ),
      '[]'::jsonb
    ) as data
  ),
  breakdown_custom_events as (
    select coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'key', key,
            'count', cnt,
            'visitors', visitors
          )
          order by cnt desc, visitors desc, key
        )
        from (
          select
            coalesce(nullif(trim(name), ''), '(none)') as key,
            count(*)::int as cnt,
            count(distinct visitor_hash)::int as visitors
          from custom
          group by 1
          order by cnt desc, visitors desc, key
          limit 25
        ) t
      ),
      '[]'::jsonb
    ) as data
  ),
  regions_by_country as (
    select coalesce(
      (
        select jsonb_object_agg(country_key, rows)
        from (
          select
            country_key,
            jsonb_agg(
              jsonb_build_object(
                'key', region_key,
                'count', cnt,
                'visitors', visitors
              )
              order by cnt desc, visitors desc, region_key
            ) as rows
          from (
            select
              country_key,
              region_key,
              cnt,
              visitors,
              row_number() over (
                partition by country_key
                order by cnt desc, visitors desc, region_key
              ) as rn
            from (
              select
                upper(trim(country)) as country_key,
                trim(region) as region_key,
                count(*)::int as cnt,
                count(distinct visitor_hash)::int as visitors
              from pageviews
              where country is not null
                and nullif(trim(country), '') is not null
                and region is not null
                and nullif(trim(region), '') is not null
              group by 1, 2
            ) aggregated
          ) ranked
          where rn <= 50
          group by country_key
        ) per_country
      ),
      '{}'::jsonb
    ) as data
  ),
  cities_by_country as (
    select coalesce(
      (
        select jsonb_object_agg(country_key, rows)
        from (
          select
            country_key,
            jsonb_agg(
              jsonb_build_object(
                'key', city_key,
                'count', cnt,
                'visitors', visitors
              )
              order by cnt desc, visitors desc, city_key
            ) as rows
          from (
            select
              country_key,
              city_key,
              cnt,
              visitors,
              row_number() over (
                partition by country_key
                order by cnt desc, visitors desc, city_key
              ) as rn
            from (
              select
                upper(trim(country)) as country_key,
                trim(city) as city_key,
                count(*)::int as cnt,
                count(distinct visitor_hash)::int as visitors
              from pageviews
              where country is not null
                and nullif(trim(country), '') is not null
                and city is not null
                and nullif(trim(city), '') is not null
              group by 1, 2
            ) aggregated
          ) ranked
          where rn <= 50
          group by country_key
        ) per_country
      ),
      '{}'::jsonb
    ) as data
  )
  select jsonb_build_object(
    'pageviews', o.pageviews,
    'visitors', o.visitors,
    'events', o.events,
    'eventVisitors', o.event_visitors,
    'bounceRate', o.bounce_rate,
    'avgSessionSeconds', o.avg_session_seconds,
    'timeseries', ts.data,
    'eventTimeseries', ets.data,
    'customEventCountsByDay', cec.data,
    'customEventVisitorsByDay', cev.data,
    'topPages', bp.data,
    'topReferrers', br.data,
    'topCountries', bc.data,
    'regionsByCountry', rbc.data,
    'citiesByCountry', cbc.data,
    'topDevices', bd.data,
    'topBrowsers', bb.data,
    'topSources', bs.data,
    'topMediums', bm.data,
    'topCampaigns', bcamp.data,
    'customEvents', bce.data
  )
  into v_result
  from overview o
  cross join timeseries ts
  cross join event_timeseries ets
  cross join custom_event_counts cec
  cross join custom_event_visitors cev
  cross join breakdown_pages bp
  cross join breakdown_referrers br
  cross join breakdown_countries bc
  cross join regions_by_country rbc
  cross join cities_by_country cbc
  cross join breakdown_devices bd
  cross join breakdown_browsers bb
  cross join breakdown_sources bs
  cross join breakdown_mediums bm
  cross join breakdown_campaigns bcamp
  cross join breakdown_custom_events bce;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;

revoke all on function public.get_site_stats(uuid, timestamptz, timestamptz) from public;
grant execute on function public.get_site_stats(uuid, timestamptz, timestamptz) to authenticated, service_role;
