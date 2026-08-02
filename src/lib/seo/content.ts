export type SeoSection = {
  heading: string;
  body: string[];
};

export type SeoTopic = {
  slug: string;
  title: string;
  eyebrow: string;
  headline: string;
  description: string;
  sections: SeoSection[];
  related: { title: string; href: string }[];
};

export type SeoComparison = {
  slug: string;
  competitor: string;
  title: string;
  headline: string;
  description: string;
  summary: string;
  whenUstats: string[];
  whenCompetitor: string[];
  rows: { feature: string; ustats: string; competitor: string }[];
  related: { title: string; href: string }[];
};

export const SEO_TOPICS: SeoTopic[] = [
  {
    slug: "self-hosted-analytics",
    title: "Self-hosted analytics",
    eyebrow: "Own the stack",
    headline: "Web analytics that runs on your infrastructure.",
    description:
      "ustats is self-hosted web analytics on your Supabase project — no SaaS meter, no third-party data warehouse, MIT-licensed.",
    sections: [
      {
        heading: "Why self-host analytics?",
        body: [
          "SaaS analytics is convenient until pricing scales with pageviews, retention windows shrink, or you need the raw events for your own queries. Self-hosting keeps traffic data next to the rest of your product stack.",
          "ustats is a Next.js app plus a Postgres schema. You deploy it wherever Next.js runs and point it at a Supabase project you control.",
        ],
      },
      {
        heading: "What you run",
        body: [
          "Push the migrations, set environment variables, deploy the app, and embed one script tag. Events insert through your collector with the service role; the dashboard reads under RLS.",
          "There is no hosted ustats product. Self-hosting is the product.",
        ],
      },
      {
        heading: "Compared to renting a SaaS",
        body: [
          "You pay for the compute and database you already use — not a separate pageview bill. Exporting later is a SQL query, not a vendor offboarding ticket.",
        ],
      },
    ],
    related: [
      { title: "Privacy-friendly analytics", href: "/privacy-friendly-analytics" },
      { title: "ustats vs Plausible", href: "/compare/plausible" },
      { title: "Installation docs", href: "/docs/installation" },
    ],
  },
  {
    slug: "cookie-free-analytics",
    title: "Cookie-free analytics",
    eyebrow: "No tracking cookies",
    headline: "Measure traffic without dropping tracking cookies.",
    description:
      "ustats identifies visitors with a daily salted hash of IP + user agent. No tracking cookies by default — and raw IPs are never stored.",
    sections: [
      {
        heading: "How visitor identity works",
        body: [
          "Each day, ustats hashes IP address and user agent with a private salt you configure. The hash is what gets stored for unique visitors — not the raw IP.",
          "That means you get useful unique counts without first-party tracking cookies for identification.",
        ],
      },
      {
        heading: "What this means for consent banners",
        body: [
          "Cookie-free by default often avoids consent banners required specifically for tracking cookies. You still need to apply your own counsel for GDPR and ePrivacy in your jurisdiction.",
          "If you add other trackers on the same site, those tools keep their own requirements.",
        ],
      },
      {
        heading: "Still useful analytics",
        body: [
          "You still get pageviews, uniques, top pages, referrers, devices, countries, UTMs, custom events, and a live feed — without renting a cookie-heavy SaaS.",
        ],
      },
    ],
    related: [
      { title: "Privacy & visitors docs", href: "/docs/privacy" },
      { title: "Privacy-friendly analytics", href: "/privacy-friendly-analytics" },
      { title: "ustats vs Google Analytics", href: "/compare/google-analytics" },
    ],
  },
  {
    slug: "privacy-friendly-analytics",
    title: "Privacy-friendly analytics",
    eyebrow: "Data you keep",
    headline: "Analytics designed to stay on your side of the wall.",
    description:
      "Privacy-friendly web analytics with cookie-free visitors, no raw IP storage, and events that live in your own Postgres — not a vendor warehouse.",
    sections: [
      {
        heading: "Privacy as architecture",
        body: [
          "ustats does not send your visitors' traffic to a multi-tenant analytics SaaS. The collector writes into your Supabase database. You decide retention, access, and backups.",
          "Visitors are hashed daily. Raw IPs are not stored. Tracking cookies are not required for core measurement.",
        ],
      },
      {
        heading: "What you can still answer",
        body: [
          "Which pages convert, where traffic comes from, which campaigns work, and how funnels drop off — without treating every visitor as an advertising profile.",
        ],
      },
      {
        heading: "Open and inspectable",
        body: [
          "The schema and collector are in the repo. If privacy requirements change, you can read the code, change the salt, or stop collecting — without waiting on a vendor roadmap.",
        ],
      },
    ],
    related: [
      { title: "Cookie-free analytics", href: "/cookie-free-analytics" },
      { title: "Self-hosted analytics", href: "/self-hosted-analytics" },
      { title: "Open-source web analytics", href: "/open-source-web-analytics" },
    ],
  },
  {
    slug: "open-source-web-analytics",
    title: "Open-source web analytics",
    eyebrow: "MIT licensed",
    headline: "Open-source analytics you can fork, audit, and run.",
    description:
      "ustats is MIT-licensed open-source web analytics: Next.js, Supabase Postgres, and a one-line embed script. Inspect it, self-host it, keep the data.",
    sections: [
      {
        heading: "What open source buys you",
        body: [
          "You can audit how events are collected, how visitors are hashed, and how the dashboard queries Postgres. There is no black-box pixel talking to an opaque backend you cannot see.",
          "If the project ever stalls, you still have the code and the database.",
        ],
      },
      {
        heading: "Stack you already know",
        body: [
          "Built on Next.js and Supabase so the operational model matches modern app teams: migrations, env vars, deploy, done. Query events with SQL whenever you need something the UI does not show yet.",
        ],
      },
      {
        heading: "Not a SaaS in disguise",
        body: [
          "There is no metering cloud. Download the repo, connect your project, and run it. Alternatives like Plausible Cloud or Google Analytics remain great if you want managed hosting — ustats is for when ownership matters more.",
        ],
      },
    ],
    related: [
      { title: "Compare alternatives", href: "/alternatives" },
      { title: "ustats vs umami", href: "/compare/umami" },
      { title: "Documentation", href: "/docs" },
    ],
  },
  {
    slug: "supabase-analytics",
    title: "Supabase analytics",
    eyebrow: "On your project",
    headline: "Web analytics that stores events in your Supabase.",
    description:
      "Add privacy-friendly website analytics to the Supabase project you already run. ustats writes pageviews and events to your Postgres and reads them under RLS.",
    sections: [
      {
        heading: "Why Supabase fits",
        body: [
          "If your product already lives on Supabase, shipping another SaaS just to count pageviews adds a second vendor, a second bill, and another place data can leave.",
          "ustats uses Auth for the dashboard, Postgres for events, and Realtime for the live feed — on the same project.",
        ],
      },
      {
        heading: "What gets stored",
        body: [
          "Pageviews, custom events, hashed visitor identifiers, referrers, UTMs, device hints, and geo fields from CDN headers when available. You control retention with ordinary SQL.",
        ],
      },
      {
        heading: "Setup shape",
        body: [
          "Link the CLI, push migrations, set keys and a hash salt, deploy Next.js, embed the script. Most teams are collecting pageviews the same day.",
        ],
      },
    ],
    related: [
      { title: "Self-hosted analytics", href: "/self-hosted-analytics" },
      { title: "Configuration docs", href: "/docs/configuration" },
      { title: "Environment variables", href: "/docs/environment-variables" },
    ],
  },
];

export const SEO_COMPARISONS: SeoComparison[] = [
  {
    slug: "plausible",
    competitor: "Plausible",
    title: "ustats vs Plausible",
    headline: "Self-hosted Supabase analytics vs Plausible.",
    description:
      "Compare ustats and Plausible for privacy-friendly web analytics — hosting model, data ownership, pricing shape, and when each is the better fit.",
    summary:
      "Plausible is a polished privacy-first analytics product with cloud and self-hosted options. ustats is MIT open source that stores events in your Supabase and has no managed cloud product.",
    whenUstats: [
      "You already run Supabase and want events in the same Postgres",
      "You want MIT code with no separate analytics SaaS bill",
      "You care about querying raw events with SQL on day one",
    ],
    whenCompetitor: [
      "You want a turnkey hosted product with less ops",
      "You prefer Plausible's mature UI and ecosystem",
      "You are fine paying for managed privacy analytics",
    ],
    rows: [
      {
        feature: "Hosting",
        ustats: "Self-host only (Next.js + Supabase)",
        competitor: "Cloud + self-hosted CE",
      },
      {
        feature: "Data location",
        ustats: "Your Supabase Postgres",
        competitor: "Plausible Cloud or your server",
      },
      {
        feature: "Cookies",
        ustats: "Cookie-free visitor hashing",
        competitor: "Cookie-free by design",
      },
      {
        feature: "License",
        ustats: "MIT",
        competitor: "AGPL (self-host) / commercial cloud",
      },
      {
        feature: "Pricing model",
        ustats: "Your infra cost only",
        competitor: "Pageview tiers on Cloud",
      },
    ],
    related: [
      { title: "ustats vs umami", href: "/compare/umami" },
      { title: "Self-hosted analytics", href: "/self-hosted-analytics" },
      { title: "All alternatives", href: "/alternatives" },
    ],
  },
  {
    slug: "google-analytics",
    competitor: "Google Analytics",
    title: "ustats vs Google Analytics",
    headline: "A privacy-first alternative to Google Analytics.",
    description:
      "See how ustats compares to Google Analytics for teams that want simpler metrics, cookie-free tracking, and data that never leaves their own database.",
    summary:
      "Google Analytics is the default for marketing teams that need ads integrations and deep attribution. ustats is for product and engineering teams that want owned, lightweight, privacy-friendly traffic data.",
    whenUstats: [
      "You do not need Google Ads / BigQuery integrations",
      "You want cookie-free measurement by default",
      "You want events in your Postgres, not Google's",
    ],
    whenCompetitor: [
      "You rely on GA4 audiences, ads linking, or enterprise reporting",
      "Your marketing stack assumes GA as the source of truth",
      "You need Google's ecosystem more than data ownership",
    ],
    rows: [
      {
        feature: "Data ownership",
        ustats: "Your Supabase project",
        competitor: "Google Cloud",
      },
      {
        feature: "Cookies / consent",
        ustats: "No tracking cookies by default",
        competitor: "Typically requires consent in EU",
      },
      {
        feature: "Complexity",
        ustats: "Focused traffic + events UI",
        competitor: "Broad marketing analytics suite",
      },
      {
        feature: "Cost",
        ustats: "Infra you already pay for",
        competitor: "Free tier + Google account tradeoffs",
      },
      {
        feature: "Self-host",
        ustats: "Yes",
        competitor: "No",
      },
    ],
    related: [
      { title: "Cookie-free analytics", href: "/cookie-free-analytics" },
      { title: "Privacy-friendly analytics", href: "/privacy-friendly-analytics" },
      { title: "ustats vs Plausible", href: "/compare/plausible" },
    ],
  },
  {
    slug: "umami",
    competitor: "umami",
    title: "ustats vs umami",
    headline: "Two open-source analytics paths — Supabase-native vs general self-host.",
    description:
      "Compare ustats and umami for open-source website analytics, including databases, hosting model, and who each tool is built for.",
    summary:
      "umami is a popular open-source analytics app you can self-host on common stacks. ustats is purpose-built around Supabase Auth, Postgres, and Realtime for teams already on that platform.",
    whenUstats: [
      "Supabase is already your backend",
      "You want Auth + RLS + Realtime wired for analytics",
      "You prefer a Supabase-shaped operational model",
    ],
    whenCompetitor: [
      "You want a more general self-hosted analytics app",
      "Your database is not Supabase / Postgres-as-Supabase",
      "You already run umami happily",
    ],
    rows: [
      {
        feature: "Primary database",
        ustats: "Supabase Postgres",
        competitor: "Postgres or MySQL",
      },
      {
        feature: "Auth",
        ustats: "Supabase Auth",
        competitor: "Built-in umami auth",
      },
      {
        feature: "License",
        ustats: "MIT",
        competitor: "MIT",
      },
      {
        feature: "Realtime feed",
        ustats: "Supabase Realtime",
        competitor: "Supported in umami",
      },
      {
        feature: "Best fit",
        ustats: "Supabase-native teams",
        competitor: "General self-hosters",
      },
    ],
    related: [
      { title: "Supabase analytics", href: "/supabase-analytics" },
      { title: "Open-source web analytics", href: "/open-source-web-analytics" },
      { title: "ustats vs Matomo", href: "/compare/matomo" },
    ],
  },
  {
    slug: "matomo",
    competitor: "Matomo",
    title: "ustats vs Matomo",
    headline: "Lightweight owned analytics vs a full Matomo suite.",
    description:
      "Compare ustats and Matomo if you are choosing between a focused self-hosted tracker and a comprehensive analytics platform.",
    summary:
      "Matomo is a full-featured analytics platform (cloud or self-hosted) with deep reporting. ustats stays intentionally smaller: embed script, Supabase storage, essential dashboards.",
    whenUstats: [
      "You want a small surface area and fast setup",
      "Supabase is your system of record",
      "You do not need Matomo's full enterprise feature set",
    ],
    whenCompetitor: [
      "You need extensive reports, plugins, or tag manager workflows",
      "Your org already standardized on Matomo",
      "You want a long-standing analytics platform brand",
    ],
    rows: [
      {
        feature: "Scope",
        ustats: "Focused web analytics",
        competitor: "Full analytics platform",
      },
      {
        feature: "Setup time",
        ustats: "Usually same-day",
        competitor: "Heavier for full self-host",
      },
      {
        feature: "Data store",
        ustats: "Your Supabase",
        competitor: "Matomo Cloud or your server",
      },
      {
        feature: "Privacy defaults",
        ustats: "Cookie-free hashing",
        competitor: "Configurable; often cookie-based",
      },
      {
        feature: "Ops weight",
        ustats: "Next.js app + migrations",
        competitor: "Larger self-host footprint",
      },
    ],
    related: [
      { title: "Self-hosted analytics", href: "/self-hosted-analytics" },
      { title: "ustats vs Fathom", href: "/compare/fathom" },
      { title: "Documentation", href: "/docs" },
    ],
  },
  {
    slug: "fathom",
    competitor: "Fathom",
    title: "ustats vs Fathom",
    headline: "Owned Supabase analytics vs simple hosted privacy analytics.",
    description:
      "Compare ustats and Fathom Analytics for simple, privacy-minded website stats — hosted simplicity versus self-hosted ownership.",
    summary:
      "Fathom is a simple, privacy-focused hosted analytics product. ustats trades managed convenience for full data ownership on your Supabase project.",
    whenUstats: [
      "You refuse to send traffic data to another SaaS",
      "You want SQL access to every event",
      "You are comfortable deploying Next.js",
    ],
    whenCompetitor: [
      "You want the simplest possible hosted setup",
      "You prefer paying a product instead of operating one",
      "Ops time is more expensive than a SaaS bill",
    ],
    rows: [
      {
        feature: "Hosting",
        ustats: "Self-host",
        competitor: "Hosted SaaS",
      },
      {
        feature: "Privacy posture",
        ustats: "Cookie-free, data on your DB",
        competitor: "Privacy-focused hosted product",
      },
      {
        feature: "Raw data access",
        ustats: "Full SQL on your tables",
        competitor: "Product exports / APIs",
      },
      {
        feature: "Pricing",
        ustats: "Infra only",
        competitor: "Monthly SaaS plan",
      },
      {
        feature: "Maintenance",
        ustats: "You deploy updates",
        competitor: "Vendor maintains the service",
      },
    ],
    related: [
      { title: "ustats vs Plausible", href: "/compare/plausible" },
      { title: "Privacy-friendly analytics", href: "/privacy-friendly-analytics" },
      { title: "All alternatives", href: "/alternatives" },
    ],
  },
];

export function getTopic(slug: string) {
  return SEO_TOPICS.find((topic) => topic.slug === slug);
}

export function getComparison(slug: string) {
  return SEO_COMPARISONS.find((item) => item.slug === slug);
}

export function getAllPublicSeoPaths() {
  return [
    "/",
    "/docs",
    ...SEO_TOPICS.map((topic) => `/${topic.slug}`),
    "/compare",
    ...SEO_COMPARISONS.map((item) => `/compare/${item.slug}`),
    "/alternatives",
    "/roadmap",
    "/docs/installation",
    "/docs/configuration",
    "/docs/embed-script",
    "/docs/custom-events",
    "/docs/privacy",
    "/docs/deploying",
    "/docs/environment-variables",
    "/docs/script-api",
  ];
}
