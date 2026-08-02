import { notFound } from "next/navigation";

import { rangeFromDays, type DateRange } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";

export type SiteRecord = {
  id: string;
  name: string;
  domain: string;
  public_key: string;
};

export function parseRangeDays(range?: string): number {
  return range === "7" ? 7 : range === "90" ? 90 : 30;
}

export function parseDateRange(range?: string): { days: number; range: DateRange } {
  const days = parseRangeDays(range);
  return { days, range: rangeFromDays(days) };
}

export async function getSiteOrNotFound(id: string): Promise<SiteRecord> {
  const supabase = await createClient();
  const { data: site } = await supabase
    .from("sites")
    .select("id, name, domain, public_key")
    .eq("id", id)
    .maybeSingle();

  if (!site) {
    notFound();
  }

  return site;
}

export function siteHref(siteId: string, path = "", rangeDays?: number) {
  const base = `/dashboard/sites/${siteId}${path}`;
  if (!rangeDays) return base;
  return `${base}?range=${rangeDays}`;
}
