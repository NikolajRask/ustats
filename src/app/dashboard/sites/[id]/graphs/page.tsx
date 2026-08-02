import { notFound } from "next/navigation";

import { GraphsDashboard } from "@/components/dashboard/graphs-dashboard";
import { isExperimentalEnabled } from "@/lib/experimental";
import { listSiteGraphs } from "@/lib/graphs";
import { getSiteOrNotFound, parseDateRange } from "@/lib/site";
import { getSiteStats } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";

export default async function GraphsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  if (!isExperimentalEnabled("graphs")) notFound();

  const { id } = await params;
  const sp = await searchParams;
  const { range } = parseDateRange(sp.range);
  const site = await getSiteOrNotFound(id);
  const supabase = await createClient();

  const [graphs, stats] = await Promise.all([
    listSiteGraphs(supabase, site.id),
    getSiteStats(supabase, site.id, range),
  ]);

  return (
    <GraphsDashboard siteId={site.id} graphs={graphs} stats={stats} />
  );
}
