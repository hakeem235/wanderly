import { Schema, model, models } from "mongoose";

export interface DestinationDoc {
  _id: string;
  city: string;
  country: string;
  iata: string;
  region: string;
  photoUrl: string;
  currency: string;
  timezone: string;
  bestMonths: number[];
  visaTip: string;
  weatherSummary: string;
  tags: string[];
  popular: boolean;
}

const DestinationSchema = new Schema<DestinationDoc>(
  {
    city:           { type: String, required: true },
    country:        { type: String, required: true },
    iata:           { type: String, required: true, unique: true },
    region:         { type: String, required: true },
    photoUrl:       { type: String, required: true },
    currency:       { type: String, required: true },
    timezone:       { type: String, required: true },
    bestMonths:     [Number],
    visaTip:        { type: String, default: "" },
    weatherSummary: { type: String, default: "" },
    tags:           [String],
    popular:        { type: Boolean, default: false },
  },
  { timestamps: true }
);

DestinationSchema.index({ city: "text", country: "text", tags: "text" });
DestinationSchema.index({ popular: -1, city: 1 });

export const Destination = models.Destination ?? model<DestinationDoc>("Destination", DestinationSchema);
