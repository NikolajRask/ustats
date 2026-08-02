import type { Metadata } from "next";
import Link from "next/link";

import { DocsArticle } from "@/components/docs/docs-article";

export const metadata: Metadata = {
  title: "Embed the script",
  description:
    "Add the ustats tracking snippet to your site and verify pageviews.",
};

const headings = [
  { id: "snippet", title: "Basic snippet" },
  { id: "attributes", title: "Script attributes" },
  { id: "verify", title: "Verify" },
  { id: "spas", title: "SPAs" },
];

export default function DocsEmbedScriptPage() {
  return (
    <DocsArticle
      title="Embed the script"
      description="Add the ustats tracking snippet to your site and verify pageviews."
      pathname="/docs/embed-script"
      headings={headings}
    >
      <h2 id="snippet">Basic snippet</h2>
      <p>
        In the dashboard, open your site and copy the embed snippet. It looks
        like:
      </p>
      <pre>
        <code>{`<script
  defer
  data-key="YOUR_SITE_PUBLIC_KEY"
  src="https://your-ustats-host/script.js"
></script>`}</code>
      </pre>
      <p>
        Place it in <code>&lt;head&gt;</code> or just before{" "}
        <code>&lt;/body&gt;</code> on every page you want to measure. The
        script auto-sends a <code>pageview</code> when it loads.
      </p>

      <h2 id="attributes">Script attributes</h2>
      <ul>
        <li>
          <code>data-key</code> (required) — site public key from the dashboard
        </li>
        <li>
          <code>data-api</code> (optional) — override the collect URL if the
          script is proxied (defaults to same origin as{" "}
          <code>script.js</code> → <code>/api/collect</code>)
        </li>
        <li>
          <code>data-ignore-paths</code> (optional) — comma-separated or JSON
          array of path patterns to skip (supports <code>*</code> wildcards),
          e.g. <code>/admin/*,/preview/*</code>
        </li>
      </ul>
      <p>
        Method reference: <Link href="/docs/script-api">Script API</Link>.
      </p>

      <h2 id="verify">Verify</h2>
      <ol>
        <li>Load a page that includes the script.</li>
        <li>
          Open the site dashboard — the live feed or overview should show a
          pageview within a few seconds.
        </li>
        <li>
          Confirm the site&apos;s allowed domain matches the hostname you are
          testing (collector rejects mismatched domains).
        </li>
      </ol>

      <h2 id="spas">SPAs</h2>
      <p>
        Client-side navigations that use <code>history.pushState</code> /{" "}
        <code>replaceState</code> / <code>popstate</code> emit pageviews
        automatically. You do not need a framework plugin for Next.js, React
        Router, or similar.
      </p>
      <p>
        Custom actions (signups, clicks):{" "}
        <Link href="/docs/custom-events">Custom events</Link>.
      </p>
    </DocsArticle>
  );
}
