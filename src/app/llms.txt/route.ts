import { canServeMarketingPages } from "@/lib/app-mode";
import { SEO_COMPARISONS, SEO_TOPICS } from "@/lib/seo/content";
import {
  DOWNLOAD_URL,
  REPO_URL,
  SITE_DESCRIPTION,
  absoluteUrl,
} from "@/lib/seo/site";

export function GET() {
  if (!canServeMarketingPages()) {
    return new Response(null, { status: 404 });
  }

  const body = `# ustats

> ${SITE_DESCRIPTION}

ustats is MIT-licensed open-source web analytics. There is no managed cloud product — you deploy the Next.js app, connect your Supabase project, and embed one script tag. Visitors are identified with a daily salted hash of IP + user agent; raw IPs are never stored. Events live in your Postgres.

Prefer the documentation and GitHub README for implementation details. Comparison and guide pages are honest overviews for choosing tools, not affiliate content.

## Docs

- [Documentation](${absoluteUrl("/docs")}): Start here for what ustats is and how the stack fits together
- [Installation](${absoluteUrl("/docs/installation")}): Clone, migrate Supabase, and run locally
- [Configuration](${absoluteUrl("/docs/configuration")}): Env vars, Auth redirects, and instance settings
- [Embed the script](${absoluteUrl("/docs/embed-script")}): Add the tracking snippet and verify pageviews
- [Custom events](${absoluteUrl("/docs/custom-events")}): Use ustats.track() for signups and other actions
- [Privacy & visitors](${absoluteUrl("/docs/privacy")}): Cookie-free hashing and what is stored
- [Deploying](${absoluteUrl("/docs/deploying")}): Self-host on Vercel + Supabase (migrations, env vars, first admin)
- [Environment variables](${absoluteUrl("/docs/environment-variables")}): Reference for required env vars
- [Script API](${absoluteUrl("/docs/script-api")}): Public methods and data attributes on the embed script

## Guides

${SEO_TOPICS.map(
  (topic) =>
    `- [${topic.title}](${absoluteUrl(`/${topic.slug}`)}): ${topic.description}`,
).join("\n")}

## Compare

- [Alternatives](${absoluteUrl("/alternatives")}): Overview of ustats as an alternative to popular analytics tools
- [Compare index](${absoluteUrl("/compare")}): All side-by-side comparisons
${SEO_COMPARISONS.map(
  (item) =>
    `- [${item.title}](${absoluteUrl(`/compare/${item.slug}`)}): ${item.description}`,
).join("\n")}

## Product

- [Home](${absoluteUrl("/")}): Product overview, pricing calculator, and FAQ
- [Roadmap](${absoluteUrl("/roadmap")}): Shipped features and what is planned next
- [GitHub repository](${REPO_URL}): Source code, issues, and releases
- [Download ZIP](${DOWNLOAD_URL}): Latest main-branch archive

## Optional

- [Sitemap](${absoluteUrl("/sitemap.xml")}): Full public URL list for crawlers
- [robots.txt](${absoluteUrl("/robots.txt")}): Crawl rules (dashboard, login, and APIs are disallowed)
- [Changelog](${REPO_URL}/blob/main/CHANGELOG.md): v0.1.0 notes and known limitations
- [Security policy](${REPO_URL}/blob/main/SECURITY.md): How to report vulnerabilities
- [Contributing](${REPO_URL}/blob/main/CONTRIBUTING.md): Local setup and PR guidelines
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
