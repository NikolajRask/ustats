"use client";

import { useState, useTransition } from "react";

import {
  updateDataRetention,
  type DataRetentionDays,
} from "@/app/dashboard/sites/[id]/settings/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const MIN_MONTHS = 1;
const MAX_MONTHS = 24;

const RETENTION_PRESETS = [
  { label: "Forever", months: null },
  { label: "1 mo", months: 1 },
  { label: "3 mo", months: 3 },
  { label: "12 mo", months: 12 },
  { label: "24 mo", months: 24 },
] as const;

function monthsToDays(months: number): number {
  return Math.round((months * 365) / 12);
}

function daysToMonths(days: number): number {
  return Math.min(
    MAX_MONTHS,
    Math.max(MIN_MONTHS, Math.round((days * 12) / 365)),
  );
}

function formatMonths(months: number): string {
  return months === 1 ? "1 mo" : `${months} mo`;
}

export function SiteDataRetentionSettings({
  siteId,
  dataRetentionDays,
}: {
  siteId: string;
  dataRetentionDays: DataRetentionDays;
}) {
  const [savedDays, setSavedDays] =
    useState<DataRetentionDays>(dataRetentionDays);
  const [forever, setForever] = useState(dataRetentionDays === null);
  const [draftMonths, setDraftMonths] = useState(
    dataRetentionDays === null ? MAX_MONTHS : daysToMonths(dataRetentionDays),
  );
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function commit(next: DataRetentionDays) {
    if (next === savedDays) return;

    const previous = savedDays;
    const previousForever = forever;
    const previousMonths = draftMonths;

    setSavedDays(next);
    setForever(next === null);
    if (next !== null) {
      setDraftMonths(daysToMonths(next));
    }
    setError(null);
    setWarning(null);

    startTransition(async () => {
      const result = await updateDataRetention(siteId, next);
      if (!result.ok) {
        setSavedDays(previous);
        setForever(previousForever);
        setDraftMonths(previousMonths);
        setError(result.error);
        return;
      }
      if (result.warning) {
        setWarning(result.warning);
      }
    });
  }

  function commitMonths(months: number) {
    setForever(false);
    setDraftMonths(months);
    commit(monthsToDays(months));
  }

  function onSliderCommit(event: React.SyntheticEvent<HTMLInputElement>) {
    commitMonths(Number(event.currentTarget.value));
  }

  return (
    <Card className="bg-background/80">
      <CardHeader>
        <CardTitle>Data retention</CardTitle>
        <CardDescription>
          Automatically delete pageviews, custom events, and error data older
          than the selected window. Runs nightly, and immediately when you
          shorten the window.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-baseline justify-between gap-4">
            <Label htmlFor="data-retention-slider">Keep analytics for</Label>
            <span className="font-mono text-sm tabular-nums text-foreground">
              {forever ? "Forever" : formatMonths(draftMonths)}
            </span>
          </div>

          <input
            id="data-retention-slider"
            type="range"
            min={MIN_MONTHS}
            max={MAX_MONTHS}
            step={1}
            value={draftMonths}
            disabled={pending}
            onChange={(e) => {
              setForever(false);
              setDraftMonths(Number(e.target.value));
              setError(null);
              setWarning(null);
            }}
            onPointerUp={onSliderCommit}
            onMouseUp={onSliderCommit}
            onTouchEnd={onSliderCommit}
            onBlur={onSliderCommit}
            onKeyUp={(e) => {
              if (
                e.key === "ArrowLeft" ||
                e.key === "ArrowRight" ||
                e.key === "Home" ||
                e.key === "End" ||
                e.key === "PageUp" ||
                e.key === "PageDown"
              ) {
                onSliderCommit(e);
              }
            }}
            className={cn(
              "mt-4 w-full accent-foreground disabled:cursor-not-allowed disabled:opacity-50",
            )}
            aria-valuetext={forever ? "Forever" : formatMonths(draftMonths)}
          />

          <div className="mt-3 flex flex-wrap gap-2">
            {RETENTION_PRESETS.map((preset) => {
              const active =
                preset.months === null
                  ? forever
                  : !forever && draftMonths === preset.months;
              return (
                <button
                  key={preset.label}
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (preset.months === null) {
                      commit(null);
                      return;
                    }
                    commitMonths(preset.months);
                  }}
                  className={cn(
                    "rounded-sm border px-2.5 py-1 text-xs font-medium transition-colors",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    active
                      ? "border-foreground/40 bg-foreground/5 text-foreground"
                      : "border-border text-muted-foreground hover:border-foreground/25 hover:text-foreground",
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            {forever
              ? "No automatic deletion."
              : "Deletion is permanent and cannot be undone."}
          </p>
        </div>

        {warning ? (
          <p className="text-sm text-amber-800 dark:text-amber-200" role="status">
            {warning}
          </p>
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
