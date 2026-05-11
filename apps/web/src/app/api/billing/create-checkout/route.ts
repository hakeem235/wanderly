import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { connectDB, Subscription } from "@wanderly/db";
import { stripe } from "@/lib/stripe";
import { withSpan } from "@/lib/tracing";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) {
    return NextResponse.json({ error: "STRIPE_PRO_PRICE_ID not configured" }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return withSpan("billing.create_checkout", { "user.id": userId }, async () => {
    await connectDB();

    // Find or create a Stripe customer linked to this user
    let sub = await Subscription.findOne({ userId }).lean();
    let stripeCustomerId = sub?.stripeCustomerId;

    if (!stripeCustomerId) {
      // Look up email from Clerk to pre-fill the checkout form
      const clerk = await clerkClient();
      const user = await clerk.users.getUser(userId);
      const email = user.emailAddresses[0]?.emailAddress;
      const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined;

      const customer = await stripe.customers.create({
        ...(email ? { email } : {}),
        ...(name ? { name } : {}),
        metadata: { clerkUserId: userId },
      });
      stripeCustomerId = customer.id;

      // Upsert subscription doc with the new customer ID
      await Subscription.updateOne(
        { userId },
        { $set: { userId, stripeCustomerId, plan: "FREE" } },
        { upsert: true }
      );
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/plan?upgraded=1`,
      cancel_url:  `${appUrl}/upgrade?cancelled=1`,
      metadata: { clerkUserId: userId },
      subscription_data: {
        metadata: { clerkUserId: userId },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  });
}
