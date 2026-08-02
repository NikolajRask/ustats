"use client";

import { useMemo, useState, useTransition } from "react";
import type { FormEvent } from "react";

import { saveEventAlias } from "@/app/dashboard/sites/[id]/events/actions";
import { TimeseriesChart } from "@/components/dashboard/charts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import type { EventAliasMap } from "@/lib/event-aliases";
import type { BreakdownRow, TimeseriesPoint } from "@/lib/stats";
import { timeseriesForCustomEvent } from "@/lib/stats";

export function CustomEventsList({
  siteId,
  rows,
  eventTimeseries,
  countsByDay,
  visitorsByDay,
  aliases,
}: {
  siteId: string;
  rows: BreakdownRow[];
  eventTimeseries: TimeseriesPoint[];
  countsByDay: Record<string, Record<string, number>>;
  visitorsByDay: Record<string, Record<string, number>>;
  aliases: EventAliasMap;
}) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [aliasEdits, setAliasEdits] = useState<EventAliasMap>({});
  const aliasState = { ...aliases, ...aliasEdits };
  const max = Math.max(...rows.map((r) => r.count), 1);

  const selected = useMemo(
    () => rows.find((row) => row.key === selectedKey) ?? null,
    [rows, selectedKey],
  );

  const selectedAlias = selected
    ? (aliasState[selected.key] ?? { title: "", description: "" })
    : { title: "", description: "" };

  const selectedSeries = useMemo(() => {
    if (!selected) return [];
    return timeseriesForCustomEvent(
      eventTimeseries,
      selected.key,
      countsByDay,
      visitorsByDay,
    );
  }, [selected, eventTimeseries, countsByDay, visitorsByDay]);

  return (
    <>
      <Card size="sm" className="bg-card/80">
        <CardHeader className="border-b border-border/60">
          <CardTitle className="text-[11px] font-medium tracking-[0.14em] uppercase">
            Event names
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-1">
          {rows.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">No data</p>
          ) : (
            <ul className="divide-y divide-border/50">
              {rows.map((row) => {
                const alias = aliasState[row.key];
                const label = alias?.title?.trim() || row.key;
                return (
                  <li key={row.key} className="relative py-2.5">
                    <div
                      aria-hidden
                      className="absolute inset-y-1 left-0 rounded-md bg-primary/10"
                      style={{
                        width: `${Math.max((row.count / max) * 100, 2)}%`,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedKey(row.key)}
                      className="relative flex w-full cursor-pointer items-center justify-between gap-3 rounded-md px-2 text-left transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="min-w-0 truncate text-[13px]">
                        {alias?.title?.trim() ? (
                          <>
                            <span className="font-medium">{label}</span>
                            <span className="ml-1.5 font-mono text-[11px] text-muted-foreground">
                              ({row.key})
                            </span>
                          </>
                        ) : (
                          <span className="font-mono">{row.key}</span>
                        )}
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
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {rows.length > 0 ? (
            <p className="mt-2 px-2 text-[11px] tracking-wide text-muted-foreground uppercase">
              Events · Visitors
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Sheet
        open={selected != null}
        onOpenChange={(open) => {
          if (!open) setSelectedKey(null);
        }}
      >
        <SheetContent side="right" className="w-full gap-0 sm:max-w-lg">
          {selected ? (
            <EventDetailSheet
              key={selected.key}
              siteId={siteId}
              eventName={selected.key}
              count={selected.count}
              visitors={selected.visitors}
              title={selectedAlias.title}
              description={selectedAlias.description}
              series={selectedSeries}
              onSaved={(next) => {
                setAliasEdits((prev) => {
                  const copy = { ...prev };
                  if (!next.title.trim() && !next.description.trim()) {
                    delete copy[selected.key];
                  } else {
                    copy[selected.key] = next;
                  }
                  return copy;
                });
              }}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}

function EventDetailSheet({
  siteId,
  eventName,
  count,
  visitors,
  title: initialTitle,
  description: initialDescription,
  series,
  onSaved,
}: {
  siteId: string;
  eventName: string;
  count: number;
  visitors: number;
  title: string;
  description: string;
  series: TimeseriesPoint[];
  onSaved: (alias: { title: string; description: string }) => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const displayTitle = title.trim() || eventName;
  const dirty =
    title.trim() !== initialTitle.trim() ||
    description.trim() !== initialDescription.trim();

  function handleSave(event: FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveEventAlias(
        siteId,
        eventName,
        title,
        description,
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSaved({ title: title.trim(), description: description.trim() });
    });
  }

  return (
    <>
      <SheetHeader className="border-b border-border/60">
        <SheetTitle className="font-display text-lg font-semibold tracking-tight">
          {displayTitle}
        </SheetTitle>
        <SheetDescription className="font-mono text-xs">
          {eventName}
        </SheetDescription>
      </SheetHeader>

      <div className="overflow-y-auto px-4 pb-6">
        <div className="grid grid-cols-2 gap-3 border-b border-border/60 py-4">
          <div>
            <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              Events
            </p>
            <p className="mt-1 font-display text-2xl font-semibold tracking-tight tabular-nums">
              {count.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              Visitors
            </p>
            <p className="mt-1 font-display text-2xl font-semibold tracking-tight tabular-nums">
              {visitors.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="space-y-2 border-b border-border/60 py-4">
          <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Over time
          </p>
          <TimeseriesChart
            data={series}
            variant="events"
            emptyMessage="No firings of this event in this range."
          />
        </div>

        <form onSubmit={handleSave} className="space-y-4 pt-4">
          <div>
            <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              Alias
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Give this event a readable title and optional description.
            </p>
          </div>

          {error ? (
            <p
              className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="event-alias-title">Title</Label>
            <Input
              id="event-alias-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Signup started"
              maxLength={120}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-alias-description">Description</Label>
            <textarea
              id="event-alias-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Fired when a visitor begins the signup flow"
              maxLength={500}
              rows={3}
              className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30"
            />
          </div>

          <SheetFooter className="px-0">
            <Button type="submit" disabled={pending || !dirty}>
              {pending ? "Saving…" : "Save alias"}
            </Button>
          </SheetFooter>
        </form>
      </div>
    </>
  );
}
