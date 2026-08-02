import Link from "next/link";

import { DocsMobileNav } from "@/components/docs/docs-mobile-nav";
import { Button } from "@/components/ui/button";

const REPO_URL = "https://github.com/nikolajrask/ustats";

export function DocsHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/75 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <DocsMobileNav />
          <Button
            nativeButton={false}
            variant="ghost"
            className="font-display text-base font-semibold tracking-tight"
            render={<Link href="/" />}
          >
            ustats
          </Button>
          <span
            aria-hidden
            className="hidden h-4 w-px bg-border sm:block"
          />
          <Link
            href="/docs"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            Docs
          </Link>
        </div>

        <nav className="flex items-center gap-1 text-sm">
          <Link
            href={REPO_URL}
            className="rounded-md px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
          >
            GitHub
          </Link>
          <Button
            nativeButton={false}
            size="sm"
            className="ml-1"
            render={<Link href="/dashboard" />}
          >
            Dashboard
          </Button>
        </nav>
      </div>
    </header>
  );
}
