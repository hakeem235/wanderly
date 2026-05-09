import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { connectDB, Trip } from "@wanderly/db";
import { runAgent, encodeSSE } from "@wanderly/ai";
import { createServerSearchClient } from "@wanderly/sdk";
import { withSpan } from "@/lib/tracing";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // 2 min

const BodySchema = z.object({
  tripId:     z.string().min(1),
  message:    z.string().min(1).max(2000),
  sessionId:  z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Verify trip ownership
  await connectDB();
  const trip = await Trip.findOne({ _id: body.tripId, ownerId: userId }).lean();
  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const searchClient = createServerSearchClient();

  // Build SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        await withSpan("agent.plan", { "trip.id": body.tripId, "user.id": userId }, async () => {
          await runAgent({
            userId,
            tripId:      body.tripId,
            userMessage: body.message,
            ...(body.sessionId ? { sessionId: body.sessionId } : {}),
            searchClient,
            onEvent(event) {
              controller.enqueue(encoder.encode(encodeSSE(event)));
            },
          });
        });
      } catch (err) {
        const errMsg = encodeSSE({ type: "error", message: String(err) });
        controller.enqueue(encoder.encode(errMsg));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection":    "keep-alive",
    },
  });
}
