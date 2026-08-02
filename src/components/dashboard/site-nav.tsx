"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Overview", segment: "" },
  { label: "Graphs", segment: "graphs" },
  { label: "Geographics", segment: "geographics" },
  { label: "Custom Events", segment: "events" },
  { label: "Funnels", segment: "funnels" },
  { label: "Users", segment: "users" },
  { label: "Errors", segment: "errors" },
  { label: "Logs", segment: "logs" },
  { label: "Reports", segment: "reports" },
] as const;

export function SiteNav({ siteId }: { siteId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const range = searchParams.get("range");
  const base = `/dashboard/sites/${siteId}`;
  const isFunnels = pathname.includes("/funnels");

  return (
    <nav
      aria-label="Site analytics"
      className="-mx-1 overflow-x-auto px-1"
    >
      <ul className="flex min-w-max gap-1 border-b border-border/70">
        {NAV_ITEMS.map((item) => {
          const hrefPath = item.segment ? `${base}/${item.segment}` : base;
          const active =
            item.segment === ""
              ? pathname === base
              : pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);

          let href = hrefPath;
          if (item.segment === "funnels") {
            const params = new URLSearchParams();
            const from = searchParams.get("from");
            const to = searchParams.get("to");
            const funnel = searchParams.get("funnel");
            if (from) params.set("from", from);
            if (to) params.set("to", to);
            if (funnel) params.set("funnel", funnel);
            const query = params.toString();
            if (query) href = `${hrefPath}?${query}`;
          } else if (!isFunnels && range != null && range !== "") {
            href = `${hrefPath}?range=${range}`;
          }

          return (
            <li key={item.label}>
              <Link
                href={href}
                className={cn(
                  "relative inline-flex items-center px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
                {active ? (
                  <span
                    aria-hidden
                    className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary"
                  />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
