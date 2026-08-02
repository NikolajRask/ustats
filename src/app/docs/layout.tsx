import type { Metadata } from "next";

import { DocsHeader } from "@/components/docs/docs-header";
import { DocsNav } from "@/components/docs/docs-nav";

export const metadata: Metadata = {
  title: {
    default: "Documentation",
    template: "%s · ustats Docs",
  },
  description: "Install, configure, and embed ustats on your stack.",
  openGraph: {
    title: "ustats Documentation",
    description: "Install, configure, and embed ustats on your stack.",
  },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,oklch(0.52_0.11_165_/_0.12),transparent_55%),radial-gradient(ellipse_60%_40%_at_100%_0%,oklch(0.62_0.08_200_/_0.08),transparent_45%),linear-gradient(180deg,oklch(0.985_0.002_150),oklch(0.97_0.008_160)_40%,oklch(0.985_0.002_150))]"
      />

      <DocsHeader />

      <div className="mx-auto grid w-full max-w-7xl lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="sticky top-14 hidden h-[calc(100svh-3.5rem)] overflow-y-auto border-r border-border/70 py-8 pr-6 pl-6 lg:block">
          <DocsNav />
        </aside>

        <main className="min-w-0 px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
          {children}
        </main>
      </div>
    </div>
  );
}
