import type { SupabaseClient } from "@supabase/supabase-js";

import type { DateRange } from "@/lib/stats";
import type { Database } from "@/lib/supabase/database.types";

export type ErrorGroupStatus = "unresolved" | "resolved" | "ignored";
export type ErrorLevel = "error" | "warning" | "info";

export type ErrorGroupRow = {
  id: string;
  fingerprint: string;
  type: string;
  message: string;
  culprit: string | null;
  level: ErrorLevel;
  status: ErrorGroupStatus;
  first_seen: string;
  last_seen: string;
  event_count: number;
  range_count: number;
  affected_visitors: number;
};

export type ErrorOccurrenceRow = {
  id: number;
  group_id: string;
  type: string;
  message: string;
  level: ErrorLevel;
  stack: string | null;
  url: string | null;
  path: string | null;
  country: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  visitor_hash: string | null;
  release: string | null;
  environment: string | null;
  extra: unknown;
  created_at: string;
};

export type ErrorTimeseriesPoint = {
  day: string;
  pageviews: number;
  visitors: number;
  events: number;
  bounceRate: null;
  avgSessionSeconds: null;
};

export type ErrorStats = {
  totalEvents: number;
  unresolvedGroups: number;
  newGroups: number;
  affectedVisitors: number;
  /** Share of site visitors who hit at least one error in range (0–100), or null if no traffic. */
  affectedUserPercent: number | null;
  timeseries: ErrorTimeseriesPoint[];
  groups: ErrorGroupRow[];
};

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function emptyTimeseries(range: DateRange): ErrorTimeseriesPoint[] {
  const points: ErrorTimeseriesPoint[] = [];
  const cursor = new Date(range.from);
  cursor.setUTCHours(0, 0, 0, 0);
  const end = new Date(range.to);

  while (cursor <= end) {
    points.push({
      day: cursor.toISOString().slice(0, 10),
      pageviews: 0,
      visitors: 0,
      events: 0,
      bounceRate: null,
      avgSessionSeconds: null,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return points;
}

export async function getErrorStats(
  supabase: SupabaseClient<Database>,
  siteId: string,
  range: DateRange,
  options?: { status?: ErrorGroupStatus | "all"; limit?: number },
): Promise<ErrorStats> {
  const status = options?.status ?? "unresolved";
  const limit = options?.limit ?? 100;

  const eventsQuery = supabase
    .from("error_events")
    .select(
      "id, group_id, visitor_hash, created_at, type, message, level, path, country, browser",
    )
    .eq("site_id", siteId)
    .gte("created_at", range.from)
    .lte("created_at", range.to)
    .order("created_at", { ascending: false })
    .limit(20_000);

  const groupsQuery = supabase
    .from("error_groups")
    .select(
      "id, fingerprint, type, message, culprit, level, status, first_seen, last_seen, event_count",
    )
    .eq("site_id", siteId)
    .order("last_seen", { ascending: false })
    .limit(500);

  const visitorsQuery = supabase
    .from("events")
    .select("visitor_hash")
    .eq("site_id", siteId)
    .eq("name", "pageview")
    .gte("created_at", range.from)
    .lte("created_at", range.to)
    .limit(50_000);

  const [
    { data: events, error: eventsError },
    { data: groups, error: groupsError },
    { data: pageviews, error: pageviewsError },
  ] = await Promise.all([eventsQuery, groupsQuery, visitorsQuery]);

  if (eventsError) throw eventsError;
  if (groupsError) throw groupsError;
  if (pageviewsError) throw pageviewsError;

  const eventRows = events ?? [];
  const groupRows = groups ?? [];

  const rangeCountByGroup = new Map<string, number>();
  const visitorsByGroup = new Map<string, Set<string>>();
  const allVisitors = new Set<string>();
  const timeseries = emptyTimeseries(range);
  const timeseriesIndex = new Map(timeseries.map((p, i) => [p.day, i]));

  for (const event of eventRows) {
    rangeCountByGroup.set(
      event.group_id,
      (rangeCountByGroup.get(event.group_id) ?? 0) + 1,
    );

    if (event.visitor_hash) {
      allVisitors.add(event.visitor_hash);
      let set = visitorsByGroup.get(event.group_id);
      if (!set) {
        set = new Set();
        visitorsByGroup.set(event.group_id, set);
      }
      set.add(event.visitor_hash);
    }

    const idx = timeseriesIndex.get(dayKey(event.created_at));
    if (idx != null) {
      timeseries[idx].events += 1;
      timeseries[idx].pageviews += 1;
    }
  }

  for (const point of timeseries) {
    // visitors per day not tracked precisely without another pass — leave 0
    void point;
  }

  const fromMs = new Date(range.from).getTime();

  let enriched: ErrorGroupRow[] = groupRows.map((group) => ({
    id: group.id,
    fingerprint: group.fingerprint,
    type: group.type,
    message: group.message,
    culprit: group.culprit,
    level: group.level as ErrorLevel,
    status: group.status as ErrorGroupStatus,
    first_seen: group.first_seen,
    last_seen: group.last_seen,
    event_count: Number(group.event_count),
    range_count: rangeCountByGroup.get(group.id) ?? 0,
    affected_visitors: visitorsByGroup.get(group.id)?.size ?? 0,
  }));

  if (status !== "all") {
    enriched = enriched.filter((g) => g.status === status);
  }

  // Prefer groups that fired in-range; fall back to recently seen unresolved
  enriched.sort((a, b) => {
    if (b.range_count !== a.range_count) return b.range_count - a.range_count;
    return new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime();
  });

  const unresolvedGroups = groupRows.filter((g) => g.status === "unresolved")
    .length;
  const newGroups = groupRows.filter(
    (g) =>
      g.status === "unresolved" &&
      new Date(g.first_seen).getTime() >= fromMs,
  ).length;

  const totalVisitors = new Set(
    (pageviews ?? []).map((row) => row.visitor_hash).filter(Boolean),
  ).size;
  const affectedVisitors = allVisitors.size;
  const affectedUserPercent =
    totalVisitors > 0
      ? Math.round((affectedVisitors / totalVisitors) * 1000) / 10
      : null;

  return {
    totalEvents: eventRows.length,
    unresolvedGroups,
    newGroups,
    affectedVisitors,
    affectedUserPercent,
    timeseries,
    groups: enriched.slice(0, limit),
  };
}

export async function getErrorOccurrences(
  supabase: SupabaseClient<Database>,
  siteId: string,
  groupId: string,
  limit = 30,
): Promise<ErrorOccurrenceRow[]> {
  const { data, error } = await supabase
    .from("error_events")
    .select(
      "id, group_id, type, message, level, stack, url, path, country, device, browser, os, visitor_hash, release, environment, extra, created_at",
    )
    .eq("site_id", siteId)
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as ErrorOccurrenceRow[];
}
