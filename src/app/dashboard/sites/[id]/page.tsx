import { DistributionDonut } from "@/components/dashboard/charts";
import { LiveFeed } from "@/components/dashboard/live-feed";
import { OverviewMetrics } from "@/components/dashboard/overview-metrics";
import {
  BreakdownList,
  EmbedSnippet,
} from "@/components/dashboard/stats";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className="space-y-8">
      <EmbedSnippet appUrl={appUrl} publicKey={site.public_key} />

      <OverviewMetrics
        pageviews={stats.pageviews}
        visitors={stats.visitors}
        events={stats.events}
        bounceRate={stats.bounceRate}
        avgSessionSeconds={stats.avgSessionSeconds}
        timeseries={stats.timeseries}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-card/80">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="text-[11px] font-medium tracking-[0.14em] uppercase">
              Devices
            </CardTitle>
            <CardDescription>Share of pageviews by device</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <DistributionDonut rows={stats.topDevices} />
          </CardContent>
        </Card>

        <Card className="bg-card/80">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="text-[11px] font-medium tracking-[0.14em] uppercase">
              Browsers
            </CardTitle>
            <CardDescription>Top browsers by pageviews</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <DistributionDonut rows={stats.topBrowsers} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <LiveFeed siteId={site.id} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-2">
          <BreakdownList title="Top pages" rows={stats.topPages} />
          <BreakdownList title="Referrers" rows={stats.topReferrers} />
          <BreakdownList title="UTM sources" rows={stats.topSources} />
          <BreakdownList title="UTM mediums" rows={stats.topMediums} />
          <BreakdownList title="UTM campaigns" rows={stats.topCampaigns} />
        </div>
      </div>
    </div>
  );
}
