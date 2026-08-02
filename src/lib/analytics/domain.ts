/** Normalize a hostname or domain input for comparison. */
export function normalizeDomain(input: string): string {
  let value = input.trim().toLowerCase();

  value = value.replace(/^https?:\/\//, "");
  value = value.split("/")[0] ?? value;
  // Strip port (localhost:3000 → localhost)
  value = value.replace(/:\d+$/, "");
  value = value.replace(/^www\./, "");

  return value;
}

export function isLocalHost(host: string): boolean {
  const normalized = normalizeDomain(host);
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "[::1]" ||
    normalized === "::1"
  );
}

/**
 * Check whether an event host is allowed for a registered site domain.
 * In development, localhost may send events for any site (local testing).
 */
export function domainMatches(siteDomain: string, host: string): boolean {
  const site = normalizeDomain(siteDomain);
  const requestHost = normalizeDomain(host);

  if (!site || !requestHost) return false;

  if (requestHost === site || requestHost.endsWith(`.${site}`)) {
    return true;
  }

  // Local DX: allow testing the tracker from localhost against a real domain
  if (
    process.env.NODE_ENV === "development" &&
    isLocalHost(requestHost)
  ) {
    return true;
  }

  // Site registered as localhost should accept 127.0.0.1 and vice versa
  if (isLocalHost(site) && isLocalHost(requestHost)) {
    return true;
  }

  return false;
}
