


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






CREATE SCHEMA IF NOT EXISTS "private";


ALTER SCHEMA "private" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "private"."can_manage_site"("p_site_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select
    private.is_staff()
    or exists (
      select 1
      from public.site_members sm
      where sm.site_id = p_site_id
        and sm.user_id = auth.uid()
        and sm.role in ('owner', 'admin')
    );
$$;


ALTER FUNCTION "private"."can_manage_site"("p_site_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."current_role"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select p.role
  from public.profiles p
  where p.id = auth.uid();
$$;


ALTER FUNCTION "private"."current_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."handle_new_site"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.site_members (site_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict do nothing;
  return new;
end;
$$;


ALTER FUNCTION "private"."handle_new_site"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_role text;
begin
  if not exists (select 1 from public.profiles limit 1) then
    v_role := 'admin';
  else
    v_role := 'guest';
  end if;

  insert into public.profiles (id, role)
  values (new.id, v_role)
  on conflict (id) do nothing;

  return new;
end;
$$;


ALTER FUNCTION "private"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;


ALTER FUNCTION "private"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."is_site_member"("p_site_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select
    private.is_staff()
    or exists (
      select 1
      from public.site_members sm
      where sm.site_id = p_site_id
        and sm.user_id = auth.uid()
    );
$$;


ALTER FUNCTION "private"."is_site_member"("p_site_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."is_staff"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'co_admin')
  );
$$;


ALTER FUNCTION "private"."is_staff"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."normalize_path"("p" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE
    SET "search_path" TO ''
    AS $$
  select case
    when p is null or btrim(p) = '' then '/'
    else (
      select case
        when length(v) > 1 and right(v, 1) = '/' then left(v, length(v) - 1)
        else v
      end
      from (
        select case
          when left(btrim(p), 1) = '/' then btrim(p)
          else '/' || btrim(p)
        end as v
      ) prepared
    )
  end;
$$;


ALTER FUNCTION "private"."normalize_path"("p" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."purge_expired_analytics"("p_site_id" "uuid" DEFAULT NULL::"uuid") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_batch_size constant int := 5000;
  v_deleted bigint := 0;
  v_n bigint;
begin
  -- Pageviews / custom events
  loop
    with doomed as (
      select e.id
      from public.events e
      inner join public.sites s on s.id = e.site_id
      where s.data_retention_days is not null
        and (p_site_id is null or e.site_id = p_site_id)
        and e.created_at < (now() - make_interval(days => s.data_retention_days))
      order by e.id
      limit v_batch_size
    )
    delete from public.events e
    using doomed
    where e.id = doomed.id;

    get diagnostics v_n = row_count;
    v_deleted := v_deleted + v_n;
    exit when v_n = 0;
  end loop;

  -- Error occurrences
  loop
    with doomed as (
      select ee.id
      from public.error_events ee
      inner join public.sites s on s.id = ee.site_id
      where s.data_retention_days is not null
        and (p_site_id is null or ee.site_id = p_site_id)
        and ee.created_at < (now() - make_interval(days => s.data_retention_days))
      order by ee.id
      limit v_batch_size
    )
    delete from public.error_events ee
    using doomed
    where ee.id = doomed.id;

    get diagnostics v_n = row_count;
    v_deleted := v_deleted + v_n;
    exit when v_n = 0;
  end loop;

  -- Drop issue groups with no remaining occurrences (retention sites only)
  delete from public.error_groups eg
  using public.sites s
  where eg.site_id = s.id
    and s.data_retention_days is not null
    and (p_site_id is null or eg.site_id = p_site_id)
    and not exists (
      select 1
      from public.error_events ee
      where ee.group_id = eg.id
    );

  -- Refresh counts for groups that still have events after a partial purge
  update public.error_groups eg
  set
    event_count = sub.cnt,
    first_seen = sub.first_seen,
    last_seen = sub.last_seen
  from (
    select
      ee.group_id,
      count(*)::bigint as cnt,
      min(ee.created_at) as first_seen,
      max(ee.created_at) as last_seen
    from public.error_events ee
    inner join public.sites s on s.id = ee.site_id
    where s.data_retention_days is not null
      and (p_site_id is null or ee.site_id = p_site_id)
    group by ee.group_id
  ) sub
  where eg.id = sub.group_id
    and (
      eg.event_count is distinct from sub.cnt
      or eg.first_seen is distinct from sub.first_seen
      or eg.last_seen is distinct from sub.last_seen
    );

  return v_deleted;
end;
$$;


ALTER FUNCTION "private"."purge_expired_analytics"("p_site_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_database_usage"() RETURNS bigint
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if auth.uid() is null or not private.is_staff() then
    raise exception 'Not authorized';
  end if;

  return pg_database_size(current_database());
end;
$$;


ALTER FUNCTION "public"."get_database_usage"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_site_feature_stats"("p_site_id" "uuid", "p_from" timestamp with time zone, "p_to" timestamp with time zone) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."get_site_feature_stats"("p_site_id" "uuid", "p_from" timestamp with time zone, "p_to" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_site_stats"("p_site_id" "uuid", "p_from" timestamp with time zone, "p_to" timestamp with time zone) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."get_site_stats"("p_site_id" "uuid", "p_from" timestamp with time zone, "p_to" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."purge_site_expired_analytics"("p_site_id" "uuid") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not private.can_manage_site(p_site_id) then
    raise exception 'Not authorized';
  end if;

  return private.purge_expired_analytics(p_site_id);
end;
$$;


ALTER FUNCTION "public"."purge_site_expired_analytics"("p_site_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_error_group"("p_site_id" "uuid", "p_fingerprint" "text", "p_type" "text", "p_message" "text", "p_culprit" "text", "p_level" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."record_error_group"("p_site_id" "uuid", "p_fingerprint" "text", "p_type" "text", "p_message" "text", "p_culprit" "text", "p_level" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."error_events" (
    "id" bigint NOT NULL,
    "site_id" "uuid" NOT NULL,
    "group_id" "uuid" NOT NULL,
    "type" "text" DEFAULT 'Error'::"text" NOT NULL,
    "message" "text" NOT NULL,
    "level" "text" DEFAULT 'error'::"text" NOT NULL,
    "stack" "text",
    "url" "text",
    "path" "text",
    "country" "text",
    "device" "text",
    "browser" "text",
    "os" "text",
    "visitor_hash" "text",
    "release" "text",
    "environment" "text",
    "extra" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "region" "text",
    "city" "text",
    CONSTRAINT "error_events_level_check" CHECK (("level" = ANY (ARRAY['error'::"text", 'warning'::"text", 'info'::"text"])))
);


ALTER TABLE "public"."error_events" OWNER TO "postgres";


ALTER TABLE "public"."error_events" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."error_events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."error_groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "site_id" "uuid" NOT NULL,
    "fingerprint" "text" NOT NULL,
    "type" "text" DEFAULT 'Error'::"text" NOT NULL,
    "message" "text" NOT NULL,
    "culprit" "text",
    "level" "text" DEFAULT 'error'::"text" NOT NULL,
    "status" "text" DEFAULT 'unresolved'::"text" NOT NULL,
    "first_seen" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_seen" timestamp with time zone DEFAULT "now"() NOT NULL,
    "event_count" bigint DEFAULT 1 NOT NULL,
    CONSTRAINT "error_groups_event_count_check" CHECK (("event_count" >= 0)),
    CONSTRAINT "error_groups_fingerprint_not_blank" CHECK (("char_length"(TRIM(BOTH FROM "fingerprint")) > 0)),
    CONSTRAINT "error_groups_level_check" CHECK (("level" = ANY (ARRAY['error'::"text", 'warning'::"text", 'info'::"text"]))),
    CONSTRAINT "error_groups_message_not_blank" CHECK (("char_length"(TRIM(BOTH FROM "message")) > 0)),
    CONSTRAINT "error_groups_status_check" CHECK (("status" = ANY (ARRAY['unresolved'::"text", 'resolved'::"text", 'ignored'::"text"])))
);


ALTER TABLE "public"."error_groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" bigint NOT NULL,
    "site_id" "uuid" NOT NULL,
    "name" "text" DEFAULT 'pageview'::"text" NOT NULL,
    "path" "text",
    "url" "text",
    "referrer" "text",
    "referrer_host" "text",
    "utm_source" "text",
    "utm_medium" "text",
    "utm_campaign" "text",
    "utm_term" "text",
    "utm_content" "text",
    "country" "text",
    "device" "text",
    "browser" "text",
    "os" "text",
    "visitor_hash" "text" NOT NULL,
    "session_hash" "text" NOT NULL,
    "props" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "region" "text",
    "city" "text"
);


ALTER TABLE "public"."events" OWNER TO "postgres";


ALTER TABLE "public"."events" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."funnel_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "funnel_id" "uuid" NOT NULL,
    "position" integer NOT NULL,
    "name" "text" NOT NULL,
    "step_type" "text" NOT NULL,
    "match_value" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "funnel_steps_match_not_blank" CHECK (("char_length"(TRIM(BOTH FROM "match_value")) > 0)),
    CONSTRAINT "funnel_steps_name_not_blank" CHECK (("char_length"(TRIM(BOTH FROM "name")) > 0)),
    CONSTRAINT "funnel_steps_position_positive" CHECK (("position" >= 0)),
    CONSTRAINT "funnel_steps_step_type_check" CHECK (("step_type" = ANY (ARRAY['path'::"text", 'event'::"text"])))
);


ALTER TABLE "public"."funnel_steps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."funnels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "site_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "funnels_name_not_blank" CHECK (("char_length"(TRIM(BOTH FROM "name")) > 0))
);


ALTER TABLE "public"."funnels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."instance_settings" (
    "id" boolean DEFAULT true NOT NULL,
    "supabase_plan" "text" DEFAULT 'free'::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid",
    CONSTRAINT "instance_settings_id_check" CHECK ("id"),
    CONSTRAINT "instance_settings_supabase_plan_check" CHECK (("supabase_plan" = ANY (ARRAY['free'::"text", 'pro'::"text"])))
);


ALTER TABLE "public"."instance_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'guest'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'co_admin'::"text", 'guest'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_event_aliases" (
    "site_id" "uuid" NOT NULL,
    "event_name" "text" NOT NULL,
    "title" "text" DEFAULT ''::"text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "site_event_aliases_description_len" CHECK (("char_length"("description") <= 500)),
    CONSTRAINT "site_event_aliases_event_name_len" CHECK (("char_length"("event_name") <= 64)),
    CONSTRAINT "site_event_aliases_event_name_not_blank" CHECK (("char_length"(TRIM(BOTH FROM "event_name")) > 0)),
    CONSTRAINT "site_event_aliases_title_len" CHECK (("char_length"("title") <= 120))
);


ALTER TABLE "public"."site_event_aliases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_feature_paths" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "feature_id" "uuid" NOT NULL,
    "path" "text" NOT NULL,
    "match_type" "text" NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "site_feature_paths_match_type_check" CHECK (("match_type" = ANY (ARRAY['exact'::"text", 'prefix'::"text", 'contains'::"text", 'ends_with'::"text"]))),
    CONSTRAINT "site_feature_paths_path_not_blank" CHECK (("char_length"(TRIM(BOTH FROM "path")) > 0)),
    CONSTRAINT "site_feature_paths_position_nonneg" CHECK (("position" >= 0))
);


ALTER TABLE "public"."site_feature_paths" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_features" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "site_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "site_features_name_not_blank" CHECK (("char_length"(TRIM(BOTH FROM "name")) > 0))
);


ALTER TABLE "public"."site_features" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_graphs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "site_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "chart_type" "text" NOT NULL,
    "metric" "text" NOT NULL,
    "dimension" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metrics" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "series" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    CONSTRAINT "site_graphs_chart_type_check" CHECK (("chart_type" = ANY (ARRAY['timeseries'::"text", 'line'::"text", 'bar'::"text", 'column'::"text", 'donut'::"text", 'pie'::"text", 'treemap'::"text"]))),
    CONSTRAINT "site_graphs_dimension_check" CHECK ((("dimension" IS NULL) OR ("dimension" = ANY (ARRAY['pages'::"text", 'referrers'::"text", 'countries'::"text", 'devices'::"text", 'browsers'::"text", 'sources'::"text", 'mediums'::"text", 'campaigns'::"text", 'events'::"text"])))),
    CONSTRAINT "site_graphs_metric_check" CHECK (("metric" = ANY (ARRAY['pageviews'::"text", 'visitors'::"text", 'events'::"text", 'bounceRate'::"text", 'avgSessionTime'::"text"]))),
    CONSTRAINT "site_graphs_metrics_len" CHECK ((("cardinality"("metrics") >= 1) AND ("cardinality"("metrics") <= 4))),
    CONSTRAINT "site_graphs_metrics_valid" CHECK (("metrics" <@ ARRAY['pageviews'::"text", 'visitors'::"text", 'events'::"text", 'bounceRate'::"text", 'avgSessionTime'::"text"])),
    CONSTRAINT "site_graphs_name_not_blank" CHECK (("char_length"(TRIM(BOTH FROM "name")) > 0)),
    CONSTRAINT "site_graphs_timeseries_dimension" CHECK (((("chart_type" = ANY (ARRAY['timeseries'::"text", 'line'::"text", 'bar'::"text"])) AND ("dimension" IS NULL)) OR (("chart_type" = 'bar'::"text") AND ("dimension" IS NOT NULL)) OR (("chart_type" = ANY (ARRAY['column'::"text", 'donut'::"text", 'pie'::"text", 'treemap'::"text"])) AND ("dimension" IS NOT NULL))))
);


ALTER TABLE "public"."site_graphs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_members" (
    "site_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'owner'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "site_members_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'viewer'::"text"])))
);


ALTER TABLE "public"."site_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "site_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "range_days" integer NOT NULL,
    "range_from" timestamp with time zone NOT NULL,
    "range_to" timestamp with time zone NOT NULL,
    "file_name" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "site_reports_file_name_not_blank" CHECK (("char_length"(TRIM(BOTH FROM "file_name")) > 0)),
    CONSTRAINT "site_reports_range_days_check" CHECK (("range_days" = ANY (ARRAY[7, 30, 90]))),
    CONSTRAINT "site_reports_storage_path_not_blank" CHECK (("char_length"(TRIM(BOTH FROM "storage_path")) > 0))
);


ALTER TABLE "public"."site_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "domain" "text" NOT NULL,
    "public_key" "text" DEFAULT "encode"("extensions"."gen_random_bytes"(16), 'hex'::"text") NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "cross_day_tracking" boolean DEFAULT false NOT NULL,
    "data_retention_days" integer,
    CONSTRAINT "sites_data_retention_days_check" CHECK ((("data_retention_days" IS NULL) OR (("data_retention_days" >= 1) AND ("data_retention_days" <= 730))))
);


ALTER TABLE "public"."sites" OWNER TO "postgres";


COMMENT ON COLUMN "public"."sites"."data_retention_days" IS 'Delete analytics older than this many days. null keeps data forever.';



ALTER TABLE ONLY "public"."error_events"
    ADD CONSTRAINT "error_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."error_groups"
    ADD CONSTRAINT "error_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."error_groups"
    ADD CONSTRAINT "error_groups_site_fingerprint_unique" UNIQUE ("site_id", "fingerprint");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."funnel_steps"
    ADD CONSTRAINT "funnel_steps_funnel_position_unique" UNIQUE ("funnel_id", "position");



ALTER TABLE ONLY "public"."funnel_steps"
    ADD CONSTRAINT "funnel_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."funnels"
    ADD CONSTRAINT "funnels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."instance_settings"
    ADD CONSTRAINT "instance_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."site_event_aliases"
    ADD CONSTRAINT "site_event_aliases_pkey" PRIMARY KEY ("site_id", "event_name");



ALTER TABLE ONLY "public"."site_feature_paths"
    ADD CONSTRAINT "site_feature_paths_feature_position_unique" UNIQUE ("feature_id", "position");



ALTER TABLE ONLY "public"."site_feature_paths"
    ADD CONSTRAINT "site_feature_paths_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."site_features"
    ADD CONSTRAINT "site_features_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."site_graphs"
    ADD CONSTRAINT "site_graphs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."site_members"
    ADD CONSTRAINT "site_members_pkey" PRIMARY KEY ("site_id", "user_id");



ALTER TABLE ONLY "public"."site_reports"
    ADD CONSTRAINT "site_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sites"
    ADD CONSTRAINT "sites_domain_unique" UNIQUE ("domain");



ALTER TABLE ONLY "public"."sites"
    ADD CONSTRAINT "sites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sites"
    ADD CONSTRAINT "sites_public_key_key" UNIQUE ("public_key");



CREATE INDEX "error_events_group_created_idx" ON "public"."error_events" USING "btree" ("group_id", "created_at" DESC);



CREATE INDEX "error_events_site_created_idx" ON "public"."error_events" USING "btree" ("site_id", "created_at" DESC);



CREATE INDEX "error_groups_site_last_seen_idx" ON "public"."error_groups" USING "btree" ("site_id", "last_seen" DESC);



CREATE INDEX "error_groups_site_status_last_seen_idx" ON "public"."error_groups" USING "btree" ("site_id", "status", "last_seen" DESC);



CREATE INDEX "events_site_city_idx" ON "public"."events" USING "btree" ("site_id", "city");



CREATE INDEX "events_site_country_idx" ON "public"."events" USING "btree" ("site_id", "country");



CREATE INDEX "events_site_created_at_idx" ON "public"."events" USING "btree" ("site_id", "created_at" DESC);



CREATE INDEX "events_site_name_created_at_idx" ON "public"."events" USING "btree" ("site_id", "name", "created_at" DESC);



CREATE INDEX "events_site_path_idx" ON "public"."events" USING "btree" ("site_id", "path");



CREATE INDEX "events_site_referrer_host_idx" ON "public"."events" USING "btree" ("site_id", "referrer_host");



CREATE INDEX "events_site_region_idx" ON "public"."events" USING "btree" ("site_id", "region");



CREATE INDEX "events_site_visitor_created_at_idx" ON "public"."events" USING "btree" ("site_id", "visitor_hash", "created_at" DESC);



CREATE INDEX "funnel_steps_funnel_id_idx" ON "public"."funnel_steps" USING "btree" ("funnel_id");



CREATE INDEX "funnels_site_id_idx" ON "public"."funnels" USING "btree" ("site_id");



CREATE INDEX "profiles_role_idx" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "site_event_aliases_site_id_idx" ON "public"."site_event_aliases" USING "btree" ("site_id");



CREATE INDEX "site_feature_paths_feature_id_idx" ON "public"."site_feature_paths" USING "btree" ("feature_id");



CREATE INDEX "site_features_site_id_idx" ON "public"."site_features" USING "btree" ("site_id");



CREATE INDEX "site_graphs_site_id_idx" ON "public"."site_graphs" USING "btree" ("site_id");



CREATE INDEX "site_reports_site_created_at_idx" ON "public"."site_reports" USING "btree" ("site_id", "created_at" DESC);



CREATE OR REPLACE TRIGGER "on_site_created" AFTER INSERT ON "public"."sites" FOR EACH ROW EXECUTE FUNCTION "private"."handle_new_site"();



ALTER TABLE ONLY "public"."error_events"
    ADD CONSTRAINT "error_events_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."error_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."error_events"
    ADD CONSTRAINT "error_events_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."error_groups"
    ADD CONSTRAINT "error_groups_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funnel_steps"
    ADD CONSTRAINT "funnel_steps_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "public"."funnels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funnels"
    ADD CONSTRAINT "funnels_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."instance_settings"
    ADD CONSTRAINT "instance_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."site_event_aliases"
    ADD CONSTRAINT "site_event_aliases_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."site_feature_paths"
    ADD CONSTRAINT "site_feature_paths_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "public"."site_features"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."site_features"
    ADD CONSTRAINT "site_features_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."site_graphs"
    ADD CONSTRAINT "site_graphs_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."site_members"
    ADD CONSTRAINT "site_members_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."site_members"
    ADD CONSTRAINT "site_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."site_reports"
    ADD CONSTRAINT "site_reports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."site_reports"
    ADD CONSTRAINT "site_reports_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sites"
    ADD CONSTRAINT "sites_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Managers can delete funnel_steps" ON "public"."funnel_steps" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."funnels" "f"
  WHERE (("f"."id" = "funnel_steps"."funnel_id") AND "private"."can_manage_site"("f"."site_id")))));



CREATE POLICY "Managers can delete funnels" ON "public"."funnels" FOR DELETE TO "authenticated" USING ("private"."can_manage_site"("site_id"));



CREATE POLICY "Managers can delete site_event_aliases" ON "public"."site_event_aliases" FOR DELETE TO "authenticated" USING ("private"."can_manage_site"("site_id"));



CREATE POLICY "Managers can delete site_feature_paths" ON "public"."site_feature_paths" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."site_features" "f"
  WHERE (("f"."id" = "site_feature_paths"."feature_id") AND "private"."can_manage_site"("f"."site_id")))));



CREATE POLICY "Managers can delete site_features" ON "public"."site_features" FOR DELETE TO "authenticated" USING ("private"."can_manage_site"("site_id"));



CREATE POLICY "Managers can delete site_graphs" ON "public"."site_graphs" FOR DELETE TO "authenticated" USING ("private"."can_manage_site"("site_id"));



CREATE POLICY "Managers can delete site_reports" ON "public"."site_reports" FOR DELETE TO "authenticated" USING ("private"."can_manage_site"("site_id"));



CREATE POLICY "Managers can insert funnel_steps" ON "public"."funnel_steps" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."funnels" "f"
  WHERE (("f"."id" = "funnel_steps"."funnel_id") AND "private"."can_manage_site"("f"."site_id")))));



CREATE POLICY "Managers can insert funnels" ON "public"."funnels" FOR INSERT TO "authenticated" WITH CHECK ("private"."can_manage_site"("site_id"));



CREATE POLICY "Managers can insert site_event_aliases" ON "public"."site_event_aliases" FOR INSERT TO "authenticated" WITH CHECK ("private"."can_manage_site"("site_id"));



CREATE POLICY "Managers can insert site_feature_paths" ON "public"."site_feature_paths" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."site_features" "f"
  WHERE (("f"."id" = "site_feature_paths"."feature_id") AND "private"."can_manage_site"("f"."site_id")))));



CREATE POLICY "Managers can insert site_features" ON "public"."site_features" FOR INSERT TO "authenticated" WITH CHECK ("private"."can_manage_site"("site_id"));



CREATE POLICY "Managers can insert site_graphs" ON "public"."site_graphs" FOR INSERT TO "authenticated" WITH CHECK ("private"."can_manage_site"("site_id"));



CREATE POLICY "Managers can insert site_reports" ON "public"."site_reports" FOR INSERT TO "authenticated" WITH CHECK (("private"."can_manage_site"("site_id") AND ("created_by" = "auth"."uid"())));



CREATE POLICY "Managers can update error_groups" ON "public"."error_groups" FOR UPDATE TO "authenticated" USING ("private"."can_manage_site"("site_id")) WITH CHECK ("private"."can_manage_site"("site_id"));



CREATE POLICY "Managers can update funnel_steps" ON "public"."funnel_steps" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."funnels" "f"
  WHERE (("f"."id" = "funnel_steps"."funnel_id") AND "private"."can_manage_site"("f"."site_id"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."funnels" "f"
  WHERE (("f"."id" = "funnel_steps"."funnel_id") AND "private"."can_manage_site"("f"."site_id")))));



CREATE POLICY "Managers can update funnels" ON "public"."funnels" FOR UPDATE TO "authenticated" USING ("private"."can_manage_site"("site_id")) WITH CHECK ("private"."can_manage_site"("site_id"));



CREATE POLICY "Managers can update site_event_aliases" ON "public"."site_event_aliases" FOR UPDATE TO "authenticated" USING ("private"."can_manage_site"("site_id")) WITH CHECK ("private"."can_manage_site"("site_id"));



CREATE POLICY "Managers can update site_feature_paths" ON "public"."site_feature_paths" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."site_features" "f"
  WHERE (("f"."id" = "site_feature_paths"."feature_id") AND "private"."can_manage_site"("f"."site_id"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."site_features" "f"
  WHERE (("f"."id" = "site_feature_paths"."feature_id") AND "private"."can_manage_site"("f"."site_id")))));



CREATE POLICY "Managers can update site_features" ON "public"."site_features" FOR UPDATE TO "authenticated" USING ("private"."can_manage_site"("site_id")) WITH CHECK ("private"."can_manage_site"("site_id"));



CREATE POLICY "Managers can update site_graphs" ON "public"."site_graphs" FOR UPDATE TO "authenticated" USING ("private"."can_manage_site"("site_id")) WITH CHECK ("private"."can_manage_site"("site_id"));



CREATE POLICY "Members can select error_events" ON "public"."error_events" FOR SELECT TO "authenticated" USING ("private"."is_site_member"("site_id"));



CREATE POLICY "Members can select error_groups" ON "public"."error_groups" FOR SELECT TO "authenticated" USING ("private"."is_site_member"("site_id"));



CREATE POLICY "Members can select events" ON "public"."events" FOR SELECT TO "authenticated" USING ("private"."is_site_member"("site_id"));



CREATE POLICY "Members can select funnel_steps" ON "public"."funnel_steps" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."funnels" "f"
  WHERE (("f"."id" = "funnel_steps"."funnel_id") AND "private"."is_site_member"("f"."site_id")))));



CREATE POLICY "Members can select funnels" ON "public"."funnels" FOR SELECT TO "authenticated" USING ("private"."is_site_member"("site_id"));



CREATE POLICY "Members can select site_event_aliases" ON "public"."site_event_aliases" FOR SELECT TO "authenticated" USING ("private"."is_site_member"("site_id"));



CREATE POLICY "Members can select site_feature_paths" ON "public"."site_feature_paths" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."site_features" "f"
  WHERE (("f"."id" = "site_feature_paths"."feature_id") AND "private"."is_site_member"("f"."site_id")))));



CREATE POLICY "Members can select site_features" ON "public"."site_features" FOR SELECT TO "authenticated" USING ("private"."is_site_member"("site_id"));



CREATE POLICY "Members can select site_graphs" ON "public"."site_graphs" FOR SELECT TO "authenticated" USING ("private"."is_site_member"("site_id"));



CREATE POLICY "Members can select site_members" ON "public"."site_members" FOR SELECT TO "authenticated" USING (("private"."is_staff"() OR ("user_id" = "auth"."uid"()) OR "private"."is_site_member"("site_id")));



CREATE POLICY "Members can select site_reports" ON "public"."site_reports" FOR SELECT TO "authenticated" USING ("private"."is_site_member"("site_id"));



CREATE POLICY "Members can select sites" ON "public"."sites" FOR SELECT TO "authenticated" USING (("private"."is_staff"() OR ("created_by" = "auth"."uid"()) OR "private"."is_site_member"("id")));



CREATE POLICY "Staff can delete sites" ON "public"."sites" FOR DELETE TO "authenticated" USING ("private"."is_staff"());



CREATE POLICY "Staff can insert sites" ON "public"."sites" FOR INSERT TO "authenticated" WITH CHECK (("private"."is_staff"() AND ("created_by" = "auth"."uid"())));



CREATE POLICY "Staff can select instance_settings" ON "public"."instance_settings" FOR SELECT TO "authenticated" USING ("private"."is_staff"());



CREATE POLICY "Staff can update instance_settings" ON "public"."instance_settings" FOR UPDATE TO "authenticated" USING ("private"."is_staff"()) WITH CHECK ("private"."is_staff"());



CREATE POLICY "Staff can update sites" ON "public"."sites" FOR UPDATE TO "authenticated" USING ("private"."is_staff"()) WITH CHECK ("private"."is_staff"());



CREATE POLICY "Staff or owners can delete site_members" ON "public"."site_members" FOR DELETE TO "authenticated" USING (("private"."is_staff"() OR (EXISTS ( SELECT 1
   FROM "public"."site_members" "sm"
  WHERE (("sm"."site_id" = "site_members"."site_id") AND ("sm"."user_id" = "auth"."uid"()) AND ("sm"."role" = 'owner'::"text"))))));



CREATE POLICY "Staff or owners can insert site_members" ON "public"."site_members" FOR INSERT TO "authenticated" WITH CHECK (("private"."is_staff"() OR (("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."sites" "s"
  WHERE (("s"."id" = "site_members"."site_id") AND ("s"."created_by" = "auth"."uid"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."site_members" "sm"
  WHERE (("sm"."site_id" = "site_members"."site_id") AND ("sm"."user_id" = "auth"."uid"()) AND ("sm"."role" = 'owner'::"text"))))));



CREATE POLICY "Users can select own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("id" = "auth"."uid"()) OR "private"."is_staff"()));



ALTER TABLE "public"."error_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."error_groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."funnel_steps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."funnels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."instance_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."site_event_aliases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."site_feature_paths" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."site_features" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."site_graphs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."site_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."site_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sites" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."events";









GRANT USAGE ON SCHEMA "private" TO "service_role";
GRANT USAGE ON SCHEMA "private" TO "authenticated";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

















































































































































































REVOKE ALL ON FUNCTION "private"."can_manage_site"("p_site_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."can_manage_site"("p_site_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."current_role"() FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."current_role"() TO "authenticated";



REVOKE ALL ON FUNCTION "private"."handle_new_site"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."handle_new_user"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."is_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."is_admin"() TO "authenticated";



REVOKE ALL ON FUNCTION "private"."is_site_member"("p_site_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."is_site_member"("p_site_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."is_staff"() FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."is_staff"() TO "authenticated";



REVOKE ALL ON FUNCTION "private"."normalize_path"("p" "text") FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."purge_expired_analytics"("p_site_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."purge_expired_analytics"("p_site_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_database_usage"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_database_usage"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_site_feature_stats"("p_site_id" "uuid", "p_from" timestamp with time zone, "p_to" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_site_feature_stats"("p_site_id" "uuid", "p_from" timestamp with time zone, "p_to" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_site_feature_stats"("p_site_id" "uuid", "p_from" timestamp with time zone, "p_to" timestamp with time zone) TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_site_stats"("p_site_id" "uuid", "p_from" timestamp with time zone, "p_to" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_site_stats"("p_site_id" "uuid", "p_from" timestamp with time zone, "p_to" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_site_stats"("p_site_id" "uuid", "p_from" timestamp with time zone, "p_to" timestamp with time zone) TO "service_role";



REVOKE ALL ON FUNCTION "public"."purge_site_expired_analytics"("p_site_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."purge_site_expired_analytics"("p_site_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."purge_site_expired_analytics"("p_site_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."record_error_group"("p_site_id" "uuid", "p_fingerprint" "text", "p_type" "text", "p_message" "text", "p_culprit" "text", "p_level" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."record_error_group"("p_site_id" "uuid", "p_fingerprint" "text", "p_type" "text", "p_message" "text", "p_culprit" "text", "p_level" "text") TO "service_role";
























GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."error_events" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."error_events" TO "authenticated";
GRANT ALL ON TABLE "public"."error_events" TO "service_role";



GRANT UPDATE ON SEQUENCE "public"."error_events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."error_events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."error_events_id_seq" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."error_groups" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."error_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."error_groups" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."events" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."events" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."events" TO "service_role";



GRANT UPDATE ON SEQUENCE "public"."events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."events_id_seq" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."funnel_steps" TO "anon";
GRANT ALL ON TABLE "public"."funnel_steps" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."funnel_steps" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."funnels" TO "anon";
GRANT ALL ON TABLE "public"."funnels" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."funnels" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."instance_settings" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."instance_settings" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."instance_settings" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."profiles" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."profiles" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."profiles" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."site_event_aliases" TO "anon";
GRANT ALL ON TABLE "public"."site_event_aliases" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."site_event_aliases" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."site_feature_paths" TO "anon";
GRANT ALL ON TABLE "public"."site_feature_paths" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."site_feature_paths" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."site_features" TO "anon";
GRANT ALL ON TABLE "public"."site_features" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."site_features" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."site_graphs" TO "anon";
GRANT ALL ON TABLE "public"."site_graphs" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."site_graphs" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."site_members" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."site_members" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."site_members" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."site_reports" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."site_reports" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."site_reports" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."sites" TO "anon";
GRANT ALL ON TABLE "public"."sites" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."sites" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT UPDATE ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT UPDATE ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT UPDATE ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "service_role";
































--
-- Dumped schema changes for auth and storage
--

CREATE OR REPLACE TRIGGER "on_auth_user_created" AFTER INSERT ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "private"."handle_new_user"();



CREATE POLICY "Managers can delete report objects" ON "storage"."objects" FOR DELETE TO "authenticated" USING ((("bucket_id" = 'ustats'::"text") AND (("storage"."foldername"("name"))[1] = 'reports'::"text") AND "private"."can_manage_site"((("storage"."foldername"("name"))[2])::"uuid")));



CREATE POLICY "Managers can insert report objects" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK ((("bucket_id" = 'ustats'::"text") AND (("storage"."foldername"("name"))[1] = 'reports'::"text") AND "private"."can_manage_site"((("storage"."foldername"("name"))[2])::"uuid")));



CREATE POLICY "Managers can update report objects" ON "storage"."objects" FOR UPDATE TO "authenticated" USING ((("bucket_id" = 'ustats'::"text") AND (("storage"."foldername"("name"))[1] = 'reports'::"text") AND "private"."can_manage_site"((("storage"."foldername"("name"))[2])::"uuid"))) WITH CHECK ((("bucket_id" = 'ustats'::"text") AND (("storage"."foldername"("name"))[1] = 'reports'::"text") AND "private"."can_manage_site"((("storage"."foldername"("name"))[2])::"uuid")));



CREATE POLICY "Members can select report objects" ON "storage"."objects" FOR SELECT TO "authenticated" USING ((("bucket_id" = 'ustats'::"text") AND (("storage"."foldername"("name"))[1] = 'reports'::"text") AND "private"."is_site_member"((("storage"."foldername"("name"))[2])::"uuid")));




--
-- Restored after migration squash (schema dump omits DML / cron schedules / buckets)
--

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ustats',
  'ustats',
  false,
  10485760,
  ARRAY['application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  PERFORM cron.unschedule('ustats-purge-expired-analytics');
EXCEPTION
  WHEN others THEN
    NULL;
END $$;

SELECT cron.schedule(
  'ustats-purge-expired-analytics',
  '20 3 * * *',
  $$SELECT private.purge_expired_analytics();$$
);
