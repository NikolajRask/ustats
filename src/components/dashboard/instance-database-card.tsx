"use client";

import { useState, useTransition } from "react";

import { updateSupabasePlan } from "@/app/dashboard/settings/instance/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  estimateProMonthlyUsd,
  formatBytes,
  formatUsd,
  quotaBytesForPlan,
  quotaPercent,
  type SupabasePlan,
} from "@/lib/supabase-plan";
import { cn } from "@/lib/utils";

export function InstanceDatabaseCard({
  supabaseUrl,
  usedBytes,
  initialPlan,
}: {
  supabaseUrl: string;
  usedBytes: number | null;
  initialPlan: SupabasePlan;
}) {
  const [plan, setPlan] = useState<SupabasePlan>(initialPlan);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const quotaBytes = quotaBytesForPlan(plan);
  const used = usedBytes ?? 0;
  const percent = usedBytes == null ? 0 : quotaPercent(used, quotaBytes);
  const overFree = plan === "free" && usedBytes != null && used > quotaBytes;
  const proEstimate =
    plan === "pro" && usedBytes != null
      ? estimateProMonthlyUsd(used)
      : null;

  function onPlanChange(checked: boolean) {
    const next: SupabasePlan = checked ? "pro" : "free";
    const previous = plan;
    setPlan(next);
    setError(null);

    startTransition(async () => {
      const result = await updateSupabasePlan(next);
      if (!result.ok) {
        setPlan(previous);
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="supabase-url">Supabase URL</Label>
        <Input
          id="supabase-url"
          value={supabaseUrl}
          readOnly
          className="bg-muted/40 font-mono text-sm"
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <Label htmlFor="supabase-plan">Supabase plan</Label>
          <p className="text-xs text-muted-foreground">
            Match the plan your organization is on so quotas and cost estimates
            are accurate.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              "text-xs font-medium",
              plan === "free" ? "text-foreground" : "text-muted-foreground",
            )}
          >
            Free
          </span>
          <Switch
            id="supabase-plan"
            checked={plan === "pro"}
            disabled={pending}
            onCheckedChange={onPlanChange}
            aria-label="Toggle Supabase Free or Pro plan"
          />
          <span
            className={cn(
              "text-xs font-medium",
              plan === "pro" ? "text-foreground" : "text-muted-foreground",
            )}
          >
            Pro
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <Label>Database space</Label>
          <p className="font-mono text-xs text-muted-foreground">
            {usedBytes == null ? (
              "—"
            ) : (
              <>
                {formatBytes(used)} / {formatBytes(quotaBytes)}
              </>
            )}
          </p>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={Math.round(percent)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Database space used"
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-300",
              overFree ? "bg-destructive" : "bg-foreground",
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
        {usedBytes == null ? (
          <p className="text-xs text-muted-foreground">
            Could not read database size.
          </p>
        ) : overFree ? (
          <p className="text-xs text-destructive">
            Usage exceeds the Free plan database limit (500 MB). Upgrade to Pro
            or reduce retention.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {plan === "free"
              ? "Free includes 500 MB of database size per project."
              : "Pro includes 8 GB of disk; overage is billed per GB."}
          </p>
        )}
      </div>

      {proEstimate ? (
        <div className="space-y-1 rounded-lg border border-border/60 bg-muted/30 px-3 py-3">
          <p className="text-sm font-medium">
            Estimated database cost{" "}
            <span className="font-mono">{formatUsd(proEstimate.total)}/mo</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {proEstimate.overage > 0
              ? `${formatUsd(proEstimate.base)} plan + ${formatUsd(proEstimate.overage)} disk overage (~${proEstimate.overageGb < 0.1 ? proEstimate.overageGb.toFixed(2) : proEstimate.overageGb.toFixed(1)} GB over 8 GB).`
              : `${formatUsd(proEstimate.base)}/mo Pro plan — current size fits in the included 8 GB.`}{" "}
            Estimate from used size, not provisioned disk.
          </p>
        </div>
      ) : null}

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
