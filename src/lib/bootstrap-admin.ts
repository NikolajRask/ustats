import { getBootstrapCredentials } from "@/lib/auth-config";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * On a fresh install with no Auth users, create the first admin from
 * USTATS_BOOTSTRAP_EMAIL / USTATS_BOOTSTRAP_PASSWORD.
 *
 * The DB trigger on auth.users assigns the first profile the admin role.
 * Safe to call on every server start — no-ops once any user exists.
 * Remove the bootstrap env vars after the first successful boot.
 */
export async function bootstrapAdminUser(): Promise<void> {
  const credentials = getBootstrapCredentials();
  if (!credentials) {
    return;
  }

  if (credentials.password.length < 6) {
    console.warn(
      "[ustats] USTATS_BOOTSTRAP_PASSWORD must be at least 6 characters; skipping bootstrap",
    );
    return;
  }

  try {
    const admin = createAdminClient();
    const { data, error: listError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    if (listError) {
      console.error(
        "[ustats] bootstrap: failed to list users:",
        listError.message,
      );
      return;
    }

    if ((data?.users?.length ?? 0) > 0) {
      return;
    }

    const { error: createError } = await admin.auth.admin.createUser({
      email: credentials.email,
      password: credentials.password,
      email_confirm: true,
    });

    if (createError) {
      // Concurrent cold starts may race; treat duplicate as success.
      if (/already|registered|exists/i.test(createError.message)) {
        return;
      }
      console.error(
        "[ustats] bootstrap: failed to create user:",
        createError.message,
      );
      return;
    }

    console.info(
      `[ustats] bootstrap: created admin user ${credentials.email}`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[ustats] bootstrap failed:", message);
  }
}
