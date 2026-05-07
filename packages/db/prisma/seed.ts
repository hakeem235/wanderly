import { PrismaClient, TripStatus, Plan } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Dev user
  const user = await prisma.user.upsert({
    where: { email: "ahmed@wanderly.local" },
    update: {},
    create: {
      email: "ahmed@wanderly.local",
      name: "Ahmed",
      locale: "en",
      subscription: {
        create: {
          stripeCustomerId: "cus_dev_ahmed",
          plan: Plan.PRO,
        },
      },
    },
  });

  console.log(`Upserted user: ${user.email}`);

  // Sample trip
  const trip = await prisma.trip.upsert({
    where: { id: "clseed-tokyo-trip-001" },
    update: {},
    create: {
      id: "clseed-tokyo-trip-001",
      ownerId: user.id,
      title: "Tokyo Aug 2026",
      destination: "Tokyo, JP",
      startDate: new Date("2026-08-10"),
      endDate: new Date("2026-08-20"),
      status: TripStatus.PLANNING,
      budgetCents: 500000,
      currency: "USD",
    },
  });

  console.log(`Upserted trip: ${trip.title}`);
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
