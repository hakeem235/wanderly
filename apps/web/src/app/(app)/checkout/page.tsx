import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { connectDB, Trip } from "@wanderly/db";
import { CheckoutShell } from "@/components/checkout/checkout-shell";

// Checkout page receives offer data via URL search params (from save-to-trip flow)
// ?tripId=...&offerId=...&totalCents=...&currency=...&provider=...
// The full offer JSON is stored in the QUOTED segment — we read it from there.
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const params = await searchParams;
  const { tripId } = params;
  if (!tripId) redirect("/search");

  await connectDB();
  const rawTrips = await Trip.find({ ownerId: userId }, { _id: 1, title: 1 }).lean();
  const trips = rawTrips.map((t) => ({ id: t._id.toString(), title: t.title }));
  const trip = trips.find((t) => t.id === tripId);
  if (!trip) redirect("/dashboard");

  return (
    <CheckoutShell
      tripId={tripId}
      tripTitle={trip.title}
      offerJson={params.offer ?? ""}
    />
  );
}
