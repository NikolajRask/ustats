import { NextResponse, type NextRequest } from "next/server";

import { domainMatches, normalizeDomain } from "@/lib/analytics/domain";
import {
  extractCulprit,
  fingerprintError,
} from "@/lib/analytics/fingerprint";
import { getCity, getClientIp, getCountry, getRegion } from "@/lib/analytics/geo";
import { hashVisitor } from "@/lib/analytics/hash";
import { isBot, parseUserAgent } from "@/lib/analytics/parse-ua";
import { extractPath } from "@/lib/analytics/utm";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

const MAX_BODY_BYTES = 32_768;
const MAX_EXTRA_KEYS = 20;
type ErrorLevel = "error" | "warning" | "info";
const LEVELS = new Set<string>(["error", "warning", "info"]);

type ErrorBody = {
  k?: string;
  m?: string;
  t?: string;
  s?: string;
  u?: string;
  d?: string;
  l?: string;
  r?: string;
  e?: string;
  x?: Record<string, unknown>;
};

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function cleanExtra(value: Record<string, unknown> | undefined): Json {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const cleaned: Record<string, string | number | boolean> = {};
  for (const [key, entry] of Object.entries(value).slice(0, MAX_EXTRA_KEYS)) {
    const k = String(key).slice(0, 64);
    if (
      typeof entry === "string" ||
      typeof entry === "number" ||
      typeof entry === "boolean"
    ) {
      cleaned[k] =
        typeof entry === "string" ? entry.slice(0, 512) : entry;
    } else if (entry != null) {
      cleaned[k] = String(entry).slice(0, 256);
    }
  }
  return cleaned;
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

    const body = (await request.json()) as ErrorBody;
    const publicKey = body.k?.trim();
    const message =
      typeof body.m === "string" ? body.m.trim().slice(0, 2000) : "";
    const type =
      (typeof body.t === "string" ? body.t.trim().slice(0, 128) : "") ||
      "Error";
    const stack =
      typeof body.s === "string" ? body.s.slice(0, 16_384) : null;
    const url = typeof body.u === "string" ? body.u.slice(0, 2048) : null;
    const reportedDomain =
      typeof body.d === "string" ? normalizeDomain(body.d) : null;
    const levelRaw =
      typeof body.l === "string" ? body.l.trim().toLowerCase() : "error";
    const level: ErrorLevel = LEVELS.has(levelRaw)
      ? (levelRaw as ErrorLevel)
      : "error";
    const release =
      typeof body.r === "string" ? body.r.trim().slice(0, 128) || null : null;
    const environment =
      typeof body.e === "string"
        ? body.e.trim().slice(0, 64) || null
        : null;

    if (!publicKey) {
      return NextResponse.json(
        { error: "missing site key" },
        { status: 400, headers },
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "missing message" },
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
      .select("id, domain")
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

    const fingerprint = fingerprintError(type, message, stack);
    const culprit = extractCulprit(stack);
    const ip = getClientIp(request);
    const visitorHash = hashVisitor(ip, userAgent || "");
    const ua = parseUserAgent(userAgent);

    const { data: groupId, error: groupError } = await admin.rpc(
      "record_error_group",
      {
        p_site_id: site.id,
        p_fingerprint: fingerprint,
        p_type: type,
        p_message: message.slice(0, 1000),
        p_culprit: culprit,
        p_level: level,
      },
    );

    if (groupError || !groupId) {
      console.error("error group upsert failed", groupError);
      return NextResponse.json(
        { error: "failed to store error" },
        { status: 500, headers },
      );
    }

    const { error: insertError } = await admin.from("error_events").insert({
      site_id: site.id,
      group_id: groupId,
      type,
      message: message.slice(0, 2000),
      level,
      stack,
      url,
      path: extractPath(url),
      country: getCountry(request),
      region: getRegion(request),
      city: getCity(request),
      device: ua.device,
      browser: ua.browser,
      os: ua.os,
      visitor_hash: visitorHash,
      release,
      environment,
      extra: cleanExtra(body.x),
    });

    if (insertError) {
      console.error("error event insert failed", insertError);
      return NextResponse.json(
        { error: "failed to store error" },
        { status: 500, headers },
      );
    }

    return NextResponse.json({ ok: true }, { status: 202, headers });
  } catch (error) {
    console.error("error collect failed", error);
    return NextResponse.json(
      { error: "bad request" },
      { status: 400, headers },
    );
  }
}
