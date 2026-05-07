import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

export const Plans = ["FREE", "PRO", "TEAM"] as const;
export type Plan = (typeof Plans)[number];

const SubscriptionSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  stripeCustomerId: { type: String, required: true, unique: true },
  stripeSubId: { type: String, unique: true, sparse: true },
  plan: { type: String, enum: Plans, default: "FREE" },
  currentPeriodEnd: { type: Date },
  cancelAtPeriodEnd: { type: Boolean, default: false },
});

export type SubscriptionDoc = InferSchemaType<typeof SubscriptionSchema>;
export const Subscription = ((models.Subscription ?? model("Subscription", SubscriptionSchema)) as unknown) as Model<SubscriptionDoc>;
