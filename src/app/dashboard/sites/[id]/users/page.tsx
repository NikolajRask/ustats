import { UsersDashboard } from "@/components/dashboard/users-dashboard";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSiteOrNotFound, parseDateRange } from "@/lib/site";
import { getSiteUsers } from "@/lib/users";
import { createClient } from "@/lib/supabase/server";

export default async function UsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const { range } = parseDateRange(sp.range);
  const site = await getSiteOrNotFound(id);
  const supabase = await createClient();
  const { users, totalUsers, totalSessions, avgEventsPerUser } =
    await getSiteUsers(supabase, site.id, range, 150);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight">
          Users
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Unique visitors with memorable names and their journeys through your
          site
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card size="sm" className="bg-card/80">
          <CardHeader>
            <CardDescription className="text-[11px] tracking-[0.14em] uppercase">
              Users
            </CardDescription>
            <CardTitle className="font-display text-3xl font-semibold tracking-tight tabular-nums">
              {totalUsers.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm" className="bg-card/80">
          <CardHeader>
            <CardDescription className="text-[11px] tracking-[0.14em] uppercase">
              Sessions
            </CardDescription>
            <CardTitle className="font-display text-3xl font-semibold tracking-tight tabular-nums">
              {totalSessions.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm" className="bg-card/80">
          <CardHeader>
            <CardDescription className="text-[11px] tracking-[0.14em] uppercase">
              Avg activity
            </CardDescription>
            <CardTitle className="font-display text-3xl font-semibold tracking-tight tabular-nums">
              {avgEventsPerUser == null
                ? "—"
                : avgEventsPerUser.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <UsersDashboard siteId={site.id} users={users} />
    </div>
  );
}
