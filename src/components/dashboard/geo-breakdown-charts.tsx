"use client";

import { useMemo, useState } from "react";

import {
  DistributionDonut,
  HorizontalBarChart,
} from "@/components/dashboard/charts";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { countryDisplayName } from "@/lib/country-name";
import type { BreakdownRow } from "@/lib/stats";
import { cn } from "@/lib/utils";

type GeoScope = "countries" | "regions" | "cities";

const SCOPES: { id: GeoScope; label: string }[] = [
  { id: "countries", label: "Countries" },
  { id: "regions", label: "Regions" },
  { id: "cities", label: "Cities" },
];

function flattenByCountry(
  byCountry: Record<string, BreakdownRow[]>,
): BreakdownRow[] {
  const map = new Map<string, { count: number; visitors: number }>();

  for (const [country, rows] of Object.entries(byCountry)) {
    const countryName = countryDisplayName(country);
    for (const row of rows) {
      const key = `${row.key} · ${countryName}`;
      const entry = map.get(key) ?? { count: 0, visitors: 0 };
      entry.count += row.count;
      entry.visitors += row.visitors;
      map.set(key, entry);
    }
  }

  return [...map.entries()]
    .map(([key, value]) => ({
      key,
      count: value.count,
      visitors: value.visitors,
    }))
    .sort((a, b) => b.count - a.count);
}

function ScopeSwitcher({
  value,
  onChange,
  ariaLabel,
}: {
  value: GeoScope;
  onChange: (scope: GeoScope) => void;
  ariaLabel: string;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="flex gap-1">
      {SCOPES.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              "shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function rowsForScope(
  scope: GeoScope,
  countries: BreakdownRow[],
  regions: BreakdownRow[],
  cities: BreakdownRow[],
) {
  if (scope === "regions") return regions;
  if (scope === "cities") return cities;
  return countries;
}

function copyForScope(scope: GeoScope) {
  if (scope === "regions") {
    return {
      ranking: "Top regions",
      share: "Top region mix",
      empty: "No region data yet",
      labelAs: undefined as "country" | undefined,
    };
  }
  if (scope === "cities") {
    return {
      ranking: "Top cities",
      share: "Top city mix",
      empty: "No city data yet",
      labelAs: undefined as "country" | undefined,
    };
  }
  return {
    ranking: "Top countries",
    share: "Top country mix",
    empty: "No country data yet",
    labelAs: "country" as const,
  };
}

export function GeoBreakdownCharts({
  countries,
  regionsByCountry,
  citiesByCountry,
}: {
  countries: BreakdownRow[];
  regionsByCountry: Record<string, BreakdownRow[]>;
  citiesByCountry: Record<string, BreakdownRow[]>;
}) {
  const [barScope, setBarScope] = useState<GeoScope>("countries");
  const [shareScope, setShareScope] = useState<GeoScope>("countries");

  const regions = useMemo(
    () => flattenByCountry(regionsByCountry),
    [regionsByCountry],
  );
  const cities = useMemo(
    () => flattenByCountry(citiesByCountry),
    [citiesByCountry],
  );

  const barRows = rowsForScope(barScope, countries, regions, cities);
  const shareRows = rowsForScope(shareScope, countries, regions, cities);
  const barCopy = copyForScope(barScope);
  const shareCopy = copyForScope(shareScope);

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Card className="bg-card/80 lg:col-span-3">
        <CardHeader className="border-b border-border/60">
          <CardTitle className="text-[11px] font-medium tracking-[0.14em] uppercase">
            Ranking
          </CardTitle>
          <CardDescription>{barCopy.ranking}</CardDescription>
          <CardAction className="self-center">
            <ScopeSwitcher
              value={barScope}
              onChange={setBarScope}
              ariaLabel="Bar chart geography"
            />
          </CardAction>
        </CardHeader>
        <CardContent className="pt-4">
          {barRows.length === 0 ? (
            <p className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
              {barCopy.empty}
            </p>
          ) : (
            <HorizontalBarChart
              rows={barRows}
              limit={12}
              height={Math.max(280, Math.min(barRows.length, 12) * 36)}
              labelAs={barCopy.labelAs}
              colorScale
            />
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/80 lg:col-span-2">
        <CardHeader className="border-b border-border/60">
          <CardTitle className="text-[11px] font-medium tracking-[0.14em] uppercase">
            Share
          </CardTitle>
          <CardDescription>{shareCopy.share}</CardDescription>
          <CardAction className="self-center">
            <ScopeSwitcher
              value={shareScope}
              onChange={setShareScope}
              ariaLabel="Share chart geography"
            />
          </CardAction>
        </CardHeader>
        <CardContent className="pt-4">
          {shareRows.length === 0 ? (
            <p className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
              {shareCopy.empty}
            </p>
          ) : (
            <DistributionDonut
              rows={shareRows}
              labelAs={shareCopy.labelAs}
              size="lg"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

