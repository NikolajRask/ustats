import type { Metadata } from "next";
import Link from "next/link";

import { MarketingShell } from "@/components/marketing/shell";
import { SEO_COMPARISONS } from "@/lib/seo/content";
import { absoluteUrl } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Compare analytics tools",
  description:
    "Honest comparisons of ustats versus Plausible, Google Analytics, umami, Matomo, and Fathom — for teams choosing self-hosted, privacy-friendly analytics.",
  alternates: { canonical: absoluteUrl("/compare") },
  openGraph: {
    title: "Compare analytics tools · ustats",
    description:
      "See how ustats stacks up against popular web analytics products.",
    url: absoluteUrl("/compare"),
  },
};

export default function CompareIndexPage() {
  return (
    <MarketingShell active="compare">
      <main>
        <section className="mx-auto w-full max-w-6xl px-6 pb-14 pt-10 sm:px-8 sm:pt-14">
          <p className="font-mono text-xs tracking-[0.2em] text-(--land-accent) uppercase">
            Compare
          </p>
          <h1 className="landing-brand mt-4 text-[clamp(2.75rem,9vw,5rem)] leading-[0.95] font-extrabold tracking-[-0.03em]">
            ustats vs the field
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-(--land-muted)">
            Side-by-side notes for teams weighing self-hosted Supabase analytics
            against popular privacy and open-source tools.
          </p>
        </section>

        <section className="border-t border-(--land-fg)/8 bg-[rgba(243,245,247,0.72)] backdrop-blur-md">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-8">
            <ul className="divide-y divide-(--land-fg)/10 border-y border-(--land-fg)/10">
              {SEO_COMPARISONS.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/compare/${item.slug}`}
                    className="grid gap-2 py-7 transition-colors hover:text-(--land-accent) sm:grid-cols-[14rem_1fr] sm:gap-10"
                  >
                    <span className="landing-brand text-xl font-semibold tracking-tight text-(--land-fg)">
                      vs {item.competitor}
                    </span>
                    <span className="leading-relaxed text-(--land-muted)">
                      {item.summary}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-10 text-(--land-muted)">
              Prefer a single overview? See{" "}
              <Link
                href="/alternatives"
                className="text-(--land-fg) underline decoration-(--land-fg)/25 underline-offset-4"
              >
                analytics alternatives
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
