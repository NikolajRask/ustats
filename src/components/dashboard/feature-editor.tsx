"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";

import {
  createFeature,
  updateFeature,
} from "@/app/dashboard/sites/[id]/features/actions";
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
import type {
  FeatureMatchType,
  FeaturePathInput,
  SiteFeature,
} from "@/lib/features";
import { FEATURE_MATCH_TYPES } from "@/lib/features";
import { cn } from "@/lib/utils";

type DraftPath = FeaturePathInput & { key: string };

function toDraftPaths(feature?: SiteFeature | null): DraftPath[] {
  if (feature?.paths.length) {
    return feature.paths.map((path) => ({
      key: path.id,
      path: path.path,
      match_type: path.match_type,
    }));
  }

  return [
    {
      key: crypto.randomUUID(),
      path: "/",
      match_type: "exact",
    },
  ];
}

export function FeatureEditor({
  siteId,
  feature,
  open,
  onOpenChange,
}: {
  siteId: string;
  feature?: SiteFeature | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(feature?.name ?? "");
  const [paths, setPaths] = useState<DraftPath[]>(() => toDraftPaths(feature));
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(feature);

  function resetForm() {
    setName(feature?.name ?? "");
    setPaths(toDraftPaths(feature));
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  function updatePath(key: string, patch: Partial<FeaturePathInput>) {
    setPaths((current) =>
      current.map((path) => (path.key === key ? { ...path, ...patch } : path)),
    );
  }

  function addPath() {
    setPaths((current) => [
      ...current,
      {
        key: crypto.randomUUID(),
        path: "",
        match_type: "exact" as FeatureMatchType,
      },
    ]);
  }

  function removePath(key: string) {
    setPaths((current) =>
      current.length <= 1
        ? current
        : current.filter((path) => path.key !== key),
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("siteId", siteId);
    formData.set("name", name);
    formData.set(
      "paths",
      JSON.stringify(
        paths.map(({ path, match_type }) => ({ path, match_type })),
      ),
    );
    if (feature) {
      formData.set("featureId", feature.id);
    }

    startTransition(async () => {
      const result = isEdit
        ? await updateFeature(formData)
        : await createFeature(formData);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-lg font-semibold tracking-tight">
            {isEdit ? "Edit feature" : "New feature"}
          </SheetTitle>
          <SheetDescription>
            Group one or more paths into a feature to compare usage across your
            product.
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
              <Label htmlFor="feature-name">Name</Label>
              <Input
                id="feature-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Checkout"
                required
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Label>Paths</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addPath}
                  disabled={paths.length >= 24}
                >
                  <PlusIcon data-icon="inline-start" />
                  Add path
                </Button>
              </div>

              <ul className="space-y-3">
                {paths.map((path) => (
                  <li
                    key={path.key}
                    className="space-y-2 rounded-xl border border-border/70 bg-card/60 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <div className="inline-flex flex-wrap rounded-lg border border-border/70 p-0.5">
                        {FEATURE_MATCH_TYPES.map((type) => (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() =>
                              updatePath(path.key, {
                                match_type: type.value,
                              })
                            }
                            className={cn(
                              "rounded-md px-2.5 py-1 text-xs transition-colors",
                              path.match_type === type.value
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removePath(path.key)}
                        disabled={paths.length <= 1}
                        aria-label="Remove path"
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                    <Input
                      value={path.path}
                      onChange={(e) =>
                        updatePath(path.key, { path: e.target.value })
                      }
                      placeholder={
                        FEATURE_MATCH_TYPES.find(
                          (type) => type.value === path.match_type,
                        )?.placeholder ?? "/pricing"
                      }
                      className="font-mono text-sm"
                      required
                    />
                    <p className="text-[11px] text-muted-foreground">
                      {FEATURE_MATCH_TYPES.find(
                        (type) => type.value === path.match_type,
                      )?.hint ?? "Matches this path exactly"}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
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
                  ? "Save feature"
                  : "Create feature"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
