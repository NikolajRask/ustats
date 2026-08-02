import { createHash } from "crypto";

function baseSalt(): string {
  return process.env.USTATS_HASH_SALT ?? "ustats-dev-salt-change-me";
}

function dailySalt(): string {
  const day = new Date().toISOString().slice(0, 10);
  return `${baseSalt()}:${day}`;
}

function stableSalt(): string {
  return baseSalt();
}

export type HashVisitorOptions = {
  /** When true, omit the daily salt so the same IP+UA keeps one visitor_hash. */
  crossDay?: boolean;
};

export function hashVisitor(
  ip: string,
  userAgent: string,
  options?: HashVisitorOptions,
): string {
  const salt = options?.crossDay ? stableSalt() : dailySalt();
  return createHash("sha256")
    .update(`${salt}|${ip}|${userAgent}`)
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
