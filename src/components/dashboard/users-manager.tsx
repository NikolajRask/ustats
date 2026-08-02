"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  createInstanceUser,
  deleteInstanceUser,
  updateUserRole,
  updateUserSites,
} from "@/app/dashboard/settings/users/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InstanceRole } from "@/lib/roles";
import { roleLabel } from "@/lib/roles";

type SiteOption = { id: string; name: string; domain: string };

type ManagedUser = {
  id: string;
  email: string;
  role: InstanceRole;
  created_at: string;
  siteIds: string[];
};

function SiteCheckboxes({
  sites,
  selected,
  onChange,
}: {
  sites: SiteOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  if (sites.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No sites yet. Create a site first, then assign access.
      </p>
    );
  }

  return (
    <ul className="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-3">
      {sites.map((site) => {
        const checked = selected.includes(site.id);
        return (
          <li key={site.id}>
            <label className="flex cursor-pointer items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 size-4 rounded border"
                checked={checked}
                onChange={() => {
                  onChange(
                    checked
                      ? selected.filter((id) => id !== site.id)
                      : [...selected, site.id],
                  );
                }}
              />
              <span>
                <span className="font-medium">{site.name}</span>
                <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
                  {site.domain}
                </span>
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

function AddUserDialog({
  sites,
  canCreateCoAdmin,
}: {
  sites: SiteOption[];
  canCreateCoAdmin: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<InstanceRole>("guest");
  const [siteIds, setSiteIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setEmail("");
    setPassword("");
    setRole("guest");
    setSiteIds([]);
    setError(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger
        render={<Button size="sm" />}
      >
        Add user
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
          <DialogDescription>
            Creates a login for this instance. Guests only see assigned sites.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            startTransition(async () => {
              const result = await createInstanceUser({
                email,
                password,
                role,
                siteIds: role === "guest" ? siteIds : [],
              });
              if (!result.ok) {
                setError(result.error);
                return;
              }
              setOpen(false);
              reset();
              router.refresh();
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="new-email">Email</Label>
            <Input
              id="new-email"
              type="email"
              required
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Password</Label>
            <Input
              id="new-password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-role">Role</Label>
            <select
              id="new-role"
              className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none"
              value={role}
              onChange={(e) => setRole(e.target.value as InstanceRole)}
            >
              <option value="guest">Guest</option>
              {canCreateCoAdmin ? (
                <option value="co_admin">Co-Admin</option>
              ) : null}
            </select>
          </div>
          {role === "guest" ? (
            <div className="space-y-2">
              <Label>Site access</Label>
              <SiteCheckboxes
                sites={sites}
                selected={siteIds}
                onChange={setSiteIds}
              />
            </div>
          ) : null}
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditGuestSitesDialog({
  user,
  sites,
}: {
  user: ManagedUser;
  sites: SiteOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [siteIds, setSiteIds] = useState(user.siteIds);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setSiteIds(user.siteIds);
          setError(null);
        }
      }}
    >
      <DialogTrigger
        render={<Button variant="ghost" size="sm" />}
      >
        Sites
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Site access</DialogTitle>
          <DialogDescription>
            Choose which sites {user.email} can view.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <SiteCheckboxes
            sites={sites}
            selected={siteIds}
            onChange={setSiteIds}
          />
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
          <DialogFooter>
            <Button
              disabled={pending}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  const result = await updateUserSites(user.id, siteIds);
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  setOpen(false);
                  router.refresh();
                });
              }}
            >
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ChangeRoleDialog({
  user,
}: {
  user: ManagedUser;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<InstanceRole>(
    user.role === "admin" ? "co_admin" : user.role,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setRole(
            user.role === "admin"
              ? "co_admin"
              : user.role === "co_admin"
                ? "co_admin"
                : "guest",
          );
          setError(null);
        }
      }}
    >
      <DialogTrigger
        render={<Button variant="ghost" size="sm" />}
      >
        Role
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Change role</DialogTitle>
          <DialogDescription>
            Update the role for {user.email}.
            {user.role === "admin"
              ? " Demoting an admin removes admin status."
              : null}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`role-${user.id}`}>Role</Label>
            <select
              id={`role-${user.id}`}
              className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none"
              value={role}
              onChange={(e) => setRole(e.target.value as InstanceRole)}
            >
              <option value="guest">Guest</option>
              <option value="co_admin">Co-Admin</option>
            </select>
          </div>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
          <DialogFooter>
            <Button
              disabled={pending}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  const result = await updateUserRole(user.id, role);
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  setOpen(false);
                  router.refresh();
                });
              }}
            >
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function UsersManager({
  users,
  sites,
  currentUserId,
  canManageElevated,
}: {
  users: ManagedUser[];
  sites: SiteOption[];
  currentUserId: string;
  canManageElevated: boolean;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const siteNameById = new Map(sites.map((s) => [s.id, s.name]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            Users
          </h2>
          <p className="text-sm text-muted-foreground">
            Invite people to this instance and control site access.
          </p>
        </div>
        <AddUserDialog
          sites={sites}
          canCreateCoAdmin={canManageElevated}
        />
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Card className="bg-background/80">
        <CardHeader>
          <CardTitle>Instance users</CardTitle>
          <CardDescription>
            Guests see analytics only. Co-admins manage sites and guests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden md:table-cell">Access</TableHead>
                  <TableHead className="w-[1%] text-right"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const isSelf = user.id === currentUserId;
                  const canDelete =
                    !isSelf &&
                    (user.role === "guest" || canManageElevated);
                  const accessLabel =
                    user.role === "guest"
                      ? user.siteIds.length === 0
                        ? "No sites"
                        : user.siteIds
                            .map((id) => siteNameById.get(id) ?? id.slice(0, 6))
                            .join(", ")
                      : "All sites";

                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <p className="font-medium">{user.email}</p>
                        {isSelf ? (
                          <p className="text-xs text-muted-foreground">You</p>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {roleLabel(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden max-w-56 truncate text-muted-foreground md:table-cell">
                        {accessLabel}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {user.role === "guest" ? (
                            <EditGuestSitesDialog user={user} sites={sites} />
                          ) : null}
                          {canManageElevated && !isSelf ? (
                            <ChangeRoleDialog user={user} />
                          ) : null}
                          {canDelete ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              disabled={pendingId === user.id}
                              onClick={() => {
                                if (
                                  !window.confirm(
                                    `Remove ${user.email} from this instance?`,
                                  )
                                ) {
                                  return;
                                }
                                setError(null);
                                setPendingId(user.id);
                                startTransition(async () => {
                                  const result = await deleteInstanceUser(
                                    user.id,
                                  );
                                  setPendingId(null);
                                  if (!result.ok) {
                                    setError(result.error);
                                    return;
                                  }
                                  router.refresh();
                                });
                              }}
                            >
                              Remove
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
