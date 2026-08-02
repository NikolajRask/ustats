import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

import {
  formatSessionDuration,
  type BreakdownRow,
  type SiteStats,
} from "@/lib/stats";

export type ReportDocxInput = {
  siteName: string;
  siteDomain: string;
  rangeDays: number;
  rangeFrom: string;
  rangeTo: string;
  generatedAt: string;
  stats: SiteStats;
};

function rangeLabel(days: number): string {
  return `Last ${days} days`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });
}

function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return `${value}%`;
}

function heading(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]) {
  return new Paragraph({
    text,
    heading: level,
    spacing: { before: 240, after: 120 },
  });
}

function body(text: string) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22 })],
    spacing: { after: 80 },
  });
}

function metricLine(label: string, value: string) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 22 }),
      new TextRun({ text: value, size: 22 }),
    ],
    spacing: { after: 60 },
  });
}

function cell(text: string, opts?: { bold?: boolean; width?: number }) {
  return new TableCell({
    width: { size: opts?.width ?? 2500, type: WidthType.DXA },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: opts?.bold,
            size: 20,
          }),
        ],
      }),
    ],
  });
}

function breakdownTable(title: string, rows: BreakdownRow[]) {
  const children: (Paragraph | Table)[] = [
    heading(title, HeadingLevel.HEADING_2),
  ];

  if (rows.length === 0) {
    children.push(body("No data for this period."));
    return children;
  }

  const colWidths = [4500, 1500, 1500];
  children.push(
    new Table({
      width: { size: 7500, type: WidthType.DXA },
      columnWidths: colWidths,
      rows: [
        new TableRow({
          children: [
            cell("Name", { bold: true, width: colWidths[0] }),
            cell("Views", { bold: true, width: colWidths[1] }),
            cell("Visitors", { bold: true, width: colWidths[2] }),
          ],
        }),
        ...rows.map(
          (row) =>
            new TableRow({
              children: [
                cell(row.key, { width: colWidths[0] }),
                cell(String(row.count), { width: colWidths[1] }),
                cell(String(row.visitors), { width: colWidths[2] }),
              ],
            }),
        ),
      ],
    }),
  );

  return children;
}

export async function buildReportDocx(
  input: ReportDocxInput,
): Promise<Uint8Array> {
  const { siteName, siteDomain, rangeDays, stats } = input;
  const doc = new Document({
    creator: "ustats",
    title: `${siteName} — Performance report`,
    description: `Performance report for ${siteDomain}`,
    sections: [
      {
        children: [
          heading(`${siteName} — Performance report`, HeadingLevel.TITLE),
          body(`Domain: ${siteDomain}`),
          body(`Period: ${rangeLabel(rangeDays)}`),
          body(
            `From ${formatDate(input.rangeFrom)} to ${formatDate(input.rangeTo)} (UTC)`,
          ),
          body(`Generated: ${formatDate(input.generatedAt)} UTC`),
          heading("Summary", HeadingLevel.HEADING_1),
          metricLine("Pageviews", stats.pageviews.toLocaleString("en-US")),
          metricLine("Visitors", stats.visitors.toLocaleString("en-US")),
          metricLine("Bounce rate", formatPercent(stats.bounceRate)),
          metricLine(
            "Avg. session time",
            formatSessionDuration(stats.avgSessionSeconds),
          ),
          metricLine(
            "Custom events",
            stats.events.toLocaleString("en-US"),
          ),
          heading("Breakdowns", HeadingLevel.HEADING_1),
          ...breakdownTable("Top pages", stats.topPages.slice(0, 10)),
          ...breakdownTable("Top referrers", stats.topReferrers.slice(0, 10)),
          ...breakdownTable("Top countries", stats.topCountries.slice(0, 10)),
          ...breakdownTable("Top devices", stats.topDevices.slice(0, 10)),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
}

export function buildReportFileName(
  siteDomain: string,
  rangeDays: number,
  generatedAt: Date = new Date(),
): string {
  const safeDomain = siteDomain
    .replace(/^www\./i, "")
    .replace(/[^a-z0-9.-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "site";
  const date = generatedAt.toISOString().slice(0, 10);
  return `${safeDomain}-report-${rangeDays}d-${date}.docx`;
}

export function reportStoragePath(siteId: string, reportId: string): string {
  return `reports/${siteId}/${reportId}.docx`;
}

export const REPORTS_BUCKET = "ustats";

export function reportRangeLabel(days: number): string {
  return rangeLabel(days);
}
