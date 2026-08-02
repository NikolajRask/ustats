"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  Sankey,
  Tooltip,
  useChartWidth,
  type SankeyLinkProps,
  type SankeyNodeProps,
} from "recharts";

import type { FunnelStepResult } from "@/lib/funnels";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type NodeKind = "step" | "drop";
type LinkKind = "continue" | "drop";

type SankeyNodeData = {
  name: string;
  kind: NodeKind;
};

type SankeyLinkData = {
  source: number;
  target: number;
  value: number;
  kind: LinkKind;
};

type FunnelSankeyData = {
  nodes: SankeyNodeData[];
  links: SankeyLinkData[];
};

const STEP_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-4)",
  "var(--chart-3)",
  "var(--chart-5)",
] as const;

function buildFunnelSankeyData(
  steps: FunnelStepResult[],
): FunnelSankeyData | null {
  const start = steps[0]?.visitors ?? 0;
  if (steps.length < 2 || start <= 0) return null;

  const nodes: SankeyNodeData[] = [];
  const links: SankeyLinkData[] = [];
  const stepNodeIndex: Array<number | undefined> = [];

  for (let i = 0; i < steps.length; i++) {
    if (steps[i].visitors > 0) {
      stepNodeIndex[i] = nodes.length;
      nodes.push({ name: steps[i].step.name, kind: "step" });
    }
  }

  let dropIndex: number | null = null;
  const ensureDropNode = () => {
    if (dropIndex != null) return dropIndex;
    dropIndex = nodes.length;
    nodes.push({ name: "Dropped out", kind: "drop" });
    return dropIndex;
  };

  for (let i = 0; i < steps.length - 1; i++) {
    const current = steps[i].visitors;
    const sourceIdx = stepNodeIndex[i];
    if (current <= 0 || sourceIdx == null) continue;

    const next = steps[i + 1].visitors;
    const continued = Math.min(current, next);
    const dropped = Math.max(current - next, 0);

    if (continued > 0 && stepNodeIndex[i + 1] != null) {
      links.push({
        source: sourceIdx,
        target: stepNodeIndex[i + 1]!,
        value: continued,
        kind: "continue",
      });
    }

    if (dropped > 0) {
      links.push({
        source: sourceIdx,
        target: ensureDropNode(),
        value: dropped,
        kind: "drop",
      });
    }
  }

  if (links.length === 0) return null;
  return { nodes, links };
}

function truncateLabel(name: string, max = 28) {
  if (name.length <= max) return name;
  return `${name.slice(0, max - 1)}…`;
}

function FunnelSankeyNode(props: SankeyNodeProps) {
  const { x, y, width, height, payload } = props;
  const chartWidth = useChartWidth() ?? 960;
  const node = payload as unknown as SankeyNodeData & {
    depth?: number;
    value?: number;
    sourceNodes?: number[];
    targetNodes?: number[];
  };
  const kind = node.kind ?? "step";
  const depth = node.depth ?? 0;
  const value = node.value ?? 0;
  const isDrop = kind === "drop";
  const hasIncoming = (node.sourceNodes?.length ?? 0) > 0;
  const hasOutgoing = (node.targetNodes?.length ?? 0) > 0;
  const isIntermediate = hasIncoming && hasOutgoing;
  const label = truncateLabel(String(payload.name ?? ""), isIntermediate ? 22 : 28);
  const fill = isDrop
    ? "var(--destructive)"
    : STEP_COLORS[depth % STEP_COLORS.length];

  const nodeHeight = Math.max(height, 1);
  let labelX = x + width + 10;
  let labelY = y + nodeHeight / 2;
  let textAnchor: "start" | "end" | "middle" = "start";

  if (!hasIncoming) {
    labelX = x - 10;
    textAnchor = "end";
  } else if (isIntermediate) {
    labelX = x + width / 2;
    labelY = y - 10;
    textAnchor = "middle";
  }

  const labelFits =
    textAnchor === "middle"
      ? true
      : textAnchor === "end"
        ? labelX > 8
        : labelX < chartWidth - 8;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={nodeHeight}
        fill={fill}
        fillOpacity={isDrop ? 0.75 : 1}
        rx={4}
        ry={4}
      />
      {labelFits ? (
        <text
          x={labelX}
          y={labelY}
          textAnchor={textAnchor}
          dominantBaseline="middle"
          className="fill-foreground"
          style={{ fontSize: 12, fontWeight: 500 }}
        >
          {label}
          <tspan
            className="fill-muted-foreground"
            style={{ fontSize: 11, fontWeight: 400 }}
            dx={6}
          >
            {value.toLocaleString()}
          </tspan>
        </text>
      ) : null}
    </g>
  );
}

function FunnelSankeyLink(props: SankeyLinkProps) {
  const {
    sourceX,
    targetX,
    sourceY,
    targetY,
    sourceControlX,
    targetControlX,
    linkWidth,
    payload,
    index,
  } = props;
  const [hovered, setHovered] = useState(false);
  const link = payload as unknown as {
    kind?: LinkKind;
    source?: SankeyNodeData & { depth?: number };
    target?: SankeyNodeData;
  };
  const kind =
    link.kind ?? (link.target?.kind === "drop" ? "drop" : "continue");
  const isDrop = kind === "drop";
  const depth = link.source?.depth ?? 0;
  const stroke = isDrop
    ? "var(--destructive)"
    : STEP_COLORS[depth % STEP_COLORS.length];

  return (
    <path
      d={`M${sourceX},${sourceY}C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
      fill="none"
      stroke={stroke}
      strokeOpacity={hovered ? (isDrop ? 0.45 : 0.55) : isDrop ? 0.22 : 0.38}
      strokeWidth={Math.max(linkWidth, 1)}
      strokeLinecap="butt"
      className="transition-[stroke-opacity] duration-200"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-link-index={index}
    />
  );
}

function SankeyTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: Record<string, unknown>; value?: number }>;
}) {
  if (!active || !payload?.length) return null;

  const item = payload[0]?.payload ?? {};
  const source = item.source as { name?: string } | number | undefined;
  const target = item.target as { name?: string } | number | undefined;
  const value =
    typeof item.value === "number"
      ? item.value
      : typeof payload[0]?.value === "number"
        ? payload[0].value
        : null;

  const sourceName =
    typeof source === "object" && source?.name
      ? source.name
      : typeof item.name === "string"
        ? item.name
        : null;
  const targetName =
    typeof target === "object" && target?.name ? target.name : null;

  return (
    <div className="rounded-lg border border-border/70 bg-popover px-3 py-2 text-xs shadow-md">
      {sourceName && targetName ? (
        <p className="font-medium text-foreground">
          {sourceName}
          <span className="mx-1.5 text-muted-foreground">→</span>
          {targetName}
        </p>
      ) : sourceName ? (
        <p className="font-medium text-foreground">{sourceName}</p>
      ) : (
        <p className="font-medium text-foreground">Flow</p>
      )}
      {value != null ? (
        <p className="mt-1 tabular-nums text-muted-foreground">
          {value.toLocaleString()} visitors
        </p>
      ) : null}
    </div>
  );
}

export function FunnelSankeyCard({ steps }: { steps: FunnelStepResult[] }) {
  const data = useMemo(() => buildFunnelSankeyData(steps), [steps]);
  const height = Math.min(420, Math.max(240, (data?.nodes.length ?? 2) * 56 + 48));

  return (
    <Card className="overflow-hidden bg-card/80">
      <CardHeader className="border-b border-border/60">
        <CardTitle className="font-display text-lg font-semibold tracking-tight">
          Flow
        </CardTitle>
        <CardDescription>
          Where visitors continue through the funnel — and where they drop off
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-5">
        {!data ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Not enough funnel traffic to draw a flow chart yet.
          </p>
        ) : (
          <div className="w-full min-h-0" style={{ height }}>
            <ResponsiveContainer
              width="100%"
              height="100%"
              initialDimension={{ width: 640, height }}
            >
              <Sankey
                data={data}
                nodeWidth={14}
                nodePadding={32}
                linkCurvature={0.5}
                iterations={48}
                sort={false}
                verticalAlign="top"
                margin={{ top: 28, right: 140, bottom: 16, left: 140 }}
                link={(props) => <FunnelSankeyLink {...props} />}
                node={(props) => <FunnelSankeyNode {...props} />}
              >
                <Tooltip content={<SankeyTooltip />} />
              </Sankey>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
