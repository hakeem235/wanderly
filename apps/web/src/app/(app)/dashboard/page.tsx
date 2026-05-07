import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const greeting = getGreeting();

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <section>
        <h1 className="font-display text-display-md text-ink">
          {greeting},{" "}
          <em>{session.user?.name ?? session.user?.email?.split("@")[0]}</em>.
        </h1>
        <p className="mt-1 text-ink-mute text-sm">
          Signed in as{" "}
          <span className="font-mono text-xs">{session.user?.email}</span>
        </p>
      </section>

      {/* Placeholder trip stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Upcoming trips", value: "0" },
          { label: "Countries visited", value: "0" },
          { label: "Miles logged", value: "0" },
          { label: "Segments saved", value: "0" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-line bg-paper p-4 shadow-card"
          >
            <p className="font-mono text-xs uppercase tracking-badge text-ink-mute">
              {stat.label}
            </p>
            <p className="mt-1 font-display text-display-sm text-ink">
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      {/* Empty state */}
      <section className="rounded-2xl border border-dashed border-line bg-paper p-12 text-center">
        <div className="mx-auto mb-4 text-5xl">✈️</div>
        <h2 className="font-display text-display-xs text-ink mb-2">
          No trips yet
        </h2>
        <p className="text-sm text-ink-mute max-w-sm mx-auto">
          Create your first trip or let the AI concierge plan one for you.
        </p>
        <button className="mt-6 inline-flex items-center gap-2 rounded-lg bg-terracotta px-6 py-2.5 text-sm font-medium text-paper hover:bg-terracotta-deep transition-colors">
          Create trip
        </button>
      </section>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
