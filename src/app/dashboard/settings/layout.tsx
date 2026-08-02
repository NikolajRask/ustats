import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

import { SettingsNav } from "@/components/dashboard/settings-nav";
import { Button } from "@/components/ui/button";
import { canManageUsers } from "@/lib/roles";
import { getCurrentProfile } from "@/lib/roles.server";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  const isStaff = canManageUsers(profile?.role);

  return (
    <div className="space-y-8">
      <Button
        nativeButton={false}
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground"
        render={<Link href="/dashboard" />}
      >
        <ArrowLeftIcon data-icon="inline-start" />
        Back to sites
      </Button>

      <div className="grid gap-10 md:grid-cols-[14rem_minmax(0,1fr)] lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-14">
        <aside className="space-y-6 md:sticky md:top-20 md:self-start">
          <div className="space-y-1">
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Settings
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your account.
            </p>
          </div>
          <SettingsNav isStaff={isStaff} />
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
