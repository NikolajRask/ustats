"use client";

import { useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SiteUser, UserJourneyEvent } from "@/lib/users";
import { cn } from "@/lib/utils";

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(iso));
}

function formatClock(iso: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(iso));
}

function display(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-1 border-b border-border/50 py-3 last:border-0 sm:grid-cols-[7.5rem_1fr] sm:gap-4">
      <dt className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd
        className={cn(
          "min-w-0 break-all text-sm",
          mono && "font-mono text-[13px]",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function UserAvatar({
  identity,
  size = "default",
}: {
  identity: SiteUser["identity"];
  size?: "default" | "sm" | "lg";
}) {
  return (
    <Avatar size={size}>
      <AvatarFallback
        className="font-medium text-white"
        style={{ backgroundColor: identity.color }}
      >
        {identity.initials}
      </AvatarFallback>
    </Avatar>
  );
}

function JourneyTimeline({ journey }: { journey: UserJourneyEvent[] }) {
  let lastSession: string | null = null;

  return (
    <ol className="relative space-y-0 border-l border-border/70 pl-4">
      {journey.map((step) => {
        const sessionBreak =
          lastSession !== null && lastSession !== step.session_hash;
        lastSession = step.session_hash;
        const isPageview = step.name === "pageview";

        return (
          <li key={step.id} className="relative pb-5 last:pb-0">
            {sessionBreak ? (
              <p className="mb-3 -ml-4 pl-4 text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                New session
              </p>
            ) : null}
            <span
              aria-hidden
              className={cn(
                "absolute top-1.5 left-[-1.3rem] size-2.5 rounded-full ring-2 ring-background",
                isPageview ? "bg-primary/70" : "bg-chart-2",
              )}
            />
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <div className="min-w-0">
                {isPageview ? (
                  <p className="truncate font-mono text-sm">
                    {display(step.path)}
                  </p>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{step.name}</Badge>
                    {step.path ? (
                      <span className="truncate font-mono text-xs text-muted-foreground">
                        {step.path}
                      </span>
                    ) : null}
                  </div>
                )}
                {step.referrer_host ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    via {step.referrer_host}
                  </p>
                ) : null}
              </div>
              <time
                dateTime={step.created_at}
                className="shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums"
              >
                {formatClock(step.created_at)}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function LiveDot() {
  return (
    <span className="relative flex size-1.5">
      <span className="absolute inset-0 animate-ping rounded-full bg-primary/50" />
      <span className="relative size-1.5 rounded-full bg-primary" />
    </span>
  );
}

export function UsersTable({
  users,
  liveHashes,
}: {
  users: SiteUser[];
  liveHashes: Set<string>;
}) {
  const [selected, setSelected] = useState<SiteUser | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead className="hidden sm:table-cell">Last seen</TableHead>
            <TableHead className="text-right">Views</TableHead>
            <TableHead className="hidden text-right md:table-cell">
              Events
            </TableHead>
            <TableHead className="hidden text-right lg:table-cell">
              Sessions
            </TableHead>
            <TableHead className="hidden md:table-cell">Country</TableHead>
            <TableHead className="hidden xl:table-cell">Device</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((row) => {
            const isLive = liveHashes.has(row.visitor_hash);
            return (
              <TableRow
                key={row.visitor_hash}
                className="cursor-pointer hover:bg-muted/50"
                tabIndex={0}
                aria-label={`Open journey for ${row.identity.name}`}
                onClick={() => setSelected(row)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelected(row);
                  }
                }}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <UserAvatar identity={row.identity} size="sm" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{row.identity.name}</p>
                        {isLive ? (
                          <Badge
                            variant="outline"
                            className="gap-1.5 border-primary/30 text-primary"
                          >
                            <LiveDot />
                            Live
                          </Badge>
                        ) : null}
                      </div>
                      <p className="truncate font-mono text-[11px] text-muted-foreground md:hidden">
                        {formatTime(row.last_seen)}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden whitespace-nowrap font-mono text-xs text-muted-foreground tabular-nums sm:table-cell">
                  {isLive ? (
                    <span className="inline-flex items-center gap-1.5 text-primary">
                      <LiveDot />
                      now
                    </span>
                  ) : (
                    formatTime(row.last_seen)
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.pageviews.toLocaleString()}
                </TableCell>
                <TableCell className="hidden text-right tabular-nums text-muted-foreground md:table-cell">
                  {row.events.toLocaleString()}
                </TableCell>
                <TableCell className="hidden text-right tabular-nums text-muted-foreground lg:table-cell">
                  {row.sessions.toLocaleString()}
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {row.country || "—"}
                </TableCell>
                <TableCell className="hidden text-muted-foreground xl:table-cell">
                  {row.device || "—"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Sheet
        open={selected != null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
          {selected ? (
            <>
              <SheetHeader className="border-b border-border/60">
                <div className="flex items-center gap-3">
                  <UserAvatar identity={selected.identity} size="lg" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <SheetTitle className="font-display text-lg font-semibold tracking-tight">
                        {selected.identity.name}
                      </SheetTitle>
                      {liveHashes.has(selected.visitor_hash) ? (
                        <Badge
                          variant="outline"
                          className="gap-1.5 border-primary/30 text-primary"
                        >
                          <LiveDot />
                          Live
                        </Badge>
                      ) : null}
                    </div>
                    <SheetDescription>
                      {formatDateTime(selected.first_seen)} →{" "}
                      {formatDateTime(selected.last_seen)}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="overflow-y-auto px-4 pb-6">
                <dl>
                  <DetailRow
                    label="Pageviews"
                    value={selected.pageviews.toLocaleString()}
                  />
                  <DetailRow
                    label="Events"
                    value={selected.events.toLocaleString()}
                  />
                  <DetailRow
                    label="Sessions"
                    value={selected.sessions.toLocaleString()}
                  />
                  <DetailRow label="Country" value={display(selected.country)} />
                  <DetailRow label="Device" value={display(selected.device)} />
                  <DetailRow label="Browser" value={display(selected.browser)} />
                  <DetailRow label="OS" value={display(selected.os)} />
                  <DetailRow
                    label="Entry"
                    value={display(selected.entry_path)}
                    mono
                  />
                  <DetailRow
                    label="Exit"
                    value={display(selected.exit_path)}
                    mono
                  />
                </dl>

                <div className="mt-6">
                  <h3 className="mb-4 text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                    Journey
                  </h3>
                  {selected.journey.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No events in this range.
                    </p>
                  ) : (
                    <JourneyTimeline journey={selected.journey} />
                  )}
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
