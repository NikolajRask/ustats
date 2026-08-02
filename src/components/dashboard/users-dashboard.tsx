"use client";

import { useEffect, useMemo, useState } from "react";

import { UsersTable } from "@/components/dashboard/users-table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import type { Event } from "@/lib/supabase/database.types";
import type { SiteUser } from "@/lib/users";
import { visitorIdentity } from "@/lib/visitor-name";
import { cn } from "@/lib/utils";

type LiveEvent = Pick<
  Event,
  | "id"
  | "name"
  | "path"
  | "country"
  | "device"
  | "created_at"
  | "visitor_hash"
>;

type LiveVisitor = {
  visitor_hash: string;
  name: string;
  initials: string;
  color: string;
  last_seen: string;
  path: string | null;
  event_name: string;
  country: string | null;
  device: string | null;
};

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

function relativeTime(iso: string, now: number) {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const seconds = Math.floor(diff / 1000);
  if (seconds < 15) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return new Date(iso).toLocaleTimeString();
}

function groupLiveVisitors(events: LiveEvent[], now: number): LiveVisitor[] {
  const cutoff = now - ONLINE_WINDOW_MS;
  const byVisitor = new Map<string, LiveEvent>();

  for (const event of events) {
    if (new Date(event.created_at).getTime() < cutoff) continue;
    const existing = byVisitor.get(event.visitor_hash);
    if (
      !existing ||
      new Date(event.created_at).getTime() >
        new Date(existing.created_at).getTime()
    ) {
      byVisitor.set(event.visitor_hash, event);
    }
  }

  return [...byVisitor.values()]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .map((event) => {
      const identity = visitorIdentity(event.visitor_hash);
      return {
        visitor_hash: event.visitor_hash,
        name: identity.name,
        initials: identity.initials,
        color: identity.color,
        last_seen: event.created_at,
        path: event.path,
        event_name: event.name,
        country: event.country,
        device: event.device,
      };
    });
}

function useLiveVisitors(siteId: string) {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function loadRecent() {
      const since = new Date(Date.now() - ONLINE_WINDOW_MS).toISOString();
      const { data } = await supabase
        .from("events")
        .select("id, name, path, country, device, created_at, visitor_hash")
        .eq("site_id", siteId)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(100);

      if (!cancelled && data) {
        setEvents(data);
      }
    }

    void loadRecent();

    const channel = supabase
      .channel(`site-live-users-${siteId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "events",
          filter: `site_id=eq.${siteId}`,
        },
        (payload) => {
          const row = payload.new as LiveEvent;
          setEvents((prev) => [row, ...prev].slice(0, 120));
        },
      )
      .subscribe();

    const tick = window.setInterval(() => setNow(Date.now()), 15_000);

    return () => {
      cancelled = true;
      window.clearInterval(tick);
      void supabase.removeChannel(channel);
    };
  }, [siteId]);

  const visitors = useMemo(
    () => groupLiveVisitors(events, now),
    [events, now],
  );

  const liveHashes = useMemo(
    () => new Set(visitors.map((v) => v.visitor_hash)),
    [visitors],
  );

  return { visitors, liveHashes, now };
}

export function UsersDashboard({
  siteId,
  users,
}: {
  siteId: string;
  users: SiteUser[];
}) {
  const { visitors, liveHashes, now } = useLiveVisitors(siteId);
  const online = visitors.length;

  return (
    <div className="space-y-8">
      <Card className="bg-card/80">
        <CardHeader className="flex-row items-start justify-between gap-4 border-b border-border/60">
          <div>
            <CardTitle className="font-display text-lg font-semibold tracking-tight">
              Live now
            </CardTitle>
            <CardDescription>
              Visitors active in the last 5 minutes
            </CardDescription>
          </div>
          <p className="flex items-center gap-2 font-mono text-sm tabular-nums">
            <span
              className={cn(
                "relative flex size-2",
                online > 0 &&
                  "after:absolute after:inset-0 after:animate-ping after:rounded-full after:bg-primary/50",
              )}
            >
              <span className="relative size-2 rounded-full bg-primary" />
            </span>
            {online} online
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          {online === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No one online right now.
            </p>
          ) : (
            <ul className="divide-y divide-border/50">
              {visitors.map((visitor) => (
                <li
                  key={visitor.visitor_hash}
                  className="flex items-start justify-between gap-3 py-3"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <Avatar size="sm">
                      <AvatarFallback
                        className="font-medium text-white"
                        style={{ backgroundColor: visitor.color }}
                      >
                        {visitor.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium">{visitor.name}</p>
                      <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                        {visitor.event_name === "pageview"
                          ? visitor.path || "/"
                          : visitor.event_name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {[visitor.country, visitor.device]
                          .filter(Boolean)
                          .join(" · ") || "unknown"}
                      </p>
                    </div>
                  </div>
                  <time className="shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums">
                    {relativeTime(visitor.last_seen, now)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/80">
        <CardHeader className="border-b border-border/60">
          <CardTitle className="font-display text-lg font-semibold tracking-tight">
            User journeys
          </CardTitle>
          <CardDescription>
            Showing {users.length.toLocaleString()} users. Click a row to open
            their journey.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pt-0">
          {users.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              No users in this range yet.
            </p>
          ) : (
            <UsersTable users={users} liveHashes={liveHashes} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
