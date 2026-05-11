import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB, Subscription } from "@wanderly/db";
import { stripe } from "@/lib/stripe";
import { withSpan } from "@/lib/tracing";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return withSpan("billing.portal", { "user.id": userId }, async () => {
    await connectDB();

    const sub = await Subscription.findOne({ userId }).lean();
    if (!sub?.stripeCustomerId) {
      return NextResponse.json({ error: "No billing account found" }, { status: 404 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer:   sub.stripeCustomerId,
      return_url: `${appUrl}/upgrade`,
    });

    return NextResponse.json({ url: session.url });
  });
}
