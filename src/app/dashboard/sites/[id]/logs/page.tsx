import { LogsTable } from "@/components/dashboard/logs-table";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight">
          Logs
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Recent events for this site in the selected range
        </p>
      </div>

      <Card className="gap-0 bg-card/80 py-0">
        <CardContent className="px-0">
          {logs.length === 0 ? (
            <div className="px-4 py-4">
              <h3 className="font-display text-lg font-semibold tracking-tight">
                Event stream
              </h3>
              <p className="mt-6 py-6 text-center text-sm text-muted-foreground">
                No events in this range yet.
              </p>
            </div>
          ) : (
            <LogsTable
              key={`${site.id}-${range.from}-${range.to}`}
              logs={logs}
              siteId={site.id}
              range={range}
              pageSize={LOGS_PAGE_SIZE}
              hasMore={hasMore}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
