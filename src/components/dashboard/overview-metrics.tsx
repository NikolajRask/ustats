"use client";

import { useState } from "react";

import { TimeseriesChart } from "@/components/dashboard/charts";
import { StatCards } from "@/components/dashboard/stats";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { OverviewMetric, TimeseriesPoint } from "@/lib/stats";

const METRIC_COPY: Record<
  OverviewMetric,
  { title: string; description: string }
> = {
  visitors: {
    title: "Visitors over time",
    description: "Daily unique visitors for the selected range",
  },
  pageviews: {
    title: "Pageviews over time",
    description: "Daily pageviews for the selected range",
  },
  events: {
    title: "Custom events over time",
    description: "Daily custom events for the selected range",
  },
  bounceRate: {
    title: "Bounce rate over time",
    description: "Daily bounce rate for sessions that started each day",
  },
  avgSessionTime: {
    title: "Average session time",
    description: "Daily average session duration for the selected range",
  },
};

export function OverviewMetrics({
  pageviews,
  visitors,
  events,
  bounceRate,
  avgSessionSeconds,
  timeseries,
}: {
  pageviews: number;
  visitors: number;
  events: number;
  bounceRate: number | null;
  avgSessionSeconds: number | null;
  timeseries: TimeseriesPoint[];
}) {
  const [metric, setMetric] = useState<OverviewMetric>("pageviews");
  const copy = METRIC_COPY[metric];

  return (
    <div className="space-y-8">
      <StatCards
        pageviews={pageviews}
        visitors={visitors}
        events={events}
        bounceRate={bounceRate}
        avgSessionSeconds={avgSessionSeconds}
        activeMetric={metric}
        onMetricChange={setMetric}
      />

      <Card className="overflow-hidden bg-card/80">
        <CardHeader className="border-b border-border/60">
          <CardTitle className="font-display text-lg font-semibold tracking-tight">
            {copy.title}
          </CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <TimeseriesChart data={timeseries} metric={metric} />
        </CardContent>
      </Card>
    </div>
  );
}
