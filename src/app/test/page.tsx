"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

type UstatsApi = {
  track: (name: string, props?: Record<string, unknown>) => void;
  page: () => void;
  captureException: (err: unknown, extra?: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    ustats?: UstatsApi;
  }
}

type Trigger = {
  label: string;
  description: string;
  run: (api: UstatsApi) => void;
  snippet: string;
};

const TRIGGERS: Trigger[] = [
  {
    label: "Signup started",
    description: "Bare event name — good for funnel steps",
    snippet: "ustats.track('signup_started')",
    run: (api) => api.track("signup_started"),
  },
  {
    label: "Signup completed",
    description: "Event with plan / source props",
    snippet: "ustats.track('signup', { plan: 'pro', source: 'test' })",
    run: (api) => api.track("signup", { plan: "pro", source: "test" }),
  },
  {
    label: "CTA click",
    description: "Button / campaign interaction",
    snippet: "ustats.track('cta_click', { cta: 'hero_primary' })",
    run: (api) => api.track("cta_click", { cta: "hero_primary" }),
  },
  {
    label: "Add to cart",
    description: "Commerce-style custom event",
    snippet: "ustats.track('add_to_cart', { sku: 'demo-1', price: 29 })",
    run: (api) => api.track("add_to_cart", { sku: "demo-1", price: 29 }),
  },
  {
    label: "Purchase",
    description: "Conversion event with amount",
    snippet: "ustats.track('purchase', { amount: 29, currency: 'USD' })",
    run: (api) => api.track("purchase", { amount: 29, currency: "USD" }),
  },
  {
    label: "Newsletter subscribe",
    description: "Simple named conversion",
    snippet: "ustats.track('newsletter_subscribe')",
    run: (api) => api.track("newsletter_subscribe"),
  },
  {
    label: "Manual pageview",
    description: "Force another pageview via ustats.page()",
    snippet: "ustats.page()",
    run: (api) => api.page(),
  },
  {
    label: "Capture exception",
    description: "Send a sample error to /api/errors/collect",
    snippet: "ustats.captureException(new Error('Test error'))",
    run: (api) =>
      api.captureException(new Error("Test error from /test"), {
        source: "test_page",
      }),
  },
];

export default function TestPage() {
  const [log, setLog] = useState<string[]>([]);

  function fire(trigger: Trigger) {
    const api = window.ustats;
    if (!api) {
      setLog((prev) => [
        `${new Date().toLocaleTimeString()} — ustats not loaded yet`,
        ...prev,
      ]);
      return;
    }

    trigger.run(api);
    setLog((prev) => [
      `${new Date().toLocaleTimeString()} — ${trigger.snippet}`,
      ...prev.slice(0, 19),
    ]);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-12">
      <Button
        nativeButton={false}
        variant="ghost"
        className="-ml-2 w-fit font-display text-base font-semibold tracking-tight"
        render={<Link href="/" />}
      >
        ustats
      </Button>

      <h1 className="mt-8 font-display text-3xl font-semibold tracking-tight">
        Event test lab
      </h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Fire custom events (and a sample error) through the embedded script.
        Check your site&apos;s Events, Funnels, and Errors pages afterward.
      </p>

      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        {TRIGGERS.map((trigger) => (
          <button
            key={trigger.label}
            type="button"
            onClick={() => fire(trigger)}
            className="rounded-xl border border-border/70 bg-card/80 p-4 text-left transition-colors hover:border-border hover:bg-accent-soft/40"
          >
            <p className="font-medium tracking-tight">{trigger.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {trigger.description}
            </p>
            <code className="mt-3 block font-mono text-[11px] text-muted-foreground">
              {trigger.snippet}
            </code>
          </button>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="font-display text-sm font-semibold tracking-tight">
          Fired this session
        </h2>
        {log.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Nothing yet — click a trigger above.
          </p>
        ) : (
          <ul className="mt-3 space-y-1.5 font-mono text-xs text-muted-foreground">
            {log.map((entry, i) => (
              <li key={`${entry}-${i}`}>{entry}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
