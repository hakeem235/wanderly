import { Schema, model, models, Types, type InferSchemaType, type Model } from "mongoose";

export const SegmentTypes = ["FLIGHT", "LODGING", "ACTIVITY", "TRANSFER", "FOOD", "NOTE"] as const;
export type SegmentType = (typeof SegmentTypes)[number];

const SegmentSchema = new Schema({
  tripId: { type: Schema.Types.ObjectId, ref: "Trip", required: true, index: true },
  type: { type: String, enum: SegmentTypes, required: true },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date },
  title: { type: String, required: true },
  payload: { type: Schema.Types.Mixed, required: true },
  bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
  orderHint: { type: Number, default: 0 },
});

SegmentSchema.index({ tripId: 1, startsAt: 1 });

export type SegmentDoc = InferSchemaType<typeof SegmentSchema>;
export const Segment = ((models.Segment ?? model("Segment", SegmentSchema)) as unknown) as Model<SegmentDoc>;
