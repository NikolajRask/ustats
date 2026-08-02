"use client";

import { ChevronDownIcon, SearchIcon } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

import { DatePickerField } from "@/components/dashboard/date-picker-field";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EventLogRow } from "@/lib/stats";
import { cn } from "@/lib/utils";

const ALL_EVENTS = "__all__";

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(iso));
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(iso));
}

function display(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-1 border-b border-border/50 py-3 last:border-0 sm:grid-cols-[7.5rem_1fr] sm:gap-4">
      <dt className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd
        className={cn(
          "min-w-0 break-all text-sm",
          mono && "font-mono text-[13px]",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function PropsBlock({ props }: { props: unknown }) {
  if (
    props == null ||
    (typeof props === "object" &&
      !Array.isArray(props) &&
      Object.keys(props as object).length === 0)
  ) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <pre className="overflow-x-auto rounded-lg bg-muted/60 px-3 py-2 font-mono text-xs leading-relaxed">
      {JSON.stringify(props, null, 2)}
    </pre>
  );
}

function matchesSearch(row: EventLogRow, query: string) {
  const haystack = [
    row.name,
    row.path,
    row.url,
    row.referrer,
    row.referrer_host,
    row.country,
    row.device,
    row.browser,
    row.os,
    row.utm_source,
    row.utm_medium,
    row.utm_campaign,
    row.utm_term,
    row.utm_content,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function startOfLocalDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0,
  ).getTime();
}

function endOfLocalDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  ).getTime();
}

export function LogsTable({ logs }: { logs: EventLogRow[] }) {
  const [selected, setSelected] = useState<EventLogRow | null>(null);
  const [query, setQuery] = useState("");
  const [eventName, setEventName] = useState(ALL_EVENTS);
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const deferredQuery = useDeferredValue(query);

  const eventCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of logs) {
      map.set(row.name, (map.get(row.name) ?? 0) + 1);
    }
    return [...map.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    );
  }, [logs]);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    const fromMs = fromDate ? startOfLocalDay(fromDate) : null;
    const toMs = toDate ? endOfLocalDay(toDate) : null;

    return logs.filter((row) => {
      if (eventName !== ALL_EVENTS && row.name !== eventName) return false;
      if (q && !matchesSearch(row, q)) return false;
      if (fromMs != null || toMs != null) {
        const t = new Date(row.created_at).getTime();
        if (fromMs != null && t < fromMs) return false;
        if (toMs != null && t > toMs) return false;
      }
      return true;
    });
  }, [logs, eventName, deferredQuery, fromDate, toDate]);

  const isFiltered =
    eventName !== ALL_EVENTS ||
    query.trim().length > 0 ||
    fromDate != null ||
    toDate != null;

  const eventLabel =
    eventName === ALL_EVENTS
      ? "All events"
      : eventName;

  return (
    <>
      <div className="space-y-3 border-b border-border/60 px-4 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-lg font-semibold tracking-tight">
            Event stream
          </h3>
          <p className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {filtered.length.toLocaleString()}
            {isFiltered ? ` / ${logs.length.toLocaleString()}` : ""}{" "}
            {filtered.length === 1 ? "event" : "events"}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1 sm:max-w-56">
            <Label htmlFor="logs-search" className="sr-only">
              Search events
            </Label>
            <SearchIcon
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="logs-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search events…"
              className="h-8 pl-8"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-between gap-2 font-normal sm:w-40"
                />
              }
            >
              <span
                className={cn(
                  "truncate text-xs",
                  eventName !== ALL_EVENTS && "font-mono",
                )}
              >
                {eventLabel}
              </span>
              <ChevronDownIcon className="size-3.5 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-52">
              <DropdownMenuRadioGroup
                value={eventName}
                onValueChange={setEventName}
              >
                <DropdownMenuRadioItem value={ALL_EVENTS}>
                  All events
                  <span className="ml-auto pr-1 tabular-nums text-muted-foreground">
                    {logs.length}
                  </span>
                </DropdownMenuRadioItem>
                {eventCounts.map(([name, count]) => (
                  <DropdownMenuRadioItem key={name} value={name}>
                    <span className="truncate font-mono">{name}</span>
                    <span className="ml-auto pr-1 tabular-nums text-muted-foreground">
                      {count}
                    </span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-2">
            <DatePickerField
              id="logs-from"
              value={fromDate}
              onChange={setFromDate}
              placeholder="From"
              disabled={toDate ? (date) => date > toDate : undefined}
            />
            <span className="text-muted-foreground/60" aria-hidden>
              –
            </span>
            <DatePickerField
              id="logs-to"
              value={toDate}
              onChange={setToDate}
              placeholder="To"
              disabled={fromDate ? (date) => date < fromDate : undefined}
            />
          </div>

          {isFiltered ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 text-muted-foreground"
              onClick={() => {
                setQuery("");
                setEventName(ALL_EVENTS);
                setFromDate(undefined);
                setToDate(undefined);
              }}
            >
              Clear
            </Button>
          ) : null}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          {isFiltered
            ? "No events match the current filters."
            : "No events in this range yet."}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Event</TableHead>
              <TableHead className="hidden md:table-cell">Path</TableHead>
              <TableHead className="hidden lg:table-cell">Referrer</TableHead>
              <TableHead className="hidden sm:table-cell">Country</TableHead>
              <TableHead className="hidden md:table-cell">Device</TableHead>
              <TableHead className="hidden xl:table-cell">Browser</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer hover:bg-muted/50"
                tabIndex={0}
                aria-label={`Open details for ${row.name}`}
                onClick={() => setSelected(row)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelected(row);
                  }
                }}
              >
                <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground tabular-nums">
                  {formatTime(row.created_at)}
                </TableCell>
                <TableCell>
                  <span className="font-medium">{row.name}</span>
                </TableCell>
                <TableCell className="hidden max-w-[14rem] truncate font-mono text-xs text-muted-foreground md:table-cell">
                  {row.path || "—"}
                </TableCell>
                <TableCell className="hidden max-w-[10rem] truncate font-mono text-xs text-muted-foreground lg:table-cell">
                  {row.referrer_host || "—"}
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {row.country || "—"}
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {row.device || "—"}
                </TableCell>
                <TableCell className="hidden text-muted-foreground xl:table-cell">
                  {row.browser || "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Sheet
        open={selected != null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
          {selected ? (
            <>
              <SheetHeader className="border-b border-border/60">
                <SheetTitle className="font-display text-lg font-semibold tracking-tight">
                  {selected.name}
                </SheetTitle>
                <SheetDescription>
                  {formatDateTime(selected.created_at)}
                </SheetDescription>
              </SheetHeader>

              <div className="overflow-y-auto px-4 pb-6">
                <dl>
                  <DetailRow label="Event ID" value={selected.id} mono />
                  <DetailRow
                    label="Path"
                    value={display(selected.path)}
                    mono
                  />
                  <DetailRow label="URL" value={display(selected.url)} mono />
                  <DetailRow
                    label="Referrer"
                    value={display(selected.referrer)}
                    mono
                  />
                  <DetailRow
                    label="Referrer host"
                    value={display(selected.referrer_host)}
                    mono
                  />
                  <DetailRow label="Country" value={display(selected.country)} />
                  <DetailRow label="Device" value={display(selected.device)} />
                  <DetailRow label="Browser" value={display(selected.browser)} />
                  <DetailRow label="OS" value={display(selected.os)} />
                  <DetailRow
                    label="UTM source"
                    value={display(selected.utm_source)}
                    mono
                  />
                  <DetailRow
                    label="UTM medium"
                    value={display(selected.utm_medium)}
                    mono
                  />
                  <DetailRow
                    label="UTM campaign"
                    value={display(selected.utm_campaign)}
                    mono
                  />
                  <DetailRow
                    label="UTM term"
                    value={display(selected.utm_term)}
                    mono
                  />
                  <DetailRow
                    label="UTM content"
                    value={display(selected.utm_content)}
                    mono
                  />
                  <DetailRow
                    label="Visitor"
                    value={selected.visitor_hash}
                    mono
                  />
                  <DetailRow
                    label="Session"
                    value={selected.session_hash}
                    mono
                  />
                  <DetailRow
                    label="Props"
                    value={<PropsBlock props={selected.props} />}
                  />
                </dl>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
