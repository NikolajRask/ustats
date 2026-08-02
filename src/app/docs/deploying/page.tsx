import type { Metadata } from "next";
import Link from "next/link";

import { DocsArticle } from "@/components/docs/docs-article";

export const metadata: Metadata = {
  title: "Deploying",
  description:
    "Self-host ustats on Vercel and Supabase — migrate Postgres, set env vars, bootstrap the first admin, and go live.",
  alternates: { canonical: "/docs/deploying" },
};

const headings = [
  { id: "overview", title: "Overview" },
  { id: "supabase", title: "Set up Supabase" },
  { id: "vercel", title: "Deploy on Vercel" },
  { id: "first-admin", title: "Create the first admin" },
  { id: "verify", title: "Verify the install" },
  { id: "checklist", title: "Checklist" },
];

export default function DocsDeployingPage() {
  return (
    <DocsArticle
      title="Deploying"
      description="Self-host ustats on Vercel and Supabase — migrate Postgres, set env vars, bootstrap the first admin, and go live."
      pathname="/docs/deploying"
      headings={headings}
    >
      <h2 id="overview">Overview</h2>
      <p>
        A production install is two pieces: a Supabase project (Postgres, Auth,
        Realtime) and a Next.js app on Vercel. The collector writes events with
        the service role key; the dashboard uses Auth + RLS. After deploy,{" "}
        <code>/</code> serves login and the dashboard.
      </p>
      <div className="docs-callout">
        <p>
          For local setup first, follow{" "}
          <Link href="/docs/installation">Installation</Link>. Env var details
          live under{" "}
          <Link href="/docs/environment-variables">Environment variables</Link>.
        </p>
      </div>

      <h2 id="supabase">Set up Supabase</h2>
      <ol>
        <li>
          Create a project in the{" "}
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
          >
            Supabase dashboard
          </a>
          .
        </li>
        <li>
          From <strong>Project Settings → API</strong>, copy the project URL,
          the <code>anon</code> (or publishable) key, and the{" "}
          <code>service_role</code> (or secret) key. Never put the service role
          key in client-side code or{" "}
          <code>NEXT_PUBLIC_*</code> variables.
        </li>
        <li>
          Apply every migration under <code>supabase/migrations</code>:
        </li>
      </ol>
      <pre>
        <code>{`npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push`}</code>
      </pre>
      <p>
        Or open the SQL editor and run the migration files in filename order
        (oldest first).
      </p>
      <ol start={4}>
        <li>
          Confirm <strong>Realtime</strong> is enabled for the{" "}
          <code>events</code> table (Dashboard → Database → Publications →{" "}
          <code>supabase_realtime</code>).
        </li>
        <li>
          Under <strong>Authentication → URL configuration</strong>, set:
          <ul>
            <li>
              <strong>Site URL</strong> to your Vercel URL (for example{" "}
              <code>https://ustats.yourdomain.com</code>)
            </li>
            <li>
              <strong>Redirect URLs</strong> to include{" "}
              <code>https://ustats.yourdomain.com/auth/callback</code>
            </li>
          </ul>
        </li>
        <li>
          For a locked-down self-host, open{" "}
          <strong>Authentication → Providers → Email</strong> and turn off{" "}
          <strong>Enable sign ups</strong>. Pair that with{" "}
          <code>DISABLE_SIGNUP=true</code> on Vercel so the UI also hides Create
          account.
        </li>
      </ol>

      <h2 id="vercel">Deploy on Vercel</h2>
      <ol>
        <li>
          Fork or clone{" "}
          <a
            href="https://github.com/NikolajRask/ustats"
            target="_blank"
            rel="noreferrer"
          >
            NikolajRask/ustats
          </a>
          , then import the repo in the{" "}
          <a href="https://vercel.com/new" target="_blank" rel="noreferrer">
            Vercel dashboard
          </a>
          . Framework preset should detect Next.js; leave the build command as{" "}
          <code>next build</code> (or your package manager’s equivalent).
        </li>
        <li>
          Add these environment variables for Production (and Preview if you
          want preview deploys to talk to the same Supabase project):
        </li>
      </ol>
      <pre>
        <code>{`NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-or-secret-key
USTATS_HASH_SALT=a-long-random-string
NEXT_PUBLIC_APP_URL=https://ustats.yourdomain.com
DISABLE_SIGNUP=true`}</code>
      </pre>
      <p>
        Generate <code>USTATS_HASH_SALT</code> with something like{" "}
        <code>openssl rand -hex 32</code>. Rotating it later changes visitor
        identity continuity when cross-day tracking is off.
      </p>
      <p>
        Optional: set <code>OPENAI_API_KEY</code> if you want the dashboard AI
        assistant.
      </p>
      <ol start={3}>
        <li>
          Deploy. Attach a custom domain if you use one, then update{" "}
          <code>NEXT_PUBLIC_APP_URL</code> and the Supabase Auth URLs to match
          and redeploy.
        </li>
      </ol>
      <div className="docs-callout">
        <p>
          On Vercel, country (and region) codes are filled from{" "}
          <code>x-vercel-ip-country</code> headers automatically — no extra
          geo provider required.
        </p>
      </div>

      <h2 id="first-admin">Create the first admin</h2>
      <p>
        With public sign-up disabled, create the first user once on boot:
      </p>
      <pre>
        <code>{`USTATS_BOOTSTRAP_EMAIL=admin@example.com
USTATS_BOOTSTRAP_PASSWORD=change-me-to-a-strong-password`}</code>
      </pre>
      <p>
        Add those to the Vercel project, redeploy (or wait for a cold start so{" "}
        <code>instrumentation</code> runs), then sign in at{" "}
        <code>/login</code>. When Auth already has at least one user, bootstrap
        is a no-op. Remove the bootstrap variables from Vercel after the first
        successful login so the password is not left in the host config.
      </p>
      <p>
        Alternatively, create the user in Supabase{" "}
        <strong>Authentication → Users</strong> and skip the bootstrap env
        vars.
      </p>

      <h2 id="verify">Verify the install</h2>
      <ol>
        <li>
          Open your Vercel URL, sign in, and create a site. Copy the embed
          snippet from the dashboard.
        </li>
        <li>
          Confirm the script URL uses your production host (driven by{" "}
          <code>NEXT_PUBLIC_APP_URL</code>):
        </li>
      </ol>
      <pre>
        <code>{`<script
  defer
  data-key="YOUR_SITE_PUBLIC_KEY"
  src="https://ustats.yourdomain.com/script.js"
></script>`}</code>
      </pre>
      <ol start={3}>
        <li>
          Load a page with the snippet, then check the live feed / overview for
          a pageview. If nothing appears, confirm the site domain allowlist,
          that migrations ran, and that{" "}
          <code>SUPABASE_SERVICE_ROLE_KEY</code> is set on Vercel.
        </li>
      </ol>
      <p>
        More on embedding: <Link href="/docs/embed-script">Embed the script</Link>
        .
      </p>

      <h2 id="checklist">Checklist</h2>
      <ul>
        <li>All Supabase migrations applied; Realtime on <code>events</code></li>
        <li>
          Auth Site URL + <code>/auth/callback</code> redirect match production
        </li>
        <li>
          Email sign-ups off in Supabase; <code>DISABLE_SIGNUP=true</code> on
          Vercel
        </li>
        <li>Required env vars set (see Environment variables)</li>
        <li>
          First admin created (bootstrap or dashboard); bootstrap env vars
          removed
        </li>
        <li>
          <code>NEXT_PUBLIC_APP_URL</code> equals the public HTTPS origin
        </li>
        <li>Test pageview lands in the dashboard</li>
      </ul>
      <p>
        Later releases: pull from upstream and apply new migrations — see{" "}
        <Link href="/docs/updating">Updating</Link>.
      </p>
    </DocsArticle>
  );
}
