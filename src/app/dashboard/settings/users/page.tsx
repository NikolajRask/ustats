import { redirect } from "next/navigation";

import { listManagedUsers } from "@/app/dashboard/settings/users/actions";
import { UsersManager } from "@/components/dashboard/users-manager";
import {
  canManageElevatedRoles,
  canManageUsers,
} from "@/lib/roles";
import { getCurrentProfile } from "@/lib/roles.server";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsUsersPage() {
  const profile = await getCurrentProfile();
  if (!canManageUsers(profile?.role)) {
    redirect("/dashboard/settings");
  }

  const supabase = await createClient();
  const [{ users, error }, sitesResult] = await Promise.all([
    listManagedUsers(),
    supabase
      .from("sites")
      .select("id, name, domain")
      .order("name", { ascending: true }),
  ]);

  if (error) {
    return (
      <div className="space-y-2">
        <h2 className="font-display text-3xl font-semibold tracking-tight">
          Users
        </h2>
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <UsersManager
      users={users}
      sites={sitesResult.data ?? []}
      currentUserId={profile!.id}
      canManageElevated={canManageElevatedRoles(profile!.role)}
    />
  );
}
