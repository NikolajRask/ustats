import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, SiteReportRow } from "@/lib/supabase/database.types";

export type SiteReport = SiteReportRow;

export async function listSiteReports(
  supabase: SupabaseClient<Database>,
  siteId: string,
): Promise<SiteReport[]> {
  const { data, error } = await supabase
    .from("site_reports")
    .select(
      "id, site_id, created_by, range_days, range_from, range_to, file_name, storage_path, created_at",
    )
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listSiteReports", error.message);
    return [];
  }

  return (data ?? []) as SiteReport[];
}
