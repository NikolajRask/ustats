/**
 * Deploy mode:
 * - app (default): self-host — login/dashboard only; marketing routes 404
 * - marketing: public site — landing/docs/SEO only; product routes 404
 * - development: everything available (local full-stack work)
 *
 * Server-only — do not import from client components.
 */

export type UstatsMode = "app" | "marketing" | "development";

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

const MARKETING_PREFIXES = ["/docs", "/compare", "/preview"];

const PRODUCT_EXACT = new Set(["/login", "/test"]);

export function getUstatsMode(): UstatsMode {
  const raw = process.env.USTATS_MODE?.trim().toLowerCase();
  if (raw === "marketing") return "marketing";
  if (raw === "development") return "development";
  return "app";
}

export function isMarketingMode(): boolean {
  return getUstatsMode() === "marketing";
}

export function isDevelopmentMode(): boolean {
  return getUstatsMode() === "development";
}

/** Landing, docs, SEO, llms — served in marketing and development. */
export function canServeMarketingPages(): boolean {
  const mode = getUstatsMode();
  return mode === "marketing" || mode === "development";
}

/** Login, dashboard, auth — served in app and development. */
export function canServeProductPages(): boolean {
  const mode = getUstatsMode();
  return mode === "app" || mode === "development";
}

/** Landing, docs, SEO guides, compare pages (not `/` — handled per mode). */
export function isMarketingPath(pathname: string): boolean {
  if (pathname === "/") return false;
  if (MARKETING_EXACT.has(pathname)) return true;
  return MARKETING_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Dashboard, login, auth, and the tracker playground. */
export function isProductPath(pathname: string): boolean {
  if (PRODUCT_EXACT.has(pathname)) return true;
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return true;
  }
  if (pathname === "/auth" || pathname.startsWith("/auth/")) {
    return true;
  }
  return false;
}
