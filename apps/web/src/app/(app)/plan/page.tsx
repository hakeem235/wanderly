import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { connectDB, Trip } from "@wanderly/db";
import { PlanShell } from "@/components/plan/plan-shell";

export default async function PlanPage({
  searchParams,
}: {
  searchParams: { tripId?: string };
}) {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  await connectDB();

  // Load user's trips for the trip picker
  const trips = await Trip.find({ ownerId: userId, status: { $ne: "CANCELLED" } })
    .sort({ startDate: 1 })
    .select("_id title destination startDate endDate")
    .lean();

  const serializedTrips = trips.map((t) => ({
    id:          String(t._id),
    title:       t.title as string,
    destination: (t.destination as string) ?? "",
    startDate:   t.startDate ? (t.startDate as Date).toISOString() : null,
    endDate:     t.endDate   ? (t.endDate   as Date).toISOString() : null,
  }));

  return (
    <div className="min-h-screen bg-cream">
      <PlanShell
        trips={serializedTrips}
        {...(searchParams.tripId ? { initialTripId: searchParams.tripId } : {})}
      />
    </div>
  );
}
