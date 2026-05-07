import { Schema, model, models, Types, type InferSchemaType, type Model } from "mongoose";

export const DocTypes = ["PASSPORT", "VISA", "TICKET", "RECEIPT", "OTHER"] as const;
export type DocType = (typeof DocTypes)[number];

const DocumentSchema = new Schema(
  {
    tripId: { type: Schema.Types.ObjectId, ref: "Trip", required: true, index: true },
    type: { type: String, enum: DocTypes, required: true },
    s3Key: { type: String, required: true },
    filename: { type: String, required: true },
    parsed: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

export type DocumentDoc = InferSchemaType<typeof DocumentSchema>;
export const TripDocument = ((models.Document ?? model("Document", DocumentSchema)) as unknown) as Model<DocumentDoc>;
