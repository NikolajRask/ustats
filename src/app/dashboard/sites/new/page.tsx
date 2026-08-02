import Link from "next/link";
import { redirect } from "next/navigation";

import { createSite } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { canManageSites } from "@/lib/roles";
import { getCurrentProfile } from "@/lib/roles.server";

export default async function NewSitePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!canManageSites(profile?.role)) {
    redirect("/dashboard");
  }

  const params = await searchParams;

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div className="space-y-2">
        <Button
          nativeButton={false}
          variant="ghost"
          size="sm"
          className="-ml-2 text-muted-foreground"
          render={<Link href="/dashboard" />}
        >
          ← Sites
        </Button>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Add a site
        </h1>
        <p className="text-sm text-muted-foreground">
          Domain must match the hostname where you embed the tracker.
        </p>
      </div>

      {params.error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {params.error}
        </p>
      ) : null}

      <form action={createSite} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            required
            placeholder="Marketing site"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="domain">Domain</Label>
          <Input
            id="domain"
            name="domain"
            required
            placeholder="example.com"
            className="font-mono"
          />
        </div>
        <Button type="submit">Create site</Button>
      </form>
    </div>
  );
}
