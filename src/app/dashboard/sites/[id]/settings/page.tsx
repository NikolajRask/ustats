import { redirect } from "next/navigation";

import { SiteDangerZone } from "@/components/dashboard/site-danger-zone";
import { SiteDataRetentionSettings } from "@/components/dashboard/site-data-retention-settings";
import { SiteGeneralSettings } from "@/components/dashboard/site-general-settings";
import { SitePrivacySettings } from "@/components/dashboard/site-privacy-settings";
import { canAccessSiteSettings } from "@/lib/roles";
import { getCurrentProfile } from "@/lib/roles.server";
import { getSiteOrNotFound } from "@/lib/site";

export default async function SiteSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!canAccessSiteSettings(profile?.role)) {
    redirect(`/dashboard/sites/${id}`);
  }

  const site = await getSiteOrNotFound(id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Settings
        </h2>
        <p className="text-sm text-muted-foreground">
          General, privacy, retention, and danger zone for {site.name}.
        </p>
      </div>

      <SiteGeneralSettings
        siteId={site.id}
        name={site.name}
        domain={site.domain}
      />

      <SitePrivacySettings
        siteId={site.id}
        crossDayTracking={site.cross_day_tracking}
      />

      <SiteDataRetentionSettings
        siteId={site.id}
        dataRetentionDays={site.data_retention_days}
      />

      <SiteDangerZone siteId={site.id} siteName={site.name} />
    </div>
  );
}
