import type { ErrorStats, ErrorTimeseriesPoint } from "@/lib/errors";
import type { EventAliasMap } from "@/lib/event-aliases";
import type { Funnel, FunnelStats } from "@/lib/funnels";
import {
  rangeFromDays,
  type BreakdownRow,
  type EventLogRow,
  type SiteStats,
  type TimeseriesPoint,
} from "@/lib/stats";
import type { SiteUser, SiteUsersResult } from "@/lib/users";
import { visitorIdentity } from "@/lib/visitor-name";

export const PREVIEW_SITE_ID = "00000000-0000-4000-8000-000000000001";
export const PREVIEW_SITE = {
  id: PREVIEW_SITE_ID,
  name: "Acme Marketing",
  domain: "acme.example",
  public_key: "pk_preview_sample",
} as const;

export type PreviewLiveEvent = {
  id: number;
  name: string;
  path: string | null;
  country: string | null;
  device: string | null;
  created_at: string;
  visitor_hash: string;
};

function dayIso(daysAgo: number): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

function daysAgoIso(days: number, hour = 12): string {
  const d = new Date();
  d.setUTCHours(hour, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

function scale(base: number, days: number): number {
  return Math.max(1, Math.round((base * days) / 30));
}

function buildTimeseries(
  days: number,
  pageviewBase: number,
  visitorRatio = 0.62,
  eventRatio = 0.18,
): TimeseriesPoint[] {
  const points: TimeseriesPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const wave = 0.75 + 0.35 * Math.sin((days - i) / 4) + ((days - i) % 7) * 0.02;
    const pageviews = Math.round(pageviewBase * wave);
    const visitors = Math.round(pageviews * visitorRatio);
    const events = Math.round(pageviews * eventRatio);
    points.push({
      day: dayIso(i),
      pageviews,
      visitors,
      events,
      bounceRate: Math.round(38 + ((days - i) % 9) * 1.2),
      avgSessionSeconds: Math.round(95 + ((days - i) % 11) * 8),
    });
  }
  return points;
}

function buildEventTimeseries(days: number): TimeseriesPoint[] {
  return buildTimeseries(days, 42, 0.7, 1).map((p) => ({
    ...p,
    pageviews: 0,
    bounceRate: null,
    avgSessionSeconds: null,
  }));
}

function buildCustomEventSeries(days: number): {
  countsByDay: Record<string, Record<string, number>>;
  visitorsByDay: Record<string, Record<string, number>>;
} {
  const names = ["signup_click", "pricing_view", "newsletter_subscribe"];
  const countsByDay: Record<string, Record<string, number>> = {};
  const visitorsByDay: Record<string, Record<string, number>> = {};
  for (let i = days - 1; i >= 0; i--) {
    const day = dayIso(i);
    countsByDay[day] = {};
    visitorsByDay[day] = {};
    for (const name of names) {
      const count = 4 + ((days - i + name.length) % 12);
      countsByDay[day][name] = count;
      visitorsByDay[day][name] = Math.max(1, Math.round(count * 0.85));
    }
  }
  return { countsByDay, visitorsByDay };
}

const TOP_PAGES: BreakdownRow[] = [
  { key: "/", count: 4200, visitors: 2800 },
  { key: "/pricing", count: 2100, visitors: 1500 },
  { key: "/docs", count: 1800, visitors: 1200 },
  { key: "/blog/launch", count: 980, visitors: 740 },
  { key: "/signup", count: 720, visitors: 610 },
];

const TOP_REFERRERS: BreakdownRow[] = [
  { key: "google.com", count: 3100, visitors: 2400 },
  { key: "twitter.com", count: 890, visitors: 720 },
  { key: "news.ycombinator.com", count: 540, visitors: 480 },
  { key: "(direct)", count: 2200, visitors: 1700 },
  { key: "linkedin.com", count: 310, visitors: 260 },
];

const TOP_COUNTRIES: BreakdownRow[] = [
  { key: "US", count: 3800, visitors: 2900 },
  { key: "GB", count: 1200, visitors: 980 },
  { key: "DE", count: 980, visitors: 760 },
  { key: "DK", count: 720, visitors: 580 },
  { key: "CA", count: 540, visitors: 430 },
  { key: "NL", count: 410, visitors: 330 },
  { key: "FR", count: 380, visitors: 300 },
  { key: "AU", count: 290, visitors: 240 },
];

const REGIONS_BY_COUNTRY: Record<string, BreakdownRow[]> = {
  US: [
    { key: "California", count: 980, visitors: 740 },
    { key: "New York", count: 720, visitors: 560 },
    { key: "Texas", count: 410, visitors: 330 },
  ],
  GB: [
    { key: "England", count: 900, visitors: 720 },
    { key: "Scotland", count: 180, visitors: 150 },
  ],
  DE: [
    { key: "Berlin", count: 320, visitors: 260 },
    { key: "Bavaria", count: 280, visitors: 220 },
  ],
  DK: [
    { key: "Capital Region", count: 480, visitors: 390 },
    { key: "Central Jutland", count: 140, visitors: 110 },
  ],
};

const CITIES_BY_COUNTRY: Record<string, BreakdownRow[]> = {
  US: [
    { key: "San Francisco", count: 420, visitors: 340 },
    { key: "New York", count: 380, visitors: 300 },
    { key: "Austin", count: 180, visitors: 150 },
  ],
  GB: [
    { key: "London", count: 620, visitors: 510 },
    { key: "Manchester", count: 140, visitors: 110 },
  ],
  DE: [
    { key: "Berlin", count: 280, visitors: 230 },
    { key: "Munich", count: 160, visitors: 130 },
  ],
  DK: [
    { key: "Copenhagen", count: 420, visitors: 350 },
    { key: "Aarhus", count: 110, visitors: 90 },
  ],
};

function scaleRows(rows: BreakdownRow[], days: number): BreakdownRow[] {
  return rows.map((row) => ({
    key: row.key,
    count: scale(row.count, days),
    visitors: scale(row.visitors, days),
  }));
}

function scaleNested(
  map: Record<string, BreakdownRow[]>,
  days: number,
): Record<string, BreakdownRow[]> {
  const out: Record<string, BreakdownRow[]> = {};
  for (const [key, rows] of Object.entries(map)) {
    out[key] = scaleRows(rows, days);
  }
  return out;
}

export function getPreviewStats(days: number): SiteStats {
  const timeseries = buildTimeseries(days, 280);
  const eventTimeseries = buildEventTimeseries(days);
  const { countsByDay, visitorsByDay } = buildCustomEventSeries(days);
  const pageviews = timeseries.reduce((s, p) => s + p.pageviews, 0);
  const visitors = timeseries.reduce((s, p) => s + p.visitors, 0);
  const events = eventTimeseries.reduce((s, p) => s + p.events, 0);

  return {
    pageviews,
    visitors,
    events,
    eventVisitors: Math.round(events * 0.72),
    bounceRate: 42,
    avgSessionSeconds: 148,
    timeseries,
    eventTimeseries,
    customEventCountsByDay: countsByDay,
    customEventVisitorsByDay: visitorsByDay,
    topPages: scaleRows(TOP_PAGES, days),
    topReferrers: scaleRows(TOP_REFERRERS, days),
    topCountries: scaleRows(TOP_COUNTRIES, days),
    regionsByCountry: scaleNested(REGIONS_BY_COUNTRY, days),
    citiesByCountry: scaleNested(CITIES_BY_COUNTRY, days),
    topDevices: [
      { key: "desktop", count: scale(5200, days), visitors: scale(3900, days) },
      { key: "mobile", count: scale(3100, days), visitors: scale(2500, days) },
      { key: "tablet", count: scale(420, days), visitors: scale(340, days) },
    ],
    topBrowsers: [
      { key: "Chrome", count: scale(4800, days), visitors: scale(3600, days) },
      { key: "Safari", count: scale(2200, days), visitors: scale(1800, days) },
      { key: "Firefox", count: scale(980, days), visitors: scale(760, days) },
      { key: "Edge", count: scale(640, days), visitors: scale(510, days) },
    ],
    topSources: [
      { key: "google", count: scale(2400, days), visitors: scale(1900, days) },
      { key: "newsletter", count: scale(680, days), visitors: scale(540, days) },
      { key: "twitter", count: scale(420, days), visitors: scale(340, days) },
    ],
    topMediums: [
      { key: "organic", count: scale(2800, days), visitors: scale(2200, days) },
      { key: "email", count: scale(680, days), visitors: scale(540, days) },
      { key: "social", count: scale(520, days), visitors: scale(410, days) },
    ],
    topCampaigns: [
      { key: "spring_launch", count: scale(540, days), visitors: scale(420, days) },
      { key: "docs_refresh", count: scale(310, days), visitors: scale(260, days) },
    ],
    customEvents: [
      { key: "signup_click", count: scale(420, days), visitors: scale(380, days) },
      { key: "pricing_view", count: scale(980, days), visitors: scale(760, days) },
      {
        key: "newsletter_subscribe",
        count: scale(210, days),
        visitors: scale(200, days),
      },
    ],
  };
}

export const PREVIEW_EVENT_ALIASES: EventAliasMap = {
  signup_click: {
    title: "Signup CTA",
    description: "Clicked the primary signup button on pricing",
  },
  pricing_view: {
    title: "Pricing page view",
    description: "Visited the pricing page",
  },
  newsletter_subscribe: {
    title: "Newsletter signup",
    description: "Submitted the newsletter form",
  },
};

const FUNNEL_ID = "00000000-0000-4000-8000-0000000000f1";

export function getPreviewFunnels(): Funnel[] {
  return [
    {
      id: FUNNEL_ID,
      site_id: PREVIEW_SITE_ID,
      name: "Signup funnel",
      created_at: daysAgoIso(60),
      updated_at: daysAgoIso(5),
      steps: [
        {
          id: "00000000-0000-4000-8000-0000000000s1",
          funnel_id: FUNNEL_ID,
          position: 0,
          name: "Landing",
          step_type: "path",
          match_value: "/",
        },
        {
          id: "00000000-0000-4000-8000-0000000000s2",
          funnel_id: FUNNEL_ID,
          position: 1,
          name: "Pricing",
          step_type: "path",
          match_value: "/pricing",
        },
        {
          id: "00000000-0000-4000-8000-0000000000s3",
          funnel_id: FUNNEL_ID,
          position: 2,
          name: "Signup click",
          step_type: "event",
          match_value: "signup_click",
        },
        {
          id: "00000000-0000-4000-8000-0000000000s4",
          funnel_id: FUNNEL_ID,
          position: 3,
          name: "Account created",
          step_type: "path",
          match_value: "/welcome",
        },
      ],
    },
  ];
}

export function getPreviewFunnelStats(): FunnelStats {
  const funnels = getPreviewFunnels();
  const steps = funnels[0]!.steps;
  const visitors = [2400, 1480, 620, 310];
  return {
    steps: steps.map((step, i) => {
      const v = visitors[i]!;
      const prev = i === 0 ? null : visitors[i - 1]!;
      return {
        step,
        visitors: v,
        pctOfStart: Math.round((v / visitors[0]!) * 1000) / 10,
        dropOffPct:
          prev == null ? null : Math.round(((prev - v) / prev) * 1000) / 10,
        avgMsFromPrev: i === 0 ? null : [null, 42000, 68000, 95000][i]!,
      };
    }),
    insights: {
      biggestDropOff: {
        stepName: "Signup click",
        dropOffPct: 58.1,
      },
      conversionRate: 12.9,
      benchmarkRate: 22,
      avgFunnelMs: 205_000,
      slowestStep: {
        stepName: "Account created",
        avgMs: 95_000,
      },
    },
  };
}

function makeUser(
  hash: string,
  overrides: Partial<SiteUser> & {
    first_seen: string;
    last_seen: string;
  },
): SiteUser {
  return {
    visitor_hash: hash,
    identity: visitorIdentity(hash),
    pageviews: 12,
    events: 3,
    sessions: 2,
    country: "US",
    device: "desktop",
    browser: "Chrome",
    os: "macOS",
    entry_path: "/",
    exit_path: "/pricing",
    journey: [
      {
        id: 1,
        name: "pageview",
        path: "/",
        referrer_host: "google.com",
        session_hash: `${hash}-s1`,
        created_at: overrides.first_seen,
      },
      {
        id: 2,
        name: "pageview",
        path: "/pricing",
        referrer_host: null,
        session_hash: `${hash}-s1`,
        created_at: overrides.last_seen,
      },
    ],
    ...overrides,
  };
}

export function getPreviewUsers(): SiteUsersResult {
  const users: SiteUser[] = [
    makeUser("preview-visitor-alpha", {
      first_seen: daysAgoIso(12),
      last_seen: minutesAgo(2),
      pageviews: 28,
      events: 6,
      sessions: 5,
      country: "DK",
      device: "desktop",
      browser: "Safari",
      os: "macOS",
      entry_path: "/",
      exit_path: "/signup",
    }),
    makeUser("preview-visitor-bravo", {
      first_seen: daysAgoIso(8),
      last_seen: minutesAgo(8),
      pageviews: 14,
      events: 2,
      sessions: 3,
      country: "US",
      device: "mobile",
      browser: "Chrome",
      os: "iOS",
      entry_path: "/blog/launch",
      exit_path: "/pricing",
    }),
    makeUser("preview-visitor-charlie", {
      first_seen: daysAgoIso(20),
      last_seen: hoursAgo(3),
      pageviews: 41,
      events: 9,
      sessions: 7,
      country: "GB",
      device: "desktop",
      browser: "Firefox",
      os: "Windows",
      entry_path: "/",
      exit_path: "/docs",
    }),
    makeUser("preview-visitor-delta", {
      first_seen: daysAgoIso(4),
      last_seen: hoursAgo(18),
      pageviews: 7,
      events: 1,
      sessions: 1,
      country: "DE",
      device: "tablet",
      browser: "Safari",
      os: "iPadOS",
      entry_path: "/pricing",
      exit_path: "/pricing",
    }),
    makeUser("preview-visitor-echo", {
      first_seen: daysAgoIso(15),
      last_seen: daysAgoIso(1, 16),
      pageviews: 19,
      events: 4,
      sessions: 4,
      country: "CA",
      device: "desktop",
      browser: "Edge",
      os: "Windows",
      entry_path: "/",
      exit_path: "/newsletter",
    }),
  ];

  return {
    users,
    totalUsers: 1842,
    totalSessions: 2610,
    avgEventsPerUser: 4.2,
  };
}

function buildErrorTimeseries(days: number): ErrorTimeseriesPoint[] {
  const points: ErrorTimeseriesPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    points.push({
      day: dayIso(i),
      pageviews: 0,
      visitors: 0,
      events: 2 + ((days - i) % 5),
      bounceRate: null,
      avgSessionSeconds: null,
    });
  }
  return points;
}

export function getPreviewErrorStats(days: number): ErrorStats {
  const timeseries = buildErrorTimeseries(days);
  const totalEvents = timeseries.reduce((s, p) => s + p.events, 0);
  return {
    totalEvents,
    unresolvedGroups: 3,
    newGroups: 1,
    affectedVisitors: 48,
    affectedUserPercent: 2.6,
    timeseries,
    hasMore: false,
    groups: [
      {
        id: "00000000-0000-4000-8000-0000000000e1",
        fingerprint: "typeerror-cannot-read-map",
        type: "TypeError",
        message: "Cannot read properties of undefined (reading 'map')",
        culprit: "PricingTable.tsx",
        level: "error",
        status: "unresolved",
        first_seen: daysAgoIso(18),
        last_seen: hoursAgo(2),
        event_count: 86,
        range_count: scale(42, days),
        affected_visitors: 28,
      },
      {
        id: "00000000-0000-4000-8000-0000000000e2",
        fingerprint: "chunkloaderror-main",
        type: "ChunkLoadError",
        message: "Loading chunk 472 failed",
        culprit: "app-router",
        level: "error",
        status: "unresolved",
        first_seen: daysAgoIso(6),
        last_seen: hoursAgo(9),
        event_count: 31,
        range_count: scale(18, days),
        affected_visitors: 14,
      },
      {
        id: "00000000-0000-4000-8000-0000000000e3",
        fingerprint: "networkerror-api-checkout",
        type: "NetworkError",
        message: "Failed to fetch /api/checkout",
        culprit: "checkout.ts",
        level: "warning",
        status: "resolved",
        first_seen: daysAgoIso(22),
        last_seen: daysAgoIso(3),
        event_count: 54,
        range_count: scale(8, days),
        affected_visitors: 6,
      },
    ],
  };
}

export function getPreviewLogs(days: number): EventLogRow[] {
  void days;
  const rows: Omit<EventLogRow, "id">[] = [
    {
      name: "pageview",
      path: "/",
      url: "https://acme.example/",
      referrer: "https://www.google.com/",
      referrer_host: "google.com",
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_term: null,
      utm_content: null,
      country: "DK",
      device: "desktop",
      browser: "Safari",
      os: "macOS",
      visitor_hash: "preview-visitor-alpha",
      session_hash: "preview-session-1",
      props: {},
      created_at: minutesAgo(1),
    },
    {
      name: "pricing_view",
      path: "/pricing",
      url: "https://acme.example/pricing",
      referrer: "https://acme.example/",
      referrer_host: "acme.example",
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_term: null,
      utm_content: null,
      country: "US",
      device: "mobile",
      browser: "Chrome",
      os: "iOS",
      visitor_hash: "preview-visitor-bravo",
      session_hash: "preview-session-2",
      props: {},
      created_at: minutesAgo(3),
    },
    {
      name: "pageview",
      path: "/docs",
      url: "https://acme.example/docs",
      referrer: "https://news.ycombinator.com/",
      referrer_host: "news.ycombinator.com",
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_term: null,
      utm_content: null,
      country: "GB",
      device: "desktop",
      browser: "Firefox",
      os: "Windows",
      visitor_hash: "preview-visitor-charlie",
      session_hash: "preview-session-3",
      props: {},
      created_at: minutesAgo(6),
    },
    {
      name: "signup_click",
      path: "/pricing",
      url: "https://acme.example/pricing",
      referrer: null,
      referrer_host: null,
      utm_source: "newsletter",
      utm_medium: "email",
      utm_campaign: "spring_launch",
      utm_term: null,
      utm_content: null,
      country: "DE",
      device: "desktop",
      browser: "Chrome",
      os: "Linux",
      visitor_hash: "preview-visitor-delta",
      session_hash: "preview-session-4",
      props: { plan: "pro" },
      created_at: minutesAgo(12),
    },
    {
      name: "pageview",
      path: "/blog/launch",
      url: "https://acme.example/blog/launch",
      referrer: "https://twitter.com/",
      referrer_host: "twitter.com",
      utm_source: "twitter",
      utm_medium: "social",
      utm_campaign: null,
      utm_term: null,
      utm_content: null,
      country: "CA",
      device: "desktop",
      browser: "Edge",
      os: "Windows",
      visitor_hash: "preview-visitor-echo",
      session_hash: "preview-session-5",
      props: {},
      created_at: minutesAgo(18),
    },
    {
      name: "newsletter_subscribe",
      path: "/",
      url: "https://acme.example/",
      referrer: null,
      referrer_host: null,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_term: null,
      utm_content: null,
      country: "NL",
      device: "mobile",
      browser: "Safari",
      os: "iOS",
      visitor_hash: "preview-visitor-foxtrot",
      session_hash: "preview-session-6",
      props: {},
      created_at: minutesAgo(25),
    },
    {
      name: "pageview",
      path: "/signup",
      url: "https://acme.example/signup",
      referrer: "https://acme.example/pricing",
      referrer_host: "acme.example",
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_term: null,
      utm_content: null,
      country: "US",
      device: "desktop",
      browser: "Chrome",
      os: "macOS",
      visitor_hash: "preview-visitor-alpha",
      session_hash: "preview-session-1b",
      props: {},
      created_at: minutesAgo(32),
    },
    {
      name: "pageview",
      path: "/pricing",
      url: "https://acme.example/pricing",
      referrer: "https://www.google.com/",
      referrer_host: "google.com",
      utm_source: "google",
      utm_medium: "organic",
      utm_campaign: null,
      utm_term: null,
      utm_content: null,
      country: "AU",
      device: "desktop",
      browser: "Chrome",
      os: "Windows",
      visitor_hash: "preview-visitor-golf",
      session_hash: "preview-session-7",
      props: {},
      created_at: minutesAgo(41),
    },
  ];

  return rows.map((row, i) => ({ ...row, id: 10_000 + i }));
}

export function getPreviewLiveEvents(): PreviewLiveEvent[] {
  return [
    {
      id: 9001,
      name: "pageview",
      path: "/",
      country: "DK",
      device: "desktop",
      created_at: minutesAgo(0.5),
      visitor_hash: "preview-visitor-alpha",
    },
    {
      id: 9002,
      name: "pricing_view",
      path: "/pricing",
      country: "US",
      device: "mobile",
      created_at: minutesAgo(1.2),
      visitor_hash: "preview-visitor-bravo",
    },
    {
      id: 9003,
      name: "pageview",
      path: "/docs",
      country: "GB",
      device: "desktop",
      created_at: minutesAgo(2.1),
      visitor_hash: "preview-visitor-charlie",
    },
    {
      id: 9004,
      name: "signup_click",
      path: "/pricing",
      country: "DE",
      device: "desktop",
      created_at: minutesAgo(3.4),
      visitor_hash: "preview-visitor-delta",
    },
    {
      id: 9005,
      name: "pageview",
      path: "/blog/launch",
      country: "CA",
      device: "desktop",
      created_at: minutesAgo(4.0),
      visitor_hash: "preview-visitor-echo",
    },
  ];
}

export function getPreviewDateRange(days: number) {
  return rangeFromDays(days);
}
