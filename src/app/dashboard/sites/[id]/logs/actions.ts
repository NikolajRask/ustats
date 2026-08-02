"use server";

import {
  getSiteLogs,
  LOGS_PAGE_SIZE,
  type DateRange,
  type EventLogRow,
} from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";

export type LoadMoreLogsResult =
  | { ok: true; logs: EventLogRow[]; hasMore: boolean }
  | { ok: false; error: string };

export async function loadMoreSiteLogs(
  siteId: string,
  range: DateRange,
  offset: number,
  limit = LOGS_PAGE_SIZE,
): Promise<LoadMoreLogsResult> {
  if (!siteId) {
    return { ok: false, error: "Missing site" };
  }

  if (!Number.isFinite(offset) || offset < 0) {
    return { ok: false, error: "Invalid offset" };
  }

  if (!Number.isFinite(limit) || limit < 1 || limit > 500) {
    return { ok: false, error: "Invalid limit" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Not authenticated" };
    }

    const logs = await getSiteLogs(supabase, siteId, range, limit, offset);
    return {
      ok: true,
      logs,
      hasMore: logs.length === limit,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load logs",
    };
  }
}
