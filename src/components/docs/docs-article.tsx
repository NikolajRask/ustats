import Link from "next/link";

import { DocsPager } from "@/components/docs/docs-pager";
import { cn } from "@/lib/utils";

export type DocsHeading = {
  id: string;
  title: string;
};

export function DocsArticle({
  title,
  description,
  pathname,
  headings = [],
  children,
}: {
  title: string;
  description?: string;
  pathname: string;
  headings?: DocsHeading[];
  children: React.ReactNode;
}) {
  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_12rem] xl:gap-12">
      <article className="min-w-0">
        <header className="mb-8 border-b border-border/70 pb-8">
          <p className="text-[0.7rem] font-semibold tracking-[0.14em] text-primary uppercase">
            Documentation
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {description}
            </p>
          ) : null}
        </header>

        <div className="docs-prose">{children}</div>

        <DocsPager pathname={pathname} />
      </article>

      {headings.length > 0 ? (
        <aside className="hidden xl:block">
          <div className="sticky top-24 space-y-3">
            <p className="text-[0.7rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              On this page
            </p>
            <ul className="space-y-2 border-l border-border/80">
              {headings.map((heading) => (
                <li key={heading.id}>
                  <Link
                    href={`#${heading.id}`}
                    className={cn(
                      "-ml-px block border-l border-transparent py-0.5 pl-3 text-sm text-muted-foreground transition-colors",
                      "hover:border-primary/50 hover:text-foreground",
                    )}
                  >
                    {heading.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
