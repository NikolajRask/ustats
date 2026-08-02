/** Bytes per GiB (binary). */
const BYTES_PER_GB = 1024 ** 3;

/** Supabase Free plan database size limit. */
export const FREE_DB_BYTES = 0.5 * BYTES_PER_GB;

/** Pro included disk size before overage. */
export const PRO_INCLUDED_BYTES = 8 * BYTES_PER_GB;

export const PRO_BASE_USD = 25;
export const DISK_OVERAGE_PER_GB_USD = 0.125;

export type SupabasePlan = "free" | "pro";

export function quotaBytesForPlan(plan: SupabasePlan): number {
  return plan === "pro" ? PRO_INCLUDED_BYTES : FREE_DB_BYTES;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 ** 2) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < BYTES_PER_GB) {
    const mb = bytes / 1024 ** 2;
    return mb < 10 ? `${mb.toFixed(1)} MB` : `${Math.round(mb)} MB`;
  }
  const gb = bytes / BYTES_PER_GB;
  return gb < 10 ? `${gb.toFixed(1)} GB` : `${Math.round(gb)} GB`;
}

export function quotaPercent(usedBytes: number, quotaBytes: number): number {
  if (quotaBytes <= 0) return 0;
  return Math.min(100, Math.max(0, (usedBytes / quotaBytes) * 100));
}

export type ProMonthlyEstimate = {
  base: number;
  overage: number;
  overageGb: number;
  total: number;
};

/** Estimate Pro monthly cost from used DB size (not provisioned disk). */
export function estimateProMonthlyUsd(usedBytes: number): ProMonthlyEstimate {
  const usedGb = usedBytes / BYTES_PER_GB;
  const overageGb = Math.max(0, usedGb - PRO_INCLUDED_BYTES / BYTES_PER_GB);
  const overage = overageGb * DISK_OVERAGE_PER_GB_USD;
  return {
    base: PRO_BASE_USD,
    overage,
    overageGb,
    total: PRO_BASE_USD + overage,
  };
}

export function formatUsd(n: number): string {
  if (n === 0) return "$0";
  if (Number.isInteger(n)) return `$${n}`;
  return `$${n.toFixed(2)}`;
}
