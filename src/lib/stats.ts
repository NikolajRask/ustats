import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/lib/supabase/database.types";

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
  /** day → event name → unique visitors (custom events only) */
  customEventVisitorsByDay: Record<string, Record<string, number>>;
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

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asNullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asBreakdownRows(value: unknown): BreakdownRow[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const record = row as Record<string, unknown>;
      const key = typeof record.key === "string" ? record.key : null;
      if (!key) return null;
      return {
        key,
        count: asNumber(record.count),
        visitors: asNumber(record.visitors),
      };
    })
    .filter((row): row is BreakdownRow => row !== null);
}

function asBreakdownByCountry(value: unknown): Record<string, BreakdownRow[]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: Record<string, BreakdownRow[]> = {};
  for (const [country, rows] of Object.entries(value)) {
    result[country] = asBreakdownRows(rows);
  }
  return result;
}

function asTimeseries(value: unknown): TimeseriesPoint[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const record = row as Record<string, unknown>;
      const day = typeof record.day === "string" ? record.day : null;
      if (!day) return null;
      return {
        day,
        pageviews: asNumber(record.pageviews),
        visitors: asNumber(record.visitors),
        events: asNumber(record.events),
        bounceRate: asNullableNumber(record.bounceRate),
        avgSessionSeconds: asNullableNumber(record.avgSessionSeconds),
      };
    })
    .filter((row): row is TimeseriesPoint => row !== null);
}

function asDayNameCounts(value: unknown): Record<string, Record<string, number>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: Record<string, Record<string, number>> = {};
  for (const [day, names] of Object.entries(value)) {
    if (!names || typeof names !== "object" || Array.isArray(names)) continue;
    const dayCounts: Record<string, number> = {};
    for (const [name, count] of Object.entries(names)) {
      dayCounts[name] = asNumber(count);
    }
    result[day] = dayCounts;
  }
  return result;
}

function parseSiteStats(data: Json): SiteStats {
  const record =
    data && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {};

  return {
    pageviews: asNumber(record.pageviews),
    visitors: asNumber(record.visitors),
    events: asNumber(record.events),
    eventVisitors: asNumber(record.eventVisitors),
    bounceRate: asNullableNumber(record.bounceRate),
    avgSessionSeconds: asNullableNumber(record.avgSessionSeconds),
    timeseries: asTimeseries(record.timeseries),
    eventTimeseries: asTimeseries(record.eventTimeseries),
    customEventCountsByDay: asDayNameCounts(record.customEventCountsByDay),
    customEventVisitorsByDay: asDayNameCounts(record.customEventVisitorsByDay),
    topPages: asBreakdownRows(record.topPages),
    topReferrers: asBreakdownRows(record.topReferrers),
    topCountries: asBreakdownRows(record.topCountries),
    regionsByCountry: asBreakdownByCountry(record.regionsByCountry),
    citiesByCountry: asBreakdownByCountry(record.citiesByCountry),
    topDevices: asBreakdownRows(record.topDevices),
    topBrowsers: asBreakdownRows(record.topBrowsers),
    topSources: asBreakdownRows(record.topSources),
    topMediums: asBreakdownRows(record.topMediums),
    topCampaigns: asBreakdownRows(record.topCampaigns),
    customEvents: asBreakdownRows(record.customEvents),
  };
}

export async function getSiteStats(
  supabase: SupabaseClient<Database>,
  siteId: string,
  range: DateRange,
): Promise<SiteStats> {
  const { data, error } = await supabase.rpc("get_site_stats", {
    p_site_id: siteId,
    p_from: range.from,
    p_to: range.to,
  });

  if (error) {
    throw error;
  }

  return parseSiteStats(data ?? {});
}

export function timeseriesForCustomEvent(
  days: TimeseriesPoint[],
  eventName: string,
  countsByDay: Record<string, Record<string, number>>,
  visitorsByDay: Record<string, Record<string, number>>,
): TimeseriesPoint[] {
  return days.map((point) => {
    const count = countsByDay[point.day]?.[eventName] ?? 0;
    const visitors = visitorsByDay[point.day]?.[eventName] ?? 0;
    return {
      day: point.day,
      pageviews: count,
      visitors,
      events: count,
      bounceRate: null,
      avgSessionSeconds: null,
    };
  });
}

export const LOGS_PAGE_SIZE = 250;

export async function getSiteLogs(
  supabase: SupabaseClient<Database>,
  siteId: string,
  range: DateRange,
  limit = LOGS_PAGE_SIZE,
  offset = 0,
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
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  return data ?? [];
}
