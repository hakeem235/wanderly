import { NextRequest, NextResponse } from "next/server";
import { connectDB, Destination } from "@wanderly/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  await connectDB();

  const filter = q
    ? { $text: { $search: q } }
    : { popular: true };

  const destinations = await (Destination as any).find(filter)
    .sort(q ? { score: { $meta: "textScore" } } : { city: 1 })
    .limit(20)
    .select("city country iata region photoUrl currency tags popular")
    .lean();

  return NextResponse.json({ destinations });
}
