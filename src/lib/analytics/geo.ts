import type { NextRequest } from "next/server";

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "0.0.0.0";
  }

  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "0.0.0.0"
  );
}

function cleanGeoValue(value: string | null, maxLen = 64): string | null {
  if (!value) return null;
  let decoded = value.trim();
  try {
    decoded = decodeURIComponent(decoded.replace(/\+/g, " ")).trim();
  } catch {
    // keep raw value
  }
  if (!decoded || decoded === "XX" || decoded === "T1") return null;
  return decoded.slice(0, maxLen);
}

export function getCountry(request: NextRequest): string | null {
  const raw =
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    request.headers.get("x-country-code");
  const country = cleanGeoValue(raw, 2);
  return country ? country.toUpperCase() : null;
}

/** Subdivision / state — prefers human name when available. */
export function getRegion(request: NextRequest): string | null {
  return (
    cleanGeoValue(request.headers.get("cf-region")) ||
    cleanGeoValue(request.headers.get("x-vercel-ip-country-region"), 8) ||
    cleanGeoValue(request.headers.get("x-region-code"), 8) ||
    null
  );
}

export function getCity(request: NextRequest): string | null {
  return (
    cleanGeoValue(request.headers.get("x-vercel-ip-city")) ||
    cleanGeoValue(request.headers.get("cf-ipcity")) ||
    cleanGeoValue(request.headers.get("x-city")) ||
    null
  );
}
