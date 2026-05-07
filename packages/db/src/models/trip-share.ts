import { Schema, model, models, Types, type InferSchemaType, type Model } from "mongoose";

export const ShareRoles = ["VIEWER", "EDITOR"] as const;
export type ShareRole = (typeof ShareRoles)[number];

const TripShareSchema = new Schema({
  tripId: { type: Schema.Types.ObjectId, ref: "Trip", required: true, index: true },
  email: { type: String },
  token: { type: String, required: true, unique: true },
  role: { type: String, enum: ShareRoles, default: "VIEWER" },
  expiresAt: { type: Date },
});

export type TripShareDoc = InferSchemaType<typeof TripShareSchema>;
export const TripShare = ((models.TripShare ?? model("TripShare", TripShareSchema)) as unknown) as Model<TripShareDoc>;
