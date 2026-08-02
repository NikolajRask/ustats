import { TimeseriesChart } from "@/components/dashboard/charts";
import { ErrorsTable } from "@/components/dashboard/errors-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ERRORS_PAGE_SIZE, type ErrorStats } from "@/lib/errors";
import type { DateRange } from "@/lib/stats";

export function ErrorsView({
  siteId,
  range,
  stats,
  readOnly = false,
}: {
  siteId: string;
  range: DateRange;
  stats: ErrorStats;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight">
          Errors
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Grouped exceptions from your site. Auto-captured via the tracker, or
          call{" "}
          <code className="font-mono text-xs">
            ustats.captureException(error)
          </code>
          .
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card size="sm" className="bg-card/80">
          <CardHeader>
            <CardDescription className="text-[11px] tracking-[0.14em] uppercase">
              Events
            </CardDescription>
            <CardTitle className="font-display text-3xl font-semibold tracking-tight tabular-nums">
              {stats.totalEvents.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm" className="bg-card/80">
          <CardHeader>
            <CardDescription className="text-[11px] tracking-[0.14em] uppercase">
              Unresolved
            </CardDescription>
            <CardTitle className="font-display text-3xl font-semibold tracking-tight tabular-nums">
              {stats.unresolvedGroups.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm" className="bg-card/80">
          <CardHeader>
            <CardDescription className="text-[11px] tracking-[0.14em] uppercase">
              New issues
            </CardDescription>
            <CardTitle className="font-display text-3xl font-semibold tracking-tight tabular-nums">
              {stats.newGroups.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm" className="bg-card/80">
          <CardHeader>
            <CardDescription className="text-[11px] tracking-[0.14em] uppercase">
              Affected users
            </CardDescription>
            <CardTitle className="font-display text-3xl font-semibold tracking-tight tabular-nums">
              {stats.affectedVisitors.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm" className="bg-card/80">
          <CardHeader>
            <CardDescription className="text-[11px] tracking-[0.14em] uppercase">
              Affected user %
            </CardDescription>
            <CardTitle className="font-display text-3xl font-semibold tracking-tight tabular-nums">
              {stats.affectedUserPercent == null
                ? "—"
                : `${stats.affectedUserPercent}%`}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="overflow-hidden bg-card/80">
        <CardHeader className="border-b border-border/60">
          <CardTitle className="font-display text-lg font-semibold tracking-tight">
            Errors over time
          </CardTitle>
          <CardDescription>
            Daily error events in the selected range
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <TimeseriesChart
            data={stats.timeseries}
            variant="events"
            emptyMessage="No errors in this range yet."
          />
        </CardContent>
      </Card>

      <Card className="gap-0 bg-card/80 py-0">
        <CardContent className="px-0">
          {stats.groups.length === 0 ? (
            <div className="px-4 py-4">
              <h3 className="font-display text-lg font-semibold tracking-tight">
                Issues
              </h3>
              <p className="mt-6 py-6 text-center text-sm text-muted-foreground">
                No issues in this range yet.
              </p>
            </div>
          ) : (
            <ErrorsTable
              key={`${siteId}-${range.from}-${range.to}`}
              siteId={siteId}
              range={range}
              groups={stats.groups}
              pageSize={ERRORS_PAGE_SIZE}
              hasMore={stats.hasMore}
              readOnly={readOnly}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
