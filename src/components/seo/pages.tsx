import type { Metadata } from "next";
import Link from "next/link";

import { MarketingShell } from "@/components/marketing/shell";
import {
  getComparison,
  getTopic,
  type SeoComparison,
  type SeoTopic,
} from "@/lib/seo/content";
import { DOWNLOAD_URL, REPO_URL, absoluteUrl } from "@/lib/seo/site";

export function topicMetadata(slug: string): Metadata {
  const topic = getTopic(slug);
  if (!topic) return {};
  const url = absoluteUrl(`/${topic.slug}`);
  return {
    title: topic.title,
    description: topic.description,
    alternates: { canonical: url },
    openGraph: {
      title: `${topic.title} · ustats`,
      description: topic.description,
      url,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${topic.title} · ustats`,
      description: topic.description,
    },
  };
}

export function comparisonMetadata(slug: string): Metadata {
  const item = getComparison(slug);
  if (!item) return {};
  const url = absoluteUrl(`/compare/${item.slug}`);
  return {
    title: item.title,
    description: item.description,
    alternates: { canonical: url },
    openGraph: {
      title: `${item.title} · ustats`,
      description: item.description,
      url,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${item.title} · ustats`,
      description: item.description,
    },
  };
}

function CtaRow() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <a
        href={DOWNLOAD_URL}
        className="rounded-sm bg-(--land-accent) px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Download for your project
      </a>
      <Link
        href="/docs/installation"
        className="rounded-sm border border-(--land-fg)/15 px-5 py-3 text-sm font-medium transition-colors hover:border-(--land-fg)/30"
      >
        Read the docs
      </Link>
    </div>
  );
}

function RelatedLinks({
  links,
}: {
  links: { title: string; href: string }[];
}) {
  return (
    <ul className="mt-4 divide-y divide-(--land-fg)/10 border-y border-(--land-fg)/10">
      {links.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            className="flex items-center justify-between gap-4 py-4 text-(--land-fg) transition-colors hover:text-(--land-accent)"
          >
            <span className="landing-brand font-semibold tracking-tight">
              {link.title}
            </span>
            <span aria-hidden className="text-(--land-muted)">
              →
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function TopicPage({ topic }: { topic: SeoTopic }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: topic.title,
    description: topic.description,
    author: {
      "@type": "Organization",
      name: "ustats",
      url: absoluteUrl("/"),
    },
    mainEntityOfPage: absoluteUrl(`/${topic.slug}`),
  };

  return (
    <MarketingShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        <section className="mx-auto w-full max-w-6xl px-6 pb-14 pt-10 sm:px-8 sm:pt-14">
          <p className="font-mono text-xs tracking-[0.2em] text-(--land-accent) uppercase">
            {topic.eyebrow}
          </p>
          <h1 className="landing-brand mt-4 max-w-3xl text-[clamp(2.5rem,8vw,4.5rem)] leading-[0.95] font-extrabold tracking-[-0.03em]">
            {topic.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-(--land-muted)">
            {topic.headline}
          </p>
          <p className="mt-4 max-w-2xl leading-relaxed text-(--land-muted)">
            {topic.description}
          </p>
          <div className="mt-8">
            <CtaRow />
          </div>
        </section>

        <section className="border-t border-(--land-fg)/8 bg-[rgba(243,245,247,0.72)] backdrop-blur-md">
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
            {topic.sections.map((section) => (
              <article key={section.heading} className="min-w-0">
                <h2 className="landing-brand text-2xl font-semibold tracking-tight sm:text-3xl">
                  {section.heading}
                </h2>
                {section.body.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="mt-4 max-w-xl leading-relaxed text-(--land-muted)"
                  >
                    {paragraph}
                  </p>
                ))}
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-(--land-fg)/8">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-8 sm:py-20">
            <h2 className="landing-brand text-2xl font-semibold tracking-tight sm:text-3xl">
              Keep reading
            </h2>
            <RelatedLinks links={topic.related} />
            <div className="mt-10">
              <CtaRow />
            </div>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}

export function ComparisonPage({ item }: { item: SeoComparison }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: item.title,
    description: item.description,
    author: {
      "@type": "Organization",
      name: "ustats",
      url: absoluteUrl("/"),
    },
    mainEntityOfPage: absoluteUrl(`/compare/${item.slug}`),
  };

  return (
    <MarketingShell active="compare">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        <section className="mx-auto w-full max-w-6xl px-6 pb-14 pt-10 sm:px-8 sm:pt-14">
          <p className="font-mono text-xs tracking-[0.2em] text-(--land-accent) uppercase">
            Compare
          </p>
          <h1 className="landing-brand mt-4 max-w-3xl text-[clamp(2.5rem,8vw,4.5rem)] leading-[0.95] font-extrabold tracking-[-0.03em]">
            {item.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-(--land-muted)">
            {item.headline}
          </p>
          <p className="mt-4 max-w-2xl leading-relaxed text-(--land-muted)">
            {item.summary}
          </p>
          <div className="mt-8">
            <CtaRow />
          </div>
        </section>

        <section className="border-t border-(--land-fg)/8 bg-[rgba(243,245,247,0.72)] backdrop-blur-md">
          <div className="mx-auto w-full max-w-6xl overflow-x-auto px-6 py-16 sm:px-8 sm:py-20">
            <h2 className="landing-brand text-2xl font-semibold tracking-tight sm:text-3xl">
              Side by side
            </h2>
            <table className="mt-8 w-full min-w-[40rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-(--land-fg)/15">
                  <th className="py-3 pr-4 font-medium text-(--land-muted)">
                    Feature
                  </th>
                  <th className="py-3 pr-4 font-medium text-(--land-fg)">
                    ustats
                  </th>
                  <th className="py-3 font-medium text-(--land-fg)">
                    {item.competitor}
                  </th>
                </tr>
              </thead>
              <tbody>
                {item.rows.map((row) => (
                  <tr
                    key={row.feature}
                    className="border-b border-(--land-fg)/10 align-top"
                  >
                    <td className="py-4 pr-4 font-medium text-(--land-fg)">
                      {row.feature}
                    </td>
                    <td className="py-4 pr-4 text-(--land-muted)">
                      {row.ustats}
                    </td>
                    <td className="py-4 text-(--land-muted)">
                      {row.competitor}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="border-t border-(--land-fg)/8">
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-16 sm:px-8 sm:py-20 lg:grid-cols-2">
            <div>
              <h2 className="landing-brand text-2xl font-semibold tracking-tight">
                Choose ustats when
              </h2>
              <ul className="mt-5 space-y-3 text-(--land-muted)">
                {item.whenUstats.map((point) => (
                  <li key={point} className="flex gap-3 leading-relaxed">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-(--land-accent)" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="landing-brand text-2xl font-semibold tracking-tight">
                Choose {item.competitor} when
              </h2>
              <ul className="mt-5 space-y-3 text-(--land-muted)">
                {item.whenCompetitor.map((point) => (
                  <li key={point} className="flex gap-3 leading-relaxed">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-(--land-muted-line)" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-t border-(--land-fg)/8 bg-[rgba(243,245,247,0.72)] backdrop-blur-md">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-8 sm:py-20">
            <h2 className="landing-brand text-2xl font-semibold tracking-tight sm:text-3xl">
              Related
            </h2>
            <RelatedLinks links={item.related} />
            <p className="mt-8 max-w-xl text-(--land-muted) leading-relaxed">
              Prefer source over slides?{" "}
              <a
                href={REPO_URL}
                className="text-(--land-fg) underline decoration-(--land-fg)/25 underline-offset-4 hover:decoration-(--land-fg)"
              >
                Browse the repo
              </a>{" "}
              or start with installation.
            </p>
            <div className="mt-8">
              <CtaRow />
            </div>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
