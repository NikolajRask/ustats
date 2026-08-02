const FALLBACK_SITE_URL = "https://ustats.dev";

export const SITE_NAME = "ustats";
export const SITE_TAGLINE = "Self-hosted web analytics on your Supabase project";
export const SITE_DESCRIPTION =
  "Privacy-friendly, cookie-free web analytics you host yourself. Pageviews, uniques, referrers, events, and funnels — data stays in your Supabase.";
export const REPO_URL = "https://github.com/NikolajRask/ustats";
export const DOWNLOAD_URL = `${REPO_URL}/archive/refs/heads/main.zip`;

export function getSiteUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return FALLBACK_SITE_URL;
}

export function absoluteUrl(path = "/") {
  const base = getSiteUrl();
  if (path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
