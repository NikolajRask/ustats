export type UtmParams = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
};

export function parseUtmsFromUrl(url: string | null | undefined): UtmParams {
  const empty: UtmParams = {
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_term: null,
    utm_content: null,
  };

  if (!url) return empty;

  try {
    const parsed = new URL(url);
    return {
      utm_source: parsed.searchParams.get("utm_source"),
      utm_medium: parsed.searchParams.get("utm_medium"),
      utm_campaign: parsed.searchParams.get("utm_campaign"),
      utm_term: parsed.searchParams.get("utm_term"),
      utm_content: parsed.searchParams.get("utm_content"),
    };
  } catch {
    return empty;
  }
}

export function extractPath(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).pathname || "/";
  } catch {
    return url.startsWith("/") ? url : null;
  }
}

export function extractReferrerHost(
  referrer: string | null | undefined,
): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname || null;
  } catch {
    return null;
  }
}
