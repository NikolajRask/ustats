import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";

import { SiteNav } from "@/components/dashboard/site-nav";
import { SiteRangeControls } from "@/components/dashboard/site-range-controls";
import { Button } from "@/components/ui/button";
import { canServeMarketingPages } from "@/lib/app-mode";
import { PREVIEW_SITE, PREVIEW_SITE_ID } from "@/lib/preview/sample-data";
import { DOWNLOAD_URL } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Dashboard preview",
  description:
    "Explore the ustats analytics dashboard with sample data — no account required.",
  robots: { index: false, follow: false },
};

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!canServeMarketingPages()) {
    notFound();
  }

  return (
    <div className="relative min-h-screen text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,oklch(0.52_0.11_165_/_0.12),transparent_55%),radial-gradient(ellipse_60%_40%_at_100%_0%,oklch(0.62_0.08_200_/_0.08),transparent_45%),linear-gradient(180deg,oklch(0.985_0.002_150),oklch(0.97_0.008_160)_40%,oklch(0.985_0.002_150))]"
      />

      <div className="border-b border-amber-500/25 bg-amber-500/10">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-2.5 text-sm">
          <p className="text-foreground/90">
            You&apos;re viewing sample data, not connected to a live project.
            Self-host to use your own analytics. (The data might be inacurate.)
          </p>
          <div className="flex items-center gap-2">
            <Button
              nativeButton={false}
              variant="outline"
              size="sm"
              render={<Link href="/docs" />}
            >
              Docs
            </Button>
            <Button
              nativeButton={false}
              size="sm"
              render={<a href={DOWNLOAD_URL} />}
            >
              Download
            </Button>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-6">
          <Button
            nativeButton={false}
            variant="ghost"
            className="font-display text-base font-semibold tracking-tight"
            render={<Link href="/" />}
          >
            ustats
          </Button>
          <p className="hidden text-sm text-muted-foreground sm:block">
            Dashboard preview
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 py-10">
        <div className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-3">
              <Button
                nativeButton={false}
                variant="ghost"
                size="sm"
                className="-ml-2 text-muted-foreground"
                render={<Link href="/" />}
              >
                ← Home
              </Button>
              <div>
                <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                  {PREVIEW_SITE.name}
                </h1>
                <p className="mt-1 font-mono text-sm text-muted-foreground">
                  {PREVIEW_SITE.domain}
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
            fallback={<div className="h-10 border-b border-border/70" />}
          >
            <SiteNav
              siteId={PREVIEW_SITE_ID}
              basePath="/preview"
              preview
              settingsLocked
              showSettings={false}
            />
          </Suspense>

          {children}
        </div>
      </main>
    </div>
  );
}
