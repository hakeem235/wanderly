import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { connectDB, Booking, Segment } from "@wanderly/db";
import { canTransition } from "@/lib/booking/state-machine";
import { withSpan } from "@/lib/tracing";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn("[webhook/stripe] STRIPE_WEBHOOK_SECRET not set — skipping signature check");
  }

  let event: ReturnType<typeof stripe.webhooks.constructEvent>;
  try {
    event = webhookSecret
      ? stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
      : JSON.parse(rawBody);
  } catch (err) {
    return NextResponse.json({ error: `Webhook signature failed: ${String(err)}` }, { status: 400 });
  }

  return withSpan("webhook.stripe", { "event.type": event.type }, async () => {
    await connectDB();

    switch (event.type) {
      // ── Payment succeeded → CONFIRMED ───────────────────────────────────────
      case "payment_intent.succeeded": {
        const pi = event.data.object as { id: string };
        const booking = await Booking.findOne({ stripePiId: pi.id });
        if (!booking) break;

        if (canTransition(booking.status as "QUOTED" | "PENDING" | "CONFIRMED" | "CANCELLED" | "FAILED", "CONFIRMED")) {
          booking.status = "CONFIRMED";
          booking.confirmedAt = new Date();
          await booking.save();

          // Update the QUOTED segment to CONFIRMED
          await Segment.updateOne(
            { tripId: booking.tripId, "payload.offerId": booking.providerRef },
            { $set: { "payload.status": "CONFIRMED", "payload.confirmedAt": new Date() } }
          );
        }
        break;
      }

      // ── Payment failed → FAILED + auto-refund if needed ─────────────────────
      case "payment_intent.payment_failed": {
        const pi = event.data.object as { id: string };
        const booking = await Booking.findOne({ stripePiId: pi.id });
        if (!booking) break;

        if (canTransition(booking.status as "QUOTED" | "PENDING" | "CONFIRMED" | "CANCELLED" | "FAILED", "FAILED")) {
          booking.status = "FAILED";
          await booking.save();
        }
        break;
      }

      // ── Charge refunded → CANCELLED ──────────────────────────────────────────
      case "charge.refunded": {
        const charge = event.data.object as { payment_intent: string };
        if (!charge.payment_intent) break;
        const booking = await Booking.findOne({ stripePiId: charge.payment_intent });
        if (!booking) break;

        if (canTransition(booking.status as "QUOTED" | "PENDING" | "CONFIRMED" | "CANCELLED" | "FAILED", "CANCELLED")) {
          booking.status = "CANCELLED";
          await booking.save();
        }
        break;
      }

      default:
        // Unhandled event type — return 200 so Stripe stops retrying
        break;
    }

    return NextResponse.json({ received: true });
  });
}
