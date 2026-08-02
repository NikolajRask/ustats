import type { Metadata } from "next";

import { DocsArticle } from "@/components/docs/docs-article";

export const metadata: Metadata = {
  title: "Configuration",
};

export default function DocsConfigurationPage() {
  return (
    <DocsArticle
      title="Configuration"
      description="Environment variables, Auth redirect URLs, and instance settings."
      pathname="/docs/configuration"
    >
      <p>
        This page is a layout placeholder. Content will land here as the docs
        fill out — the sidebar, article chrome, and pager already work.
      </p>
      <div className="docs-callout">
        <p>
          Looking for setup steps now? Use the{" "}
          <a href="/docs/installation">Installation</a> guide and the project
          README.
        </p>
      </div>
    </DocsArticle>
  );
}
