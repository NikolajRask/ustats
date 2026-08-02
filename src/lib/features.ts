import type { SupabaseClient } from "@supabase/supabase-js";

import { normalizePath } from "@/lib/funnels";
import type { BreakdownRow, DateRange } from "@/lib/stats";
import type { Database, Json } from "@/lib/supabase/database.types";

export type FeatureMatchType =
  | "exact"
  | "prefix"
  | "contains"
  | "ends_with";

export const FEATURE_MATCH_TYPES: {
  value: FeatureMatchType;
  label: string;
  hint: string;
  placeholder: string;
}[] = [
  {
    value: "exact",
    label: "Exact",
    hint: "Matches this path exactly",
    placeholder: "/pricing",
  },
  {
    value: "prefix",
    label: "Prefix",
    hint: "Matches this path and any nested routes",
    placeholder: "/dashboard",
  },
  {
    value: "contains",
    label: "Contains",
    hint: "Matches any path that includes this segment",
    placeholder: "/settings",
  },
  {
    value: "ends_with",
    label: "Ends with",
    hint: "Matches paths that end with this segment",
    placeholder: "/edit",
  },
];

export type FeaturePathInput = {
  path: string;
  match_type: FeatureMatchType;
};

export type FeaturePath = FeaturePathInput & {
  id: string;
  feature_id: string;
  position: number;
};

export type SiteFeature = {
  id: string;
  site_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  paths: FeaturePath[];
};

export type FeatureStatRow = BreakdownRow & {
  id: string;
  seconds: number;
};

export type FeatureTimeseriesPoint = {
  day: string;
  feature: string;
  count: number;
  visitors: number;
};

export type FeatureTimePoint = {
  day: string;
  featureId: string;
  feature: string;
  seconds: number;
};

export type SiteFeatureStats = {
  pageviews: number;
  visitors: number;
  matchedPageviews: number;
  matchedVisitors: number;
  unmatchedPageviews: number;
  unmatchedVisitors: number;
  matchedSeconds: number;
  unmatchedSeconds: number;
  featureCount: number;
  features: FeatureStatRow[];
  breakdown: BreakdownRow[];
  timeseries: FeatureTimeseriesPoint[];
  timeTimeseries: FeatureTimePoint[];
  days: string[];
};

export function featureSeriesKey(featureId: string): string {
  return `f_${featureId.replace(/-/g, "")}`;
}

export function validateFeaturePaths(
  paths: FeaturePathInput[],
): string | null {
  if (paths.length === 0) {
    return "Add at least one path";
  }
  if (paths.length > 24) {
    return "At most 24 paths per feature";
  }

  const seen = new Set<string>();
  for (const entry of paths) {
    if (
      entry.match_type !== "exact" &&
      entry.match_type !== "prefix" &&
      entry.match_type !== "contains" &&
      entry.match_type !== "ends_with"
    ) {
      return "Invalid match type";
    }
    const path = normalizePath(entry.path);
    if (!path) return "Path is required";
    const key = `${entry.match_type}:${path}`;
    if (seen.has(key)) {
      return `Duplicate path: ${path}`;
    }
    seen.add(key);
  }

  return null;
}

export async function listFeatures(
  supabase: SupabaseClient<Database>,
  siteId: string,
): Promise<SiteFeature[]> {
  const { data: features, error } = await supabase
    .from("site_features")
    .select("*")
    .eq("site_id", siteId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (!features?.length) return [];

  const ids = features.map((feature) => feature.id);
  const { data: paths, error: pathsError } = await supabase
    .from("site_feature_paths")
    .select("*")
    .in("feature_id", ids)
    .order("position", { ascending: true });

  if (pathsError) throw pathsError;

  const pathsByFeature = new Map<string, FeaturePath[]>();
  for (const path of paths ?? []) {
    const list = pathsByFeature.get(path.feature_id) ?? [];
    list.push({
      id: path.id,
      feature_id: path.feature_id,
      path: path.path,
      match_type: path.match_type,
      position: path.position,
    });
    pathsByFeature.set(path.feature_id, list);
  }

  return features.map((feature) => ({
    id: feature.id,
    site_id: feature.site_id,
    name: feature.name,
    created_at: feature.created_at,
    updated_at: feature.updated_at,
    paths: pathsByFeature.get(feature.id) ?? [],
  }));
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function parseBreakdown(value: unknown): BreakdownRow[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const record = row as Record<string, unknown>;
      return {
        key: asString(record.key, "(unknown)"),
        count: asNumber(record.count),
        visitors: asNumber(record.visitors),
      };
    })
    .filter((row): row is BreakdownRow => row != null);
}

function parseFeatureRows(value: unknown): FeatureStatRow[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const record = row as Record<string, unknown>;
      const id = asString(record.id);
      if (!id) return null;
      return {
        id,
        key: asString(record.key, "(unknown)"),
        count: asNumber(record.count),
        visitors: asNumber(record.visitors),
        seconds: asNumber(record.seconds),
      };
    })
    .filter((row): row is FeatureStatRow => row != null);
}

function parseTimeseries(value: unknown): FeatureTimeseriesPoint[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const record = row as Record<string, unknown>;
      return {
        day: asString(record.day),
        feature: asString(record.feature, "Other"),
        count: asNumber(record.count),
        visitors: asNumber(record.visitors),
      };
    })
    .filter((row): row is FeatureTimeseriesPoint => row != null && row.day !== "");
}

function parseTimeTimeseries(value: unknown): FeatureTimePoint[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const record = row as Record<string, unknown>;
      const featureId = asString(record.featureId);
      const day = asString(record.day);
      if (!featureId || !day) return null;
      return {
        day,
        featureId,
        feature: asString(record.feature, "(unknown)"),
        seconds: asNumber(record.seconds),
      };
    })
    .filter((row): row is FeatureTimePoint => row != null);
}

function parseDays(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((day): day is string => typeof day === "string");
}

function parseFeatureStats(raw: Json): SiteFeatureStats {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      pageviews: 0,
      visitors: 0,
      matchedPageviews: 0,
      matchedVisitors: 0,
      unmatchedPageviews: 0,
      unmatchedVisitors: 0,
      matchedSeconds: 0,
      unmatchedSeconds: 0,
      featureCount: 0,
      features: [],
      breakdown: [],
      timeseries: [],
      timeTimeseries: [],
      days: [],
    };
  }

  const data = raw as Record<string, unknown>;
  return {
    pageviews: asNumber(data.pageviews),
    visitors: asNumber(data.visitors),
    matchedPageviews: asNumber(data.matchedPageviews),
    matchedVisitors: asNumber(data.matchedVisitors),
    unmatchedPageviews: asNumber(data.unmatchedPageviews),
    unmatchedVisitors: asNumber(data.unmatchedVisitors),
    matchedSeconds: asNumber(data.matchedSeconds),
    unmatchedSeconds: asNumber(data.unmatchedSeconds),
    featureCount: asNumber(data.featureCount),
    features: parseFeatureRows(data.features),
    breakdown: parseBreakdown(data.breakdown),
    timeseries: parseTimeseries(data.timeseries),
    timeTimeseries: parseTimeTimeseries(data.timeTimeseries),
    days: parseDays(data.days),
  };
}

export async function getSiteFeatureStats(
  supabase: SupabaseClient<Database>,
  siteId: string,
  range: DateRange,
): Promise<SiteFeatureStats> {
  const { data, error } = await supabase.rpc("get_site_feature_stats", {
    p_site_id: siteId,
    p_from: range.from,
    p_to: range.to,
  });

  if (error) throw error;
  return parseFeatureStats(data);
}

export function formatFeaturePath(path: FeaturePathInput): string {
  const normalized = normalizePath(path.path);
  switch (path.match_type) {
    case "prefix":
      return `${normalized}/*`;
    case "contains":
      return `*${normalized}*`;
    case "ends_with":
      return `*${normalized}`;
    default:
      return normalized;
  }
}
