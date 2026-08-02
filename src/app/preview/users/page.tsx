import { UsersView } from "@/components/dashboard/views/users-view";
import {
  getPreviewLiveEvents,
  getPreviewUsers,
  PREVIEW_SITE_ID,
} from "@/lib/preview/sample-data";

export default function PreviewUsersPage() {
  const { users, totalUsers, totalSessions, avgEventsPerUser } =
    getPreviewUsers();

  return (
    <UsersView
      siteId={PREVIEW_SITE_ID}
      users={users}
      totalUsers={totalUsers}
      totalSessions={totalSessions}
      avgEventsPerUser={avgEventsPerUser}
      readOnly
      liveEvents={getPreviewLiveEvents()}
    />
  );
}
