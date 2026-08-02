import { Suspense } from "react";
import { notFound } from "next/navigation";

import { FeaturesDashboard } from "@/components/dashboard/features-dashboard";
import { isExperimentalEnabled } from "@/lib/experimental";
import { getSiteFeatureStats, listFeatures } from "@/lib/features";
import { getSiteOrNotFound, parseDateRange } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export default async function FeaturesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ range?: string; error?: string }>;
}) {
  if (!isExperimentalEnabled("features")) notFound();

  const { id } = await params;
  const sp = await searchParams;
  const { range } = parseDateRange(sp.range);
  const site = await getSiteOrNotFound(id);
  const supabase = await createClient();
  const [features, stats] = await Promise.all([
    listFeatures(supabase, site.id),
    getSiteFeatureStats(supabase, site.id, range),
  ]);

  return (
    <Suspense
      fallback={
        <div className="h-64 animate-pulse rounded-xl border border-border/70 bg-card/60" />
      }
    >
      <FeaturesDashboard
        siteId={site.id}
        features={features}
        stats={stats}
        error={sp.error}
      />
    </Suspense>
  );
}
