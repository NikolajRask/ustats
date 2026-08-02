import { AiAssistantSettings } from "@/components/dashboard/ai-assistant-settings";

export default function SettingsAiAssistantPage() {
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
