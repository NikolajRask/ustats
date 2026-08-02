export type InstanceRole = "admin" | "co_admin" | "guest";

export type Profile = {
  id: string;
  role: InstanceRole;
  created_at: string;
};

export function isStaffRole(role: InstanceRole | null | undefined): boolean {
  return role === "admin" || role === "co_admin";
}

export function canManageSites(role: InstanceRole | null | undefined): boolean {
  return isStaffRole(role);
}

export function canAccessSiteSettings(
  role: InstanceRole | null | undefined,
): boolean {
  return isStaffRole(role);
}

export function canManageUsers(role: InstanceRole | null | undefined): boolean {
  return isStaffRole(role);
}

/** Only Admins can create Co-Admins or change elevated roles. */
export function canManageElevatedRoles(
  role: InstanceRole | null | undefined,
): boolean {
  return role === "admin";
}

export function roleLabel(role: InstanceRole): string {
  switch (role) {
    case "admin":
      return "Admin";
    case "co_admin":
      return "Co-Admin";
    case "guest":
      return "Guest";
  }
}
