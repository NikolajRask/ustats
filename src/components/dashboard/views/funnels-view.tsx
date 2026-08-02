import { Suspense } from "react";

import { FunnelDashboard } from "@/components/dashboard/funnel-dashboard";
import type { Funnel, FunnelStats } from "@/lib/funnels";

export function FunnelsView({
  siteId,
  funnels,
  selectedFunnel,
  stats,
  fromDate,
  toDate,
  error,
  readOnly = false,
}: {
  siteId: string;
  funnels: Funnel[];
  selectedFunnel: Funnel | null;
  stats: FunnelStats | null;
  fromDate: string;
  toDate: string;
  error?: string;
  readOnly?: boolean;
}) {
  return (
    <Suspense
      fallback={
        <div className="h-64 animate-pulse rounded-xl border border-border/70 bg-card/60" />
      }
    >
      <FunnelDashboard
        siteId={siteId}
        funnels={funnels}
        selectedFunnel={selectedFunnel}
        stats={stats}
        fromDate={fromDate}
        toDate={toDate}
        error={error}
        readOnly={readOnly}
      />
    </Suspense>
  );
}
