import { SiteOverviewView } from "@/components/dashboard/views/site-overview-view";
import { getSiteOrNotFound, parseDateRange } from "@/lib/site";
import { getSiteStats } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";

export default async function SiteOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const { range } = parseDateRange(sp.range);
  const site = await getSiteOrNotFound(id);
  const supabase = await createClient();
  const stats = await getSiteStats(supabase, site.id, range);
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  return (
    <SiteOverviewView
      stats={stats}
      siteId={site.id}
      publicKey={site.public_key}
      appUrl={appUrl}
      showEmbed
    />
  );
}
