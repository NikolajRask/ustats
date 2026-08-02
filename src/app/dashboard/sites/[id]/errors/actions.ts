"use server";

import {
  ERRORS_PAGE_SIZE,
  getErrorStats,
  type ErrorGroupRow,
} from "@/lib/errors";
import type { DateRange } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";

export type LoadMoreErrorsResult =
  | { ok: true; groups: ErrorGroupRow[]; hasMore: boolean }
  | { ok: false; error: string };

export async function loadMoreErrorGroups(
  siteId: string,
  range: DateRange,
  offset: number,
  limit = ERRORS_PAGE_SIZE,
): Promise<LoadMoreErrorsResult> {
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

    const stats = await getErrorStats(supabase, siteId, range, {
      status: "all",
      limit,
      offset,
    });

    return {
      ok: true,
      groups: stats.groups,
      hasMore: stats.hasMore,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load errors",
    };
  }
}
