"use client";

import {
  GlobeIcon,
  LockIcon,
  ServerIcon,
  SparklesIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Account",
    href: "/dashboard/settings",
    icon: UserIcon,
  },
  {
    label: "Security",
    href: "/dashboard/settings/security",
    icon: LockIcon,
  },
  {
    label: "Sites",
    href: "/dashboard/settings/sites",
    icon: GlobeIcon,
  },
  {
    label: "AI Assistant",
    href: "/dashboard/settings/ai",
    icon: SparklesIcon,
  },
  {
    label: "Instance",
    href: "/dashboard/settings/instance",
    icon: ServerIcon,
  },
] as const;

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Settings">
      <ul className="flex flex-row gap-1 overflow-x-auto md:flex-col md:overflow-visible">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/dashboard/settings"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
