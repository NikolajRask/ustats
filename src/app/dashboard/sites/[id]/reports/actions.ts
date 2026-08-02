"use server";

import { revalidatePath } from "next/cache";

import {
  buildReportDocx,
  buildReportFileName,
  REPORTS_BUCKET,
  reportStoragePath,
} from "@/lib/reports/docx";
import { parseRangeDays } from "@/lib/site";
import { getSiteStats, rangeFromDays } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";

export type ReportActionResult =
  | { ok: true; reportId: string; downloadUrl: string; fileName: string }
  | { ok: false; error: string };

export type ReportDownloadResult =
  | { ok: true; downloadUrl: string; fileName: string }
  | { ok: false; error: string };

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const SIGNED_URL_SECONDS = 60 * 10;

export async function generateReport(
  siteId: string,
  rangeDaysInput: number | string,
): Promise<ReportActionResult> {
  if (!siteId) return { ok: false, error: "Site is required" };

  const rangeDays = parseRangeDays(String(rangeDaysInput));
  const range = rangeFromDays(rangeDays);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in" };

  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("id, name, domain")
    .eq("id", siteId)
    .maybeSingle();

  if (siteError || !site) {
    return { ok: false, error: siteError?.message ?? "Site not found" };
  }

  const stats = await getSiteStats(supabase, siteId, range);
  const reportId = crypto.randomUUID();
  const generatedAt = new Date();
  const fileName = buildReportFileName(site.domain, rangeDays, generatedAt);
  const storagePath = reportStoragePath(siteId, reportId);

  const bytes = await buildReportDocx({
    siteName: site.name,
    siteDomain: site.domain,
    rangeDays,
    rangeFrom: range.from,
    rangeTo: range.to,
    generatedAt: generatedAt.toISOString(),
    stats,
  });

  const { error: uploadError } = await supabase.storage
    .from(REPORTS_BUCKET)
    .upload(storagePath, bytes, {
      contentType: DOCX_MIME,
      upsert: false,
    });

  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  const { error: insertError } = await supabase.from("site_reports").insert({
    id: reportId,
    site_id: siteId,
    created_by: user.id,
    range_days: rangeDays,
    range_from: range.from,
    range_to: range.to,
    file_name: fileName,
    storage_path: storagePath,
  });

  if (insertError) {
    await supabase.storage.from(REPORTS_BUCKET).remove([storagePath]);
    return { ok: false, error: insertError.message };
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from(REPORTS_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_SECONDS, {
      download: fileName,
    });

  if (signedError || !signed?.signedUrl) {
    revalidatePath(`/dashboard/sites/${siteId}/reports`);
    return {
      ok: false,
      error: signedError?.message ?? "Report saved but download URL failed",
    };
  }

  revalidatePath(`/dashboard/sites/${siteId}/reports`);
  return {
    ok: true,
    reportId,
    downloadUrl: signed.signedUrl,
    fileName,
  };
}

export async function getReportDownloadUrl(
  siteId: string,
  reportId: string,
): Promise<ReportDownloadResult> {
  if (!siteId || !reportId) {
    return { ok: false, error: "Report is required" };
  }

  const supabase = await createClient();
  const { data: report, error } = await supabase
    .from("site_reports")
    .select("id, file_name, storage_path")
    .eq("id", reportId)
    .eq("site_id", siteId)
    .maybeSingle();

  if (error || !report) {
    return { ok: false, error: error?.message ?? "Report not found" };
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from(REPORTS_BUCKET)
    .createSignedUrl(report.storage_path, SIGNED_URL_SECONDS, {
      download: report.file_name,
    });

  if (signedError || !signed?.signedUrl) {
    return {
      ok: false,
      error: signedError?.message ?? "Could not create download URL",
    };
  }

  return {
    ok: true,
    downloadUrl: signed.signedUrl,
    fileName: report.file_name,
  };
}

export async function deleteReport(
  siteId: string,
  reportId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!siteId || !reportId) {
    return { ok: false, error: "Report is required" };
  }

  const supabase = await createClient();
  const { data: report, error } = await supabase
    .from("site_reports")
    .select("id, storage_path")
    .eq("id", reportId)
    .eq("site_id", siteId)
    .maybeSingle();

  if (error || !report) {
    return { ok: false, error: error?.message ?? "Report not found" };
  }

  const { error: deleteError } = await supabase
    .from("site_reports")
    .delete()
    .eq("id", reportId)
    .eq("site_id", siteId);

  if (deleteError) {
    return { ok: false, error: deleteError.message };
  }

  await supabase.storage.from(REPORTS_BUCKET).remove([report.storage_path]);

  revalidatePath(`/dashboard/sites/${siteId}/reports`);
  return { ok: true };
}
