import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { connectDB, Booking, Trip } from "@wanderly/db";
import { stripe } from "@/lib/stripe";
import { getIdempotentResult, setIdempotentResult } from "@/lib/booking/idempotency";
import { withSpan } from "@/lib/tracing";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  tripId:         z.string().min(1),
  offerId:        z.string().min(1),
  provider:       z.string().min(1),
  totalCents:     z.number().int().positive(),
  currency:       z.string().length(3),
  idempotencyKey: z.string().min(1),
  offer:          z.record(z.unknown()),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: "Invalid request", detail: String(err) }, { status: 400 });
  }

  const idemKey = `${userId}:${body.idempotencyKey}`;

  return withSpan("booking.create_intent", { "user.id": userId, "trip.id": body.tripId }, async () => {
    // ── Idempotency check ─────────────────────────────────────────────────────
    const existing = await getIdempotentResult(idemKey);
    if (existing) {
      await connectDB();
      const booking = await Booking.findById(existing).lean();
      if (booking) {
        return NextResponse.json({
          bookingId: existing,
          clientSecret: booking.stripePiId
            ? (await stripe.paymentIntents.retrieve(booking.stripePiId)).client_secret
            : null,
          idempotent: true,
        });
      }
    }

    await connectDB();

    // ── Validate trip ownership ───────────────────────────────────────────────
    const trip = await Trip.findOne({ _id: body.tripId, ownerId: userId });
    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

    // ── Create Stripe PaymentIntent ───────────────────────────────────────────
    const pi = await stripe.paymentIntents.create(
      {
        amount: body.totalCents,
        currency: body.currency.toLowerCase(),
        metadata: {
          userId,
          tripId:   body.tripId,
          offerId:  body.offerId,
          provider: body.provider,
        },
        automatic_payment_methods: { enabled: true },
      },
      { idempotencyKey: `pi_${idemKey}` }
    );

    // ── Create Booking record ─────────────────────────────────────────────────
    const booking = await Booking.create({
      userId,
      tripId:         body.tripId,
      provider:       body.provider,
      providerRef:    body.offerId,
      status:         "PENDING",
      totalCents:     body.totalCents,
      currency:       body.currency,
      rawOffer:       body.offer,
      stripePiId:     pi.id,
      idempotencyKey: idemKey,
    });

    await setIdempotentResult(idemKey, booking._id.toString());

    return NextResponse.json({
      bookingId:    booking._id.toString(),
      clientSecret: pi.client_secret,
    });
  });
}
