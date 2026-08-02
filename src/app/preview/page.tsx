import { SiteOverviewView } from "@/components/dashboard/views/site-overview-view";
import {
  getPreviewLiveEvents,
  getPreviewStats,
  PREVIEW_SITE_ID,
} from "@/lib/preview/sample-data";
import { parseDateRange } from "@/lib/site";

export default async function PreviewOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const sp = await searchParams;
  const { days } = parseDateRange(sp.range);
  const stats = getPreviewStats(days);

  return (
    <SiteOverviewView
      stats={stats}
      siteId={PREVIEW_SITE_ID}
      showEmbed={false}
      readOnly
      liveEvents={getPreviewLiveEvents()}
    />
  );
}
