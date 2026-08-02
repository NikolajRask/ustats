import { Suspense } from "react";

import { FunnelDashboard } from "@/components/dashboard/funnel-dashboard";
import {
  getFunnelStats,
  listFunnels,
  parseFunnelDateRange,
} from "@/lib/funnels";
import { getSiteOrNotFound } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export default async function FunnelsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    from?: string;
    to?: string;
    funnel?: string;
    error?: string;
  }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const site = await getSiteOrNotFound(id);
  const { fromDate, toDate, range } = parseFunnelDateRange(sp);
  const supabase = await createClient();
  const funnels = await listFunnels(supabase, site.id);

  const selectedFunnel =
    funnels.find((funnel) => funnel.id === sp.funnel) ?? funnels[0] ?? null;

  const stats = selectedFunnel
    ? await getFunnelStats(supabase, site.id, selectedFunnel.steps, range)
    : null;

  return (
    <Suspense
      fallback={
        <div className="h-64 animate-pulse rounded-xl border border-border/70 bg-card/60" />
      }
    >
      <FunnelDashboard
        siteId={site.id}
        funnels={funnels}
        selectedFunnel={selectedFunnel}
        stats={stats}
        fromDate={fromDate}
        toDate={toDate}
        error={sp.error}
      />
    </Suspense>
  );
}
