import { CountriesList } from "@/components/dashboard/countries-list";
import { GeoBreakdownCharts } from "@/components/dashboard/geo-breakdown-charts";
import { WorldVisitorsMap } from "@/components/dashboard/world-map";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSiteOrNotFound, parseDateRange } from "@/lib/site";
import { getSiteStats, type BreakdownRow } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";

const MOCK_COUNTRIES: BreakdownRow[] = [
  { key: "US", count: 1842, visitors: 612 },
  { key: "FR", count: 968, visitors: 341 },
  { key: "GB", count: 540, visitors: 198 },
  { key: "DE", count: 412, visitors: 156 },
  { key: "CA", count: 388, visitors: 142 },
  { key: "BR", count: 276, visitors: 109 },
  { key: "AU", count: 241, visitors: 94 },
  { key: "JP", count: 198, visitors: 81 },
  { key: "NL", count: 164, visitors: 67 },
  { key: "SE", count: 148, visitors: 58 },
  { key: "IN", count: 132, visitors: 51 },
  { key: "ES", count: 121, visitors: 47 },
  { key: "IT", count: 109, visitors: 42 },
  { key: "AR", count: 96, visitors: 38 },
  { key: "MX", count: 88, visitors: 34 },
  { key: "PL", count: 74, visitors: 29 },
  { key: "NO", count: 61, visitors: 24 },
  { key: "DK", count: 55, visitors: 22 },
  { key: "KR", count: 49, visitors: 19 },
  { key: "ZA", count: 37, visitors: 15 },
];

const MOCK_REGIONS: Record<string, BreakdownRow[]> = {
  US: [
    { key: "California", count: 512, visitors: 178 },
    { key: "New York", count: 341, visitors: 112 },
    { key: "Texas", count: 268, visitors: 94 },
    { key: "Florida", count: 194, visitors: 71 },
    { key: "Washington", count: 128, visitors: 45 },
  ],
  FR: [
    { key: "Île-de-France", count: 412, visitors: 148 },
    { key: "Auvergne-Rhône-Alpes", count: 186, visitors: 67 },
    { key: "Provence-Alpes-Côte d'Azur", count: 142, visitors: 51 },
    { key: "Occitanie", count: 98, visitors: 36 },
  ],
  GB: [
    { key: "England", count: 398, visitors: 146 },
    { key: "Scotland", count: 84, visitors: 31 },
    { key: "Wales", count: 36, visitors: 14 },
  ],
  DE: [
    { key: "Bavaria", count: 128, visitors: 48 },
    { key: "Berlin", count: 96, visitors: 37 },
    { key: "North Rhine-Westphalia", count: 88, visitors: 34 },
  ],
  CA: [
    { key: "Ontario", count: 168, visitors: 62 },
    { key: "British Columbia", count: 112, visitors: 41 },
    { key: "Quebec", count: 74, visitors: 28 },
  ],
};

const MOCK_CITIES: Record<string, BreakdownRow[]> = {
  US: [
    { key: "San Francisco", count: 286, visitors: 98 },
    { key: "New York", count: 241, visitors: 84 },
    { key: "Austin", count: 156, visitors: 55 },
    { key: "Seattle", count: 124, visitors: 43 },
    { key: "Miami", count: 98, visitors: 36 },
  ],
  FR: [
    { key: "Paris", count: 368, visitors: 132 },
    { key: "Lyon", count: 142, visitors: 51 },
    { key: "Marseille", count: 96, visitors: 34 },
    { key: "Toulouse", count: 72, visitors: 26 },
  ],
  GB: [
    { key: "London", count: 312, visitors: 118 },
    { key: "Manchester", count: 78, visitors: 29 },
    { key: "Edinburgh", count: 54, visitors: 21 },
  ],
  DE: [
    { key: "Berlin", count: 118, visitors: 44 },
    { key: "Munich", count: 96, visitors: 36 },
    { key: "Hamburg", count: 64, visitors: 24 },
  ],
  CA: [
    { key: "Toronto", count: 142, visitors: 52 },
    { key: "Vancouver", count: 98, visitors: 36 },
    { key: "Montreal", count: 68, visitors: 25 },
  ],
};

export default async function GeographicsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const { range } = parseDateRange(sp.range);
  const site = await getSiteOrNotFound(id);
  const supabase = await createClient();
  const stats = await getSiteStats(supabase, site.id, range);
  const realCountries = stats.topCountries.filter((row) => row.key !== "(none)");
  const usingMock = realCountries.length === 0;
  const countries = usingMock ? MOCK_COUNTRIES : realCountries;
  const regionsByCountry = usingMock ? MOCK_REGIONS : stats.regionsByCountry;
  const citiesByCountry = usingMock ? MOCK_CITIES : stats.citiesByCountry;
  const totalViews = countries.reduce((sum, row) => sum + row.count, 0);
  const totalVisitors = usingMock
    ? countries.reduce((sum, row) => sum + row.visitors, 0)
    : stats.visitors;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight">
          Geographics
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Where your visitors are browsing from
        </p>
      </div>

      {usingMock && (
        <p className="rounded-lg border border-border/70 bg-accent-soft/60 px-3 py-2 text-sm text-muted-foreground">
          Showing sample data so you can preview the map — real countries will
          replace this once pageviews arrive.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card size="sm" className="bg-card/80">
          <CardHeader>
            <CardDescription className="text-[11px] tracking-[0.14em] uppercase">
              Countries
            </CardDescription>
            <CardTitle className="font-display text-3xl font-semibold tracking-tight tabular-nums">
              {countries.length.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm" className="bg-card/80">
          <CardHeader>
            <CardDescription className="text-[11px] tracking-[0.14em] uppercase">
              Pageviews
            </CardDescription>
            <CardTitle className="font-display text-3xl font-semibold tracking-tight tabular-nums">
              {totalViews.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm" className="bg-card/80">
          <CardHeader>
            <CardDescription className="text-[11px] tracking-[0.14em] uppercase">
              Visitors
            </CardDescription>
            <CardTitle className="font-display text-3xl font-semibold tracking-tight tabular-nums">
              {totalVisitors.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="bg-card/80">
        <CardHeader className="border-b border-border/60">
          <CardTitle className="font-display text-lg font-semibold tracking-tight">
            Visitor map
          </CardTitle>
          <CardDescription>
            Countries shaded by unique visitors in this range
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <WorldVisitorsMap rows={countries} />
        </CardContent>
      </Card>

      <GeoBreakdownCharts
        countries={countries}
        regionsByCountry={regionsByCountry}
        citiesByCountry={citiesByCountry}
      />

      <CountriesList
        rows={countries}
        regionsByCountry={regionsByCountry}
        citiesByCountry={citiesByCountry}
      />
    </div>
  );
}
