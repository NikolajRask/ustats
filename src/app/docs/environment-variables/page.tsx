import type { Metadata } from "next";

import { DocsArticle } from "@/components/docs/docs-article";

export const metadata: Metadata = {
  title: "Environment variables",
};

export default function DocsEnvPage() {
  return (
    <DocsArticle
      title="Environment variables"
      description="Reference for every ustats env var and where it is used."
      pathname="/docs/environment-variables"
    >
      <p>
        This page is a layout placeholder. Content will land here as the docs
        fill out — the sidebar, article chrome, and pager already work.
      </p>
      <ul>
        <li>
          <code>NEXT_PUBLIC_SUPABASE_URL</code>
        </li>
        <li>
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
        </li>
        <li>
          <code>SUPABASE_SERVICE_ROLE_KEY</code>
        </li>
        <li>
          <code>USTATS_HASH_SALT</code>
        </li>
        <li>
          <code>NEXT_PUBLIC_APP_URL</code>
        </li>
      </ul>
    </DocsArticle>
  );
}
