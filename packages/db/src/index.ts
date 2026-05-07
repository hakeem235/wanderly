import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;
if (!MONGODB_URI) throw new Error("MONGODB_URI is not set");

declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: typeof mongoose | null;
  // eslint-disable-next-line no-var
  var _mongoosePromise: Promise<typeof mongoose> | null;
}

if (!global._mongooseConn) global._mongooseConn = null;
if (!global._mongoosePromise) global._mongoosePromise = null;

export async function connectDB(): Promise<typeof mongoose> {
  if (global._mongooseConn) return global._mongooseConn;

  if (!global._mongoosePromise) {
    global._mongoosePromise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  global._mongooseConn = await global._mongoosePromise;
  return global._mongooseConn;
}

// Models
export { User } from "./models/user";
export type { UserDoc } from "./models/user";

export { Trip, TripStatuses } from "./models/trip";
export type { TripDoc, TripStatus } from "./models/trip";

export { Segment, SegmentTypes } from "./models/segment";
export type { SegmentDoc, SegmentType } from "./models/segment";

export { Booking, BookingStatuses } from "./models/booking";
export type { BookingDoc, BookingStatus } from "./models/booking";

export { Subscription, Plans } from "./models/subscription";
export type { SubscriptionDoc, Plan } from "./models/subscription";

export { TripShare, ShareRoles } from "./models/trip-share";
export type { TripShareDoc, ShareRole } from "./models/trip-share";

export { Traveler } from "./models/traveler";
export type { TravelerDoc } from "./models/traveler";

export { TripDocument, DocTypes } from "./models/document";
export type { DocumentDoc, DocType } from "./models/document";

export { Passkey } from "./models/passkey";
export type { PasskeyDoc } from "./models/passkey";

