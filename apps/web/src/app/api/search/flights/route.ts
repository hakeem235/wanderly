import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

const SEARCH_SERVICE_URL = process.env.SEARCH_SERVICE_URL ?? "http://127.0.0.1:8080";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const qs = searchParams.toString();

  try {
    const upstream = await fetch(`${SEARCH_SERVICE_URL}/v1/flights?${qs}`, {
      signal: AbortSignal.timeout(25_000),
    });

    const body = await upstream.json();
    if (!upstream.ok) return NextResponse.json(body, { status: upstream.status });
    return NextResponse.json(body);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Search service unavailable";
    return NextResponse.json(
      { status: 503, title: "Search service unavailable", detail: msg },
      { status: 503 }
    );
  }
}
