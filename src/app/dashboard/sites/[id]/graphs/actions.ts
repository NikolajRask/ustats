"use server";

import { revalidatePath } from "next/cache";

import {
  normalizeSiteGraphInput,
  validateSiteGraphInput,
  type GraphChartType,
  type GraphDimension,
  type GraphSeries,
  type SiteGraphInput,
} from "@/lib/graphs";
import type { OverviewMetric } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";

export type GraphActionResult =
  | { ok: true; graphId: string }
  | { ok: false; error: string };

function parseSeries(formData: FormData): GraphSeries[] {
  const raw = String(formData.get("series") || "");
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as GraphSeries[];
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // fall through
    }
  }

  const metrics = formData
    .getAll("metrics")
    .map((value) => String(value))
    .filter(Boolean) as OverviewMetric[];
  const metric = String(formData.get("metric") || "pageviews") as OverviewMetric;
  const list = metrics.length > 0 ? metrics : [metric];
  return list.map((item) => ({ metric: item, event_filter: null }));
}

function parseInput(formData: FormData): SiteGraphInput | { error: string } {
  const name = String(formData.get("name") || "");
  const chartType = String(formData.get("chartType") || "") as GraphChartType;
  const metric = String(formData.get("metric") || "pageviews") as OverviewMetric;
  const series = parseSeries(formData);
  const dimensionRaw = String(formData.get("dimension") || "");
  const dimension =
    dimensionRaw === "" ? null : (dimensionRaw as GraphDimension);

  const input = normalizeSiteGraphInput({
    name,
    chart_type: chartType,
    metric,
    metrics: series.map((item) => item.metric),
    series,
    dimension,
  });

  const validationError = validateSiteGraphInput(input);
  if (validationError) return { error: validationError };
  return input;
}

export async function createGraph(
  formData: FormData,
): Promise<GraphActionResult> {
  const siteId = String(formData.get("siteId") || "");
  if (!siteId) return { ok: false, error: "Site is required" };

  const parsed = parseInput(formData);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  const supabase = await createClient();
  const graphId = crypto.randomUUID();

  const { error } = await supabase.from("site_graphs").insert({
    id: graphId,
    site_id: siteId,
    name: parsed.name,
    chart_type: parsed.chart_type,
    metric: parsed.metric,
    metrics: parsed.metrics,
    series: parsed.series,
    dimension: parsed.dimension,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/dashboard/sites/${siteId}/graphs`);
  return { ok: true, graphId };
}

export async function updateGraph(
  formData: FormData,
): Promise<GraphActionResult> {
  const siteId = String(formData.get("siteId") || "");
  const graphId = String(formData.get("graphId") || "");
  if (!siteId || !graphId) {
    return { ok: false, error: "Graph is required" };
  }

  const parsed = parseInput(formData);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("site_graphs")
    .update({
      name: parsed.name,
      chart_type: parsed.chart_type,
      metric: parsed.metric,
      metrics: parsed.metrics,
      series: parsed.series,
      dimension: parsed.dimension,
      updated_at: new Date().toISOString(),
    })
    .eq("id", graphId)
    .eq("site_id", siteId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/dashboard/sites/${siteId}/graphs`);
  return { ok: true, graphId };
}

export async function deleteGraph(formData: FormData) {
  const siteId = String(formData.get("siteId") || "");
  const graphId = String(formData.get("graphId") || "");
  if (!siteId || !graphId) return;

  const supabase = await createClient();
  await supabase
    .from("site_graphs")
    .delete()
    .eq("id", graphId)
    .eq("site_id", siteId);

  revalidatePath(`/dashboard/sites/${siteId}/graphs`);
}
