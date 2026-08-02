"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";

import {
  createFunnel,
  updateFunnel,
} from "@/app/dashboard/sites/[id]/funnels/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Funnel, FunnelStepInput, FunnelStepType } from "@/lib/funnels";
import { cn } from "@/lib/utils";

type DraftStep = FunnelStepInput & { key: string };

function toDraftSteps(funnel?: Funnel | null): DraftStep[] {
  if (funnel?.steps.length) {
    return funnel.steps.map((step) => ({
      key: step.id,
      name: step.name,
      step_type: step.step_type,
      match_value: step.match_value,
    }));
  }

  return [
    {
      key: crypto.randomUUID(),
      name: "",
      step_type: "path",
      match_value: "/",
    },
    {
      key: crypto.randomUUID(),
      name: "",
      step_type: "event",
      match_value: "",
    },
  ];
}

export function FunnelEditor({
  siteId,
  funnel,
  open,
  onOpenChange,
}: {
  siteId: string;
  funnel?: Funnel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(funnel?.name ?? "");
  const [steps, setSteps] = useState<DraftStep[]>(() => toDraftSteps(funnel));
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(funnel);

  function syncFromProps() {
    setName(funnel?.name ?? "");
    setSteps(toDraftSteps(funnel));
    setError(null);
  }

  function updateStep(key: string, patch: Partial<FunnelStepInput>) {
    setSteps((current) =>
      current.map((step) => (step.key === key ? { ...step, ...patch } : step)),
    );
  }

  function addStep() {
    setSteps((current) => [
      ...current,
      {
        key: crypto.randomUUID(),
        name: "",
        step_type: "path" as FunnelStepType,
        match_value: "",
      },
    ]);
  }

  function removeStep(key: string) {
    setSteps((current) =>
      current.length <= 2
        ? current
        : current.filter((step) => step.key !== key),
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("siteId", siteId);
    formData.set("name", name);
    formData.set(
      "steps",
      JSON.stringify(
        steps.map(({ name: stepName, step_type, match_value }) => ({
          name: stepName,
          step_type,
          match_value,
        })),
      ),
    );
    if (funnel) {
      formData.set("funnelId", funnel.id);
    }

    startTransition(async () => {
      const result = isEdit
        ? await updateFunnel(formData)
        : await createFunnel(formData);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      onOpenChange(false);
      const params = new URLSearchParams(window.location.search);
      params.set("funnel", result.funnelId);
      params.delete("error");
      router.push(`/dashboard/sites/${siteId}/funnels?${params.toString()}`);
      router.refresh();
    });
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        syncFromProps();
        onOpenChange(next);
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-lg font-semibold tracking-tight">
            {isEdit ? "Edit funnel" : "New funnel"}
          </SheetTitle>
          <SheetDescription>
            Define an ordered path of pageviews and custom events. Visitors must
            hit each step in order.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-4">
            {error ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="funnel-name">Name</Label>
              <Input
                id="funnel-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Signup flow"
                required
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Label>Steps</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addStep}
                  disabled={steps.length >= 12}
                >
                  <PlusIcon data-icon="inline-start" />
                  Add step
                </Button>
              </div>

              <ul className="space-y-3">
                {steps.map((step, index) => (
                  <li
                    key={step.key}
                    className="space-y-2 rounded-xl border border-border/70 bg-card/60 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                        Step {index + 1}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => removeStep(step.key)}
                        disabled={steps.length <= 2}
                        aria-label={`Remove step ${index + 1}`}
                      >
                        <Trash2Icon />
                      </Button>
                    </div>

                    <Input
                      value={step.name}
                      onChange={(e) =>
                        updateStep(step.key, { name: e.target.value })
                      }
                      placeholder="Landing page"
                      required
                    />

                    <div className="grid grid-cols-2 gap-1 rounded-lg border border-border/80 bg-background/70 p-1">
                      {(["path", "event"] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          className={cn(
                            "rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                            step.step_type === type
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                          onClick={() =>
                            updateStep(step.key, {
                              step_type: type,
                              match_value:
                                type === "path" &&
                                !step.match_value.startsWith("/")
                                  ? "/"
                                  : step.match_value,
                            })
                          }
                        >
                          {type === "path" ? "Page path" : "Custom event"}
                        </button>
                      ))}
                    </div>

                    <Input
                      value={step.match_value}
                      onChange={(e) =>
                        updateStep(step.key, { match_value: e.target.value })
                      }
                      placeholder={
                        step.step_type === "path"
                          ? "/pricing"
                          : "signup_started"
                      }
                      className="font-mono text-xs"
                      required
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending
                ? isEdit
                  ? "Saving…"
                  : "Creating…"
                : isEdit
                  ? "Save funnel"
                  : "Create funnel"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
