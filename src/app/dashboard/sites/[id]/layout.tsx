import Link from "next/link";
import { Suspense } from "react";

import { SiteNav } from "@/components/dashboard/site-nav";
import { SiteRangeControls } from "@/components/dashboard/site-range-controls";
import { Button } from "@/components/ui/button";
import { canAccessSiteSettings } from "@/lib/roles";
import { getCurrentProfile } from "@/lib/roles.server";
import { getSiteOrNotFound } from "@/lib/site";

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const site = await getSiteOrNotFound(id);
  const profile = await getCurrentProfile();
  const showSettings = canAccessSiteSettings(profile?.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <Button
            nativeButton={false}
            variant="ghost"
            size="sm"
            className="-ml-2 text-muted-foreground"
            render={<Link href="/dashboard" />}
          >
            ← Sites
          </Button>
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {site.name}
            </h1>
            <p className="mt-1 font-mono text-sm text-muted-foreground">
              {site.domain}
            </p>
          </div>
        </div>
        <Suspense
          fallback={
            <div className="h-9 w-56 rounded-xl border border-border/80 bg-card/80" />
          }
        >
          <SiteRangeControls />
        </Suspense>
      </div>

      <Suspense
        fallback={
          <div className="h-10 border-b border-border/70" />
        }
      >
        <SiteNav siteId={site.id} showSettings={showSettings} />
      </Suspense>

      {children}
    </div>
  );
}
