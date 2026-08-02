import {
  formatDuration,
  type FunnelInsights,
} from "@/lib/funnels";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function FunnelInsightsCard({ insights }: { insights: FunnelInsights }) {
  const conversion = insights.conversionRate;
  const benchmarkNote =
    conversion == null
      ? "Not enough data yet."
      : conversion >= insights.benchmarkRate
        ? `Indie hackers average ${insights.benchmarkRate}% — you're doing well.`
        : `Indie hackers average ${insights.benchmarkRate}% — room to improve.`;

  const items = [
    {
      label: "Biggest drop-off",
      value: insights.biggestDropOff
        ? `${insights.biggestDropOff.stepName} (−${insights.biggestDropOff.dropOffPct.toFixed(1)}%)`
        : "—",
      note: insights.biggestDropOff
        ? "Consider simplifying this step."
        : "Drop-offs appear once visitors reach step 2.",
    },
    {
      label: "Conversion rate",
      value:
        conversion == null
          ? "—"
          : `${conversion}% from first to last step`,
      note: benchmarkNote,
    },
    {
      label: "Avg time in funnel",
      value: formatDuration(insights.avgFunnelMs),
      note: insights.slowestStep
        ? `${insights.slowestStep.stepName} is slowest at ${formatDuration(insights.slowestStep.avgMs)} avg.`
        : "Measured for visitors who complete the funnel.",
    },
  ];

  return (
    <Card className="bg-card/80">
      <CardHeader className="border-b border-border/60">
        <CardTitle className="font-display text-lg font-semibold tracking-tight">
          Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5 pt-5 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="space-y-1.5">
            <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {item.label}
            </p>
            <p className="text-sm font-medium text-foreground">{item.value}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {item.note}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
