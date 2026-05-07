"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { connectDB, Segment, Trip } from "@wanderly/db";
import { z } from "zod";

const CreateSegmentInput = z.object({
  tripId:   z.string().min(1),
  type:     z.enum(["FLIGHT", "LODGING", "ACTIVITY", "TRANSFER", "FOOD", "NOTE"]),
  title:    z.string().min(1).max(200),
  startsAt: z.string().min(1),
  endsAt:   z.string().optional(),
  payload:  z.record(z.unknown()).default({}),
});

export type CreateSegmentData = z.infer<typeof CreateSegmentInput>;

export async function createSegment(data: CreateSegmentData) {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const v = CreateSegmentInput.parse(data);
  await connectDB();

  const trip = await Trip.findOne({ _id: v.tripId, ownerId: userId });
  if (!trip) throw new Error("Trip not found");

  await Segment.create({
    tripId:   v.tripId,
    type:     v.type,
    title:    v.title,
    startsAt: new Date(v.startsAt),
    endsAt:   v.endsAt ? new Date(v.endsAt) : undefined,
    payload:  v.payload,
  });

  revalidatePath(`/trips/${v.tripId}`);
}

export async function deleteSegment(tripId: string, segmentId: string) {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  await connectDB();
  const trip = await Trip.findOne({ _id: tripId, ownerId: userId });
  if (!trip) throw new Error("Trip not found");

  await Segment.findByIdAndDelete(segmentId);
  revalidatePath(`/trips/${tripId}`);
}
