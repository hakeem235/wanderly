import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { connectDB, Trip } from "@wanderly/db";
import { TripCard, type TripCardData } from "@/components/trips/trip-card";
import { CreateTripDialog } from "@/components/trips/create-trip-dialog";

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  await connectDB();

  const raw = await Trip.find({ ownerId: user.id })
    .sort({ startDate: 1 })
    .lean();

  const trips: TripCardData[] = raw.map((t) => ({
    id:          t._id.toString(),
    title:       t.title,
    destination: t.destination,
    startDate:   (t.startDate as Date).toISOString(),
    endDate:     (t.endDate as Date).toISOString(),
    status:      t.status ?? "PLANNING",
    currency:    t.currency ?? "USD",
    ...(t.budgetCents !== undefined && t.budgetCents !== null ? { budgetCents: t.budgetCents } : {}),
  }));

  const now = new Date();
  const upcoming = trips.filter((t) => new Date(t.endDate) >= now);
  const destinations = new Set(trips.map((t) => t.destination.split(",").at(0)!.trim())).size;

  const greeting = getGreeting();
  const firstName =
    user.firstName ??
    user.emailAddresses[0]?.emailAddress?.split("@")[0] ??
    "there";

  return (
    <div className="space-y-10">
      {/* Greeting */}
      <section className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-display-md text-ink leading-tight">
            {greeting}, <em>{firstName}</em>.
          </h1>
          <p className="mt-1 text-sm text-ink-mute">
            {upcoming.length > 0
              ? `You have ${upcoming.length} upcoming trip${upcoming.length > 1 ? "s" : ""}.`
              : "Plan your next adventure."}
          </p>
        </div>
        <CreateTripDialog />
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Upcoming",     value: upcoming.length.toString() },
          { label: "Total trips",  value: trips.length.toString() },
          { label: "Destinations", value: destinations.toString() },
          { label: "All time",     value: trips.filter(t => t.status === "COMPLETED").length.toString() },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-line bg-paper p-4 shadow-card">
            <p className="font-mono text-[10px] uppercase tracking-badge text-ink-mute">{stat.label}</p>
            <p className="mt-1 font-display text-display-sm text-ink">{stat.value}</p>
          </div>
        ))}
      </section>

      {/* Trip grid */}
      {trips.length > 0 ? (
        <section>
          <h2 className="font-mono text-xs uppercase tracking-badge text-ink-mute mb-4">Your trips</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border-2 border-dashed border-line bg-paper p-14 text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-paper-deep flex items-center justify-center">
            <svg className="w-6 h-6 text-ink-mute" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <h2 className="font-display text-display-xs text-ink mb-2">No trips yet</h2>
          <p className="text-sm text-ink-mute max-w-xs mx-auto mb-6">
            Create your first trip or let the AI concierge plan one for you.
          </p>
          <CreateTripDialog />
        </section>
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
