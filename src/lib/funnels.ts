import type { SupabaseClient } from "@supabase/supabase-js";

import type { DateRange } from "@/lib/stats";
import type { Database } from "@/lib/supabase/database.types";

export type FunnelStepType = "path" | "event";

export type FunnelStepInput = {
  name: string;
  step_type: FunnelStepType;
  match_value: string;
};

export type FunnelStep = FunnelStepInput & {
  id: string;
  funnel_id: string;
  position: number;
};

export type Funnel = {
  id: string;
  site_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  steps: FunnelStep[];
};

export type FunnelStepResult = {
  step: FunnelStep;
  visitors: number;
  pctOfStart: number;
  dropOffPct: number | null;
  avgMsFromPrev: number | null;
};

export type FunnelInsights = {
  biggestDropOff: {
    stepName: string;
    dropOffPct: number;
  } | null;
  conversionRate: number | null;
  benchmarkRate: number;
  avgFunnelMs: number | null;
  slowestStep: {
    stepName: string;
    avgMs: number;
  } | null;
};

export type FunnelStats = {
  steps: FunnelStepResult[];
  insights: FunnelInsights;
};

type EventRow = {
  name: string;
  path: string | null;
  visitor_hash: string;
  created_at: string;
};

const BENCHMARK_CONVERSION_RATE = 22;

export function normalizePath(path: string): string {
  let value = path.trim();
  if (!value) return "/";
  if (!value.startsWith("/")) value = `/${value}`;
  if (value.length > 1 && value.endsWith("/")) {
    value = value.slice(0, -1);
  }
  return value;
}

export function matchesFunnelStep(
  event: Pick<EventRow, "name" | "path">,
  step: Pick<FunnelStepInput, "step_type" | "match_value">,
): boolean {
  if (step.step_type === "path") {
    return (
      event.name === "pageview" &&
      normalizePath(event.path ?? "") === normalizePath(step.match_value)
    );
  }
  return event.name === step.match_value.trim();
}

export function formatDuration(ms: number | null): string {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return "—";
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return `${minutes}m ${seconds}s`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return `${hours}h ${remMinutes}m`;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function computeFunnelStats(
  steps: FunnelStep[],
  events: EventRow[],
): FunnelStats {
  const ordered = [...steps].sort((a, b) => a.position - b.position);
  if (ordered.length === 0) {
    return {
      steps: [],
      insights: {
        biggestDropOff: null,
        conversionRate: null,
        benchmarkRate: BENCHMARK_CONVERSION_RATE,
        avgFunnelMs: null,
        slowestStep: null,
      },
    };
  }

  const byVisitor = new Map<string, EventRow[]>();
  for (const event of events) {
    const list = byVisitor.get(event.visitor_hash) ?? [];
    list.push(event);
    byVisitor.set(event.visitor_hash, list);
  }

  for (const list of byVisitor.values()) {
    list.sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  const reachedCounts = ordered.map(() => 0);
  const stepDurations: number[][] = ordered.map(() => []);
  const funnelDurations: number[] = [];

  for (const visitorEvents of byVisitor.values()) {
    let cursor = 0;
    let prevAt: number | null = null;
    let firstAt: number | null = null;

    for (let i = 0; i < ordered.length; i++) {
      const step = ordered[i];
      let foundAt: number | null = null;

      for (let j = cursor; j < visitorEvents.length; j++) {
        const event = visitorEvents[j];
        if (!matchesFunnelStep(event, step)) continue;
        foundAt = new Date(event.created_at).getTime();
        cursor = j + 1;
        break;
      }

      if (foundAt == null) break;

      reachedCounts[i] += 1;
      if (i === 0) {
        firstAt = foundAt;
      } else if (prevAt != null) {
        stepDurations[i].push(foundAt - prevAt);
      }
      prevAt = foundAt;

      if (i === ordered.length - 1 && firstAt != null) {
        funnelDurations.push(foundAt - firstAt);
      }
    }
  }

  const startCount = reachedCounts[0] || 0;
  const results: FunnelStepResult[] = ordered.map((step, index) => {
    const visitors = reachedCounts[index];
    const prev = index === 0 ? null : reachedCounts[index - 1];
    const dropOffPct =
      prev != null && prev > 0
        ? Number((((prev - visitors) / prev) * 100).toFixed(1))
        : null;

    return {
      step,
      visitors,
      pctOfStart:
        startCount > 0
          ? Number(((visitors / startCount) * 100).toFixed(1))
          : 0,
      dropOffPct,
      avgMsFromPrev: average(stepDurations[index]),
    };
  });

  let biggestDropOff: FunnelInsights["biggestDropOff"] = null;
  for (const result of results) {
    if (result.dropOffPct == null) continue;
    if (
      biggestDropOff == null ||
      result.dropOffPct > biggestDropOff.dropOffPct
    ) {
      biggestDropOff = {
        stepName: result.step.name,
        dropOffPct: result.dropOffPct,
      };
    }
  }

  let slowestStep: FunnelInsights["slowestStep"] = null;
  for (const result of results) {
    if (result.avgMsFromPrev == null) continue;
    if (slowestStep == null || result.avgMsFromPrev > slowestStep.avgMs) {
      slowestStep = {
        stepName: result.step.name,
        avgMs: result.avgMsFromPrev,
      };
    }
  }

  const lastCount = reachedCounts[reachedCounts.length - 1] ?? 0;
  const conversionRate =
    startCount > 0
      ? Number(((lastCount / startCount) * 100).toFixed(1))
      : null;

  return {
    steps: results,
    insights: {
      biggestDropOff,
      conversionRate,
      benchmarkRate: BENCHMARK_CONVERSION_RATE,
      avgFunnelMs: average(funnelDurations),
      slowestStep,
    },
  };
}

export async function listFunnels(
  supabase: SupabaseClient<Database>,
  siteId: string,
): Promise<Funnel[]> {
  const { data, error } = await supabase
    .from("funnels")
    .select(
      "id, site_id, name, created_at, updated_at, funnel_steps(id, funnel_id, position, name, step_type, match_value, created_at)",
    )
    .eq("site_id", siteId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((funnel) => {
    const steps = [...(funnel.funnel_steps ?? [])].sort(
      (a, b) => a.position - b.position,
    ) as FunnelStep[];
    return {
      id: funnel.id,
      site_id: funnel.site_id,
      name: funnel.name,
      created_at: funnel.created_at,
      updated_at: funnel.updated_at,
      steps,
    };
  });
}

export async function getFunnelStats(
  supabase: SupabaseClient<Database>,
  siteId: string,
  steps: FunnelStep[],
  range: DateRange,
): Promise<FunnelStats> {
  if (steps.length === 0) {
    return computeFunnelStats([], []);
  }

  const { data, error } = await supabase
    .from("events")
    .select("name, path, visitor_hash, created_at")
    .eq("site_id", siteId)
    .gte("created_at", range.from)
    .lte("created_at", range.to)
    .order("created_at", { ascending: true })
    .limit(50_000);

  if (error) throw error;

  return computeFunnelStats(steps, data ?? []);
}

export function parseFunnelDateRange(params: {
  from?: string;
  to?: string;
}): { fromDate: string; toDate: string; range: DateRange } {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const defaultTo = today.toISOString().slice(0, 10);
  const defaultFromDate = new Date(today);
  defaultFromDate.setUTCDate(defaultFromDate.getUTCDate() - 29);
  const defaultFrom = defaultFromDate.toISOString().slice(0, 10);

  const fromDate = isValidDateString(params.from) ? params.from! : defaultFrom;
  let toDate = isValidDateString(params.to) ? params.to! : defaultTo;

  if (fromDate > toDate) {
    toDate = fromDate;
  }

  return {
    fromDate,
    toDate,
    range: {
      from: `${fromDate}T00:00:00.000Z`,
      to: `${toDate}T23:59:59.999Z`,
    },
  };
}

function isValidDateString(value?: string): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime());
}

export function validateFunnelSteps(
  steps: FunnelStepInput[],
): string | null {
  if (steps.length < 2) {
    return "Add at least two steps.";
  }
  if (steps.length > 12) {
    return "Funnels support up to 12 steps.";
  }

  for (const [index, step] of steps.entries()) {
    if (!step.name.trim()) {
      return `Step ${index + 1} needs a name.`;
    }
    if (step.step_type !== "path" && step.step_type !== "event") {
      return `Step ${index + 1} has an invalid type.`;
    }
    if (!step.match_value.trim()) {
      return `Step ${index + 1} needs a ${step.step_type === "path" ? "path" : "event name"}.`;
    }
  }

  return null;
}
