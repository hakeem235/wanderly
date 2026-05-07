"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { connectDB, Trip, Segment, TripShare } from "@wanderly/db";
import { z } from "zod";
import crypto from "crypto";

const CreateTripInput = z.object({
  title:       z.string().min(1, "Title is required").max(100),
  destination: z.string().min(1, "Destination is required").max(100),
  startDate:   z.string().min(1, "Start date is required"),
  endDate:     z.string().min(1, "End date is required"),
  budgetCents: z.coerce.number().int().positive().optional(),
  currency:    z.string().length(3).default("USD"),
});

export type CreateTripData = z.infer<typeof CreateTripInput>;

export async function createTrip(data: CreateTripData) {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const v = CreateTripInput.parse(data);
  await connectDB();

  const trip = await Trip.create({
    ownerId:     userId,
    title:       v.title,
    destination: v.destination,
    startDate:   new Date(v.startDate),
    endDate:     new Date(v.endDate),
    budgetCents: v.budgetCents,
    currency:    v.currency,
    status:      "PLANNING",
  });

  revalidatePath("/dashboard");
  return { id: trip._id.toString() };
}

export async function updateTrip(
  id: string,
  data: Partial<CreateTripData & { status: string }>
) {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  await connectDB();
  const trip = await Trip.findOne({ _id: id, ownerId: userId });
  if (!trip) throw new Error("Trip not found");

  if (data.title)       trip.title       = data.title;
  if (data.destination) trip.destination = data.destination;
  if (data.startDate)   trip.startDate   = new Date(data.startDate);
  if (data.endDate)     trip.endDate     = new Date(data.endDate);
  if (data.budgetCents !== undefined) trip.budgetCents = data.budgetCents;
  if (data.currency)    trip.currency    = data.currency;

  await trip.save();
  revalidatePath(`/trips/${id}`);
  revalidatePath("/dashboard");
}

export async function deleteTrip(id: string) {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  await connectDB();
  const trip = await Trip.findOne({ _id: id, ownerId: userId });
  if (!trip) throw new Error("Trip not found");

  await Segment.deleteMany({ tripId: id });
  await TripShare.deleteMany({ tripId: id });
  await trip.deleteOne();

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function createShareLink(tripId: string) {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  await connectDB();
  const trip = await Trip.findOne({ _id: tripId, ownerId: userId });
  if (!trip) throw new Error("Trip not found");

  const existing = await TripShare.findOne({ tripId, role: "VIEWER" });
  if (existing) return { token: existing.token as string };

  const token = crypto.randomBytes(16).toString("hex");
  await TripShare.create({ tripId, token, role: "VIEWER" });

  revalidatePath(`/trips/${tripId}`);
  return { token };
}
