import Link from "next/link";

export type TripCardData = {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: string;
  currency: string;
  budgetCents?: number;
};

const STATUS_LABELS: Record<string, string> = {
  PLANNING:  "Planning",
  BOOKED:    "Booked",
  ONGOING:   "Ongoing",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

// Deterministic hero gradient per trip — cycles through brand palettes
const HEROES = [
  "from-teal to-teal-deep",
  "from-[#3D2B1F] to-[#1a120d]",
  "from-[#1F3D2B] to-[#0d1a12]",
  "from-[#3D2B1F] to-teal-deep",
  "from-teal-deep to-[#2A1F3D]",
];

function heroClass(id: string) {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return HEROES[n % HEROES.length];
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(s)} – ${fmt(e)}, ${e.getFullYear()}`;
}

export function TripCard({ trip }: { trip: TripCardData }) {
  return (
    <Link
      href={`/trips/${trip.id}`}
      className="group block rounded-2xl overflow-hidden border border-line bg-paper shadow-card hover:shadow-card-hover transition-shadow"
    >
      {/* Hero */}
      <div className={`relative h-36 bg-gradient-to-br ${heroClass(trip.id)} overflow-hidden`}>
        {/* Topo pattern overlay */}
        <svg
          className="absolute inset-0 w-full h-full opacity-10"
          viewBox="0 0 400 150"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <path d="M0,75 Q50,30 100,75 T200,75 T300,75 T400,75" fill="none" stroke="white" strokeWidth="1.5"/>
          <path d="M0,95 Q60,50 120,95 T240,95 T360,95 T480,95" fill="none" stroke="white" strokeWidth="1.5"/>
          <path d="M0,55 Q40,20 80,55 T160,55 T240,55 T320,55 T400,55" fill="none" stroke="white" strokeWidth="1"/>
          <path d="M0,115 Q70,80 140,115 T280,115 T420,115" fill="none" stroke="white" strokeWidth="1"/>
          <path d="M-20,40 Q30,10 80,40 T180,40 T280,40 T380,40" fill="none" stroke="white" strokeWidth="0.75"/>
          <circle cx="200" cy="75" r="40" fill="none" stroke="white" strokeWidth="1" opacity="0.4"/>
          <circle cx="200" cy="75" r="60" fill="none" stroke="white" strokeWidth="0.75" opacity="0.3"/>
          <circle cx="200" cy="75" r="80" fill="none" stroke="white" strokeWidth="0.5" opacity="0.2"/>
        </svg>

        {/* Status badge */}
        <span className="absolute top-3 right-3 font-mono text-[10px] uppercase tracking-badge text-paper/80 bg-black/20 rounded px-2 py-0.5 backdrop-blur-sm">
          {STATUS_LABELS[trip.status] ?? trip.status}
        </span>

        {/* Destination */}
        <div className="absolute bottom-3 left-4">
          <p className="font-mono text-xs uppercase tracking-badge text-paper/60">
            Destination
          </p>
          <p className="font-display text-lg text-paper leading-tight">
            {trip.destination}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="font-display text-display-xs text-ink group-hover:text-terracotta transition-colors leading-snug">
          {trip.title}
        </h3>
        <p className="mt-1 text-xs text-ink-mute font-body">
          {formatDateRange(trip.startDate, trip.endDate)}
        </p>
        {trip.budgetCents && (
          <p className="mt-2 font-mono text-xs text-ink-mute">
            Budget:{" "}
            <span className="text-ink">
              {trip.currency}{" "}
              {(trip.budgetCents / 100).toLocaleString()}
            </span>
          </p>
        )}
      </div>
    </Link>
  );
}
