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
        This page is a layout placeholder. Content will land here as the docs
        fill out — the sidebar, article chrome, and pager already work.
      </p>
      <div className="docs-callout">
        <p>
          Visitors are identified with a daily salted hash of IP + user agent.
          Raw IPs are never stored.
        </p>
      </div>
    </DocsArticle>
  );
}
