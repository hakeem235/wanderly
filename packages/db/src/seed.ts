import mongoose from "mongoose";
import { User } from "./models/user";
import { Trip } from "./models/trip";
import { Subscription } from "./models/subscription";

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://wanderly:wanderly@localhost:27017/wanderly?authSource=admin";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Seeding database...");

  const user = await User.findOneAndUpdate(
    { email: "ahmed@wanderly.local" },
    { $setOnInsert: { name: "Ahmed", email: "ahmed@wanderly.local", locale: "en" } },
    { upsert: true, new: true }
  );
  console.log(`Upserted user: ${user.email}`);

  await Subscription.findOneAndUpdate(
    { userId: user._id },
    { $setOnInsert: { userId: user._id, stripeCustomerId: "cus_dev_ahmed", plan: "PRO" } },
    { upsert: true, new: true }
  );

  await Trip.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId("000000000000000000000001") },
    {
      $setOnInsert: {
        _id: new mongoose.Types.ObjectId("000000000000000000000001"),
        ownerId: user._id,
        title: "Tokyo Aug 2026",
        destination: "Tokyo, JP",
        startDate: new Date("2026-08-10"),
        endDate: new Date("2026-08-20"),
        status: "PLANNING",
        budgetCents: 500000,
        currency: "USD",
      },
    },
    { upsert: true, new: true }
  );

  console.log("Seed complete.");
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
