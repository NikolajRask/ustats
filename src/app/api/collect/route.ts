import { NextResponse, type NextRequest } from "next/server";

import { domainMatches, normalizeDomain } from "@/lib/analytics/domain";
import { getCity, getClientIp, getCountry, getRegion } from "@/lib/analytics/geo";
import {
  currentHourBucket,
  hashSession,
  hashVisitor,
} from "@/lib/analytics/hash";
import { isBot, parseUserAgent } from "@/lib/analytics/parse-ua";
import {
  extractPath,
  extractReferrerHost,
  parseUtmsFromUrl,
} from "@/lib/analytics/utm";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

const MAX_BODY_BYTES = 8_192;
const MAX_PROPS_KEYS = 20;

type CollectBody = {
  k?: string;
  n?: string;
  u?: string;
  r?: string;
  d?: string;
  p?: Record<string, unknown>;
};

function corsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
  // sendBeacon is credentialed; specific Origin is required (not *) with this header.
  if (origin) {
    headers["Access-Control-Allow-Credentials"] = "true";
  }
  return headers;
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "payload too large" },
        { status: 413, headers },
      );
    }

    const body = (await request.json()) as CollectBody;
    const publicKey = body.k?.trim();
    const eventName = (body.n || "pageview").trim().slice(0, 64) || "pageview";
    const url = typeof body.u === "string" ? body.u.slice(0, 2048) : null;
    const referrer = typeof body.r === "string" ? body.r.slice(0, 2048) : null;
    const reportedDomain =
      typeof body.d === "string" ? normalizeDomain(body.d) : null;

    if (!publicKey) {
      return NextResponse.json(
        { error: "missing site key" },
        { status: 400, headers },
      );
    }

    const userAgent = request.headers.get("user-agent");
    if (isBot(userAgent)) {
      return NextResponse.json({ ok: true }, { status: 202, headers });
    }

    const admin = createAdminClient();
    const { data: site, error: siteError } = await admin
      .from("sites")
      .select("id, domain, cross_day_tracking")
      .eq("public_key", publicKey)
      .maybeSingle();

    if (siteError || !site) {
      return NextResponse.json(
        { error: "unknown site" },
        { status: 404, headers },
      );
    }

    let eventHost = reportedDomain;
    if (!eventHost && url) {
      try {
        eventHost = normalizeDomain(new URL(url).hostname);
      } catch {
        eventHost = null;
      }
    }
    if (!eventHost && origin) {
      try {
        eventHost = normalizeDomain(new URL(origin).hostname);
      } catch {
        eventHost = null;
      }
    }

    if (!eventHost || !domainMatches(site.domain, eventHost)) {
      const payload: Record<string, string> = { error: "domain mismatch" };
      if (process.env.NODE_ENV === "development") {
        payload.expected = normalizeDomain(site.domain);
        payload.got = eventHost ?? "(missing)";
      }
      return NextResponse.json(payload, { status: 403, headers });
    }

    let props: Json = {};
    if (body.p && typeof body.p === "object" && !Array.isArray(body.p)) {
      const entries = Object.entries(body.p).slice(0, MAX_PROPS_KEYS);
      const cleaned: Record<string, string | number | boolean> = {};
      for (const [key, value] of entries) {
        const k = String(key).slice(0, 64);
        if (
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean"
        ) {
          cleaned[k] = value;
        } else if (value != null) {
          cleaned[k] = String(value).slice(0, 256);
        }
      }
      props = cleaned;
    }

    const ip = getClientIp(request);
    const visitorHash = hashVisitor(ip, userAgent || "", {
      crossDay: site.cross_day_tracking,
    });
    const sessionHash = hashSession(visitorHash, currentHourBucket());
    const ua = parseUserAgent(userAgent);
    const utms = parseUtmsFromUrl(url);

    const { error: insertError } = await admin.from("events").insert({
      site_id: site.id,
      name: eventName,
      path: extractPath(url),
      url,
      referrer,
      referrer_host: extractReferrerHost(referrer),
      ...utms,
      country: getCountry(request),
      region: getRegion(request),
      city: getCity(request),
      device: ua.device,
      browser: ua.browser,
      os: ua.os,
      visitor_hash: visitorHash,
      session_hash: sessionHash,
      props,
    });

    if (insertError) {
      console.error("collect insert failed", insertError);
      return NextResponse.json(
        { error: "failed to store event" },
        { status: 500, headers },
      );
    }

    return NextResponse.json({ ok: true }, { status: 202, headers });
  } catch (error) {
    console.error("collect error", error);
    return NextResponse.json(
      { error: "bad request" },
      { status: 400, headers },
    );
  }
}
