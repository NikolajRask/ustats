import type { Metadata } from "next";

import { DocsArticle } from "@/components/docs/docs-article";

export const metadata: Metadata = {
  title: "Installation",
};

const headings = [
  { id: "requirements", title: "Requirements" },
  { id: "clone-and-install", title: "Clone and install" },
  { id: "apply-migrations", title: "Apply migrations" },
  { id: "run-locally", title: "Run locally" },
];

export default function DocsInstallationPage() {
  return (
    <DocsArticle
      title="Installation"
      description="Get ustats running against your Supabase project in a few steps."
      pathname="/docs/installation"
      headings={headings}
    >
      <h2 id="requirements">Requirements</h2>
      <ul>
        <li>A Supabase project (URL, anon key, and service role key)</li>
        <li>Node.js 20+</li>
        <li>A host that can run Next.js (local, Vercel, Fly, Docker, …)</li>
      </ul>

      <h2 id="clone-and-install">Clone and install</h2>
      <pre>
        <code>{`git clone https://github.com/NikolajRask/ustats.git
cd ustats
npm install`}</code>
      </pre>

      <h2 id="apply-migrations">Apply migrations</h2>
      <p>
        Link the CLI to your project and push <strong>all</strong> files under{" "}
        <code>supabase/migrations/</code>. Do not paste only the first{" "}
        <code>init</code> SQL file — later migrations add roles, stats RPCs,
        retention, and more.
      </p>
      <pre>
        <code>{`npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push`}</code>
      </pre>

      <div className="docs-callout">
        <p>
          Enable <strong>Realtime</strong> for the <code>events</code> table if
          the migration did not already add it (Dashboard → Database →
          Publications).
        </p>
      </div>

      <h2 id="run-locally">Run locally</h2>
      <p>
        Copy <code>.env.example</code> to <code>.env.local</code>, fill in the
        values from{" "}
        <a href="/docs/configuration">Configuration</a>, then start the app:
      </p>
      <pre>
        <code>{`npm run dev`}</code>
      </pre>
      <p>
        Open <code>http://localhost:3000</code>, sign in (or use the bootstrap
        env vars from <code>.env.example</code> on a fresh Auth project), and
        add your first site.
      </p>
      <p>
        When you are ready for production, follow{" "}
        <a href="/docs/deploying">Deploying on Vercel and Supabase</a>.
      </p>
    </DocsArticle>
  );
}
