import { UsersView } from "@/components/dashboard/views/users-view";
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
    <UsersView
      siteId={site.id}
      users={users}
      totalUsers={totalUsers}
      totalSessions={totalSessions}
      avgEventsPerUser={avgEventsPerUser}
    />
  );
}
