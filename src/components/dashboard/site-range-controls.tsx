"use client";

import { usePathname } from "next/navigation";

import { RangePicker } from "@/components/dashboard/range-picker";

export function SiteRangeControls() {
  const pathname = usePathname();
  if (pathname.includes("/funnels")) {
    return null;
  }
  return <RangePicker />;
}
