"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { DOCS_NAV } from "@/lib/docs/nav";
import { cn } from "@/lib/utils";

export function DocsNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Documentation" className="space-y-8">
      {DOCS_NAV.map((section) => (
        <div key={section.title}>
          <p className="mb-2 px-2 text-[0.7rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            {section.title}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "block rounded-md px-2 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
