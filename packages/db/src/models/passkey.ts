import { Schema, model, models, Types, type InferSchemaType, type Model } from "mongoose";

const PasskeySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    credentialId: { type: Buffer, required: true, unique: true },
    publicKey: { type: Buffer, required: true },
    counter: { type: Number, required: true }, // BigInt stored as Number (safe up to 2^53)
    deviceType: { type: String, required: true },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

export type PasskeyDoc = InferSchemaType<typeof PasskeySchema>;
export const Passkey = ((models.Passkey ?? model("Passkey", PasskeySchema)) as unknown) as Model<PasskeyDoc>;
