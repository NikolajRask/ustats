"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  CalendarIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

import { deleteFunnel } from "@/app/dashboard/sites/[id]/funnels/actions";
import { FunnelChart } from "@/components/dashboard/funnel-chart";
import { FunnelEditor } from "@/components/dashboard/funnel-editor";
import { FunnelInsightsCard } from "@/components/dashboard/funnel-insights";
import { FunnelSankeyCard } from "@/components/dashboard/funnel-sankey";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Funnel, FunnelStats } from "@/lib/funnels";
import { cn } from "@/lib/utils";

export function FunnelDashboard({
  siteId,
  funnels,
  selectedFunnel,
  stats,
  fromDate,
  toDate,
  error,
  readOnly = false,
}: {
  siteId: string;
  funnels: Funnel[];
  selectedFunnel: Funnel | null;
  stats: FunnelStats | null;
  fromDate: string;
  toDate: string;
  error?: string;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Funnel | null>(null);

  function updateParams(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value == null || value === "") params.delete(key);
      else params.set(key, value);
    }
    params.delete("error");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function openCreate() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit() {
    if (!selectedFunnel) return;
    setEditing(selectedFunnel);
    setEditorOpen(true);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Conversion funnel
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Track visitor progress through your conversion flow
          </p>
        </div>
        {funnels.length > 0 && !readOnly ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Funnel actions"
                />
              }
            >
              <MoreHorizontalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={openCreate}>
                <PlusIcon />
                New funnel
              </DropdownMenuItem>
              {selectedFunnel ? (
                <>
                  <DropdownMenuItem onClick={openEdit}>
                    <PencilIcon />
                    Edit funnel
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => {
                      if (
                        !selectedFunnel ||
                        !window.confirm(
                          `Delete “${selectedFunnel.name}”? This cannot be undone.`,
                        )
                      ) {
                        return;
                      }
                      const formData = new FormData();
                      formData.set("siteId", siteId);
                      formData.set("funnelId", selectedFunnel.id);
                      void deleteFunnel(formData);
                    }}
                  >
                    <Trash2Icon />
                    Delete funnel
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {funnels.length === 0 ? (
        <Card className="bg-card/80">
          <CardHeader>
            <CardTitle className="font-display text-lg font-semibold tracking-tight">
              {readOnly ? "No funnels in sample data" : "Create your first funnel"}
            </CardTitle>
            <CardDescription>
              Combine page paths and custom events into an ordered conversion
              flow. Visitors must complete each step in sequence.
            </CardDescription>
          </CardHeader>
          {!readOnly ? (
            <CardContent>
              <Button onClick={openCreate}>
                <PlusIcon data-icon="inline-start" />
                New funnel
              </Button>
            </CardContent>
          ) : null}
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="funnel-from"
                className="text-xs text-muted-foreground"
              >
                From
              </Label>
              <div className="relative">
                <CalendarIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="funnel-from"
                  type="date"
                  value={fromDate}
                  onChange={(e) => updateParams({ from: e.target.value })}
                  className="w-46 pl-8"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="funnel-to"
                className="text-xs text-muted-foreground"
              >
                To
              </Label>
              <div className="relative">
                <CalendarIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="funnel-to"
                  type="date"
                  value={toDate}
                  onChange={(e) => updateParams({ to: e.target.value })}
                  className="w-46 pl-8"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="funnel-select"
                className="text-xs text-muted-foreground"
              >
                Funnel
              </Label>
              <select
                id="funnel-select"
                value={selectedFunnel?.id ?? ""}
                onChange={(e) => updateParams({ funnel: e.target.value })}
                className={cn(
                  "h-8 min-w-48 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none",
                  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                )}
              >
                {funnels.map((funnel) => (
                  <option key={funnel.id} value={funnel.id}>
                    {funnel.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedFunnel && stats ? (
            <>
              <Card className="overflow-hidden bg-card/80">
                <CardHeader className="border-b border-border/60">
                  <CardTitle className="font-display text-lg font-semibold tracking-tight">
                    {selectedFunnel.name}
                  </CardTitle>
                  <CardDescription>
                    Unique visitors who reached each step in order
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-5">
                  <FunnelChart steps={stats.steps} />
                </CardContent>
              </Card>

              <FunnelSankeyCard steps={stats.steps} />

              <FunnelInsightsCard insights={stats.insights} />
            </>
          ) : null}
        </>
      )}

      {!readOnly ? (
        <FunnelEditor
          key={editing?.id ?? "new"}
          siteId={siteId}
          funnel={editing}
          open={editorOpen}
          onOpenChange={setEditorOpen}
        />
      ) : null}
    </div>
  );
}
