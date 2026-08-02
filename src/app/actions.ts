"use server";

import { redirect } from "next/navigation";

import { normalizeDomain } from "@/lib/analytics/domain";
import { createClient } from "@/lib/supabase/server";

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export async function signUpWithPassword(formData: FormData) {
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

  if (password.length < 6) {
    redirect(
      `/dashboard/settings/security?error=${encodeURIComponent("Password must be at least 6 characters")}`,
    );
  }

  if (password !== confirm) {
    redirect(
      `/dashboard/settings/security?error=${encodeURIComponent("Passwords do not match")}`,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(
      `/dashboard/settings/security?error=${encodeURIComponent(error.message)}`,
    );
  }

  redirect("/dashboard/settings/security?success=Password%20updated");
}

export async function createSite(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const domain = normalizeDomain(String(formData.get("domain") || ""));

  if (!name || !domain) {
    redirect("/dashboard/sites/new?error=Name%20and%20domain%20are%20required");
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
