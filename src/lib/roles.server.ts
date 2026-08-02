import { redirect } from "next/navigation";

import {
  canManageUsers,
  isStaffRole,
  type Profile,
} from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("profiles")
    .select("id, role, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return data as Profile;
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }
  return profile;
}

export async function requireStaff(): Promise<Profile> {
  const profile = await requireProfile();
  if (!isStaffRole(profile.role)) {
    redirect("/dashboard");
  }
  return profile;
}

export async function requireUserManager(): Promise<Profile> {
  const profile = await requireProfile();
  if (!canManageUsers(profile.role)) {
    redirect("/dashboard");
  }
  return profile;
}
