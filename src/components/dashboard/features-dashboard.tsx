"use client";

import { useState } from "react";
import {
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

import { deleteFeature } from "@/app/dashboard/sites/[id]/features/actions";
import { DistributionDonut } from "@/components/dashboard/charts";
import { FeatureEditor } from "@/components/dashboard/feature-editor";
import { FeatureTimeChart } from "@/components/dashboard/feature-time-chart";
import { BreakdownList } from "@/components/dashboard/stats";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  formatFeaturePath,
  type SiteFeature,
  type SiteFeatureStats,
} from "@/lib/features";
import { formatSessionDuration } from "@/lib/stats";

export function FeaturesDashboard({
  siteId,
  features,
  stats,
  error,
}: {
  siteId: string;
  features: SiteFeature[];
  stats: SiteFeatureStats;
  error?: string;
}) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<SiteFeature | null>(null);

  function openCreate() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(feature: SiteFeature) {
    setEditing(feature);
    setEditorOpen(true);
  }

  const matchedShare =
    stats.pageviews > 0
      ? Math.round((stats.matchedPageviews / stats.pageviews) * 100)
      : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Features
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Group paths into product features and see how usage is split
          </p>
        </div>
        {features.length > 0 ? (
          <Button onClick={openCreate}>
            <PlusIcon data-icon="inline-start" />
            New feature
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {features.length === 0 ? (
        <Card className="bg-card/80">
          <CardHeader>
            <CardTitle className="font-display text-lg font-semibold tracking-tight">
              Create your first feature
            </CardTitle>
            <CardDescription>
              Map paths like <code className="font-mono text-xs">/pricing</code>{" "}
              or patterns like{" "}
              <code className="font-mono text-xs">*/settings</code> to named
              features, then compare pageviews and visitors across them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={openCreate}>
              <PlusIcon data-icon="inline-start" />
              New feature
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <Card size="sm" className="bg-card/80">
              <CardHeader>
                <CardDescription className="text-[11px] tracking-[0.14em] uppercase">
                  Features
                </CardDescription>
                <CardTitle className="font-display text-3xl font-semibold tracking-tight tabular-nums">
                  {stats.featureCount.toLocaleString()}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card size="sm" className="bg-card/80">
              <CardHeader>
                <CardDescription className="text-[11px] tracking-[0.14em] uppercase">
                  Matched views
                </CardDescription>
                <CardTitle className="font-display text-3xl font-semibold tracking-tight tabular-nums">
                  {stats.matchedPageviews.toLocaleString()}
                </CardTitle>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {matchedShare}% of pageviews
                </p>
              </CardHeader>
            </Card>
            <Card size="sm" className="bg-card/80">
              <CardHeader>
                <CardDescription className="text-[11px] tracking-[0.14em] uppercase">
                  Time on features
                </CardDescription>
                <CardTitle className="font-display text-3xl font-semibold tracking-tight tabular-nums">
                  {formatSessionDuration(stats.matchedSeconds)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card size="sm" className="bg-card/80">
              <CardHeader>
                <CardDescription className="text-[11px] tracking-[0.14em] uppercase">
                  Unmatched
                </CardDescription>
                <CardTitle className="font-display text-3xl font-semibold tracking-tight tabular-nums">
                  {stats.unmatchedPageviews.toLocaleString()}
                </CardTitle>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {stats.unmatchedVisitors.toLocaleString()} visitors
                </p>
              </CardHeader>
            </Card>
          </div>

          <Card className="overflow-hidden bg-card/80">
            <CardHeader className="border-b border-border/60">
              <CardTitle className="font-display text-lg font-semibold tracking-tight">
                Time spent by feature
              </CardTitle>
              <CardDescription>
                Estimated from time between pageviews in a session (capped at 30
                min per page). Last page in a session contributes 0.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <FeatureTimeChart
                features={features}
                days={stats.days}
                points={stats.timeTimeseries}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="bg-card/80">
              <CardHeader className="border-b border-border/60">
                <CardTitle className="text-[11px] font-medium tracking-[0.14em] uppercase">
                  Usage split
                </CardTitle>
                <CardDescription>
                  Pageviews attributed to each feature
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <DistributionDonut rows={stats.breakdown} />
              </CardContent>
            </Card>
            <BreakdownList title="By feature" rows={stats.breakdown} />
          </div>

          <Card className="bg-card/80">
            <CardHeader className="border-b border-border/60">
              <CardTitle className="font-display text-lg font-semibold tracking-tight">
                Your features
              </CardTitle>
              <CardDescription>
                Exact, prefix, contains, and ends-with rules used for matching
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-border/50">
                {features.map((feature) => {
                  const featureStats = stats.features.find(
                    (row) => row.id === feature.id,
                  );
                  return (
                    <li
                      key={feature.id}
                      className="flex flex-wrap items-start justify-between gap-3 px-4 py-3.5"
                    >
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <p className="font-medium">{feature.name}</p>
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {(featureStats?.count ?? 0).toLocaleString()} views
                            ·{" "}
                            {(featureStats?.visitors ?? 0).toLocaleString()}{" "}
                            visitors
                            · {formatSessionDuration(featureStats?.seconds ?? 0)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {feature.paths.map((path) => (
                            <span
                              key={path.id}
                              className="rounded-md bg-muted/70 px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
                            >
                              {formatFeaturePath(path)}
                            </span>
                          ))}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="outline"
                              size="icon-sm"
                              aria-label={`${feature.name} actions`}
                            />
                          }
                        >
                          <MoreHorizontalIcon />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(feature)}>
                            <PencilIcon />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => {
                              if (
                                !window.confirm(
                                  `Delete “${feature.name}”? This cannot be undone.`,
                                )
                              ) {
                                return;
                              }
                              const formData = new FormData();
                              formData.set("siteId", siteId);
                              formData.set("featureId", feature.id);
                              void deleteFeature(formData);
                            }}
                          >
                            <Trash2Icon />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </>
      )}

      <FeatureEditor
        key={editing?.id ?? "new"}
        siteId={siteId}
        feature={editing}
        open={editorOpen}
        onOpenChange={setEditorOpen}
      />
    </div>
  );
}
