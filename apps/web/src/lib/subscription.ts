import { connectDB, Subscription, type Plan } from "@wanderly/db";

/**
 * Returns the user's current plan from the Subscription collection.
 * Falls back to "FREE" if no subscription document exists.
 */
export async function getUserPlan(userId: string): Promise<Plan> {
  await connectDB();
  const sub = await Subscription.findOne({ userId }).lean();
  return (sub?.plan as Plan | undefined) ?? "FREE";
}

/**
 * Returns true if the user has an active PRO or TEAM subscription.
 */
export async function hasProAccess(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId);
  return plan === "PRO" || plan === "TEAM";
}

/**
 * Ensures a Subscription document exists linking userId ↔ stripeCustomerId.
 * Called when creating a Stripe Checkout Session.
 */
export async function getOrCreateSubscription(
  userId: string,
  stripeCustomerId: string
): Promise<void> {
  await connectDB();
  await Subscription.updateOne(
    { userId },
    { $setOnInsert: { userId, stripeCustomerId, plan: "FREE" } },
    { upsert: true }
  );
}
