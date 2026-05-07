import { Schema, model, models, Types, type InferSchemaType, type Model } from "mongoose";

export const TripStatuses = ["PLANNING", "BOOKED", "ONGOING", "COMPLETED", "CANCELLED"] as const;
export type TripStatus = (typeof TripStatuses)[number];

const TripSchema = new Schema(
  {
    ownerId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    destination: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: TripStatuses, default: "PLANNING" },
    budgetCents: { type: Number },
    currency: { type: String, default: "USD" },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

TripSchema.index({ ownerId: 1, startDate: 1 });

export type TripDoc = InferSchemaType<typeof TripSchema>;
export const Trip = ((models.Trip ?? model("Trip", TripSchema)) as unknown) as Model<TripDoc>;
