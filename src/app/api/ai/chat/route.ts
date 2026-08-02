import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionToolMessageParam,
} from "openai/resources/chat/completions";
import { NextResponse } from "next/server";

import {
  buildAssistantContext,
  isSiteId,
} from "@/lib/ai/context";
import {
  AI_CHAT_MODEL,
  AI_SYSTEM_PROMPT,
  MAX_CHAT_MESSAGES,
  MAX_MESSAGE_CHARS,
  MAX_TOOL_ROUNDS,
  type ChatRequestMessage,
  type PendingToolCall,
} from "@/lib/ai/prompt";
import {
  ASSISTANT_TOOLS,
  CREATE_FUNNEL_TOOL_NAME,
  executeAssistantToolCall,
  parseToolCallArguments,
} from "@/lib/ai/tools";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ChatBody = {
  messages?: unknown;
  siteId?: unknown;
  askBeforeFunnels?: unknown;
  executeToolCalls?: unknown;
};

function parseMessages(value: unknown): ChatRequestMessage[] | null {
  if (!Array.isArray(value)) return null;

  const messages: ChatRequestMessage[] = [];
  for (const item of value.slice(-MAX_CHAT_MESSAGES)) {
    if (!item || typeof item !== "object") return null;
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string") return null;
    const trimmed = content.trim();
    if (!trimmed || trimmed.length > MAX_MESSAGE_CHARS) return null;
    messages.push({ role, content: trimmed });
  }

  if (messages.length === 0) return null;
  return messages;
}

function parsePendingToolCalls(value: unknown): PendingToolCall[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;

  const calls: PendingToolCall[] = [];
  for (const item of value.slice(0, 3)) {
    if (!item || typeof item !== "object") return null;
    const id = (item as { id?: unknown }).id;
    const name = (item as { name?: unknown }).name;
    const args = (item as { arguments?: unknown }).arguments;
    if (typeof id !== "string" || !id.trim()) return null;
    if (typeof name !== "string" || name !== CREATE_FUNNEL_TOOL_NAME) {
      return null;
    }
    if (!args || typeof args !== "object" || Array.isArray(args)) return null;
    const parsed = parseToolCallArguments(name, JSON.stringify(args));
    if ("error" in parsed) return null;
    calls.push({
      id: id.trim().slice(0, 128),
      name,
      arguments: parsed,
    });
  }

  return calls.length > 0 ? calls : null;
}

function toOpenAiMessages(
  messages: ChatRequestMessage[],
  context: string,
  extras: ChatCompletionMessageParam[] = [],
): ChatCompletionMessageParam[] {
  return [
    { role: "system", content: AI_SYSTEM_PROMPT },
    {
      role: "system",
      content: `Current analytics snapshot:\n\n${context}`,
    },
    ...messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    ...extras,
  ];
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "OPENAI_API_KEY is not configured. Add it to your .env and restart the server.",
      },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ChatBody;
  try {
    body = (await request.json()) as ChatBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const messages = parseMessages(body.messages);
  if (!messages) {
    return NextResponse.json(
      { error: "Invalid messages. Send a non-empty chat history." },
      { status: 400 },
    );
  }

  const siteId =
    typeof body.siteId === "string" && isSiteId(body.siteId)
      ? body.siteId
      : null;
  const askBeforeFunnels = body.askBeforeFunnels !== false;
  const approvedCalls = parsePendingToolCalls(body.executeToolCalls);

  if (!approvedCalls && messages[messages.length - 1]?.role !== "user") {
    return NextResponse.json(
      { error: "Chat history must end with a user message." },
      { status: 400 },
    );
  }

  let context: string;
  try {
    context = await buildAssistantContext(supabase, siteId);
  } catch (error) {
    console.error("ai context failed", error);
    return NextResponse.json(
      { error: "Failed to load analytics context." },
      { status: 500 },
    );
  }

  const openai = new OpenAI({ apiKey });
  const extras: ChatCompletionMessageParam[] = [];

  if (approvedCalls) {
    const toolResults: ChatCompletionToolMessageParam[] = [];
    for (const call of approvedCalls) {
      const content = await executeAssistantToolCall({
        supabase,
        siteId,
        toolCall: call,
      });
      toolResults.push({
        role: "tool",
        tool_call_id: call.id,
        content,
      });
    }

    extras.push(
      {
        role: "assistant",
        content: null,
        tool_calls: approvedCalls.map((call) => ({
          id: call.id,
          type: "function" as const,
          function: {
            name: call.name,
            arguments: JSON.stringify(call.arguments),
          },
        })),
      },
      ...toolResults,
    );
  }

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
      const completion = await openai.chat.completions.create({
        model: AI_CHAT_MODEL,
        reasoning_effort: "none",
        tools: ASSISTANT_TOOLS,
        tool_choice: "auto",
        messages: toOpenAiMessages(messages, context, extras),
      });

      const choice = completion.choices[0]?.message;
      if (!choice) {
        return NextResponse.json(
          { error: "The model returned an empty reply." },
          { status: 502 },
        );
      }

      const toolCalls = choice.tool_calls ?? [];
      if (toolCalls.length === 0) {
        const reply = choice.content?.trim();
        if (!reply) {
          return NextResponse.json(
            { error: "The model returned an empty reply." },
            { status: 502 },
          );
        }

        return NextResponse.json({
          message: {
            role: "assistant" as const,
            content: reply,
          },
          model: AI_CHAT_MODEL,
        });
      }

      const pending: PendingToolCall[] = [];
      for (const call of toolCalls) {
        if (call.type !== "function") continue;
        const parsed = parseToolCallArguments(
          call.function.name,
          call.function.arguments,
        );
        if ("error" in parsed) {
          extras.push(
            {
              role: "assistant",
              content: choice.content,
              tool_calls: toolCalls,
            },
            {
              role: "tool",
              tool_call_id: call.id,
              content: JSON.stringify({ error: parsed.error }),
            },
          );
          continue;
        }
        pending.push({
          id: call.id,
          name: call.function.name,
          arguments: parsed,
        });
      }

      if (pending.length === 0) {
        continue;
      }

      if (askBeforeFunnels) {
        return NextResponse.json({
          message: {
            role: "assistant" as const,
            content:
              choice.content?.trim() ||
              "I can create that funnel if you approve.",
          },
          pendingToolCalls: pending,
          model: AI_CHAT_MODEL,
        });
      }

      const toolResults: ChatCompletionToolMessageParam[] = [];
      for (const call of pending) {
        const content = await executeAssistantToolCall({
          supabase,
          siteId,
          toolCall: call,
        });
        toolResults.push({
          role: "tool",
          tool_call_id: call.id,
          content,
        });
      }

      extras.push(
        {
          role: "assistant",
          content: choice.content,
          tool_calls: toolCalls,
        },
        ...toolResults,
      );
    }

    return NextResponse.json(
      { error: "Too many tool rounds. Try a simpler request." },
      { status: 502 },
    );
  } catch (error) {
    console.error("ai chat failed", error);
    const message =
      error instanceof Error ? error.message : "OpenAI request failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
