import { Schema, model, models, Types, type InferSchemaType, type Model } from "mongoose";

const TravelerSchema = new Schema({
  tripId: { type: Schema.Types.ObjectId, ref: "Trip", required: true, index: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  dateOfBirth: { type: Date },
  passportNum: { type: String }, // encrypted at app layer
  nationality: { type: String },
});

export type TravelerDoc = InferSchemaType<typeof TravelerSchema>;
export const Traveler = ((models.Traveler ?? model("Traveler", TravelerSchema)) as unknown) as Model<TravelerDoc>;
