import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB, Trip, Segment } from "@wanderly/db";
import { withSpan } from "@/lib/tracing";

export const dynamic = "force-dynamic";

interface SaveQuoteBody {
  tripId: string;
  offer: {
    id: string;
    provider: string;
    totalCents: number;
    currency: string;
    slices: {
      origin: string;
      destination: string;
      depart: string;
      arrive: string;
      carrier: string;
      flightNum: string;
    }[];
  };
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: SaveQuoteBody;
  try {
    body = await req.json() as SaveQuoteBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { tripId, offer } = body;
  if (!tripId || !offer) {
    return NextResponse.json({ error: "tripId and offer are required" }, { status: 400 });
  }

  return withSpan("search.save_quote", { "user.id": userId, "trip.id": tripId }, async () => {
    await connectDB();

    const trip = await Trip.findOne({ _id: tripId, ownerId: userId });
    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

    const firstSlice = offer.slices[0];
    const lastSlice = offer.slices[offer.slices.length - 1];

    const segment = await Segment.create({
      tripId,
      type: "FLIGHT",
      title: firstSlice
        ? `Flight ${firstSlice.flightNum} · ${firstSlice.origin}→${lastSlice?.destination ?? firstSlice.destination}`
        : "Flight quote",
      startsAt: firstSlice ? new Date(firstSlice.depart) : new Date(),
      ...(lastSlice ? { endsAt: new Date(lastSlice.arrive) } : {}),
      payload: {
        offerId: offer.id,
        provider: offer.provider,
        totalCents: offer.totalCents,
        currency: offer.currency,
        status: "QUOTED",
        slices: offer.slices,
        savedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({ ok: true, segmentId: segment._id.toString() });
  });
}
