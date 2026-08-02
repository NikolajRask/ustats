"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  normalizePath,
  validateFunnelSteps,
  type FunnelStepInput,
  type FunnelStepType,
} from "@/lib/funnels";
import { createClient } from "@/lib/supabase/server";

export type FunnelActionResult =
  | { ok: true; funnelId: string }
  | { ok: false; error: string };

function parseSteps(raw: unknown): FunnelStepInput[] | null {
  if (!Array.isArray(raw)) return null;

  const steps: FunnelStepInput[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") return null;
    const record = item as Record<string, unknown>;
    const stepType = record.step_type;
    if (stepType !== "path" && stepType !== "event") return null;
    if (typeof record.name !== "string") return null;
    if (typeof record.match_value !== "string") return null;

    const matchValue =
      stepType === "path"
        ? normalizePath(record.match_value)
        : record.match_value.trim();

    steps.push({
      name: record.name.trim(),
      step_type: stepType as FunnelStepType,
      match_value: matchValue,
    });
  }

  return steps;
}

function funnelPath(siteId: string, funnelId?: string) {
  const base = `/dashboard/sites/${siteId}/funnels`;
  return funnelId ? `${base}?funnel=${funnelId}` : base;
}

export async function createFunnel(
  formData: FormData,
): Promise<FunnelActionResult> {
  const siteId = String(formData.get("siteId") || "");
  const name = String(formData.get("name") || "").trim();
  const stepsRaw = String(formData.get("steps") || "");

  if (!siteId || !name) {
    return { ok: false, error: "Name is required" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stepsRaw);
  } catch {
    return { ok: false, error: "Invalid steps" };
  }

  const steps = parseSteps(parsed);
  if (!steps) {
    return { ok: false, error: "Invalid steps" };
  }

  const validationError = validateFunnelSteps(steps);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const supabase = await createClient();
  const funnelId = crypto.randomUUID();

  const { error: funnelError } = await supabase.from("funnels").insert({
    id: funnelId,
    site_id: siteId,
    name,
  });

  if (funnelError) {
    return { ok: false, error: funnelError.message };
  }

  const { error: stepsError } = await supabase.from("funnel_steps").insert(
    steps.map((step, position) => ({
      funnel_id: funnelId,
      position,
      name: step.name,
      step_type: step.step_type,
      match_value: step.match_value,
    })),
  );

  if (stepsError) {
    await supabase.from("funnels").delete().eq("id", funnelId);
    return { ok: false, error: stepsError.message };
  }

  revalidatePath(`/dashboard/sites/${siteId}/funnels`);
  return { ok: true, funnelId };
}

export async function updateFunnel(
  formData: FormData,
): Promise<FunnelActionResult> {
  const siteId = String(formData.get("siteId") || "");
  const funnelId = String(formData.get("funnelId") || "");
  const name = String(formData.get("name") || "").trim();
  const stepsRaw = String(formData.get("steps") || "");

  if (!siteId || !funnelId || !name) {
    return { ok: false, error: "Name is required" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stepsRaw);
  } catch {
    return { ok: false, error: "Invalid steps" };
  }

  const steps = parseSteps(parsed);
  if (!steps) {
    return { ok: false, error: "Invalid steps" };
  }

  const validationError = validateFunnelSteps(steps);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const supabase = await createClient();

  const { error: funnelError } = await supabase
    .from("funnels")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", funnelId)
    .eq("site_id", siteId);

  if (funnelError) {
    return { ok: false, error: funnelError.message };
  }

  const { error: deleteError } = await supabase
    .from("funnel_steps")
    .delete()
    .eq("funnel_id", funnelId);

  if (deleteError) {
    return { ok: false, error: deleteError.message };
  }

  const { error: stepsError } = await supabase.from("funnel_steps").insert(
    steps.map((step, position) => ({
      funnel_id: funnelId,
      position,
      name: step.name,
      step_type: step.step_type,
      match_value: step.match_value,
    })),
  );

  if (stepsError) {
    return { ok: false, error: stepsError.message };
  }

  revalidatePath(`/dashboard/sites/${siteId}/funnels`);
  return { ok: true, funnelId };
}

export async function deleteFunnel(formData: FormData) {
  const siteId = String(formData.get("siteId") || "");
  const funnelId = String(formData.get("funnelId") || "");

  if (!siteId || !funnelId) {
    redirect(funnelPath(siteId));
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("funnels")
    .delete()
    .eq("id", funnelId)
    .eq("site_id", siteId);

  if (error) {
    redirect(
      `${funnelPath(siteId, funnelId)}&error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath(`/dashboard/sites/${siteId}/funnels`);
  redirect(funnelPath(siteId));
}
