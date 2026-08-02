import { LogsView } from "@/components/dashboard/views/logs-view";
import {
  getPreviewDateRange,
  getPreviewLogs,
  PREVIEW_SITE_ID,
} from "@/lib/preview/sample-data";
import { parseDateRange } from "@/lib/site";

export default async function PreviewLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const sp = await searchParams;
  const { days } = parseDateRange(sp.range);
  const range = getPreviewDateRange(days);
  const logs = getPreviewLogs(days);

  return (
    <LogsView
      siteId={PREVIEW_SITE_ID}
      range={range}
      logs={logs}
      hasMore={false}
      readOnly
    />
  );
}
