export const AI_ASSISTANT_STORAGE_KEY = "ustats-ai-assistant-enabled";
export const AI_ASSISTANT_CHANGE_EVENT = "ustats-ai-assistant-changed";

export const AI_ASK_BEFORE_FUNNELS_KEY = "ustats-ai-ask-before-funnels";
export const AI_ASK_BEFORE_FUNNELS_CHANGE_EVENT =
  "ustats-ai-ask-before-funnels-changed";

export function getAiAssistantEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(AI_ASSISTANT_STORAGE_KEY) === "true";
}

export function setAiAssistantEnabled(enabled: boolean): void {
  window.localStorage.setItem(AI_ASSISTANT_STORAGE_KEY, enabled ? "true" : "false");
  window.dispatchEvent(
    new CustomEvent(AI_ASSISTANT_CHANGE_EVENT, { detail: enabled }),
  );
}

/** When true (default), the assistant must get approval before creating funnels. */
export function getAiAskBeforeFunnels(): boolean {
  if (typeof window === "undefined") return true;
  const value = window.localStorage.getItem(AI_ASK_BEFORE_FUNNELS_KEY);
  if (value === null) return true;
  return value !== "false";
}

export function setAiAskBeforeFunnels(ask: boolean): void {
  window.localStorage.setItem(AI_ASK_BEFORE_FUNNELS_KEY, ask ? "true" : "false");
  window.dispatchEvent(
    new CustomEvent(AI_ASK_BEFORE_FUNNELS_CHANGE_EVENT, { detail: ask }),
  );
}
