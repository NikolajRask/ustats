import type { Metadata } from "next";

import { DocsArticle } from "@/components/docs/docs-article";

export const metadata: Metadata = {
  title: "Privacy & visitors",
};

export default function DocsPrivacyPage() {
  return (
    <DocsArticle
      title="Privacy & visitors"
      description="How cookie-free visitor hashing works and what is stored."
      pathname="/docs/privacy"
    >
      <p>
        By default, visitors are identified with a daily salted hash of IP +
        user agent. Raw IPs are never stored, and ustats does not set tracking
        cookies.
      </p>
      <div className="docs-callout">
        <p>
          Each UTC day, the hash salt rotates. The same person on a later day
          gets a new <code>visitor_hash</code>, so you can count same-day
          uniques without building a long-lived identity.
        </p>
      </div>
      <p>
        Per site, you can optionally enable{" "}
        <strong>cross-day visitor tracking</strong> in site Settings. That uses
        a stable salt so the same IP + user agent keeps one{" "}
        <code>visitor_hash</code> across days. Durable IDs typically require a
        consent / cookie banner and legal review — the dashboard warns when the
        setting is on. Turning it on does not remap historical daily hashes.
      </p>
      <p>
        Site Settings also has <strong>data retention</strong>: keep analytics
        forever, or auto-delete pageviews, custom events, and error data after
        1–24 months. A nightly Postgres job purges expired rows in batches;
        shortening the window also purges immediately for that site. Deletion
        is permanent.
      </p>
    </DocsArticle>
  );
}
