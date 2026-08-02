import type { SupabaseClient } from "@supabase/supabase-js";

import type { DateRange } from "@/lib/stats";
import type { Database } from "@/lib/supabase/database.types";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import {
  visitorIdentity,
  type VisitorIdentity,
} from "@/lib/visitor-name";

export type UserJourneyEvent = {
  id: number;
  name: string;
  path: string | null;
  referrer_host: string | null;
  session_hash: string;
  created_at: string;
};

export type SiteUser = {
  visitor_hash: string;
  identity: VisitorIdentity;
  first_seen: string;
  last_seen: string;
  pageviews: number;
  events: number;
  sessions: number;
  country: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  entry_path: string | null;
  exit_path: string | null;
  journey: UserJourneyEvent[];
};

export type SiteUsersResult = {
  users: SiteUser[];
  totalUsers: number;
  totalSessions: number;
  avgEventsPerUser: number | null;
};

type EventRow = {
  id: number;
  name: string;
  path: string | null;
  referrer_host: string | null;
  country: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  visitor_hash: string;
  session_hash: string;
  created_at: string;
};

export async function getSiteUsers(
  supabase: SupabaseClient<Database>,
  siteId: string,
  range: DateRange,
  limit = 100,
  options?: { includeJourney?: boolean },
): Promise<SiteUsersResult> {
  const includeJourney = options?.includeJourney !== false;

  const events = (await fetchAllRows((from, to) =>
    supabase
      .from("events")
      .select(
        "id, name, path, referrer_host, country, device, browser, os, visitor_hash, session_hash, created_at",
      )
      .eq("site_id", siteId)
      .gte("created_at", range.from)
      .lte("created_at", range.to)
      .order("id", { ascending: true })
      .range(from, to),
  )) as EventRow[];

  type Agg = {
    first_seen: string;
    last_seen: string;
    pageviews: number;
    events: number;
    sessions: Set<string>;
    country: string | null;
    device: string | null;
    browser: string | null;
    os: string | null;
    entry_path: string | null;
    exit_path: string | null;
    journey: UserJourneyEvent[];
  };

  const byVisitor = new Map<string, Agg>();

  for (const event of events) {
    const existing = byVisitor.get(event.visitor_hash);
    const journeyEvent: UserJourneyEvent | null = includeJourney
      ? {
          id: event.id,
          name: event.name,
          path: event.path,
          referrer_host: event.referrer_host,
          session_hash: event.session_hash,
          created_at: event.created_at,
        }
      : null;

    if (!existing) {
      byVisitor.set(event.visitor_hash, {
        first_seen: event.created_at,
        last_seen: event.created_at,
        pageviews: event.name === "pageview" ? 1 : 0,
        events: event.name === "pageview" ? 0 : 1,
        sessions: new Set([event.session_hash]),
        country: event.country,
        device: event.device,
        browser: event.browser,
        os: event.os,
        entry_path: event.path,
        exit_path: event.path,
        journey: journeyEvent ? [journeyEvent] : [],
      });
      continue;
    }

    existing.last_seen = event.created_at;
    existing.sessions.add(event.session_hash);
    existing.exit_path = event.path;
    if (journeyEvent) existing.journey.push(journeyEvent);
    if (event.name === "pageview") existing.pageviews += 1;
    else existing.events += 1;

    if (event.country) existing.country = event.country;
    if (event.device) existing.device = event.device;
    if (event.browser) existing.browser = event.browser;
    if (event.os) existing.os = event.os;
  }

  const users: SiteUser[] = [...byVisitor.entries()]
    .map(([visitor_hash, agg]) => ({
      visitor_hash,
      identity: visitorIdentity(visitor_hash),
      first_seen: agg.first_seen,
      last_seen: agg.last_seen,
      pageviews: agg.pageviews,
      events: agg.events,
      sessions: agg.sessions.size,
      country: agg.country,
      device: agg.device,
      browser: agg.browser,
      os: agg.os,
      entry_path: agg.entry_path,
      exit_path: agg.exit_path,
      journey: agg.journey,
    }))
    .sort(
      (a, b) =>
        new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime(),
    );

  const totalUsers = users.length;
  const totalSessions = users.reduce((sum, u) => sum + u.sessions, 0);
  const totalActivity = users.reduce(
    (sum, u) => sum + u.pageviews + u.events,
    0,
  );

  return {
    users: users.slice(0, limit),
    totalUsers,
    totalSessions,
    avgEventsPerUser:
      totalUsers > 0 ? Math.round((totalActivity / totalUsers) * 10) / 10 : null,
  };
}
