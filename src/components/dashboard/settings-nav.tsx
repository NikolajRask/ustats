"use client";

import {
  GlobeIcon,
  LockIcon,
  ServerIcon,
  SparklesIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: typeof UserIcon;
  staffOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
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
    label: "Users",
    href: "/dashboard/settings/users",
    icon: UsersIcon,
    staffOnly: true,
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
    staffOnly: true,
  },
  {
    label: "Instance",
    href: "/dashboard/settings/instance",
    icon: ServerIcon,
    staffOnly: true,
  },
];

export function SettingsNav({ isStaff = false }: { isStaff?: boolean }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Settings">
      <ul className="flex flex-row gap-1 overflow-x-auto md:flex-col md:overflow-visible">
        {NAV_ITEMS.filter((item) => !item.staffOnly || isStaff).map(
          (item) => {
            const active =
              item.href === "/dashboard/settings"
                ? pathname === item.href
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
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
          },
        )}
      </ul>
    </nav>
  );
}
