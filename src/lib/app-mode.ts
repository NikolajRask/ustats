/**
 * Deploy mode: self-host installs default to the app; the public site sets marketing.
 * Server-only — do not import from client components.
 */

export type UstatsMode = "app" | "marketing";

const MARKETING_EXACT = new Set([
  "/roadmap",
  "/alternatives",
  "/llms.txt",
  "/self-hosted-analytics",
  "/cookie-free-analytics",
  "/privacy-friendly-analytics",
  "/open-source-web-analytics",
  "/supabase-analytics",
]);

const MARKETING_PREFIXES = ["/docs", "/compare"];

export function getUstatsMode(): UstatsMode {
  const raw = process.env.USTATS_MODE?.trim().toLowerCase();
  return raw === "marketing" ? "marketing" : "app";
}

export function isMarketingMode(): boolean {
  return getUstatsMode() === "marketing";
}

/** Landing, docs, SEO guides, compare pages — only served when USTATS_MODE=marketing. */
export function isMarketingPath(pathname: string): boolean {
  if (pathname === "/") return false;
  if (MARKETING_EXACT.has(pathname)) return true;
  return MARKETING_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
