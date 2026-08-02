"use server";

import { revalidatePath } from "next/cache";

import { isStaffRole } from "@/lib/roles";
import { getCurrentProfile } from "@/lib/roles.server";
import type { SupabasePlan } from "@/lib/supabase-plan";
import { createClient } from "@/lib/supabase/server";

export type InstanceSettingsActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateSupabasePlan(
  plan: SupabasePlan,
): Promise<InstanceSettingsActionResult> {
  if (plan !== "free" && plan !== "pro") {
    return { ok: false, error: "Invalid plan" };
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    return { ok: false, error: "Not signed in" };
  }
  if (!isStaffRole(profile.role)) {
    return { ok: false, error: "Only staff can update instance settings" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("instance_settings")
    .update({
      supabase_plan: plan,
      updated_at: new Date().toISOString(),
      updated_by: profile.id,
    })
    .eq("id", true);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/settings/instance");
  return { ok: true };
}
