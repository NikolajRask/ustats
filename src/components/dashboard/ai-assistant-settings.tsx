"use client";

import { useSyncExternalStore } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AI_ASK_BEFORE_FUNNELS_CHANGE_EVENT,
  AI_ASSISTANT_CHANGE_EVENT,
  getAiAskBeforeFunnels,
  getAiAssistantEnabled,
  setAiAskBeforeFunnels,
  setAiAssistantEnabled,
} from "@/lib/ai-assistant";

function subscribeAiPrefs(onStoreChange: () => void) {
  window.addEventListener(AI_ASSISTANT_CHANGE_EVENT, onStoreChange);
  window.addEventListener(AI_ASK_BEFORE_FUNNELS_CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(AI_ASSISTANT_CHANGE_EVENT, onStoreChange);
    window.removeEventListener(AI_ASK_BEFORE_FUNNELS_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function AiAssistantSettings({
  hasApiKey,
}: {
  hasApiKey: boolean;
}) {
  const enabled = useSyncExternalStore(
    subscribeAiPrefs,
    getAiAssistantEnabled,
    () => false,
  );
  const askBeforeFunnels = useSyncExternalStore(
    subscribeAiPrefs,
    getAiAskBeforeFunnels,
    () => true,
  );

  function onToggle(next: boolean) {
    setAiAssistantEnabled(next);
  }

  function onAskToggle(next: boolean) {
    setAiAskBeforeFunnels(next);
  }

  return (
    <div className="space-y-6">
      <Card className="bg-background/80">
        <CardHeader>
          <CardTitle>Assistant</CardTitle>
          <CardDescription>
            Show the Ask ustats chat bubble in the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="ai-assistant-enabled">Enable AI assistant</Label>
              <p className="text-xs text-muted-foreground">
                When on, the chat button appears in the bottom-right of the
                dashboard.
              </p>
            </div>
            <Switch
              id="ai-assistant-enabled"
              checked={enabled}
              onCheckedChange={onToggle}
              aria-label="Enable AI assistant"
            />
          </div>
        </CardContent>
      </Card>

      {enabled ? (
        <>
          <Card className="bg-background/80">
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>
                Control whether the assistant can create funnels on your sites.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <Label htmlFor="ai-ask-before-funnels">
                    Ask before creating funnels
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    When on, the assistant must get your approval in chat before
                    creating a funnel. Turn off to let it create funnels
                    automatically when you ask.
                  </p>
                </div>
                <Switch
                  id="ai-ask-before-funnels"
                  checked={askBeforeFunnels}
                  onCheckedChange={onAskToggle}
                  aria-label="Ask before creating funnels"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background/80">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>Setup</CardTitle>
                <Badge variant={hasApiKey ? "default" : "secondary"}>
                  {hasApiKey ? "API key detected" : "API key missing"}
                </Badge>
              </div>
              <CardDescription>
                The assistant uses OpenAI{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                  gpt-5.4-nano
                </code>{" "}
                and needs an API key on this instance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 text-sm">
              <ol className="list-decimal space-y-4 pl-5 text-muted-foreground">
                <li className="space-y-2 pl-1">
                  <p className="text-foreground">
                    Open the{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                      .env
                    </code>{" "}
                    file in your ustats install root (copy from{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                      .env.example
                    </code>{" "}
                    if you don&apos;t have one yet).
                  </p>
                </li>
                <li className="space-y-2 pl-1">
                  <p className="text-foreground">
                    Add or update this line with your key from{" "}
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2 hover:text-foreground"
                    >
                      platform.openai.com/api-keys
                    </a>
                    :
                  </p>
                  <pre className="overflow-x-auto rounded-lg border border-border/70 bg-muted/40 p-3 font-mono text-xs text-foreground">
                    OPENAI_API_KEY=sk-your-key-here
                  </pre>
                </li>
                <li className="space-y-2 pl-1">
                  <p className="text-foreground">
                    Restart the ustats server so the new env var is loaded (for
                    local dev, stop and run{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                      pnpm dev
                    </code>{" "}
                    again).
                  </p>
                </li>
                <li className="space-y-2 pl-1">
                  <p className="text-foreground">
                    Reload this page — the badge above should say{" "}
                    <span className="text-foreground">API key detected</span>{" "}
                    when the key is present.
                  </p>
                </li>
              </ol>

              {!hasApiKey ? (
                <p className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  No{" "}
                  <code className="rounded bg-muted px-1 py-0.5 font-mono">
                    OPENAI_API_KEY
                  </code>{" "}
                  is set in the current process. The chat UI can still open, but
                  replies need this key.
                </p>
              ) : (
                <p className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-foreground">
                  <code className="rounded bg-muted px-1 py-0.5 font-mono">
                    OPENAI_API_KEY
                  </code>{" "}
                  is configured for this instance.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
