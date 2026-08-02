"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const RANGES = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
] as const;

export function RangePicker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("range");
  const days = current === "7" ? 7 : current === "90" ? 90 : 30;

  return (
    <div className="flex gap-1 rounded-xl border border-border/80 bg-card/80 p-1 shadow-sm shadow-foreground/2">
      {RANGES.map((r) => (
        <Button
          key={r.value}
          size="sm"
          variant={days === r.value ? "default" : "ghost"}
          className={cn(
            "rounded-lg px-3",
            days !== r.value && "text-muted-foreground",
          )}
          nativeButton={false}
          render={<Link href={`${pathname}?range=${r.value}`} />}
        >
          {r.label}
        </Button>
      ))}
    </div>
  );
}
