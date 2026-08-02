import { GeographicsView } from "@/components/dashboard/views/geographics-view";
import { getPreviewStats } from "@/lib/preview/sample-data";
import { parseDateRange } from "@/lib/site";

export default async function PreviewGeographicsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const sp = await searchParams;
  const { days } = parseDateRange(sp.range);
  const stats = getPreviewStats(days);
  const countries = stats.topCountries.filter((row) => row.key !== "(none)");

  return <GeographicsView stats={stats} countries={countries} />;
}
