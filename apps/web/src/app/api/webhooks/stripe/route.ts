import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { connectDB, Booking, Segment, Subscription } from "@wanderly/db";
import { canTransition } from "@/lib/booking/state-machine";
import { sendBookingConfirmation } from "@/lib/email/send-booking-confirmation";
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
        const pi = event.data.object as { id: string; metadata?: Record<string, string> };
        const booking = await Booking.findOne({ stripePiId: pi.id });
        if (!booking) break;

        if (canTransition(booking.status as "QUOTED" | "PENDING" | "CONFIRMED" | "CANCELLED" | "FAILED", "CONFIRMED")) {
          booking.status = "CONFIRMED";
          booking.confirmedAt = new Date();
          await booking.save();

          await Segment.updateOne(
            { tripId: booking.tripId, "payload.offerId": booking.providerRef },
            { $set: { "payload.status": "CONFIRMED", "payload.confirmedAt": new Date() } }
          );

          try {
            const raw = booking.rawOffer as Record<string, unknown>;
            const slices = (raw.slices ?? []) as Array<Record<string, string | number>>;
            const first  = slices[0];
            const last   = slices[slices.length - 1] ?? first;

            const clerk = await clerkClient();
            const user  = await clerk.users.getUser(booking.userId as string);
            const toEmail = user.emailAddresses[0]?.emailAddress;
            const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Traveler";

            if (toEmail && first && last) {
              const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
              const pnr = raw.pnr as string | undefined;
              await sendBookingConfirmation(toEmail, {
                passengerName: name,
                bookingId:     booking._id.toString(),
                ...(pnr ? { pnr } : {}),
                flightNum:     String(first.flightNum ?? raw.flightNumber ?? ""),
                origin:        String(first.origin ?? ""),
                destination:   String(last.destination ?? ""),
                depart:        String(first.depart ?? ""),
                arrive:        String(last.arrive ?? ""),
                carrier:       String(first.carrier ?? ""),
                totalCents:    booking.totalCents as number,
                currency:      booking.currency as string,
                tripTitle:     String(raw.tripTitle ?? "Your trip"),
                tripUrl:       `${appUrl}/trips/${booking.tripId}`,
              });
            }
          } catch (err) {
            console.error("[webhook/stripe] email send failed:", err);
          }
        }
        break;
      }

      // ── Payment failed → FAILED ──────────────────────────────────────────────
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

      // ── Subscription created/updated → sync plan ─────────────────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as {
          id: string;
          customer: string;
          status: string;
          current_period_end: number;
          cancel_at_period_end: boolean;
          items: { data: Array<{ price: { metadata?: Record<string, string> } }> };
        };

        // Plan is read from Stripe price metadata — set price.metadata.plan = "PRO" or "TEAM"
        const priceMeta = sub.items.data[0]?.price?.metadata ?? {};
        const plan = priceMeta.plan === "TEAM" ? "TEAM" : "PRO";
        const isActive = ["active", "trialing"].includes(sub.status);

        await Subscription.updateOne(
          { stripeCustomerId: sub.customer },
          {
            $set: {
              stripeSubId:       sub.id,
              plan:              isActive ? plan : "FREE",
              currentPeriodEnd:  new Date(sub.current_period_end * 1000),
              cancelAtPeriodEnd: sub.cancel_at_period_end,
            },
          }
        );
        break;
      }

      // ── Subscription deleted → downgrade to FREE ─────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as { id: string; customer: string };
        await Subscription.updateOne(
          { stripeCustomerId: sub.customer },
          {
            $set: {
              plan:              "FREE",
              stripeSubId:       sub.id,
              cancelAtPeriodEnd: false,
            },
          }
        );
        break;
      }

      default:
        // Unhandled event type — return 200 so Stripe stops retrying
        break;
    }

    return NextResponse.json({ received: true });
  });
}
