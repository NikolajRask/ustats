import type { Metadata } from "next";
import Link from "next/link";

import { MarketingShell } from "@/components/marketing/shell";
import { SEO_COMPARISONS, SEO_TOPICS } from "@/lib/seo/content";
import { DOWNLOAD_URL, absoluteUrl } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Best Plausible & GA alternatives",
  description:
    "Looking for a Plausible, Google Analytics, umami, or Matomo alternative? ustats is open-source, cookie-free web analytics on your Supabase.",
  alternates: { canonical: absoluteUrl("/alternatives") },
  openGraph: {
    title: "Analytics alternatives · ustats",
    description:
      "Self-hosted, privacy-friendly alternatives to popular web analytics tools.",
    url: absoluteUrl("/alternatives"),
  },
};

const reasons = [
  {
    title: "Your database, not theirs",
    body: "Events land in your Supabase Postgres. Query them, back them up, and leave whenever you want.",
  },
  {
    title: "Cookie-free by default",
    body: "Daily salted visitor hashes. No tracking cookies required for core measurement.",
  },
  {
    title: "No pageview meter",
    body: "You pay for the infra you already run. ustats does not bill per visit.",
  },
];

export default function AlternativesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Analytics alternatives",
    description:
      "Self-hosted, privacy-friendly alternatives to popular web analytics tools.",
    url: absoluteUrl("/alternatives"),
  };

  return (
    <MarketingShell active="alternatives">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        <section className="mx-auto w-full max-w-6xl px-6 pb-14 pt-10 sm:px-8 sm:pt-14">
          <p className="landing-brand text-[clamp(3rem,10vw,6rem)] leading-[0.92] font-extrabold tracking-[-0.04em]">
            Alternatives
          </p>
          <h1 className="mt-6 max-w-2xl text-2xl leading-snug font-medium tracking-tight sm:text-3xl">
            A self-hosted alternative to Plausible, GA, umami, and friends.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-(--land-muted) sm:text-lg">
            ustats is MIT open source. You host it, keep the data, and skip the
            SaaS pageview bill — especially if Supabase is already your stack.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={DOWNLOAD_URL}
              className="rounded-sm bg-(--land-accent) px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Download ustats
            </a>
            <Link
              href="/compare"
              className="rounded-sm border border-(--land-fg)/15 px-5 py-3 text-sm font-medium transition-colors hover:border-(--land-fg)/30"
            >
              Browse comparisons
            </Link>
          </div>
        </section>

        <section className="border-t border-(--land-fg)/8 bg-[rgba(243,245,247,0.72)] backdrop-blur-md">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-8">
            <h2 className="landing-brand text-3xl font-semibold tracking-tight">
              Why teams switch
            </h2>
            <ul className="mt-8 divide-y divide-(--land-fg)/10 border-y border-(--land-fg)/10">
              {reasons.map((reason) => (
                <li
                  key={reason.title}
                  className="grid gap-2 py-6 sm:grid-cols-[14rem_1fr] sm:gap-10"
                >
                  <span className="landing-brand font-semibold tracking-tight">
                    {reason.title}
                  </span>
                  <span className="text-(--land-muted) leading-relaxed">
                    {reason.body}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-(--land-fg)/8">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-8">
            <h2 className="landing-brand text-3xl font-semibold tracking-tight">
              Direct comparisons
            </h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {SEO_COMPARISONS.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/compare/${item.slug}`}
                    className="block border border-(--land-fg)/10 px-5 py-5 transition-colors hover:border-(--land-fg)/25"
                  >
                    <p className="landing-brand text-lg font-semibold tracking-tight">
                      {item.title}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-(--land-muted)">
                      {item.headline}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-(--land-fg)/8 bg-[rgba(243,245,247,0.72)] backdrop-blur-md">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-8">
            <h2 className="landing-brand text-3xl font-semibold tracking-tight">
              Guides
            </h2>
            <ul className="mt-8 divide-y divide-(--land-fg)/10 border-y border-(--land-fg)/10">
              {SEO_TOPICS.map((topic) => (
                <li key={topic.slug}>
                  <Link
                    href={`/${topic.slug}`}
                    className="flex items-center justify-between gap-4 py-5 transition-colors hover:text-(--land-accent)"
                  >
                    <span>
                      <span className="landing-brand block text-lg font-semibold tracking-tight text-(--land-fg)">
                        {topic.title}
                      </span>
                      <span className="mt-1 block text-sm text-(--land-muted)">
                        {topic.headline}
                      </span>
                    </span>
                    <span aria-hidden className="text-(--land-muted)">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
