import type { SupabaseClient } from "@supabase/supabase-js";

import { getErrorStats } from "@/lib/errors";
import {
  computeFunnelStats,
  formatDuration,
  listFunnels,
  type Funnel,
} from "@/lib/funnels";
import {
  formatSessionDuration,
  getSiteStats,
  rangeFromDays,
  type BreakdownRow,
  type DateRange,
} from "@/lib/stats";
import type { Database } from "@/lib/supabase/database.types";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { getSiteUsers, type SiteUsersResult } from "@/lib/users";

const SITE_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MAX_FUNNELS_IN_CONTEXT = 8;
const MAX_USERS_IN_CONTEXT = 25;

function formatSeenAt(iso: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatRows(rows: BreakdownRow[], limit = 5): string {
  if (rows.length === 0) return "none";
  return rows
    .slice(0, limit)
    .map((row) => `${row.key} (${row.count} hits, ${row.visitors} visitors)`)
    .join("; ");
}

export function isSiteId(value: unknown): value is string {
  return typeof value === "string" && SITE_ID_RE.test(value);
}

async function loadFunnelEvents(
  supabase: SupabaseClient<Database>,
  siteId: string,
  range: DateRange,
): Promise<
  {
    name: string;
    path: string | null;
    visitor_hash: string;
    created_at: string;
  }[]
> {
  return fetchAllRows((from, to) =>
    supabase
      .from("events")
      .select("name, path, visitor_hash, created_at")
      .eq("site_id", siteId)
      .gte("created_at", range.from)
      .lte("created_at", range.to)
      .order("id", { ascending: true })
      .range(from, to),
  );
}

function formatFunnelSection(
  funnels: Funnel[],
  events: {
    name: string;
    path: string | null;
    visitor_hash: string;
    created_at: string;
  }[],
): string[] {
  if (funnels.length === 0) {
    return ["", "Funnels: none configured on this site."];
  }

  const selected = funnels.slice(0, MAX_FUNNELS_IN_CONTEXT);
  const lines: string[] = [
    "",
    `Funnels (${funnels.length} configured${
      funnels.length > selected.length
        ? `, showing first ${selected.length}`
        : ""
    }):`,
  ];

  for (const funnel of selected) {
    const stepDefs = funnel.steps
      .map(
        (step, index) =>
          `${index + 1}. ${step.name} [${step.step_type}:${step.match_value}]`,
      )
      .join(" → ");

    lines.push(
      "",
      `### ${funnel.name}`,
      `- id: ${funnel.id}`,
      `- definition: ${stepDefs || "no steps"}`,
    );

    if (funnel.steps.length === 0) {
      lines.push("- performance: no steps configured");
      continue;
    }

    const stats = computeFunnelStats(funnel.steps, events);
    const { insights } = stats;

    lines.push(
      `- conversion rate: ${
        insights.conversionRate == null
          ? "n/a (no entrants)"
          : `${insights.conversionRate}%`
      } (benchmark ${insights.benchmarkRate}%)`,
      `- avg time to complete: ${formatDuration(insights.avgFunnelMs)}`,
      `- biggest drop-off: ${
        insights.biggestDropOff
          ? `${insights.biggestDropOff.stepName} (−${insights.biggestDropOff.dropOffPct}%)`
          : "n/a"
      }`,
      `- slowest step: ${
        insights.slowestStep
          ? `${insights.slowestStep.stepName} (avg ${formatDuration(insights.slowestStep.avgMs)})`
          : "n/a"
      }`,
      "- step performance:",
    );

    for (const [index, result] of stats.steps.entries()) {
      const drop =
        result.dropOffPct == null
          ? "—"
          : `−${result.dropOffPct}% from previous`;
      const avgFromPrev =
        result.avgMsFromPrev == null
          ? "—"
          : formatDuration(result.avgMsFromPrev);
      lines.push(
        `  ${index + 1}. ${result.step.name}: ${result.visitors} visitors, ${result.pctOfStart}% of start, drop-off ${drop}, avg time from previous ${avgFromPrev}`,
      );
    }
  }

  return lines;
}

function formatUsersSection(result: SiteUsersResult): string[] {
  const lines: string[] = [
    "",
    "Users (summary — no full journey timelines):",
    `- Unique users in range: ${result.totalUsers}`,
    `- Total sessions: ${result.totalSessions}`,
    `- Avg events+views per user: ${
      result.avgEventsPerUser == null ? "n/a" : result.avgEventsPerUser
    }`,
  ];

  if (result.users.length === 0) {
    lines.push("- Recent users: none in this range");
    return lines;
  }

  lines.push(
    `- Recent users (up to ${MAX_USERS_IN_CONTEXT}, sorted by last seen):`,
  );

  for (const user of result.users) {
    lines.push(
      `- ${user.identity.name}: last seen ${formatSeenAt(user.last_seen)}; views ${user.pageviews}; events ${user.events}; sessions ${user.sessions}; country ${user.country ?? "—"}; device ${user.device ?? "—"}; browser ${user.browser ?? "—"}; entry ${user.entry_path ?? "—"}; exit ${user.exit_path ?? "—"}`,
    );
  }

  return lines;
}

export async function buildAssistantContext(
  supabase: SupabaseClient<Database>,
  siteId?: string | null,
): Promise<string> {
  const { data: sites } = await supabase
    .from("sites")
    .select("id, name, domain")
    .order("created_at", { ascending: false });

  const siteList = sites ?? [];
  if (siteList.length === 0) {
    return "The user has no sites configured yet in this ustats instance.";
  }

  const lines: string[] = [
    `Sites on this instance (${siteList.length}):`,
    ...siteList.map(
      (site) => `- ${site.name} (${site.domain}) [id=${site.id}]`,
    ),
  ];

  const active =
    siteId && isSiteId(siteId)
      ? siteList.find((site) => site.id === siteId)
      : null;

  if (!active) {
    lines.push(
      "",
      "No specific site is selected in the dashboard right now. Ask which site they mean if needed, or summarize across sites only at a high level.",
    );
    return lines.join("\n");
  }

  const range = rangeFromDays(30);
  const [stats, errorStats, funnels, funnelEvents, siteUsers] =
    await Promise.all([
      getSiteStats(supabase, active.id, range),
      getErrorStats(supabase, active.id, range, {
        status: "unresolved",
        limit: 5,
      }),
      listFunnels(supabase, active.id),
      loadFunnelEvents(supabase, active.id, range),
      getSiteUsers(supabase, active.id, range, MAX_USERS_IN_CONTEXT, {
        includeJourney: false,
      }),
    ]);

  lines.push(
    "",
    `Active site context: ${active.name} (${active.domain})`,
    `Date range: last 30 days (${range.from.slice(0, 10)} → ${range.to.slice(0, 10)})`,
    "",
    "Overview:",
    `- Visitors: ${stats.visitors}`,
    `- Pageviews: ${stats.pageviews}`,
    `- Custom events: ${stats.events}`,
    `- Bounce rate: ${stats.bounceRate == null ? "n/a" : `${stats.bounceRate}%`}`,
    `- Avg session: ${formatSessionDuration(stats.avgSessionSeconds)}`,
    "",
    `Top pages: ${formatRows(stats.topPages)}`,
    `Top referrers: ${formatRows(stats.topReferrers)}`,
    `Top countries: ${formatRows(stats.topCountries)}`,
    `Top devices: ${formatRows(stats.topDevices)}`,
    `Top browsers: ${formatRows(stats.topBrowsers)}`,
    `UTM sources: ${formatRows(stats.topSources)}`,
    `Custom event names: ${formatRows(stats.customEvents)}`,
    "",
    "Errors:",
    `- Unresolved groups: ${errorStats.unresolvedGroups}`,
    `- Error events in range: ${errorStats.totalEvents}`,
    `- Visitors affected: ${errorStats.affectedVisitors}${
      errorStats.affectedUserPercent == null
        ? ""
        : ` (${errorStats.affectedUserPercent}% of visitors)`
    }`,
  );

  if (errorStats.groups.length > 0) {
    lines.push(
      "Top unresolved errors:",
      ...errorStats.groups.map(
        (group) =>
          `- [${group.level}] ${group.type}: ${group.message} (${group.range_count} in range, ${group.affected_visitors} visitors)`,
      ),
    );
  }

  lines.push(...formatFunnelSection(funnels, funnelEvents));
  lines.push(...formatUsersSection(siteUsers));

  return lines.join("\n");
}
