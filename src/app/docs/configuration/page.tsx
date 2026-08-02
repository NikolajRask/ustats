import type { Metadata } from "next";
import Link from "next/link";

import { DocsArticle } from "@/components/docs/docs-article";

export const metadata: Metadata = {
  title: "Configuration",
  description:
    "Environment variables, Auth redirect URLs, signup controls, and instance settings.",
};

const headings = [
  { id: "environment", title: "Environment file" },
  { id: "supabase-auth", title: "Supabase Auth" },
  { id: "bootstrap", title: "First admin bootstrap" },
  { id: "instance-settings", title: "Instance settings" },
];

export default function DocsConfigurationPage() {
  return (
    <DocsArticle
      title="Configuration"
      description="Environment variables, Auth redirect URLs, signup controls, and instance settings."
      pathname="/docs/configuration"
      headings={headings}
    >
      <h2 id="environment">Environment file</h2>
      <p>
        Copy <code>.env.example</code> to <code>.env.local</code> (local) or set
        the same keys in your host (Vercel → Project → Settings → Environment
        Variables).
      </p>
      <pre>
        <code>{`cp .env.example .env.local`}</code>
      </pre>
      <p>
        Required keys: Supabase URL / anon key / service role key,{" "}
        <code>USTATS_HASH_SALT</code>, and <code>NEXT_PUBLIC_APP_URL</code>. Full
        list:{" "}
        <Link href="/docs/environment-variables">Environment variables</Link>.
      </p>

      <h2 id="supabase-auth">Supabase Auth</h2>
      <ol>
        <li>
          Set <strong>Site URL</strong> to your app origin (e.g.{" "}
          <code>http://localhost:3000</code> or{" "}
          <code>https://analytics.example.com</code>).
        </li>
        <li>
          Add <code>{"{APP_URL}/auth/callback"}</code> under{" "}
          <strong>Redirect URLs</strong>.
        </li>
        <li>
          For self-host, turn off <strong>Enable sign ups</strong> under
          Authentication → Providers → Email, and set{" "}
          <code>DISABLE_SIGNUP=true</code> in the app so the UI matches.
        </li>
      </ol>

      <h2 id="bootstrap">First admin bootstrap</h2>
      <p>
        On a fresh Auth project with zero users, set{" "}
        <code>USTATS_BOOTSTRAP_EMAIL</code> and{" "}
        <code>USTATS_BOOTSTRAP_PASSWORD</code>. On boot, ustats creates that
        user as the instance <strong>Admin</strong>. Sign in once, then{" "}
        <strong>remove</strong> the bootstrap vars from the environment.
      </p>
      <div className="docs-callout">
        <p>
          Additional users are created under <strong>Settings → Users</strong>{" "}
          (staff only). Guests are read-only for sites you assign them to.
        </p>
      </div>

      <h2 id="instance-settings">Instance settings</h2>
      <p>
        After sign-in, staff can open <strong>Settings → Instance</strong> to
        confirm the public app URL (used in embed snippets) and view database
        usage hints. Per-site retention, privacy, and danger-zone controls live
        under each site&apos;s Settings page.
      </p>
    </DocsArticle>
  );
}
