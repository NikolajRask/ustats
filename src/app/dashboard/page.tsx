import { GlobeIcon, PlusIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { canManageSites } from "@/lib/roles";
import { getCurrentProfile } from "@/lib/roles.server";
import { createClient } from "@/lib/supabase/server";

function formatAdded(iso: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const canCreate = canManageSites(profile?.role);

  const { data: sites } = await supabase
    .from("sites")
    .select("id, name, domain, public_key, created_at")
    .order("created_at", { ascending: false });

  const list = sites ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="font-display text-sm font-medium text-muted-foreground">
            Dashboard
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Sites
            </h1>
            {list.length > 0 ? (
              <Badge variant="secondary">{list.length}</Badge>
            ) : null}
          </div>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            Properties tracked by this ustats instance.
          </p>
        </div>
        {canCreate ? (
          <Button
            nativeButton={false}
            render={<Link href="/dashboard/sites/new" />}
          >
            <PlusIcon data-icon="inline-start" />
            Add site
          </Button>
        ) : null}
      </div>

      {list.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <GlobeIcon />
            </EmptyMedia>
            <EmptyTitle className="font-display text-base">
              No sites yet
            </EmptyTitle>
            <EmptyDescription>
              {canCreate
                ? "Add your first domain to get an embed snippet and start collecting pageviews."
                : "An admin has not assigned any sites to your account yet."}
            </EmptyDescription>
          </EmptyHeader>
          {canCreate ? (
            <EmptyContent>
              <Button
                nativeButton={false}
                render={<Link href="/dashboard/sites/new" />}
              >
                <PlusIcon data-icon="inline-start" />
                Add your first site
              </Button>
            </EmptyContent>
          ) : null}
        </Empty>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site</TableHead>
                <TableHead className="hidden sm:table-cell">Domain</TableHead>
                <TableHead className="hidden md:table-cell">Added</TableHead>
                <TableHead className="w-[1%] text-right"> </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((site) => (
                <TableRow key={site.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Link
                      href={`/dashboard/sites/${site.id}`}
                      className="font-display font-medium tracking-tight hover:underline"
                    >
                      {site.name}
                    </Link>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground sm:hidden">
                      {site.domain}
                    </p>
                  </TableCell>
                  <TableCell className="hidden font-mono text-muted-foreground sm:table-cell">
                    {site.domain}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {formatAdded(site.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      nativeButton={false}
                      variant="ghost"
                      size="sm"
                      render={<Link href={`/dashboard/sites/${site.id}`} />}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
