import type { Metadata } from "next";
import Link from "next/link";

import { DocsArticle } from "@/components/docs/docs-article";

export const metadata: Metadata = {
  title: "Custom events",
  description:
    "Track signups, clicks, and other actions with ustats.track().",
};

const headings = [
  { id: "track", title: "ustats.track()" },
  { id: "props", title: "Properties" },
  { id: "funnels", title: "Funnels" },
  { id: "errors", title: "Errors" },
];

export default function DocsCustomEventsPage() {
  return (
    <DocsArticle
      title="Custom events"
      description="Track signups, clicks, and other actions with ustats.track()."
      pathname="/docs/custom-events"
      headings={headings}
    >
      <h2 id="track">ustats.track()</h2>
      <p>
        After the embed script loads, call <code>ustats.track</code> with an
        event name and optional properties:
      </p>
      <pre>
        <code>{`ustats.track("signup", { plan: "pro" });
ustats.track("cta_click", { cta: "hero_primary" });
ustats.track("purchase", { amount: 29, currency: "USD" });`}</code>
      </pre>
      <p>
        Names are free-form strings. Prefer stable, lowercase snake_case or
        kebab-case names so funnels and aliases stay readable.
      </p>

      <h2 id="props">Properties</h2>
      <p>
        The second argument is a JSON object. Keep values small and
        non-sensitive — props are stored with the event and shown in the
        dashboard. Avoid PII (emails, names, raw IPs).
      </p>
      <div className="docs-callout">
        <p>
          Pageviews are automatic. Use custom events for conversions and
          product actions you care about in{" "}
          <strong>Events</strong> and <strong>Funnels</strong>.
        </p>
      </div>

      <h2 id="funnels">Funnels</h2>
      <p>
        In the dashboard, open <strong>Funnels</strong> and define ordered
        steps that match your event names (e.g.{" "}
        <code>signup_started</code> → <code>signup</code>). Staff and site
        managers can create funnels; guest viewers can inspect results
        read-only.
      </p>

      <h2 id="errors">Errors</h2>
      <p>
        Uncaught errors and unhandled promise rejections are sent to{" "}
        <code>/api/errors/collect</code> automatically. You can also report
        manually:
      </p>
      <pre>
        <code>{`ustats.captureException(err, { source: "checkout" });`}</code>
      </pre>
      <p>
        Full method list: <Link href="/docs/script-api">Script API</Link>.
      </p>
    </DocsArticle>
  );
}
