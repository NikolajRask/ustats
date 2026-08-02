import { LogsTable } from "@/components/dashboard/logs-table";
import { Card, CardContent } from "@/components/ui/card";
import { LOGS_PAGE_SIZE, type DateRange, type EventLogRow } from "@/lib/stats";

export function LogsView({
  siteId,
  range,
  logs,
  hasMore,
  readOnly = false,
}: {
  siteId: string;
  range: DateRange;
  logs: EventLogRow[];
  hasMore: boolean;
  readOnly?: boolean;
}) {
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
              key={`${siteId}-${range.from}-${range.to}`}
              logs={logs}
              siteId={siteId}
              range={range}
              pageSize={LOGS_PAGE_SIZE}
              hasMore={hasMore}
              readOnly={readOnly}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
