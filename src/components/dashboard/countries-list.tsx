"use client";

import { ArrowLeftIcon, SearchIcon } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { countryDisplayName } from "@/lib/country-name";
import type { BreakdownRow } from "@/lib/stats";
import { cn } from "@/lib/utils";

/** Solid mint fill: darker when fuller, lighter when smaller. */
function barFill(ratio: number) {
  const t = Math.min(1, Math.sqrt(Math.max(ratio, 0)));
  const strength = Math.round(12 + t * 38);
  return `color-mix(in oklch, var(--primary) ${strength}%, transparent)`;
}

type DrillKind = "regions" | "cities";

type DrillState = {
  countryCode: string;
  countryName: string;
  kind: DrillKind;
};

type ListItem = {
  key: string;
  label: string;
  sublabel?: string;
  count: number;
  visitors: number;
  countryCode?: string;
};

function BreakdownBars({
  items,
  query,
  searchPlaceholder,
  emptyLabel,
  onHoverCountry,
  regionsByCountry,
  citiesByCountry,
  onDrill,
}: {
  items: ListItem[];
  query: string;
  searchPlaceholder: string;
  emptyLabel: string;
  onHoverCountry?: boolean;
  regionsByCountry?: Record<string, BreakdownRow[]>;
  citiesByCountry?: Record<string, BreakdownRow[]>;
  onDrill?: (item: ListItem, kind: DrillKind) => void;
}) {
  const deferredQuery = useDeferredValue(query);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.sublabel?.toLowerCase().includes(q) ||
        item.key.toLowerCase().includes(q),
    );
  }, [items, deferredQuery]);

  const max = Math.max(...items.map((r) => r.count), 1);

  if (items.length === 0) {
    return <p className="py-6 text-sm text-muted-foreground">No data</p>;
  }

  if (filtered.length === 0) {
    return (
      <p className="py-6 text-sm text-muted-foreground">
        {emptyLabel} “{query.trim()}”
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border/50">
      {filtered.map((item) => {
        const ratio = item.count / max;
        const hovered = hoveredKey === item.key;
        const regionCount =
          item.countryCode && regionsByCountry
            ? (regionsByCountry[item.countryCode]?.length ?? 0)
            : 0;
        const cityCount =
          item.countryCode && citiesByCountry
            ? (citiesByCountry[item.countryCode]?.length ?? 0)
            : 0;
        const showActions =
          onHoverCountry &&
          onDrill &&
          hovered &&
          (regionCount > 0 || cityCount > 0);

        return (
          <li
            key={item.key}
            className="relative py-2.5"
            onMouseEnter={() => setHoveredKey(item.key)}
            onMouseLeave={() => setHoveredKey(null)}
          >
            <div
              aria-hidden
              className="absolute inset-y-1 left-0 rounded-md"
              style={{
                width: `${Math.max(ratio * 100, 2)}%`,
                background: barFill(ratio),
              }}
            />
            <div className="relative flex items-center justify-between gap-3 px-2">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium tracking-tight">
                  {item.label}
                </p>
                {item.sublabel ? (
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {item.sublabel}
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {showActions ? (
                  <div className="flex items-center gap-1.5">
                    {regionCount > 0 ? (
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        className="bg-card/90 cursor-pointer"
                        onClick={() => onDrill(item, "regions")}
                      >
                        See regions
                      </Button>
                    ) : null}
                    {cityCount > 0 ? (
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        className="bg-card/90 cursor-pointer"
                        onClick={() => onDrill(item, "cities")}
                      >
                        See cities
                      </Button>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex items-baseline gap-3 tabular-nums">
                    <span className="text-sm font-medium">
                      {item.count.toLocaleString()}
                    </span>
                    <span className="w-14 text-right text-xs text-muted-foreground">
                      {item.visitors.toLocaleString()}{" "}
                      <span className="sr-only">visitors</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function CountriesList({
  title = "All countries",
  rows,
  regionsByCountry = {},
  citiesByCountry = {},
  metric = "Views",
}: {
  title?: string;
  rows: BreakdownRow[];
  regionsByCountry?: Record<string, BreakdownRow[]>;
  citiesByCountry?: Record<string, BreakdownRow[]>;
  metric?: string;
}) {
  const [query, setQuery] = useState("");
  const [drill, setDrill] = useState<DrillState | null>(null);

  const countryItems = useMemo<ListItem[]>(
    () =>
      rows.map((row) => {
        const code = row.key.trim().toUpperCase();
        return {
          key: code,
          label: countryDisplayName(code),
          sublabel: code,
          count: row.count,
          visitors: row.visitors,
          countryCode: code,
        };
      }),
    [rows],
  );

  const drillItems = useMemo<ListItem[]>(() => {
    if (!drill) return [];
    const source =
      drill.kind === "regions"
        ? regionsByCountry[drill.countryCode]
        : citiesByCountry[drill.countryCode];
    return (source ?? []).map((row) => ({
      key: row.key,
      label: row.key,
      count: row.count,
      visitors: row.visitors,
    }));
  }, [drill, regionsByCountry, citiesByCountry]);

  const activeItems = drill ? drillItems : countryItems;
  const headerTitle = drill
    ? drill.kind === "regions"
      ? `Regions · ${drill.countryName}`
      : `Cities · ${drill.countryName}`
    : title;
  const searchPlaceholder = drill
    ? drill.kind === "regions"
      ? "Search regions…"
      : "Search cities…"
    : "Search countries…";
  const emptyLabel = drill
    ? drill.kind === "regions"
      ? "No regions match"
      : "No cities match"
    : "No countries match";

  return (
    <Card size="sm" className="bg-card/80">
      <CardHeader className="gap-3 border-b border-border/60">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            {drill ? (
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                aria-label="Back to countries"
                onClick={() => {
                  setDrill(null);
                  setQuery("");
                }}
              >
                <ArrowLeftIcon />
              </Button>
            ) : null}
            <CardTitle
              className={cn(
                "min-w-0 truncate text-[11px] font-medium tracking-[0.14em] uppercase",
              )}
            >
              {headerTitle}
            </CardTitle>
          </div>
          <div className="relative w-full sm:max-w-55">
            <SearchIcon
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="h-8 pl-8"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-1">
        <BreakdownBars
          items={activeItems}
          query={query}
          searchPlaceholder={searchPlaceholder}
          emptyLabel={emptyLabel}
          onHoverCountry={!drill}
          regionsByCountry={regionsByCountry}
          citiesByCountry={citiesByCountry}
          onDrill={(item, kind) => {
            if (!item.countryCode) return;
            setQuery("");
            setDrill({
              countryCode: item.countryCode,
              countryName: item.label,
              kind,
            });
          }}
        />
        {activeItems.length > 0 ? (
          <p className="mt-2 px-2 text-[11px] tracking-wide text-muted-foreground uppercase">
            {metric} · Visitors
            {query.trim()
              ? ` · filtered`
              : drill
                ? ` · ${activeItems.length}`
                : null}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
