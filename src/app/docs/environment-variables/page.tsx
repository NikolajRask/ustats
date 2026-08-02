import type { Metadata } from "next";
import Link from "next/link";

import { DocsArticle } from "@/components/docs/docs-article";

export const metadata: Metadata = {
  title: "Environment variables",
  description: "Reference for every ustats env var and where it is used.",
};

const headings = [
  { id: "required", title: "Required" },
  { id: "optional", title: "Optional" },
  { id: "self-host", title: "Self-host auth" },
];

export default function DocsEnvPage() {
  return (
    <DocsArticle
      title="Environment variables"
      description="Reference for every ustats env var and where it is used."
      pathname="/docs/environment-variables"
      headings={headings}
    >
      <p>
        Copy from <code>.env.example</code>. Never commit real{" "}
        <code>.env</code> / <code>.env.local</code> files. The service role key
        must stay server-side only.
      </p>

      <h2 id="required">Required</h2>
      <table>
        <thead>
          <tr>
            <th>Variable</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>NEXT_PUBLIC_SUPABASE_URL</code>
            </td>
            <td>Supabase project URL</td>
          </tr>
          <tr>
            <td>
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
            </td>
            <td>Public anon / publishable key (browser + server)</td>
          </tr>
          <tr>
            <td>
              <code>SUPABASE_SERVICE_ROLE_KEY</code>
            </td>
            <td>
              Service role key — collector inserts, bootstrap, admin user APIs
            </td>
          </tr>
          <tr>
            <td>
              <code>USTATS_HASH_SALT</code>
            </td>
            <td>Long random string for visitor / session hashing</td>
          </tr>
          <tr>
            <td>
              <code>NEXT_PUBLIC_APP_URL</code>
            </td>
            <td>Public origin of this install (embed snippets, redirects)</td>
          </tr>
        </tbody>
      </table>

      <h2 id="optional">Optional</h2>
      <table>
        <thead>
          <tr>
            <th>Variable</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>OPENAI_API_KEY</code>
            </td>
            <td>
              Enables the dashboard AI assistant (omit if you do not need it)
            </td>
          </tr>
        </tbody>
      </table>

      <h2 id="self-host">Self-host auth</h2>
      <table>
        <thead>
          <tr>
            <th>Variable</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>DISABLE_SIGNUP</code>
            </td>
            <td>
              Set <code>true</code> to hide Create account and reject{" "}
              <code>signUp</code> (also disable Email sign-ups in Supabase)
            </td>
          </tr>
          <tr>
            <td>
              <code>USTATS_BOOTSTRAP_EMAIL</code>
            </td>
            <td>
              First admin email when Auth has zero users — remove after first
              boot
            </td>
          </tr>
          <tr>
            <td>
              <code>USTATS_BOOTSTRAP_PASSWORD</code>
            </td>
            <td>Password for that admin (min 6 chars) — remove after first boot</td>
          </tr>
          <tr>
            <td>
              <code>USTATS_RECOVERY_PHRASE</code>
            </td>
            <td>
              Optional phrase to reset password while signed in (Settings →
              Security)
            </td>
          </tr>
        </tbody>
      </table>

      <p>
        Setup walkthrough: <Link href="/docs/configuration">Configuration</Link>{" "}
        · Production: <Link href="/docs/deploying">Deploying</Link>.
      </p>
    </DocsArticle>
  );
}
