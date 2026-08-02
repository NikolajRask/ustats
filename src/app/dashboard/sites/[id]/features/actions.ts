"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isExperimentalEnabled } from "@/lib/experimental";
import {
  validateFeaturePaths,
  type FeatureMatchType,
  type FeaturePathInput,
} from "@/lib/features";
import { normalizePath } from "@/lib/funnels";
import { createClient } from "@/lib/supabase/server";

export type FeatureActionResult =
  | { ok: true; featureId: string }
  | { ok: false; error: string };

function parsePaths(raw: unknown): FeaturePathInput[] | null {
  if (!Array.isArray(raw)) return null;

  const paths: FeaturePathInput[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") return null;
    const record = item as Record<string, unknown>;
    const matchType = record.match_type;
    if (
      matchType !== "exact" &&
      matchType !== "prefix" &&
      matchType !== "contains" &&
      matchType !== "ends_with"
    ) {
      return null;
    }
    if (typeof record.path !== "string") return null;

    paths.push({
      path: normalizePath(record.path),
      match_type: matchType as FeatureMatchType,
    });
  }

  return paths;
}

export async function createFeature(
  formData: FormData,
): Promise<FeatureActionResult> {
  if (!isExperimentalEnabled("features")) {
    return { ok: false, error: "Features are not enabled" };
  }

  const siteId = String(formData.get("siteId") || "");
  const name = String(formData.get("name") || "").trim();
  const pathsRaw = String(formData.get("paths") || "");

  if (!siteId || !name) {
    return { ok: false, error: "Name is required" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(pathsRaw);
  } catch {
    return { ok: false, error: "Invalid paths" };
  }

  const paths = parsePaths(parsed);
  if (!paths) {
    return { ok: false, error: "Invalid paths" };
  }

  const validationError = validateFeaturePaths(paths);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const supabase = await createClient();
  const featureId = crypto.randomUUID();

  const { error: featureError } = await supabase.from("site_features").insert({
    id: featureId,
    site_id: siteId,
    name,
  });

  if (featureError) {
    return { ok: false, error: featureError.message };
  }

  const { error: pathsError } = await supabase.from("site_feature_paths").insert(
    paths.map((path, position) => ({
      feature_id: featureId,
      path: path.path,
      match_type: path.match_type,
      position,
    })),
  );

  if (pathsError) {
    await supabase.from("site_features").delete().eq("id", featureId);
    return { ok: false, error: pathsError.message };
  }

  revalidatePath(`/dashboard/sites/${siteId}/features`);
  return { ok: true, featureId };
}

export async function updateFeature(
  formData: FormData,
): Promise<FeatureActionResult> {
  if (!isExperimentalEnabled("features")) {
    return { ok: false, error: "Features are not enabled" };
  }

  const siteId = String(formData.get("siteId") || "");
  const featureId = String(formData.get("featureId") || "");
  const name = String(formData.get("name") || "").trim();
  const pathsRaw = String(formData.get("paths") || "");

  if (!siteId || !featureId || !name) {
    return { ok: false, error: "Name is required" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(pathsRaw);
  } catch {
    return { ok: false, error: "Invalid paths" };
  }

  const paths = parsePaths(parsed);
  if (!paths) {
    return { ok: false, error: "Invalid paths" };
  }

  const validationError = validateFeaturePaths(paths);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const supabase = await createClient();

  const { error: featureError } = await supabase
    .from("site_features")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", featureId)
    .eq("site_id", siteId);

  if (featureError) {
    return { ok: false, error: featureError.message };
  }

  const { error: deleteError } = await supabase
    .from("site_feature_paths")
    .delete()
    .eq("feature_id", featureId);

  if (deleteError) {
    return { ok: false, error: deleteError.message };
  }

  const { error: pathsError } = await supabase.from("site_feature_paths").insert(
    paths.map((path, position) => ({
      feature_id: featureId,
      path: path.path,
      match_type: path.match_type,
      position,
    })),
  );

  if (pathsError) {
    return { ok: false, error: pathsError.message };
  }

  revalidatePath(`/dashboard/sites/${siteId}/features`);
  return { ok: true, featureId };
}

export async function deleteFeature(formData: FormData) {
  const siteId = String(formData.get("siteId") || "");
  if (!isExperimentalEnabled("features")) {
    redirect(`/dashboard/sites/${siteId}`);
  }

  const featureId = String(formData.get("featureId") || "");

  if (!siteId || !featureId) {
    redirect(`/dashboard/sites/${siteId}/features`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("site_features")
    .delete()
    .eq("id", featureId)
    .eq("site_id", siteId);

  if (error) {
    redirect(
      `/dashboard/sites/${siteId}/features?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath(`/dashboard/sites/${siteId}/features`);
  redirect(`/dashboard/sites/${siteId}/features`);
}
