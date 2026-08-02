"use server";

import { redirect } from "next/navigation";

import { normalizeDomain } from "@/lib/analytics/domain";
import {
  getRecoveryPhrase,
  isSignupDisabled,
  safeEqualString,
} from "@/lib/auth-config";
import {
  clearLoginFailures,
  getLoginBanMessage,
  getRequestClientIp,
  recordLoginFailure,
} from "@/lib/login-rate-limit";
import { canManageSites } from "@/lib/roles";
import { getCurrentProfile } from "@/lib/roles.server";
import { createClient } from "@/lib/supabase/server";

const SECURITY_ERROR = (message: string) =>
  `/dashboard/settings/security?error=${encodeURIComponent(message)}`;

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const ip = await getRequestClientIp();

  const banMessage = getLoginBanMessage(ip);
  if (banMessage) {
    redirect(`/login?error=${encodeURIComponent(banMessage)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const lockMessage = recordLoginFailure(ip);
    redirect(
      `/login?error=${encodeURIComponent(lockMessage ?? error.message)}`,
    );
  }

  clearLoginFailures(ip);
  redirect("/dashboard");
}

export async function signUpWithPassword(formData: FormData) {
  if (isSignupDisabled()) {
    redirect(
      `/login?error=${encodeURIComponent("Sign up is disabled on this instance")}`,
    );
  }

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");
  const currentPassword = String(formData.get("current_password") || "");
  const recoveryPhrase = String(formData.get("recovery_phrase") || "");

  if (password.length < 6) {
    redirect(SECURITY_ERROR("Password must be at least 6 characters"));
  }

  if (password !== confirm) {
    redirect(SECURITY_ERROR("Passwords do not match"));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const ip = await getRequestClientIp();
  const rateLimitKey = `password-change:${user.id}:${ip}`;
  const banMessage = getLoginBanMessage(rateLimitKey);
  if (banMessage) {
    redirect(SECURITY_ERROR(banMessage));
  }

  if (recoveryPhrase) {
    const expected = getRecoveryPhrase();
    if (!expected || !safeEqualString(recoveryPhrase, expected)) {
      const lockMessage = recordLoginFailure(rateLimitKey);
      redirect(
        SECURITY_ERROR(
          lockMessage ??
            (expected
              ? "Recovery phrase is incorrect"
              : "Recovery phrase is not configured on this instance"),
        ),
      );
    }
  } else if (currentPassword) {
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (verifyError) {
      const lockMessage = recordLoginFailure(rateLimitKey);
      redirect(
        SECURITY_ERROR(lockMessage ?? "Current password is incorrect"),
      );
    }
  } else {
    redirect(
      SECURITY_ERROR(
        "Enter your current password or the instance recovery phrase",
      ),
    );
  }

  clearLoginFailures(rateLimitKey);

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(SECURITY_ERROR(error.message));
  }

  redirect("/dashboard/settings/security?success=Password%20updated");
}

export async function createSite(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const domain = normalizeDomain(String(formData.get("domain") || ""));

  if (!name || !domain) {
    redirect("/dashboard/sites/new?error=Name%20and%20domain%20are%20required");
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }
  if (!canManageSites(profile.role)) {
    redirect("/dashboard?error=Only%20admins%20can%20create%20sites");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const siteId = crypto.randomUUID();

  const { error } = await supabase.from("sites").insert({
    id: siteId,
    name,
    domain,
    created_by: user.id,
  });

  if (error) {
    redirect(
      `/dashboard/sites/new?error=${encodeURIComponent(error.message)}`,
    );
  }

  // Ensure membership exists even if the DB trigger was missing/outdated.
  await supabase.from("site_members").upsert(
    {
      site_id: siteId,
      user_id: user.id,
      role: "owner",
    },
    { onConflict: "site_id,user_id" },
  );

  redirect(`/dashboard/sites/${siteId}`);
}
