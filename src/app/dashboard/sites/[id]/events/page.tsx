import { TimeseriesChart } from "@/components/dashboard/charts";
import { BreakdownList } from "@/components/dashboard/stats";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSiteOrNotFound, parseDateRange } from "@/lib/site";
import { getSiteStats } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";

export default async function CustomEventsPage({
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
  const stats = await getSiteStats(supabase, site.id, range);
  const uniqueEvents = stats.customEvents.length;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight">
          Custom events
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Track conversions and actions with{" "}
          <code className="font-mono text-xs">ustats.track(&apos;name&apos;)</code>
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card size="sm" className="bg-card/80">
          <CardHeader>
            <CardDescription className="text-[11px] tracking-[0.14em] uppercase">
              Total events
            </CardDescription>
            <CardTitle className="font-display text-3xl font-semibold tracking-tight tabular-nums">
              {stats.events.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm" className="bg-card/80">
          <CardHeader>
            <CardDescription className="text-[11px] tracking-[0.14em] uppercase">
              Event names
            </CardDescription>
            <CardTitle className="font-display text-3xl font-semibold tracking-tight tabular-nums">
              {uniqueEvents.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm" className="bg-card/80">
          <CardHeader>
            <CardDescription className="text-[11px] tracking-[0.14em] uppercase">
              Visitors
            </CardDescription>
            <CardTitle className="font-display text-3xl font-semibold tracking-tight tabular-nums">
              {stats.eventVisitors.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="overflow-hidden bg-card/80">
        <CardHeader className="border-b border-border/60">
          <CardTitle className="font-display text-lg font-semibold tracking-tight">
            Events over time
          </CardTitle>
          <CardDescription>
            Daily custom events and unique visitors who fired them
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <TimeseriesChart
            data={stats.eventTimeseries}
            variant="events"
            emptyMessage="No custom events in this range yet."
          />
        </CardContent>
      </Card>

      <BreakdownList
        title="Event names"
        rows={stats.customEvents}
        metric="Events"
      />
    </div>
  );
}
