import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import Link from "next/link";

import { getDocsPager } from "@/lib/docs/nav";

export function DocsPager({ pathname }: { pathname: string }) {
  const { prev, next } = getDocsPager(pathname);

  if (!prev && !next) {
    return null;
  }

  return (
    <nav
      aria-label="Page navigation"
      className="mt-14 grid gap-3 border-t border-border/80 pt-8 sm:grid-cols-2"
    >
      {prev ? (
        <Link
          href={prev.href}
          className="group flex flex-col gap-1 rounded-lg border border-border/80 bg-background/60 px-4 py-3 transition-colors hover:border-primary/30 hover:bg-primary/5"
        >
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <ArrowLeftIcon className="size-3.5" />
            Previous
          </span>
          <span className="text-sm font-medium group-hover:text-primary">
            {prev.title}
          </span>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={next.href}
          className="group flex flex-col items-end gap-1 rounded-lg border border-border/80 bg-background/60 px-4 py-3 text-right transition-colors hover:border-primary/30 hover:bg-primary/5"
        >
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            Next
            <ArrowRightIcon className="size-3.5" />
          </span>
          <span className="text-sm font-medium group-hover:text-primary">
            {next.title}
          </span>
        </Link>
      ) : null}
    </nav>
  );
}
