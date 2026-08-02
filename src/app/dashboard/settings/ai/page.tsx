import { redirect } from "next/navigation";

import { AiAssistantSettings } from "@/components/dashboard/ai-assistant-settings";
import { isStaffRole } from "@/lib/roles";
import { getCurrentProfile } from "@/lib/roles.server";

export default async function SettingsAiAssistantPage() {
  const profile = await getCurrentProfile();
  if (!isStaffRole(profile?.role)) {
    redirect("/dashboard/settings");
  }

  const hasApiKey = Boolean(process.env.OPENAI_API_KEY?.trim());

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-display text-3xl font-semibold tracking-tight">
          AI Assistant
        </h2>
        <p className="text-sm text-muted-foreground">
          Enable the dashboard chat assistant and configure its API key.
        </p>
      </div>

      <AiAssistantSettings hasApiKey={hasApiKey} />
    </div>
  );
}
