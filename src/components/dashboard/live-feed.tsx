"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import type { Event } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

type LiveEvent = Pick<
  Event,
  "id" | "name" | "path" | "country" | "device" | "created_at" | "visitor_hash"
>;

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

export function LiveFeed({ siteId }: { siteId: string }) {
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
        .limit(30);

      if (!cancelled && data) {
        setEvents(data);
      }
    }

    void loadRecent();

    const channel = supabase
      .channel(`site-events-${siteId}`)
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
          setEvents((prev) => [row, ...prev].slice(0, 40));
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

  const online = useMemo(() => {
    const cutoff = now - ONLINE_WINDOW_MS;
    return new Set(
      events
        .filter((e) => new Date(e.created_at).getTime() >= cutoff)
        .map((e) => e.visitor_hash),
    ).size;
  }, [events, now]);

  return (
    <Card size="sm" className="h-full bg-card/80">
      <CardHeader className="flex-row items-center justify-between gap-4 border-b border-border/60">
        <CardTitle className="text-[11px] font-medium tracking-[0.14em] uppercase">
          Live
        </CardTitle>
        <p className="flex items-center gap-2 font-mono text-sm tabular-nums">
          <span
            className={cn(
              "relative flex size-2",
              online > 0 && "after:absolute after:inset-0 after:animate-ping after:rounded-full after:bg-primary/50",
            )}
          >
            <span className="relative size-2 rounded-full bg-primary" />
          </span>
          {online} online
        </p>
      </CardHeader>
      <CardContent>
        <div className="max-h-88 space-y-0 overflow-y-auto">
          {events.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Waiting for events…
            </p>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="flex items-start justify-between gap-3 border-b border-border/50 py-2.5 text-sm last:border-0"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {event.name === "pageview"
                      ? event.path || "/"
                      : event.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {[event.country, event.device].filter(Boolean).join(" · ") ||
                      "unknown"}
                  </p>
                </div>
                <time className="shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums">
                  {relativeTime(event.created_at, now)}
                </time>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
