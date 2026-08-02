import { CustomEventsView } from "@/components/dashboard/views/custom-events-view";
import { getSiteEventAliases } from "@/lib/event-aliases";
import { getSiteOrNotFound, parseDateRange } from "@/lib/site";
import { getSiteStats } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";

export default async function CustomEventsPage({
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
  const [stats, aliases] = await Promise.all([
    getSiteStats(supabase, site.id, range),
    getSiteEventAliases(supabase, site.id).catch(() => ({})),
  ]);

  return (
    <CustomEventsView siteId={site.id} stats={stats} aliases={aliases} />
  );
}
