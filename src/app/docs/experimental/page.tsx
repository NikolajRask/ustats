import type { Metadata } from "next";

import { DocsArticle } from "@/components/docs/docs-article";

export const metadata: Metadata = {
  title: "Experimental features",
  description:
    "Opt-in dashboard features that ship in the codebase but stay off until you enable them.",
};

const headings = [
  { id: "overview", title: "Overview" },
  { id: "enable", title: "How to enable" },
  { id: "features", title: "Current flags" },
  { id: "caveats", title: "Caveats" },
];

export default function DocsExperimentalPage() {
  return (
    <DocsArticle
      title="Experimental features"
      description="Opt-in dashboard features that ship in the codebase but stay off until you enable them."
      pathname="/docs/experimental"
      headings={headings}
    >
      <h2 id="overview">Overview</h2>
      <p>
        Some dashboard areas are marked experimental: they are implemented and
        reachable in the repo, but not ready for a default full release. Flags
        live in{" "}
        <code>src/lib/experimental.ts</code> and are{" "}
        <strong>off by default</strong>. When a flag is off, its nav item is
        hidden and its routes return 404.
      </p>
      <div className="docs-callout">
        <p>
          Self-hosters who want early access can turn flags on for their
          instance. Expect rough edges, API changes, or incomplete UX until a
          feature graduates out of experimental.
        </p>
      </div>

      <h2 id="enable">How to enable</h2>
      <ol>
        <li>
          Open <code>src/lib/experimental.ts</code> in your install (or fork).
        </li>
        <li>
          Set the feature you want to <code>true</code>.
        </li>
        <li>Redeploy or restart the Next.js app so the change is picked up.</li>
      </ol>
      <pre>
        <code>{`export const experimentalFeatures = {
  graphs: true,    // was false
  features: false,
  reports: false,
} as const;`}</code>
      </pre>
      <p>
        There is no env var or dashboard toggle yet — enabling is a code change
        on your instance.
      </p>

      <h2 id="features">Current flags</h2>
      <table>
        <thead>
          <tr>
            <th>Flag</th>
            <th>Dashboard</th>
            <th>What it does</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>graphs</code>
            </td>
            <td>Graphs</td>
            <td>
              Custom charts built from site stats (configurable series in the
              dashboard)
            </td>
          </tr>
          <tr>
            <td>
              <code>features</code>
            </td>
            <td>Features</td>
            <td>
              Product &quot;features&quot; defined by URL path patterns, with
              usage and time-spent style breakdowns
            </td>
          </tr>
          <tr>
            <td>
              <code>reports</code>
            </td>
            <td>Reports</td>
            <td>
              Generate downloadable site performance reports (DOCX) for a date
              range
            </td>
          </tr>
        </tbody>
      </table>

      <h2 id="caveats">Caveats</h2>
      <ul>
        <li>
          Experimental UI may change or disappear without a migration path.
        </li>
        <li>
          Schema for these features is already in Supabase migrations — turning
          a flag on does not require a new migration, only a redeploy.
        </li>
        <li>
          Guests remain read-only; creating or editing graphs, features, and
          reports still requires staff or site manager access.
        </li>
      </ul>
    </DocsArticle>
  );
}
