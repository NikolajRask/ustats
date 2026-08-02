import { headers } from "next/headers";

const MAX_FAILURES = 6;
const BAN_DURATION_MS = 60 * 60 * 1000;

type Entry = {
  failures: number;
  lockedUntil: number | null;
};

const globalForLimit = globalThis as typeof globalThis & {
  __ustatsLoginRateLimit?: Map<string, Entry>;
};

const store =
  globalForLimit.__ustatsLoginRateLimit ?? new Map<string, Entry>();
globalForLimit.__ustatsLoginRateLimit = store;

export async function getRequestClientIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "0.0.0.0";
  }

  return (
    headerList.get("x-real-ip") ||
    headerList.get("cf-connecting-ip") ||
    "0.0.0.0"
  );
}

function formatBanMessage(retryAfterMs: number): string {
  const minutes = Math.max(1, Math.ceil(retryAfterMs / 60_000));
  return `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}

/** Returns an error message if this IP is currently banned. */
export function getLoginBanMessage(ip: string): string | null {
  const entry = store.get(ip);
  if (!entry?.lockedUntil) {
    return null;
  }

  const remaining = entry.lockedUntil - Date.now();
  if (remaining <= 0) {
    store.delete(ip);
    return null;
  }

  return formatBanMessage(remaining);
}

/** Record a failed login. Returns a ban message once the IP is locked out. */
export function recordLoginFailure(ip: string): string | null {
  const existingBan = getLoginBanMessage(ip);
  if (existingBan) {
    return existingBan;
  }

  const entry = store.get(ip) ?? { failures: 0, lockedUntil: null };
  entry.failures += 1;

  if (entry.failures >= MAX_FAILURES) {
    entry.lockedUntil = Date.now() + BAN_DURATION_MS;
    entry.failures = 0;
    store.set(ip, entry);
    return formatBanMessage(BAN_DURATION_MS);
  }

  store.set(ip, entry);
  return null;
}

export function clearLoginFailures(ip: string): void {
  store.delete(ip);
}
