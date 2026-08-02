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
import type { PreviewLiveEvent } from "@/lib/preview/sample-data";
import type { SiteStats } from "@/lib/stats";

export function SiteOverviewView({
  stats,
  siteId,
  publicKey,
  appUrl,
  showEmbed = true,
  readOnly = false,
  liveEvents,
}: {
  stats: SiteStats;
  siteId: string;
  publicKey?: string;
  appUrl?: string;
  showEmbed?: boolean;
  readOnly?: boolean;
  liveEvents?: PreviewLiveEvent[];
}) {
  return (
    <div className="space-y-8">
      {showEmbed && publicKey && appUrl ? (
        <EmbedSnippet appUrl={appUrl} publicKey={publicKey} />
      ) : null}

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
          <LiveFeed
            siteId={siteId}
            readOnly={readOnly}
            initialEvents={liveEvents}
          />
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
