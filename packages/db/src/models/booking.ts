import { Schema, model, models, Types, type InferSchemaType, type Model } from "mongoose";

export const BookingStatuses = ["QUOTED", "PENDING", "CONFIRMED", "CANCELLED", "FAILED"] as const;
export type BookingStatus = (typeof BookingStatuses)[number];

const BookingSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    tripId: { type: Schema.Types.ObjectId, ref: "Trip" },
    provider: { type: String, required: true },
    providerRef: { type: String, required: true },
    status: { type: String, enum: BookingStatuses, required: true },
    totalCents: { type: Number, required: true },
    commissionCents: { type: Number, default: 0 },
    currency: { type: String, required: true },
    rawOffer: { type: Schema.Types.Mixed, required: true },
    stripePiId: { type: String, unique: true, sparse: true },
    idempotencyKey: { type: String, required: true, unique: true },
    confirmedAt: { type: Date },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

BookingSchema.index({ provider: 1, providerRef: 1 });

export type BookingDoc = InferSchemaType<typeof BookingSchema>;
export const Booking = ((models.Booking ?? model("Booking", BookingSchema)) as unknown) as Model<BookingDoc>;
