/**
 * Seed 200 beta invite codes.
 * Run: pnpm --filter @wanderly/db seed:invites
 *
 * Format: WNDLY-XXXX-XXXX  (e.g. WNDLY-A3F2-K9P1)
 */
import mongoose from "mongoose";
import { InviteCode } from "./models/invite-code";
import { randomBytes } from "crypto";

const MONGODB_URI =
  process.env.MONGODB_URI ??
  "mongodb://wanderly:wanderly@127.0.0.1:27017/wanderly?authSource=admin";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/I/1 to avoid confusion
  const seg = (len: number) =>
    Array.from({ length: len }, () => chars[randomBytes(1)[0]! % chars.length]).join("");
  return `WNDLY-${seg(4)}-${seg(4)}`;
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Seeding 200 invite codes…");

  const existing = await InviteCode.countDocuments();
  if (existing >= 200) {
    console.log(`Already have ${existing} codes — skipping.`);
    process.exit(0);
  }

  const toCreate = 200 - existing;
  const codes: string[] = [];

  while (codes.length < toCreate) {
    const code = generateCode();
    codes.push(code);
  }

  await InviteCode.insertMany(codes.map((code) => ({ code })), { ordered: false });
  console.log(`Created ${toCreate} invite codes.`);

  // Print first 5 for testing
  const sample = await InviteCode.find({ usedBy: null }).limit(5).select("code").lean();
  console.log("Sample codes:", sample.map((c) => c.code).join(", "));

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
