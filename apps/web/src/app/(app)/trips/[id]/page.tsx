import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { connectDB, Trip, Segment } from "@wanderly/db";
import { SegmentItem, type SegmentData } from "@/components/trips/segment-item";
import { AddSegmentDialog } from "@/components/trips/add-segment-dialog";
import { ShareButton } from "@/components/trips/share-button";
import { DeleteTripButton } from "@/components/trips/delete-trip-button";
import { TripMap } from "@/components/trips/trip-map";

const STATUS_LABELS: Record<string, string> = {
  PLANNING: "Planning", BOOKED: "Booked", ONGOING: "Ongoing",
  COMPLETED: "Completed", CANCELLED: "Cancelled",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function dayKey(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA"); // YYYY-MM-DD
}

function formatDayHeading(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export default async function TripDetailPage({ params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  await connectDB();

  const trip = await Trip.findOne({ _id: params.id, ownerId: userId }).lean();
  if (!trip) notFound();

  const rawSegments = await Segment.find({ tripId: params.id }).sort({ startsAt: 1 }).lean();

  const tripData = {
    id:          trip._id.toString(),
    title:       trip.title,
    destination: trip.destination,
    startDate:   (trip.startDate as Date).toISOString(),
    endDate:     (trip.endDate as Date).toISOString(),
    status:      trip.status ?? "PLANNING",
    currency:    trip.currency ?? "USD",
    ...(trip.budgetCents !== undefined && trip.budgetCents !== null ? { budgetCents: trip.budgetCents } : {}),
  };

  const segments: SegmentData[] = rawSegments.map((s) => ({
    id:       s._id.toString(),
    type:     s.type,
    title:    s.title,
    startsAt: (s.startsAt as Date).toISOString(),
    ...(s.endsAt ? { endsAt: (s.endsAt as Date).toISOString() } : {}),
    payload:  (s.payload as Record<string, unknown>) ?? {},
  }));

  // Group segments by calendar day
  const byDay = new Map<string, SegmentData[]>();
  for (const seg of segments) {
    const key = dayKey(seg.startsAt);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(seg);
  }

  const days = Array.from(byDay.entries()).sort(([a], [b]) => a.localeCompare(b));

  // Budget summary
  const totalDays = Math.ceil(
    (new Date(tripData.endDate).getTime() - new Date(tripData.startDate).getTime()) / 86400000
  );

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-ink-mute font-mono mb-6">
        <Link href="/dashboard" className="hover:text-ink transition-colors">Trips</Link>
        <span>/</span>
        <span className="text-ink truncate">{tripData.title}</span>
      </nav>

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden h-48 sm:h-56 mb-8 bg-gradient-to-br from-teal to-teal-deep">
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 800 220" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <path d="M0,110 Q100,50 200,110 T400,110 T600,110 T800,110" fill="none" stroke="white" strokeWidth="2"/>
          <path d="M0,140 Q120,80 240,140 T480,140 T720,140" fill="none" stroke="white" strokeWidth="1.5"/>
          <path d="M0,80 Q80,30 160,80 T320,80 T480,80 T640,80 T800,80" fill="none" stroke="white" strokeWidth="1"/>
          <path d="M0,170 Q150,120 300,170 T600,170 T900,170" fill="none" stroke="white" strokeWidth="1"/>
          <circle cx="400" cy="110" r="80" fill="none" stroke="white" strokeWidth="1" opacity="0.3"/>
          <circle cx="400" cy="110" r="120" fill="none" stroke="white" strokeWidth="0.75" opacity="0.2"/>
        </svg>

        <div className="absolute inset-0 flex flex-col justify-end p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-badge text-paper/60 bg-black/20 rounded px-2 py-0.5">
                {STATUS_LABELS[tripData.status]}
              </span>
              <h1 className="mt-2 font-display text-display-md text-paper leading-tight">
                {tripData.title}
              </h1>
              <p className="mt-0.5 text-paper/70 text-sm">
                {tripData.destination} · {formatDate(tripData.startDate)} – {formatDate(tripData.endDate)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex gap-8 flex-col lg:flex-row">
        {/* Timeline — main column */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-mono text-xs uppercase tracking-badge text-ink-mute">Timeline</h2>
            <AddSegmentDialog tripId={tripData.id} />
          </div>

          {days.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-line bg-paper p-10 text-center">
              <p className="text-sm text-ink-mute mb-4">No segments yet. Add flights, hotels, and activities to build your itinerary.</p>
              <AddSegmentDialog tripId={tripData.id} />
            </div>
          ) : (
            <div className="space-y-6">
              {days.map(([dateKey, daySegs]) => (
                <div key={dateKey}>
                  {/* Day header */}
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-xs uppercase tracking-badge text-ink-mute">
                      {formatDayHeading(daySegs[0]!.startsAt)}
                    </span>
                    <div className="flex-1 border-t border-dashed border-line" />
                  </div>

                  {/* Segments */}
                  <div className="rounded-xl border border-line bg-paper divide-y divide-line-soft">
                    {daySegs.map((seg) => (
                      <SegmentItem key={seg.id} segment={seg} tripId={tripData.id} />
                    ))}
                  </div>
                </div>
              ))}

              {/* Add more */}
              <div className="pt-2">
                <AddSegmentDialog tripId={tripData.id} />
              </div>
            </div>
          )}
        </div>

        {/* Right rail */}
        <aside className="lg:w-64 flex-shrink-0 space-y-4">
          {/* Budget */}
          {tripData.budgetCents && (
            <div className="rounded-xl border border-line bg-paper p-4">
              <p className="font-mono text-[10px] uppercase tracking-badge text-ink-mute mb-1">Budget</p>
              <p className="font-display text-display-xs text-ink">
                {tripData.currency} {(tripData.budgetCents / 100).toLocaleString()}
              </p>
            </div>
          )}

          {/* Trip info */}
          <div className="rounded-xl border border-line bg-paper p-4 space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-badge text-ink-mute">Details</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-mute">Duration</span>
                <span className="text-ink font-medium">{totalDays} day{totalDays !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-mute">Segments</span>
                <span className="text-ink font-medium">{segments.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-mute">Departs</span>
                <span className="text-ink font-medium">{formatDate(tripData.startDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-mute">Returns</span>
                <span className="text-ink font-medium">{formatDate(tripData.endDate)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-xl border border-line bg-paper p-4 space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-badge text-ink-mute mb-3">Actions</p>
            <ShareButton tripId={tripData.id} />
            <DeleteTripButton tripId={tripData.id} />
          </div>

          {/* Map */}
          <TripMap segments={segments} destination={tripData.destination} />
        </aside>
      </div>
    </div>
  );
}
