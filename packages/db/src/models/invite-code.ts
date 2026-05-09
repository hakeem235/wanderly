import { Schema, model, models } from "mongoose";

export interface InviteCodeDoc {
  _id: string;
  code: string;
  usedBy?: string;       // Clerk userId
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InviteCodeSchema = new Schema<InviteCodeDoc>(
  {
    code:    { type: String, required: true, unique: true, uppercase: true, trim: true },
    usedBy:  { type: String, default: null },
    usedAt:  { type: Date,   default: null },
  },
  { timestamps: true }
);

export const InviteCode = models.InviteCode ?? model<InviteCodeDoc>("InviteCode", InviteCodeSchema);
