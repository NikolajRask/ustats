import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, SiteEventAlias } from "@/lib/supabase/database.types";

export type EventAliasMap = Record<
  string,
  Pick<SiteEventAlias, "title" | "description">
>;

export async function getSiteEventAliases(
  supabase: SupabaseClient<Database>,
  siteId: string,
): Promise<EventAliasMap> {
  const { data, error } = await supabase
    .from("site_event_aliases")
    .select("event_name, title, description")
    .eq("site_id", siteId);

  if (error) {
    throw error;
  }

  const map: EventAliasMap = {};
  for (const row of data ?? []) {
    map[row.event_name] = {
      title: row.title,
      description: row.description,
    };
  }
  return map;
}

export async function upsertSiteEventAlias(
  supabase: SupabaseClient<Database>,
  siteId: string,
  eventName: string,
  title: string,
  description: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmedName = eventName.trim().slice(0, 64);
  const trimmedTitle = title.trim().slice(0, 120);
  const trimmedDescription = description.trim().slice(0, 500);

  if (!siteId || !trimmedName) {
    return { ok: false, error: "Missing event name" };
  }

  if (!trimmedTitle && !trimmedDescription) {
    const { error } = await supabase
      .from("site_event_aliases")
      .delete()
      .eq("site_id", siteId)
      .eq("event_name", trimmedName);

    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  }

  const { error } = await supabase.from("site_event_aliases").upsert(
    {
      site_id: siteId,
      event_name: trimmedName,
      title: trimmedTitle,
      description: trimmedDescription,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "site_id,event_name" },
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
