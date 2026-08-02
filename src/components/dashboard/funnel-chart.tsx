import type { FunnelStepResult } from "@/lib/funnels";
import { cn } from "@/lib/utils";

export function FunnelChart({ steps }: { steps: FunnelStepResult[] }) {
  if (steps.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        This funnel has no steps yet.
      </p>
    );
  }

  const max = Math.max(steps[0]?.visitors ?? 0, 1);

  return (
    <ol className="space-y-3">
      {steps.map((row) => {
        const widthPct = Math.max((row.visitors / max) * 100, row.visitors > 0 ? 8 : 0);
        const metric =
          row.step.step_type === "path" ? "views" : "events";

        return (
          <li
            key={row.step.id}
            className="grid grid-cols-[minmax(7rem,9rem)_1fr_auto] items-center gap-3 sm:grid-cols-[minmax(8rem,11rem)_1fr_auto_4.5rem] sm:gap-4"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {row.step.name}
              </p>
              <p className="truncate font-mono text-[11px] text-muted-foreground">
                {row.step.match_value}
              </p>
            </div>

            <div className="min-w-0">
              <div
                className={cn(
                  "relative flex h-10 items-center overflow-hidden rounded-lg transition-[width] duration-500 ease-out",
                  row.visitors > 0 ? "bg-primary" : "bg-muted",
                )}
                style={{ width: `${widthPct}%` }}
              >
                {row.visitors > 0 ? (
                  <span className="truncate px-3 text-xs font-medium text-primary-foreground tabular-nums">
                    {row.visitors.toLocaleString()} {metric}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {row.visitors.toLocaleString()}
              </p>
              <p className="text-xs tabular-nums text-muted-foreground">
                {row.pctOfStart.toFixed(1)}%
              </p>
            </div>

            <div className="hidden text-right sm:block">
              {row.dropOffPct != null ? (
                <p className="text-sm font-medium tabular-nums text-destructive">
                  −{row.dropOffPct.toFixed(1)}%
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
