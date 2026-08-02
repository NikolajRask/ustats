import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type DateRange = {
  from: string;
  to: string;
};

export type BreakdownRow = {
  key: string;
  count: number;
  visitors: number;
};

export type OverviewMetric =
  | "visitors"
  | "pageviews"
  | "events"
  | "bounceRate"
  | "avgSessionTime";

export type TimeseriesPoint = {
  day: string;
  pageviews: number;
  visitors: number;
  events: number;
  bounceRate: number | null;
  avgSessionSeconds: number | null;
};

export type SiteStats = {
  pageviews: number;
  visitors: number;
  events: number;
  eventVisitors: number;
  bounceRate: number | null;
  avgSessionSeconds: number | null;
  timeseries: TimeseriesPoint[];
  eventTimeseries: TimeseriesPoint[];
  /** day → event name → count (custom events only) */
  customEventCountsByDay: Record<string, Record<string, number>>;
  topPages: BreakdownRow[];
  topReferrers: BreakdownRow[];
  topCountries: BreakdownRow[];
  regionsByCountry: Record<string, BreakdownRow[]>;
  citiesByCountry: Record<string, BreakdownRow[]>;
  topDevices: BreakdownRow[];
  topBrowsers: BreakdownRow[];
  topSources: BreakdownRow[];
  topMediums: BreakdownRow[];
  topCampaigns: BreakdownRow[];
  customEvents: BreakdownRow[];
};

export function formatSessionDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  const total = Math.max(0, Math.round(seconds));
  if (total < 60) return `${total}s`;
  const minutes = Math.floor(total / 60);
  const rem = total % 60;
  return rem > 0 ? `${minutes}m ${rem}s` : `${minutes}m`;
}

export type EventLogRow = {
  id: number;
  name: string;
  path: string | null;
  url: string | null;
  referrer: string | null;
  referrer_host: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  country: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  visitor_hash: string;
  session_hash: string;
  props: unknown;
  created_at: string;
};

function startOfDaysAgo(days: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - (days - 1));
  return d;
}

export function rangeFromDays(days: number): DateRange {
  return {
    from: startOfDaysAgo(days).toISOString(),
    to: new Date().toISOString(),
  };
}

function countUnique(values: (string | null | undefined)[]): number {
  return new Set(values.filter(Boolean)).size;
}

function breakdown(
  rows: { key: string | null | undefined; visitor: string }[],
  limit = 10,
): BreakdownRow[] {
  const map = new Map<string, { count: number; visitors: Set<string> }>();

  for (const row of rows) {
    const key = row.key?.trim() || "(none)";
    const entry = map.get(key) ?? { count: 0, visitors: new Set<string>() };
    entry.count += 1;
    entry.visitors.add(row.visitor);
    map.set(key, entry);
  }

  return [...map.entries()]
    .map(([key, value]) => ({
      key,
      count: value.count,
      visitors: value.visitors.size,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function breakdownByCountry(
  rows: {
    country: string | null | undefined;
    key: string | null | undefined;
    visitor: string;
  }[],
  limit = 50,
): Record<string, BreakdownRow[]> {
  const byCountry = new Map<
    string,
    { key: string | null | undefined; visitor: string }[]
  >();

  for (const row of rows) {
    const country = row.country?.trim().toUpperCase();
    if (!country) continue;
    const list = byCountry.get(country) ?? [];
    list.push({ key: row.key, visitor: row.visitor });
    byCountry.set(country, list);
  }

  const result: Record<string, BreakdownRow[]> = {};
  for (const [country, items] of byCountry) {
    result[country] = breakdown(items, limit).filter(
      (row) => row.key !== "(none)",
    );
  }
  return result;
}

export async function getSiteStats(
  supabase: SupabaseClient<Database>,
  siteId: string,
  range: DateRange,
): Promise<SiteStats> {
  const { data, error } = await supabase
    .from("events")
    .select(
      "name, path, referrer_host, country, region, city, device, browser, utm_source, utm_medium, utm_campaign, visitor_hash, session_hash, created_at",
    )
    .eq("site_id", siteId)
    .gte("created_at", range.from)
    .lte("created_at", range.to)
    .limit(50_000);

  if (error) {
    throw error;
  }

  const events = data ?? [];
  const pageviews = events.filter((e) => e.name === "pageview");
  const custom = events.filter((e) => e.name !== "pageview");

  type SessionAgg = {
    count: number;
    first: number;
    last: number;
    day: string;
  };
  const sessionsByHash = new Map<string, SessionAgg>();
  for (const event of pageviews) {
    const t = new Date(event.created_at).getTime();
    const existing = sessionsByHash.get(event.session_hash);
    if (!existing) {
      sessionsByHash.set(event.session_hash, {
        count: 1,
        first: t,
        last: t,
        day: event.created_at.slice(0, 10),
      });
      continue;
    }
    existing.count += 1;
    if (t < existing.first) {
      existing.first = t;
      existing.day = event.created_at.slice(0, 10);
    }
    if (t > existing.last) existing.last = t;
  }

  const sessions = sessionsByHash.size;
  const bounces = [...sessionsByHash.values()].filter((s) => s.count === 1).length;
  const sessionDurations = [...sessionsByHash.values()].map(
    (s) => (s.last - s.first) / 1000,
  );
  const avgSessionSeconds = sessions
    ? Math.round(
        sessionDurations.reduce((sum, d) => sum + d, 0) / sessions,
      )
    : null;

  const dayMap = new Map<
    string,
    { pageviews: number; visitors: Set<string>; events: number }
  >();
  for (const event of pageviews) {
    const day = event.created_at.slice(0, 10);
    const entry = dayMap.get(day) ?? {
      pageviews: 0,
      visitors: new Set<string>(),
      events: 0,
    };
    entry.pageviews += 1;
    entry.visitors.add(event.visitor_hash);
    dayMap.set(day, entry);
  }
  for (const event of custom) {
    const day = event.created_at.slice(0, 10);
    const entry = dayMap.get(day) ?? {
      pageviews: 0,
      visitors: new Set<string>(),
      events: 0,
    };
    entry.events += 1;
    dayMap.set(day, entry);
  }

  const daySessions = new Map<
    string,
    { total: number; bounces: number; durationSum: number }
  >();
  for (const session of sessionsByHash.values()) {
    const entry = daySessions.get(session.day) ?? {
      total: 0,
      bounces: 0,
      durationSum: 0,
    };
    entry.total += 1;
    if (session.count === 1) entry.bounces += 1;
    entry.durationSum += (session.last - session.first) / 1000;
    daySessions.set(session.day, entry);
  }

  const eventDayMap = new Map<
    string,
    { pageviews: number; visitors: Set<string> }
  >();
  const customEventCountsByDay: Record<string, Record<string, number>> = {};
  for (const event of custom) {
    const day = event.created_at.slice(0, 10);
    const entry = eventDayMap.get(day) ?? {
      pageviews: 0,
      visitors: new Set<string>(),
    };
    entry.pageviews += 1;
    entry.visitors.add(event.visitor_hash);
    eventDayMap.set(day, entry);

    const dayCounts = customEventCountsByDay[day] ?? {};
    dayCounts[event.name] = (dayCounts[event.name] ?? 0) + 1;
    customEventCountsByDay[day] = dayCounts;
  }

  const timeseries: TimeseriesPoint[] = [];
  const eventTimeseries: TimeseriesPoint[] = [];
  const cursor = new Date(range.from);
  cursor.setUTCHours(0, 0, 0, 0);
  const end = new Date(range.to);
  end.setUTCHours(0, 0, 0, 0);
  while (cursor <= end) {
    const day = cursor.toISOString().slice(0, 10);
    const value = dayMap.get(day);
    const sessionDay = daySessions.get(day);
    timeseries.push({
      day,
      pageviews: value?.pageviews ?? 0,
      visitors: value?.visitors.size ?? 0,
      events: value?.events ?? 0,
      bounceRate: sessionDay
        ? Math.round((sessionDay.bounces / sessionDay.total) * 100)
        : null,
      avgSessionSeconds: sessionDay
        ? Math.round(sessionDay.durationSum / sessionDay.total)
        : null,
    });
    const eventValue = eventDayMap.get(day);
    eventTimeseries.push({
      day,
      pageviews: eventValue?.pageviews ?? 0,
      visitors: eventValue?.visitors.size ?? 0,
      events: eventValue?.pageviews ?? 0,
      bounceRate: null,
      avgSessionSeconds: null,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return {
    pageviews: pageviews.length,
    visitors: countUnique(pageviews.map((e) => e.visitor_hash)),
    events: custom.length,
    eventVisitors: countUnique(custom.map((e) => e.visitor_hash)),
    bounceRate: sessions ? Math.round((bounces / sessions) * 100) : null,
    avgSessionSeconds,
    timeseries,
    eventTimeseries,
    customEventCountsByDay,
    topPages: breakdown(
      pageviews.map((e) => ({ key: e.path, visitor: e.visitor_hash })),
    ),
    topReferrers: breakdown(
      pageviews
        .filter((e) => e.referrer_host)
        .map((e) => ({ key: e.referrer_host, visitor: e.visitor_hash })),
    ),
    topCountries: breakdown(
      pageviews.map((e) => ({ key: e.country, visitor: e.visitor_hash })),
      25,
    ),
    regionsByCountry: breakdownByCountry(
      pageviews.map((e) => ({
        country: e.country,
        key: e.region,
        visitor: e.visitor_hash,
      })),
    ),
    citiesByCountry: breakdownByCountry(
      pageviews.map((e) => ({
        country: e.country,
        key: e.city,
        visitor: e.visitor_hash,
      })),
    ),
    topDevices: breakdown(
      pageviews.map((e) => ({ key: e.device, visitor: e.visitor_hash })),
    ),
    topBrowsers: breakdown(
      pageviews.map((e) => ({ key: e.browser, visitor: e.visitor_hash })),
    ),
    topSources: breakdown(
      pageviews
        .filter((e) => e.utm_source)
        .map((e) => ({ key: e.utm_source, visitor: e.visitor_hash })),
    ),
    topMediums: breakdown(
      pageviews
        .filter((e) => e.utm_medium)
        .map((e) => ({ key: e.utm_medium, visitor: e.visitor_hash })),
    ),
    topCampaigns: breakdown(
      pageviews
        .filter((e) => e.utm_campaign)
        .map((e) => ({ key: e.utm_campaign, visitor: e.visitor_hash })),
    ),
    customEvents: breakdown(
      custom.map((e) => ({ key: e.name, visitor: e.visitor_hash })),
      25,
    ),
  };
}

export async function getSiteLogs(
  supabase: SupabaseClient<Database>,
  siteId: string,
  range: DateRange,
  limit = 100,
): Promise<EventLogRow[]> {
  const { data, error } = await supabase
    .from("events")
    .select(
      "id, name, path, url, referrer, referrer_host, utm_source, utm_medium, utm_campaign, utm_term, utm_content, country, device, browser, os, visitor_hash, session_hash, props, created_at",
    )
    .eq("site_id", siteId)
    .gte("created_at", range.from)
    .lte("created_at", range.to)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data ?? [];
}
