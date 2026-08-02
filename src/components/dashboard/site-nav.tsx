"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  experimentalFeatures,
  type ExperimentalFeature,
} from "@/lib/experimental";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  segment: string;
  experimental?: ExperimentalFeature;
};

const FULL_NAV_ITEMS: NavItem[] = [
  { label: "Overview", segment: "" },
  { label: "Graphs", segment: "graphs", experimental: "graphs" },
  { label: "Geographics", segment: "geographics" },
  { label: "Custom Events", segment: "events" },
  { label: "Features", segment: "features", experimental: "features" },
  { label: "Funnels", segment: "funnels" },
  { label: "Users", segment: "users" },
  { label: "Errors", segment: "errors" },
  { label: "Logs", segment: "logs" },
  { label: "Reports", segment: "reports", experimental: "reports" },
  { label: "Settings", segment: "settings" },
];

const PREVIEW_SEGMENTS = new Set([
  "",
  "geographics",
  "events",
  "funnels",
  "users",
  "errors",
  "logs",
  "settings",
]);

export function SiteNav({
  siteId,
  showSettings = true,
  basePath,
  settingsLocked = false,
  preview = false,
}: {
  siteId: string;
  showSettings?: boolean;
  /** Override nav base (e.g. `/preview`). Defaults to `/dashboard/sites/{siteId}`. */
  basePath?: string;
  /** Show Settings as a disabled control with a tooltip. */
  settingsLocked?: boolean;
  /** Limit tabs to the preview set. */
  preview?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const range = searchParams.get("range");
  const base = basePath ?? `/dashboard/sites/${siteId}`;
  const isFunnels = pathname.includes("/funnels");

  const items = (preview ? FULL_NAV_ITEMS.filter((item) => PREVIEW_SEGMENTS.has(item.segment)) : FULL_NAV_ITEMS).filter(
    (item) =>
      (item.segment !== "settings" || showSettings || settingsLocked) &&
      (!item.experimental || experimentalFeatures[item.experimental]),
  );

  return (
    <TooltipProvider>
      <nav
        aria-label="Site analytics"
        className="-mx-1 overflow-x-auto px-1"
      >
        <ul className="flex min-w-max gap-1 border-b border-border/70">
          {items.map((item) => {
            if (item.segment === "settings" && settingsLocked) {
              return (
                <li key={item.label}>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <span
                          className="relative inline-flex cursor-not-allowed items-center px-3 py-2.5 text-sm text-muted-foreground/60"
                          aria-disabled="true"
                        />
                      }
                    >
                      Settings
                    </TooltipTrigger>
                    <TooltipContent>
                      Settings require a self-hosted instance
                    </TooltipContent>
                  </Tooltip>
                </li>
              );
            }

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
            } else if (
              item.segment !== "settings" &&
              !isFunnels &&
              range != null &&
              range !== ""
            ) {
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
    </TooltipProvider>
  );
}
