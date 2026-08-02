import { ReportsDashboard } from "@/components/dashboard/reports-dashboard";
import { listSiteReports } from "@/lib/reports";
import { getSiteOrNotFound, parseDateRange } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const site = await getSiteOrNotFound(id);
  const { days } = parseDateRange(sp.range);
  const supabase = await createClient();
  const reports = await listSiteReports(supabase, site.id);

  return (
    <ReportsDashboard siteId={site.id} rangeDays={days} reports={reports} />
  );
}
