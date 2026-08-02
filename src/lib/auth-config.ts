import { timingSafeEqual } from "node:crypto";

/**
 * Self-host auth knobs. Server-only — do not import from client components.
 */

export function isSignupDisabled(): boolean {
  const raw = process.env.DISABLE_SIGNUP?.trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}

export function getBootstrapCredentials(): {
  email: string;
  password: string;
} | null {
  const email = process.env.USTATS_BOOTSTRAP_EMAIL?.trim();
  const password = process.env.USTATS_BOOTSTRAP_PASSWORD ?? "";

  if (!email || !password) {
    return null;
  }

  return { email, password };
}

/** Instance recovery phrase for password reset while signed in. */
export function getRecoveryPhrase(): string | null {
  const phrase = process.env.USTATS_RECOVERY_PHRASE ?? "";
  if (!phrase) {
    return null;
  }
  return phrase;
}

/** Constant-time string compare; false when either side is empty. */
export function safeEqualString(a: string, b: string): boolean {
  if (!a || !b) {
    return false;
  }

  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA);
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}
