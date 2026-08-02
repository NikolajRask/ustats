import type { Metadata } from "next";

import { DocsArticle } from "@/components/docs/docs-article";

export const metadata: Metadata = {
  title: "Custom events",
};

export default function DocsCustomEventsPage() {
  return (
    <DocsArticle
      title="Custom events"
      description="Track signups, clicks, and other actions with ustats.track()."
      pathname="/docs/custom-events"
    >
      <p>
        This page is a layout placeholder. Content will land here as the docs
        fill out — the sidebar, article chrome, and pager already work.
      </p>
      <pre>
        <code>{`ustats.track("signup", { plan: "pro" });`}</code>
      </pre>
    </DocsArticle>
  );
}
