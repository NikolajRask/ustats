import { UsersDashboard } from "@/components/dashboard/users-dashboard";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PreviewLiveEvent } from "@/lib/preview/sample-data";
import type { SiteUser } from "@/lib/users";

export function UsersView({
  siteId,
  users,
  totalUsers,
  totalSessions,
  avgEventsPerUser,
  readOnly = false,
  liveEvents,
}: {
  siteId: string;
  users: SiteUser[];
  totalUsers: number;
  totalSessions: number;
  avgEventsPerUser: number | null;
  readOnly?: boolean;
  liveEvents?: PreviewLiveEvent[];
}) {
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

      <UsersDashboard
        siteId={siteId}
        users={users}
        readOnly={readOnly}
        initialLiveEvents={liveEvents}
      />
    </div>
  );
}
