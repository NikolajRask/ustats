import type { Metadata } from "next";
import Link from "next/link";

import { LandingChart } from "@/components/landing-chart";
import { PricingCalculator } from "@/components/pricing-calculator";
import {
  DOWNLOAD_URL,
  REPO_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  absoluteUrl,
} from "@/lib/seo/site";
import {
  SHOW_SPONSORS,
  SPONSOR_CTA_HREF,
  sponsors,
} from "@/lib/sponsors";

export const metadata: Metadata = {
  title: {
    absolute: `${SITE_NAME} · ${SITE_TAGLINE}`,
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: absoluteUrl("/") },
};

const capabilities = [
  "Pageviews & uniques",
  "Top pages",
  "Referrers",
  "Countries & devices",
  "UTM campaigns",
  "Custom events",
  "Realtime feed",
  "Cookie-free visitors",
];

const steps = [
  {
    n: "01",
    title: "Connect Supabase",
    body: "Link your project, push the migration, and set a few env vars.",
  },
  {
    n: "02",
    title: "Add a site",
    body: "Create a property in the dashboard and copy your public key.",
  },
  {
    n: "03",
    title: "Embed the script",
    body: "One tag on your site. Pageviews and SPA routes start flowing.",
  },
];

const faqs = [
  {
    q: "Is ustats free?",
    a: "Yes. ustats is MIT-licensed open source — you download and run it yourself. The only cost is whatever you already pay (or would pay) to host Next.js and a Supabase project.",
  },
  {
    q: "Do I need a cookie banner?",
    a: "ustats is cookie-free by default. Visitors are identified with a daily salted hash of IP + user agent; raw IPs are never stored. Check your own counsel for GDPR/ePrivacy, but you typically avoid consent banners required for tracking cookies.",
  },
  {
    q: "Where does the data live?",
    a: "In your Supabase Postgres database. Events are inserted by your collector via the service role and read in the dashboard under RLS — no third-party analytics SaaS holds the data.",
  },
  {
    q: "How hard is it to set up?",
    a: "Create a Supabase project, push the migration, set a handful of env vars, deploy the Next.js app, and paste one script tag. Most people are collecting pageviews within an afternoon.",
  },
  {
    q: "Does it work with SPAs and Next.js?",
    a: "Yes. The embed script listens for history.pushState and popstate, so client-side route changes are tracked without extra wiring. Custom events use ustats.track().",
  },
  {
    q: "What happens when I outgrow the Free Supabase plan?",
    a: "Upgrade the same project to Pro ($25/mo includes 8 GB disk). There is no ustats pageview meter — you only pay for the database size your retention needs. Use the calculator above to estimate.",
  },
  {
    q: "Can I export or query the data?",
    a: "Anytime. It’s your Postgres tables — use the SQL editor, BI tools, or a simple SELECT. Leaving ustats later is just taking your database with you.",
  },
  {
    q: "Is there hosted / managed ustats?",
    a: "Not as a product. Self-hosting is the point. If you want something turnkey, Plausible and similar SaaS tools are solid — ustats is for when you want the stack and the data under your roof.",
  },
];

export default function HomePage() {
  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: SITE_DESCRIPTION,
    url: absoluteUrl("/"),
    downloadUrl: DOWNLOAD_URL,
    license: "https://opensource.org/licenses/MIT",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    codeRepository: REPO_URL,
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <div className="landing relative min-h-screen overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div aria-hidden className="landing-atmosphere pointer-events-none absolute inset-0" />
      <div aria-hidden className="landing-noise pointer-events-none absolute inset-0" />

      <div
        aria-hidden
        className="landing-drift pointer-events-none absolute inset-x-0 top-0 h-svh opacity-90"
      >
        <LandingChart />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-[rgba(232,236,239,0.92)]" />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-7 sm:px-8">
        <span className="landing-brand text-lg font-semibold tracking-tight">
          ustats
        </span>
        <nav className="flex items-center gap-1 text-sm">
          <a
            href="/docs"
            className="px-3.5 py-2 text-(--land-muted) transition-colors hover:text-(--land-fg)"
          >
            Docs
          </a>
          <a
            href="/alternatives"
            className="px-3.5 py-2 text-(--land-muted) transition-colors hover:text-(--land-fg)"
          >
            Alternatives
          </a>
          <a
            href="/roadmap"
            className="px-3.5 py-2 text-(--land-muted) transition-colors hover:text-(--land-fg)"
          >
            Roadmap
          </a>
          <a
            href="#pricing"
            className="px-3.5 py-2 text-(--land-muted) transition-colors hover:text-(--land-fg)"
          >
            Pricing
          </a>
          <a
            href="#faq"
            className="px-3.5 py-2 text-(--land-muted) transition-colors hover:text-(--land-fg)"
          >
            FAQ
          </a>
          <a
            href={REPO_URL}
            className="px-3.5 py-2 text-(--land-muted) transition-colors hover:text-(--land-fg)"
          >
            GitHub
          </a>
          <a
            href={DOWNLOAD_URL}
            className="rounded-sm bg-(--land-fg) px-3.5 py-2 font-medium text-white transition-opacity hover:opacity-90"
          >
            Download
          </a>
        </nav>
      </header>

      <main className="relative z-10">
        <section className="mx-auto flex min-h-[calc(100svh-5.5rem)] w-full max-w-6xl flex-col justify-end px-6 pb-16 pt-10 sm:px-8 sm:pb-20">
          <p className="landing-rise landing-brand text-[clamp(4.5rem,14vw,9.5rem)] leading-[0.9] font-extrabold tracking-[-0.04em]">
            ustats
          </p>
          <h1 className="landing-rise landing-rise-delay-1 mt-6 max-w-xl text-2xl leading-snug font-medium tracking-tight text-(--land-fg) sm:text-3xl">
            Analytics you host. Data you keep.
          </h1>
          <p className="landing-rise landing-rise-delay-2 mt-4 max-w-md text-base leading-relaxed text-(--land-muted) sm:text-lg">
            Privacy-friendly pageviews, uniques, referrers, and events — running
            on your own Supabase.
          </p>
          <div className="landing-rise landing-rise-delay-3 mt-9 flex flex-wrap items-center gap-3">
            <a
              href={DOWNLOAD_URL}
              className="rounded-sm bg-(--land-accent) px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Download for your project
            </a>
            <a
              href={REPO_URL}
              className="rounded-sm border border-(--land-fg)/15 bg-(--land-surface) px-5 py-3 text-sm font-medium backdrop-blur-sm transition-colors hover:border-(--land-fg)/30"
            >
              View on GitHub
            </a>
          </div>
        </section>

        <section className="relative border-t border-(--land-fg)/8 bg-[rgba(243,245,247,0.72)] backdrop-blur-md">
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 sm:px-8 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
            <div>
              <h2 className="landing-brand text-3xl font-semibold tracking-tight sm:text-4xl">
                Built to stay on your stack
              </h2>
              <p className="mt-4 max-w-sm text-(--land-muted) leading-relaxed">
                One lightweight script. Cookie-free visitors. Realtime when you
                need it — without a SaaS meter.
              </p>
            </div>
            <ul className="divide-y divide-(--land-fg)/10 border-y border-(--land-fg)/10">
              {[
                {
                  title: "Own the data",
                  body: "Events live in your Supabase project — query them like anything else.",
                },
                {
                  title: "Cookie-free by default",
                  body: "Daily salted visitor hashes. No raw IPs stored.",
                },
                {
                  title: "Ship in minutes",
                  body: "Push the migration, set env vars, embed one script tag.",
                },
              ].map((item) => (
                <li
                  key={item.title}
                  className="grid gap-2 py-6 sm:grid-cols-[10rem_1fr] sm:gap-8"
                >
                  <span className="landing-brand text-sm font-semibold tracking-tight">
                    {item.title}
                  </span>
                  <span className="text-(--land-muted) leading-relaxed">
                    {item.body}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="relative border-t border-(--land-fg)/8">
          <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:px-8 sm:py-28">
            <h2 className="landing-brand max-w-lg text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything you need. Nothing you rent.
            </h2>
            <p className="mt-4 max-w-md text-(--land-muted) leading-relaxed">
              The essentials of modern web analytics — kept simple and under
              your control.
            </p>
            <ul className="mt-14 columns-1 gap-x-16 sm:columns-2">
              {capabilities.map((item) => (
                <li
                  key={item}
                  className="break-inside-avoid border-t border-(--land-fg)/10 py-5 landing-brand text-xl font-medium tracking-tight sm:text-2xl"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="relative border-t border-(--land-fg)/8 bg-[rgba(11,18,16,0.97)] text-[#eef2f0]">
          <div className="mx-auto grid w-full max-w-6xl gap-14 px-6 py-20 sm:px-8 sm:py-28 lg:grid-cols-2 lg:gap-20 lg:items-end">
            <div>
              <h2 className="landing-brand text-3xl font-semibold tracking-tight sm:text-4xl">
                Live in three steps
              </h2>
              <p className="mt-4 max-w-sm text-[#9aaba3] leading-relaxed">
                Point ustats at your Supabase project and start collecting —
                no third-party analytics account required.
              </p>
              <ol className="mt-12 space-y-8">
                {steps.map((step) => (
                  <li key={step.n} className="grid grid-cols-[3rem_1fr] gap-4">
                    <span className="font-mono text-sm tracking-widest text-[var(--land-accent)]">
                      {step.n}
                    </span>
                    <div>
                      <p className="landing-brand text-lg font-semibold tracking-tight">
                        {step.title}
                      </p>
                      <p className="mt-1.5 text-[#9aaba3] leading-relaxed">
                        {step.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="min-w-0">
              <p className="mb-3 font-mono text-xs tracking-[0.2em] text-[#7a8a82] uppercase">
                Embed
              </p>
              <pre className="overflow-x-auto rounded-sm border border-white/10 bg-black/35 p-5 font-mono text-[13px] leading-relaxed text-[#c5d4cc] sm:p-6 sm:text-sm">
                <code>{`<script
  defer
  data-key="YOUR_SITE_PUBLIC_KEY"
  src="https://your-host/script.js"
></script>`}</code>
              </pre>
              <p className="mt-4 text-sm text-[#7a8a82] leading-relaxed">
                Custom events too:{" "}
                <code className="font-mono text-[#c5d4cc]">
                  ustats.track(&quot;signup&quot;, {"{"} plan: &quot;pro&quot; {"}"})
                </code>
              </p>
            </div>
          </div>
        </section>

        <section className="relative border-t border-(--land-fg)/8">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-20 sm:px-8 sm:py-24 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <h2 className="landing-brand text-3xl font-semibold tracking-tight sm:text-4xl">
                Why self-host
              </h2>
              <p className="mt-4 max-w-md text-(--land-muted) leading-relaxed">
                SaaS analytics is fine until the invoice, the data residency
                question, or the next pricing change. ustats is the opposite
                bet.
              </p>
            </div>
            <dl className="divide-y divide-(--land-fg)/10 border-y border-(--land-fg)/10">
              {[
                {
                  dt: "No pageview caps",
                  dd: "Your Postgres, your limits.",
                },
                {
                  dt: "No black box",
                  dd: "Open source. Read the collector.",
                },
                {
                  dt: "No vendor lock-in",
                  dd: "Export is just SQL.",
                },
              ].map((row) => (
                <div
                  key={row.dt}
                  className="grid gap-1 py-5 sm:grid-cols-[1fr_1fr] sm:gap-6"
                >
                  <dt className="landing-brand font-semibold tracking-tight">
                    {row.dt}
                  </dt>
                  <dd className="text-(--land-muted)">{row.dd}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section
          id="pricing"
          className="relative scroll-mt-8 border-t border-(--land-fg)/8 bg-[rgba(243,245,247,0.72)] backdrop-blur-md"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:px-8 sm:py-28">
            <PricingCalculator />
          </div>
        </section>

        <section
          id="faq"
          className="relative scroll-mt-8 border-t border-(--land-fg)/8"
        >
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1fr_1.35fr] lg:gap-20">
            <div>
              <h2 className="landing-brand text-3xl font-semibold tracking-tight sm:text-4xl">
                FAQ
              </h2>
              <p className="mt-4 max-w-sm text-(--land-muted) leading-relaxed">
                Short answers to the usual questions before you clone the repo.
              </p>
            </div>
            <div className="divide-y divide-(--land-fg)/10 border-y border-(--land-fg)/10">
              {faqs.map((item) => (
                <details key={item.q} className="landing-faq group py-5">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-6 landing-brand text-lg font-semibold tracking-tight [&::-webkit-details-marker]:hidden">
                    <span>{item.q}</span>
                    <span
                      aria-hidden
                      className="mt-1 shrink-0 font-mono text-sm text-(--land-accent) transition-transform duration-200 group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 max-w-xl text-(--land-muted) leading-relaxed">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {SHOW_SPONSORS ? (
          <section
            id="sponsors"
            className="relative scroll-mt-8 border-t border-(--land-fg)/8"
          >
            <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:px-8 sm:py-28">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="landing-brand text-3xl font-semibold tracking-tight sm:text-4xl">
                    Sponsors
                  </h2>
                  <p className="mt-4 max-w-md text-(--land-muted) leading-relaxed">
                    Companies and people helping keep ustats open and free.
                  </p>
                </div>
                {SPONSOR_CTA_HREF ? (
                  <a
                    href={SPONSOR_CTA_HREF}
                    className="shrink-0 text-sm font-medium text-(--land-accent) transition-opacity hover:opacity-80"
                  >
                    Become a sponsor →
                  </a>
                ) : null}
              </div>

              {sponsors.length > 0 ? (
                <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {sponsors.map((sponsor) => (
                    <li key={sponsor.name}>
                      <a
                        href={sponsor.href}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="group flex h-full flex-col gap-3 border-t border-(--land-fg)/10 py-6 transition-colors hover:border-(--land-fg)/25"
                      >
                        {sponsor.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={sponsor.logo}
                            alt=""
                            className="h-8 w-auto max-w-40 object-contain object-left opacity-80 transition-opacity group-hover:opacity-100"
                          />
                        ) : null}
                        <span className="landing-brand text-lg font-semibold tracking-tight">
                          {sponsor.name}
                        </span>
                        {sponsor.description ? (
                          <span className="text-sm text-(--land-muted) leading-relaxed">
                            {sponsor.description}
                          </span>
                        ) : null}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-10 max-w-md border-t border-(--land-fg)/10 pt-6 text-(--land-muted) leading-relaxed">
                  No sponsors yet — reach out if you&apos;d like to support the
                  project.
                </p>
              )}
            </div>
          </section>
        ) : null}

        <section className="relative border-t border-(--land-fg)/8 bg-[rgba(243,245,247,0.72)]">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-8 px-6 py-20 sm:px-8 sm:py-28">
            <p className="landing-brand text-[clamp(2.75rem,8vw,5.5rem)] leading-[0.95] font-extrabold tracking-[-0.03em]">
              Deploy your
              <br />
              own instance.
            </p>
            <p className="max-w-md text-(--land-muted) leading-relaxed">
              MIT licensed. Runs anywhere Next.js runs. Backed by the Supabase
              project you already trust.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={DOWNLOAD_URL}
                className="rounded-sm bg-(--land-accent) px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Download for your project
              </a>
              <a
                href={REPO_URL}
                className="rounded-sm border border-(--land-fg)/15 px-5 py-3 text-sm font-medium transition-colors hover:border-(--land-fg)/30"
              >
                View on GitHub
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-(--land-fg)/8">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-10 text-sm text-(--land-muted) sm:px-8 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <span className="landing-brand text-(--land-fg)">ustats</span>
            <p className="mt-3 max-w-xs leading-relaxed">
              Self-hosted, privacy-friendly web analytics on your Supabase.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <p className="mb-3 font-medium text-(--land-fg)">Product</p>
              <ul className="space-y-2">
                <li>
                  <Link href="/docs" className="hover:text-(--land-fg)">
                    Docs
                  </Link>
                </li>
                <li>
                  <Link href="/roadmap" className="hover:text-(--land-fg)">
                    Roadmap
                  </Link>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-(--land-fg)">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href={REPO_URL} className="hover:text-(--land-fg)">
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-3 font-medium text-(--land-fg)">Guides</p>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/self-hosted-analytics"
                    className="hover:text-(--land-fg)"
                  >
                    Self-hosted analytics
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cookie-free-analytics"
                    className="hover:text-(--land-fg)"
                  >
                    Cookie-free analytics
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy-friendly-analytics"
                    className="hover:text-(--land-fg)"
                  >
                    Privacy-friendly
                  </Link>
                </li>
                <li>
                  <Link
                    href="/open-source-web-analytics"
                    className="hover:text-(--land-fg)"
                  >
                    Open-source analytics
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-3 font-medium text-(--land-fg)">Compare</p>
              <ul className="space-y-2">
                <li>
                  <Link href="/alternatives" className="hover:text-(--land-fg)">
                    Alternatives
                  </Link>
                </li>
                <li>
                  <Link
                    href="/compare/plausible"
                    className="hover:text-(--land-fg)"
                  >
                    vs Plausible
                  </Link>
                </li>
                <li>
                  <Link
                    href="/compare/google-analytics"
                    className="hover:text-(--land-fg)"
                  >
                    vs Google Analytics
                  </Link>
                </li>
                <li>
                  <Link href="/compare/umami" className="hover:text-(--land-fg)">
                    vs umami
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-(--land-fg)/8 px-6 py-5 text-xs text-(--land-muted) sm:px-8">
          <span>MIT License</span>
          <Link href="/supabase-analytics" className="hover:text-(--land-fg)">
            Supabase analytics
          </Link>
        </div>
      </footer>
    </div>
  );
}
