"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  DownloadIcon,
  FileTextIcon,
  LoaderCircleIcon,
  Trash2Icon,
} from "lucide-react";

import {
  deleteReport,
  generateReport,
  getReportDownloadUrl,
} from "@/app/dashboard/sites/[id]/reports/actions";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { reportRangeLabel } from "@/lib/reports/docx";
import type { SiteReport } from "@/lib/reports";

function formatCreatedAt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function triggerDownload(url: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function ReportsDashboard({
  siteId,
  rangeDays,
  reports,
}: {
  siteId: string;
  rangeDays: number;
  reports: SiteReport[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runGenerate() {
    setError(null);
    setPendingId("generate");
    startTransition(async () => {
      const result = await generateReport(siteId, rangeDays);
      setPendingId(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      triggerDownload(result.downloadUrl);
      router.refresh();
    });
  }

  function runDownload(reportId: string) {
    setError(null);
    setPendingId(`download-${reportId}`);
    startTransition(async () => {
      const result = await getReportDownloadUrl(siteId, reportId);
      setPendingId(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      triggerDownload(result.downloadUrl);
    });
  }

  function runDelete(reportId: string) {
    setError(null);
    setPendingId(`delete-${reportId}`);
    startTransition(async () => {
      const result = await deleteReport(siteId, reportId);
      setPendingId(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const generating = isPending && pendingId === "generate";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Reports
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Export a DOCX performance summary for the selected range (
            {reportRangeLabel(rangeDays).toLowerCase()}).
          </p>
        </div>
        <Button
          type="button"
          onClick={runGenerate}
          disabled={isPending}
        >
          {generating ? (
            <LoaderCircleIcon className="animate-spin" />
          ) : (
            <FileTextIcon />
          )}
          Generate report
        </Button>
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {reports.length === 0 ? (
        <Empty className="border border-border/70 bg-card/60 py-14">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileTextIcon />
            </EmptyMedia>
            <EmptyTitle>No reports yet</EmptyTitle>
            <EmptyDescription>
              Generate a report for the current date range to download a Word
              document and keep it in your history.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              type="button"
              onClick={runGenerate}
              disabled={isPending}
            >
              {generating ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                <FileTextIcon />
              )}
              Generate report
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/70 bg-card/80">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border/60 bg-muted/30 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">File</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">
                  Range
                </th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">
                  Created
                </th>
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => {
                const downloading =
                  isPending && pendingId === `download-${report.id}`;
                const deleting =
                  isPending && pendingId === `delete-${report.id}`;

                return (
                  <tr
                    key={report.id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{report.file_name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground sm:hidden">
                        {reportRangeLabel(report.range_days)} ·{" "}
                        {formatCreatedAt(report.created_at)}
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      {reportRangeLabel(report.range_days)}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {formatCreatedAt(report.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Download ${report.file_name}`}
                          disabled={isPending}
                          onClick={() => runDownload(report.id)}
                        >
                          {downloading ? (
                            <LoaderCircleIcon className="animate-spin" />
                          ) : (
                            <DownloadIcon />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${report.file_name}`}
                          disabled={isPending}
                          onClick={() => runDelete(report.id)}
                        >
                          {deleting ? (
                            <LoaderCircleIcon className="animate-spin" />
                          ) : (
                            <Trash2Icon />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
