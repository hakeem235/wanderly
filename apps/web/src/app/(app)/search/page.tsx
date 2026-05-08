import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { connectDB, Trip } from "@wanderly/db";
import { SearchShell } from "@/components/search/search-shell";

export default async function SearchPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  await connectDB();
  const rawTrips = await Trip.find({ ownerId: userId }, { _id: 1, title: 1 })
    .sort({ startDate: 1 })
    .lean();

  const trips = rawTrips.map((t) => ({
    id: t._id.toString(),
    title: t.title,
  }));

  return <SearchShell trips={trips} />;
}
