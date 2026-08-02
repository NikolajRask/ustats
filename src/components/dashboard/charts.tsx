"use client";

import { useMemo } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Label,
  Line,
  Pie,
  PieChart,
  Treemap,
  XAxis,
  YAxis,
} from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type {
  BreakdownRow,
  OverviewMetric,
  TimeseriesPoint,
} from "@/lib/stats";
import type { PlotPoint, PlotSeries } from "@/lib/graphs";
import { formatSessionDuration } from "@/lib/stats";
import { countryDisplayName } from "@/lib/country-name";
import { cn } from "@/lib/utils";

const timeseriesConfig = {
  pageviews: {
    label: "Pageviews",
    color: "var(--chart-1)",
  },
  visitors: {
    label: "Visitors",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const eventTimeseriesConfig = {
  pageviews: {
    label: "Events",
    color: "var(--chart-1)",
  },
  visitors: {
    label: "Visitors",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const metricSeriesConfig: Record<
  OverviewMetric,
  { dataKey: string; label: string; color: string; unit?: "percent" | "duration" }
> = {
  visitors: {
    dataKey: "visitors",
    label: "Visitors",
    color: "var(--chart-2)",
  },
  pageviews: {
    dataKey: "pageviews",
    label: "Pageviews",
    color: "var(--chart-1)",
  },
  events: {
    dataKey: "events",
    label: "Events",
    color: "var(--chart-3)",
  },
  bounceRate: {
    dataKey: "bounceRate",
    label: "Bounce rate",
    color: "var(--chart-4)",
    unit: "percent",
  },
  avgSessionTime: {
    dataKey: "avgSessionSeconds",
    label: "Avg. session",
    color: "var(--chart-5)",
    unit: "duration",
  },
};

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

/** Solid mint fill: darker when fuller, lighter when smaller. */
function intensityFill(ratio: number) {
  const t = Math.min(1, Math.max(ratio, 0));
  const strength = Math.round(22 + t * 68);
  return `color-mix(in oklch, var(--primary) ${strength}%, transparent)`;
}

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

export function TimeseriesChart({
  data,
  emptyMessage = "No pageviews in this range yet.",
  variant = "traffic",
  metric,
  metrics,
  plotSeries,
  plotData,
  style = "area",
}: {
  data?: TimeseriesPoint[];
  emptyMessage?: string;
  variant?: "traffic" | "events";
  metric?: OverviewMetric;
  metrics?: OverviewMetric[];
  plotSeries?: PlotSeries[];
  plotData?: PlotPoint[];
  style?: "area" | "line";
}) {
  const seriesList: PlotSeries[] = plotSeries?.length
    ? plotSeries
    : (metrics?.length ? metrics : metric ? [metric] : []).map((key) => {
        const series = metricSeriesConfig[key];
        return {
          dataKey: series.dataKey,
          label: series.label,
          color: series.color,
          unit: series.unit,
        };
      });

  const chartData: PlotPoint[] =
    plotData ??
    (data ?? []).map((point) => ({
      day: point.day,
      pageviews: point.pageviews,
      visitors: point.visitors,
      events: point.events,
      bounceRate: point.bounceRate,
      avgSessionSeconds: point.avgSessionSeconds,
    }));

  const hasTraffic = seriesList.length
    ? seriesList.some((series) =>
        series.unit
          ? chartData.some((d) => {
              const value = d[series.dataKey];
              return value !== null && value !== undefined;
            })
          : chartData.some((d) => Number(d[series.dataKey] ?? 0) > 0),
      )
    : chartData.some(
        (d) => Number(d.pageviews ?? 0) > 0 || Number(d.visitors ?? 0) > 0,
      );

  const config = seriesList.length
    ? (Object.fromEntries(
        seriesList.map((series) => [
          series.dataKey,
          { label: series.label, color: series.color },
        ]),
      ) as ChartConfig)
    : variant === "events"
      ? eventTimeseriesConfig
      : timeseriesConfig;

  if (!hasTraffic) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed border-border/80 bg-muted/20">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const tickInterval = Math.max(Math.floor(chartData.length / 7) - 1, 0);
  const hasPercent = seriesList.some((series) => series.unit === "percent");
  const hasDuration = seriesList.some((series) => series.unit === "duration");
  const yTickFormatter = (value: number) => {
    if (seriesList.length === 1 && seriesList[0]?.unit === "percent") {
      return `${value}%`;
    }
    if (seriesList.length === 1 && seriesList[0]?.unit === "duration") {
      if (value < 60) return `${value}s`;
      return `${Math.round(value / 60)}m`;
    }
    return String(value);
  };

  const primarySeries = seriesList[0] ?? null;
  const strokeColor = primarySeries
    ? `var(--color-${primarySeries.dataKey})`
    : "var(--color-pageviews)";

  return (
    <ChartContainer
      config={config}
      className="aspect-auto h-[280px] w-full"
    >
      <ComposedChart
        accessibilityLayer
        data={chartData}
        margin={{ left: 4, right: 8, top: 8, bottom: 0 }}
      >
        {style === "area" ? (
          <defs>
            {seriesList.length ? (
              seriesList.map((series) => (
                <linearGradient
                  key={series.dataKey}
                  id={`fillSeries-${series.dataKey}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={`var(--color-${series.dataKey})`}
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="95%"
                    stopColor={`var(--color-${series.dataKey})`}
                    stopOpacity={0.02}
                  />
                </linearGradient>
              ))
            ) : (
              <linearGradient id="fillSeries" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.35} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0.02} />
              </linearGradient>
            )}
          </defs>
        ) : null}
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
          width={hasPercent || hasDuration ? 44 : 36}
          allowDecimals={false}
          tickFormatter={seriesList.length ? yTickFormatter : undefined}
          domain={
            seriesList.length === 1 && seriesList[0]?.unit === "percent"
              ? [0, 100]
              : undefined
          }
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(value) =>
                typeof value === "string" ? formatDayLong(value) : String(value)
              }
              indicator="dot"
              formatter={(value, name) => {
                const series = seriesList.find((item) => item.dataKey === name);
                const num =
                  typeof value === "number" ? value : Number(value);
                const label = series?.label ?? String(name);
                const display =
                  series?.unit === "percent"
                    ? `${num}%`
                    : series?.unit === "duration"
                      ? formatSessionDuration(num)
                      : num.toLocaleString();

                return (
                  <div className="flex flex-1 items-center justify-between gap-8 leading-none">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-mono font-medium text-foreground tabular-nums">
                      {display}
                    </span>
                  </div>
                );
              }}
            />
          }
        />
        {seriesList.length ? (
          <>
            {seriesList.length > 1 ? (
              <ChartLegend content={<ChartLegendContent />} />
            ) : null}
            {seriesList.map((series) =>
              style === "area" ? (
                <Area
                  key={series.dataKey}
                  dataKey={series.dataKey}
                  type="monotone"
                  fill={`url(#fillSeries-${series.dataKey})`}
                  stroke={`var(--color-${series.dataKey})`}
                  strokeWidth={2}
                  name={series.dataKey}
                  connectNulls={false}
                />
              ) : (
                <Line
                  key={series.dataKey}
                  dataKey={series.dataKey}
                  type="monotone"
                  stroke={`var(--color-${series.dataKey})`}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3 }}
                  name={series.dataKey}
                  connectNulls={false}
                />
              ),
            )}
          </>
        ) : (
          <>
            <ChartLegend content={<ChartLegendContent />} />
            {style === "area" ? (
              <Area
                dataKey="pageviews"
                type="monotone"
                fill="url(#fillSeries)"
                stroke="var(--color-pageviews)"
                strokeWidth={2}
              />
            ) : (
              <Line
                dataKey="pageviews"
                type="monotone"
                stroke="var(--color-pageviews)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
              />
            )}
            <Line
              dataKey="visitors"
              type="monotone"
              stroke="var(--color-visitors)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
            />
          </>
        )}
      </ComposedChart>
    </ChartContainer>
  );
}

function resolveLabel(
  key: string,
  labelAs?: "country",
) {
  if (labelAs === "country") return countryDisplayName(key);
  return key;
}

export function DistributionDonut({
  rows,
  metric = "Views",
  labelAs,
  showLegend = true,
  size = "md",
  variant = "donut",
  className,
}: {
  rows: BreakdownRow[];
  metric?: string;
  labelAs?: "country";
  showLegend?: boolean;
  size?: "md" | "lg";
  variant?: "donut" | "pie";
  className?: string;
}) {
  const { data, config, total } = useMemo(() => {
    const top = rows.slice(0, 5);
    const chartData = top.map((row, index) => {
      const key = `item_${index}`;
      const label = resolveLabel(row.key, labelAs);
      return {
        key,
        name: label,
        value: row.count,
        visitors: row.visitors,
        fill: `var(--color-${key})`,
      };
    });

    const chartConfig: ChartConfig = {
      value: { label: metric },
    };
    top.forEach((row, index) => {
      chartConfig[`item_${index}`] = {
        label: resolveLabel(row.key, labelAs),
        color: CHART_COLORS[index % CHART_COLORS.length],
      };
    });

    return {
      data: chartData,
      config: chartConfig,
      total: top.reduce((sum, row) => sum + row.count, 0),
    };
  }, [rows, metric, labelAs]);

  if (data.length === 0 || total === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-sm text-muted-foreground">No data</p>
      </div>
    );
  }

  const chartSize = size === "lg" ? 220 : 180;
  const outer = size === "lg" ? 96 : 78;
  const inner = variant === "pie" ? 0 : size === "lg" ? 62 : 52;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <ChartContainer
        config={config}
        className="mx-auto aspect-square"
        style={{ height: chartSize }}
      >
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                nameKey="key"
                hideLabel
                formatter={(value, _name, item) => {
                  const num =
                    typeof value === "number" ? value : Number(value);
                  const percent =
                    total > 0 ? Math.round((num / total) * 100) : 0;
                  const label =
                    item?.payload &&
                    typeof item.payload === "object" &&
                    "name" in item.payload
                      ? String(item.payload.name)
                      : metric;

                  return (
                    <div className="flex flex-1 items-center justify-between gap-8 leading-none">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-mono font-medium text-foreground tabular-nums">
                        {num.toLocaleString()} · {percent}%
                      </span>
                    </div>
                  );
                }}
              />
            }
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="key"
            innerRadius={inner}
            outerRadius={outer}
            strokeWidth={2}
            stroke="var(--background)"
          >
            {data.map((entry) => (
              <Cell key={entry.key} fill={entry.fill} />
            ))}
            {variant === "donut" ? (
              <Label
                content={({ viewBox }) => {
                  if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) {
                    return null;
                  }
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy ?? 0) - 6}
                        className="fill-foreground font-display text-xl font-semibold tabular-nums"
                      >
                        {total.toLocaleString()}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy ?? 0) + 14}
                        className="fill-muted-foreground text-[10px] tracking-wide uppercase"
                      >
                        {metric}
                      </tspan>
                    </text>
                  );
                }}
              />
            ) : null}
          </Pie>
        </PieChart>
      </ChartContainer>

      {showLegend ? (
        <ul className="space-y-1.5 px-1">
          {data.map((entry, index) => {
            const percent =
              total > 0 ? Math.round((entry.value / total) * 100) : 0;
            return (
              <li
                key={entry.key}
                className="flex items-center justify-between gap-3 text-xs"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden
                    className="size-2 shrink-0 rounded-full"
                    style={{
                      background: CHART_COLORS[index % CHART_COLORS.length],
                    }}
                  />
                  <span className="truncate text-muted-foreground">
                    {entry.name}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums text-foreground">
                  {percent}%
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function formatAxisCount(value: number) {
  if (value >= 1000) return `${Math.round(value / 100) / 10}k`;
  return String(value);
}

export function HorizontalBarChart({
  rows,
  metric = "Views",
  limit = 6,
  height = 220,
  labelAs,
  colorScale = false,
}: {
  rows: BreakdownRow[];
  metric?: string;
  limit?: number;
  height?: number;
  labelAs?: "country";
  colorScale?: boolean;
}) {
  const { data, config, max } = useMemo(() => {
    const top = rows.slice(0, limit);
    const chartData = top.map((row) => ({
      name: resolveLabel(row.key, labelAs),
      code: row.key,
      count: row.count,
      visitors: row.visitors,
    }));
    const maxCount = Math.max(...chartData.map((d) => d.count), 1);

    const chartConfig = {
      count: {
        label: metric,
        color: "var(--chart-1)",
      },
    } satisfies ChartConfig;

    return { data: chartData, config: chartConfig, max: maxCount };
  }, [rows, metric, limit, labelAs]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-sm text-muted-foreground">No data</p>
      </div>
    );
  }

  // Wider labels for "City · Country" style keys
  const labelWidth = labelAs === "country" ? 118 : 140;

  return (
    <ChartContainer
      config={config}
      className="aspect-auto w-full"
      style={{ height }}
    >
      <BarChart
        accessibilityLayer
        data={data}
        layout="vertical"
        margin={{ left: 4, right: 8, top: 4, bottom: 8 }}
      >
        <CartesianGrid
          horizontal={false}
          vertical
          strokeDasharray="3 3"
          syncWithTicks
        />
        <YAxis
          dataKey="name"
          type="category"
          tickLine={false}
          axisLine={false}
          width={labelWidth}
          tickFormatter={(value: string) =>
            value.length > (labelAs === "country" ? 16 : 20)
              ? `${value.slice(0, labelAs === "country" ? 15 : 19)}…`
              : value
          }
        />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tickMargin={6}
          tickCount={5}
          domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.02)]}
          allowDecimals={false}
          tickFormatter={formatAxisCount}
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          content={
            <ChartTooltipContent
              labelKey="name"
              formatter={(value, _name, item) => {
                const num =
                  typeof value === "number" ? value : Number(value);
                const visitors =
                  item?.payload &&
                  typeof item.payload === "object" &&
                  "visitors" in item.payload
                    ? Number(item.payload.visitors)
                    : null;

                return (
                  <div className="flex flex-1 flex-col gap-1 leading-none">
                    <div className="flex items-center justify-between gap-8">
                      <span className="text-muted-foreground">{metric}</span>
                      <span className="font-mono font-medium text-foreground tabular-nums">
                        {num.toLocaleString()}
                      </span>
                    </div>
                    {visitors != null ? (
                      <div className="flex items-center justify-between gap-8">
                        <span className="text-muted-foreground">Visitors</span>
                        <span className="font-mono font-medium text-foreground tabular-nums">
                          {visitors.toLocaleString()}
                        </span>
                      </div>
                    ) : null}
                  </div>
                );
              }}
            />
          }
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18}>
          {data.map((entry) => (
            <Cell
              key={entry.code}
              fill={
                colorScale
                  ? intensityFill(entry.count / max)
                  : "var(--color-count)"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

export function VerticalBarChart({
  rows,
  metric = "Views",
  limit = 8,
  height = 260,
  labelAs,
  colorScale = false,
}: {
  rows: BreakdownRow[];
  metric?: string;
  limit?: number;
  height?: number;
  labelAs?: "country";
  colorScale?: boolean;
}) {
  const { data, config, max } = useMemo(() => {
    const top = rows.slice(0, limit);
    const chartData = top.map((row) => ({
      name: resolveLabel(row.key, labelAs),
      code: row.key,
      count: row.count,
      visitors: row.visitors,
    }));
    const maxCount = Math.max(...chartData.map((d) => d.count), 1);

    const chartConfig = {
      count: {
        label: metric,
        color: "var(--chart-1)",
      },
    } satisfies ChartConfig;

    return { data: chartData, config: chartConfig, max: maxCount };
  }, [rows, metric, limit, labelAs]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-sm text-muted-foreground">No data</p>
      </div>
    );
  }

  const tickMaxLen = labelAs === "country" ? 10 : 12;

  return (
    <ChartContainer
      config={config}
      className="aspect-auto w-full"
      style={{ height }}
    >
      <BarChart
        accessibilityLayer
        data={data}
        margin={{ left: 4, right: 8, top: 8, bottom: 4 }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval={0}
          tickFormatter={(value: string) =>
            value.length > tickMaxLen
              ? `${value.slice(0, tickMaxLen - 1)}…`
              : value
          }
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={36}
          allowDecimals={false}
          tickFormatter={formatAxisCount}
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          content={
            <ChartTooltipContent
              labelKey="name"
              formatter={(value, _name, item) => {
                const num =
                  typeof value === "number" ? value : Number(value);
                const visitors =
                  item?.payload &&
                  typeof item.payload === "object" &&
                  "visitors" in item.payload
                    ? Number(item.payload.visitors)
                    : null;

                return (
                  <div className="flex flex-1 flex-col gap-1 leading-none">
                    <div className="flex items-center justify-between gap-8">
                      <span className="text-muted-foreground">{metric}</span>
                      <span className="font-mono font-medium text-foreground tabular-nums">
                        {num.toLocaleString()}
                      </span>
                    </div>
                    {visitors != null ? (
                      <div className="flex items-center justify-between gap-8">
                        <span className="text-muted-foreground">Visitors</span>
                        <span className="font-mono font-medium text-foreground tabular-nums">
                          {visitors.toLocaleString()}
                        </span>
                      </div>
                    ) : null}
                  </div>
                );
              }}
            />
          }
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={28}>
          {data.map((entry) => (
            <Cell
              key={entry.code}
              fill={
                colorScale
                  ? intensityFill(entry.count / max)
                  : "var(--color-count)"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

type TreemapNodeProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  depth?: number;
  index?: number;
  root?: unknown;
};

function TreemapTile(props: TreemapNodeProps) {
  const {
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    name = "",
    value = 0,
    depth,
    index = 0,
  } = props;

  if (depth !== 1 || width <= 0 || height <= 0) return null;

  const fill = CHART_COLORS[index % CHART_COLORS.length];
  const showLabel = width > 52 && height > 28;
  const showValue = width > 52 && height > 44;
  const label =
    name.length > Math.max(6, Math.floor(width / 7))
      ? `${name.slice(0, Math.max(5, Math.floor(width / 7) - 1))}…`
      : name;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={3}
        ry={3}
        fill={fill}
        fillOpacity={0.85}
        stroke="var(--background)"
        strokeWidth={2}
      />
      {showLabel ? (
        <text
          x={x + 8}
          y={y + 16}
          className="fill-foreground text-[10px] font-medium"
        >
          {label}
        </text>
      ) : null}
      {showValue ? (
        <text
          x={x + 8}
          y={y + 30}
          className="fill-muted-foreground font-mono text-[10px] tabular-nums"
        >
          {value.toLocaleString()}
        </text>
      ) : null}
    </g>
  );
}

export function BreakdownTreemap({
  rows,
  metric = "Views",
  limit = 12,
  height = 280,
  labelAs,
}: {
  rows: BreakdownRow[];
  metric?: string;
  limit?: number;
  height?: number;
  labelAs?: "country";
}) {
  const { data, config, total } = useMemo(() => {
    const top = rows.slice(0, limit);
    const chartData = top.map((row, index) => ({
      name: resolveLabel(row.key, labelAs),
      size: row.count,
      visitors: row.visitors,
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }));

    const chartConfig: ChartConfig = {
      size: { label: metric },
    };
    top.forEach((row, index) => {
      chartConfig[`item_${index}`] = {
        label: resolveLabel(row.key, labelAs),
        color: CHART_COLORS[index % CHART_COLORS.length],
      };
    });

    return {
      data: chartData,
      config: chartConfig,
      total: top.reduce((sum, row) => sum + row.count, 0),
    };
  }, [rows, metric, limit, labelAs]);

  if (data.length === 0 || total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-sm text-muted-foreground">No data</p>
      </div>
    );
  }

  return (
    <ChartContainer
      config={config}
      className="aspect-auto w-full"
      style={{ height }}
    >
      <Treemap
        data={data}
        dataKey="size"
        nameKey="name"
        stroke="var(--background)"
        isAnimationActive={false}
        content={<TreemapTile />}
      >
        <ChartTooltip
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, _name, item) => {
                const num =
                  typeof value === "number" ? value : Number(value);
                const percent =
                  total > 0 ? Math.round((num / total) * 100) : 0;
                const label =
                  item?.payload &&
                  typeof item.payload === "object" &&
                  "name" in item.payload
                    ? String(item.payload.name)
                    : metric;

                return (
                  <div className="flex flex-1 flex-col gap-1 leading-none">
                    <div className="flex items-center justify-between gap-8">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-mono font-medium text-foreground tabular-nums">
                        {num.toLocaleString()} · {percent}%
                      </span>
                    </div>
                  </div>
                );
              }}
            />
          }
        />
      </Treemap>
    </ChartContainer>
  );
}

export function MultiMetricBarChart({
  data,
  metrics,
  plotSeries,
  plotData,
  emptyMessage = "No data in this range yet.",
  height = 280,
}: {
  data?: TimeseriesPoint[];
  metrics?: OverviewMetric[];
  plotSeries?: PlotSeries[];
  plotData?: PlotPoint[];
  emptyMessage?: string;
  height?: number;
}) {
  const seriesList: PlotSeries[] = plotSeries?.length
    ? plotSeries
    : (metrics ?? []).map((key) => {
        const series = metricSeriesConfig[key];
        return {
          dataKey: series.dataKey,
          label: series.label,
          color: series.color,
          unit: series.unit,
        };
      });

  const chartData: PlotPoint[] =
    plotData ??
    (data ?? []).map((point) => ({
      day: point.day,
      pageviews: point.pageviews,
      visitors: point.visitors,
      events: point.events,
      bounceRate: point.bounceRate,
      avgSessionSeconds: point.avgSessionSeconds,
    }));

  const hasTraffic = seriesList.some((series) =>
    series.unit
      ? chartData.some((d) => {
          const value = d[series.dataKey];
          return value !== null && value !== undefined;
        })
      : chartData.some((d) => Number(d[series.dataKey] ?? 0) > 0),
  );

  const config = Object.fromEntries(
    seriesList.map((series) => [
      series.dataKey,
      { label: series.label, color: series.color },
    ]),
  ) as ChartConfig;

  if (!hasTraffic) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-border/80 bg-muted/20"
        style={{ height }}
      >
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const tickInterval = Math.max(Math.floor(chartData.length / 7) - 1, 0);
  const single = seriesList.length === 1 ? seriesList[0] : null;
  const yTickFormatter = (value: number) => {
    if (single?.unit === "percent") return `${value}%`;
    if (single?.unit === "duration") {
      if (value < 60) return `${value}s`;
      return `${Math.round(value / 60)}m`;
    }
    return formatAxisCount(value);
  };

  return (
    <ChartContainer
      config={config}
      className="aspect-auto w-full"
      style={{ height }}
    >
      <BarChart
        accessibilityLayer
        data={chartData}
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
          width={single?.unit ? 44 : 36}
          allowDecimals={false}
          tickFormatter={yTickFormatter}
          domain={single?.unit === "percent" ? [0, 100] : undefined}
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          content={
            <ChartTooltipContent
              labelFormatter={(value) =>
                typeof value === "string" ? formatDayLong(value) : String(value)
              }
              indicator="dot"
              formatter={(value, name) => {
                const series = seriesList.find(
                  (item) => item.dataKey === name,
                );
                const num =
                  typeof value === "number" ? value : Number(value);
                const label = series?.label ?? String(name);
                const display =
                  series?.unit === "percent"
                    ? `${num}%`
                    : series?.unit === "duration"
                      ? formatSessionDuration(num)
                      : num.toLocaleString();

                return (
                  <div className="flex flex-1 items-center justify-between gap-8 leading-none">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-mono font-medium text-foreground tabular-nums">
                      {display}
                    </span>
                  </div>
                );
              }}
            />
          }
        />
        {seriesList.length > 1 ? (
          <ChartLegend content={<ChartLegendContent />} />
        ) : null}
        {seriesList.map((series) => (
          <Bar
            key={series.dataKey}
            dataKey={series.dataKey}
            name={series.dataKey}
            fill={`var(--color-${series.dataKey})`}
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}

