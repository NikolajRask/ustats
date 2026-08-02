import {
  ActivityIcon,
  ClockIcon,
  EyeIcon,
  MousePointerClickIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

import type { BreakdownRow, OverviewMetric } from "@/lib/stats";
import { formatSessionDuration } from "@/lib/stats";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const METRIC_ITEMS: {
  id: OverviewMetric;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: "visitors", label: "Unique visitors", icon: UsersIcon },
  { id: "pageviews", label: "Pageviews", icon: EyeIcon },
  { id: "events", label: "Custom events", icon: MousePointerClickIcon },
  { id: "bounceRate", label: "Bounce rate", icon: ActivityIcon },
  { id: "avgSessionTime", label: "Avg. session time", icon: ClockIcon },
];

export function StatCards({
  pageviews,
  visitors,
  events,
  bounceRate,
  avgSessionSeconds,
  activeMetric,
  onMetricChange,
}: {
  pageviews: number;
  visitors: number;
  events: number;
  bounceRate: number | null;
  avgSessionSeconds: number | null;
  activeMetric?: OverviewMetric;
  onMetricChange?: (metric: OverviewMetric) => void;
}) {
  const values: Record<OverviewMetric, string> = {
    visitors: visitors.toLocaleString(),
    pageviews: pageviews.toLocaleString(),
    events: events.toLocaleString(),
    bounceRate: bounceRate === null ? "—" : `${bounceRate}%`,
    avgSessionTime: formatSessionDuration(avgSessionSeconds),
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {METRIC_ITEMS.map((item) => {
        const selected = activeMetric === item.id;
        const interactive = Boolean(onMetricChange);

        return (
          <Card
            key={item.id}
            size="sm"
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-pressed={interactive ? selected : undefined}
            onClick={
              interactive ? () => onMetricChange?.(item.id) : undefined
            }
            onKeyDown={
              interactive
                ? (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onMetricChange?.(item.id);
                    }
                  }
                : undefined
            }
            className={cn(
              "relative overflow-hidden bg-card/80 transition-[box-shadow,background-color]",
              interactive &&
                "cursor-pointer hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected && "bg-card ring-2 ring-primary/50",
            )}
          >
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent to-transparent",
                selected ? "via-primary/70" : "via-primary/40",
              )}
            />
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div className="space-y-1.5">
                <CardDescription className="text-[11px] tracking-[0.14em] uppercase">
                  {item.label}
                </CardDescription>
                <CardTitle className="font-display text-3xl font-semibold tracking-tight tabular-nums">
                  {values[item.id]}
                </CardTitle>
              </div>
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg text-primary",
                  selected ? "bg-primary/15" : "bg-accent-soft",
                )}
              >
                <item.icon className="size-4" />
              </div>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
}

export function BreakdownList({
  title,
  rows,
  metric = "Views",
}: {
  title: string;
  rows: BreakdownRow[];
  metric?: string;
}) {
  const max = Math.max(...rows.map((r) => r.count), 1);

  return (
    <Card size="sm" className="bg-card/80">
      <CardHeader className="border-b border-border/60">
        <CardTitle className="text-[11px] font-medium tracking-[0.14em] uppercase">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-1">
        {rows.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">No data</p>
        ) : (
          <ul className="divide-y divide-border/50">
            {rows.map((row) => (
              <li key={row.key} className="relative py-2.5">
                <div
                  aria-hidden
                  className="absolute inset-y-1 left-0 rounded-md bg-primary/10"
                  style={{ width: `${Math.max((row.count / max) * 100, 2)}%` }}
                />
                <div className="relative flex items-center justify-between gap-3 px-2">
                  <span className="min-w-0 truncate font-mono text-[13px]">
                    {row.key}
                  </span>
                  <div className="flex shrink-0 items-baseline gap-3 tabular-nums">
                    <span className="text-sm font-medium">
                      {row.count.toLocaleString()}
                    </span>
                    <span className="w-14 text-right text-xs text-muted-foreground">
                      {row.visitors.toLocaleString()}{" "}
                      <span className="sr-only">visitors</span>
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {rows.length > 0 ? (
          <p className="mt-2 px-2 text-[11px] tracking-wide text-muted-foreground uppercase">
            {metric} · Visitors
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function EmbedSnippet({
  appUrl,
  publicKey,
}: {
  appUrl: string;
  publicKey: string;
}) {
  const snippet = `<script defer data-key="${publicKey}" src="${appUrl}/script.js"></script>`;

  return (
    <details className="group rounded-xl bg-card/80 ring-1 ring-foreground/10 open:pb-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm marker:content-none [&::-webkit-details-marker]:hidden">
        <div>
          <p className="font-medium">Embed snippet</p>
          <p className="text-xs text-muted-foreground">
            Drop this before{" "}
            <code className="font-mono">&lt;/head&gt;</code> to start tracking
          </p>
        </div>
        <span className="rounded-md border px-2 py-1 text-xs text-muted-foreground transition-colors group-open:bg-muted group-open:[&>span:first-child]:hidden group-open:[&>span:last-child]:inline">
          <span>Show</span>
          <span className="hidden">Hide</span>
        </span>
      </summary>
      <div className="space-y-3 border-t border-border/60 px-4 py-3">
        <p className="text-xs text-muted-foreground">
          Custom events:{" "}
          <code className="font-mono">ustats.track(&apos;signup&apos;)</code>
          {" · "}
          Errors:{" "}
          <code className="font-mono">ustats.captureException(error)</code>
        </p>
        <pre className="overflow-x-auto rounded-lg bg-foreground px-3 py-3 font-mono text-xs text-background">
          {snippet}
        </pre>
      </div>
    </details>
  );
}
