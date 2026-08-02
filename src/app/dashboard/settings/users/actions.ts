"use server";

import { revalidatePath } from "next/cache";

import {
  canManageElevatedRoles,
  canManageUsers,
  type InstanceRole,
} from "@/lib/roles";
import { getCurrentProfile } from "@/lib/roles.server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type UserActionResult =
  | { ok: true }
  | { ok: false; error: string };

function revalidateUsers() {
  revalidatePath("/dashboard/settings/users");
}

async function requireStaffActor() {
  const profile = await getCurrentProfile();
  if (!profile || !canManageUsers(profile.role)) {
    return null;
  }
  return profile;
}

async function countAdmins(admin = createAdminClient()): Promise<number> {
  const { count, error } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");

  if (error) {
    throw new Error(error.message);
  }
  return count ?? 0;
}

async function setGuestSites(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  siteIds: string[],
) {
  const unique = [...new Set(siteIds.filter(Boolean))];

  const { error: deleteError } = await admin
    .from("site_members")
    .delete()
    .eq("user_id", userId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (unique.length === 0) {
    return;
  }

  const { error: insertError } = await admin.from("site_members").insert(
    unique.map((site_id) => ({
      site_id,
      user_id: userId,
      role: "viewer" as const,
    })),
  );

  if (insertError) {
    throw new Error(insertError.message);
  }
}

export async function createInstanceUser(input: {
  email: string;
  password: string;
  role: InstanceRole;
  siteIds: string[];
}): Promise<UserActionResult> {
  const actor = await requireStaffActor();
  if (!actor) {
    return { ok: false, error: "Not allowed" };
  }

  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const role: InstanceRole = input.role === "co_admin" ? "co_admin" : "guest";

  if (!email || !password) {
    return { ok: false, error: "Email and password are required" };
  }
  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters" };
  }

  if (role === "co_admin" && !canManageElevatedRoles(actor.role)) {
    return { ok: false, error: "Only admins can create co-admins" };
  }

  const admin = createAdminClient();

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (createError || !created.user) {
    return {
      ok: false,
      error: createError?.message ?? "Failed to create user",
    };
  }

  const userId = created.user.id;

  // Trigger sets guest by default; upgrade to co_admin when requested.
  if (role === "co_admin") {
    const { error: roleError } = await admin
      .from("profiles")
      .update({ role: "co_admin" })
      .eq("id", userId);

    if (roleError) {
      await admin.auth.admin.deleteUser(userId);
      return { ok: false, error: roleError.message };
    }
  } else {
    // Ensure guest (in case of race with empty profiles)
    await admin.from("profiles").upsert({ id: userId, role: "guest" });
  }

  if (role === "guest") {
    try {
      await setGuestSites(admin, userId, input.siteIds);
    } catch (error) {
      await admin.auth.admin.deleteUser(userId);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to assign sites",
      };
    }
  }

  revalidateUsers();
  return { ok: true };
}

export async function updateUserSites(
  userId: string,
  siteIds: string[],
): Promise<UserActionResult> {
  const actor = await requireStaffActor();
  if (!actor) {
    return { ok: false, error: "Not allowed" };
  }

  if (!userId) {
    return { ok: false, error: "Missing user" };
  }

  const admin = createAdminClient();
  const { data: target, error } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!target) {
    return { ok: false, error: "User not found" };
  }
  if (target.role !== "guest") {
    return { ok: false, error: "Site access only applies to guests" };
  }

  try {
    await setGuestSites(admin, userId, siteIds);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update sites",
    };
  }

  revalidateUsers();
  return { ok: true };
}

export async function updateUserRole(
  userId: string,
  role: InstanceRole,
): Promise<UserActionResult> {
  const actor = await requireStaffActor();
  if (!actor) {
    return { ok: false, error: "Not allowed" };
  }

  if (!canManageElevatedRoles(actor.role)) {
    return { ok: false, error: "Only admins can change roles" };
  }

  if (!userId) {
    return { ok: false, error: "Missing user" };
  }
  if (role !== "guest" && role !== "co_admin") {
    return { ok: false, error: "Invalid role" };
  }
  if (userId === actor.id) {
    return { ok: false, error: "You cannot change your own role" };
  }

  const admin = createAdminClient();
  const { data: target, error } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!target) {
    return { ok: false, error: "User not found" };
  }

  if (target.role === "admin") {
    const admins = await countAdmins(admin);
    if (admins <= 1) {
      return { ok: false, error: "Cannot demote the last admin" };
    }
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  // Guests need explicit site membership; staff do not.
  if (role !== "guest") {
    await admin.from("site_members").delete().eq("user_id", userId);
  }

  revalidateUsers();
  return { ok: true };
}

export async function deleteInstanceUser(
  userId: string,
): Promise<UserActionResult> {
  const actor = await requireStaffActor();
  if (!actor) {
    return { ok: false, error: "Not allowed" };
  }

  if (!userId) {
    return { ok: false, error: "Missing user" };
  }
  if (userId === actor.id) {
    return { ok: false, error: "You cannot delete your own account" };
  }

  const admin = createAdminClient();
  const { data: target, error } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!target) {
    return { ok: false, error: "User not found" };
  }

  if (target.role === "admin" || target.role === "co_admin") {
    if (!canManageElevatedRoles(actor.role)) {
      return {
        ok: false,
        error: "Only admins can remove co-admins or admins",
      };
    }
  }

  if (target.role === "admin") {
    const admins = await countAdmins(admin);
    if (admins <= 1) {
      return { ok: false, error: "Cannot delete the last admin" };
    }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    return { ok: false, error: deleteError.message };
  }

  revalidateUsers();
  return { ok: true };
}

export async function listManagedUsers(): Promise<{
  users: Array<{
    id: string;
    email: string;
    role: InstanceRole;
    created_at: string;
    siteIds: string[];
  }>;
  error?: string;
}> {
  const actor = await requireStaffActor();
  if (!actor) {
    return { users: [], error: "Not allowed" };
  }

  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, role, created_at")
    .order("created_at", { ascending: true });

  if (profilesError) {
    return { users: [], error: profilesError.message };
  }

  const { data: members } = await admin
    .from("site_members")
    .select("user_id, site_id")
    .eq("role", "viewer");

  const sitesByUser = new Map<string, string[]>();
  for (const row of members ?? []) {
    const list = sitesByUser.get(row.user_id) ?? [];
    list.push(row.site_id);
    sitesByUser.set(row.user_id, list);
  }

  const emailById = new Map<string, string>();
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) {
      return { users: [], error: error.message };
    }
    for (const user of data.users) {
      emailById.set(user.id, user.email ?? "");
    }
    if (data.users.length < 200) break;
    page += 1;
  }

  return {
    users: (profiles ?? []).map((p) => ({
      id: p.id,
      email: emailById.get(p.id) || "—",
      role: p.role as InstanceRole,
      created_at: p.created_at,
      siteIds: sitesByUser.get(p.id) ?? [],
    })),
  };
}
