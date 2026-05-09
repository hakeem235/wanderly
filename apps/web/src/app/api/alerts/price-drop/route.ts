/**
 * POST /api/alerts/price-drop
 *
 * Called by n8n daily workflow. Checks all QUOTED flight segments,
 * re-fetches current price via the search service, and sends an email
 * alert if price dropped >5%.
 *
 * Secured with a shared secret (ALERT_WEBHOOK_SECRET) to prevent abuse.
 */
import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { connectDB, Segment, Trip } from "@wanderly/db";
import { createServerSearchClient } from "@wanderly/sdk";
import { sendPriceDropAlert } from "@/lib/email/send-price-drop-alert";
import { withSpan } from "@/lib/tracing";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DROP_THRESHOLD = 0.05; // 5%

export async function POST(req: NextRequest) {
  // Shared-secret auth
  const secret = process.env.ALERT_WEBHOOK_SECRET;
  if (secret) {
    const provided = req.headers.get("x-alert-secret");
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return withSpan("alerts.price-drop", {}, async () => {
    await connectDB();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const searchClient = createServerSearchClient();

    // Find all QUOTED flight segments that have the offerId cached
    const quotedSegments = await Segment.find({
      type: "FLIGHT",
      "payload.status": "QUOTED",
      "payload.offerId": { $exists: true },
      "payload.totalCents": { $exists: true },
    })
      .populate({ path: "tripId", select: "ownerId currency title" })
      .lean();

    let checked = 0;
    let alerted = 0;

    for (const seg of quotedSegments) {
      try {
        const payload  = seg.payload as Record<string, unknown>;
        const offerId  = String(payload.offerId ?? "");
        const oldCents = Number(payload.totalCents ?? 0);
        const origin   = String(payload.origin ?? "");
        const dest     = String(payload.destination ?? "");
        const depart   = String(payload.depart ?? "").slice(0, 10);
        const carrier  = String(payload.carrier ?? "");
        const trip     = seg.tripId as unknown as { ownerId: string; currency: string; title: string } | null;

        if (!trip || !origin || !dest || !depart || oldCents === 0) continue;

        // Re-search for current price
        let newCents = 0;
        try {
          const results = await searchClient.searchFlights({
            origin, destination: dest, date: depart,
          });
          // Find cheapest offer from same carrier if available, else cheapest overall
          const offers = results.data ?? [];
          const match = offers.find((o) => {
            const slices = (o as unknown as { slices?: Array<{ carrier?: string }> }).slices;
            return slices?.[0]?.carrier === carrier;
          }) ?? offers[0];
          newCents = match?.totalCents ?? 0;
        } catch {
          // Search service unavailable — skip this segment
          continue;
        }

        if (!newCents || newCents >= oldCents) {
          checked++;
          continue;
        }

        const drop    = (oldCents - newCents) / oldCents;
        const savings = oldCents - newCents;

        if (drop < DROP_THRESHOLD) {
          checked++;
          continue;
        }

        // Look up user email from Clerk
        const clerk   = await clerkClient();
        const user    = await clerk.users.getUser(trip.ownerId);
        const toEmail = user.emailAddresses[0]?.emailAddress;
        const name    = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Traveler";

        if (!toEmail) { checked++; continue; }

        const tripId = String(seg.tripId);
        await sendPriceDropAlert(toEmail, {
          passengerName:  name,
          origin,
          destination:    dest,
          departDate:     depart,
          carrier,
          oldPriceCents:  oldCents,
          newPriceCents:  newCents,
          currency:       trip.currency ?? "USD",
          savingsCents:   savings,
          dropPct:        Math.round(drop * 100),
          searchUrl:      `${appUrl}/search?origin=${origin}&destination=${dest}&date=${depart}`,
          tripUrl:        `${appUrl}/trips/${tripId}`,
        });

        alerted++;
        checked++;
      } catch (err) {
        console.error("[alerts/price-drop] error processing segment:", err);
      }
    }

    return NextResponse.json({ checked, alerted });
  });
}
