"use server";

import { revalidatePath } from "next/cache";

import { upsertSiteEventAlias } from "@/lib/event-aliases";
import { createClient } from "@/lib/supabase/server";

export type EventAliasActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function saveEventAlias(
  siteId: string,
  eventName: string,
  title: string,
  description: string,
): Promise<EventAliasActionResult> {
  if (!siteId) {
    return { ok: false, error: "Missing site" };
  }

  const supabase = await createClient();
  const result = await upsertSiteEventAlias(
    supabase,
    siteId,
    eventName,
    title,
    description,
  );

  if (!result.ok) {
    return result;
  }

  revalidatePath(`/dashboard/sites/${siteId}/events`);
  return { ok: true };
}
