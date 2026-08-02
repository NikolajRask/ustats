"use client";

import { MessageCircleIcon, SendIcon, SparklesIcon, XIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import ReactMarkdown from "react-markdown";

import { Button } from "@/components/ui/button";
import {
  AI_ASSISTANT_CHANGE_EVENT,
  getAiAskBeforeFunnels,
  getAiAssistantEnabled,
} from "@/lib/ai-assistant";
import {
  describeFunnelToolCall,
  type PendingToolCall,
} from "@/lib/ai/prompt";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatApiResponse = {
  error?: string;
  message?: { role: "assistant"; content: string };
  pendingToolCalls?: PendingToolCall[];
};

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi — I can help you explore your analytics. Ask about traffic, users, funnels, or errors. I can also create funnels when you ask.",
};

const SITE_PATH_RE =
  /^\/dashboard\/sites\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})(?:\/|$)/i;

function siteIdFromPath(pathname: string): string | null {
  const match = pathname.match(SITE_PATH_RE);
  return match?.[1] ?? null;
}

function subscribeAiEnabled(onStoreChange: () => void) {
  window.addEventListener(AI_ASSISTANT_CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(AI_ASSISTANT_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function AiChat() {
  const panelId = useId();
  const pathname = usePathname();
  const siteId = siteIdFromPath(pathname);
  const enabled = useSyncExternalStore(
    subscribeAiEnabled,
    getAiAssistantEnabled,
    () => false,
  );
  const [open, setOpen] = useState(false);
  const panelOpen = open && enabled;
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [pending, setPending] = useState(false);
  const [pendingToolCalls, setPendingToolCalls] = useState<PendingToolCall[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!panelOpen) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [panelOpen]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, panelOpen, pending, error, pendingToolCalls]);

  async function requestChat(options: {
    history: { role: "user" | "assistant"; content: string }[];
    executeToolCalls?: PendingToolCall[];
  }) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setError(null);
    setPending(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: options.history,
          siteId,
          askBeforeFunnels: getAiAskBeforeFunnels(),
          executeToolCalls: options.executeToolCalls,
        }),
      });

      const data = (await response.json()) as ChatApiResponse;

      if (!response.ok || !data.message?.content) {
        throw new Error(data.error || "Something went wrong.");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.message!.content,
        },
      ]);
      setPendingToolCalls(data.pendingToolCalls ?? []);
    } catch (err) {
      if (controller.signal.aborted) return;
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      setPending(false);
    }
  }

  async function sendMessage() {
    const content = input.trim();
    if (!content || pending || pendingToolCalls.length > 0) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
    };

    const history = [...messages, userMessage]
      .filter((message) => message.id !== WELCOME.id)
      .map(({ role, content: text }) => ({ role, content: text }));

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    await requestChat({ history });
  }

  async function approveToolCalls() {
    if (pending || pendingToolCalls.length === 0) return;

    const calls = pendingToolCalls;
    setPendingToolCalls([]);

    const history = messages
      .filter((message) => message.id !== WELCOME.id)
      .map(({ role, content: text }) => ({ role, content: text }));

    await requestChat({ history, executeToolCalls: calls });
  }

  function denyToolCalls() {
    if (pending || pendingToolCalls.length === 0) return;
    setPendingToolCalls([]);
    setMessages((prev) => [
      ...prev,
      {
        id: `assistant-denied-${Date.now()}`,
        role: "assistant",
        content: "Okay — I won’t create that funnel.",
      },
    ]);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  if (!enabled) return null;

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      <div
        id={panelId}
        role="dialog"
        aria-label="AI chat"
        aria-hidden={!open}
        className={cn(
          "pointer-events-auto flex w-[min(100vw-2rem,22rem)] origin-bottom-right flex-col overflow-hidden rounded-2xl border border-border/80 bg-card/95 shadow-[0_18px_50px_-24px_oklch(0.35_0.04_160/0.45)] backdrop-blur-md transition-all duration-200 ease-out",
          open
            ? "h-[min(70vh,32rem)] translate-y-0 scale-100 opacity-100"
            : "pointer-events-none h-0 translate-y-2 scale-95 opacity-0",
        )}
      >
        <header className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/12 text-primary">
              <SparklesIcon className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold tracking-tight">
                Ask ustats
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Analytics assistant
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Close chat"
            onClick={() => setOpen(false)}
          >
            <XIcon />
          </Button>
        </header>

        <div
          ref={listRef}
          className="flex-1 space-y-3 overflow-y-auto px-4 py-3"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                  message.role === "user"
                    ? "rounded-br-md bg-primary text-primary-foreground whitespace-pre-wrap"
                    : "rounded-bl-md bg-muted text-foreground",
                )}
              >
                {message.role === "assistant" ? (
                  <div className="space-y-2 [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded [&_code]:bg-background/70 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.8em] [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-4 [&_p]:my-0 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-4">
                    <ReactMarkdown
                      components={{
                        a: ({ href, children }) => (
                          <a href={href} target="_blank" rel="noreferrer">
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))}

          {pendingToolCalls.length > 0 ? (
            <div className="space-y-3 rounded-xl border border-border/80 bg-background/80 p-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground">
                  Permission needed
                </p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {pendingToolCalls.map((call) => (
                    <li key={call.id}>{describeFunnelToolCall(call)}</li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={pending}
                  onClick={() => void approveToolCalls()}
                >
                  Allow
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={denyToolCalls}
                >
                  Deny
                </Button>
              </div>
            </div>
          ) : null}

          {pending ? (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                Thinking…
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          ) : null}
        </div>

        <form
          className="border-t border-border/70 p-3"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            void sendMessage();
          }}
        >
          <div className="flex items-end gap-2 rounded-xl border border-input bg-background/80 p-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder={
                pendingToolCalls.length > 0
                  ? "Allow or deny the pending action…"
                  : "Ask about your data…"
              }
              disabled={pending || pendingToolCalls.length > 0}
              className="max-h-28 min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-60"
            />
            <Button
              type="submit"
              size="icon-sm"
              className="shrink-0"
              disabled={
                pending || pendingToolCalls.length > 0 || !input.trim()
              }
              aria-label="Send message"
            >
              <SendIcon />
            </Button>
          </div>
        </form>
      </div>

      <Button
        type="button"
        size="icon-lg"
        aria-label={open ? "Close AI chat" : "Open AI chat"}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "pointer-events-auto size-14 rounded-full shadow-[0_12px_32px_-12px_oklch(0.45_0.1_165/0.55)] transition-transform duration-200 hover:scale-105 active:scale-95",
          open && "bg-secondary text-secondary-foreground hover:bg-secondary/90",
        )}
      >
        {open ? (
          <XIcon className="size-5" />
        ) : (
          <MessageCircleIcon className="size-5" />
        )}
      </Button>
    </div>
  );
}
