"use client";

import { MenuIcon } from "lucide-react";
import { useState } from "react";

import { DocsNav } from "@/components/docs/docs-nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function DocsMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            aria-label="Open documentation menu"
          />
        }
      >
        <MenuIcon />
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(100%,20rem)] p-0">
        <SheetHeader className="border-b border-border/70">
          <SheetTitle className="font-display text-left text-base font-semibold tracking-tight">
            Documentation
          </SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto px-3 py-5">
          <DocsNav onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
