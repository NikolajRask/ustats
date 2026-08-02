"use client";

import { useState, useTransition } from "react";

import { deleteSite } from "@/app/dashboard/sites/[id]/settings/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SiteDangerZone({
  siteId,
  siteName,
}: {
  siteId: string;
  siteName: string;
}) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const nameMatches = confirmation.trim() === siteName;

  function closeDialog(nextOpen: boolean) {
    if (pending) return;
    setOpen(nextOpen);
    if (!nextOpen) {
      setConfirmation("");
      setError(null);
    }
  }

  function onDelete() {
    if (!nameMatches) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteSite(siteId, confirmation);
      // Successful delete redirects; only handle failures here.
      if (result && !result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <>
      <Card className="border-destructive/30 bg-background/80">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>
            Permanently delete this site and all of its analytics data. This
            cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setOpen(true)}
          >
            Delete site
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-md" showCloseButton={!pending}>
          <DialogHeader>
            <DialogTitle>Delete “{siteName}”?</DialogTitle>
            <DialogDescription>
              This removes the site, pageviews, custom events, errors, funnels,
              and graphs. Embeds using this site’s public key will stop working.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="delete-site-confirm">
              Type <span className="font-medium text-foreground">{siteName}</span>{" "}
              to confirm
            </Label>
            <Input
              id="delete-site-confirm"
              value={confirmation}
              onChange={(e) => {
                setConfirmation(e.target.value);
                setError(null);
              }}
              disabled={pending}
              autoComplete="off"
              autoFocus
              placeholder={siteName}
            />
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => closeDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending || !nameMatches}
              onClick={onDelete}
            >
              {pending ? "Deleting…" : "Delete forever"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
