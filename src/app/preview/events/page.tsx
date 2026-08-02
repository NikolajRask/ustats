import { CustomEventsView } from "@/components/dashboard/views/custom-events-view";
import {
  getPreviewStats,
  PREVIEW_EVENT_ALIASES,
  PREVIEW_SITE_ID,
} from "@/lib/preview/sample-data";
import { parseDateRange } from "@/lib/site";

export default async function PreviewEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const sp = await searchParams;
  const { days } = parseDateRange(sp.range);
  const stats = getPreviewStats(days);

  return (
    <CustomEventsView
      siteId={PREVIEW_SITE_ID}
      stats={stats}
      aliases={PREVIEW_EVENT_ALIASES}
      readOnly
    />
  );
}
