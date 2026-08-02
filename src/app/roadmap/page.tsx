import type { Metadata } from "next";
import Link from "next/link";

const REPO_URL = "https://github.com/NikolajRask/ustats";
const DOWNLOAD_URL = `${REPO_URL}/archive/refs/heads/main.zip`;

type Status = "shipped" | "building" | "planned";

type RoadmapItem = {
  title: string;
  body: string;
  status: Status;
};

type RoadmapPhase = {
  label: string;
  blurb: string;
  items: RoadmapItem[];
};

const phases: RoadmapPhase[] = [
  {
    label: "Shipped",
    blurb: "In the repo today — deploy and use them.",
    items: [
      {
        title: "Core analytics",
        body: "Pageviews, uniques, top pages, referrers, devices, and UTM campaigns.",
        status: "shipped",
      },
      {
        title: "Cookie-free visitors",
        body: "Daily salted IP + UA hashes. No tracking cookies, no raw IPs stored.",
        status: "shipped",
      },
      {
        title: "Custom events & funnels",
        body: "ustats.track() plus multi-step funnel analysis in the dashboard.",
        status: "shipped",
      },
      {
        title: "Geographics",
        body: "Country, region, and city breakdowns with a world map view.",
        status: "shipped",
      },
      {
        title: "Error tracking",
        body: "Client-side error collection and an errors table per site.",
        status: "shipped",
      },
      {
        title: "Users & live feed",
        body: "Visitor profiles, session logs, and a realtime event stream.",
        status: "shipped",
      },
    ],
  },
  {
    label: "Now",
    blurb: "Actively shaping the next releases.",
    items: [
      {
        title: "Public share links",
        body: "Read-only dashboard URLs you can send to clients or stakeholders.",
        status: "building",
      },
      {
        title: "Goals & conversions",
        body: "Mark key events or URLs as goals and track conversion rates over time.",
        status: "building",
      },
      {
        title: "Team invites",
        body: "Invite collaborators to a site without sharing your Supabase login.",
        status: "building",
      },
    ],
  },
  {
    label: "Next",
    blurb: "Queued once the current work lands.",
    items: [
      {
        title: "Scheduled email digests",
        body: "Weekly summary of traffic, top pages, and notable changes.",
        status: "planned",
      },
      {
        title: "Query API",
        body: "Authenticated endpoints to pull stats into scripts, BI tools, or bots.",
        status: "planned",
      },
      {
        title: "Retention cohorts",
        body: "See how visitors return across days and weeks.",
        status: "planned",
      },
      {
        title: "Import & migrate",
        body: "Bring historical pageviews from Plausible, umami, or CSV exports.",
        status: "planned",
      },
    ],
  },
  {
    label: "Later",
    blurb: "On the horizon — not committed to a date.",
    items: [
      {
        title: "Alert rules",
        body: "Notify when traffic spikes, drops, or a goal conversion collapses.",
        status: "planned",
      },
      {
        title: "Multi-site rollup",
        body: "One overview across every property on your instance.",
        status: "planned",
      },
      {
        title: "Dashboard themes",
        body: "Light and dark preferences that match how you work.",
        status: "planned",
      },
    ],
  },
];

const statusLabel: Record<Status, string> = {
  shipped: "Done",
  building: "Building",
  planned: "Planned",
};

export const metadata: Metadata = {
  title: "Roadmap",
  description:
    "What ustats has shipped and what is coming next for self-hosted analytics.",
  alternates: { canonical: "/roadmap" },
};

export default function RoadmapPage() {
  return (
    <div className="landing relative min-h-screen overflow-hidden">
      <div aria-hidden className="landing-atmosphere pointer-events-none absolute inset-0" />
      <div aria-hidden className="landing-noise pointer-events-none absolute inset-0" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-7 sm:px-8">
        <Link href="/" className="landing-brand text-lg font-semibold tracking-tight">
          ustats
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/roadmap"
            className="px-3.5 py-2 font-medium text-(--land-fg)"
            aria-current="page"
          >
            Roadmap
          </Link>
          <Link
            href="/#pricing"
            className="px-3.5 py-2 text-(--land-muted) transition-colors hover:text-(--land-fg)"
          >
            Pricing
          </Link>
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
        <section className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-16">
          <p className="landing-rise landing-brand text-[clamp(3.5rem,11vw,7rem)] leading-[0.9] font-extrabold tracking-[-0.04em]">
            Roadmap
          </p>
          <h1 className="landing-rise landing-rise-delay-1 mt-6 max-w-xl text-2xl leading-snug font-medium tracking-tight text-(--land-fg) sm:text-3xl">
            Where ustats is headed.
          </h1>
          <p className="landing-rise landing-rise-delay-2 mt-4 max-w-lg text-base leading-relaxed text-(--land-muted) sm:text-lg">
            Open source moves in public. Here is what already ships, what we are
            building now, and what comes after.
          </p>
        </section>

        <section className="relative border-t border-(--land-fg)/8 bg-[rgba(243,245,247,0.72)] backdrop-blur-md">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-8 sm:py-24">
            <ol className="space-y-16 sm:space-y-20">
              {phases.map((phase, phaseIndex) => (
                <li
                  key={phase.label}
                  className="landing-rise grid gap-8 lg:grid-cols-[12rem_1fr] lg:gap-16"
                  style={{ animationDelay: `${0.08 * phaseIndex}s` }}
                >
                  <div className="lg:sticky lg:top-10 lg:self-start">
                    <p className="font-mono text-xs tracking-[0.2em] text-(--land-accent) uppercase">
                      {String(phaseIndex + 1).padStart(2, "0")}
                    </p>
                    <h2 className="landing-brand mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                      {phase.label}
                    </h2>
                    <p className="mt-2 max-w-56 text-sm leading-relaxed text-(--land-muted)">
                      {phase.blurb}
                    </p>
                  </div>

                  <ul className="divide-y divide-(--land-fg)/10 border-y border-(--land-fg)/10">
                    {phase.items.map((item) => (
                      <li
                        key={item.title}
                        className="grid gap-3 py-6 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-8"
                      >
                        <div>
                          <p className="landing-brand text-lg font-semibold tracking-tight sm:text-xl">
                            {item.title}
                          </p>
                          <p className="mt-1.5 max-w-xl text-(--land-muted) leading-relaxed">
                            {item.body}
                          </p>
                        </div>
                        <span
                          className={
                            item.status === "shipped"
                              ? "font-mono text-xs tracking-wider text-(--land-accent) uppercase"
                              : item.status === "building"
                                ? "font-mono text-xs tracking-wider text-(--land-fg) uppercase"
                                : "font-mono text-xs tracking-wider text-(--land-muted) uppercase"
                          }
                        >
                          {statusLabel[item.status]}
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="relative border-t border-(--land-fg)/8">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-6 py-20 sm:px-8 sm:py-28">
            <h2 className="landing-brand text-3xl font-semibold tracking-tight sm:text-4xl">
              Suggest the next item
            </h2>
            <p className="max-w-md text-(--land-muted) leading-relaxed">
              Roadmaps change with real usage. Open an issue if something is
              missing, or ship a PR if you want to move it faster.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`${REPO_URL}/issues`}
                className="rounded-sm bg-(--land-accent) px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Open an issue
              </a>
              <Link
                href="/"
                className="rounded-sm border border-(--land-fg)/15 px-5 py-3 text-sm font-medium transition-colors hover:border-(--land-fg)/30"
              >
                Back to home
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-(--land-fg)/8">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-(--land-muted) sm:px-8">
          <Link href="/" className="landing-brand text-(--land-fg)">
            ustats
          </Link>
          <div className="flex flex-wrap items-center gap-6">
            <Link
              href="/roadmap"
              className="transition-colors hover:text-(--land-fg)"
            >
              Roadmap
            </Link>
            <Link
              href="/#pricing"
              className="transition-colors hover:text-(--land-fg)"
            >
              Pricing
            </Link>
            <a
              href={REPO_URL}
              className="transition-colors hover:text-(--land-fg)"
            >
              GitHub
            </a>
            <span>MIT License</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
