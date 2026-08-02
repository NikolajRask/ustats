import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type {
  BreakdownRow,
  OverviewMetric,
  SiteStats,
  TimeseriesPoint,
} from "@/lib/stats";

export type GraphChartType =
  | "timeseries"
  | "line"
  | "bar"
  | "column"
  | "donut"
  | "pie"
  | "treemap";

export type GraphDimension =
  | "pages"
  | "referrers"
  | "countries"
  | "devices"
  | "browsers"
  | "sources"
  | "mediums"
  | "campaigns"
  | "events";

export type EventFilterOp = "is" | "is_not";

export type EventFilterClause = {
  op: EventFilterOp;
  value: string;
};

export type EventFilter = {
  clauses: EventFilterClause[];
};

export type GraphSeries = {
  metric: OverviewMetric;
  event_filter: EventFilter | null;
};

export type PlotSeries = {
  dataKey: string;
  label: string;
  color: string;
  unit?: "percent" | "duration";
};

export type PlotPoint = {
  day: string;
  [key: string]: string | number | null | undefined;
};

export type SiteGraph = {
  id: string;
  site_id: string;
  name: string;
  chart_type: GraphChartType;
  metric: OverviewMetric;
  metrics: OverviewMetric[];
  series: GraphSeries[];
  dimension: GraphDimension | null;
  created_at: string;
  updated_at: string;
};

export type SiteGraphInput = {
  name: string;
  chart_type: GraphChartType;
  metric: OverviewMetric;
  metrics: OverviewMetric[];
  series: GraphSeries[];
  dimension: GraphDimension | null;
};

export const GRAPH_CHART_TYPES: {
  value: GraphChartType;
  label: string;
  description: string;
}[] = [
  {
    value: "timeseries",
    label: "Area over time",
    description: "Daily trend with a filled area",
  },
  {
    value: "line",
    label: "Line over time",
    description: "Daily trend as a clean line",
  },
  {
    value: "bar",
    label: "Bar chart",
    description: "Compare metrics over time as bars",
  },
  {
    value: "column",
    label: "Column chart",
    description: "Compare top values as vertical columns",
  },
  {
    value: "donut",
    label: "Donut chart",
    description: "Share of top values for a dimension",
  },
  {
    value: "pie",
    label: "Pie chart",
    description: "Share of top values as a solid pie",
  },
  {
    value: "treemap",
    label: "Treemap",
    description: "Proportional tiles for top values",
  },
];

export const MAX_GRAPH_SERIES = 4;
export const MAX_EVENT_FILTER_CLAUSES = 6;

export const EVENT_FILTER_OPS: { value: EventFilterOp; label: string }[] = [
  { value: "is", label: "IS" },
  { value: "is_not", label: "IS NOT" },
];

/** Line, area, and bar charts plot one or more metrics over time. */
export function isMetricChartType(chartType: GraphChartType): boolean {
  return (
    chartType === "timeseries" ||
    chartType === "line" ||
    chartType === "bar"
  );
}

export const GRAPH_METRICS: { value: OverviewMetric; label: string }[] = [
  { value: "pageviews", label: "Pageviews" },
  { value: "visitors", label: "Visitors" },
  { value: "events", label: "Custom events" },
  { value: "bounceRate", label: "Bounce rate" },
  { value: "avgSessionTime", label: "Avg. session time" },
];

export const GRAPH_DIMENSIONS: { value: GraphDimension; label: string }[] = [
  { value: "pages", label: "Pages" },
  { value: "referrers", label: "Referrers" },
  { value: "countries", label: "Countries" },
  { value: "devices", label: "Devices" },
  { value: "browsers", label: "Browsers" },
  { value: "sources", label: "UTM sources" },
  { value: "mediums", label: "UTM mediums" },
  { value: "campaigns", label: "UTM campaigns" },
  { value: "events", label: "Custom event names" },
];

const CHART_TYPES = new Set<GraphChartType>([
  "timeseries",
  "line",
  "bar",
  "column",
  "donut",
  "pie",
  "treemap",
]);
const METRICS = new Set<OverviewMetric>([
  "pageviews",
  "visitors",
  "events",
  "bounceRate",
  "avgSessionTime",
]);
const DIMENSIONS = new Set<GraphDimension>([
  "pages",
  "referrers",
  "countries",
  "devices",
  "browsers",
  "sources",
  "mediums",
  "campaigns",
  "events",
]);
const EVENT_OPS = new Set<EventFilterOp>(["is", "is_not"]);

const METRIC_PLOT: Record<
  OverviewMetric,
  { sourceKey: keyof TimeseriesPoint; label: string; color: string; unit?: "percent" | "duration" }
> = {
  pageviews: {
    sourceKey: "pageviews",
    label: "Pageviews",
    color: "var(--chart-1)",
  },
  visitors: {
    sourceKey: "visitors",
    label: "Visitors",
    color: "var(--chart-2)",
  },
  events: {
    sourceKey: "events",
    label: "Custom events",
    color: "var(--chart-3)",
  },
  bounceRate: {
    sourceKey: "bounceRate",
    label: "Bounce rate",
    color: "var(--chart-4)",
    unit: "percent",
  },
  avgSessionTime: {
    sourceKey: "avgSessionSeconds",
    label: "Avg. session",
    color: "var(--chart-5)",
    unit: "duration",
  },
};

export function emptyEventFilter(): EventFilter {
  return {
    clauses: [{ op: "is", value: "" }],
  };
}

export function normalizeEventFilter(
  filter: EventFilter | null | undefined,
): EventFilter | null {
  if (!filter) return null;
  const clauses = (filter.clauses ?? [])
    .slice(0, MAX_EVENT_FILTER_CLAUSES)
    .map((clause) => ({
      op: EVENT_OPS.has(clause.op) ? clause.op : ("is" as EventFilterOp),
      value: String(clause.value ?? "").trim().slice(0, 80),
    }))
    .filter((clause) => clause.value.length > 0);

  if (clauses.length === 0) return null;
  return { clauses };
}

export function matchesEventFilter(
  eventName: string,
  filter: EventFilter | null,
): boolean {
  const normalized = normalizeEventFilter(filter);
  if (!normalized) return true;

  return normalized.clauses.some((clause) =>
    clause.op === "is"
      ? eventName === clause.value
      : eventName !== clause.value,
  );
}

export function eventFilterLabel(filter: EventFilter | null): string | null {
  const normalized = normalizeEventFilter(filter);
  if (!normalized) return null;
  return normalized.clauses
    .map((clause, index) => {
      const op = clause.op === "is" ? "IS" : "IS NOT";
      const prefix = index === 0 ? "" : " OR ";
      return `${prefix}${op} ${clause.value}`;
    })
    .join("");
}

export function graphSeriesLabel(series: GraphSeries): string {
  if (series.metric !== "events") {
    return graphMetricLabel(series.metric);
  }
  const filterLabel = eventFilterLabel(series.event_filter);
  return filterLabel ? `Events (${filterLabel})` : "Custom events";
}

function seriesFromMetrics(metrics: OverviewMetric[]): GraphSeries[] {
  return metrics.map((metric) => ({
    metric,
    event_filter: null,
  }));
}

export function normalizeSeriesList(
  series: GraphSeries[],
  fallbackMetric: OverviewMetric = "pageviews",
): GraphSeries[] {
  const result: GraphSeries[] = [];
  const usedNonEvent = new Set<OverviewMetric>();

  for (const item of series) {
    if (!METRICS.has(item.metric)) continue;

    if (item.metric !== "events") {
      if (usedNonEvent.has(item.metric)) continue;
      usedNonEvent.add(item.metric);
      result.push({ metric: item.metric, event_filter: null });
    } else {
      result.push({
        metric: "events",
        event_filter: normalizeEventFilter(item.event_filter),
      });
    }

    if (result.length >= MAX_GRAPH_SERIES) break;
  }

  return result.length > 0
    ? result
    : [{ metric: fallbackMetric, event_filter: null }];
}

export function validateSiteGraphInput(
  input: SiteGraphInput,
): string | null {
  if (!input.name.trim()) return "Name is required.";
  if (!CHART_TYPES.has(input.chart_type)) return "Invalid chart type.";

  const series = normalizeSeriesList(input.series, input.metric);
  if (series.length < 1 || series.length > MAX_GRAPH_SERIES) {
    return `Pick between 1 and ${MAX_GRAPH_SERIES} series.`;
  }

  for (const item of series) {
    if (!METRICS.has(item.metric)) return "Invalid metric.";
    if (item.metric === "events" && item.event_filter) {
      for (const clause of item.event_filter.clauses) {
        if (!clause.value.trim()) {
          return "Event filter values cannot be empty.";
        }
      }
    }
  }

  if (isMetricChartType(input.chart_type)) {
    if (input.dimension != null) {
      return "This chart type does not use a dimension.";
    }
    return null;
  }

  if (!input.dimension || !DIMENSIONS.has(input.dimension)) {
    return "Pick a dimension for this chart.";
  }

  return null;
}

export function normalizeSiteGraphInput(
  input: SiteGraphInput,
): SiteGraphInput {
  const name = input.name.trim().slice(0, 80);
  const series = normalizeSeriesList(input.series, input.metric);
  const metrics = series.map((item) => item.metric);

  if (isMetricChartType(input.chart_type)) {
    return {
      name,
      chart_type: input.chart_type,
      metric: metrics[0]!,
      metrics,
      series,
      dimension: null,
    };
  }

  return {
    name,
    chart_type: input.chart_type,
    metric: "pageviews",
    metrics: ["pageviews"],
    series: [{ metric: "pageviews", event_filter: null }],
    dimension: input.dimension,
  };
}

function parseSeriesJson(value: unknown, fallbackMetrics: OverviewMetric[]): GraphSeries[] {
  if (Array.isArray(value) && value.length > 0) {
    return normalizeSeriesList(
      value.map((item) => {
        const row = item as {
          metric?: string;
          event_filter?: EventFilter | null;
        };
        return {
          metric: (row.metric as OverviewMetric) ?? "pageviews",
          event_filter: row.event_filter ?? null,
        };
      }),
      fallbackMetrics[0] ?? "pageviews",
    );
  }
  return normalizeSeriesList(seriesFromMetrics(fallbackMetrics));
}

function mapRow(row: {
  id: string;
  site_id: string;
  name: string;
  chart_type: string;
  metric: string;
  metrics?: string[] | null;
  series?: unknown;
  dimension: string | null;
  created_at: string;
  updated_at: string;
}): SiteGraph {
  const fallbackMetrics =
    row.metrics && row.metrics.length > 0
      ? (row.metrics as OverviewMetric[])
      : [row.metric as OverviewMetric];
  const series = parseSeriesJson(row.series, fallbackMetrics);
  const metrics = series.map((item) => item.metric);

  return {
    id: row.id,
    site_id: row.site_id,
    name: row.name,
    chart_type: row.chart_type as GraphChartType,
    metric: metrics[0]!,
    metrics,
    series,
    dimension: (row.dimension as GraphDimension | null) ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function listSiteGraphs(
  supabase: SupabaseClient<Database>,
  siteId: string,
): Promise<SiteGraph[]> {
  const { data, error } = await supabase
    .from("site_graphs")
    .select(
      "id, site_id, name, chart_type, metric, metrics, series, dimension, created_at, updated_at",
    )
    .eq("site_id", siteId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export function breakdownRowsForDimension(
  stats: SiteStats,
  dimension: GraphDimension,
): BreakdownRow[] {
  switch (dimension) {
    case "pages":
      return stats.topPages;
    case "referrers":
      return stats.topReferrers;
    case "countries":
      return stats.topCountries.filter((row) => row.key !== "(none)");
    case "devices":
      return stats.topDevices;
    case "browsers":
      return stats.topBrowsers;
    case "sources":
      return stats.topSources;
    case "mediums":
      return stats.topMediums;
    case "campaigns":
      return stats.topCampaigns;
    case "events":
      return stats.customEvents;
    default:
      return [];
  }
}

export function graphMetricLabel(metric: OverviewMetric): string {
  return GRAPH_METRICS.find((item) => item.value === metric)?.label ?? metric;
}

export function graphDimensionLabel(dimension: GraphDimension): string {
  return (
    GRAPH_DIMENSIONS.find((item) => item.value === dimension)?.label ??
    dimension
  );
}

export function graphSubtitle(graph: SiteGraph): string {
  if (isMetricChartType(graph.chart_type) && !graph.dimension) {
    const labels = graph.series.map(graphSeriesLabel);
    return `${labels.join(" · ")} over time`;
  }
  const dimension = graph.dimension
    ? graphDimensionLabel(graph.dimension)
    : "Breakdown";
  return graph.chart_type === "donut" ||
    graph.chart_type === "pie" ||
    graph.chart_type === "treemap"
    ? `Share of ${dimension.toLowerCase()}`
    : `Top ${dimension.toLowerCase()}`;
}

function metricValueForDay(
  point: TimeseriesPoint | undefined,
  metric: OverviewMetric,
): number | null {
  if (!point) return metric === "bounceRate" || metric === "avgSessionTime" ? null : 0;
  const key = METRIC_PLOT[metric].sourceKey;
  const value = point[key];
  if (value === null || value === undefined) return null;
  return Number(value);
}

function filteredEventsForDay(
  stats: SiteStats,
  day: string,
  filter: EventFilter | null,
): number {
  const dayCounts = stats.customEventCountsByDay[day] ?? {};
  let total = 0;
  for (const [name, count] of Object.entries(dayCounts)) {
    if (matchesEventFilter(name, filter)) total += count;
  }
  return total;
}

export type ResolvedGraphData =
  | {
      kind: "metric-series";
      chart_type: "timeseries" | "line" | "bar";
      plotSeries: PlotSeries[];
      points: PlotPoint[];
    }
  | {
      kind: "breakdown";
      chart_type: "bar" | "column" | "donut" | "pie" | "treemap";
      dimension: GraphDimension;
      rows: BreakdownRow[];
    };

export function resolveGraphData(
  graph: SiteGraph,
  stats: SiteStats,
): ResolvedGraphData {
  // Legacy bar graphs stored a dimension instead of metric series.
  if (graph.chart_type === "bar" && graph.dimension) {
    return {
      kind: "breakdown",
      chart_type: "bar",
      dimension: graph.dimension,
      rows: breakdownRowsForDimension(stats, graph.dimension),
    };
  }

  if (
    graph.chart_type === "timeseries" ||
    graph.chart_type === "line" ||
    graph.chart_type === "bar"
  ) {
    const plotSeries: PlotSeries[] = graph.series.map((item, index) => {
      const meta = METRIC_PLOT[item.metric];
      return {
        dataKey: `s${index}`,
        label: graphSeriesLabel(item),
        color: meta.color,
        unit: meta.unit,
      };
    });

    const points: PlotPoint[] = stats.timeseries.map((point) => {
      const row: PlotPoint = { day: point.day };
      graph.series.forEach((item, index) => {
        const key = `s${index}`;
        if (item.metric === "events") {
          row[key] = filteredEventsForDay(stats, point.day, item.event_filter);
        } else {
          row[key] = metricValueForDay(point, item.metric);
        }
      });
      return row;
    });

    return {
      kind: "metric-series",
      chart_type: graph.chart_type,
      plotSeries,
      points,
    };
  }

  const dimension = graph.dimension ?? "pages";
  return {
    kind: "breakdown",
    chart_type: graph.chart_type,
    dimension,
    rows: breakdownRowsForDimension(stats, dimension),
  };
}
