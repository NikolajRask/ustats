"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";

import { updateSite } from "@/app/dashboard/sites/[id]/settings/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SiteGeneralSettings({
  siteId,
  name,
  domain,
}: {
  siteId: string;
  name: string;
  domain: string;
}) {
  const [draftName, setDraftName] = useState(name);
  const [draftDomain, setDraftDomain] = useState(domain);
  const [savedName, setSavedName] = useState(name);
  const [savedDomain, setSavedDomain] = useState(domain);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const dirty =
    draftName.trim() !== savedName || draftDomain.trim() !== savedDomain;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dirty) return;

    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await updateSite(siteId, {
        name: draftName,
        domain: draftDomain,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }

      const nextName = result.name ?? draftName.trim();
      const nextDomain = result.domain ?? draftDomain.trim();
      setSavedName(nextName);
      setSavedDomain(nextDomain);
      setDraftName(nextName);
      setDraftDomain(nextDomain);
      setSaved(true);
    });
  }

  return (
    <Card className="bg-background/80">
      <CardHeader>
        <CardTitle>General</CardTitle>
        <CardDescription>
          Display name and the domain that must match where you embed the
          tracker.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="site-name">Name</Label>
            <Input
              id="site-name"
              value={draftName}
              onChange={(e) => {
                setDraftName(e.target.value);
                setSaved(false);
                setError(null);
              }}
              required
              disabled={pending}
              placeholder="Marketing site"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="site-domain">Domain</Label>
            <Input
              id="site-domain"
              value={draftDomain}
              onChange={(e) => {
                setDraftDomain(e.target.value);
                setSaved(false);
                setError(null);
              }}
              required
              disabled={pending}
              placeholder="example.com"
              className="font-mono"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={pending || !dirty}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
            {saved ? (
              <p className="text-sm text-muted-foreground" role="status">
                Saved
              </p>
            ) : null}
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
