"use client";

import { useState, useTransition } from "react";

import { updateCrossDayTracking } from "@/app/dashboard/sites/[id]/settings/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function SitePrivacySettings({
  siteId,
  crossDayTracking,
}: {
  siteId: string;
  crossDayTracking: boolean;
}) {
  const [enabled, setEnabled] = useState(crossDayTracking);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onToggle(next: boolean) {
    const previous = enabled;
    setEnabled(next);
    setError(null);

    startTransition(async () => {
      const result = await updateCrossDayTracking(siteId, next);
      if (!result.ok) {
        setEnabled(previous);
        setError(result.error);
      }
    });
  }

  return (
    <Card className="bg-background/80">
      <CardHeader>
        <CardTitle>Privacy</CardTitle>
        <CardDescription>
          How visitors are identified for this site. Default is daily-rotated
          hashing with no cookies.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="cross-day-tracking">
              Cross-day visitor tracking
            </Label>
            <p className="text-xs text-muted-foreground">
              When off, the same person gets a new visitor ID each UTC day.
              When on, the same IP and browser keep one durable visitor hash.
            </p>
          </div>
          <Switch
            id="cross-day-tracking"
            checked={enabled}
            disabled={pending}
            onCheckedChange={onToggle}
            aria-label="Cross-day visitor tracking"
          />
        </div>

        {enabled ? (
          <div
            role="status"
            className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
          >
            <p className="font-medium">Consent required</p>
            <p className="mt-1 text-amber-950/80 dark:text-amber-100/80">
              Durable visitor IDs typically require a cookie / consent banner
              and a lawful basis under privacy laws (e.g. GDPR / ePrivacy).
              ustats does not set cookies for this — review with your counsel
              before enabling on a production site.
            </p>
            <p className="mt-2 text-amber-950/80 dark:text-amber-100/80">
              Turning this on does not merge past daily hashes with new stable
              ones. Only events collected after enabling share the durable ID.
            </p>
          </div>
        ) : null}

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
