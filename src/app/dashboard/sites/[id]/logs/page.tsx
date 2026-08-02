import { LogsView } from "@/components/dashboard/views/logs-view";
import { getSiteOrNotFound, parseDateRange } from "@/lib/site";
import { getSiteLogs, LOGS_PAGE_SIZE } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";

export default async function LogsPage({
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
  const logs = await getSiteLogs(supabase, site.id, range, LOGS_PAGE_SIZE);
  const hasMore = logs.length === LOGS_PAGE_SIZE;

  return (
    <LogsView
      siteId={site.id}
      range={range}
      logs={logs}
      hasMore={hasMore}
    />
  );
}
