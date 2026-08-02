import { createHash } from "crypto";

/** Collapse volatile tokens so similar errors share a fingerprint. */
export function normalizeErrorMessage(message: string): string {
  return message
    .replace(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
      "<uuid>",
    )
    .replace(/\b0x[0-9a-f]+\b/gi, "<hex>")
    .replace(/\b\d{4,}\b/g, "N")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

export function extractCulprit(stack: string | null | undefined): string | null {
  if (!stack) return null;
  const lines = stack
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const frame =
    lines.find((line) => /^at\s+/.test(line) || line.includes("@")) ??
    lines[1] ??
    lines[0];

  if (!frame) return null;
  return frame.replace(/:\d+:\d+/g, ":N:N").slice(0, 256);
}

export function fingerprintError(
  type: string,
  message: string,
  stack: string | null | undefined,
): string {
  const culprit = extractCulprit(stack) ?? "";
  return createHash("sha256")
    .update(
      `${type.trim()}|${normalizeErrorMessage(message)}|${culprit}`,
      "utf8",
    )
    .digest("hex")
    .slice(0, 32);
}
