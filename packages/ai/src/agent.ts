import Anthropic from "@anthropic-ai/sdk";
import { connectDB, Segment, Trip } from "@wanderly/db";
import { Schema, model, models } from "mongoose";
import { tools, type ToolName } from "./tools";
import { SYSTEM_PROMPT } from "./system-prompt";
import type { SearchClient } from "@wanderly/sdk";

// ── Agent session model (tracks cost + tool calls per session) ───────────────

const AgentSessionSchema = new Schema(
  {
    userId:       { type: String, required: true, index: true },
    tripId:       { type: String, required: true },
    inputTokens:  { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    toolCalls:    { type: Number, default: 0 },
    costCents:    { type: Number, default: 0 },     // USD cents, tracked against $0.30 cap
    messages:     { type: Schema.Types.Mixed, default: [] },
    status:       { type: String, default: "active" }, // active | completed | capped
  },
  { timestamps: true }
);

export const AgentSession =
  models.AgentSession ?? model("AgentSession", AgentSessionSchema);

// ── Cost model for claude-sonnet-4-20250514 ──────────────────────────────────
// Input:  $3 / 1M tokens  → 0.0003 cents per token
// Output: $15 / 1M tokens → 0.0015 cents per token
function calcCostCents(inputTokens: number, outputTokens: number): number {
  return (inputTokens * 0.3) / 1000 + (outputTokens * 1.5) / 1000;
}

// ── Hard limits ───────────────────────────────────────────────────────────────
const MAX_TOOL_CALLS     = 12;
const BUDGET_CENTS       = 30; // $0.30
const MAX_INPUT_TOKENS   = 200_000;
const MAX_OUTPUT_TOKENS  = 8_000;
const MODEL              = "claude-sonnet-4-20250514";

// ── SSE event helpers ─────────────────────────────────────────────────────────
export type AgentEvent =
  | { type: "text";       delta: string }
  | { type: "tool_start"; toolName: ToolName; input: unknown }
  | { type: "tool_done";  toolName: ToolName; result: unknown }
  | { type: "done";       sessionId: string; costCents: number }
  | { type: "error";      message: string };

export function encodeSSE(event: AgentEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

// ── Tool dispatch ─────────────────────────────────────────────────────────────
// Each handler receives the raw tool input and returns a JSON-serialisable result.
// The actual calls go through the SearchClient (for search_* tools) and the
// Mongoose DB (for save_itinerary). get_destination_info is stubbed for now.

export interface ToolContext {
  searchClient: SearchClient;
  tripId: string;
  userId: string;
}

async function dispatchTool(
  name: ToolName,
  input: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown> {
  switch (name) {
    case "search_flights": {
      return ctx.searchClient.searchFlights({
        origin:      String(input.origin ?? ""),
        destination: String(input.destination ?? ""),
        date:        String(input.departDate ?? ""),
        adults:      typeof input.paxAdult === "number" ? input.paxAdult : 1,
        cabin:       (input.cabin as "economy" | "premium" | "business" | "first" | undefined) ?? "economy",
        ...(input.returnDate ? { returnDate: String(input.returnDate) } : {}),
      });
    }

    case "search_hotels": {
      // Hotels not yet live in Go service — return mock shape so the agent can proceed
      return {
        hotels: [],
        note: "Hotel search not yet live. Stub response — use get_destination_info for now.",
      };
    }

    case "search_activities": {
      // Activities not yet live — stub
      return {
        activities: [],
        note: "Activity search not yet live. Stub response.",
      };
    }

    case "get_destination_info": {
      // Stubbed — will be replaced by a Typesense / external API call
      const dest  = String(input.destination ?? "");
      const month = typeof input.month === "number" ? input.month : null;
      return {
        destination: dest,
        month,
        note: "Live destination data not yet available. Proceed with general knowledge for now.",
      };
    }

    case "save_itinerary": {
      await connectDB();

      const tripId = String(input.tripId ?? ctx.tripId);
      const days   = input.days as Array<{
        date: string;
        label?: string;
        items: Array<{
          type: string;
          title: string;
          startsAt: string;
          endsAt?: string;
          payload?: Record<string, unknown>;
        }>;
      }>;

      // Upsert segments for each day item
      const newSegments = days.flatMap((day, dayIndex) =>
        day.items.map((item, itemIndex) => ({
          tripId,
          type:       item.type,
          title:      item.title,
          startsAt:   new Date(item.startsAt),
          endsAt:     item.endsAt ? new Date(item.endsAt) : undefined,
          orderHint:  dayIndex * 100 + itemIndex,
          payload:    { ...(item.payload ?? {}), aiGenerated: true, dayLabel: day.label },
        }))
      );

      // Remove previous AI-generated segments for this trip, then insert new ones
      await Segment.deleteMany({ tripId, "payload.aiGenerated": true });
      await (Segment as any).insertMany(newSegments);

      // Update trip summary if provided
      if (input.summary) {
        await Trip.updateOne({ _id: tripId }, { $set: { aiSummary: String(input.summary) } });
      }

      return {
        saved: true,
        segmentCount: newSegments.length,
        tripId,
      };
    }

    default: {
      const _exhaustive: never = name;
      return { error: `Unknown tool: ${String(_exhaustive)}` };
    }
  }
}

// ── Main agent runner ─────────────────────────────────────────────────────────

export interface RunAgentOptions {
  sessionId?: string;   // Resume existing session
  userId: string;
  tripId: string;
  userMessage: string;
  searchClient: SearchClient;
  onEvent: (event: AgentEvent) => void;
}

export async function runAgent(opts: RunAgentOptions): Promise<void> {
  const { userId, tripId, userMessage, searchClient, onEvent } = opts;

  await connectDB();

  // Load or create session
  let session = opts.sessionId
    ? await (AgentSession as any).findOne({ _id: opts.sessionId })
    : null;

  if (!session) {
    session = await (AgentSession as any).create({ userId, tripId, messages: [] });
  }

  // Guard: already at cap
  if (session.status === "capped") {
    onEvent({ type: "error", message: "Planning session limit reached. Start a new session." });
    return;
  }

  const anthropic = new Anthropic();

  // Append the new user message to the session history
  const messages: Anthropic.MessageParam[] = [
    ...(session.messages as Anthropic.MessageParam[]),
    { role: "user", content: userMessage },
  ];

  let toolCallsThisRun = 0;

  // Agentic loop
  while (true) {
    // Cost cap check
    if (session.costCents >= BUDGET_CENTS) {
      session.status = "capped";
      await session.save();
      onEvent({ type: "error", message: "Session budget limit reached ($0.30). Saving progress." });
      break;
    }

    // Tool call cap check
    if (session.toolCalls + toolCallsThisRun >= MAX_TOOL_CALLS) {
      onEvent({ type: "error", message: "Maximum tool calls reached for this session." });
      break;
    }

    let textAccumulator = "";
    const toolUseBlocks: Anthropic.ToolUseBlock[] = [];

    // Stream the response
    const stream = await anthropic.messages.stream({
      model:              MODEL,
      max_tokens:         MAX_OUTPUT_TOKENS,
      system:             SYSTEM_PROMPT,
      tools,
      messages,
    });

    for await (const chunk of stream) {
      if (chunk.type === "content_block_delta") {
        if (chunk.delta.type === "text_delta") {
          textAccumulator += chunk.delta.text;
          onEvent({ type: "text", delta: chunk.delta.text });
        }
      }
    }

    const response = await stream.finalMessage();

    // Track token usage
    const { input_tokens, output_tokens } = response.usage;
    const costDelta = calcCostCents(input_tokens, output_tokens);
    session.inputTokens  += input_tokens;
    session.outputTokens += output_tokens;
    session.costCents    += costDelta;
    await session.save();

    // Collect tool use blocks from response
    for (const block of response.content) {
      if (block.type === "tool_use") {
        toolUseBlocks.push(block);
      }
    }

    // Append the assistant turn
    messages.push({ role: "assistant", content: response.content });

    // If no tool calls, we're done
    if (response.stop_reason === "end_turn" || toolUseBlocks.length === 0) {
      break;
    }

    // Dispatch tool calls
    const toolResultContent: Anthropic.ToolResultBlockParam[] = [];

    for (const toolBlock of toolUseBlocks) {
      const toolName = toolBlock.name as ToolName;
      toolCallsThisRun++;
      session.toolCalls++;

      onEvent({ type: "tool_start", toolName, input: toolBlock.input });

      let result: unknown;
      try {
        result = await dispatchTool(
          toolName,
          toolBlock.input as Record<string, unknown>,
          { searchClient, tripId, userId }
        );
      } catch (err) {
        result = { error: String(err) };
      }

      onEvent({ type: "tool_done", toolName, result });

      toolResultContent.push({
        type:        "tool_result",
        tool_use_id: toolBlock.id,
        content:     JSON.stringify(result),
      });

      // Per-loop cost cap
      if (session.costCents >= BUDGET_CENTS) break;
      if (session.toolCalls >= MAX_TOOL_CALLS) break;
    }

    // Append tool results and loop
    messages.push({ role: "user", content: toolResultContent });

    await session.save();
  }

  // Persist final message history
  session.messages = messages;
  if (session.status === "active") {
    session.status = "completed";
  }
  await session.save();

  onEvent({
    type:      "done",
    sessionId: String(session._id),
    costCents: session.costCents,
  });
}
