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

// ── Destinations seed (run separately or as part of main) ────────────────────
export async function seedDestinations() {
  const { Destination } = await import("./models/destination");

  const destinations = [
    {
      city: "Tokyo", country: "Japan", iata: "NRT", region: "East Asia",
      photoUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
      currency: "JPY", timezone: "Asia/Tokyo", bestMonths: [3, 4, 10, 11],
      visaTip: "Visa on arrival not available. Apply for a Japan tourist visa (15 days free for KSA residents via some travel agents).",
      weatherSummary: "Spring (Mar–May) and autumn (Oct–Nov) are ideal — mild and clear. Avoid July–August (humid) and January (cold).",
      tags: ["culture", "food", "shopping", "nature", "anime"], popular: true,
    },
    {
      city: "Dubai", country: "UAE", iata: "DXB", region: "Middle East",
      photoUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
      currency: "AED", timezone: "Asia/Dubai", bestMonths: [10, 11, 12, 1, 2, 3],
      visaTip: "GCC residents and KSA nationals can enter visa-free. 30-day visa on arrival for most nationalities.",
      weatherSummary: "Oct–Apr is pleasant (18–30°C). May–Sep is extremely hot (40°C+). Indoor attractions remain popular year-round.",
      tags: ["luxury", "shopping", "beach", "food", "nightlife"], popular: true,
    },
    {
      city: "Bangkok", country: "Thailand", iata: "BKK", region: "Southeast Asia",
      photoUrl: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80",
      currency: "THB", timezone: "Asia/Bangkok", bestMonths: [11, 12, 1, 2, 3],
      visaTip: "KSA passport holders get 30-day visa exemption. Online e-visa also available.",
      weatherSummary: "Nov–Feb is cool and dry — the sweet spot. Mar–May is hot. Jun–Oct is rainy season.",
      tags: ["food", "temples", "nightlife", "shopping", "culture"], popular: true,
    },
    {
      city: "London", country: "United Kingdom", iata: "LHR", region: "Europe",
      photoUrl: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80",
      currency: "GBP", timezone: "Europe/London", bestMonths: [5, 6, 7, 8, 9],
      visaTip: "UK Standard Visitor Visa required for KSA passport holders. Apply 3+ weeks in advance.",
      weatherSummary: "Summer (Jun–Aug) is mild (15–25°C). Winter is cold and grey. Spring and autumn are changeable.",
      tags: ["culture", "museums", "food", "history", "theatre"], popular: true,
    },
    {
      city: "Paris", country: "France", iata: "CDG", region: "Europe",
      photoUrl: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80",
      currency: "EUR", timezone: "Europe/Paris", bestMonths: [4, 5, 6, 9, 10],
      visaTip: "Schengen visa required for KSA passport holders. Single-entry 90-day visa — apply at French consulate.",
      weatherSummary: "Spring (Apr–Jun) and early autumn (Sep–Oct) are perfect. July–Aug is warm but touristy. Dec–Feb is cold.",
      tags: ["romance", "food", "art", "fashion", "culture"], popular: true,
    },
    {
      city: "Istanbul", country: "Turkey", iata: "IST", region: "Europe / Middle East",
      photoUrl: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80",
      currency: "TRY", timezone: "Europe/Istanbul", bestMonths: [4, 5, 6, 9, 10],
      visaTip: "KSA nationals get e-visa online (easy, ~$50). Valid for 30 days.",
      weatherSummary: "Apr–Jun and Sep–Oct are ideal (18–24°C). Jul–Aug is hot. Dec–Feb is cold with occasional snow.",
      tags: ["history", "food", "culture", "shopping", "architecture"], popular: true,
    },
    {
      city: "Bali", country: "Indonesia", iata: "DPS", region: "Southeast Asia",
      photoUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
      currency: "IDR", timezone: "Asia/Makassar", bestMonths: [4, 5, 6, 7, 8, 9],
      visaTip: "Visa on arrival (30 days, $35) available for KSA passport holders at Ngurah Rai airport.",
      weatherSummary: "Dry season (Apr–Oct) is best. Nov–Mar is rainy. Year-round warm (27–32°C).",
      tags: ["beach", "nature", "temples", "wellness", "surfing"], popular: true,
    },
    {
      city: "New York", country: "United States", iata: "JFK", region: "North America",
      photoUrl: "https://images.unsplash.com/photo-1546436836-07a91091f160?w=800&q=80",
      currency: "USD", timezone: "America/New_York", bestMonths: [4, 5, 6, 9, 10],
      visaTip: "US B-2 tourist visa required for KSA nationals. Apply well in advance (interview at US Embassy).",
      weatherSummary: "Spring and fall are gorgeous. Summer is hot and humid. Winter can be very cold with snow.",
      tags: ["culture", "food", "shopping", "nightlife", "art"], popular: true,
    },
    {
      city: "Cairo", country: "Egypt", iata: "CAI", region: "North Africa",
      photoUrl: "https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=800&q=80",
      currency: "EGP", timezone: "Africa/Cairo", bestMonths: [10, 11, 12, 1, 2, 3],
      visaTip: "KSA nationals enter visa-free. Most nationalities can get e-visa online.",
      weatherSummary: "Oct–Apr is pleasant (15–25°C). May–Sep is extremely hot (35–40°C). Desert can be cold at night.",
      tags: ["history", "pyramids", "culture", "food", "adventure"], popular: true,
    },
    {
      city: "Singapore", country: "Singapore", iata: "SIN", region: "Southeast Asia",
      photoUrl: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80",
      currency: "SGD", timezone: "Asia/Singapore", bestMonths: [1, 2, 6, 7],
      visaTip: "KSA nationals get 30-day visa on arrival. Easy and efficient entry.",
      weatherSummary: "Year-round tropical (25–32°C) with high humidity. Less rain Feb–Apr and Jun–Aug.",
      tags: ["food", "luxury", "shopping", "culture", "family"], popular: true,
    },
    {
      city: "Amsterdam", country: "Netherlands", iata: "AMS", region: "Europe",
      photoUrl: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&q=80",
      currency: "EUR", timezone: "Europe/Amsterdam", bestMonths: [4, 5, 6, 7, 8, 9],
      visaTip: "Schengen visa required for KSA nationals. Apply at Dutch embassy or consulate.",
      weatherSummary: "Apr–May (tulip season) and Jun–Aug (mild, long days) are best. Oct–Mar is cold and wet.",
      tags: ["culture", "museums", "history", "cycling", "food"], popular: false,
    },
    {
      city: "Rome", country: "Italy", iata: "FCO", region: "Europe",
      photoUrl: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80",
      currency: "EUR", timezone: "Europe/Rome", bestMonths: [4, 5, 6, 9, 10],
      visaTip: "Schengen visa required for KSA nationals.",
      weatherSummary: "Apr–Jun and Sep–Oct are ideal (18–26°C). Jul–Aug is hot and crowded. Dec–Feb is cold.",
      tags: ["history", "food", "art", "architecture", "romance"], popular: true,
    },
    {
      city: "Maldives", country: "Maldives", iata: "MLE", region: "South Asia",
      photoUrl: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&q=80",
      currency: "USD", timezone: "Indian/Maldives", bestMonths: [11, 12, 1, 2, 3, 4],
      visaTip: "30-day free visa on arrival for all nationalities. KSA nationals welcome.",
      weatherSummary: "Nov–Apr is dry and sunny — peak season. May–Oct is wetter with choppier seas.",
      tags: ["beach", "luxury", "diving", "honeymoon", "nature"], popular: true,
    },
    {
      city: "Barcelona", country: "Spain", iata: "BCN", region: "Europe",
      photoUrl: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80",
      currency: "EUR", timezone: "Europe/Madrid", bestMonths: [4, 5, 6, 9, 10],
      visaTip: "Schengen visa required for KSA nationals.",
      weatherSummary: "May–Jun and Sep–Oct are ideal. Jul–Aug is hot and very busy. Winter is mild by European standards.",
      tags: ["architecture", "food", "beach", "nightlife", "art"], popular: false,
    },
    {
      city: "Kyoto", country: "Japan", iata: "KIX", region: "East Asia",
      photoUrl: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80",
      currency: "JPY", timezone: "Asia/Tokyo", bestMonths: [3, 4, 10, 11],
      visaTip: "Same visa rules as Tokyo — apply for Japan tourist visa.",
      weatherSummary: "Cherry blossom (late Mar–Apr) and autumn foliage (Oct–Nov) are magical. Summer is hot and humid.",
      tags: ["temples", "culture", "nature", "food", "traditional"], popular: true,
    },
    {
      city: "Marrakech", country: "Morocco", iata: "RAK", region: "North Africa",
      photoUrl: "https://images.unsplash.com/photo-1597211684565-dca64d72bdfe?w=800&q=80",
      currency: "MAD", timezone: "Africa/Casablanca", bestMonths: [3, 4, 5, 9, 10, 11],
      visaTip: "KSA nationals can enter Morocco visa-free (90 days).",
      weatherSummary: "Mar–May and Sep–Nov are best (20–28°C). Jun–Aug is very hot (38°C+). Dec–Feb is cool but sunny.",
      tags: ["culture", "souks", "food", "history", "adventure"], popular: false,
    },
    {
      city: "Lisbon", country: "Portugal", iata: "LIS", region: "Europe",
      photoUrl: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800&q=80",
      currency: "EUR", timezone: "Europe/Lisbon", bestMonths: [4, 5, 6, 9, 10],
      visaTip: "Schengen visa required for KSA nationals.",
      weatherSummary: "Spring and autumn are lovely. Summer is warm (25–30°C) and less crowded than other EU capitals.",
      tags: ["culture", "food", "history", "beaches", "fado"], popular: false,
    },
    {
      city: "Phuket", country: "Thailand", iata: "HKT", region: "Southeast Asia",
      photoUrl: "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800&q=80",
      currency: "THB", timezone: "Asia/Bangkok", bestMonths: [11, 12, 1, 2, 3, 4],
      visaTip: "Same 30-day exemption as Bangkok for KSA nationals.",
      weatherSummary: "Nov–Apr is dry and sunny — perfect beach weather. May–Oct is wet season on the west coast.",
      tags: ["beach", "diving", "nightlife", "food", "islands"], popular: false,
    },
    {
      city: "Riyadh", country: "Saudi Arabia", iata: "RUH", region: "Middle East",
      photoUrl: "https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=800&q=80",
      currency: "SAR", timezone: "Asia/Riyadh", bestMonths: [10, 11, 12, 1, 2, 3],
      visaTip: "Saudi nationals — no visa needed. Tourist e-visa available for most nationalities.",
      weatherSummary: "Oct–Mar is pleasant (15–25°C). Apr–Sep is extremely hot (40°C+). Dry desert climate year-round.",
      tags: ["culture", "history", "food", "modern", "festivals"], popular: true,
    },
    {
      city: "Jeddah", country: "Saudi Arabia", iata: "JED", region: "Middle East",
      photoUrl: "https://images.unsplash.com/photo-1608599400855-19de531d65e6?w=800&q=80",
      currency: "SAR", timezone: "Asia/Riyadh", bestMonths: [10, 11, 12, 1, 2, 3],
      visaTip: "Saudi nationals — no visa needed. Gateway city for Umrah/Hajj pilgrims.",
      weatherSummary: "Oct–Mar is pleasant. Red Sea coastline adds humidity. Summer is very hot and humid.",
      tags: ["history", "food", "diving", "culture", "corniche"], popular: true,
    },
  ];

  let upserted = 0;
  for (const dest of destinations) {
    await Destination.findOneAndUpdate(
      { iata: dest.iata },
      { $set: dest },
      { upsert: true, new: true }
    );
    upserted++;
  }
  console.log(`Seeded ${upserted} destinations`);
}
