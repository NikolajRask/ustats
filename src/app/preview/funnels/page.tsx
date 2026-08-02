import { FunnelsView } from "@/components/dashboard/views/funnels-view";
import { parseFunnelDateRange } from "@/lib/funnels";
import {
  getPreviewFunnels,
  getPreviewFunnelStats,
  PREVIEW_SITE_ID,
} from "@/lib/preview/sample-data";

export default async function PreviewFunnelsPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    funnel?: string;
  }>;
}) {
  const sp = await searchParams;
  const { fromDate, toDate } = parseFunnelDateRange(sp);
  const funnels = getPreviewFunnels();
  const selectedFunnel =
    funnels.find((funnel) => funnel.id === sp.funnel) ?? funnels[0] ?? null;

  return (
    <FunnelsView
      siteId={PREVIEW_SITE_ID}
      funnels={funnels}
      selectedFunnel={selectedFunnel}
      stats={selectedFunnel ? getPreviewFunnelStats() : null}
      fromDate={fromDate}
      toDate={toDate}
      readOnly
    />
  );
}
