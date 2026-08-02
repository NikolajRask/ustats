import { createHash } from "crypto";

function dailySalt(): string {
  const base = process.env.USTATS_HASH_SALT ?? "ustats-dev-salt-change-me";
  const day = new Date().toISOString().slice(0, 10);
  return `${base}:${day}`;
}

export function hashVisitor(ip: string, userAgent: string): string {
  return createHash("sha256")
    .update(`${dailySalt()}|${ip}|${userAgent}`)
    .digest("hex")
    .slice(0, 32);
}

export function hashSession(
  visitorHash: string,
  hourBucket: string,
): string {
  return createHash("sha256")
    .update(`${visitorHash}|${hourBucket}`)
    .digest("hex")
    .slice(0, 32);
}

/** Hour bucket for ~1h sessions without cookies */
export function currentHourBucket(): string {
  const now = new Date();
  return `${now.toISOString().slice(0, 13)}`;
}
