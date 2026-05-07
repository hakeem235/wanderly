import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const UserSchema = new Schema(
  {
    // Auth.js fields
    name: { type: String },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    emailVerified: { type: Date },
    image: { type: String },
    // App fields
    locale: { type: String, default: "en" },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

export type UserDoc = InferSchemaType<typeof UserSchema>;
export const User = ((models.User ?? model("User", UserSchema)) as unknown) as Model<UserDoc>;
