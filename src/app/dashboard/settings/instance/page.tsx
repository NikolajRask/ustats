import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { InstanceDatabaseCard } from "@/components/dashboard/instance-database-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isStaffRole } from "@/lib/roles";
import { getCurrentProfile } from "@/lib/roles.server";
import type { SupabasePlan } from "@/lib/supabase-plan";
import { createClient } from "@/lib/supabase/server";

function getAppUrl(headerHost: string | null) {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (headerHost) return `https://${headerHost}`;
  return "https://your-host";
}

export default async function SettingsInstancePage() {
  const profile = await getCurrentProfile();
  if (!isStaffRole(profile?.role)) {
    redirect("/dashboard/settings");
  }

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const appUrl = getAppUrl(host);
  const scriptSrc = `${appUrl}/script.js`;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "—";

  const supabase = await createClient();
  const [{ data: usageBytes, error: usageError }, { data: settings }] =
    await Promise.all([
      supabase.rpc("get_database_usage"),
      supabase
        .from("instance_settings")
        .select("supabase_plan")
        .eq("id", true)
        .maybeSingle(),
    ]);

  const usedBytes = (() => {
    if (usageError || usageBytes == null) return null;
    if (typeof usageBytes === "number" && Number.isFinite(usageBytes)) {
      return usageBytes;
    }
    if (typeof usageBytes === "string") {
      const n = Number(usageBytes);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  })();
  const plan: SupabasePlan =
    settings?.supabase_plan === "pro" ? "pro" : "free";

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-display text-3xl font-semibold tracking-tight">
          Instance
        </h2>
        <p className="text-sm text-muted-foreground">
          Install details for this self-hosted ustats deployment.
        </p>
      </div>

      <Card className="bg-background/80">
        <CardHeader>
          <CardTitle>Install</CardTitle>
          <CardDescription>
            Public URL and tracker script for this instance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="app-url">App URL</Label>
            <Input
              id="app-url"
              value={appUrl}
              readOnly
              className="bg-muted/40 font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="script-src">Tracker script</Label>
            <Input
              id="script-src"
              value={scriptSrc}
              readOnly
              className="bg-muted/40 font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Embed snippets use this host and each site&apos;s public key. Set{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono">
                NEXT_PUBLIC_APP_URL
              </code>{" "}
              if the detected URL is wrong behind a reverse proxy.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-background/80">
        <CardHeader>
          <CardTitle>Database</CardTitle>
          <CardDescription>
            Supabase project this instance is connected to.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InstanceDatabaseCard
            supabaseUrl={supabaseUrl}
            usedBytes={usedBytes}
            initialPlan={plan}
          />
        </CardContent>
      </Card>
    </div>
  );
}
