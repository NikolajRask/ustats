import type { Metadata } from "next";
import Link from "next/link";

import { DocsArticle } from "@/components/docs/docs-article";

export const metadata: Metadata = {
  title: "Introduction",
  description:
    "Self-hosted, privacy-friendly web analytics on your Supabase project — pageviews, uniques, referrers, and events without a SaaS meter.",
  alternates: { canonical: "/docs" },
};

const headings = [
  { id: "what-is-ustats", title: "What is ustats?" },
  { id: "how-it-works", title: "How it works" },
  { id: "what-you-get", title: "What you get" },
  { id: "next-steps", title: "Next steps" },
];

export default function DocsIntroductionPage() {
  return (
    <DocsArticle
      title="Introduction"
      description="Self-hosted, privacy-friendly web analytics on your Supabase project — pageviews, uniques, referrers, and events without a SaaS meter."
      pathname="/docs"
      headings={headings}
    >
      <h2 id="what-is-ustats">What is ustats?</h2>
      <p>
        ustats is an open-source analytics stack you run yourself. Events land in
        your Postgres database, the dashboard reads them under RLS, and visitors
        are identified with a daily salted hash — no tracking cookies by
        default.
      </p>

      <div className="docs-callout">
        <p>
          <strong>Self-hosting is the point.</strong> There is no managed ustats
          product. You download the app, connect Supabase, and keep the data.
        </p>
      </div>

      <h2 id="how-it-works">How it works</h2>
      <ol>
        <li>Push the database migration to your Supabase project.</li>
        <li>Set a handful of environment variables and deploy the Next.js app.</li>
        <li>Add a site in the dashboard and paste one script tag on your site.</li>
      </ol>
      <p>
        The collector accepts pageviews and custom events. SPA route changes are
        tracked automatically via <code>history.pushState</code> and{" "}
        <code>popstate</code>.
      </p>

      <h2 id="what-you-get">What you get</h2>
      <ul>
        <li>Pageviews and unique visitors</li>
        <li>Top pages, referrers, countries, and devices</li>
        <li>UTM campaigns and custom events</li>
        <li>Realtime live feed</li>
        <li>Cookie-free visitor hashing</li>
      </ul>

      <pre>
        <code>{`<script
  defer
  data-key="YOUR_SITE_PUBLIC_KEY"
  src="https://your-ustats-host/script.js"
></script>`}</code>
      </pre>

      <h2 id="next-steps">Next steps</h2>
      <p>
        Start with{" "}
        <Link href="/docs/installation">Installation</Link> to link Supabase and
        run the app locally,{" "}
        <Link href="/docs/deploying">deploy on Vercel and Supabase</Link> for
        production, then{" "}
        <Link href="/docs/embed-script">embed the script</Link> on a site. When
        the open-source project ships fixes, follow{" "}
        <Link href="/docs/updating">Updating</Link>.
      </p>
    </DocsArticle>
  );
}
