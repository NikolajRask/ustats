"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ChartColumnIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

import { deleteGraph } from "@/app/dashboard/sites/[id]/graphs/actions";
import {
  BreakdownTreemap,
  DistributionDonut,
  HorizontalBarChart,
  MultiMetricBarChart,
  TimeseriesChart,
  VerticalBarChart,
} from "@/components/dashboard/charts";
import { GraphEditor } from "@/components/dashboard/graph-editor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  graphSubtitle,
  resolveGraphData,
  type SiteGraph,
} from "@/lib/graphs";
import type { SiteStats } from "@/lib/stats";

function GraphCard({
  siteId,
  graph,
  stats,
  onEdit,
}: {
  siteId: string;
  graph: SiteGraph;
  stats: SiteStats;
  onEdit: (graph: SiteGraph) => void;
}) {
  const router = useRouter();
  const data = resolveGraphData(graph, stats);
  const countryLabel =
    data.kind === "breakdown" && data.dimension === "countries"
      ? ("country" as const)
      : undefined;

  return (
    <Card className="overflow-hidden bg-card/80">
      <CardHeader className="border-b border-border/60">
        <CardTitle className="font-display text-lg font-semibold tracking-tight">
          {graph.name}
        </CardTitle>
        <CardDescription>{graphSubtitle(graph)}</CardDescription>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Options for ${graph.name}`}
                />
              }
            >
              <MoreHorizontalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(graph)}>
                <PencilIcon />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  const formData = new FormData();
                  formData.set("siteId", siteId);
                  formData.set("graphId", graph.id);
                  void deleteGraph(formData).then(() => router.refresh());
                }}
              >
                <Trash2Icon />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent className="pt-4">
        {data.kind === "metric-series" ? (
          data.chart_type === "bar" ? (
            <MultiMetricBarChart
              plotData={data.points}
              plotSeries={data.plotSeries}
            />
          ) : (
            <TimeseriesChart
              plotData={data.points}
              plotSeries={data.plotSeries}
              style={data.chart_type === "line" ? "line" : "area"}
            />
          )
        ) : data.chart_type === "donut" || data.chart_type === "pie" ? (
          <DistributionDonut
            rows={data.rows}
            labelAs={countryLabel}
            variant={data.chart_type}
          />
        ) : data.chart_type === "treemap" ? (
          <BreakdownTreemap rows={data.rows} labelAs={countryLabel} />
        ) : data.chart_type === "column" ? (
          <VerticalBarChart
            rows={data.rows}
            limit={8}
            height={260}
            labelAs={countryLabel}
            colorScale={data.dimension === "countries"}
          />
        ) : (
          <HorizontalBarChart
            rows={data.rows}
            limit={8}
            height={260}
            labelAs={countryLabel}
            colorScale={data.dimension === "countries"}
          />
        )}
      </CardContent>
    </Card>
  );
}

export function GraphsDashboard({
  siteId,
  graphs,
  stats,
}: {
  siteId: string;
  graphs: SiteGraph[];
  stats: SiteStats;
}) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<SiteGraph | null>(null);

  function openCreate() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(graph: SiteGraph) {
    setEditing(graph);
    setEditorOpen(true);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Graphs
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Build custom charts from your analytics data
          </p>
        </div>
        <Button type="button" size="sm" onClick={openCreate}>
          <PlusIcon data-icon="inline-start" />
          New graph
        </Button>
      </div>

      {graphs.length === 0 ? (
        <Empty className="min-h-88 border border-dashed border-border/80 bg-card/40">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ChartColumnIcon />
            </EmptyMedia>
            <EmptyTitle className="font-display text-base">
              No custom graphs yet
            </EmptyTitle>
            <EmptyDescription>
              Create an area, line, bar, column, donut, pie, or treemap chart
              from pageviews, visitors, events, and other site metrics.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button type="button" onClick={openCreate}>
              <PlusIcon data-icon="inline-start" />
              Create graph
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {graphs.map((graph) => (
            <GraphCard
              key={graph.id}
              siteId={siteId}
              graph={graph}
              stats={stats}
              onEdit={openEdit}
            />
          ))}
        </div>
      )}

      <GraphEditor
        key={editing?.id ?? "new"}
        siteId={siteId}
        graph={editing}
        eventNames={stats.customEvents.map((row) => row.key)}
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) setEditing(null);
        }}
      />
    </div>
  );
}
