import { TimeseriesChart } from "@/components/dashboard/charts";
import { CustomEventsList } from "@/components/dashboard/custom-events-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { EventAliasMap } from "@/lib/event-aliases";
import type { SiteStats } from "@/lib/stats";

export function CustomEventsView({
  siteId,
  stats,
  aliases,
  readOnly = false,
}: {
  siteId: string;
  stats: SiteStats;
  aliases: EventAliasMap;
  readOnly?: boolean;
}) {
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

      <CustomEventsList
        siteId={siteId}
        rows={stats.customEvents}
        eventTimeseries={stats.eventTimeseries}
        countsByDay={stats.customEventCountsByDay}
        visitorsByDay={stats.customEventVisitorsByDay}
        aliases={aliases}
        readOnly={readOnly}
      />
    </div>
  );
}
