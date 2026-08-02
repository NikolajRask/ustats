import type { Metadata } from "next";

import { DocsArticle } from "@/components/docs/docs-article";

export const metadata: Metadata = {
  title: "Script API",
};

export default function DocsScriptApiPage() {
  return (
    <DocsArticle
      title="Script API"
      description="Public methods and data attributes on the embed script."
      pathname="/docs/script-api"
    >
      <p>
        This page is a layout placeholder. Content will land here as the docs
        fill out — the sidebar, article chrome, and pager already work.
      </p>
      <pre>
        <code>{`ustats.track(name, props?)`}</code>
      </pre>
    </DocsArticle>
  );
}
