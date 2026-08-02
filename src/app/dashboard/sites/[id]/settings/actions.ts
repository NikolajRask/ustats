"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { normalizeDomain } from "@/lib/analytics/domain";
import { createClient } from "@/lib/supabase/server";

export type SiteSettingsActionResult =
  | { ok: true; warning?: string; name?: string; domain?: string }
  | { ok: false; error: string };

/** null = keep forever; otherwise days to retain (1–730). */
export type DataRetentionDays = number | null;

const MIN_RETENTION_DAYS = 1;
const MAX_RETENTION_DAYS = 730;

function revalidateSitePaths(siteId: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings/sites");
  revalidatePath(`/dashboard/sites/${siteId}`);
  revalidatePath(`/dashboard/sites/${siteId}/settings`);
}

export async function updateSite(
  siteId: string,
  input: { name: string; domain: string },
): Promise<SiteSettingsActionResult> {
  if (!siteId) {
    return { ok: false, error: "Missing site" };
  }

  const name = input.name.trim();
  const domain = normalizeDomain(input.domain);

  if (!name || !domain) {
    return { ok: false, error: "Name and domain are required" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("sites")
    .update({ name, domain })
    .eq("id", siteId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidateSitePaths(siteId);
  return { ok: true, name, domain };
}

export async function deleteSite(
  siteId: string,
  confirmationName: string,
): Promise<SiteSettingsActionResult> {
  if (!siteId) {
    return { ok: false, error: "Missing site" };
  }

  const supabase = await createClient();
  const { data: site, error: fetchError } = await supabase
    .from("sites")
    .select("id, name")
    .eq("id", siteId)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, error: fetchError.message };
  }

  if (!site) {
    return { ok: false, error: "Site not found" };
  }

  if (confirmationName.trim() !== site.name) {
    return { ok: false, error: "Confirmation name does not match" };
  }

  const { error } = await supabase.from("sites").delete().eq("id", siteId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings/sites");
  redirect("/dashboard");
}

export async function updateCrossDayTracking(
  siteId: string,
  enabled: boolean,
): Promise<SiteSettingsActionResult> {
  if (!siteId) {
    return { ok: false, error: "Missing site" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("sites")
    .update({ cross_day_tracking: enabled })
    .eq("id", siteId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/dashboard/sites/${siteId}/settings`);
  return { ok: true };
}

export async function updateDataRetention(
  siteId: string,
  days: DataRetentionDays,
): Promise<SiteSettingsActionResult> {
  if (!siteId) {
    return { ok: false, error: "Missing site" };
  }

  if (
    days !== null &&
    (!Number.isInteger(days) ||
      days < MIN_RETENTION_DAYS ||
      days > MAX_RETENTION_DAYS)
  ) {
    return { ok: false, error: "Invalid retention period" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("sites")
    .update({ data_retention_days: days })
    .eq("id", siteId);

  if (error) {
    return { ok: false, error: error.message };
  }

  // Immediately drop anything already past the new window
  if (days !== null) {
    const { error: purgeError } = await supabase.rpc(
      "purge_site_expired_analytics",
      { p_site_id: siteId },
    );
    if (purgeError) {
      revalidatePath(`/dashboard/sites/${siteId}/settings`);
      return {
        ok: true,
        warning: `Saved, but purge failed: ${purgeError.message}. Nightly cleanup will retry.`,
      };
    }
  }

  revalidatePath(`/dashboard/sites/${siteId}/settings`);
  return { ok: true };
}
