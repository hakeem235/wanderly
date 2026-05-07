import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
import { connectDB, Trip, Segment, TripShare } from "@wanderly/db";
import { SegmentData } from "@/components/trips/segment-item";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function dayKey(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA");
}

function formatDayHeading(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

const TYPE_META: Record<string, { icon: string; label: string }> = {
  FLIGHT:   { icon: "✈",  label: "Flight" },
  LODGING:  { icon: "🏨", label: "Lodging" },
  ACTIVITY: { icon: "🎫", label: "Activity" },
  TRANSFER: { icon: "🚗", label: "Transfer" },
  FOOD:     { icon: "🍽", label: "Dining" },
  NOTE:     { icon: "📝", label: "Note" },
};

export default async function SharePage({ params }: { params: { token: string } }) {
  await connectDB();

  const share = await TripShare.findOne({
    token: params.token,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  }).lean();

  if (!share) notFound();

  const trip = await Trip.findById((share as { tripId: unknown }).tripId).lean();
  if (!trip) notFound();

  const rawSegments = await Segment.find({ tripId: trip._id.toString() }).sort({ startsAt: 1 }).lean();

  const segments: SegmentData[] = rawSegments.map((s) => ({
    id:       s._id.toString(),
    type:     s.type,
    title:    s.title,
    startsAt: (s.startsAt as Date).toISOString(),
    ...(s.endsAt ? { endsAt: (s.endsAt as Date).toISOString() } : {}),
    payload:  (s.payload as Record<string, unknown>) ?? {},
  }));

  const byDay = new Map<string, SegmentData[]>();
  for (const seg of segments) {
    const key = dayKey(seg.startsAt);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(seg);
  }
  const days = Array.from(byDay.entries()).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="min-h-screen bg-cream">
      {/* Minimal nav */}
      <header className="border-b border-line bg-cream/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-4 h-14 flex items-center justify-between">
          <span className="font-display text-lg text-ink">Wander<em>ly</em></span>
          <span className="font-mono text-[10px] uppercase tracking-badge text-ink-mute bg-paper-deep rounded px-2 py-1">
            Read-only view
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        {/* Trip header */}
        <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-teal to-teal-deep p-6 mb-8">
          <svg className="absolute opacity-10 pointer-events-none" viewBox="0 0 600 200" aria-hidden>
            <path d="M0,100 Q150,40 300,100 T600,100" fill="none" stroke="white" strokeWidth="1.5"/>
          </svg>
          <p className="font-mono text-[10px] uppercase tracking-badge text-paper/60">{trip.destination}</p>
          <h1 className="mt-1 font-display text-display-md text-paper">{trip.title}</h1>
          <p className="mt-1 text-sm text-paper/70">
            {formatDate((trip.startDate as Date).toISOString())} – {formatDate((trip.endDate as Date).toISOString())}
          </p>
        </div>

        {/* Timeline */}
        {days.length === 0 ? (
          <p className="text-center text-sm text-ink-mute py-12">No segments added yet.</p>
        ) : (
          <div className="space-y-6">
            {days.map(([, daySegs]) => (
              <div key={dayKey(daySegs[0]!.startsAt)}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-xs uppercase tracking-badge text-ink-mute">
                    {formatDayHeading(daySegs[0]!.startsAt)}
                  </span>
                  <div className="flex-1 border-t border-dashed border-line" />
                </div>
                <div className="rounded-xl border border-line bg-paper divide-y divide-line-soft">
                  {daySegs.map((seg) => {
                    const meta = TYPE_META[seg.type] ?? { icon: "•", label: seg.type };
                    return (
                      <div key={seg.id} className="flex gap-4 py-4 px-4">
                        <div className="mt-0.5 text-xl w-8 text-center flex-shrink-0">{meta.icon}</div>
                        <div>
                          <span className="font-mono text-[10px] uppercase tracking-badge text-ink-mute">{meta.label}</span>
                          <p className="text-sm font-medium text-ink mt-0.5">{seg.title}</p>
                          <p className="text-xs text-ink-mute font-mono mt-0.5">
                            {new Date(seg.startsAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                            {seg.endsAt && ` — ${new Date(seg.endsAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-10 text-center text-xs text-ink-mute">
          Shared via <span className="font-display">Wander<em>ly</em></span>
        </p>
      </main>
    </div>
  );
}
