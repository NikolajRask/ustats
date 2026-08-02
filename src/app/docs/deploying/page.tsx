import type { Metadata } from "next";

import { DocsArticle } from "@/components/docs/docs-article";

export const metadata: Metadata = {
  title: "Deploying",
};

export default function DocsDeployingPage() {
  return (
    <DocsArticle
      title="Deploying"
      description="Ship the Next.js app and point NEXT_PUBLIC_APP_URL at production."
      pathname="/docs/deploying"
    >
      <p>
        This page is a layout placeholder. Content will land here as the docs
        fill out — the sidebar, article chrome, and pager already work.
      </p>
    </DocsArticle>
  );
}
