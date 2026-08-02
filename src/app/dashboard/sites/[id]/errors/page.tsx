import { ErrorsView } from "@/components/dashboard/views/errors-view";
import { ERRORS_PAGE_SIZE, getErrorStats } from "@/lib/errors";
import { getSiteOrNotFound, parseDateRange } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export default async function ErrorsPage({
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
  const stats = await getErrorStats(supabase, site.id, range, {
    status: "all",
    limit: ERRORS_PAGE_SIZE,
  });

  return <ErrorsView siteId={site.id} range={range} stats={stats} />;
}
