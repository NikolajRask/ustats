"use client";

import { geoEqualEarth, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { alpha2ToNumeric } from "i18n-iso-countries";
import { useEffect, useMemo, useState } from "react";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";

import {
  MAP_REGIONS,
  REGION_NUMERIC_IDS,
  type MapRegion,
} from "@/lib/map-regions";
import type { BreakdownRow } from "@/lib/stats";
import { cn } from "@/lib/utils";

type CountryProps = { name: string };
type CountryFeature = Feature<Geometry, CountryProps> & { id?: string | number };

type HoverState = {
  name: string;
  code: string;
  visitors: number;
  views: number;
  x: number;
  y: number;
} | null;

const WIDTH = 960;
const HEIGHT = 460;
const PAD = 28;

const FILL_EMPTY = "#e8eeeb";
const FILL_LOW = "#b7d4cb";
const FILL_HIGH = "#2a9b7d";
const STROKE = "#f7faf8";
const BG = "#f4f7f5";

function lerpChannel(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

function hexToRgb(hex: string) {
  const n = Number.parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function fillForValue(value: number, max: number) {
  if (value <= 0 || max <= 0) return FILL_EMPTY;
  const t = Math.min(1, Math.sqrt(value / max));
  const low = hexToRgb(FILL_LOW);
  const high = hexToRgb(FILL_HIGH);
  return rgbToHex(
    lerpChannel(low.r, high.r, t),
    lerpChannel(low.g, high.g, t),
    lerpChannel(low.b, high.b, t),
  );
}

function countryLabel(code: string) {
  try {
    return (
      new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) ??
      code
    );
  } catch {
    return code;
  }
}

function featureId(country: CountryFeature) {
  return country.id != null ? String(Number(country.id)) : "";
}

/** Numeric ISO ids that stretch Europe / Oceania frames if used for fitExtent. */
const EUROPE_FIT_EXCLUDE = new Set(["643"]); // Russia
const OCEANIA_FIT_IDS = new Set([
  "36", // Australia
  "554", // New Zealand
  "598", // Papua New Guinea
  "540", // New Caledonia
]);

function ringCentroid(ring: number[][]): [number, number] {
  let x = 0;
  let y = 0;
  const n = ring.length > 1 ? ring.length - 1 : ring.length;
  for (let i = 0; i < n; i += 1) {
    x += ring[i][0];
    y += ring[i][1];
  }
  return [x / n, y / n];
}

/** Drop overseas polygons (e.g. French Guiana) so Europe fit stays on the mainland. */
function mainlandEuropeGeometry(country: CountryFeature): CountryFeature | null {
  const geom = country.geometry;
  const inEurope = (lon: number, lat: number) =>
    lon > -25 && lon < 45 && lat > 34 && lat < 73;

  if (geom.type === "Polygon") {
    const [lon, lat] = ringCentroid(geom.coordinates[0]);
    return inEurope(lon, lat) ? country : null;
  }

  if (geom.type === "MultiPolygon") {
    const coordinates = geom.coordinates.filter((polygon) => {
      const [lon, lat] = ringCentroid(polygon[0]);
      return inEurope(lon, lat);
    });
    if (coordinates.length === 0) return null;
    return {
      ...country,
      geometry: { type: "MultiPolygon", coordinates },
    };
  }

  return country;
}

function fitFeaturesForRegion(
  region: MapRegion,
  countries: CountryFeature[],
): CountryFeature[] {
  if (region === "europe") {
    return countries
      .filter((country) => !EUROPE_FIT_EXCLUDE.has(featureId(country)))
      .map(mainlandEuropeGeometry)
      .filter((country): country is CountryFeature => country != null);
  }

  if (region === "oceania") {
    const main = countries.filter((country) =>
      OCEANIA_FIT_IDS.has(featureId(country)),
    );
    return main.length > 0 ? main : countries;
  }

  return countries;
}

function buildLookup(rows: BreakdownRow[]) {
  const byNumeric = new Map<
    string,
    { code: string; visitors: number; views: number }
  >();

  for (const row of rows) {
    const code = row.key.trim().toUpperCase();
    if (!code || code === "(NONE)" || code.length !== 2) continue;
    const numeric = alpha2ToNumeric(code);
    if (!numeric) continue;
    byNumeric.set(String(Number(numeric)), {
      code,
      visitors: row.visitors,
      views: row.count,
    });
  }

  return byNumeric;
}

export function WorldVisitorsMap({
  rows,
  className,
}: {
  rows: BreakdownRow[];
  className?: string;
}) {
  const [countries, setCountries] = useState<CountryFeature[] | null>(null);
  const [region, setRegion] = useState<MapRegion>("world");
  const [hover, setHover] = useState<HoverState>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  const lookup = useMemo(() => buildLookup(rows), [rows]);

  const visibleCountries = useMemo(() => {
    if (!countries) return [];
    if (region === "world") {
      return countries.filter((country) => {
        const id = featureId(country);
        // Hide Antarctica in world view for a tighter frame
        return id !== "10";
      });
    }
    const allowed = REGION_NUMERIC_IDS[region];
    return countries.filter((country) => allowed.has(featureId(country)));
  }, [countries, region]);

  const maxVisitors = useMemo(() => {
    let max = 0;
    for (const country of visibleCountries) {
      const stats = lookup.get(featureId(country));
      if (stats) max = Math.max(max, stats.visitors);
    }
    return max;
  }, [visibleCountries, lookup]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/geo/countries-110m.json");
        if (!res.ok) throw new Error("Failed to load map");
        const topology = (await res.json()) as Topology;
        const countriesObject = topology.objects
          .countries as GeometryCollection<CountryProps>;
        const collection = feature(
          topology,
          countriesObject,
        ) as unknown as FeatureCollection<Geometry, CountryProps>;
        if (!cancelled) {
          setCountries(collection.features as CountryFeature[]);
        }
      } catch {
        if (!cancelled) setLoadError(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  function changeRegion(next: MapRegion) {
    setRegion(next);
    setHover(null);
    setHoverId(null);
  }

  const pathGen = useMemo(() => {
    const projection = geoEqualEarth().clipExtent([
      [0, 0],
      [WIDTH, HEIGHT],
    ]);

    if (visibleCountries.length === 0) {
      projection.translate([WIDTH / 2, HEIGHT / 2]).scale(158);
    } else {
      const fitCountries = fitFeaturesForRegion(region, visibleCountries);
      const pad = region === "europe" || region === "oceania" ? 12 : PAD;
      const collection: FeatureCollection<Geometry, CountryProps> = {
        type: "FeatureCollection",
        features: fitCountries.length > 0 ? fitCountries : visibleCountries,
      };
      projection.fitExtent(
        [
          [pad, pad],
          [WIDTH - pad, HEIGHT - pad],
        ],
        collection,
      );

      // Pull Europe / Oceania in a bit more so they fill the card like Asia.
      if (region === "europe" || region === "oceania") {
        const [tx, ty] = projection.translate();
        projection.scale(projection.scale() * 1.12);
        projection.translate([tx, ty]);
      }
    }

    return geoPath(projection);
  }, [region, visibleCountries]);

  if (loadError) {
    return (
      <div
        className={cn(
          "flex h-[280px] items-center justify-center rounded-lg",
          className,
        )}
        style={{ background: BG }}
      >
        <p className="text-sm text-muted-foreground">Could not load world map</p>
      </div>
    );
  }

  if (!countries) {
    return (
      <div className={cn("space-y-3", className)}>
        <RegionSwitcher region={region} onChange={changeRegion} />
        <div
          className="flex h-[280px] items-center justify-center rounded-lg"
          style={{ background: BG }}
        >
          <p className="text-sm text-muted-foreground">Loading map…</p>
        </div>
      </div>
    );
  }

  const hasData = maxVisitors > 0;
  const tooltipLeft = hover ? Math.max(8, hover.x + 14) : 0;

  return (
    <div className={cn("space-y-3", className)}>
      <RegionSwitcher region={region} onChange={changeRegion} />

      <div
        className="relative overflow-hidden rounded-lg"
        style={{ background: BG }}
      >
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={`${MAP_REGIONS.find((r) => r.id === region)?.label ?? "World"} map of visitors by country`}
          className="h-auto w-full"
          onMouseLeave={() => {
            setHover(null);
            setHoverId(null);
          }}
        >
          <rect width={WIDTH} height={HEIGHT} fill={BG} />
          {visibleCountries.map((country) => {
            const id = featureId(country);
            const stats = id ? lookup.get(id) : undefined;
            const visitors = stats?.visitors ?? 0;
            const d = pathGen(country);
            if (!d) return null;
            const active = hoverId === id && visitors > 0;

            return (
              <path
                key={id || country.properties.name}
                d={d}
                fill={fillForValue(visitors, maxVisitors)}
                stroke={active ? "#1f7a62" : STROKE}
                strokeWidth={active ? 1.2 : region === "world" ? 0.55 : 0.8}
                className="transition-[fill,stroke-width] duration-150"
                style={{
                  cursor: stats ? "pointer" : "default",
                  filter: active ? "brightness(0.96)" : undefined,
                  outline: "none",
                }}
                onMouseMove={(event) => {
                  const rect =
                    event.currentTarget.ownerSVGElement?.getBoundingClientRect();
                  if (!rect) return;
                  setHoverId(id);
                  setHover({
                    name: stats?.code
                      ? countryLabel(stats.code)
                      : country.properties.name,
                    code: stats?.code ?? "",
                    visitors: stats?.visitors ?? 0,
                    views: stats?.views ?? 0,
                    x: event.clientX - rect.left,
                    y: event.clientY - rect.top,
                  });
                }}
                onMouseLeave={() => {
                  setHover(null);
                  setHoverId(null);
                }}
              />
            );
          })}
        </svg>

        {!hasData && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="rounded-md bg-background/80 px-3 py-1.5 text-sm text-muted-foreground ring-1 ring-border/60">
              No country data in this range yet
            </p>
          </div>
        )}

        {hover && hover.visitors > 0 && (
          <div
            className="pointer-events-none absolute z-10 min-w-[150px] -translate-y-full rounded-md border border-border/80 bg-card/95 px-3 py-2 text-xs text-card-foreground shadow-md backdrop-blur-sm"
            style={{
              left: tooltipLeft,
              top: Math.max(52, hover.y - 10),
            }}
          >
            <p className="font-medium tracking-tight">{hover.name}</p>
            <p className="mt-1 tabular-nums text-muted-foreground">
              {hover.visitors.toLocaleString()} visitor
              {hover.visitors === 1 ? "" : "s"}
              <span className="text-border"> · </span>
              {hover.views.toLocaleString()} view{hover.views === 1 ? "" : "s"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function RegionSwitcher({
  region,
  onChange,
}: {
  region: MapRegion;
  onChange: (region: MapRegion) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Map region"
      className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5"
    >
      {MAP_REGIONS.map((item) => {
        const active = item.id === region;
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
