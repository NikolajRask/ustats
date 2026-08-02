import type { ChatCompletionTool } from "openai/resources/chat/completions";
import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

import type { PendingToolCall } from "@/lib/ai/prompt";
import {
  normalizePath,
  validateFunnelSteps,
  type FunnelStepInput,
  type FunnelStepType,
} from "@/lib/funnels";
import type { Database } from "@/lib/supabase/database.types";

export const CREATE_FUNNEL_TOOL_NAME = "create_funnel";

export const ASSISTANT_TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: CREATE_FUNNEL_TOOL_NAME,
      description:
        "Create a conversion funnel on the currently selected site. Use when the user asks to create or set up a funnel with ordered path and/or custom event steps.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Human-readable funnel name, e.g. Signup funnel.",
          },
          steps: {
            type: "array",
            minItems: 2,
            maxItems: 12,
            description: "Ordered funnel steps from first to last.",
            items: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "Label for this step, e.g. Pricing page.",
                },
                step_type: {
                  type: "string",
                  enum: ["path", "event"],
                  description:
                    "path matches a pageview path; event matches a custom event name.",
                },
                match_value: {
                  type: "string",
                  description:
                    "For path: a URL path like /pricing. For event: a custom event name like signup.",
                },
              },
              required: ["name", "step_type", "match_value"],
              additionalProperties: false,
            },
          },
        },
        required: ["name", "steps"],
        additionalProperties: false,
      },
    },
  },
];

export type CreateFunnelArgs = {
  name: string;
  steps: FunnelStepInput[];
};

function parseSteps(raw: unknown): FunnelStepInput[] | { error: string } {
  if (!Array.isArray(raw)) {
    return { error: "Steps must be an array." };
  }

  const steps: FunnelStepInput[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return { error: "Each step must be an object." };
    }
    const record = item as Record<string, unknown>;
    const stepType = record.step_type;
    if (stepType !== "path" && stepType !== "event") {
      return { error: "Each step needs step_type 'path' or 'event'." };
    }
    if (typeof record.name !== "string" || !record.name.trim()) {
      return { error: "Each step needs a name." };
    }
    if (typeof record.match_value !== "string" || !record.match_value.trim()) {
      return { error: "Each step needs a match_value." };
    }

    const matchValue =
      stepType === "path"
        ? normalizePath(record.match_value)
        : record.match_value.trim().slice(0, 64);

    steps.push({
      name: record.name.trim().slice(0, 80),
      step_type: stepType as FunnelStepType,
      match_value: matchValue,
    });
  }

  const validationError = validateFunnelSteps(steps);
  if (validationError) {
    return { error: validationError };
  }

  return steps;
}

export function parseCreateFunnelArgs(
  raw: unknown,
): CreateFunnelArgs | { error: string } {
  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { error: "Invalid tool arguments JSON." };
    }
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { error: "Tool arguments must be an object." };
  }

  const record = parsed as Record<string, unknown>;
  if (typeof record.name !== "string" || !record.name.trim()) {
    return { error: "Funnel name is required." };
  }

  const steps = parseSteps(record.steps);
  if ("error" in steps) return steps;

  return {
    name: record.name.trim().slice(0, 80),
    steps,
  };
}

export function parseToolCallArguments(
  name: string,
  rawArguments: string,
): PendingToolCall["arguments"] | { error: string } {
  if (name !== CREATE_FUNNEL_TOOL_NAME) {
    return { error: `Unknown tool: ${name}` };
  }
  const parsed = parseCreateFunnelArgs(rawArguments);
  if ("error" in parsed) return parsed;
  return parsed as PendingToolCall["arguments"];
}

export async function executeCreateFunnel(options: {
  supabase: SupabaseClient<Database>;
  siteId: string | null;
  args: CreateFunnelArgs;
}): Promise<{ ok: true; summary: string } | { ok: false; error: string }> {
  const { supabase, siteId, args } = options;

  if (!siteId) {
    return {
      ok: false,
      error:
        "No active site is selected. Open a site in the dashboard, then try again.",
    };
  }

  const { data: site } = await supabase
    .from("sites")
    .select("id, name, domain")
    .eq("id", siteId)
    .maybeSingle();

  if (!site) {
    return {
      ok: false,
      error: "You do not have access to this site, or it was not found.",
    };
  }

  const funnelId = crypto.randomUUID();
  const { error: funnelError } = await supabase.from("funnels").insert({
    id: funnelId,
    site_id: siteId,
    name: args.name,
  });

  if (funnelError) {
    return { ok: false, error: funnelError.message };
  }

  const { error: stepsError } = await supabase.from("funnel_steps").insert(
    args.steps.map((step, position) => ({
      funnel_id: funnelId,
      position,
      name: step.name,
      step_type: step.step_type,
      match_value: step.match_value,
    })),
  );

  if (stepsError) {
    await supabase.from("funnels").delete().eq("id", funnelId);
    return { ok: false, error: stepsError.message };
  }

  revalidatePath(`/dashboard/sites/${siteId}/funnels`);

  const stepSummary = args.steps
    .map((step) => `${step.name} (${step.step_type}: ${step.match_value})`)
    .join(" → ");

  return {
    ok: true,
    summary: `Created funnel "${args.name}" on ${site.name} (${site.domain}) with id ${funnelId}. Steps: ${stepSummary}. View it at /dashboard/sites/${siteId}/funnels?funnel=${funnelId}.`,
  };
}

export async function executeAssistantToolCall(options: {
  supabase: SupabaseClient<Database>;
  siteId: string | null;
  toolCall: PendingToolCall;
}): Promise<string> {
  const { toolCall } = options;

  if (toolCall.name !== CREATE_FUNNEL_TOOL_NAME) {
    return JSON.stringify({ error: `Unknown tool: ${toolCall.name}` });
  }

  const args = parseCreateFunnelArgs(toolCall.arguments);
  if ("error" in args) {
    return JSON.stringify({ error: args.error });
  }

  const result = await executeCreateFunnel({
    supabase: options.supabase,
    siteId: options.siteId,
    args,
  });

  return JSON.stringify(result);
}
