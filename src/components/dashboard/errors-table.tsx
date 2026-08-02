"use client";

import { ChevronDownIcon, SearchIcon } from "lucide-react";
import { useDeferredValue, useMemo, useState, useTransition } from "react";

import { loadMoreErrorGroups } from "@/app/dashboard/sites/[id]/errors/actions";
import { DatePickerField } from "@/components/dashboard/date-picker-field";
import { Badge } from "@/components/ui/badge";
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
import type {
  ErrorGroupRow,
  ErrorGroupStatus,
  ErrorOccurrenceRow,
} from "@/lib/errors";
import type { DateRange } from "@/lib/stats";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const ALL_LEVELS = "__all__";
const ALL_STATUSES = "__all__";

const STATUS_OPTIONS = [
  { value: "unresolved", label: "Unresolved" },
  { value: "resolved", label: "Resolved" },
  { value: "ignored", label: "Ignored" },
  { value: ALL_STATUSES, label: "All statuses" },
] as const;

const LEVEL_OPTIONS = [
  { value: ALL_LEVELS, label: "All levels" },
  { value: "error", label: "error" },
  { value: "warning", label: "warning" },
  { value: "info", label: "info" },
] as const;

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

function levelVariant(level: string) {
  if (level === "warning") return "outline" as const;
  if (level === "info") return "secondary" as const;
  return "destructive" as const;
}

function statusVariant(status: ErrorGroupStatus) {
  if (status === "resolved") return "secondary" as const;
  if (status === "ignored") return "outline" as const;
  return "destructive" as const;
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

function matchesSearch(row: ErrorGroupRow, query: string) {
  const haystack = [row.type, row.message, row.culprit, row.level, row.status]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export function ErrorsTable({
  siteId,
  range,
  groups: initialGroups,
  pageSize,
  hasMore: initialHasMore,
}: {
  siteId: string;
  range: DateRange;
  groups: ErrorGroupRow[];
  pageSize: number;
  hasMore: boolean;
}) {
  const [loadedGroups, setLoadedGroups] = useState(initialGroups);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingMore, startLoadMore] = useTransition();
  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, ErrorGroupStatus>
  >({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [occurrences, setOccurrences] = useState<ErrorOccurrenceRow[]>([]);
  const [loadingOcc, setLoadingOcc] = useState(false);
  const [pending, startTransition] = useTransition();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("unresolved");
  const [levelFilter, setLevelFilter] = useState(ALL_LEVELS);
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const deferredQuery = useDeferredValue(query);

  const groups = useMemo(
    () =>
      loadedGroups.map((group) => ({
        ...group,
        status: statusOverrides[group.id] ?? group.status,
      })),
    [loadedGroups, statusOverrides],
  );

  function handleLoadMore() {
    setLoadError(null);
    startLoadMore(async () => {
      const result = await loadMoreErrorGroups(
        siteId,
        range,
        loadedGroups.length,
        pageSize,
      );
      if (!result.ok) {
        setLoadError(result.error);
        return;
      }
      setLoadedGroups((prev) => [...prev, ...result.groups]);
      setHasMore(result.hasMore);
    });
  }

  const statusCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of groups) {
      map.set(row.status, (map.get(row.status) ?? 0) + 1);
    }
    return map;
  }, [groups]);

  const levelCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of groups) {
      map.set(row.level, (map.get(row.level) ?? 0) + 1);
    }
    return map;
  }, [groups]);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    const fromMs = fromDate ? startOfLocalDay(fromDate) : null;
    const toMs = toDate ? endOfLocalDay(toDate) : null;

    return groups.filter((row) => {
      if (statusFilter !== ALL_STATUSES && row.status !== statusFilter) {
        return false;
      }
      if (levelFilter !== ALL_LEVELS && row.level !== levelFilter) {
        return false;
      }
      if (q && !matchesSearch(row, q)) return false;
      if (fromMs != null || toMs != null) {
        const t = new Date(row.last_seen).getTime();
        if (fromMs != null && t < fromMs) return false;
        if (toMs != null && t > toMs) return false;
      }
      return true;
    });
  }, [groups, statusFilter, levelFilter, deferredQuery, fromDate, toDate]);

  const isFiltered =
    statusFilter !== "unresolved" ||
    levelFilter !== ALL_LEVELS ||
    query.trim().length > 0 ||
    fromDate != null ||
    toDate != null;

  const statusLabel =
    STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? "Status";
  const levelLabel =
    LEVEL_OPTIONS.find((o) => o.value === levelFilter)?.label ?? "Level";

  const selected = selectedId
    ? (groups.find((g) => g.id === selectedId) ?? null)
    : null;

  async function openGroup(row: ErrorGroupRow) {
    setSelectedId(row.id);
    setLoadingOcc(true);
    setOccurrences([]);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("error_events")
      .select(
        "id, group_id, type, message, level, stack, url, path, country, device, browser, os, visitor_hash, release, environment, extra, created_at",
      )
      .eq("site_id", siteId)
      .eq("group_id", row.id)
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) {
      console.error(error);
      setOccurrences([]);
    } else {
      setOccurrences((data ?? []) as ErrorOccurrenceRow[]);
    }
    setLoadingOcc(false);
  }

  function updateStatus(status: ErrorGroupStatus) {
    if (!selected) return;
    const groupId = selected.id;

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("error_groups")
        .update({ status })
        .eq("id", groupId)
        .eq("site_id", siteId);

      if (error) {
        console.error(error);
        return;
      }

      setStatusOverrides((prev) => ({ ...prev, [groupId]: status }));
    });
  }

  const latest = occurrences[0] ?? null;

  return (
    <>
      <div className="space-y-3 border-b border-border/60 px-4 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-lg font-semibold tracking-tight">
            Issues
          </h3>
          <p className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {filtered.length.toLocaleString()}
            {isFiltered || statusFilter !== ALL_STATUSES
              ? ` / ${groups.length.toLocaleString()}`
              : ""}{" "}
            {filtered.length === 1 ? "issue" : "issues"}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative min-w-0 flex-1 sm:max-w-56">
            <Label htmlFor="errors-search" className="sr-only">
              Search issues
            </Label>
            <SearchIcon
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="errors-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search issues…"
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
                  className="w-full justify-between gap-2 font-normal sm:w-36"
                />
              }
            >
              <span className="truncate text-xs">{statusLabel}</span>
              <ChevronDownIcon className="size-3.5 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-44">
              <DropdownMenuRadioGroup
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                {STATUS_OPTIONS.map((option) => (
                  <DropdownMenuRadioItem
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                    <span className="ml-auto pr-1 tabular-nums text-muted-foreground">
                      {option.value === ALL_STATUSES
                        ? groups.length
                        : (statusCounts.get(option.value) ?? 0)}
                    </span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-between gap-2 font-normal sm:w-32"
                />
              }
            >
              <span
                className={cn(
                  "truncate text-xs",
                  levelFilter !== ALL_LEVELS && "font-mono",
                )}
              >
                {levelLabel}
              </span>
              <ChevronDownIcon className="size-3.5 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-40">
              <DropdownMenuRadioGroup
                value={levelFilter}
                onValueChange={setLevelFilter}
              >
                {LEVEL_OPTIONS.map((option) => (
                  <DropdownMenuRadioItem
                    key={option.value}
                    value={option.value}
                  >
                    <span
                      className={
                        option.value !== ALL_LEVELS ? "font-mono" : undefined
                      }
                    >
                      {option.label}
                    </span>
                    <span className="ml-auto pr-1 tabular-nums text-muted-foreground">
                      {option.value === ALL_LEVELS
                        ? groups.length
                        : (levelCounts.get(option.value) ?? 0)}
                    </span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-2">
            <DatePickerField
              id="errors-from"
              value={fromDate}
              onChange={setFromDate}
              placeholder="From"
              disabled={toDate ? (date) => date > toDate : undefined}
            />
            <span className="text-muted-foreground/60" aria-hidden>
              –
            </span>
            <DatePickerField
              id="errors-to"
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
                setStatusFilter("unresolved");
                setLevelFilter(ALL_LEVELS);
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
          {isFiltered || statusFilter !== "unresolved"
            ? "No issues match the current filters."
            : "No unresolved issues — looking good."}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Issue</TableHead>
              <TableHead className="hidden sm:table-cell">Level</TableHead>
              <TableHead className="text-right">Events</TableHead>
              <TableHead className="hidden text-right md:table-cell">
                Users
              </TableHead>
              <TableHead className="hidden lg:table-cell">Last seen</TableHead>
              <TableHead className="hidden xl:table-cell">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer hover:bg-muted/50"
                tabIndex={0}
                aria-label={`Open details for ${row.type}: ${row.message}`}
                onClick={() => void openGroup(row)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    void openGroup(row);
                  }
                }}
              >
                <TableCell className="max-w-md">
                  <div className="space-y-1">
                    <p className="truncate font-medium">
                      <span className="text-muted-foreground">{row.type}: </span>
                      {row.message}
                    </p>
                    {row.culprit ? (
                      <p className="truncate font-mono text-[11px] text-muted-foreground">
                        {row.culprit}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant={levelVariant(row.level)}>{row.level}</Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-xs tabular-nums">
                  {(row.range_count || row.event_count).toLocaleString()}
                </TableCell>
                <TableCell className="hidden text-right font-mono text-xs text-muted-foreground tabular-nums md:table-cell">
                  {row.affected_visitors.toLocaleString()}
                </TableCell>
                <TableCell className="hidden whitespace-nowrap font-mono text-xs text-muted-foreground lg:table-cell">
                  {formatTime(row.last_seen)}
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {hasMore ? (
        <div className="flex flex-col items-center gap-2 border-t border-border/60 px-4 py-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoadingMore}
            onClick={handleLoadMore}
          >
            {isLoadingMore ? "Loading…" : "Load more"}
          </Button>
          {loadError ? (
            <p className="text-center text-xs text-destructive">{loadError}</p>
          ) : null}
        </div>
      ) : null}

      <Sheet
        open={selected != null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedId(null);
            setOccurrences([]);
          }
        }}
      >
        <SheetContent side="right" className="w-full gap-0 sm:max-w-lg">
          {selected ? (
            <>
              <SheetHeader className="border-b border-border/60">
                <SheetTitle className="font-display text-lg font-semibold tracking-tight">
                  {selected.type}
                </SheetTitle>
                <SheetDescription className="line-clamp-3 text-left text-foreground/80">
                  {selected.message}
                </SheetDescription>
              </SheetHeader>

              <div className="flex flex-wrap gap-2 border-b border-border/60 px-4 py-3">
                <Badge variant={levelVariant(selected.level)}>
                  {selected.level}
                </Badge>
                <Badge variant={statusVariant(selected.status)}>
                  {selected.status}
                </Badge>
                <div className="ml-auto flex gap-2">
                  {selected.status !== "resolved" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => updateStatus("resolved")}
                    >
                      Resolve
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => updateStatus("unresolved")}
                    >
                      Reopen
                    </Button>
                  )}
                  {selected.status !== "ignored" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => updateStatus("ignored")}
                    >
                      Ignore
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="overflow-y-auto px-4 pb-6">
                <dl>
                  <DetailRow
                    label="Events"
                    value={selected.event_count.toLocaleString()}
                  />
                  <DetailRow
                    label="In range"
                    value={selected.range_count.toLocaleString()}
                  />
                  <DetailRow
                    label="Users"
                    value={selected.affected_visitors.toLocaleString()}
                  />
                  <DetailRow
                    label="First seen"
                    value={formatDateTime(selected.first_seen)}
                  />
                  <DetailRow
                    label="Last seen"
                    value={formatDateTime(selected.last_seen)}
                  />
                  <DetailRow
                    label="Culprit"
                    value={display(selected.culprit)}
                    mono
                  />
                  <DetailRow
                    label="Fingerprint"
                    value={selected.fingerprint}
                    mono
                  />
                </dl>

                <div className="mt-6 space-y-3">
                  <h3 className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                    Latest stack
                  </h3>
                  {loadingOcc ? (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                  ) : latest?.stack ? (
                    <pre className="max-h-64 overflow-auto rounded-lg bg-muted/60 px-3 py-2 font-mono text-[11px] leading-relaxed">
                      {latest.stack}
                    </pre>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No stack trace available.
                    </p>
                  )}
                </div>

                <div className="mt-6 space-y-3">
                  <h3 className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                    Recent occurrences
                  </h3>
                  {loadingOcc ? (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                  ) : occurrences.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No occurrences loaded.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {occurrences.map((occ) => (
                        <li
                          key={occ.id}
                          className="rounded-lg border border-border/60 px-3 py-2"
                        >
                          <div className="flex items-baseline justify-between gap-3">
                            <p className="truncate font-mono text-xs text-muted-foreground">
                              {occ.path || occ.url || "—"}
                            </p>
                            <time className="shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums">
                              {formatTime(occ.created_at)}
                            </time>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {[occ.browser, occ.os, occ.country]
                              .filter(Boolean)
                              .join(" · ") || "—"}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
