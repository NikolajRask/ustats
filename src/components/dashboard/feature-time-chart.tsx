"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import type { FeatureTimePoint, SiteFeature } from "@/lib/features";
import { featureSeriesKey } from "@/lib/features";
import { formatSessionDuration } from "@/lib/stats";
import { cn } from "@/lib/utils";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function formatDay(day: string) {
  const date = new Date(`${day}T00:00:00Z`);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatDayLong(day: string) {
  const date = new Date(`${day}T00:00:00Z`);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

type DayRow = {
  day: string;
  total: number;
  [key: string]: string | number;
};

export function FeatureTimeChart({
  features,
  days,
  points,
}: {
  features: SiteFeature[];
  days: string[];
  points: FeatureTimePoint[];
}) {
  const { data, config, rankKeys, colorByFeatureId, legend, maxSeconds } =
    useMemo(() => {
      const featureById = new Map(features.map((feature) => [feature.id, feature]));
      const colorById = new Map(
        features.map((feature, index) => [
          feature.id,
          CHART_COLORS[index % CHART_COLORS.length],
        ]),
      );

      const secondsByDayFeature = new Map<string, number>();
      const totals = new Map<string, number>();
      for (const feature of features) totals.set(feature.id, 0);

      for (const point of points) {
        if (!featureById.has(point.featureId)) continue;
        const key = `${point.day}::${point.featureId}`;
        secondsByDayFeature.set(
          key,
          (secondsByDayFeature.get(key) ?? 0) + point.seconds,
        );
        totals.set(
          point.featureId,
          (totals.get(point.featureId) ?? 0) + point.seconds,
        );
      }

      const daySegments = days.map((day) => {
        const segments = features
          .map((feature) => ({
            id: feature.id,
            name: feature.name,
            seconds: secondsByDayFeature.get(`${day}::${feature.id}`) ?? 0,
          }))
          .filter((segment) => segment.seconds > 0)
          // Most-used first → rank 0 → bottom of the stack for this day.
          .sort((a, b) => {
            const diff = b.seconds - a.seconds;
            if (diff !== 0) return diff;
            return a.name.localeCompare(b.name);
          });
        return { day, segments };
      });
      const maxRanks = Math.max(
        0,
        ...daySegments.map((entry) => entry.segments.length),
      );

      const ranks = Array.from({ length: maxRanks }, (_, index) => `r${index}`);

      const chartData: DayRow[] = daySegments.map(({ day, segments }) => {
        const row: DayRow = { day, total: 0 };
        segments.forEach((segment, index) => {
          row[`r${index}`] = segment.seconds;
          row[`r${index}Id`] = segment.id;
          row[`r${index}Name`] = segment.name;
          row.total += segment.seconds;
        });
        for (let index = segments.length; index < maxRanks; index++) {
          row[`r${index}`] = 0;
          row[`r${index}Id`] = "";
          row[`r${index}Name`] = "";
        }
        return row;
      });

      const max = Math.max(...chartData.map((row) => row.total), 0);

      const chartConfig: ChartConfig = {};
      for (const feature of features) {
        const key = featureSeriesKey(feature.id);
        chartConfig[key] = {
          label: feature.name,
          color: colorById.get(feature.id) ?? CHART_COLORS[0],
        };
      }
      ranks.forEach((rank) => {
        chartConfig[rank] = { label: rank };
      });

      const legendItems = [...features]
        .filter((feature) => (totals.get(feature.id) ?? 0) > 0)
        .sort(
          (a, b) => (totals.get(b.id) ?? 0) - (totals.get(a.id) ?? 0),
        )
        .map((feature) => ({
          id: feature.id,
          name: feature.name,
          color: colorById.get(feature.id) ?? CHART_COLORS[0],
        }));

      return {
        data: chartData,
        config: chartConfig,
        rankKeys: ranks,
        colorByFeatureId: colorById,
        legend: legendItems,
        maxSeconds: max,
      };
    }, [features, days, points]);

  if (features.length === 0 || days.length === 0 || maxSeconds === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed border-border/80 bg-muted/20">
        <p className="text-sm text-muted-foreground">
          No time on features in this range yet.
        </p>
      </div>
    );
  }

  const useMinutes = maxSeconds >= 120;
  const tickInterval = Math.max(Math.floor(data.length / 7) - 1, 0);

  return (
    <div className="space-y-3">
      <ChartContainer config={config} className="aspect-auto h-[280px] w-full">
        <BarChart
          accessibilityLayer
          data={data}
          margin={{ left: 4, right: 8, top: 8, bottom: 0 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            minTickGap={28}
            interval={tickInterval}
            tickFormatter={formatDay}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={44}
            allowDecimals={false}
            tickFormatter={(value: number) => {
              if (useMinutes) {
                const minutes = Math.round(value / 60);
                return minutes >= 60
                  ? `${Math.round(minutes / 60)}h`
                  : `${minutes}m`;
              }
              return `${value}s`;
            }}
          />
          <ChartTooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;

              const rows = payload
                .map((item) => {
                  const rank = String(item.name ?? item.dataKey ?? "");
                  const row = item.payload as DayRow | undefined;
                  const seconds =
                    typeof item.value === "number"
                      ? item.value
                      : Number(item.value);
                  if (!Number.isFinite(seconds) || seconds <= 0 || !row) {
                    return null;
                  }
                  const featureId = String(row[`${rank}Id`] ?? "");
                  const featureName = String(
                    row[`${rank}Name`] ?? rank,
                  );
                  return {
                    featureId,
                    featureName,
                    seconds,
                    color:
                      colorByFeatureId.get(featureId) ?? CHART_COLORS[0],
                  };
                })
                .filter(
                  (
                    row,
                  ): row is {
                    featureId: string;
                    featureName: string;
                    seconds: number;
                    color: string;
                  } => row != null,
                )
                // Match stack: largest at bottom of tooltip list feels odd;
                // show largest first in the tooltip instead.
                .sort((a, b) => b.seconds - a.seconds);

              if (rows.length === 0) return null;

              return (
                <div className="grid min-w-40 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
                  <div className="font-medium">
                    {typeof label === "string"
                      ? formatDayLong(label)
                      : String(label ?? "")}
                  </div>
                  <div className="grid gap-1.5">
                    {rows.map((row) => (
                      <div
                        key={row.featureId}
                        className="flex w-full items-center justify-between gap-8"
                      >
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <span
                            className="size-2 shrink-0 rounded-[2px]"
                            style={{ backgroundColor: row.color }}
                          />
                          {row.featureName}
                        </span>
                        <span className="font-mono font-medium text-foreground tabular-nums">
                          {formatSessionDuration(row.seconds)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }}
          />
          {rankKeys.map((rank, rankIndex) => (
            <Bar
              key={rank}
              dataKey={rank}
              name={rank}
              stackId="features"
              radius={rankIndex === rankKeys.length - 1 ? [3, 3, 0, 0] : 0}
            >
              {data.map((row) => {
                const featureId = String(row[`${rank}Id`] ?? "");
                return (
                  <Cell
                    key={`${row.day}-${rank}`}
                    fill={
                      featureId
                        ? (colorByFeatureId.get(featureId) ??
                          CHART_COLORS[0])
                        : "transparent"
                    }
                  />
                );
              })}
            </Bar>
          ))}
        </BarChart>
      </ChartContainer>

      {legend.length > 0 ? (
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 px-2">
          {legend.map((item) => (
            <li
              key={item.id}
              className={cn(
                "flex items-center gap-1.5 text-xs text-muted-foreground",
              )}
            >
              <span
                className="size-2 shrink-0 rounded-[2px]"
                style={{ backgroundColor: item.color }}
              />
              {item.name}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
