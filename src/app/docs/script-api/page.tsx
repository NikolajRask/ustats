import type { Metadata } from "next";
import Link from "next/link";

import { DocsArticle } from "@/components/docs/docs-article";

export const metadata: Metadata = {
  title: "Script API",
  description: "Public methods and data attributes on the embed script.",
};

const headings = [
  { id: "attributes", title: "Data attributes" },
  { id: "methods", title: "Methods" },
  { id: "endpoints", title: "Endpoints" },
];

export default function DocsScriptApiPage() {
  return (
    <DocsArticle
      title="Script API"
      description="Public methods and data attributes on the embed script."
      pathname="/docs/script-api"
      headings={headings}
    >
      <p>
        The tracker is served at <code>/script.js</code>. After load,{" "}
        <code>window.ustats</code> exposes the methods below. See{" "}
        <Link href="/docs/embed-script">Embed the script</Link> for install
        steps.
      </p>

      <h2 id="attributes">Data attributes</h2>
      <table>
        <thead>
          <tr>
            <th>Attribute</th>
            <th>Required</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>data-key</code>
            </td>
            <td>Yes</td>
            <td>Site public key</td>
          </tr>
          <tr>
            <td>
              <code>data-api</code>
            </td>
            <td>No</td>
            <td>
              Absolute or relative URL for <code>POST</code> collect (default:
              derived from the script URL)
            </td>
          </tr>
          <tr>
            <td>
              <code>data-ignore-paths</code>
            </td>
            <td>No</td>
            <td>
              Paths to skip — comma list or JSON array; <code>*</code> wildcards
              allowed
            </td>
          </tr>
        </tbody>
      </table>

      <h2 id="methods">Methods</h2>
      <pre>
        <code>{`// Custom event
ustats.track(name: string, props?: Record<string, unknown>): void

// Force a pageview for the current URL
ustats.page(): void

// Report an error to /api/errors/collect
ustats.captureException(err: unknown, extra?: Record<string, unknown>): void`}</code>
      </pre>
      <ul>
        <li>
          <code>track</code> — sends <code>name</code> (default payload includes
          URL, referrer, hostname, and <code>props</code>)
        </li>
        <li>
          <code>page</code> — shorthand for <code>track(&quot;pageview&quot;)</code>
        </li>
        <li>
          <code>captureException</code> — message, type, and truncated stack;
          uncaught errors are hooked automatically
        </li>
      </ul>
      <p>
        Prefer <Link href="/docs/custom-events">Custom events</Link> for
        conversion naming conventions.
      </p>

      <h2 id="endpoints">Endpoints</h2>
      <ul>
        <li>
          <code>POST /api/collect</code> — pageviews and custom events
        </li>
        <li>
          <code>POST /api/errors/collect</code> — client errors
        </li>
      </ul>
      <p>
        Both validate the site key and domain, apply bot filters, and insert via
        the service role. CORS allows browser origins; rate limits are not
        applied on these public endpoints yet — rely on key + domain checks.
      </p>
    </DocsArticle>
  );
}
