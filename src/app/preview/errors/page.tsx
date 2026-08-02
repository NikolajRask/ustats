import { ErrorsView } from "@/components/dashboard/views/errors-view";
import {
  getPreviewDateRange,
  getPreviewErrorStats,
  PREVIEW_SITE_ID,
} from "@/lib/preview/sample-data";
import { parseDateRange } from "@/lib/site";

export default async function PreviewErrorsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const sp = await searchParams;
  const { days } = parseDateRange(sp.range);
  const range = getPreviewDateRange(days);
  const stats = getPreviewErrorStats(days);

  return (
    <ErrorsView
      siteId={PREVIEW_SITE_ID}
      range={range}
      stats={stats}
      readOnly
    />
  );
}
