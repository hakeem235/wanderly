import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { connectDB, Subscription } from "@wanderly/db";
import Link from "next/link";
import { UpgradeActions } from "@/components/billing/upgrade-actions";

export const dynamic = "force-dynamic";

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: { cancelled?: string; upgraded?: string };
}) {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  await connectDB();
  const sub = await Subscription.findOne({ userId }).lean();
  const currentPlan = (sub?.plan as string | undefined) ?? "FREE";
  const isPro = currentPlan === "PRO" || currentPlan === "TEAM";

  if (isPro && !searchParams.cancelled) {
    redirect("/plan");
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-mono uppercase tracking-widest text-terracotta mb-4">
            Wanderly Pro
          </p>
          <h1 className="font-display text-5xl text-ink mb-4 leading-tight">
            Plan trips like a{" "}
            <em>concierge</em>
          </h1>
          <p className="text-ink-mute text-lg max-w-xl mx-auto leading-relaxed">
            Upgrade to Pro and unlock the AI itinerary planner — real flight
            and hotel searches, day-by-day plans, budget tracking.
          </p>
        </div>

        {/* Pricing card */}
        <div className="max-w-md mx-auto">
          <div className="relative bg-paper-warm border-2 border-terracotta rounded-2xl p-8 shadow-sm">
            {/* Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-terracotta text-cream text-xs font-mono uppercase tracking-widest px-3 py-1 rounded-full">
                Most popular
              </span>
            </div>

            <div className="mb-6">
              <p className="text-ink-mute text-sm font-mono uppercase tracking-wider mb-1">Pro</p>
              <div className="flex items-baseline gap-1">
                <span className="font-display text-5xl text-ink">$12</span>
                <span className="text-ink-mute">/ month</span>
              </div>
              <p className="text-ink-mute text-sm mt-1">Billed monthly · Cancel anytime</p>
            </div>

            {/* Features list */}
            <ul className="space-y-3 mb-8">
              {[
                "AI itinerary planner with live flight + hotel search",
                "Unlimited trip management",
                "Email import from any booking provider",
                "Price-drop alerts",
                "Offline access via PWA",
                "Priority support",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-ink">
                  <span className="text-teal mt-0.5 flex-shrink-0">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <UpgradeActions currentPlan={currentPlan} />
          </div>
        </div>

        {/* Free tier comparison */}
        <div className="mt-12 text-center">
          <p className="text-sm text-ink-mute mb-4">
            Free tier includes trip management, email import, and search browsing.
          </p>
          <Link
            href="/dashboard"
            className="text-sm text-terracotta hover:text-terracotta-deep underline underline-offset-2"
          >
            Continue with free →
          </Link>
        </div>

        {/* Dashed divider */}
        <div className="mt-16 border-t border-dashed border-line" />

        {/* FAQ */}
        <div className="mt-12 grid gap-6 max-w-2xl mx-auto">
          <h2 className="font-display text-2xl text-ink text-center">Questions</h2>
          {[
            {
              q: "Can I cancel anytime?",
              a: "Yes. Cancel from your billing settings and you keep Pro access until the end of your billing period.",
            },
            {
              q: "What happens to my trips if I downgrade?",
              a: "All your trips, segments, and documents stay forever. You just lose access to the AI planner.",
            },
            {
              q: "Is there a free trial?",
              a: "Not yet — but if you're not happy in the first 7 days, email us and we'll refund you.",
            },
          ].map(({ q, a }) => (
            <div key={q} className="border-b border-line-soft pb-6">
              <p className="font-medium text-ink mb-1">{q}</p>
              <p className="text-sm text-ink-mute leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
