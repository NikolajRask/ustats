import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { AiChat } from "@/components/dashboard/ai-chat";
import { UserMenu } from "@/components/dashboard/user-menu";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="relative min-h-screen text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,oklch(0.52_0.11_165_/_0.12),transparent_55%),radial-gradient(ellipse_60%_40%_at_100%_0%,oklch(0.62_0.08_200_/_0.08),transparent_45%),linear-gradient(180deg,oklch(0.985_0.002_150),oklch(0.97_0.008_160)_40%,oklch(0.985_0.002_150))]"
      />
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-1">
            <Button
              nativeButton={false}
              variant="ghost"
              className="font-display text-base font-semibold tracking-tight"
              render={<Link href="/dashboard" />}
            >
              ustats
            </Button>
          </div>
          <UserMenu email={user.email ?? "Account"} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-6 py-10">{children}</main>
      <AiChat />
    </div>
  );
}
