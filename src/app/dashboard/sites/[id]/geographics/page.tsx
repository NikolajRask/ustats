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
import { getSiteStats } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";

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
  const countries = stats.topCountries.filter((row) => row.key !== "(none)");
  const totalViews = countries.reduce((sum, row) => sum + row.count, 0);

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
              {stats.visitors.toLocaleString()}
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
        regionsByCountry={stats.regionsByCountry}
        citiesByCountry={stats.citiesByCountry}
      />

      <CountriesList
        rows={countries}
        regionsByCountry={stats.regionsByCountry}
        citiesByCountry={stats.citiesByCountry}
      />
    </div>
  );
}
