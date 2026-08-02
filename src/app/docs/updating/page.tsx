import type { Metadata } from "next";
import Link from "next/link";

import { DocsArticle } from "@/components/docs/docs-article";
import { REPO_URL } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Updating",
  description:
    "Pull new ustats releases into your self-hosted fork — sync from upstream, apply migrations, and redeploy.",
  alternates: { canonical: "/docs/updating" },
};

const headings = [
  { id: "overview", title: "Overview" },
  { id: "remotes", title: "Keep two remotes" },
  { id: "pull", title: "Pull upstream changes" },
  { id: "migrations", title: "Apply database migrations" },
  { id: "redeploy", title: "Redeploy" },
  { id: "conflicts", title: "Conflicts and tips" },
];

export default function DocsUpdatingPage() {
  return (
    <DocsArticle
      title="Updating"
      description="Self-hosted installs get new features and fixes by syncing from the open-source repo, then migrating Postgres and redeploying."
      pathname="/docs/updating"
      headings={headings}
    >
      <h2 id="overview">Overview</h2>
      <p>
        ustats is not a managed SaaS — when{" "}
        <a href={REPO_URL} target="_blank" rel="noreferrer">
          NikolajRask/ustats
        </a>{" "}
        ships a release, your fork or private clone only updates when you pull
        those commits in. The usual loop is: fetch upstream → merge → push
        migrations to Supabase → redeploy the app.
      </p>
      <div className="docs-callout">
        <p>
          If you deployed by importing the GitHub repo on Vercel (a fork or
          your own copy), updates are git-driven. Env vars on Vercel stay put;
          only code and schema need syncing.
        </p>
      </div>

      <h2 id="remotes">Keep two remotes</h2>
      <p>
        Use <code>origin</code> for <em>your</em> hosting repo (the one Vercel
        builds) and <code>upstream</code> for the open-source project. If you
        cloned and removed the default remote, add both:
      </p>
      <pre>
        <code>{`# Your deploy repo (GitHub, GitLab, …)
git remote add origin https://github.com/YOU/your-ustats.git

# Upstream open-source project
git remote add upstream ${REPO_URL}.git

git remote -v`}</code>
      </pre>
      <p>
        On a GitHub fork, <code>origin</code> is already your fork — only add{" "}
        <code>upstream</code>:
      </p>
      <pre>
        <code>{`git remote add upstream ${REPO_URL}.git`}</code>
      </pre>

      <h2 id="pull">Pull upstream changes</h2>
      <p>
        Fetch the latest main branch, merge it into your deploy branch, then
        push to your hosting remote so Vercel (or your host) rebuilds:
      </p>
      <pre>
        <code>{`git fetch upstream
git checkout main
git merge upstream/main
git push origin main`}</code>
      </pre>
      <p>
        Prefer a review branch first if you have local customizations:
      </p>
      <pre>
        <code>{`git fetch upstream
git checkout -b sync-upstream
git merge upstream/main
# resolve conflicts, test locally
git checkout main
git merge sync-upstream
git push origin main`}</code>
      </pre>
      <p>
        Rebase works too (<code>git rebase upstream/main</code>) if you prefer a
        linear history — use whatever matches your team’s workflow.
      </p>

      <h2 id="migrations">Apply database migrations</h2>
      <p>
        New releases often add files under <code>supabase/migrations/</code>.
        After merging code, push schema changes to the same Supabase project
        your production app uses:
      </p>
      <pre>
        <code>{`npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push`}</code>
      </pre>
      <p>
        Or run any new SQL files in the Supabase SQL editor in filename order
        (oldest first). Skipping migrations can break the dashboard or
        collector even when the app deploy succeeds.
      </p>
      <div className="docs-callout">
        <p>
          Never re-run the full baseline on a database that already has data.
          Only apply migrations that are new since your last update.
        </p>
      </div>

      <h2 id="redeploy">Redeploy</h2>
      <p>
        Pushing to the branch Vercel watches usually redeploys automatically.
        If you changed only the database, you may not need an app redeploy —
        but app + migration releases should ship together.
      </p>
      <p>
        After deploy, smoke-test: open the dashboard, load a tracked page, and
        confirm <code>POST /api/collect</code> returns <code>202</code> and a
        pageview appears. See{" "}
        <Link href="/docs/deploying">Deploying</Link> for the full verify
        checklist.
      </p>

      <h2 id="conflicts">Conflicts and tips</h2>
      <ul>
        <li>
          Keep self-host secrets in Vercel / <code>.env.local</code> — not in
          git — so upstream merges stay clean.
        </li>
        <li>
          Expect conflicts if you edited branding, docs, or{" "}
          <code>NEXT_PUBLIC_*</code> defaults in-repo. Resolve carefully; prefer
          keeping upstream behavior for collector and schema files.
        </li>
        <li>
          Watch the{" "}
          <a href={`${REPO_URL}/releases`} target="_blank" rel="noreferrer">
            GitHub releases
          </a>{" "}
          (or <code>CHANGELOG.md</code>) for breaking env or migration notes.
        </li>
        <li>
          After updating, remove any temporary bootstrap env vars if you already
          have an admin user.
        </li>
      </ul>
      <p>
        Initial production setup:{" "}
        <Link href="/docs/deploying">Deploying</Link>. Env reference:{" "}
        <Link href="/docs/environment-variables">Environment variables</Link>.
      </p>
    </DocsArticle>
  );
}
