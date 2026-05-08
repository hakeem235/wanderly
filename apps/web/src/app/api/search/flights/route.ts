import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerSearchClient, SearchError } from "@wanderly/sdk";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams;
  const origin = q.get("origin");
  const destination = q.get("destination");
  const date = q.get("date");

  if (!origin || !destination || !date) {
    return NextResponse.json(
      { status: 400, title: "Missing parameters", detail: "origin, destination, and date are required" },
      { status: 400 }
    );
  }

  const adults = q.has("adults") ? Number(q.get("adults")) : undefined;
  const cabin = q.get("cabin") as "economy" | "premium" | "business" | "first" | null;

  try {
    const client = createServerSearchClient();
    const result = await client.searchFlights({
      origin,
      destination,
      date,
      ...(adults ? { adults } : {}),
      ...(cabin ? { cabin } : {}),
      ...(q.has("returnDate") ? { returnDate: q.get("returnDate")! } : {}),
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof SearchError) {
      return NextResponse.json(
        { status: err.status, title: err.title, detail: err.detail },
        { status: err.status }
      );
    }
    const msg = err instanceof Error ? err.message : "Search service unavailable";
    return NextResponse.json(
      { status: 503, title: "Search service unavailable", detail: msg },
      { status: 503 }
    );
  }
}
