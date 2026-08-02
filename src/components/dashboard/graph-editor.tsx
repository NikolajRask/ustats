"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";

import {
  createGraph,
  updateGraph,
} from "@/app/dashboard/sites/[id]/graphs/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  EVENT_FILTER_OPS,
  GRAPH_CHART_TYPES,
  GRAPH_DIMENSIONS,
  GRAPH_METRICS,
  MAX_EVENT_FILTER_CLAUSES,
  MAX_GRAPH_SERIES,
  emptyEventFilter,
  isMetricChartType,
  type EventFilter,
  type EventFilterOp,
  type GraphChartType,
  type GraphDimension,
  type GraphSeries,
  type SiteGraph,
} from "@/lib/graphs";
import type { OverviewMetric } from "@/lib/stats";
import { cn } from "@/lib/utils";

const selectClassName =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const compactSelectClassName =
  "h-8 shrink-0 rounded-lg border border-input bg-background px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type DraftSeries = GraphSeries & { key: string };

function toDraftSeries(graph?: SiteGraph | null): DraftSeries[] {
  const series =
    graph?.series?.length
      ? graph.series
      : [{ metric: graph?.metric ?? "pageviews", event_filter: null }];

  return series.map((item) => ({
    key: crypto.randomUUID(),
    metric: item.metric,
    event_filter: item.event_filter
      ? { clauses: item.event_filter.clauses }
      : null,
  }));
}

function nextAvailableMetric(selected: DraftSeries[]): OverviewMetric | null {
  const used = new Set(
    selected
      .filter((item) => item.metric !== "events")
      .map((item) => item.metric),
  );
  const nextNonEvent = GRAPH_METRICS.find(
    (option) => option.value !== "events" && !used.has(option.value),
  );
  if (nextNonEvent) return nextNonEvent.value;
  return "events";
}

function EventFilterEditor({
  filter,
  eventNames,
  onChange,
}: {
  filter: EventFilter;
  eventNames: string[];
  onChange: (filter: EventFilter | null) => void;
}) {
  const listId = `event-names-${filter.clauses.length}`;

  function updateClause(
    index: number,
    patch: Partial<{ op: EventFilterOp; value: string }>,
  ) {
    onChange({
      ...filter,
      clauses: filter.clauses.map((clause, i) =>
        i === index ? { ...clause, ...patch } : clause,
      ),
    });
  }

  function removeClause(index: number) {
    const next = filter.clauses.filter((_, i) => i !== index);
    if (next.length === 0) {
      onChange(null);
      return;
    }
    onChange({ ...filter, clauses: next });
  }

  return (
    <div className="space-y-2 rounded-lg border border-border/70 bg-muted/20 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-foreground">Event filter</p>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => onChange(null)}
        >
          Clear
        </Button>
      </div>

      <div className="space-y-2">
        {filter.clauses.map((clause, index) => (
          <div key={index} className="space-y-1.5">
            {index > 0 ? (
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                OR
              </p>
            ) : null}
            <div className="flex gap-1.5">
              <select
                aria-label={`Condition ${index + 1} operator`}
                className={compactSelectClassName}
                value={clause.op}
                onChange={(event) =>
                  updateClause(index, {
                    op: event.target.value as EventFilterOp,
                  })
                }
              >
                {EVENT_FILTER_OPS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Input
                list={listId}
                value={clause.value}
                placeholder="event name"
                className="h-8 text-xs"
                onChange={(event) =>
                  updateClause(index, { value: event.target.value })
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0"
                aria-label={`Remove condition ${index + 1}`}
                onClick={() => removeClause(index)}
              >
                <Trash2Icon />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <datalist id={listId}>
        {eventNames.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <Button
        type="button"
        variant="outline"
        size="xs"
        disabled={filter.clauses.length >= MAX_EVENT_FILTER_CLAUSES}
        onClick={() =>
          onChange({
            ...filter,
            clauses: [...filter.clauses, { op: "is", value: "" }],
          })
        }
      >
        <PlusIcon data-icon="inline-start" />
        Add condition
      </Button>
    </div>
  );
}

export function GraphEditor({
  siteId,
  graph,
  open,
  onOpenChange,
  eventNames = [],
}: {
  siteId: string;
  graph?: SiteGraph | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventNames?: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(graph?.name ?? "");
  const [chartType, setChartType] = useState<GraphChartType>(
    graph?.chart_type ?? "timeseries",
  );
  const [series, setSeries] = useState<DraftSeries[]>(() => toDraftSeries(graph));
  const [dimension, setDimension] = useState<GraphDimension>(
    graph?.dimension ?? "pages",
  );
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(graph);
  const isMetricChart = isMetricChartType(chartType);
  const canAddSeries = series.length < MAX_GRAPH_SERIES;

  function syncFromProps() {
    setName(graph?.name ?? "");
    setChartType(graph?.chart_type ?? "timeseries");
    setSeries(toDraftSeries(graph));
    setDimension(graph?.dimension ?? "pages");
    setError(null);
  }

  function updateSeriesAt(key: string, patch: Partial<GraphSeries>) {
    setSeries((current) =>
      current.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }

  function removeSeriesAt(key: string) {
    setSeries((current) => {
      if (current.length <= 1) return current;
      return current.filter((item) => item.key !== key);
    });
  }

  function addSeries() {
    const next = nextAvailableMetric(series);
    if (!next) return;
    setSeries((current) =>
      current.length >= MAX_GRAPH_SERIES
        ? current
        : [
            ...current,
            {
              key: crypto.randomUUID(),
              metric: next,
              event_filter: null,
            },
          ],
    );
  }

  function submit() {
    setError(null);
    const formData = new FormData();
    formData.set("siteId", siteId);
    formData.set("name", name);
    formData.set("chartType", chartType);
    formData.set("metric", series[0]?.metric ?? "pageviews");
    formData.set(
      "series",
      JSON.stringify(
        series.map((item) => ({
          metric: item.metric,
          event_filter: item.metric === "events" ? item.event_filter : null,
        })),
      ),
    );
    formData.set("dimension", isMetricChart ? "" : dimension);
    if (graph) formData.set("graphId", graph.id);

    startTransition(async () => {
      const result = graph
        ? await updateGraph(formData)
        : await createGraph(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (next) syncFromProps();
        onOpenChange(next);
      }}
    >
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit graph" : "New graph"}</SheetTitle>
          <SheetDescription>
            Choose a chart type and the data to plot for this site.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-4">
          <div className="space-y-2">
            <Label htmlFor="graph-name">Name</Label>
            <Input
              id="graph-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Daily visitors"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="graph-type">Chart type</Label>
            <div className="grid gap-2">
              {GRAPH_CHART_TYPES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setChartType(option.value)}
                  className={cn(
                    "rounded-lg border px-3 py-2.5 text-left transition-colors",
                    chartType === option.value
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/80 hover:bg-muted/40",
                  )}
                >
                  <p className="text-sm font-medium text-foreground">
                    {option.label}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {isMetricChart ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label>Data series</Label>
                <span className="text-xs text-muted-foreground">
                  {series.length}/{MAX_GRAPH_SERIES}
                </span>
              </div>
              <div className="space-y-3">
                {series.map((item) => {
                  const usedOther = new Set(
                    series
                      .filter(
                        (other) =>
                          other.key !== item.key && other.metric !== "events",
                      )
                      .map((other) => other.metric),
                  );

                  return (
                    <div
                      key={item.key}
                      className="space-y-2 rounded-lg border border-border/80 p-2.5"
                    >
                      <div className="flex gap-2">
                        <select
                          aria-label="Series metric"
                          className={selectClassName}
                          value={item.metric}
                          onChange={(event) => {
                            const metric = event.target
                              .value as OverviewMetric;
                            updateSeriesAt(item.key, {
                              metric,
                              event_filter:
                                metric === "events"
                                  ? item.event_filter
                                  : null,
                            });
                          }}
                        >
                          {GRAPH_METRICS.map((option) => (
                            <option
                              key={option.value}
                              value={option.value}
                              disabled={
                                option.value !== "events" &&
                                option.value !== item.metric &&
                                usedOther.has(option.value)
                              }
                            >
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="shrink-0"
                          disabled={series.length <= 1}
                          aria-label="Remove series"
                          onClick={() => removeSeriesAt(item.key)}
                        >
                          <Trash2Icon />
                        </Button>
                      </div>

                      {item.metric === "events" ? (
                        item.event_filter ? (
                          <EventFilterEditor
                            filter={item.event_filter}
                            eventNames={eventNames}
                            onChange={(event_filter) =>
                              updateSeriesAt(item.key, { event_filter })
                            }
                          />
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            onClick={() =>
                              updateSeriesAt(item.key, {
                                event_filter: emptyEventFilter(),
                              })
                            }
                          >
                            Add event filter
                          </Button>
                        )
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canAddSeries || !nextAvailableMetric(series)}
                onClick={addSeries}
              >
                <PlusIcon data-icon="inline-start" />
                Add series
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="graph-dimension">Dimension</Label>
              <select
                id="graph-dimension"
                className={selectClassName}
                value={dimension}
                onChange={(event) =>
                  setDimension(event.target.value as GraphDimension)
                }
              >
                {GRAPH_DIMENSIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        <SheetFooter className="border-t border-border/70">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" disabled={pending || !name.trim()} onClick={submit}>
            {pending ? "Saving…" : isEdit ? "Save graph" : "Create graph"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
