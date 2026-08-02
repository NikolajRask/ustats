"use client";

import { useState } from "react";

/** Bytes per event including indexes — typical pageview mix */
const BYTES_PER_EVENT = 650;
const FREE_DB_GB = 0.5;
const PRO_INCLUDED_GB = 8;
const PRO_BASE_USD = 25;
const DISK_OVERAGE_PER_GB = 0.125;

const EVENT_PRESETS = [
  { label: "10k", value: 10_000 },
  { label: "100k", value: 100_000 },
  { label: "1M", value: 1_000_000 },
  { label: "10M", value: 10_000_000 },
] as const;

const RETENTION_PRESETS = [
  { label: "1 mo", value: 1 },
  { label: "3 mo", value: 3 },
  { label: "12 mo", value: 12 },
  { label: "24 mo", value: 24 },
] as const;

/** Rough Plausible-style SaaS ladder for comparison (USD / month). */
function saasAnalyticsCost(monthlyEvents: number): number {
  const tiers: [number, number][] = [
    [10_000, 9],
    [100_000, 19],
    [200_000, 29],
    [500_000, 49],
    [1_000_000, 69],
    [2_000_000, 99],
    [5_000_000, 149],
    [10_000_000, 249],
    [20_000_000, 399],
    [50_000_000, 699],
  ];
  for (const [limit, price] of tiers) {
    if (monthlyEvents <= limit) return price;
  }
  return Math.ceil(monthlyEvents / 50_000_000) * 699;
}

function formatCompact(n: number, suffix: string): string {
  const rounded = Math.round(n * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}${suffix}`;
}

function formatEvents(n: number): string {
  if (n >= 1_000_000_000) return formatCompact(n / 1_000_000_000, "B");
  if (n >= 1_000_000) return formatCompact(n / 1_000_000, "M");
  if (n >= 1_000) return formatCompact(n / 1_000, "k");
  return String(n);
}

function formatBytes(gb: number): string {
  if (gb < 0.01) return `${Math.round(gb * 1024 * 1024)} KB`;
  if (gb < 1) return `${Math.round(gb * 1024)} MB`;
  if (gb < 10) return `${gb.toFixed(1)} GB`;
  return `${Math.round(gb)} GB`;
}

function formatUsd(n: number): string {
  if (n === 0) return "$0";
  if (Number.isInteger(n)) return `$${n}`;
  return `$${n.toFixed(2)}`;
}

type PlanEstimate = {
  plan: "Free" | "Pro";
  monthlyUsd: number;
  dbGb: number;
  storedEvents: number;
  note: string;
};

function estimateCost(
  monthlyEvents: number,
  retentionMonths: number,
): PlanEstimate {
  const storedEvents = monthlyEvents * retentionMonths;
  const dbGb = (storedEvents * BYTES_PER_EVENT) / 1024 ** 3;

  if (dbGb <= FREE_DB_GB) {
    return {
      plan: "Free",
      monthlyUsd: 0,
      dbGb,
      storedEvents,
      note: "Fits on Supabase Free (0.5 GB). No card required.",
    };
  }

  const overageGb = Math.max(0, dbGb - PRO_INCLUDED_GB);
  const monthlyUsd = PRO_BASE_USD + overageGb * DISK_OVERAGE_PER_GB;

  return {
    plan: "Pro",
    monthlyUsd,
    dbGb,
    storedEvents,
    note:
      overageGb > 0
        ? `Pro includes 8 GB; ~${formatBytes(overageGb)} disk overage at $0.125/GB.`
        : "Pro includes 8 GB disk — enough for this retention window.",
  };
}

/** Map linear 0–100 slider to log-ish event counts from 1k → 50M */
function eventsFromSlider(t: number): number {
  const min = Math.log10(1_000);
  const max = Math.log10(50_000_000);
  const v = 10 ** (min + (t / 100) * (max - min));
  if (v < 10_000) return Math.round(v / 500) * 500;
  if (v < 100_000) return Math.round(v / 5_000) * 5_000;
  if (v < 1_000_000) return Math.round(v / 50_000) * 50_000;
  if (v < 10_000_000) return Math.round(v / 500_000) * 500_000;
  return Math.round(v / 1_000_000) * 1_000_000;
}

function sliderFromEvents(events: number): number {
  const min = Math.log10(1_000);
  const max = Math.log10(50_000_000);
  return ((Math.log10(events) - min) / (max - min)) * 100;
}

export function PricingCalculator() {
  const [monthlyEvents, setMonthlyEvents] = useState(100_000);
  const [retentionMonths, setRetentionMonths] = useState(12);

  const estimate = estimateCost(monthlyEvents, retentionMonths);
  const saas = saasAnalyticsCost(monthlyEvents);
  const savings = Math.max(0, saas - estimate.monthlyUsd);
  const yearlySavings = savings * 12;

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:items-start">
      <div>
        <h2 className="landing-brand text-3xl font-semibold tracking-tight sm:text-4xl">
          What it actually costs
        </h2>
        <p className="mt-4 max-w-md text-(--land-muted) leading-relaxed">
          ustats is free and open source. You only pay for the Supabase project
          that stores your events — estimate it from pageviews and how long you
          keep them.
        </p>

        <div className="mt-10 space-y-10">
          <div>
            <div className="flex items-baseline justify-between gap-4">
              <label
                htmlFor="events-slider"
                className="landing-brand text-sm font-semibold tracking-tight"
              >
                Monthly events
              </label>
              <span className="font-mono text-sm tabular-nums text-(--land-accent)">
                {formatEvents(monthlyEvents)}
              </span>
            </div>
            <input
              id="events-slider"
              type="range"
              min={0}
              max={100}
              step={1}
              value={sliderFromEvents(monthlyEvents)}
              onChange={(e) =>
                setMonthlyEvents(eventsFromSlider(Number(e.target.value)))
              }
              className="landing-range mt-4 w-full"
              aria-valuetext={`${formatEvents(monthlyEvents)} events per month`}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {EVENT_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setMonthlyEvents(preset.value)}
                  className={`rounded-sm border px-2.5 py-1 text-xs font-medium transition-colors ${
                    monthlyEvents === preset.value
                      ? "border-(--land-accent) bg-(--land-accent)/10 text-(--land-fg)"
                      : "border-(--land-fg)/12 text-(--land-muted) hover:border-(--land-fg)/25 hover:text-(--land-fg)"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-4">
              <label
                htmlFor="retention-slider"
                className="landing-brand text-sm font-semibold tracking-tight"
              >
                Retention
              </label>
              <span className="font-mono text-sm tabular-nums text-(--land-accent)">
                {retentionMonths} mo
              </span>
            </div>
            <input
              id="retention-slider"
              type="range"
              min={1}
              max={24}
              step={1}
              value={retentionMonths}
              onChange={(e) => setRetentionMonths(Number(e.target.value))}
              className="landing-range mt-4 w-full"
              aria-valuetext={`${retentionMonths} months retention`}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {RETENTION_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setRetentionMonths(preset.value)}
                  className={`rounded-sm border px-2.5 py-1 text-xs font-medium transition-colors ${
                    retentionMonths === preset.value
                      ? "border-(--land-accent) bg-(--land-accent)/10 text-(--land-fg)"
                      : "border-(--land-fg)/12 text-(--land-muted) hover:border-(--land-fg)/25 hover:text-(--land-fg)"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-y border-(--land-fg)/10 py-8 sm:py-10">
        <p className="font-mono text-xs tracking-[0.2em] text-(--land-muted) uppercase">
          Estimated monthly
        </p>
        <p className="landing-brand mt-3 text-[clamp(3rem,8vw,4.5rem)] leading-none font-extrabold tracking-[-0.03em] tabular-nums">
          {formatUsd(estimate.monthlyUsd)}
          <span className="ml-1 text-lg font-semibold tracking-normal text-(--land-muted)">
            /mo
          </span>
        </p>
        <p className="mt-3 text-sm text-(--land-muted) leading-relaxed">
          Supabase {estimate.plan}
          {estimate.plan === "Pro" ? ` · from $${PRO_BASE_USD}/mo` : ""}
        </p>

        <dl className="mt-10 divide-y divide-(--land-fg)/10 border-y border-(--land-fg)/10">
          <div className="grid gap-1 py-4 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-6">
            <dt className="text-sm text-(--land-muted)">Stored events</dt>
            <dd className="landing-brand font-semibold tabular-nums tracking-tight">
              {formatEvents(estimate.storedEvents)}
            </dd>
          </div>
          <div className="grid gap-1 py-4 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-6">
            <dt className="text-sm text-(--land-muted)">Database size</dt>
            <dd className="landing-brand font-semibold tabular-nums tracking-tight">
              ~{formatBytes(estimate.dbGb)}
            </dd>
          </div>
          <div className="grid gap-1 py-4 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-6">
            <dt className="text-sm text-(--land-muted)">
              Typical SaaS analytics
            </dt>
            <dd className="landing-brand font-semibold tabular-nums tracking-tight text-(--land-muted)">
              ~{formatUsd(saas)}/mo
            </dd>
          </div>
          {savings > 0 ? (
            <div className="grid gap-1 py-4 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-6">
              <dt className="text-sm text-(--land-muted)">You save vs SaaS</dt>
              <dd className="landing-brand font-semibold tabular-nums tracking-tight text-(--land-accent)">
                ~{formatUsd(savings)}/mo
                <span className="ml-2 text-sm font-medium text-(--land-muted)">
                  (~{formatUsd(yearlySavings)}/yr)
                </span>
              </dd>
            </div>
          ) : null}
        </dl>

        <p className="mt-6 text-sm leading-relaxed text-(--land-muted)">
          {estimate.note} Assumes ~{BYTES_PER_EVENT}&nbsp;B per event with
          indexes. Hosting the Next.js app (e.g. Vercel hobby) is separate and
          often free at this scale.
        </p>
      </div>
    </div>
  );
}
